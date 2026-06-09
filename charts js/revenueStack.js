// ============================================================
// CHART: revenue — Total Revenue by Business Unit, 2026-2035 (stacked)
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated revenue block, probability-weighted, $B 1dp.
//   "xAI + Starshield + Other" = sum of Crewed Spaceflight, Other Space
//   Services, Starshield, xAI, Orbital DCs, Deep Space, X Platform, Terafab.
// Fixes vs old chart:
//   - Launch Services was stale/pre-consolidation (11.5→194.1) →
//     corrected to P&L line 1 (12.1→207.7).
//   - "xAI + Starshield + Other" tightened to exact P&L sums.
//   With both, the 2035 stack sums to ~$1,063.7B = P&L total revenue row. ✓
// ============================================================

// --- FACTORY (replaces the existing revenue entry in chartFactories) ---
const chartFactories_revenue = {
    revenue(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Starlink Connectivity",data:[15,21.3,30.5,44,63.8,83.4,109.2,143.5,189.1,249.7],backgroundColor:RED},
        {label:"Colossus DCs",data:[15.8,22.5,32.3,46.8,68.2,85.9,108.3,136.9,173.4,219.9],backgroundColor:DARK},
        {label:"Launch Services",data:[12.1,17.3,24.9,36,52.4,68.6,90.1,118.7,156.9,207.7],backgroundColor:RED_SOFT},
        {label:"Starlink D2C",data:[.98,1.7,3.1,5.5,10,15.3,23.8,37.2,58.9,94.1],backgroundColor:"#404042"},
        {label:"xAI + Starshield + Other",data:[12.3,17.2,24.4,34.7,50,77.6,105.3,145.3,204,292.2],backgroundColor:GREY}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw+"B"}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,ticks:{callback:(value)=>"$"+value+"B"},grid:{color:"#f0f0f0"}}}}});
    },
};
