// ============================================================
// CHART: ufcf — Unlevered Free Cash Flow Growth, 2026-2035
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated: "Total UFCF" row (10,002 → 234,872 $M) and
//     "Total revenue" row (56,159 → 1,063,715 $M), probability-weighted, $B 1dp.
// Fix: both series were stale (~1-2% low, old model run); revenue endpoint
//   1,049.9 was the pre-fix Launch Services total. Now 2035 = $1,063.7B,
//   consistent with the corrected revenue stacked chart.
// DESIGN NOTE: this chart has dual y-axes both in $B (UFCF left ~$250B scale,
//   Revenue right ~$1,200B scale) — the same pattern your reviewer flagged on
//   the broadband chart. Kept as-is for now since the 4.5x scale gap makes a
//   single axis flatten UFCF; alternatives if you want: single axis, or plot
//   UFCF margin % on the right instead of revenue.
// ============================================================

// --- FACTORY (replaces the existing ufcf entry in chartFactories;
//      only the two data arrays changed) ---
const chartFactories_ufcf = {
    ufcf(canvas){
      return buildChart(canvas, {type:"line", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Total UFCF ($B)",data:[10,14.9,22.2,33.4,50.5,67.8,91.3,124,169.8,234.9],borderColor:RED,backgroundColor:"rgba(233,44,44,.1)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:RED},
        {label:"Total Revenue ($B)",data:[56.2,80.1,115.2,167.1,244.4,330.7,436.7,581.7,782.3,1063.7],borderColor:DARK,backgroundColor:"rgba(38,37,43,.05)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:DARK,yAxisID:"y2"}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"}},scales:{y:{ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"UFCF ($B)"},grid:{color:"#f0f0f0"}},y2:{position:"right",ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"Revenue ($B)"},grid:{display:false}},x:{grid:{display:false}}}}});
    },
};
