# Mulk Tahlilchi — product and business model

## 1. The market, honestly

Uzbekistan has ~37 million people, a fast-urbanising capital, and a housing stock
that functions as the country's primary savings vehicle. People hold wealth in
apartments because they distrust holding it in som. That makes property pricing
unusually consequential: a 15% pricing error is not a bad trade, it is a
meaningful share of a family's net worth.

And pricing errors are everywhere, because of one structural fact:

> **There is no MLS and no open register of transaction prices.**

The Kadastr agency records transfers, but price-level data is not openly
queryable. What the public can see is *asking prices*, scattered across OLX.uz
(dominant), Uybor.uz, Joyla.uz, and — very significantly — Telegram channels,
where a large share of deals are actually negotiated.

The consequences follow directly:

| Participant | What they don't know | What it costs them |
|---|---|---|
| Buyer | What the flat is worth | Overpays, or freezes and misses |
| Seller | What it will actually clear at | Lists 20% high, sits for months |
| Agent (*rieltor*) | Only marginally more than either | Trust is low; commission is contested |
| Bank | Collateral value | Slow, manual, discretionary appraisal |
| Developer | Competitor price ladder | Prices new stock by instinct |

Information asymmetry *is* the market failure. Everything below follows from
attacking it.

## 2. Why the original product was not yet a business

The first version answered "rate this apartment 1-10". That is a demo, not a
company, for four reasons:

1. **No moat.** The scoring rules were hand-written constants. A competent
   developer could reproduce them in a weekend.
2. **No repeat use.** You value one flat and leave. There is no reason to return.
3. **Nothing to sell.** Nobody pays for a score.
4. **Not checkable.** The cross-platform comparison was fabricated —
   `Math.random()` listing counts against a scaled baseline. A user who verified
   one number against OLX would never come back, and would be right not to.

The engine rebuild in this repository fixes (4), which is a precondition for
everything else. The rest of this document is about (1) through (3).

## 3. The thesis

> **Become the price reference layer for Uzbek real estate.**

The wedge is a specific, currently-unexploited insight:

> **You can infer clearing prices without an MLS by tracking listing lifecycles.**

A listing that appears at $92,000, drops to $84,000 over six weeks, then
disappears, tells you a great deal about where that flat actually cleared. One
listing is noise. Two years of every listing in Tashkent, tracked daily, is the
only transaction-price proxy dataset in the country.

That dataset has the property every real moat needs: **it cannot be back-filled.**
A competitor starting in 2027 cannot reconstruct 2026's price cuts. Every month of
operation widens the gap.

The model itself is not the moat. Hedonic regression is a solved, commodity
technique — this repository implements it in a few hundred readable lines
precisely because it is not the hard part. The moat is data, distribution and
trust, in that order.

## 4. Product ladder

### Layer 1 — Free consumer valuation *(funnel and data intake)*

What exists today, done honestly: a fair-value range, a verdict, and a negotiation
number. Purpose is not revenue. Purpose is traffic, SEO surface, and — critically
— **transaction price contribution**. After a valuation, ask the one question that
matters:

> *"Did you buy it? What did it actually close at?"*

Self-reported closing prices are noisy and biased, but they are the only realistic
path to real transaction data in a market with no register, and they arrive free
from a funnel you are already running.

### Layer 2 — Consumer Pro

Recurring reasons to come back, which a one-shot valuation lacks:

- **Price alerts** on saved searches ("2-room in Chilonzor under $70k").
- **Full report as PDF**, for the family conversation and the bank.
- **Negotiation script** — what to say, in Uzbek and Russian.
- **Document checklist.** Title and ownership verification anxiety is acute here
  and almost entirely unserved. This is a trust product as much as a data one.

### Layer 3 — Agent SaaS *(first real revenue)*

Agents have the highest near-term willingness to pay, because the tool makes them
money directly rather than saving them money.

- **Branded CMA reports.** An agent walks into a listing appointment with a
  data-backed price recommendation carrying their own name on it. This is how
  agent tools sell in every market: it wins them the listing.
- **"What will it clear at, and how long will it take?"** Pricing the seller's
  expectations down is the hardest conversation in the job. Doing it with a
  neutral third-party number instead of the agent's own opinion is worth the
  subscription on its own.
- **Listing performance** — your listing's price position against its district.
- **Lead widget** for the agent's own site or Telegram channel.

Position this as *the agent's tool*, never as the agent's replacement. An
adversarial posture toward agents loses the segment that both pays first and holds
the transaction data.

### Layer 4 — Institutional

- **Developers.** Absorption rates, competitor price per m² by project, and an
  optimal price ladder by floor, view and layout. Sold per project, per month.
