// ============================================================
// TABLE: chart_07_sensitivity — WACC × Terminal Growth sensitivity grid
//   (rendered by sensitivityTableMarkup(), not a Chart.js chart)
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Sensitivities sheet, "Table 1: Blended Enterprise Value ($M) — WACC × g",
//     $M → $B 0dp. Base cell (WACC 9.0% / g 4.0%) = $2,424B, consistent with
//     the Summary sheet's blended EV $2,421B.
// Fixes vs old table:
//   1. ALL 25 cells were stale (~4-7% high, old model run) — e.g. base cell
//      $2,646 → $2,424; corners $3,276 → $3,126 and $2,164 → $1,916.
//   2. Title said "Blended EQUITY Value" — the sheet table is ENTERPRISE value
//      (equity table doesn't exist on the sheet; Table 2 there is $/share).
//   Heat-map classes (up-1..4 / down-1..3 / base-cell) kept in the same
//   relative layout — the gradient pattern is unchanged.
// Also updated: chartImageMap.chart_07_sensitivity source note (both files).
// ============================================================

// --- sensitivityTableMarkup(): replace the rows const and the title line ---
const sensitivityRows = [
    ["7.5%", ["$3,126","up-1"], ["$3,461","up-2"], ["$3,891","up-3"], ["$4,465","up-4"], ["$5,268","up-4"]],
    ["8.25%", ["$2,524","up-1"], ["$2,746","up-1"], ["$3,020","up-1"], ["$3,367","up-2"], ["$3,821","up-3"]],
    ["9.0%", ["$2,085","down-1"], ["$2,239","down-1"], ["$2,424","base-cell"], ["$2,650","up-1"], ["$2,933","up-2"]],
    ["9.75%", ["$1,753","down-2"], ["$1,864","down-1"], ["$1,995","down-1"], ["$2,150","down-1"], ["$2,339","down-1"]],
    ["10.5%", ["$1,495","down-3"], ["$1,578","down-2"], ["$1,673","down-2"], ["$1,784","down-1"], ["$1,916","down-1"]]
];
// Title: "Blended Enterprise Value ($B): WACC x Terminal Growth"
