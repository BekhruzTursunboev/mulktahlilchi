'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, Copy, Info } from 'lucide-react'

import { formatDate, formatNumber, formatPercent, formatPerSqm, formatSignedPercent, formatUsd } from '@/lib/format'
import type { Locale, Translator } from '@/lib/i18n/dictionary'
import type { ValuationReport } from '@/lib/valuation/types'
import { PriceRuler } from './PriceRuler'
import { Card, CardHeader, ScoreBar, Stat } from './ui'

/**
 * The valuation report.
 *
 * Order matters here. The old result screen led with a 1-10 score and buried the
 * money. This one leads with the two numbers a person came for — what it is
 * worth and what they are being asked — and only then explains itself. Every
 * section below the fold answers "why should I believe that", in decreasing
 * order of how often it changes someone's mind.
 */

interface ReportViewProps {
  report: ValuationReport
  t: Translator
  locale: Locale
  onReset: () => void
}

const VERDICT_TONE = {
  underpriced: { text: 'text-under', bg: 'bg-under-soft', border: 'border-[var(--under)]' },
  fair: { text: 'text-fair', bg: 'bg-fair-soft', border: 'border-[var(--fair)]' },
  overpriced: { text: 'text-over', bg: 'bg-over-soft', border: 'border-[var(--over)]' },
} as const

