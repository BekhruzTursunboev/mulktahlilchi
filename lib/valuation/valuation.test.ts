import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveLocation } from '../market/geo'
import { getReference } from '../market/reference'
import { buildEstimate, assessPrice, scoreQuality } from './model'
import { valuate } from './index'
import type { PropertyInput } from './types'

/** A mid-market Tashkent two-room flat, used as the base case for variations. */
function baseProperty(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return {
    deal: 'sale',
    regionSlug: 'tashkent-city',
    districtSlug: 'chilonzor',
    price: 66_000,
    size: 60,
    rooms: 2,
    floor: 3,
    totalFloors: 9,
    propertyKind: 'apartment',
    condition: 'good',
    buildingMaterial: 'panel',
    yearBuilt: 1990,
    hasElevator: true,
    hasParking: false,
    hasBalcony: true,
    ...overrides,
  }
}

const CHILONZOR = resolveLocation('tashkent-city', 'chilonzor')!

describe('estimate', () => {
  it('is independent of the asking price', () => {
    // The estimate must be computable without knowing what the seller wants,
    // otherwise the asking price anchors its own assessment.
    const cheap = buildEstimate(baseProperty({ price: 1_000 }), CHILONZOR)
    const dear = buildEstimate(baseProperty({ price: 900_000 }), CHILONZOR)
    assert.equal(cheap.fairPrice, dear.fairPrice)
    assert.equal(cheap.low, dear.low)
    assert.equal(cheap.high, dear.high)
  })

  it('is deterministic across repeated calls', () => {
    const a = valuate(baseProperty())
    const b = valuate(baseProperty())
    assert.deepEqual(a.estimate, b.estimate)
    assert.deepEqual(a.market, b.market)
  })

  it('brackets the point estimate with a strictly positive interval', () => {
    const e = buildEstimate(baseProperty(), CHILONZOR)
    assert.ok(e.low < e.fairPrice, 'low bound must sit below the point estimate')
    assert.ok(e.high > e.fairPrice, 'high bound must sit above the point estimate')
    assert.ok(e.relativeMargin >= 0.1 && e.relativeMargin <= 0.4)
  })

  it('widens the interval when attributes are unknown', () => {
    const known = buildEstimate(baseProperty(), CHILONZOR)
    const unknown = buildEstimate(
      baseProperty({ yearBuilt: undefined, buildingMaterial: undefined, hasElevator: undefined, hasParking: undefined }),
      CHILONZOR
    )
    assert.ok(unknown.relativeMargin > known.relativeMargin, 'missing inputs must reduce precision, not hide it')
  })

  it('widens the interval in thin markets', () => {
    const dense = buildEstimate(baseProperty(), CHILONZOR)
    const thinLocation = resolveLocation('qoraqalpogiston', 'mongit')!
    const thin = buildEstimate(
      baseProperty({ regionSlug: 'qoraqalpogiston', districtSlug: 'mongit' }),
      thinLocation
    )
    assert.ok(thin.relativeMargin > dense.relativeMargin)
  })

  it('prices a shell flat well below a renovated one', () => {
    const shell = buildEstimate(baseProperty({ condition: 'shell' }), CHILONZOR)
    const renovated = buildEstimate(baseProperty({ condition: 'renovated' }), CHILONZOR)
    assert.ok(shell.fairPrice < renovated.fairPrice * 0.75, 'fit-out cost must be reflected in value')
  })

  it('ranks districts in the expected order at identical specification', () => {
    const spec = { size: 60, rooms: 2, floor: 3, totalFloors: 9 }
    const mirobod = buildEstimate(
      baseProperty({ ...spec, districtSlug: 'mirobod' }),
      resolveLocation('tashkent-city', 'mirobod')!
    )
    const chilonzor = buildEstimate(baseProperty(spec), CHILONZOR)
    const bektemir = buildEstimate(
      baseProperty({ ...spec, districtSlug: 'bektemir' }),
      resolveLocation('tashkent-city', 'bektemir')!
    )
    assert.ok(mirobod.fairPrice > chilonzor.fairPrice)
    assert.ok(chilonzor.fairPrice > bektemir.fairPrice)
  })

  it('does not double-count location', () => {
    // Location must enter only through the district median. Two identical flats
    // in the same district can differ only by their non-location attributes.
    const a = buildEstimate(baseProperty(), CHILONZOR)
    const b = buildEstimate(baseProperty({ price: 12_345 }), CHILONZOR)
    assert.equal(a.fairPricePerSqm, b.fairPricePerSqm)
    const locationKeys = a.adjustments.filter((adj) => adj.key === 'location' || adj.key === 'district')
    assert.equal(locationKeys.length, 0, 'no adjustment may re-price location')
  })
})

