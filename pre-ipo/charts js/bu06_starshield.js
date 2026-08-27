// ============================================================
// CHARTS: bu_06 — Starshield & Golden Dome (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 6 "Starshield & Golden Dome (Defense)",
//     probability-weighted, $M, 2026-2035.
// Audit result: CORRECT within rounding (worst ~3.8%, 2027 UFCF 1,200 vs 1,247).
//   Updated to exact spreadsheet values.
// ============================================================

// --- buChartDefs entry (replace key 6 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_6 = {
    6:{re:{r:[3334,4846,7086,10420,15402,20051,26187,34304,45064,59353],e:[1520,2250,3346,4997,7494,9866,13020,17221,22824,30306]},fc:[833,1247,1874,2826,4275,5665,7520,10000,13318,17761]},
};
