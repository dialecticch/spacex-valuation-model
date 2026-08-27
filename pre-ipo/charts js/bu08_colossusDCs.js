// ============================================================
// CHARTS: bu_08 — Colossus Terrestrial Data Centres (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 8 "Colossus Terrestrial Data Centres",
//     probability-weighted, $M, 2026-2035.
// Audit result: CORRECT within rounding (worst ~0.9%, 2027 UFCF 2,000 vs 1,982).
//   Updated to exact spreadsheet values.
// Page copy check: "Base EV (10yr): $329B" matches the Sum of Parts sheet
//   (Colossus DCs base EV $328,725M). ✓
// ============================================================

// --- buChartDefs entry (replace key 8 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_8 = {
    8:{re:{r:[15768,22468,32285,46754,68192,85855,108313,136906,173363,219905],e:[10763,15493,22469,32811,48216,60945,77173,97886,124359,158231]},fc:[1210,1982,3192,5080,8020,10506,13741,17953,23432,30558]},
};
