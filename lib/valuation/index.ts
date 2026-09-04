/**
 * Public entry point for the valuation engine.
 *
 * `valuate()` is pure: same input, same output, no clock-dependent randomness
 * and no network. That property is what makes the engine testable and what
 * makes a report reproducible when a user shares it — the old engine's
 * `Math.random()` listing counts meant reloading a page changed the "evidence".
 */

import { resolveLocation, type LocationRef } from '../market/geo'
import { DATASET, getReference } from '../market/reference'
import { countUnknowns } from './adjustments'
import { computeInvestment, computeMortgage } from './investment'
import { assessPrice, buildEstimate, scoreQuality, UnknownLocationError } from './model'
import { buildNegotiation } from './negotiation'
import type { PropertyInput, ValuationReport } from './types'

export * from './types'
export { UnknownLocationError } from './model'
export { DEFAULT_MORTGAGE, ASSUMED_COST_RATIO } from './investment'

/** Sizes outside this range fall beyond the stock the references describe. */
const PLAUSIBLE_SIZE_RANGE = { min: 15, max: 400 }

export interface ValuationOptions {
  mortgage?: { downPaymentPct?: number; annualRatePct?: number; termYears?: number }
}

/**
 * Collects the caveats that must travel with the report.
 *
 * These are returned as stable keys rather than prose so the UI can localise
 * them and so they cannot be quietly dropped in translation. A report that
 * cannot show its caveats should not be shown at all.
 */
function collectCaveats(input: PropertyInput, location: LocationRef, unknowns: number): string[] {
  const caveats: string[] = []
  const ref = getReference(input.regionSlug, input.districtSlug)

  if (DATASET.basis === 'calibrated-model') caveats.push('dataset_modelled')
  caveats.push('asking_price_basis')

  if (ref && ref.confidence === 'low') caveats.push('low_sample')
  if (unknowns > 0) caveats.push('missing_attributes')
  if (input.size < PLAUSIBLE_SIZE_RANGE.min || input.size > PLAUSIBLE_SIZE_RANGE.max) caveats.push('unusual_size')
  if (input.propertyKind === 'commercial') caveats.push('commercial_calibration')
  if (input.propertyKind === 'house') caveats.push('house_land_excluded')

  return caveats
}

export function valuate(input: PropertyInput, options: ValuationOptions = {}): ValuationReport {
  const location = resolveLocation(input.regionSlug, input.districtSlug)
  if (!location) throw new UnknownLocationError(input.regionSlug, input.districtSlug)

  const ref = getReference(input.regionSlug, input.districtSlug)
  if (!ref) throw new UnknownLocationError(input.regionSlug, input.districtSlug)

  const estimate = buildEstimate(input, location)
  const assessment = assessPrice(input.price, estimate)
  const quality = scoreQuality(input, location)
  const negotiation = buildNegotiation(input.price, estimate, assessment, ref)

  // Investment maths is anchored on the fair value rather than on the asking
  // price. Quoting a yield against an inflated asking price flatters a bad deal.
  const basisPrice = Math.min(input.price, estimate.fairPrice)
  const investment = computeInvestment(input, location, basisPrice)
  const mortgage = input.deal === 'sale' ? computeMortgage(input.price, options.mortgage) : null

  return {
    input,
    estimate,
    assessment,
    quality,
    investment,
    mortgage,
    negotiation,
    market: {
      regionName: location.region.name,
      districtName: location.district.name,
      yoyChangePct: ref.yoyChangePct,
      medianDaysOnMarket: ref.medianDaysOnMarket,
      sampleSize: ref.sampleSize,
      basis: DATASET.basis,
      asOf: DATASET.asOf,
      datasetVersion: DATASET.version,
    },
    caveats: collectCaveats(input, location, countUnknowns(input)),
  }
}
