import { NextRequest, NextResponse } from 'next/server'

import { REGIONS, findRegion } from '@/lib/market/geo'
import { DATASET, allReferences, referencesForRegion } from '@/lib/market/reference'

export const runtime = 'nodejs'

/**
 * GET /api/market
 * GET /api/market?region=<slug>
 *
 * Serves the geography and the price references behind it. The client needs
 * this to build its location pickers, and exposing it as a first-class endpoint
 * also means the market data can be inspected independently of any valuation —
 * a user can check what the model believes about their district before trusting
 * what it says about their flat.
 */
export async function GET(request: NextRequest) {
  const regionSlug = request.nextUrl.searchParams.get('region')

  if (regionSlug) {
    const region = findRegion(regionSlug)
    if (!region) {
      return NextResponse.json({ error: 'unknown_region' }, { status: 404 })
    }
    return NextResponse.json({
      dataset: DATASET,
      region: { slug: region.slug, name: region.name, isCapital: region.isCapital },
      districts: region.districts,
      references: referencesForRegion(region.slug),
    })
  }

  return NextResponse.json(
    {
      dataset: DATASET,
      regions: REGIONS.map((r) => ({
        slug: r.slug,
        name: r.name,
        isCapital: r.isCapital,
        districts: r.districts,
      })),
      references: allReferences(),
    },
    // The dataset changes on a release cadence, not per request, so it is worth
    // caching hard at the edge.
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  )
}
