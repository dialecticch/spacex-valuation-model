// ============================================================
// CHARTS: bu_12 — Terafab, Semiconductor Manufacturing (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 12 "Terafab — Semiconductor Manufacturing",
//     probability-weighted, $M, 2026-2035. Revenue starts 2031 (chart and
//     page copy agree: "We model revenues from 2031").
// Audit result: CORRECT within rounding (worst ~1.6%, 2031 EBITDA 2,000 vs 1,969).
//   Updated to exact spreadsheet values.
// Page copy check: "Base EV (10yr): $54B" matches Sum of Parts ($53,957M ≈ $54B). ✓
// ============================================================

// --- buChartDefs entry (replace key 12 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_12 = {
    12:{re:{r:[0,0,0,0,0,4500,7444,12457,21074,36021],e:[0,0,0,0,0,1969,3340,5723,9895,17250]},fc:[0,0,0,0,0,419,819,1567,2963,5556]},
};
