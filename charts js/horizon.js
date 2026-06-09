// ============================================================
// CHART: horizon — Enterprise Value by Horizon
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Summary sheet, "Headline Outputs" table, Ent. Value ($M):
//     5-year 840,458 / 10-year 2,685,974 / Blended (55/35/10) 2,421,490 /
//     20-year 10,191,466 → $B: 840 / 2,686 / 2,421 / 10,191.
// Fix: old values [831, 2657, 2393, 10064] were stale (~0.5-1.3% low,
//   same older model run as the Launch Services data).
// ============================================================

// --- FACTORY (replaces the existing horizon entry in chartFactories;
//      only the data array changed) ---
const chartFactories_horizon = {
    horizon(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["5-Year (2026-2030)","10-Year (2026-2035)","Blended (55/35/10)","20-Year (2026-2045)"],datasets:[{label:"Enterprise Value ($B)",data:[840,2686,2421,10191],backgroundColor:[LIGHT_GREY,RED,RED_SOFT,DARK],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>"$"+ctx.raw.toLocaleString()+"B"}}},scales:{y:{ticks:{callback:(value)=>"$"+value.toLocaleString()+"B"},grid:{color:"#f0f0f0"}},x:{grid:{display:false}}}}});
    },
};
