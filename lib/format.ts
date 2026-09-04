import type { Locale } from './i18n/dictionary'

/**
 * Number and currency formatting.
 *
 * Uzbek property is quoted in US dollars even though everyday spending is in
 * som, so prices stay in USD throughout. Grouping separators differ by locale,
 * which `Intl` handles, but the currency symbol placement is normalised so the
 * three language versions of a report stay visually comparable.
 */

const LOCALE_TAGS: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

export function formatUsd(value: number, locale: Locale, opts: { compact?: boolean } = {}): string {
  const tag = LOCALE_TAGS[locale]
  if (opts.compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString(tag, { maximumFractionDigits: 2 })}M`
  }
  if (opts.compact && Math.abs(value) >= 10_000) {
    return `$${(value / 1_000).toLocaleString(tag, { maximumFractionDigits: 0 })}K`
  }
  return `$${Math.round(value).toLocaleString(tag)}`
}

export function formatPerSqm(value: number, locale: Locale): string {
  const digits = value < 100 ? 1 : 0
  return `$${value.toLocaleString(LOCALE_TAGS[locale], { maximumFractionDigits: digits })}`
}

export function formatPercent(value: number, locale: Locale, digits = 1): string {
  return `${value.toLocaleString(LOCALE_TAGS[locale], { maximumFractionDigits: digits, minimumFractionDigits: 0 })}%`
}

export function formatSignedPercent(value: number, locale: Locale, digits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPercent(value, locale, digits)}`
}

export function formatNumber(value: number, locale: Locale, digits = 0): string {
  return value.toLocaleString(LOCALE_TAGS[locale], { maximumFractionDigits: digits })
}

/**
 * Uzbek month names.
 *
 * `Intl` has no usable long month names for `uz-UZ` in most runtimes — it falls
 * back to "M07", which is meaningless to a reader. Uzbek is the default language
 * of this product, so its dates cannot be the ones that look broken.
 */
const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
]

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  if (locale === 'uz') return `${UZ_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
  return date.toLocaleDateString(LOCALE_TAGS[locale], { year: 'numeric', month: 'long', timeZone: 'UTC' })
}
