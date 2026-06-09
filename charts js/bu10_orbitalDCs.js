// ============================================================
// CHARTS: bu_10 — Orbital Data Centers (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 9 "Orbital Data Centres" (buChartDefs key is 10),
//     probability-weighted, $M, 2026-2035. Revenue starts 2031; UFCF dips
//     to -$51M in 2031 (launch-year capex) before turning positive.
// Audit result: CORRECT within rounding (worst ~3%, 2034 UFCF 1,200 vs 1,237).
//   Updated to exact spreadsheet values.
// Page copy check: "Base EV (10yr): $27B" matches Sum of Parts ($26,712M ≈ $27B). ✓
//   But the copy says "first commercial deployment is modeled around 2030" —
//   the model's base case starts revenue in 2031 (Orbital_DCs!B13: "First
//   commercial 2031 (base)"), consistent with the chart. Consider "around 2031".
// ============================================================

// --- buChartDefs entry (replace key 10 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_10 = {
    10:{re:{r:[0,0,0,0,0,8600,14300,23942,40336,68341],e:[0,0,0,0,0,4530,7653,13005,22218,38140]},fc:[0,0,0,0,0,-51,103,464,1237,2814]},
};
