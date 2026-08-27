// ============================================================
// CHARTS: bu_11 — Deep Space Optionality (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)"  — factory buRevenueEbitda, reads re.r / re.e
//   Panel 2: "Unlevered Free Cash Flow ($M)" — factory buUfcf, reads fc
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated line 10 "Deep Space Optionality" (buChartDefs key is 11),
//     probability-weighted, $M, 2026-2035. Revenue starts 2031.
// Audit result: revenue/EBITDA correct; UFCF was WRONG IN SHAPE — integer
//   rounding ([0,1,1,1,2]) created a fake flat $1M plateau 2032-2034.
//   Sheet values are a smooth ramp: 0.51 / 0.67 / 0.88 / 1.15 / 1.50.
//   Fixed with 1-decimal values (these are $M — tiny segment).
// Page copy check: "Base EV (10yr): $0.02B" matches Sum of Parts ($15M ≈ $0.02B). ✓
// ============================================================

// --- buChartDefs entry (replace key 11 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_11 = {
    11:{re:{r:[0,0,0,0,0,23.5,27.5,32.3,38.4,45.9],e:[0,0,0,0,0,10.5,12.7,15.4,18.9,23.3]},fc:[0,0,0,0,0,0.5,0.7,0.9,1.2,1.5]},
};
