/**
 * The valuation model: fair-value estimate, price verdict, and asset quality.
 *
 * These are three separate answers to three separate questions, and keeping them
 * separate is the main correction to the previous engine, which blended price,
 * location and build quality into a single 1-10 number and then labelled that
 * number "Underpriced" or "Overpriced". A blended score cannot answer "is this
 * priced correctly?", because a good property at a bad price and a poor property
 * at a good price land on the same value.
 */

import { getReference, type MarketReference, type PriceBand, type Confidence } from '../market/reference'
import type { LocationRef } from '../market/geo'
import { buildAdjustments, countUnknowns } from './adjustments'
import type { Estimate, PriceAssessment, PropertyInput, QualityScore, VerdictStrength } from './types'

/**
 * Share of within-district price variance the adjustments are assumed to
 * explain when every attribute is known. The remainder stays as interval width.
 *
 * This is a stated assumption, not a fitted value. It is written down here as a
 * single named constant precisely so that it can be replaced by a measured R²
 * once the model is backtested against observed listings.
 */
const EXPLAINED_VARIANCE_FULL_INFO = 0.6
const EXPLAINED_VARIANCE_PER_UNKNOWN = 0.08
const MIN_RELATIVE_MARGIN = 0.1
const MAX_RELATIVE_MARGIN = 0.4

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, dp = 0): number {
  const f = Math.pow(10, dp)
  return Math.round(value * f) / f
}

/**
 * Interval half-width, relative to the point estimate.
 *
 * Three things widen it, all of them genuine sources of doubt:
 *   - a district whose stock is heterogeneous (wide interquartile range),
 *   - a thin sample, so the median itself is uncertain,
 *   - attributes the user left blank, which the adjustments could not price.
 *
 * A thin market must produce a visibly wider answer. Returning a tight range
 * from four data points would be the most damaging thing this model could do.
 */
function relativeMargin(band: PriceBand, ref: MarketReference, unknowns: number): number {
  const halfIqrRelative = (band.p75 - band.p25) / (2 * band.median)
  const explained = clamp(EXPLAINED_VARIANCE_FULL_INFO - EXPLAINED_VARIANCE_PER_UNKNOWN * unknowns, 0.2, 0.65)
  const unexplained = Math.sqrt(1 - explained)
  const sampleAdjustment = 1 + 5 / Math.sqrt(Math.max(1, ref.sampleSize))
  return clamp(halfIqrRelative * unexplained * sampleAdjustment, MIN_RELATIVE_MARGIN, MAX_RELATIVE_MARGIN)
}

function overallConfidence(ref: MarketReference, unknowns: number): Confidence {
  if (ref.confidence === 'low' || unknowns >= 3) return 'low'
  if (ref.confidence === 'medium' || unknowns >= 1) return 'medium'
  return 'high'
}

export class UnknownLocationError extends Error {
  constructor(regionSlug: string, districtSlug: string) {
    super(`No market reference for ${regionSlug}/${districtSlug}`)
    this.name = 'UnknownLocationError'
  }
}

/**
 * Produces a price-blind estimate of fair market value.
 *
 * Nothing in this function reads `input.price`. That is deliberate and load
 * bearing: the estimate must be computable without knowing what the seller is
 * asking, otherwise the asking price anchors its own assessment.
 */
export function buildEstimate(input: PropertyInput, location: LocationRef): Estimate {
  const ref = getReference(input.regionSlug, input.districtSlug)
  if (!ref) throw new UnknownLocationError(input.regionSlug, input.districtSlug)

  const band = input.deal === 'sale' ? ref.sale : ref.rent
  const adjustments = buildAdjustments(input, location.district.metroMinutes)
  const product = adjustments.reduce((acc, a) => acc * a.multiplier, 1)

  const fairPricePerSqm = band.median * product
  const fairPrice = fairPricePerSqm * input.size

  const unknowns = countUnknowns(input)
  const margin = relativeMargin(band, ref, unknowns)

  return {
    fairPrice: round(fairPrice, input.deal === 'rent' ? 0 : -1),
    low: round(fairPrice * (1 - margin), input.deal === 'rent' ? 0 : -1),
    high: round(fairPrice * (1 + margin), input.deal === 'rent' ? 0 : -1),
    fairPricePerSqm: round(fairPricePerSqm, 2),
    districtMedianPerSqm: band.median,
    adjustments,
    confidence: overallConfidence(ref, unknowns),
    relativeMargin: round(margin, 4),
  }
}

