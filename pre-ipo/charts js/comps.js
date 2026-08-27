// ============================================================
// CHART: comps — EV / Revenue Multiple Comparison
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Comps sheet, EV/Revenue column:
//     Defence median 2.11 / Tech median 4.65 / AI Labs median 24.47 /
//     AI-growth median 16.51 / SpaceX IPO $1.75T 31.40 /
//     SpaceX DCF Central ($2.42T EV ÷ $56.16B 2026 rev) 43.12 /
//     Palantir 46.7 / NVIDIA 21.48.
// Fixes vs old chart: SpaceX IPO bar 31.7 → 31.4 (stale); Tech 4.6 → 4.7.
//   All other bars matched within rounding.
// ============================================================

// --- FACTORY (replaces the existing comps entry in chartFactories;
//      only the data array changed) ---
const chartFactories_comps = {
    comps(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["Defence Prime","Tech Mega-Cap","AI Labs Median","AI/Growth Median","SpaceX IPO $1.75T","SpaceX DCF Central","Palantir","NVIDIA"],datasets:[{label:"EV / Revenue",data:[2.1,4.7,24.5,16.5,31.4,43.1,46.7,21.5],backgroundColor:[LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,RED_SOFT,RED,"#404042",LIGHT_GREY],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+"x EV/Rev"}}},scales:{y:{ticks:{callback:(value)=>value+"x"},grid:{color:"#f0f0f0"}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
    },
};
