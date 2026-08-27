// ============================================================
// CHART: bu_01 — Launch Services & Lunar Vehicles (Revenue & EBITDA + UFCF panels)
//        + Launch series of the consolidated revenue stacked chart
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 1 "Launch Services" (revenue), plus matching
//     EBITDA and UFCF rows — consolidated values incl. consolidation
//     adjustment, consistent with the other 11 BU charts.
// Fix: old values were from a stale model run, ~5-9% low across all
//   three series (e.g. 2035 revenue 194,100 → 207,734).
// ============================================================

// --- 1. buChartDefs entry (replace key 1 in buChartDefs) ---
const buChartDefs_1 = {
    1:{re:{r:[12092,17315,24923,36047,52361,68583,90115,118746,156877,207734],e:[5573,8121,11874,17417,25619,33981,45156,60108,80130,106967]},fc:[1090,1728,2710,4213,6505,8945,12262,16765,22873,31154]},
};

// --- 2. revenue stacked chart — replace the Launch Services dataset line: ---
// {label:"Launch Services",data:[12.1,17.3,24.9,36,52.4,68.6,90.1,118.7,156.9,207.7],backgroundColor:RED_SOFT},
// (With this fix the 2035 stack sums to ~$1,063B, matching the P&L total revenue row.)
