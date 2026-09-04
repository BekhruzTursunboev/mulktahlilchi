/**
 * Hedonic adjustments.
 *
 * The model prices a property as `district median $/m² × Π(multipliers) × size`.
 * Each multiplier below answers one question: *holding location constant, what
 * does this attribute do to price per m²?*
 *
 * Two rules keep the model honest, and both were violated by the old engine:
 *
 * 1. **Location appears exactly once.** It is already fully expressed by the
 *    district median. The old code added a separate `locationScore` on top of a
 *    location-derived base price, so a Mirobod flat was rewarded twice for being
 *    in Mirobod and came out looking like a bargain at any price.
 *
 * 2. **Nothing here reads the price.** Adjustments describe the asset only. The
 *    verdict is computed afterwards by comparing the asking price against this
 *    price-blind estimate. Mixing the two is what let the old engine call an
 *    expensive penthouse "underpriced" purely for being a penthouse.
 */

import type { Adjustment, Deal, PropertyInput } from './types'

function adj(key: string, multiplier: number, uz: string, ru: string, en: string): Adjustment {
  return { key, multiplier, rationale: { uz, ru, en } }
}

/** Typical unit size in m², used as the origin for the price-per-m² taper. */
const SIZE_BASELINE = 60

/** Price per m² falls as units get larger. Negative elasticity, applied in log space. */
const SIZE_ELASTICITY = -0.1

function conditionAdjustment(condition: PropertyInput['condition'], deal: Deal): Adjustment {
  // Fit-out is capitalised more heavily into rent than into sale price: a tenant
  // pays for what they can use today, a buyer discounts work they can redo.
  const scale = deal === 'rent' ? 1.25 : 1
  const table: Record<PropertyInput['condition'], { m: number; uz: string; ru: string; en: string }> = {
    new: {
      m: 0.14,
      uz: 'Yangi, hech kim yashamagan holat — bozorda eng yuqori talab.',
      ru: 'Новое, никто не проживал — максимальный спрос на рынке.',
      en: 'Brand new and never occupied — the strongest demand segment.',
    },
    renovated: {
      m: 0.1,
      uz: "Yevroremont qilingan — xaridor qo'shimcha xarajat qilmaydi.",
      ru: 'Сделан евроремонт — покупателю не нужны дополнительные вложения.',
      en: 'Fully renovated — the buyer takes on no immediate fit-out cost.',
    },
    good: {
      m: 0,
      uz: "Yashash uchun yaroqli o'rtacha holat — bozor mezoni shu.",
      ru: 'Пригодное для проживания среднее состояние — это рыночная норма.',
      en: 'Livable, average condition — this is the market baseline.',
    },
    needs_renovation: {
      m: -0.16,
      uz: "Ta'mir talab qiladi — xaridor remont xarajatini narxdan chegiradi.",
      ru: 'Требует ремонта — покупатель вычитает стоимость работ из цены.',
      en: 'Needs renovation — buyers deduct the cost of the work from the price.',
    },
    shell: {
      m: -0.27,
      uz: "Qora suvoq holati — to'liq ta'mir kerak, m² uchun $150-250 qo'shimcha xarajat.",
      ru: 'Черновая отделка — нужен полный ремонт, дополнительно $150-250 за м².',
      en: 'Bare shell — full fit-out required, typically $150-250 per m² on top.',
    },
  }
  const row = table[condition]
  return adj('condition', 1 + row.m * scale, row.uz, row.ru, row.en)
}

function ageAdjustment(yearBuilt: number | undefined, now: number): Adjustment | null {
  if (!yearBuilt) return null
  const age = now - yearBuilt
  if (age < 0) return null

  // Structure only. Interior state is handled by `conditionAdjustment`, so these
  // coefficients deliberately stay modest — they price the building, not the flat.
  if (age <= 5) {
    return adj('age', 1.07, `Yangi bino (${age} yil) — zamonaviy kommunikatsiya va issiqlik izolyatsiyasi.`, `Новый дом (${age} лет) — современные коммуникации и теплоизоляция.`, `New building (${age} years) — modern utilities and insulation.`)
  }
  if (age <= 15) {
    return adj('age', 1.03, `Nisbatan yangi bino (${age} yil) — kapital ta'mir yaqin kelajakda kerak emas.`, `Относительно новый дом (${age} лет) — капремонт в ближайшее время не потребуется.`, `Relatively new (${age} years) — no major works due soon.`)
  }
  if (age <= 30) {
    return adj('age', 1.0, `Bino yoshi ${age} yil — bozor uchun odatiy.`, `Возраст дома ${age} лет — типично для рынка.`, `${age} years old — typical for the market.`)
  }
  if (age <= 50) {
    return adj('age', 0.94, `Sovet davri qurilishi (${age} yil) — muhandislik tarmoqlari eskirgan.`, `Постройка советского периода (${age} лет) — инженерные сети изношены.`, `Soviet-era construction (${age} years) — ageing building services.`)
  }
  return adj('age', 0.88, `Bino ${age} yildan oshgan — konstruktiv holatini tekshirish zarur.`, `Дому более ${age} лет — необходима проверка конструктива.`, `Over ${age} years old — a structural survey is advisable.`)
}

