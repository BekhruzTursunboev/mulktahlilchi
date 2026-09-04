# Mulk Tahlilchi

**Independent price analysis for the Uzbek property market.**
Estimate what a property is actually worth, compare it against the asking price,
and get a concrete number to negotiate with — in Uzbek, Russian or English.

---

## What it does

Given a property's location and attributes, the app returns:

- a **fair-value estimate** with an explicit confidence interval,
- a **price verdict** — below / at / above market — derived only from where the
  asking price sits against that interval,
- a **quality score** for the asset itself, deliberately independent of its price,
- **investment metrics** (achievable rent, gross and net yield, payback),
- a **mortgage scenario** at realistic Uzbek commercial rates,
- **negotiation guidance** — an opening offer, a target, and a walk-away price,
- the **caveats** that apply to that particular estimate.

## How the estimate is built

```
district median $/m²  ×  Π(hedonic adjustments)  ×  size   =  fair value
                          ↓
        condition · building age · material · floor position
        metro access · size taper · layout · amenities
```

The interval around that point estimate widens with three genuine sources of
doubt: how heterogeneous the district's stock is, how thin the reference sample
is, and how many attributes the user left blank.

Two invariants hold the model together, and both are enforced by tests:

1. **Location is counted exactly once**, through the district median. It is never
   re-added as a separate score.
2. **The estimate never reads the asking price.** It must be computable without
   knowing what the seller wants, otherwise the asking price anchors its own
   assessment.

The verdict then compares the asking price against that price-blind estimate. A
price *inside* the interval is `fair` by definition — claiming to detect a bargain
inside your own margin of error is false precision.

## Data honesty

`lib/market/reference.ts` carries a `DATASET` block declaring what the numbers
are. Today `basis` is `calibrated-model`: price levels are anchored to published
market reporting, not to a live scrape. That declaration is surfaced all the way
into the UI as a caveat the user always sees.

All figures describe **asking prices**. Uzbekistan has no open register of
transaction prices, and closing prices are typically lower. The app says so on
every report rather than burying it.

Nothing in the engine is random. `valuate()` is pure — same input, same output —
so a report is reproducible and can be disputed number by number.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Valuation engine test suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## API

### `POST /api/valuation`

```jsonc
{
  "property": {
    "deal": "sale",              // "sale" | "rent"
    "regionSlug": "tashkent-city",
    "districtSlug": "chilonzor",
    "price": 82000,              // USD; monthly for rent
    "size": 62,                  // m²
    "rooms": 2,
    "floor": 3,
    "totalFloors": 9,
    "propertyKind": "apartment", // apartment | house | studio | commercial
    "condition": "good",         // new | renovated | good | needs_renovation | shell
    "yearBuilt": 1992,           // optional — omitting it widens the interval
    "buildingMaterial": "panel", // optional
    "hasElevator": true          // optional
  },
  "mortgage": { "downPaymentPct": 25, "annualRatePct": 20, "termYears": 15 }
}
```

Returns a `ValuationReport` (see `lib/valuation/types.ts`). Errors come back as
stable codes — `validation_failed`, `unknown_location`, `rate_limited` — never as
prose, so the client renders them in the user's own language.

Rate limited to 20 requests per minute per client.

### `GET /api/market[?region=<slug>]`

The geography and the price references behind it, so the market data can be
inspected independently of any valuation.

## Layout

```
app/
  api/valuation/    POST — full valuation report
  api/market/       GET  — geography + price references
components/         Form, report, price ruler, UI primitives
lib/
  market/geo.ts        14 regions, Tashkent's 12 districts, metro proximity
  market/reference.ts  Price references + dataset provenance
  valuation/           Adjustments, model, investment, negotiation
  i18n/                uz / ru / en
docs/PRODUCT.md        Business model and build sequence
```

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Zod · `node:test`

No database yet — the reference dataset is a typed module, which is the right
amount of machinery until the ingestion pipeline described in
[`docs/PRODUCT.md`](docs/PRODUCT.md) lands.

## Roadmap

See [`docs/PRODUCT.md`](docs/PRODUCT.md). The next step that matters most is
listing-lifecycle ingestion from OLX and Uybor, which flips `DATASET.basis` from
`calibrated-model` to `observed` without any consumer of that module changing.