export function ReportView({ report, t, locale, onReset }: ReportViewProps) {
  const [copied, setCopied] = useState(false)
  const { estimate, assessment, quality, investment, mortgage, negotiation, market, input } = report
  const tone = VERDICT_TONE[assessment.verdict]
  const isRent = input.deal === 'rent'

  const summary = useMemo(() => {
    const lines = [
      `${t('app.name')} — ${market.districtName[locale]}, ${market.regionName[locale]}`,
      `${t('result.asking')}: ${formatUsd(input.price, locale)}${isRent ? t('unit.perMonth') : ''}`,
      `${t('result.fairValue')}: ${formatUsd(estimate.fairPrice, locale)} (${formatUsd(estimate.low, locale)} – ${formatUsd(estimate.high, locale)})`,
      `${t(`verdict.${assessment.verdict}`)} · ${formatSignedPercent(assessment.residual * 100, locale)}`,
      `${t('negotiate.target')}: ${formatUsd(negotiation.targetPrice, locale)}`,
    ]
    return lines.join('\n')
  }, [t, locale, input, estimate, assessment, negotiation, market, isRent])

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied; failing silently is better than an alert.
    }
  }

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------------------- Hero */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <p className="text-[0.8125rem] text-ink-muted">
              {market.districtName[locale]}, {market.regionName[locale]}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-ink-subtle">
              {input.size} m² · {input.rooms} {t('unit.rooms')} · {input.floor}/{input.totalFloors} ·{' '}
              {t(`condition.${input.condition}`)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copySummary} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem]">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('result.copied') : t('result.copy')}
            </button>
            <button onClick={onReset} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem]">
              <ArrowLeft size={14} />
              {t('result.newAnalysis')}
            </button>
          </div>
        </div>

        <div className="px-5 pb-1 pt-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.75rem] font-medium uppercase tracking-wide text-ink-subtle">{t('result.fairValue')}</p>
              <p className="mt-1 text-[2.5rem] font-semibold leading-none tnum text-ink">
                {formatUsd(estimate.fairPrice, locale)}
                {isRent && <span className="text-[1.25rem] font-normal text-ink-muted">{t('unit.perMonth')}</span>}
              </p>
              <p className="mt-1.5 text-[0.8125rem] text-ink-muted">
                {formatPerSqm(estimate.fairPricePerSqm, locale)}{t('result.perSqm')}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.8125rem] font-semibold ${tone.text} ${tone.bg} ${tone.border}`}
              >
                {t(`verdict.${assessment.verdict}`)}
              </span>
              <p className={`mt-1.5 text-[0.9375rem] font-semibold tnum ${tone.text}`}>
                {formatSignedPercent(assessment.residual * 100, locale)}
                <span className="ml-1.5 font-normal text-ink-muted">
                  ({assessment.deltaUsd >= 0 ? '+' : '−'}
                  {formatUsd(Math.abs(assessment.deltaUsd), locale, { compact: true })})
                </span>
              </p>
            </div>
          </div>

          <PriceRuler
            low={estimate.low}
            high={estimate.high}
            fair={estimate.fairPrice}
            asking={input.price}
            verdict={assessment.verdict}
            locale={locale}
            labels={{ range: t('result.range'), asking: t('result.asking'), fair: t('result.fairValue') }}
          />
        </div>

        <div className={`border-t border-line px-5 py-4 ${tone.bg}`}>
          <p className="text-[0.875rem] leading-relaxed text-ink">{t(`verdict.${assessment.verdict}.desc`)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-ink-muted">
            <Info size={13} aria-hidden />
            {t('result.confidence')}: <strong className="font-semibold">{t(`confidence.${estimate.confidence}`)}</strong> ·{' '}
            {t('result.range')} ±{formatPercent(estimate.relativeMargin * 100, locale, 0)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------------------ Factors */}
        <Card>
          <CardHeader title={t('section.factors')} hint={t('section.factorsHint')} />
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-baseline justify-between gap-3 text-[0.8125rem]">
              <span className="text-ink-muted">{t('result.districtMedian')}</span>
              <span className="font-semibold tnum text-ink">
                {formatPerSqm(estimate.districtMedianPerSqm, locale)}{t('result.perSqm')}
              </span>
            </div>

            <ul className="space-y-2.5">
              {estimate.adjustments.map((adjustment) => {
                const deltaPct = (adjustment.multiplier - 1) * 100
                const neutral = Math.abs(deltaPct) < 0.05
                return (
                  <li key={adjustment.key} className="flex items-start gap-3">
                    <span
                      className={`mt-px w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-[0.75rem] font-semibold tnum ${
                        neutral
                          ? 'bg-sunken text-ink-subtle'
                          : deltaPct > 0
                            ? 'bg-under-soft text-under'
                            : 'bg-over-soft text-over'
                      }`}
                    >
                      {neutral ? '0%' : formatSignedPercent(deltaPct, locale)}
                    </span>
                    <span className="text-[0.8125rem] leading-relaxed text-ink-muted">{adjustment.rationale[locale]}</span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3 text-[0.8125rem]">
              <span className="font-medium text-ink">{t('result.fairValue')}</span>
              <span className="font-semibold tnum text-ink">
                {formatPerSqm(estimate.fairPricePerSqm, locale)}{t('result.perSqm')}
              </span>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------ Quality */}
        <Card>
          <CardHeader
            title={t('section.quality')}
            hint={t('section.qualityHint')}
            action={
              <div className="text-right">
                <span className="text-[1.75rem] font-semibold leading-none tnum text-ink">{quality.total}</span>
                <span className="text-[0.875rem] text-ink-subtle">/100</span>
              </div>
            }
          />
          <div className="space-y-3 border-t border-line px-5 py-4">
            {quality.components.map((component) => (
              <ScoreBar key={component.key} label={t(`quality.${component.key}`)} score={component.score} />
            ))}
          </div>
        </Card>

        {/* --------------------------------------------------------- Negotiation */}
        <Card>
          <CardHeader title={t('section.negotiation')} hint={t('negotiate.hint')} />
          <div className="border-t border-line px-5 py-4">
            <dl className="grid grid-cols-3 gap-3">
              <Stat label={t('negotiate.opening')} value={formatUsd(negotiation.openingOffer, locale, { compact: true })} />
              <Stat
                label={t('negotiate.target')}
                value={formatUsd(negotiation.targetPrice, locale, { compact: true })}
                tone="fair"
              />
              <Stat
                label={t('negotiate.walkAway')}
                value={formatUsd(negotiation.walkAwayPrice, locale, { compact: true })}
                tone="over"
              />
            </dl>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-[0.8125rem] text-ink-muted">
              <span>
                {t('negotiate.typicalDiscount')}:{' '}
                <strong className="font-semibold tnum text-ink">{formatPercent(negotiation.typicalDiscountPct, locale)}</strong>
              </span>
              <span>
                {t('negotiate.leverage')}:{' '}
                <strong className="font-semibold text-ink">{t(`negotiate.leverage.${negotiation.leverage}`)}</strong>
              </span>
              <span>
                {t('negotiate.dom')}:{' '}
                <strong className="font-semibold tnum text-ink">
                  {negotiation.medianDaysOnMarket} {t('negotiate.days')}
                </strong>
              </span>
            </div>
          </div>
        </Card>

        {/* --------------------------------------------------------- Investment */}
        {investment && (
          <Card>
            <CardHeader title={t('section.investment')} />
            <div className="border-t border-line px-5 py-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t('invest.rent')} value={formatUsd(investment.estimatedMonthlyRent, locale)} sub={t('unit.perMonth')} />
                <Stat label={t('invest.grossYield')} value={formatPercent(investment.grossYieldPct, locale)} />
                <Stat label={t('invest.netYield')} value={formatPercent(investment.netYieldPct, locale)} tone="fair" />
                <Stat
                  label={t('invest.payback')}
                  value={`${formatNumber(investment.paybackYears, locale, 1)}`}
                  sub={t('invest.years')}
                />
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] leading-relaxed text-ink-subtle">
                {t('invest.costNote', { pct: Math.round(investment.assumedCostRatio * 100) })}
              </p>
            </div>
          </Card>
        )}

        {/* ----------------------------------------------------------- Mortgage */}
        {mortgage && (
          <Card>
            <CardHeader
              title={t('section.mortgage')}
              hint={`${t('mortgage.downPayment')} ${mortgage.downPaymentPct}% · ${t('mortgage.rate')} ${mortgage.annualRatePct}% · ${mortgage.termYears} ${t('mortgage.years')}`}
            />
            <div className="border-t border-line px-5 py-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t('mortgage.monthly')} value={formatUsd(mortgage.monthlyPayment, locale)} sub={t('unit.perMonth')} />
                <Stat label={t('mortgage.loan')} value={formatUsd(mortgage.loanAmount, locale, { compact: true })} />
                <Stat label={t('mortgage.totalInterest')} value={formatUsd(mortgage.totalInterest, locale, { compact: true })} tone="over" />
                <Stat label={t('mortgage.requiredIncome')} value={formatUsd(mortgage.requiredMonthlyIncome, locale)} sub={t('unit.perMonth')} />
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] leading-relaxed text-ink-subtle">
                {t('mortgage.incomeNote')}
              </p>
            </div>
          </Card>
        )}

        {/* ------------------------------------------------------------- Market */}
        <Card>
          <CardHeader title={t('section.market')} />
          <div className="border-t border-line px-5 py-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label={t('market.yoy')}
                value={formatSignedPercent(market.yoyChangePct, locale)}
                tone={market.yoyChangePct >= 0 ? 'under' : 'over'}
              />
              <Stat label={t('market.dom')} value={`${market.medianDaysOnMarket}`} sub={t('negotiate.days')} />
              <Stat label={t('market.sample')} value={formatNumber(market.sampleSize, locale)} sub={t('market.listings')} />
              <Stat label={t('market.asOf')} value={formatDate(market.asOf, locale)} sub={`v${market.datasetVersion}`} />
            </dl>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- Caveats */}
      <Card>
        <CardHeader title={t('section.caveats')} />
        <ul className="space-y-2.5 border-t border-line px-5 py-4">
          {report.caveats.map((caveat) => (
            <li key={caveat} className="flex items-start gap-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden />
              <span className="text-[0.8125rem] leading-relaxed text-ink-muted">{t(`caveat.${caveat}`)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