function materialAdjustment(material: PropertyInput['buildingMaterial']): Adjustment | null {
  switch (material) {
    case 'panel':
      return adj('material', 0.94, "Panel uy — tovush o'tkazuvchanligi yuqori, likvidligi pastroq.", 'Панельный дом — высокая слышимость, ликвидность ниже.', 'Panel building — poor sound insulation, lower resale liquidity.')
    case 'brick':
      return adj('material', 1.03, "G'isht uy — issiqlik va tovush izolyatsiyasi yaxshi.", 'Кирпичный дом — хорошая тепло- и шумоизоляция.', 'Brick building — good thermal and acoustic performance.')
    case 'monolith':
      return adj('material', 1.06, "Monolit-karkas — erkin planirovka, eng yuqori talab.", 'Монолитно-каркасный — свободная планировка, наибольший спрос.', 'Monolithic frame — flexible layout, strongest demand.')
    default:
      return null
  }
}

function floorAdjustments(input: PropertyInput, deal: Deal): Adjustment[] {
  const out: Adjustment[] = []
  const { floor, totalFloors, hasElevator } = input

  if (floor === 1) {
    const m = deal === 'rent' ? 0.95 : 0.93
    out.push(adj('floor_ground', m, "Birinchi qavat — xavfsizlik va shovqin sabab talab past.", 'Первый этаж — спрос ниже из-за шума и вопросов безопасности.', 'Ground floor — weaker demand on noise and security grounds.'))
  } else if (floor === totalFloors && totalFloors > 1) {
    out.push(adj('floor_top', 0.97, "Oxirgi qavat — tom oqishi xavfi xaridorlarni cho'chitadi.", 'Последний этаж — риск протечки кровли отталкивает покупателей.', 'Top floor — roof leak risk deters buyers.'))
  } else {
    out.push(adj('floor_middle', 1.015, `${floor}/${totalFloors} qavat — eng talabgir oraliq qavatlar.`, `${floor}/${totalFloors} этаж — наиболее востребованные средние этажи.`, `Floor ${floor} of ${totalFloors} — the most sought-after middle range.`))
  }

  // A fifth-floor walk-up is a materially different product from a fifth-floor
  // flat with a lift, and the market prices it that way.
  if (hasElevator === false && floor >= 5) {
    out.push(adj('no_elevator', 0.92, `Liftsiz ${floor}-qavat — kundalik foydalanish qiyin, qayta sotish sekin.`, `${floor}-й этаж без лифта — тяжело в быту, медленная перепродажа.`, `Floor ${floor} with no lift — hard daily use, slow resale.`))
  }
  return out
}

function sizeTaperAdjustment(size: number): Adjustment {
  const raw = Math.pow(size / SIZE_BASELINE, SIZE_ELASTICITY)
  const multiplier = Math.min(1.12, Math.max(0.88, raw))
  const direction = size > SIZE_BASELINE
  return adj(
    'size_taper',
    multiplier,
    direction
      ? `${size} m² — katta maydonli uylarda 1 m² narxi pasayadi, xaridorlar doirasi torroq.`
      : `${size} m² — kichik maydonli uylarda 1 m² narxi yuqori, talab keng.`,
    direction
      ? `${size} м² — у крупных объектов цена за м² ниже, круг покупателей уже.`
      : `${size} м² — у компактных объектов цена за м² выше, спрос шире.`,
    direction
      ? `${size} m² — price per m² falls on larger units; the buyer pool is narrower.`
      : `${size} m² — price per m² is higher on compact units, which sell to a wider pool.`
  )
}

function layoutAdjustment(size: number, rooms: number): Adjustment | null {
  if (rooms <= 0) return null
  const perRoom = size / rooms
  if (perRoom < 12) {
    return adj('layout', 0.95, `Xona boshiga ${perRoom.toFixed(1)} m² — planirovka siqiq, xonalar kichik.`, `${perRoom.toFixed(1)} м² на комнату — планировка тесная, комнаты мелкие.`, `${perRoom.toFixed(1)} m² per room — a cramped layout with small rooms.`)
  }
  if (perRoom > 32) {
    return adj('layout', 1.02, `Xona boshiga ${perRoom.toFixed(1)} m² — keng va yorug' planirovka.`, `${perRoom.toFixed(1)} м² на комнату — просторная планировка.`, `${perRoom.toFixed(1)} m² per room — a generous, open layout.`)
  }
  return null
}

