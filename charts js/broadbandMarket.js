// ============================================================
// CHART: broadbandMarket
// Title: Global Broadband Market vs Starlink Penetration (2026–2035)
// Data:
//   STARLINK series (red bars + red dotted EBITDA line): from the model —
//     P&L_Consolidated line 4 "Starlink Connectivity (Consumer + Av/Mar)",
//     probability-weighted ($B). Uses starConnYears/starConnRevenue/starConnEbitda
//     (defined in charts/starlinkConnectivity.js — merge that file first).
//   MARKET series (grey bars + dark dashed EBITDA line): NOT in the spreadsheet.
//     Extrapolated from memo data: $580B 2026E, CAGR decaying 8.0%→6.2%,
//     EBITDA margin drifting 38.1%→39.9%. Replace if a sourced forecast exists.
//   Starlink share (tooltip): 2.6% (2026) → 23.3% (2035).
//   Single $B axis for bars AND EBITDA lines (per review feedback — no dual
//   dollar scales). Lines carry distinct stack keys so the stacked axis
//   doesn't sum them.
// ============================================================

// --- 1. DATA: requires starConnYears / starConnRevenue / starConnEbitda from
//        charts/starlinkConnectivity.js. Market consts are local to the factory.

// --- 2. FACTORY (replaces the existing broadbandMarket entry in chartFactories) ---
const chartFactories_broadbandMarket = {
    broadbandMarket(canvas){
      // Market series: extrapolated from memo data ($580B 2026E, ~8% CAGR decaying to ~6%, margin drift 38.1%->39.9%). NOT from the valuation model.
      const marketRevenue = [580,626,675,726,778,833,889,948,1009,1071];
      const marketEbitda = [221,240,260,281,303,326,350,374,400,427];
      const share = [2.6,3.4,4.5,6.1,8.2,10.0,12.3,15.1,18.7,23.3];
      return buildChart(canvas, {type:"bar", data:{labels:starConnYears, datasets:[
        {label:"Rest of market revenue ($B)",data:marketRevenue.map((value,index)=>value-starConnRevenue[index]),backgroundColor:"#dedede",stack:"rev",borderRadius:5,borderSkipped:false,barPercentage:.72,categoryPercentage:.72,yAxisID:"y"},
        {label:"Starlink revenue ($B)",data:starConnRevenue,backgroundColor:RED,stack:"rev",borderRadius:5,borderSkipped:false,barPercentage:.72,categoryPercentage:.72,yAxisID:"y"},
        {label:"Market EBITDA ($B)",type:"line",data:marketEbitda,stack:"mkt-ebitda",borderColor:DARK,backgroundColor:DARK,pointStyle:"rectRounded",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.3,yAxisID:"y"},
        {label:"Starlink EBITDA ($B)",type:"line",data:starConnEbitda,stack:"sl-ebitda",borderColor:RED,backgroundColor:RED,pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[2,4],tension:.3,yAxisID:"y"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){return ctx.dataset.label+": "+formatBillions(ctx.raw);},afterBody(items){return "Starlink market share: "+share[items[0].dataIndex]+"%";}})},scales:{x:slickAxis("",{stacked:true,grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("Revenue / EBITDA ($B)",{stacked:true,beginAtZero:true})}}});
    },
};

// --- 3. chartImageMap ENTRY: see charts/starlinkConnectivity.js — the
//        starlink_market_growth entry there already carries the updated
//        panel title and source note for this panel.
