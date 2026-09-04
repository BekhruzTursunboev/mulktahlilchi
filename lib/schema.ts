/**
 * Request validation.
 *
 * The old route checked its inputs with a single chained truthiness test, which
 * both rejected legitimate values (`floor: 0` for a basement, `rooms: 0` for a
 * studio) and accepted nonsense (a flat on floor 40 of a 3-storey building, a
 * year built in the future). Parsing is now total: anything that survives is
 * structurally valid, so the engine never has to defend itself.
 */

import { z } from 'zod'

const CURRENT_YEAR = new Date().getFullYear()

export const propertyInputSchema = z
  .object({
    deal: z.enum(['sale', 'rent']),
    regionSlug: z.string().min(1).max(64),
    districtSlug: z.string().min(1).max(64),
    price: z.number().finite().positive().max(50_000_000),
    size: z.number().finite().positive().max(2_000),
    rooms: z.number().int().min(0).max(30),
    floor: z.number().int().min(0).max(120),
    totalFloors: z.number().int().min(1).max(120),
    propertyKind: z.enum(['apartment', 'house', 'studio', 'commercial']),
    condition: z.enum(['new', 'renovated', 'good', 'needs_renovation', 'shell']),
    buildingMaterial: z.enum(['panel', 'brick', 'monolith', 'unknown']).optional(),
    yearBuilt: z.number().int().min(1900).max(CURRENT_YEAR + 3).optional(),
    hasElevator: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    hasBalcony: z.boolean().optional(),
    isFurnished: z.boolean().optional(),
    metroMinutes: z.number().int().min(0).max(120).optional(),
    notes: z.string().max(2_000).optional(),
  })
  .refine((v) => v.floor <= v.totalFloors, {
    message: 'floor_exceeds_total_floors',
    path: ['floor'],
  })
  // A price per m² this far outside any Uzbek market is almost always a unit
  // error — UZS entered into a USD field, or total rent entered as monthly.
  .refine((v) => (v.deal === 'sale' ? v.price / v.size < 20_000 : v.price / v.size < 200), {
    message: 'price_out_of_range_for_deal_type',
    path: ['price'],
  })

export const mortgageTermsSchema = z.object({
  downPaymentPct: z.number().min(0).max(90).optional(),
  annualRatePct: z.number().min(0).max(100).optional(),
  termYears: z.number().int().min(1).max(40).optional(),
})

export const valuationRequestSchema = z.object({
  property: propertyInputSchema,
  mortgage: mortgageTermsSchema.optional(),
})

export type ValuationRequest = z.infer<typeof valuationRequestSchema>
