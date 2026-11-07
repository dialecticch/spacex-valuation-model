# SpaceX — Thesis & Valuation Memorandum

Dialectic's SpaceX thesis & valuation memorandum, hosted at **spacex.dialectic.com**.

## What is live

`public/index.html` is the deliverable: a single-file dashboard with
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

## Live physical-input model

`model.html` is the interactive valuation. It loads `data/baseline.json` at page load and recalculates in the browser with `assets/model/engine.js`. Nothing on the page writes the baseline. A news sweep should open a reviewable change to the JSON, not scrape numbers into the client.

The engine is a port of the 6 Nov 2026 v11 workbook (terrestrial compute, orbital data centres, Starlink including Starlink Mobile, launch, then an unlevered DCF). With the v11 presets loaded it reproduces bear $211.12, base $288.19 and bull $338.91 per share. Check that with:

```bash
node tests/value-model.test.js
```

The test locks `tests/fixtures/v11.json`. Updating the live baseline does not require editing the fixture.

### Update the baseline

Edit `data/baseline.json` only.

- `version` — integer. Bump it on every assumption change.
- `as_of` — ISO date the page shows as “Baseline as of …”.
- `changelog` — append an object with `version`, `date`, `note`, `source`, and `source_url` when you have a link. The page lists these and does not invent entries.
- `cases.bear`, `cases.base`, `cases.bull` — physical inputs. Keep bear ≤ base ≤ bull on volume inputs. Build cost runs the other way: the bear is the expensive case.
- `valuation` — WACC, terminal growth, horizon weights, share count, opening cash and debt, interest rates, and the cellular / M&A provision.

The workbook’s 65/30/5 weights blend the 5-year, 10-year and 20-year horizons inside each case. They are not probabilities on bear, base and bull. The page also offers an optional case blend, which is not a v11 cell.

Two workbook behaviours the page keeps:

- Segment enterprise values sum to more than consolidated enterprise value. The cellular and M&A provision ($50B a year, 2027–2030 in v11) sits only in consolidated capex. The workbook’s own reconciliation check is the same gap (about $155B in the base case).
- Interest is a financing memo. Fair value is unlevered. Changing the new-debt rate does not move fair value.

### Update videos and the X feed

- `data/videos.json` — `videos[]` with `youtube_id`, `title`, `source`, `year`. The page shows a still and loads the YouTube embed on click.
- `data/news.json` — `timeline.href` is the X profile or list embedded with X’s own widget (`platform.twitter.com/widgets.js`). `posts[]` takes `{ "url", "note" }` for pinned posts. No API key belongs in either file.
