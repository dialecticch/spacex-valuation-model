// ============================================================
// CHART: starlinkConnectivity  (NEW factory — same design as the old
//        2022-2026E "Starlink - Revenue, EBITDA & Subscriber Growth" chart)
// Title: Starlink Connectivity — Revenue, EBITDA & Margin (Model, 2026–2035)
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → P&L_Consolidated, line 4 "Starlink Connectivity (Consumer + Av/Mar)",
//     probability-weighted, $B 1dp. Margin = EBITDA / Revenue.
// Design notes:
//   - Solid bars; dashed line = EBITDA margin on right axis in BLUE
//     (subscribers are NOT modeled in the spreadsheet, so the old
//     subscriber line has no model source).
// Wiring: starlink_market_growth figure, panel 1 (replaces starlinkMetrics there;
//   starlinkMetrics is now the D2C economics chart, moved to starlink_penetration_v5).
// ============================================================

// --- 1. DATA BLOCK ---
// Starlink Connectivity (Consumer + Av/Mar) — Dialectic model, P&L_Consolidated line 4,
// probability-weighted, 2026-2035 ($B). Margin = EBITDA / Revenue.
const starConnYears = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];
const starConnRevenue = [15.0,21.3,30.5,44.0,63.8,83.4,109.2,143.5,189.1,249.7];
const starConnEbitda = [9.3,13.4,19.3,28.0,40.9,53.6,70.5,92.9,122.6,162.3];
const starConnMargin = [62.2,62.7,63.2,63.7,64.1,64.3,64.5,64.7,64.8,65.0];

// --- 2. FACTORY (ADD to chartFactories — new key, do not remove starlinkMetrics) ---
const chartFactories_starlinkConnectivity = {
    starlinkConnectivity(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:starConnYears, datasets:[
        {label:"Revenue ($B)",data:starConnRevenue,backgroundColor:RED,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA ($B)",data:starConnEbitda,backgroundColor:DARK,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA margin (%)",type:"line",data:starConnMargin,borderColor:BLUE,backgroundColor:BLUE,pointStyle:"circle",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.32,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("margin")>-1)return ctx.dataset.label+": "+ctx.raw+"%";return ctx.dataset.label+": "+formatBillions(ctx.raw);}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions",{position:"left",beginAtZero:true}),y1:slickAxis("EBITDA margin (%)",{position:"right",grid:{display:false},min:55,max:70,ticks:{font:{size:10},color:BLUE,maxTicksLimit:6,callback:(value)=>value+"%"}})}}});
    },
};

// --- 3. chartImageMap ENTRIES (replace both; also mirror in index.html ~line 2147-2148) ---
const chartImageMap_entries = {
    starlink_market_growth: {caption:"Starlink Connectivity Projections & Global Broadband Market", source:"Starlink Connectivity (Consumer + Av/Mar): revenue, EBITDA, and margin from Dialectic model P&L_Consolidated, probability-weighted, 2026-2035. All years are model projections. Broadband market panel from the supplied memo chart data (2022-2026E).", panels:[{key:"starlinkConnectivity", title:"Starlink Connectivity - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380},{key:"broadbandMarket", title:"Global Broadband Internet Service Market vs Starlink Penetration", height:380}]},
    starlink_penetration_v5: {caption:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", source:"Global mobile market and Starlink DTC penetration from the supplied memo chart data. D2C economics panel from Dialectic model Starlink_D2C sheet, probability-weighted, 2026-2045; revenue/EBITDA on logarithmic left axis.", panels:[{key:"mobileMarket", title:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", height:380},{key:"starlinkMetrics", title:"Starlink Direct-to-Cell - Revenue, EBITDA & Margin (Model, 2026-2045)", height:380}]},
};
