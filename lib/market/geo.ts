/**
 * Canonical geography for Uzbekistan real estate.
 *
 * Every location the product reasons about must resolve to a `LocationRef`.
 * The old engine matched free-text city names with `String.includes()`, which
 * silently mis-scored anything the user spelled differently ("Toshkent" vs
 * "Tashkent" vs "Ташкент"). Locations are now identified by stable slugs and
 * resolved once, at the edge of the system.
 */

export type RegionSlug =
  | 'tashkent-city'
  | 'tashkent-region'
  | 'samarqand'
  | 'buxoro'
  | 'andijon'
  | 'namangan'
  | 'fargona'
  | 'qashqadaryo'
  | 'surxondaryo'
  | 'jizzax'
  | 'sirdaryo'
  | 'navoiy'
  | 'xorazm'
  | 'qoraqalpogiston'

export interface LocalizedName {
  uz: string
  ru: string
  en: string
}

export interface District {
  slug: string
  name: LocalizedName
  /** Approximate centroid, used for distance-based reasoning and maps. */
  center: { lat: number; lng: number }
  /**
   * Walking minutes to the nearest metro station, or `null` where no metro
   * exists. Tashkent has the only metro in the country and proximity to it is
   * one of the few location signals that is both observable and priced.
   */
  metroMinutes: number | null
}

export interface Region {
  slug: RegionSlug
  name: LocalizedName
  /** The capital behaves as its own market, not as one region among fourteen. */
  isCapital: boolean
  districts: District[]
}

/**
 * Tashkent city. These are the real administrative `tuman` divisions, which is
 * also the granularity listing sites use, so user input maps onto them cleanly.
 */
const TASHKENT_DISTRICTS: District[] = [
  { slug: 'mirobod', name: { uz: 'Mirobod', ru: 'Мирабадский', en: 'Mirobod' }, center: { lat: 41.2856, lng: 69.2822 }, metroMinutes: 6 },
  { slug: 'yakkasaroy', name: { uz: 'Yakkasaroy', ru: 'Яккасарайский', en: 'Yakkasaroy' }, center: { lat: 41.2833, lng: 69.25 }, metroMinutes: 7 },
  { slug: 'shayxontohur', name: { uz: 'Shayxontohur', ru: 'Шайхантахурский', en: 'Shaykhantakhur' }, center: { lat: 41.3167, lng: 69.2333 }, metroMinutes: 8 },
  { slug: 'mirzo-ulugbek', name: { uz: "Mirzo Ulug'bek", ru: 'Мирзо-Улугбекский', en: 'Mirzo Ulugbek' }, center: { lat: 41.3389, lng: 69.335 }, metroMinutes: 12 },
  { slug: 'yunusobod', name: { uz: 'Yunusobod', ru: 'Юнусабадский', en: 'Yunusobod' }, center: { lat: 41.3639, lng: 69.2894 }, metroMinutes: 10 },
  { slug: 'chilonzor', name: { uz: 'Chilonzor', ru: 'Чиланзарский', en: 'Chilonzor' }, center: { lat: 41.2758, lng: 69.2044 }, metroMinutes: 8 },
  { slug: 'olmazor', name: { uz: 'Olmazor', ru: 'Алмазарский', en: 'Olmazor' }, center: { lat: 41.3475, lng: 69.2033 }, metroMinutes: 14 },
  { slug: 'uchtepa', name: { uz: 'Uchtepa', ru: 'Учтепинский', en: 'Uchtepa' }, center: { lat: 41.2894, lng: 69.1806 }, metroMinutes: 15 },
  { slug: 'yashnobod', name: { uz: 'Yashnobod', ru: 'Яшнабадский', en: 'Yashnobod' }, center: { lat: 41.29, lng: 69.3283 }, metroMinutes: 13 },
  { slug: 'sergeli', name: { uz: 'Sergeli', ru: 'Сергелийский', en: 'Sergeli' }, center: { lat: 41.2231, lng: 69.2192 }, metroMinutes: 11 },
  { slug: 'bektemir', name: { uz: 'Bektemir', ru: 'Бектемирский', en: 'Bektemir' }, center: { lat: 41.2094, lng: 69.3389 }, metroMinutes: null },
  { slug: 'yangihayot', name: { uz: 'Yangihayot', ru: 'Янгихаётский', en: 'Yangihayot' }, center: { lat: 41.1969, lng: 69.2611 }, metroMinutes: null },
]

