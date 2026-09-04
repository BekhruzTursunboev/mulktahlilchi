'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { REGIONS } from '@/lib/market/geo'
import type { Locale, Translator } from '@/lib/i18n/dictionary'
import type { PropertyInput } from '@/lib/valuation/types'
import { Card, CardHeader, Checkbox, Field, Segmented, Select, TextInput, UnitInput } from './ui'

/**
 * The property form.
 *
 * The old form was a five-step wizard over twelve fields, which put four extra
 * clicks between a user and their answer and hid from them how much was left.
 * Everything essential now fits on one screen, with optional attributes behind a
 * single disclosure.
 *
 * The precision meter is the important idea: optional fields visibly tighten the
 * estimate, so the interface can ask for more detail by showing what it buys
 * rather than by making every field mandatory.
 */

type FormState = {
  deal: 'sale' | 'rent'
  regionSlug: string
  districtSlug: string
  price: string
  size: string
  rooms: string
  floor: string
  totalFloors: string
  propertyKind: PropertyInput['propertyKind']
  condition: PropertyInput['condition']
  buildingMaterial: '' | 'panel' | 'brick' | 'monolith'
  yearBuilt: string
  hasElevator: '' | 'yes' | 'no'
  hasParking: boolean
  hasBalcony: boolean
  isFurnished: boolean
}

const INITIAL: FormState = {
  deal: 'sale',
  regionSlug: 'tashkent-city',
  districtSlug: 'chilonzor',
  price: '',
  size: '',
  rooms: '2',
  floor: '',
  totalFloors: '',
  propertyKind: 'apartment',
  condition: 'good',
  buildingMaterial: '',
  yearBuilt: '',
  hasElevator: '',
  hasParking: false,
  hasBalcony: false,
  isFurnished: false,
}

/** Optional attributes that narrow the estimate, in the order they are asked. */
const PRECISION_FIELDS: (keyof FormState)[] = ['yearBuilt', 'buildingMaterial', 'hasElevator', 'hasParking']

export interface ValuationFormProps {
  t: Translator
  locale: Locale
  submitting: boolean
  onSubmit: (input: PropertyInput) => void
}

