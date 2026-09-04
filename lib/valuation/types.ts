import type { LocalizedName } from '../market/geo'
import type { Confidence, DataBasis } from '../market/reference'

export type Deal = 'sale' | 'rent'
export type PropertyKind = 'apartment' | 'house' | 'studio' | 'commercial'
export type BuildingMaterial = 'panel' | 'brick' | 'monolith' | 'unknown'

/**
 * Interior condition, using the vocabulary Uzbek listings actually use.
 *
 * `shell` ("qora suvoq" / "коробка") is a real and very common state for new
 * builds sold before fit-out, and it carries a large discount. The old model had
 * no way to express it, so shell flats were valued as if they were livable and
 * came back labelled "underpriced" — the single most expensive kind of error
 * this product can make.
 */
export type Condition = 'new' | 'renovated' | 'good' | 'needs_renovation' | 'shell'

export interface PropertyInput {
  deal: Deal
  regionSlug: string
  districtSlug: string
  /** Asking price in USD. Monthly for rent, total for sale. */
  price: number
  /** Usable area in m². */
  size: number
  rooms: number
  floor: number
  totalFloors: number
  propertyKind: PropertyKind
  condition: Condition
  buildingMaterial?: BuildingMaterial
  yearBuilt?: number
  hasElevator?: boolean
  hasParking?: boolean
  hasBalcony?: boolean
  isFurnished?: boolean
  /** Walking minutes to metro. Overrides the district default when supplied. */
  metroMinutes?: number
  notes?: string
}

/**
 * One multiplicative term in the hedonic model.
 *
 * Keeping adjustments as data rather than as inline arithmetic is what makes the
 * valuation auditable: the API can hand the user the exact list of reasons its
 * estimate differs from the district median, and a reviewer can check any single
 * coefficient without reading the whole engine.
 */
export interface Adjustment {
  key: string
  /** Multiplier applied to the district median. 1.0 means no effect. */
  multiplier: number
  /** Why this adjustment exists, in market terms rather than model terms. */
  rationale: { uz: string; ru: string; en: string }
}

export type Verdict = 'underpriced' | 'fair' | 'overpriced'
export type VerdictStrength = 'slight' | 'clear' | 'strong'

export interface Estimate {
  /** Point estimate of fair market asking price, USD. */
  fairPrice: number
  /** Lower and upper bounds of the plausible range, USD. */
  low: number
  high: number
  fairPricePerSqm: number
  /** District median price per m², before any property-specific adjustment. */
  districtMedianPerSqm: number
  adjustments: Adjustment[]
  confidence: Confidence
  /** Half-width of the interval as a fraction of the point estimate. */
  relativeMargin: number
}

export interface PriceAssessment {
  verdict: Verdict
  strength: VerdictStrength
  /** (asking - fair) / fair. Positive means the asking price is above estimate. */
  residual: number
  /** Difference between asking price and the point estimate, USD. */
  deltaUsd: number
  /**
   * Where the asking price sits inside the estimated range, 0 to 1. Values
   * outside [0, 1] mean the asking price is outside the range entirely.
   */
  positionInRange: number
}

export interface QualityScore {
  /** 0-100. Describes the asset, deliberately independent of its price. */
  total: number
  components: { key: string; score: number; weight: number }[]
}

export interface InvestmentMetrics {
  /** Estimated achievable monthly rent, USD. */
  estimatedMonthlyRent: number
  grossYieldPct: number
  netYieldPct: number
  /** Years for net rent to repay the purchase price, ignoring appreciation. */
  paybackYears: number
  priceToRentRatio: number
  /** Annual expenses assumed as a fraction of gross rent. */
  assumedCostRatio: number
}

export interface MortgageScenario {
  downPaymentPct: number
  annualRatePct: number
  termYears: number
  loanAmount: number
  monthlyPayment: number
  totalInterest: number
  /** Gross monthly income needed to keep payment at or below 40% of income. */
  requiredMonthlyIncome: number
}

export interface NegotiationGuidance {
  /** Price a well-prepared buyer should open at, USD. */
  openingOffer: number
  /** Realistic settlement price given market liquidity, USD. */
  targetPrice: number
  /** Above this, walking away beats negotiating, USD. */
  walkAwayPrice: number
  /** Typical discount from asking to close in this market, percent. */
  typicalDiscountPct: number
  leverage: 'buyer' | 'balanced' | 'seller'
  medianDaysOnMarket: number
}

export interface MarketContext {
  /**
   * Localised names rather than pre-rendered strings. The engine must not pick a
   * language on the user's behalf: it has no idea which one they are reading in,
   * and the report header showed Uzbek district names to Russian readers for
   * exactly that reason.
   */
  regionName: LocalizedName
  districtName: LocalizedName
  yoyChangePct: number
  medianDaysOnMarket: number
  sampleSize: number
  basis: DataBasis
  asOf: string
  datasetVersion: string
}

export interface ValuationReport {
  input: PropertyInput
  estimate: Estimate
  assessment: PriceAssessment
  quality: QualityScore
  investment: InvestmentMetrics | null
  mortgage: MortgageScenario | null
  negotiation: NegotiationGuidance
  market: MarketContext
  /** Machine-readable caveats the UI must display. Never silently dropped. */
  caveats: string[]
}