/**
 * Outside the capital the product reasons at city level rather than district
 * level. Regional listing volume is too thin for district references to carry
 * meaning, and claiming that precision would be dishonest.
 */
function city(slug: string, uz: string, ru: string, lat: number, lng: number): District {
  return { slug, name: { uz, ru, en: uz }, center: { lat, lng }, metroMinutes: null }
}

export const REGIONS: Region[] = [
  {
    slug: 'tashkent-city',
    name: { uz: 'Toshkent shahri', ru: 'город Ташкент', en: 'Tashkent City' },
    isCapital: true,
    districts: TASHKENT_DISTRICTS,
  },
  {
    slug: 'tashkent-region',
    name: { uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent Region' },
    isCapital: false,
    districts: [
      city('chirchiq', 'Chirchiq', 'Чирчик', 41.4689, 69.5822),
      city('angren', 'Angren', 'Ангрен', 41.0167, 70.1436),
      city('olmaliq', 'Olmaliq', 'Алмалык', 40.8447, 69.5983),
      city('yangiyol', "Yangiyo'l", 'Янгиюль', 41.1122, 69.0453),
      city('bekobod', 'Bekobod', 'Бекабад', 40.2206, 69.2694),
      city('nurafshon', 'Nurafshon', 'Нурафшан', 41.0244, 69.3536),
      city('zangiota', 'Zangiota', 'Зангиата', 41.1806, 69.1069),
    ],
  },
  {
    slug: 'samarqand',
    name: { uz: 'Samarqand viloyati', ru: 'Самаркандская область', en: 'Samarkand Region' },
    isCapital: false,
    districts: [
      city('samarqand-shahri', 'Samarqand shahri', 'город Самарканд', 39.6542, 66.9597),
      city('kattaqorgon', "Kattaqo'rg'on", 'Каттакурган', 39.8994, 66.2661),
      city('urgut', 'Urgut', 'Ургут', 39.4033, 67.2436),
    ],
  },
  {
    slug: 'buxoro',
    name: { uz: 'Buxoro viloyati', ru: 'Бухарская область', en: 'Bukhara Region' },
    isCapital: false,
    districts: [
      city('buxoro-shahri', 'Buxoro shahri', 'город Бухара', 39.7681, 64.4556),
      city('kogon', 'Kogon', 'Каган', 39.7222, 64.5528),
      city('gijduvon', "G'ijduvon", 'Гиждуван', 40.1022, 64.6844),
    ],
  },
  {
    slug: 'andijon',
    name: { uz: 'Andijon viloyati', ru: 'Андижанская область', en: 'Andijan Region' },
    isCapital: false,
    districts: [
      city('andijon-shahri', 'Andijon shahri', 'город Андижан', 40.7821, 72.3442),
      city('asaka', 'Asaka', 'Асака', 40.6394, 72.2372),
      city('xonobod', 'Xonobod', 'Ханабад', 40.8092, 72.9628),
    ],
  },
  {
    slug: 'namangan',
    name: { uz: 'Namangan viloyati', ru: 'Наманганская область', en: 'Namangan Region' },
    isCapital: false,
    districts: [
      city('namangan-shahri', 'Namangan shahri', 'город Наманган', 40.9983, 71.6726),
      city('chust', 'Chust', 'Чуст', 41.0006, 71.2394),
      city('kosonsoy', 'Kosonsoy', 'Касансай', 41.2506, 71.5497),
    ],
  },
  {
    slug: 'fargona',
    name: { uz: "Farg'ona viloyati", ru: 'Ферганская область', en: 'Fergana Region' },
    isCapital: false,
    districts: [
      city('fargona-shahri', "Farg'ona shahri", 'город Фергана', 40.3894, 71.7828),
      city('qoqon', "Qo'qon", 'Коканд', 40.5286, 70.9425),
      city('margilon', "Marg'ilon", 'Маргилан', 40.4711, 71.7247),
      city('quvasoy', 'Quvasoy', 'Кувасай', 40.2911, 71.9744),
    ],
  },
  {
    slug: 'qashqadaryo',
    name: { uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область', en: 'Kashkadarya Region' },
    isCapital: false,
    districts: [
      city('qarshi', 'Qarshi', 'Карши', 38.8606, 65.7889),
      city('shahrisabz', 'Shahrisabz', 'Шахрисабз', 39.0578, 66.8283),
      city('muborak', 'Muborak', 'Мубарек', 39.2578, 65.1503),
    ],
  },
  {
    slug: 'surxondaryo',
    name: { uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область', en: 'Surkhandarya Region' },
    isCapital: false,
    districts: [
      city('termiz', 'Termiz', 'Термез', 37.2242, 67.2783),
      city('denov', 'Denov', 'Денау', 38.2711, 67.8944),
      city('sherobod', 'Sherobod', 'Шерабад', 37.6717, 67.0011),
    ],
  },
  {
    slug: 'jizzax',
    name: { uz: 'Jizzax viloyati', ru: 'Джизакская область', en: 'Jizzakh Region' },
    isCapital: false,
    districts: [
      city('jizzax-shahri', 'Jizzax shahri', 'город Джизак', 40.1158, 67.8422),
      city('gallaorol', "G'allaorol", 'Галляарал', 40.03, 67.6014),
    ],
  },
  {
    slug: 'sirdaryo',
    name: { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область', en: 'Syrdarya Region' },
    isCapital: false,
    districts: [
      city('guliston', 'Guliston', 'Гулистан', 40.4897, 68.7842),
      city('yangiyer', 'Yangiyer', 'Янгиер', 40.2589, 68.8225),
      city('shirin', 'Shirin', 'Ширин', 40.2233, 69.0181),
    ],
  },
  {
    slug: 'navoiy',
    name: { uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoiy Region' },
    isCapital: false,
    districts: [
      city('navoiy-shahri', 'Navoiy shahri', 'город Навои', 40.0844, 65.3792),
      city('zarafshon', 'Zarafshon', 'Зарафшан', 41.5772, 64.2028),
      city('kermana', 'Kermana', 'Кермине', 40.1489, 65.3789),
    ],
  },
  {
    slug: 'xorazm',
    name: { uz: 'Xorazm viloyati', ru: 'Хорезмская область', en: 'Khorezm Region' },
    isCapital: false,
    districts: [
      city('urganch', 'Urganch', 'Ургенч', 41.5506, 60.6314),
      city('xiva', 'Xiva', 'Хива', 41.3783, 60.3639),
      city('pitnak', 'Pitnak', 'Питнак', 41.1697, 61.3597),
    ],
  },
  {
    slug: 'qoraqalpogiston',
    name: { uz: "Qoraqalpog'iston Respublikasi", ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan' },
    isCapital: false,
    districts: [
      city('nukus', 'Nukus', 'Нукус', 42.4531, 59.6103),
      city('xojayli', 'Xo‘jayli', 'Ходжейли', 42.4067, 59.4506),
      city('beruniy', 'Beruniy', 'Беруни', 41.6906, 60.7528),
      city('mongit', 'Mo‘ynoq', 'Муйнак', 43.7683, 59.0294),
    ],
  },
]

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

const REGIONS_BY_SLUG = new Map(REGIONS.map((r) => [r.slug, r]))

export interface LocationRef {
  region: Region
  district: District
}

export function findRegion(slug: string): Region | null {
  return REGIONS_BY_SLUG.get(slug as RegionSlug) ?? null
}

/**
 * Resolves a `region/district` slug pair to concrete records. Returns `null`
 * rather than falling back to a default: an unknown location must surface as an
 * error, never as a silent guess priced off some arbitrary baseline.
 */
export function resolveLocation(regionSlug: string, districtSlug: string): LocationRef | null {
  const region = findRegion(regionSlug)
  if (!region) return null
  const district = region.districts.find((d) => d.slug === districtSlug)
  if (!district) return null
  return { region, district }
}

/** Flat list of `region/district` pairs, for populating selects. */
export function allLocations(): LocationRef[] {
  return REGIONS.flatMap((region) => region.districts.map((district) => ({ region, district })))
}
