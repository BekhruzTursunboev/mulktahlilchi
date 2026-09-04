'use client'

import { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, useId } from 'react'

/**
 * Form and layout primitives.
 *
 * These exist so that labelling, error text and focus behaviour are defined once.
 * The previous UI wrote every input inline, which is why some fields had labels
 * that were not associated with their control and why invalid fields were shown
 * with colour alone — invisible to a screen reader and to anyone who cannot
 * distinguish the red.
 */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function CardHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  optional?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, optional, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-ink-muted">
        <span>{label}</span>
        {optional && <span className="text-[0.6875rem] font-normal text-ink-subtle">{optional}</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[0.75rem] text-over">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput({ error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input {...props} aria-invalid={error ? 'true' : undefined} className="input-base tnum" />
}

export function Select({ error, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select {...props} aria-invalid={error ? 'true' : undefined} className="input-base cursor-pointer">
      {children}
    </select>
  )
}

/** A suffix-annotated numeric input, for areas and rates. */
export function UnitInput({
  suffix,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { suffix: string; error?: boolean }) {
  return (
    <div className="relative">
      <input {...props} aria-invalid={error ? 'true' : undefined} className="input-base tnum pr-12" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.8125rem] text-ink-subtle">
        {suffix}
      </span>
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
}

/**
 * A radio group rendered as a segmented control. Implemented with real radio
 * inputs so keyboard and assistive technology behave correctly, with the visual
 * treatment applied to the labels.
 */
export function Segmented<T extends string>({ value, onChange, options, label }: SegmentedProps<T>) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded border border-line-strong bg-sunken p-0.5">
      {options.map((option) => {
        const id = `${name}-${option.value}`
        const active = option.value === value
        return (
          <div key={option.value}>
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className={`block cursor-pointer whitespace-nowrap rounded px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)] ${
                active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
            </label>
          </div>
        )
      })}
    </div>
  )
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-line-strong accent-[var(--accent)]"
      />
      <label htmlFor={id} className="cursor-pointer select-none text-[0.8125rem] text-ink-muted">
        {label}
      </label>
    </div>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'under' | 'fair' | 'over' }) {
  const toneClass = tone === 'under' ? 'text-under' : tone === 'over' ? 'text-over' : tone === 'fair' ? 'text-fair' : 'text-ink'
  return (
    <div className="min-w-0">
      <dt className="text-[0.75rem] font-medium uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className={`mt-1 text-[1.375rem] font-semibold tnum ${toneClass}`}>{value}</dd>
      {sub && <p className="mt-0.5 text-[0.75rem] leading-snug text-ink-subtle">{sub}</p>}
    </div>
  )
}

/** A labelled 0-100 bar, used for quality components. */
export function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-[0.8125rem] text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[0.8125rem] font-medium tnum text-ink">{Math.round(score)}</span>
    </div>
  )
}
