'use client'

import { useCallback, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { ReportView } from '@/components/ReportView'
import { ValuationForm } from '@/components/ValuationForm'
import { Card } from '@/components/ui'
import { DEFAULT_LOCALE, LOCALES, translatorFor, type Locale } from '@/lib/i18n/dictionary'
import type { PropertyInput, ValuationReport } from '@/lib/valuation/types'

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; report: ValuationReport }

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const t = translatorFor(locale)

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored && LOCALES.some((l) => l.code === stored)) setLocale(stored)
    const current = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light'
    setTheme(current)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const changeLocale = useCallback((next: Locale) => {
    setLocale(next)
    try {
      localStorage.setItem('locale', next)
    } catch {
      // Private browsing can block storage; the choice simply will not persist.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try {
        localStorage.setItem('theme', next)
      } catch {
        // Same as above: a failed write only costs persistence.
      }
      return next
    })
  }, [])

  const submit = useCallback(
    async (property: PropertyInput) => {
      setStatus({ kind: 'loading' })
      try {
        const response = await fetch('/api/valuation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          // The server returns stable error codes rather than prose, so the
          // message shown is always in the language the user selected.
          setStatus({ kind: 'error', message: t(`error.${body.error ?? 'internal_error'}`) })
          return
        }

        const report: ValuationReport = await response.json()
        setStatus({ kind: 'done', report })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        setStatus({ kind: 'error', message: t('error.network') })
      }
    },
    [t]
  )

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">{t('app.name')}</span>
            <span className="hidden text-[0.75rem] text-ink-subtle sm:inline">{t('app.tagline')}</span>
          </div>

          <div className="flex items-center gap-2">
            <div role="group" aria-label="Language" className="flex rounded border border-line-strong p-0.5">
              {LOCALES.map((option) => (
                <button
                  key={option.code}
                  onClick={() => changeLocale(option.code)}
                  aria-pressed={locale === option.code}
                  className={`rounded px-2 py-1 text-[0.75rem] font-medium transition-colors ${
                    locale === option.code ? 'bg-sunken text-ink' : 'text-ink-subtle hover:text-ink'
                  }`}
                >
                  {option.code.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'} className="btn-ghost p-2">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-8">
        {status.kind === 'done' ? (
          <ReportView report={status.report} t={t} locale={locale} onReset={() => setStatus({ kind: 'idle' })} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4">
              <div className="max-w-2xl">
                <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2rem]">
                  {t('app.tagline')}
                </h1>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">{t('app.subtitle')}</p>
              </div>

              {status.kind === 'error' && (
                <div role="alert" className="rounded border border-[var(--over)] bg-over-soft px-4 py-3 text-[0.875rem] text-over">
                  {status.message}
                </div>
              )}

              <ValuationForm t={t} locale={locale} submitting={status.kind === 'loading'} onSubmit={submit} />

              {status.kind === 'loading' && (
                <div className="space-y-3" aria-live="polite">
                  <div className="skeleton h-28 w-full" />
                  <div className="skeleton h-40 w-full" />
                </div>
              )}
            </div>

            {/*
              Method disclosure, deliberately on the first screen rather than in a
              footer. Someone deciding whether to trust the number should not have
              to hunt for how it was produced.
            */}
            <aside className="lg:pt-1">
              <Card className="p-5">
                <h2 className="text-[0.875rem] font-semibold text-ink">{t('how.title')}</h2>
                <ol className="mt-3 space-y-2.5">
                  {['how.step1', 'how.step2', 'how.step3', 'how.step4'].map((key, index) => (
                    <li key={key} className="flex gap-2.5">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sunken text-[0.6875rem] font-semibold tnum text-ink-muted">
                        {index + 1}
                      </span>
                      <span className="text-[0.8125rem] leading-relaxed text-ink-muted">{t(key)}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-relaxed text-ink-subtle">{t('how.note')}</p>
              </Card>
            </aside>
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-line py-6">
        <div className="mx-auto max-w-content px-5">
          <p className="text-[0.75rem] leading-relaxed text-ink-subtle">{t('caveat.asking_price_basis')}</p>
        </div>
      </footer>
    </div>
  )
}
