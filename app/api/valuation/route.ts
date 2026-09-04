import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { checkRateLimit, clientKeyFrom } from '@/lib/rate-limit'
import { valuationRequestSchema } from '@/lib/schema'
import { UnknownLocationError, valuate } from '@/lib/valuation'

export const runtime = 'nodejs'

/**
 * POST /api/valuation
 *
 * Returns a full valuation report for one property. The response is a pure
 * function of the request body, so it is safe to cache, safe to share, and
 * reproducible when a user disputes a number.
 */
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(clientKeyFrom(request.headers))
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: limit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  try {
    const { property, mortgage } = valuationRequestSchema.parse(body)
    const report = valuate(property, { mortgage })
    return NextResponse.json(report, {
      headers: { 'X-RateLimit-Remaining': String(limit.remaining) },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      // Field-level errors so the client can mark the offending input rather
      // than showing one opaque "something went wrong" banner.
      return NextResponse.json(
        {
          error: 'validation_failed',
          issues: error.issues.map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message })),
        },
        { status: 400 }
      )
    }
    if (error instanceof UnknownLocationError) {
      return NextResponse.json({ error: 'unknown_location' }, { status: 422 })
    }
    console.error('[valuation] unexpected failure', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