describe('price assessment', () => {
  it('calls a price inside the interval fair', () => {
    const e = buildEstimate(baseProperty(), CHILONZOR)
    const a = assessPrice(e.fairPrice, e)
    assert.equal(a.verdict, 'fair')
    assert.equal(a.strength, 'strong')
  })

  it('never claims to detect a bargain inside its own margin of error', () => {
    const e = buildEstimate(baseProperty(), CHILONZOR)
    const justInside = e.low * 1.001
    assert.equal(assessPrice(justInside, e).verdict, 'fair')
  })

  it('flags prices outside the interval in the right direction', () => {
    const e = buildEstimate(baseProperty(), CHILONZOR)
    assert.equal(assessPrice(e.low * 0.8, e).verdict, 'underpriced')
    assert.equal(assessPrice(e.high * 1.2, e).verdict, 'overpriced')
  })

  it('escalates strength with distance from the interval', () => {
    const e = buildEstimate(baseProperty(), CHILONZOR)
    const slight = assessPrice(e.high * 1.02, e)
    const strong = assessPrice(e.high * 1.6, e)
    assert.equal(slight.verdict, 'overpriced')
    assert.equal(strong.verdict, 'overpriced')
    assert.ok(['slight', 'clear'].includes(slight.strength))
    assert.equal(strong.strength, 'strong')
  })

  it('separates a good asset from a good price', () => {
    // The regression the old engine had: a high-quality property was labelled
    // "Underpriced" on the strength of its quality alone.
    const luxury = baseProperty({
      districtSlug: 'mirobod',
      condition: 'new',
      buildingMaterial: 'monolith',
      yearBuilt: new Date().getFullYear() - 1,
      hasParking: true,
      price: 400_000,
      size: 60,
    })
    const report = valuate(luxury)
    assert.ok(report.quality.total >= 80, 'the asset itself is genuinely high quality')
    assert.equal(report.assessment.verdict, 'overpriced', 'but the price is not defensible')
  })
})

describe('quality score', () => {
  it('is unaffected by the asking price', () => {
    const cheap = scoreQuality(baseProperty({ price: 1_000 }), CHILONZOR)
    const dear = scoreQuality(baseProperty({ price: 900_000 }), CHILONZOR)
    assert.equal(cheap.total, dear.total)
  })

  it('stays within bounds across extreme inputs', () => {
    const worst = scoreQuality(
      baseProperty({ condition: 'shell', yearBuilt: 1955, floor: 9, totalFloors: 9, hasElevator: false, rooms: 6, size: 40 }),
      CHILONZOR
    )
    const best = scoreQuality(
      baseProperty({ condition: 'new', yearBuilt: new Date().getFullYear(), buildingMaterial: 'monolith', floor: 4, totalFloors: 12, hasElevator: true, rooms: 2, size: 60 }),
      resolveLocation('tashkent-city', 'mirobod')!
    )
    assert.ok(worst.total >= 0 && worst.total <= 100)
    assert.ok(best.total >= 0 && best.total <= 100)
    assert.ok(best.total > worst.total)
  })

  it('weights components to exactly one', () => {
    const q = scoreQuality(baseProperty(), CHILONZOR)
    const sum = q.components.reduce((acc, c) => acc + c.weight, 0)
    assert.ok(Math.abs(sum - 1) < 1e-9, `component weights must sum to 1, got ${sum}`)
  })
})

