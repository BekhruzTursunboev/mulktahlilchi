'use client'

import { useMemo } from 'react'

import { formatUsd } from '@/lib/format'
import type { Locale } from '@/lib/i18n/dictionary'
import type { Verdict } from '@/lib/valuation/types'

/**
 * The price ruler: the estimated range drawn as a band, with the asking price
 * marked against it.
 *
 * This replaces the old 1-10 score dial. A single score cannot show the two
 * things a buyer needs at a glance — how wide the uncertainty is, and which side
 * of it the asking price falls on. Drawing the band makes the model's own doubt
 * part of the answer instead of hiding it behind a decimal point.
 */

interface PriceRulerProps {
  low: number
  high: number
  fair: number
  asking: number
  verdict: Verdict
  locale: Locale
  labels: { range: string; asking: string; fair: string }
}

const TONE: Record<Verdict, { bar: string; text: string; soft: string }> = {
  underpriced: { bar: 'bg-under', text: 'text-under', soft: 'bg-under-soft' },
  fair: { bar: 'bg-fair', text: 'text-fair', soft: 'bg-fair-soft' },
  overpriced: { bar: 'bg-over', text: 'text-over', soft: 'bg-over-soft' },
}

export function PriceRuler({ low, high, fair, asking, verdict, locale, labels }: PriceRulerProps) {
  const domain = useMemo(() => {
    // The domain must always contain both the range and the asking price, with
    // headroom so a marker at an extreme is never clipped off the track.
    const min = Math.min(low, asking)
    const max = Math.max(high, asking)
    const pad = Math.max((max - min) * 0.15, fair * 0.05)
    return { min: min - pad, max: max + pad }
  }, [low, high, fair, asking])

  const pct = (value: number) => ((value - domain.min) / (domain.max - domain.min)) * 100

  const bandLeft = pct(low)
  const bandWidth = pct(high) - bandLeft
  const fairPos = pct(fair)
  const askPos = pct(asking)
  const tone = TONE[verdict]

  // Keep the floating asking-price label inside the track at the extremes.
  const labelAnchor = askPos < 15 ? 'left-0 translate-x-0' : askPos > 85 ? 'right-0 translate-x-0' : '-translate-x-1/2'
  const labelStyle = askPos < 15 || askPos > 85 ? undefined : { left: `${askPos}%` }
  const labelSide = askPos < 15 ? { left: 0 } : askPos > 85 ? { right: 0 } : undefined

  return (
    <div className="pt-8 pb-2">
      {/* Asking-price marker and label, above the track. */}
      <div className="relative h-10">
        <div className={`absolute bottom-0 ${labelAnchor}`} style={labelStyle ?? labelSide}>
          <div className="flex flex-col items-center">
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-subtle">{labels.asking}</span>
            <span className={`text-[1.0625rem] font-semibold tnum ${tone.text}`}>{formatUsd(asking, locale)}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="h-2.5 w-full rounded-full bg-sunken" />

        {/* Estimated range */}
        <div
          className={`absolute top-0 h-2.5 rounded-full ${tone.soft} border border-line`}
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />

        {/* Point estimate */}
        <div
          className="absolute top-0 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-[var(--ink-subtle)]"
          style={{ left: `${fairPos}%` }}
          aria-hidden
        />

        {/* Asking price marker */}
        <div
          className={`absolute -top-1 h-[1.125rem] w-[3px] -translate-x-1/2 rounded-full ${tone.bar} ring-2 ring-[var(--surface)]`}
          style={{ left: `${askPos}%` }}
          aria-hidden
        />
      </div>

      {/* Range endpoints */}
      <div className="relative mt-2 h-8">
        <div className="absolute -translate-x-1/2 text-center" style={{ left: `${bandLeft}%` }}>
          <span className="text-[0.75rem] tnum text-ink-muted">{formatUsd(low, locale, { compact: true })}</span>
        </div>
        <div className="absolute -translate-x-1/2 text-center" style={{ left: `${fairPos}%` }}>
          <span className="block text-[0.6875rem] uppercase tracking-wide text-ink-subtle">{labels.fair}</span>
          <span className="text-[0.75rem] font-semibold tnum text-ink">{formatUsd(fair, locale, { compact: true })}</span>
        </div>
        <div className="absolute -translate-x-1/2 text-center" style={{ left: `${bandLeft + bandWidth}%` }}>
          <span className="text-[0.75rem] tnum text-ink-muted">{formatUsd(high, locale, { compact: true })}</span>
        </div>
      </div>

      {/* Text equivalent of the chart, for assistive technology. */}
      <p className="sr-only">
        {labels.range}: {formatUsd(low, locale)} – {formatUsd(high, locale)}. {labels.fair}: {formatUsd(fair, locale)}.{' '}
        {labels.asking}: {formatUsd(asking, locale)}.
      </p>
    </div>
  )
}
