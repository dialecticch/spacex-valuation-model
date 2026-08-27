// ============================================================
// SECTION bu_05 — Starlink Direct-to-Cell: BU panels + mobile market figure
//
// PART A — CHARTS: bu_05 BU panels (two panels, one shared data entry)
//   Panel 1: "Revenue & EBITDA ($M)" / Panel 2: "Unlevered Free Cash Flow ($M)"
//   Source: P&L_Consolidated line 5 "Starlink Direct-to-Cell", prob-weighted, $M.
//   Audit result: CORRECT within rounding (worst ~3.7%, 2028 UFCF 1,000 vs 1,038).
//   Updated to exact spreadsheet values.
// ============================================================

// --- A1. buChartDefs entry (replace key 5 in buChartDefs; feeds BOTH panels) ---
const buChartDefs_5 = {
    5:{re:{r:[980,1725,3067,5510,9992,15324,23762,37237,58935,94140],e:[568,1016,1835,3343,6144,9560,15027,23849,38190,61655]},fc:[312,567,1038,1919,3572,5631,8960,14379,23256,37879]},
};

// ============================================================
// PART B — CHART: mobileMarket (rebuilt 2026-2035, was 2022-2026E memo data)
//   Title: Global Mobile / Cellular Market vs Starlink Direct-to-Cell (2026-2035)
//   DTC series: model (reuses starD2CYears/starD2CRevenue/starD2CEbitda consts, $B —
//     defined in charts/starlinkMetrics.js; merge that first).
//   Market series: NOT in the spreadsheet — extrapolated from memo data
//     ($1,210B 2026E, ~3% CAGR decaying to ~2.4%; EBITDA ~$409B → $531B,
//     consistent with the D2C sheet's "~$400B annual global cellular" TAM note).
//   Design: single $B axis for bars and both EBITDA lines (review feedback);
//     lines carry distinct stack keys so the stacked axis doesn't sum them.
//     DTC share in tooltip: 0.08% (2026) → 6.12% (2035).
// ============================================================

// --- B1. FACTORY (replaces the existing mobileMarket entry in chartFactories) ---
const chartFactories_mobileMarket = {
    mobileMarket(canvas){
      // Market series: extrapolated from memo data ($1,210B 2026E, ~3% CAGR decaying to ~2.4%; EBITDA margin ~33.8% drifting up). NOT from the valuation model.
      // DTC series: Dialectic model, P&L_Consolidated line 5 / Starlink_D2C sheet (starD2C* consts, $B).
      const mobileRevenue = [1210,1246,1282,1318,1355,1392,1428,1465,1502,1538];
      const mobileEbitda = [409,422,436,449,462,476,490,503,517,531];
      const dtcShare = [.08,.14,.24,.42,.74,1.1,1.66,2.54,3.92,6.12];
      return buildChart(canvas, {type:"bar", data:{labels:starD2CYears, datasets:[
        {label:"Global mobile (excl. DTC)",data:mobileRevenue.map((value,index)=>value-starD2CRevenue[index]),backgroundColor:"#dedede",stack:"mobile",borderRadius:0,borderSkipped:false,barPercentage:.6,categoryPercentage:.72,yAxisID:"y"},
        {label:"Starlink DTC",data:starD2CRevenue,backgroundColor:RED,stack:"mobile",borderRadius:0,borderSkipped:false,barPercentage:.6,categoryPercentage:.72,minBarLength:4,yAxisID:"y"},
        {label:"Mobile EBITDA ($B)",type:"line",data:mobileEbitda,stack:"mobile-ebitda",borderColor:"#444",backgroundColor:"#444",pointStyle:"rectRounded",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#444",pointBorderWidth:1,borderWidth:2.5,borderDash:[7,4],tension:.18,yAxisID:"y"},
        {label:"DTC EBITDA ($B)",type:"line",data:starD2CEbitda,stack:"dtc-ebitda",borderColor:RED,backgroundColor:RED,pointRadius:4,pointHoverRadius:6,pointBorderColor:RED,pointBorderWidth:1,borderWidth:2.5,borderDash:[2,4],tension:.18,yAxisID:"y"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:14,right:4,bottom:0,left:0}},plugins:{legend:{position:"top",align:"start",labels:{usePointStyle:false,boxWidth:22,boxHeight:8,padding:10,color:DARK,font:{size:10,weight:"700"}}},tooltip:withSlickTooltip({label(ctx){return ctx.dataset.label+": "+formatBillions(ctx.raw);},afterBody(items){return "DTC market share: "+dtcShare[items[0].dataIndex]+"%";}}),exhibitAnnotationPlugin:{totalLabels:{totals:mobileRevenue,labels:mobileRevenue.map((value)=>"$"+value+"B"),color:DARK,font:"700 12px Arial"}}},scales:{x:slickAxis("",{stacked:true,grid:{display:false},ticks:{font:{size:10},color:"#444",maxRotation:0,minRotation:0}}),y:slickAxis("Revenue / EBITDA ($B)",{stacked:true,beginAtZero:true,max:1700,ticks:{font:{size:10},color:"#444",stepSize:200},grid:{color:"rgba(38,37,43,.08)",drawBorder:false}})}}});
    },
};

// --- B2. chartImageMap ENTRY (replaces existing starlink_penetration_v5 entry;
//        also mirror in index.html ~line 2148) ---
const chartImageMap_starlink_penetration_v5 = {
    starlink_penetration_v5: {caption:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell (2026-2035)", source:"Starlink DTC revenue/EBITDA from Dialectic model P&L_Consolidated line 5, probability-weighted, 2026-2035. Mobile market revenue/EBITDA extrapolated from memo data (~3% CAGR decaying, not a model output); single $B axis. D2C economics panel from Dialectic model Starlink_D2C sheet; revenue/EBITDA on logarithmic left axis.", panels:[{key:"mobileMarket", title:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell (2026-2035)", height:380},{key:"starlinkMetrics", title:"Starlink Direct-to-Cell - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380}]},
};