/**
 * Compares the asking price against the estimate.
 *
 * The verdict is a function of the residual and nothing else. A price inside the
 * estimated range is `fair` by definition — claiming to detect a bargain inside
 * your own margin of error is false precision.
 */
export function assessPrice(askingPrice: number, estimate: Estimate): PriceAssessment {
  const { fairPrice, low, high } = estimate
  const residual = (askingPrice - fairPrice) / fairPrice
  const positionInRange = (askingPrice - low) / (high - low)
  const halfWidth = fairPrice * estimate.relativeMargin

  if (askingPrice < low) {
    const excess = (low - askingPrice) / halfWidth
    return { verdict: 'underpriced', strength: strengthOutside(excess), residual, deltaUsd: askingPrice - fairPrice, positionInRange }
  }
  if (askingPrice > high) {
    const excess = (askingPrice - high) / halfWidth
    return { verdict: 'overpriced', strength: strengthOutside(excess), residual, deltaUsd: askingPrice - fairPrice, positionInRange }
  }
  return { verdict: 'fair', strength: strengthInside(positionInRange), residual, deltaUsd: askingPrice - fairPrice, positionInRange }
}

function strengthOutside(excessInHalfWidths: number): VerdictStrength {
  if (excessInHalfWidths < 0.4) return 'slight'
  if (excessInHalfWidths < 1.2) return 'clear'
  return 'strong'
}

/** For a fair verdict, "strong" means sitting close to the centre of the range. */
function strengthInside(positionInRange: number): VerdictStrength {
  const distanceFromCentre = Math.abs(positionInRange - 0.5)
  if (distanceFromCentre <= 0.15) return 'strong'
  if (distanceFromCentre <= 0.35) return 'clear'
  return 'slight'
}

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------

interface Component {
  key: string
  score: number
  weight: number
}

/**
 * Describes the asset on a 0-100 scale, independently of what it costs.
 *
 * This is the number the old engine should have been producing all along. It is
 * useful for ranking saved properties and for telling a seller what to fix, and
 * it is explicitly *not* an input to the price verdict.
 */
export function scoreQuality(input: PropertyInput, location: LocationRef): QualityScore {
  const year = new Date().getFullYear()
  const metroMinutes = input.metroMinutes ?? location.district.metroMinutes

  const conditionScore = { new: 100, renovated: 88, good: 62, needs_renovation: 32, shell: 20 }[input.condition]

  const age = input.yearBuilt ? year - input.yearBuilt : null
  const structureScore =
    age === null ? 55 : age <= 5 ? 95 : age <= 15 ? 82 : age <= 30 ? 62 : age <= 50 ? 40 : 25

  const materialScore =
    input.buildingMaterial === 'monolith' ? 92 : input.buildingMaterial === 'brick' ? 80 : input.buildingMaterial === 'panel' ? 50 : 60

  let accessScore = 70
  if (input.floor === 1) accessScore -= 18
  else if (input.floor === input.totalFloors && input.totalFloors > 1) accessScore -= 8
  else accessScore += 8
  if (input.hasElevator === false && input.floor >= 5) accessScore -= 25
  if (input.hasElevator === true) accessScore += 10
  accessScore = clamp(accessScore, 0, 100)

  const metroScore =
    metroMinutes === null || metroMinutes === undefined
      ? 45
      : metroMinutes <= 5
        ? 100
        : metroMinutes <= 8
          ? 88
          : metroMinutes <= 12
            ? 72
            : metroMinutes <= 18
              ? 55
              : 38

  const perRoom = input.rooms > 0 ? input.size / input.rooms : 0
  const layoutScore = perRoom <= 0 ? 50 : perRoom < 12 ? 35 : perRoom < 16 ? 60 : perRoom < 24 ? 82 : perRoom < 34 ? 92 : 78

  const components: Component[] = [
    { key: 'condition', score: conditionScore, weight: 0.25 },
    { key: 'metro', score: metroScore, weight: 0.2 },
    { key: 'structure', score: structureScore, weight: 0.15 },
    { key: 'access', score: accessScore, weight: 0.15 },
    { key: 'layout', score: layoutScore, weight: 0.15 },
    { key: 'material', score: materialScore, weight: 0.1 },
  ]

  const total = components.reduce((acc, c) => acc + c.score * c.weight, 0)
  return { total: Math.round(total), components }
}
