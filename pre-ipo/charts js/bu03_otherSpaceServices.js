// ============================================================
// CHARTS: bu_03 — Other Space Services (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 3 "Other Space Services", probability-weighted, $M.
// Audit result: CORRECT. UFCF was exact; revenue/EBITDA had coarse rounding
//   on 2033-2035 only (1300/1700/2200 → 1269/1662/2180; 1300 → 1272). Max ~2.4%.
// NOTE for the page copy (not the chart): the section header says
//   "Base EV (10yr): $2B" — the Sum of Parts sheet says Other Space Services
//   Base EV = $6.1B ($6,108M). The $2B looks stale; consider fixing the text.
// ============================================================

// --- buChartDefs entry (replace key 3 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_3 = {
    3:{re:{r:[150,207,288,405,574,746,972,1269,1662,2180],e:[78,110,157,224,321,421,554,729,962,1272]},fc:[32,46,66,96,139,184,243,322,428,569]},
};