- **Banks.** An AVM API for mortgage collateral assessment. Uzbekistan is
  digitising mortgage origination; automated valuation removes cost, delay and
  discretion from the appraisal step. Sold per call, or as an annual licence.

## 5. Pricing

| Tier | Price | Rationale |
|---|---|---|
| Free | 0 | 5 valuations/month. Funnel and data intake. |
| Pro | ~39,000 UZS/mo | Consumer. Priced as an impulse, not a decision. |
| Agent | ~349,000 UZS/mo per seat | Pays for itself on one won listing. |
| Agency | from ~1,500,000 UZS/mo | Multi-seat, API, branded reports. |
| Developer | from $500/mo per project | Sold against a marketing budget, not an IT budget. |
| Bank AVM API | from $0.30/call at volume | Priced against manual appraisal cost. |

Sequencing matters more than the numbers. Consumer subscriptions convert poorly
at scale in Uzbekistan even with Click and Payme reducing friction. **Agent SaaS
is the realistic first revenue line.** Institutional is where the money is, but
carries a long sales cycle — start those conversations early and expect nothing
for a year.

## 6. Go to market

**Telegram is the channel.** Uzbek real estate already lives there. The single
highest-leverage growth product is a bot that takes a forwarded OLX or Uybor link
and returns a verdict:

```
User forwards a listing  →  bot replies with fair range, verdict, target price
```

That spreads inside the groups where deals are already being negotiated, at zero
marginal cost, and it doubles as the cheapest possible listing-ingestion channel.

**SEO is the durable second channel.** Generate district × property-type pages
from the dataset — *"Chilonzorda kvartira narxi"*, *"цена квартиры Ташкент
Юнусабад"*. These pages are genuinely useful because the data is real, which is
what makes the channel durable rather than a growth hack.

**Agent partnerships as data barter.** Give the CMA tool free to the first 200
agents in exchange for reported closing prices. Tools for data is a fair trade
that both sides understand, and it seeds the dataset the moat depends on.

## 7. Build sequence

Ordered by how much each step increases either the moat or trust.

1. **Ingestion pipeline** — OLX and Uybor, daily, with full listing-lifecycle
   tracking (price changes and delistings, not just current state). This is the
   moat. Everything else is downstream. On completion, `DATASET.basis` in
   [`lib/market/reference.ts`](../lib/market/reference.ts) flips from
   `calibrated-model` to `observed` and no consumer of that module has to change.
2. **Real comparables** — show the eight listings behind each estimate. This is
   the single largest trust upgrade available, because it converts the product
   from "trust our number" to "here is the evidence, check it yourself".
3. **Telegram bot** with listing-URL parsing.
4. **Accounts**, saved properties, price alerts.
5. **Agent CMA report** — branded PDF.
6. **Publish the model's accuracy.** Backtest against observed clearing prices and
   put the MAPE on the site. Nobody in this market will publish their own error
   rate. Doing it is the strongest available trust signal, and it is only possible
   once step 1 has run long enough to have ground truth.

## 8. Defensibility

- **Data** — lifecycle history compounds and cannot be reconstructed later.
- **Distribution** — Telegram presence and SEO surface, both cumulative.
- **Trust** — published accuracy and a visible method.

Not the model. State that plainly rather than claiming AI sophistication the
product does not have; the credibility is worth more than the mystique.

## 9. Risks

| Risk | Mitigation |
|---|---|
| OLX blocks scraping | Multi-source from day one; open a partnership conversation early; Telegram ingestion is not blockable the same way |
| Users distrust an unbranded valuation | Show comparables, show the method, publish the error rate |
| Agents treat it as a threat | Ship the agent tool early; make them the distribution channel, not the target |
| USD/UZS volatility distorts the series | Store both currencies, index the model on USD, display either |
| Asking prices drift from clearing prices | This is why lifecycle tracking is step 1 rather than step 5 |
| Thin regional data produces confident nonsense | Already handled in the engine: sample size widens the interval and triggers a `low_sample` caveat |

## 10. What "better" meant in this rebuild

The engine changes in this repository were chosen to make the business above
possible, not merely to tidy the code:

- **Fabricated data removed.** No product built on invented comparables can ever
  publish an accuracy figure, and without that there is no institutional tier.
- **Price verdict separated from asset quality.** A blended score cannot answer
  "is this priced correctly?", which is the only question a bank or a negotiating
  buyer is paying for.
- **Uncertainty made explicit.** An AVM that cannot express its own confidence is
  unsellable to a lender. The interval is a product feature, not a hedge.
- **Data provenance carried through to the UI.** `DATASET.basis` and the caveat
  list mean the product can be honest today about being a model, and can become
  honest tomorrow about being observed — without a rewrite.
