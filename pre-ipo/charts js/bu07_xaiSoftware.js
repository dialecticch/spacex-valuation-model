// ============================================================
// CHARTS: bu_07 — xAI Software (Grok + API) (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 7 "xAI Software (Grok + API)",
//     probability-weighted, $M, 2026-2035.
// Audit result: CORRECT within rounding (worst ~1.7%, 2027 rev 3,500 vs 3,451).
//   Updated to exact spreadsheet values.
// NOTE for the page copy (not the chart): the section header says
//   "Base EV (10yr): $144B" — the Sum of Parts sheet says xAI Software
//   Base EV = $86B ($85,945M). The $144B looks stale; fix the text.
// ============================================================

// --- buChartDefs entry (replace key 7 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_7 = {
    7:{re:{r:[2298,3451,5221,7954,12200,16977,23692,33149,46493,65349],e:[1094,1684,2610,4067,6372,8983,12689,17956,25452,36129]},fc:[230,360,565,891,1413,2005,2851,4059,5787,8261]},
};
