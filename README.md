# SpaceX — Thesis & Valuation Memorandum

Dialectic's SpaceX thesis & valuation memorandum, hosted at **spacex.dialectic.com**.

## What is live

`public/spacex-dashboard.html` is the deliverable: a single-file dashboard with
interactive Chart.js (v4.4.4) charts inlined and content self-contained. It is served
at `/` via the `vercel.json` rewrite and needs no backend. It loads two assets from
CDNs at runtime: Font Awesome icons and an optional Google Translate widget.

## Source artifacts

`Data/model` holds the source material for provenance:
- `Dialectic-SpaceX_Valuation_Model.xlsx` — the financial model.


## Future dynamic rebuild

`src/components/{CompsTable,ScenarioCalc,PolymarketDistribution}.tsx` (with the
minimal `src/lib/{format,types}.ts` they import) are carried as a starting point for
a future dynamic Next.js version. **They are not wired into any rendered route yet** —
the live site is the static HTML above.

## Develop

```bash
npm install
npm run build
```
