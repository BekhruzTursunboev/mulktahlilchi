/**
 * Negotiation guidance.
 *
 * This is the part of the report a user actually acts on. A verdict of
 * "overpriced" is only half an answer; what a buyer needs is a number to say out
 * loud, and a number at which to walk away.
 *
 * Uzbekistan has no MLS and no public register of transaction prices, so asking
 * prices are systematically above clearing prices and haggling is expected
 * rather than exceptional. Guidance is therefore built from two observables:
 * how far the asking price sits from fair value, and how long comparable stock
 * sits on the market before it clears.
 */

import type { MarketReference } from '../market/reference'
import type { Estimate, NegotiationGuidance, PriceAssessment } from './types'

/** Baseline asking-to-close discount in a market that clears at a normal pace. */
const BASE_DISCOUNT_PCT = 3
/** Extra discount earned per day of median time-on-market beyond the baseline. */
const DISCOUNT_PER_DAY_OVER = 0.05
const BASELINE_DAYS_ON_MARKET = 50
const MAX_DISCOUNT_PCT = 10

function round(value: number, dp = 0): number {
  const f = Math.pow(10, dp)
  return Math.round(value * f) / f
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Typical discount from asking price to closing price for this market.
 *
 * Slow-moving stock gives buyers leverage: a seller whose flat has been listed
 * for four months has already learned something about their price.
 */
function typicalDiscount(ref: MarketReference): number {
  const overBaseline = ref.medianDaysOnMarket - BASELINE_DAYS_ON_MARKET
  return clamp(BASE_DISCOUNT_PCT + overBaseline * DISCOUNT_PER_DAY_OVER, BASE_DISCOUNT_PCT, MAX_DISCOUNT_PCT)
}

function leverageFrom(assessment: PriceAssessment, ref: MarketReference): NegotiationGuidance['leverage'] {
  const slowMarket = ref.medianDaysOnMarket > 85
  if (assessment.verdict === 'overpriced') return 'buyer'
  if (assessment.verdict === 'underpriced') return 'seller'
  // A fair price in a slow market still favours the buyer: the seller has fewer
  // alternatives than the buyer does.
  return slowMarket ? 'buyer' : 'balanced'
}

export function buildNegotiation(
  askingPrice: number,
  estimate: Estimate,
  assessment: PriceAssessment,
  ref: MarketReference
): NegotiationGuidance {
  const discountPct = typicalDiscount(ref)

  // Never target above fair value. If the asking price is already below the
  // estimate, the sensible target is the asking price itself — pushing further
  // on an underpriced listing mostly loses the deal to a faster buyer.
  const anchor = Math.min(askingPrice, estimate.fairPrice)
  const targetPrice = anchor * (1 - discountPct / 200)
  const openingOffer = targetPrice * (1 - discountPct / 100)

  return {
    openingOffer: round(openingOffer, -1),
    targetPrice: round(targetPrice, -1),
    // Above the top of the estimated range there is no defensible case for the
    // price, so this is the point at which walking away beats negotiating.
    walkAwayPrice: round(estimate.high, -1),
    typicalDiscountPct: round(discountPct, 1),
    leverage: leverageFrom(assessment, ref),
    medianDaysOnMarket: ref.medianDaysOnMarket,
  }
}
