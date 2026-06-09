# SpaceX Thesis & Valuation — Interactive Dashboard

A self-contained, single-page interactive dashboard presenting the SpaceX
investment thesis and valuation. All charts are **live, interactive Chart.js
canvases** (rendered client-side) and the sensitivity analysis is a real HTML
table — no chart images.

## Run

It's a static site with no build step. Either open `index.html` directly, or
serve the folder (recommended, so all assets load cleanly):

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Structure

```
index.html                     # the entire dashboard (markup + styles + app script)
assets/
  chart.umd.js                 # Chart.js 4.4.4
  charts-interactive.js        # chart definitions + data + interactive engine
  dashboard-controls.js        # PDF export / controls
  html2canvas.min.js           # PDF export dependency
  jspdf.umd.min.js             # PDF export dependency
  spacex-logo.svg
  fonts/                       # Dialectic + Britti Sans
  hero/                        # section hero imagery
  backgrounds/                 # landing hero photo rotation
video/
  placeholder-launch-loop.mp4
```

## Editing chart data

All chart numbers live in `assets/charts-interactive.js`:

- Shared series: `launchCats`, `starRevenue/Ebitda/Subs/Margin`,
  `sotpContributions`, `buChartDefs` (the 12 business units).
- Per-chart literals inside each factory in `chartFactories`
  (`horizon`, `monteCarlo`, `revenue`, `comps`, `tornado`, …).

The WACC × terminal-growth sensitivity **table** values are in `index.html`
(the `ixSensitivityTable()` function).
