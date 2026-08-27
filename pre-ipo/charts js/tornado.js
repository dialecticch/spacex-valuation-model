// ============================================================
// CHART: tornado — Sensitivity Tornado: Key Equity Value Drivers
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Sensitivities sheet, "Table 4: SENSITIVITY TORNADO".
// Audit result: CHART DATA CORRECT — all 8 drivers match the sheet exactly,
//   and the chart's descending-range order is right (note: the sheet's own
//   "Tornado data (sorted)" helper block at columns I-K is MIS-sorted —
//   the chart should keep using the main table values, as it does).
//   Only fix: the figure caption said base equity "$2,380B" — sheet says
//   $2,408B. Caption updated in chartImageMap (charts-interactive.js +
//   index.html mirror). Factory unchanged.
// ============================================================

// --- FACTORY (unchanged — included for reference) ---
const chartFactories_tornado = {
    tornado(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["WACC +/-150bps","Terminal g +/-100bps","Governance discount","Starship 24-month slip","Speculative bucket","NOL / NWC assumptions","Colossus DCs demand","Starlink D2C"],datasets:[
        {label:"Downside Impact ($B)",data:[-751,-185,-482,-139,-27,-25,-25,-27],backgroundColor:"rgba(233,44,44,.8)"},
        {label:"Upside Impact ($B)",data:[1467,509,0,86,53,35,19,11],backgroundColor:"rgba(38,37,43,.8)"}
      ]}, options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"},tooltip:{callbacks:{label:(ctx)=>ctx.raw>0?"+$"+ctx.raw+"B":"$"+ctx.raw+"B"}}},scales:{x:{ticks:{callback:(value)=>"$"+value+"B"},grid:{color:"#f0f0f0"}},y:{grid:{display:false}}}}});
    },
};

// --- chartImageMap ENTRY (caption fix only) ---
const chartImageMap_chart_08_tornado = {
    chart_08_tornado: {caption:"Key valuation sensitivity drivers", source:"Dialectic single-variable sensitivity analysis - swings around base equity value of $2,408B (Sensitivities sheet, Table 4).", panels:[{key:"tornado", title:"Sensitivity Tornado: Key Equity Value Drivers", height:340}]},
};