export function ValuationForm({ t, submitting, onSubmit }: ValuationFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [detailsOpen, setDetailsOpen] = useState(true)

  const region = useMemo(() => REGIONS.find((r) => r.slug === form.regionSlug) ?? REGIONS[0], [form.regionSlug])

  const precision = useMemo(() => {
    const filled = PRECISION_FIELDS.filter((key) => {
      const value = form[key]
      return typeof value === 'boolean' ? value : value !== ''
    }).length
    return Math.round((filled / PRECISION_FIELDS.length) * 100)
  }, [form])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      // Changing region invalidates the district, so reset it to that region's
      // first entry rather than leaving an impossible pair the server rejects.
      if (key === 'regionSlug') {
        const next = REGIONS.find((r) => r.slug === value)
        return { ...prev, regionSlug: value as string, districtSlug: next?.districts[0]?.slug ?? '' }
      }
      return { ...prev, [key]: value }
    })
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function validate(): PropertyInput | null {
    const next: Partial<Record<keyof FormState, string>> = {}
    const price = Number(form.price)
    const size = Number(form.size)
    const rooms = Number(form.rooms)
    const floor = Number(form.floor)
    const totalFloors = Number(form.totalFloors)

    if (!form.price || !Number.isFinite(price) || price <= 0) next.price = t('error.required')
    if (!form.size || !Number.isFinite(size) || size <= 0) next.size = t('error.required')
    if (!form.floor || !Number.isFinite(floor) || floor < 0) next.floor = t('error.required')
    if (!form.totalFloors || !Number.isFinite(totalFloors) || totalFloors < 1) next.totalFloors = t('error.required')
    if (!next.floor && !next.totalFloors && floor > totalFloors) {
      next.floor = t('error.floor_exceeds_total_floors')
    }
    // Mirrors the server's unit-error guard so the user is told immediately
    // rather than after a round trip.
    if (!next.price && !next.size) {
      const perSqm = price / size
      const limit = form.deal === 'sale' ? 20_000 : 200
      if (perSqm >= limit) next.price = t('error.price_out_of_range_for_deal_type')
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return null

    return {
      deal: form.deal,
      regionSlug: form.regionSlug,
      districtSlug: form.districtSlug,
      price,
      size,
      rooms,
      floor,
      totalFloors,
      propertyKind: form.propertyKind,
      condition: form.condition,
      buildingMaterial: form.buildingMaterial || undefined,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      hasElevator: form.hasElevator === '' ? undefined : form.hasElevator === 'yes',
      hasParking: form.hasParking || undefined,
      hasBalcony: form.hasBalcony || undefined,
      isFurnished: form.deal === 'rent' ? form.isFurnished || undefined : undefined,
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const input = validate()
    if (input) onSubmit(input)
  }

  return (
    <Card>
      <CardHeader
        title={t('form.title')}
        action={
          <Segmented
            label={t('field.deal')}
            value={form.deal}
            onChange={(v) => set('deal', v)}
            options={[
              { value: 'sale', label: t('deal.sale') },
              { value: 'rent', label: t('deal.rent') },
            ]}
          />
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 border-t border-line px-5 py-5 sm:grid-cols-2">
          <Field label={t('field.region')} htmlFor="region">
            <Select id="region" value={form.regionSlug} onChange={(e) => set('regionSlug', e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name.uz}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('field.district')} htmlFor="district">
            <Select id="district" value={form.districtSlug} onChange={(e) => set('districtSlug', e.target.value)}>
              {region.districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name.uz}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={form.deal === 'rent' ? t('field.priceRent') : t('field.price')} htmlFor="price" error={errors.price}>
            <UnitInput
              id="price"
              inputMode="numeric"
              suffix={form.deal === 'rent' ? '$/oy' : '$'}
              value={form.price}
              error={Boolean(errors.price)}
              onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))}
              placeholder={form.deal === 'rent' ? '450' : '65000'}
            />
          </Field>

          <Field label={t('field.size')} htmlFor="size" error={errors.size}>
            <UnitInput
              id="size"
              inputMode="decimal"
              suffix="m²"
              value={form.size}
              error={Boolean(errors.size)}
              onChange={(e) => set('size', e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="60"
            />
          </Field>

          <Field label={t('field.kind')} htmlFor="kind">
            <Select id="kind" value={form.propertyKind} onChange={(e) => set('propertyKind', e.target.value as FormState['propertyKind'])}>
              <option value="apartment">{t('kind.apartment')}</option>
              <option value="house">{t('kind.house')}</option>
              <option value="studio">{t('kind.studio')}</option>
              <option value="commercial">{t('kind.commercial')}</option>
            </Select>
          </Field>

          <Field label={t('field.rooms')} htmlFor="rooms">
            <Select id="rooms" value={form.rooms} onChange={(e) => set('rooms', e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={String(n)}>
                  {n === 6 ? '6+' : n}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('field.floor')} htmlFor="floor" error={errors.floor}>
            <TextInput
              id="floor"
              inputMode="numeric"
              value={form.floor}
              error={Boolean(errors.floor)}
              onChange={(e) => set('floor', e.target.value.replace(/\D/g, ''))}
              placeholder="3"
            />
          </Field>

          <Field label={t('field.totalFloors')} htmlFor="totalFloors" error={errors.totalFloors}>
            <TextInput
              id="totalFloors"
              inputMode="numeric"
              value={form.totalFloors}
              error={Boolean(errors.totalFloors)}
              onChange={(e) => set('totalFloors', e.target.value.replace(/\D/g, ''))}
              placeholder="9"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t('field.condition')} htmlFor="condition">
              <Select id="condition" value={form.condition} onChange={(e) => set('condition', e.target.value as FormState['condition'])}>
                <option value="new">{t('condition.new')}</option>
                <option value="renovated">{t('condition.renovated')}</option>
                <option value="good">{t('condition.good')}</option>
                <option value="needs_renovation">{t('condition.needs_renovation')}</option>
                <option value="shell">{t('condition.shell')}</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Optional attributes */}
        <div className="border-t border-line">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[0.8125rem] font-medium text-ink">{t('form.details')}</span>
              <span className="block text-[0.75rem] text-ink-subtle">{t('form.detailsHint')}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="hidden items-center gap-2 sm:flex">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken">
                  <span
                    className="block h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                    style={{ width: `${Math.max(3, precision)}%` }}
                  />
                </span>
                <span className="text-[0.75rem] tnum text-ink-subtle">{precision}%</span>
              </span>
              <ChevronDown
                size={16}
                className={`text-ink-subtle transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </span>
          </button>

          {detailsOpen && (
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label={t('field.yearBuilt')} htmlFor="yearBuilt" optional={t('field.optional')}>
                <TextInput
                  id="yearBuilt"
                  inputMode="numeric"
                  value={form.yearBuilt}
                  onChange={(e) => set('yearBuilt', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1995"
                />
              </Field>

              <Field label={t('field.material')} htmlFor="material" optional={t('field.optional')}>
                <Select id="material" value={form.buildingMaterial} onChange={(e) => set('buildingMaterial', e.target.value as FormState['buildingMaterial'])}>
                  <option value="">{t('material.unknown')}</option>
                  <option value="panel">{t('material.panel')}</option>
                  <option value="brick">{t('material.brick')}</option>
                  <option value="monolith">{t('material.monolith')}</option>
                </Select>
              </Field>

              <Field label={t('field.elevator')} htmlFor="elevator" optional={t('field.optional')}>
                <Select id="elevator" value={form.hasElevator} onChange={(e) => set('hasElevator', e.target.value as FormState['hasElevator'])}>
                  <option value="">{t('material.unknown')}</option>
                  <option value="yes">{t('common.yes')}</option>
                  <option value="no">{t('common.no')}</option>
                </Select>
              </Field>

              <div className="flex flex-col justify-end gap-2.5 pb-1">
                <Checkbox label={t('field.parking')} checked={form.hasParking} onChange={(v) => set('hasParking', v)} />
                <Checkbox label={t('field.balcony')} checked={form.hasBalcony} onChange={(v) => set('hasBalcony', v)} />
                {form.deal === 'rent' && (
                  <Checkbox label={t('field.furnished')} checked={form.isFurnished} onChange={(v) => set('isFurnished', v)} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-4">
          <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 text-[0.9375rem]">
            {submitting ? t('form.submitting') : t('form.submit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL)
              setErrors({})
            }}
            className="btn-ghost px-4 py-2.5 text-[0.875rem]"
          >
            {t('form.reset')}
          </button>
        </div>
      </form>
    </Card>
  )
}
