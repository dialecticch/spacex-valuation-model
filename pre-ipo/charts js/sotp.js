// ============================================================
// CHART: sotp (+ shared data for sotpCumulative)
// Title: SOTP — Segment EV ($B) by Scenario
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → "Sum of Parts" sheet: Segment EV Base / Bear EV / Bull EV columns, $M → $B.
// Fixes vs old chart:
//   - Launch Services: 70/297/654 → 76/324/713 (was stale)
//   - Crewed Spaceflight: bear 3→7, bull 29→140 (bull was impossibly < base)
//   - X Platform: bear 13→8, bull 85→118
//   - Other Space Services: bull 9→13
//   - Names now match the sheet exactly ("Crewed Spaceflight" not "Crewed Dragon",
//     "Launch Services & Lunar Vehicles", "Terafab — Semiconductor Manufacturing")
//   - sotpCumulative totals: base 2230→2257, bear 320→326, bull 4777→4983
//     (sheet TOTAL row: 2,256,811 / 326,426 / 4,983,256 $M)
// ============================================================

// --- 1. DATA BLOCK (replaces existing sotpLabels + sotpContributions) ---
// SOTP — Dialectic model, "Sum of Parts" sheet (Segment EV: Bear/Base/Bull, $B,
// PV of 10-yr UFCF + Gordon-Growth TV). Names match the sheet; ordered by Base EV desc.
const sotpLabels = [
    "Starlink Connectivity",
    "Starlink D2C",
    "Colossus DCs",
    "Launch Services & Lunar Vehicles",
    "Starshield",
    "xAI Software",
    "Crewed Spaceflight",
    "Terafab — Semiconductor Manufacturing",
    "X Platform",
    "Orbital DCs",
    "Other Space Services",
    "Deep Space Optionality"
];
const sotpContributions = {
    bear:[84,28,59,76,42,13,7,6,8,2,0,0],
    base:[745,380,329,324,190,86,63,54,53,27,6,0],
    bull:[1638,836,723,713,418,189,140,119,118,77,13,0]
};

// --- 2. FACTORY: unchanged — the existing sotp factory reads the consts above.

// --- 3. sotpCumulative: update the three hardcoded totals in its factory:
//   cumulativeSotp(sotpContributions.base, 2257)   // was 2230
//   cumulativeSotp(sotpContributions.bear, 326)    // was 320
//   cumulativeSotp(sotpContributions.bull, 4983)   // was 4777
