// ============================================================
// CHARTS: bu_02 — Crewed Spaceflight (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 2 "Crewed Spaceflight" (revenue, EBITDA, UFCF rows),
//     probability-weighted, $M, 2026-2035.
// Audit result: old values were CORRECT within rounding (worst ~2%,
//   e.g. 2029 UFCF 1,800 vs 1,762). Updated to exact spreadsheet values.
// ============================================================

// --- buChartDefs entry (replace key 2 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_2 = {
    2:{re:{r:[2448,3052,3818,4795,6046,7306,8813,10659,12926,15717],e:[1283,1612,2033,2573,3267,3969,4825,5879,7178,8783]},fc:[873,1100,1390,1762,2242,2715,3305,4031,4925,6028]},
};
