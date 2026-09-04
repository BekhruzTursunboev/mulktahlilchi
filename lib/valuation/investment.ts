/**
 * Investment and affordability analytics.
 *
 * Every assumption in this module is a named, exported constant rather than a
 * number buried in an expression, because these are the figures a user is most
 * likely to disagree with — and they should be able to see exactly what was
 * assumed on their behalf.
 */

import type { LocationRef } from '../market/geo'
import { getReference } from '../market/reference'
import { buildEstimate } from './model'
import type { InvestmentMetrics, MortgageScenario, PropertyInput } from './types'

/**
 * Share of gross rent consumed by vacancy, maintenance, management and tax.
 *
 * Uzbek residential lets are typically self-managed, so the dominant terms are
 * vacancy between tenants and periodic re-decoration rather than agency fees.
 */
export const ASSUMED_COST_RATIO = 0.25

/**
 * Default mortgage terms, reflecting commercial (non-subsidised) lending in
 * Uzbekistan. Rates here are far above what buyers in dollarised markets expect,
 * and showing the real monthly payment is often the most decision-changing
 * number on the whole report.
 */
export const DEFAULT_MORTGAGE = {
  downPaymentPct: 25,
  annualRatePct: 20,
  termYears: 15,
} as const

/** Share of gross income a lender will let the payment consume. */
export const MAX_PAYMENT_TO_INCOME = 0.4

function round(value: number, dp = 0): number {
  const f = Math.pow(10, dp)
  return Math.round(value * f) / f
}

/**
 * Estimates achievable rent for a property that is being bought, by running the
 * same hedonic model against the rental reference for its district.
 *
 * Using one model for both sides is what makes the yield trustworthy: the rent
 * figure is adjusted for the same condition, floor and metro access as the
 * price, rather than being a district average pretending to describe this unit.
 */
export function estimateMonthlyRent(input: PropertyInput, location: LocationRef): number | null {
  const ref = getReference(input.regionSlug, input.districtSlug)
  if (!ref) return null
  const rentEstimate = buildEstimate({ ...input, deal: 'rent' }, location)
  return rentEstimate.fairPrice
}

export function computeInvestment(input: PropertyInput, location: LocationRef, purchasePrice: number): InvestmentMetrics | null {
  if (input.deal !== 'sale') return null
  const monthlyRent = estimateMonthlyRent(input, location)
  if (!monthlyRent || purchasePrice <= 0) return null

  const annualGross = monthlyRent * 12
  const grossYieldPct = (annualGross / purchasePrice) * 100
  const netYieldPct = grossYieldPct * (1 - ASSUMED_COST_RATIO)

  return {
    estimatedMonthlyRent: round(monthlyRent),
    grossYieldPct: round(grossYieldPct, 2),
    netYieldPct: round(netYieldPct, 2),
    paybackYears: round(100 / netYieldPct, 1),
    priceToRentRatio: round(purchasePrice / annualGross, 1),
    assumedCostRatio: ASSUMED_COST_RATIO,
  }
}

export function computeMortgage(
  purchasePrice: number,
  terms: { downPaymentPct?: number; annualRatePct?: number; termYears?: number } = {}
): MortgageScenario | null {
  const downPaymentPct = terms.downPaymentPct ?? DEFAULT_MORTGAGE.downPaymentPct
  const annualRatePct = terms.annualRatePct ?? DEFAULT_MORTGAGE.annualRatePct
  const termYears = terms.termYears ?? DEFAULT_MORTGAGE.termYears

  if (purchasePrice <= 0 || downPaymentPct >= 100) return null

  const loanAmount = purchasePrice * (1 - downPaymentPct / 100)
  const months = termYears * 12
  const monthlyRate = annualRatePct / 100 / 12

  // Standard annuity. The zero-rate branch matters for subsidised state programs
  // that are occasionally offered at nominal 0%.
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))

  // Derived figures are computed from the full-precision payment and only then
  // rounded. Rounding the payment first and multiplying by 180 periods puts the
  // total-interest figure out by tens of dollars, which a user comparing offers
  // would reasonably read as a mistake.
  return {
    downPaymentPct,
    annualRatePct,
    termYears,
    loanAmount: round(loanAmount, 2),
    monthlyPayment: round(monthlyPayment, 2),
    totalInterest: round(monthlyPayment * months - loanAmount),
    requiredMonthlyIncome: round(monthlyPayment / MAX_PAYMENT_TO_INCOME),
  }
}