function metroAdjustment(minutes: number | null | undefined): Adjustment | null {
  if (minutes === null || minutes === undefined) return null
  if (minutes <= 5) return adj('metro', 1.08, `Metroga ${minutes} daqiqa — eng qimmatli joylashuv omili.`, `${minutes} минут до метро — самый ценный фактор локации.`, `${minutes} minutes to metro — the single most valuable location factor.`)
  if (minutes <= 8) return adj('metro', 1.05, `Metroga ${minutes} daqiqa piyoda — qulay qatnov.`, `${minutes} минут пешком до метро — удобная транспортная доступность.`, `${minutes} minutes walk to metro — convenient access.`)
  if (minutes <= 12) return adj('metro', 1.02, `Metroga ${minutes} daqiqa — qoniqarli qatnov.`, `${minutes} минут до метро — приемлемая доступность.`, `${minutes} minutes to metro — acceptable access.`)
  if (minutes <= 18) return null
  return adj('metro', 0.97, `Metroga ${minutes} daqiqa — jamoat transportiga bog'liqlik yuqori.`, `${minutes} минут до метро — высокая зависимость от наземного транспорта.`, `${minutes} minutes to metro — heavy reliance on surface transport.`)
}

function amenityAdjustments(input: PropertyInput, deal: Deal): Adjustment[] {
  const out: Adjustment[] = []
  if (input.hasParking) {
    out.push(adj('parking', 1.03, "Ajratilgan avtoturargoh — markazda tanqis resurs.", 'Выделенное парковочное место — дефицитный ресурс в центре.', 'Dedicated parking — a scarce resource in central districts.'))
  }
  if (input.hasBalcony) {
    out.push(adj('balcony', 1.015, "Balkon/lodjiya mavjud — qo'shimcha foydali maydon.", 'Есть балкон или лоджия — дополнительная полезная площадь.', 'Balcony or loggia — additional usable space.'))
  }
  if (deal === 'rent' && input.isFurnished) {
    out.push(adj('furnished', 1.09, "Mebel va texnika bilan — ijarada sezilarli ustama.", 'С мебелью и техникой — заметная надбавка в аренде.', 'Furnished and equipped — a significant rental premium.'))
  }
  return out
}

function kindAdjustment(kind: PropertyInput['propertyKind']): Adjustment | null {
  // References are calibrated on apartments, the dominant listing type. Other
  // property kinds are expressed as a spread against that baseline.
  switch (kind) {
    case 'house':
      return adj('kind_house', 1.05, "Xovli uy — yer uchastkasi qiymati narxga qo'shiladi.", 'Частный дом — стоимость земельного участка входит в цену.', 'Detached house — the land parcel adds to the value.')
    case 'studio':
      return adj('kind_studio', 0.97, "Studiya — oilalar uchun mos emas, xaridorlar doirasi tor.", 'Студия — не подходит семьям, круг покупателей узкий.', 'Studio — unsuitable for families, so the buyer pool is narrow.')
    case 'commercial':
      return adj('kind_commercial', 1.12, "Tijorat ob'ekti — daromad keltiruvchi aktiv sifatida baholanadi.", 'Коммерческий объект — оценивается как доходный актив.', 'Commercial unit — priced as an income-producing asset.')
    default:
      return null
  }
}

/**
 * Builds the full ordered list of adjustments for a property. Order is
 * presentation order: the factors a user cares about most come first.
 */
export function buildAdjustments(input: PropertyInput, districtMetroMinutes: number | null, now = new Date().getFullYear()): Adjustment[] {
  const deal = input.deal
  const metroMinutes = input.metroMinutes ?? districtMetroMinutes

  const candidates: (Adjustment | null)[] = [
    conditionAdjustment(input.condition, deal),
    ageAdjustment(input.yearBuilt, now),
    materialAdjustment(input.buildingMaterial),
    ...floorAdjustments(input, deal),
    metroAdjustment(metroMinutes),
    sizeTaperAdjustment(input.size),
    layoutAdjustment(input.size, input.rooms),
    kindAdjustment(input.propertyKind),
    ...amenityAdjustments(input, deal),
  ]

  return candidates.filter((a): a is Adjustment => a !== null)
}

/** Counts attributes the user left blank, which widen the estimate interval. */
export function countUnknowns(input: PropertyInput): number {
  let n = 0
  if (!input.yearBuilt) n++
  if (!input.buildingMaterial || input.buildingMaterial === 'unknown') n++
  if (input.hasElevator === undefined) n++
  if (input.hasParking === undefined) n++
  return n
}
