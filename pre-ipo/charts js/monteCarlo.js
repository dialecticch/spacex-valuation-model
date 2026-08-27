// ============================================================
// CHART: monteCarlo — Monte Carlo Distribution, 5,000 Trials
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Monte_Carlo sheet. Histogram verified two ways: against the sheet's
//     HISTOGRAM block AND recomputed from the raw 5,000 trial EVs (col N).
//   Saved-workbook snapshot — the sheet re-randomizes on F9/recalc.
//   Sheet stats: P10 $0.71T / P25 $1.51T / P50 $2.24T / mean $2.62T /
//     P75 $3.47T / P90 $4.73T; Prob(EV < $1.25T merger) 19%;
//     Prob(EV > $2.0T IPO target) 57%.
// Final design (per review): FULL RANGE — 40 uniform $0.25T bins, $0 → $10T,
//   no overflow bucket, so the right tail fades naturally instead of piling
//   into a tall catch-all bar. Axis ticks shown at whole trillions only.
//   Counts sum to exactly 5,000.
// Note: binned variable is EV ($M); equity = EV − $13.3B net debt
//   (negligible at this bin width).
// Colors: <$0.75T light red (bear zone), >=$3.5T light green (upside), else RED.
// ============================================================

// --- FACTORY (replaces the existing monteCarlo entry in chartFactories) ---
const chartFactories_monteCarlo = {
    monteCarlo(canvas){
      // Histogram from Monte_Carlo sheet (saved 5,000-trial snapshot), full range:
      // 40 uniform $0.25T bins from $0 to $10T, no overflow bucket. Counts sum to 5,000.
      // Sheet stats: P10 $0.71T / P50 $2.24T / mean $2.62T / P90 $4.73T.
      const mcCounts = [45,243,236,184,218,299,462,444,386,326,285,239,221,189,249,113,111,168,85,59,49,44,81,36,20,23,19,20,17,15,22,18,7,5,37,6,4,2,1,12];
      const mcLabels = mcCounts.map((_,i)=>"$"+(i*0.25).toFixed(2)+"-"+((i+1)*0.25).toFixed(2)+"T");
      return buildChart(canvas, {type:"bar", data:{labels:mcLabels,datasets:[{label:"Trial Count",data:mcCounts,backgroundColor:(ctx)=>{const i=ctx.dataIndex;if(i<=2)return "#fecaca";if(i>=14)return "#bbf7d0";return RED;},borderRadius:1,barPercentage:.92,categoryPercentage:.96}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+" trials"}}},scales:{y:{title:{display:true,text:"Number of Trials"},grid:{color:"#f0f0f0"}},x:{ticks:{autoSkip:false,maxRotation:0,font:{size:10},callback:(value,index)=>index%4===0?"$"+(index*0.25)+"T":""},grid:{display:false}}}}});
    },
};
