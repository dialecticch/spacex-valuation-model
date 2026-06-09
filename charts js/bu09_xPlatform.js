// ============================================================
// CHARTS: bu_09 — X Platform & XMoney (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 11 "X Platform" (the buChartDefs key is 9 —
//     JS key order differs from P&L line order), probability-weighted, $M.
// Audit result: CORRECT within rounding (worst ~2.4%, 2027 EBITDA 1,100 vs 1,074).
//   Updated to exact spreadsheet values.
// Page copy check: "Base EV (10yr): $54B" ≈ Sum of Parts X Platform base EV
//   $53,475M → rounds to $53B. Close enough, but $53B is the precise figure.
// ============================================================

// --- buChartDefs entry (replace key 9 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_9 = {
    9:{re:{r:[4080,5678,7944,11169,15774,19373,23856,29453,36456,45236],e:[752,1074,1538,2212,3190,3993,5010,6298,7933,10013]},fc:[288,429,638,948,1408,1805,2316,2974,3821,4911]},
};