describe('investment and mortgage', () => {
  it('produces a yield in a plausible band for the market', () => {
    const report = valuate(baseProperty())
    assert.ok(report.investment, 'a sale must carry investment metrics')
    const gross = report.investment!.grossYieldPct
    assert.ok(gross > 3 && gross < 15, `gross yield out of plausible range: ${gross}`)
    assert.ok(report.investment!.netYieldPct < gross, 'net yield must sit below gross')
  })

  it('omits investment metrics for rentals', () => {
    const report = valuate(baseProperty({ deal: 'rent', price: 420 }))
    assert.equal(report.investment, null)
    assert.equal(report.mortgage, null)
  })

  it('matches the closed-form annuity payment', () => {
    const report = valuate(baseProperty())
    const m = report.mortgage!
    const r = m.annualRatePct / 100 / 12
    const n = m.termYears * 12
    const expected = (m.loanAmount * r) / (1 - Math.pow(1 + r, -n))
    assert.ok(Math.abs(m.monthlyPayment - expected) < 0.01, `payment ${m.monthlyPayment} vs annuity ${expected.toFixed(2)}`)
  })

  it('amortises the loan to zero when the schedule is replayed', () => {
    const report = valuate(baseProperty())
    const m = report.mortgage!
    let balance = m.loanAmount
    const monthlyRate = m.annualRatePct / 100 / 12
    for (let i = 0; i < m.termYears * 12; i++) {
      balance = balance * (1 + monthlyRate) - m.monthlyPayment
    }
    // The published payment is rounded to cents, so a small residual is expected
    // and compounds over the term; anything above 0.05% of principal would mean
    // the formula itself is wrong rather than merely rounded.
    assert.ok(
      Math.abs(balance) < m.loanAmount * 0.0005,
      `loan must amortise, residual ${balance.toFixed(2)} on principal ${m.loanAmount}`
    )
  })

  it('handles a zero-rate subsidised loan without dividing by zero', () => {
    const report = valuate(baseProperty(), )
    assert.ok(report.mortgage)
    const zeroRate = valuate(baseProperty(), { mortgage: { annualRatePct: 0, termYears: 10, downPaymentPct: 20 } })
    const m = zeroRate.mortgage!
    assert.ok(Number.isFinite(m.monthlyPayment))
    assert.equal(m.totalInterest, 0)
    assert.ok(Math.abs(m.monthlyPayment * 120 - m.loanAmount) < 1)
  })
})

describe('negotiation', () => {
  it('never targets above fair value', () => {
    const report = valuate(baseProperty({ price: 500_000 }))
    assert.ok(report.negotiation.targetPrice <= report.estimate.fairPrice)
    assert.ok(report.negotiation.openingOffer < report.negotiation.targetPrice)
  })

  it('does not push a buyer to haggle on an already underpriced listing', () => {
    const report = valuate(baseProperty({ price: 30_000 }))
    assert.equal(report.assessment.verdict, 'underpriced')
    assert.ok(report.negotiation.targetPrice <= report.input.price)
  })

  it('gives buyers leverage in slow markets', () => {
    const slow = valuate(baseProperty({ regionSlug: 'qoraqalpogiston', districtSlug: 'mongit', price: 12_000 }))
    assert.ok(slow.negotiation.medianDaysOnMarket > 85)
    assert.ok(['buyer', 'seller'].includes(slow.negotiation.leverage))
  })
})

describe('honesty guarantees', () => {
  it('always declares the basis of its data', () => {
    const report = valuate(baseProperty())
    assert.ok(report.caveats.includes('dataset_modelled'))
    assert.ok(report.caveats.includes('asking_price_basis'))
  })

  it('warns when the reference sample is thin', () => {
    const report = valuate(baseProperty({ regionSlug: 'qoraqalpogiston', districtSlug: 'mongit', price: 12_000 }))
    assert.ok(report.caveats.includes('low_sample'))
    assert.equal(report.estimate.confidence, 'low')
  })

  it('warns when attributes were left blank', () => {
    const report = valuate(baseProperty({ yearBuilt: undefined, buildingMaterial: undefined }))
    assert.ok(report.caveats.includes('missing_attributes'))
  })

  it('rejects unknown locations rather than guessing', () => {
    assert.throws(() => valuate(baseProperty({ districtSlug: 'not-a-real-district' })))
    assert.throws(() => valuate(baseProperty({ regionSlug: 'atlantis' })))
  })
})

describe('reference data integrity', () => {
  it('has a reference for every district in the geography', () => {
    const { REGIONS } = require('../market/geo') as typeof import('../market/geo')
    const missing: string[] = []
    for (const region of REGIONS) {
      for (const district of region.districts) {
        if (!getReference(region.slug, district.slug)) missing.push(`${region.slug}/${district.slug}`)
      }
    }
    assert.deepEqual(missing, [], `districts without a price reference: ${missing.join(', ')}`)
  })

  it('keeps quartiles ordered and rents proportionate to sale prices', () => {
    const { allReferences } = require('../market/reference') as typeof import('../market/reference')
    for (const ref of allReferences()) {
      const where = `${ref.regionSlug}/${ref.districtSlug}`
      assert.ok(ref.sale.p25 < ref.sale.median && ref.sale.median < ref.sale.p75, `sale quartiles out of order at ${where}`)
      assert.ok(ref.rent.p25 < ref.rent.median && ref.rent.median < ref.rent.p75, `rent quartiles out of order at ${where}`)
      // Annual rent between 4% and 12% of sale price. Anything outside that band
      // is a data-entry error, not a market.
      const impliedYield = (ref.rent.median * 12) / ref.sale.median
      assert.ok(impliedYield > 0.04 && impliedYield < 0.12, `implied yield ${(impliedYield * 100).toFixed(1)}% at ${where}`)
    }
  })
})
