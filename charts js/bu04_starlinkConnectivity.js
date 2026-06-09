// ============================================================
// CHARTS: bu_04 — Starlink Connectivity (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 4 "Starlink Connectivity (Consumer + Av/Mar)",
//     probability-weighted, $M, 2026-2035.
// Audit result: CORRECT within rounding (worst ~0.7%, 2026 UFCF 5,100 vs 5,134).
//   Updated to exact spreadsheet values.
// ============================================================

// --- buChartDefs entry (replace key 4 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_4 = {
    4:{re:{r:[15010,21334,30534,44000,63826,83367,109233,143531,189089,249694],e:[9337,13377,19294,28008,40914,53623,70473,92852,122617,162261]},fc:[5134,7395,10717,15627,22922,29935,39205,51479,67757,89379]},
};
