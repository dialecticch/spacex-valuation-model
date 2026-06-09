// ============================================================
// FIGURE: starlink_market_growth — the two charts under the
//         Starlink Connectivity (bu_04) section. Self-contained snippet.
//   Chart 1 (key: starlinkConnectivity): "Starlink Connectivity - Revenue,
//     EBITDA & Margin (Model, 2026-2035)" — replaces the old 2022-2026E
//     "Starlink - Revenue, EBITDA & Subscriber Growth" chart.
//   Chart 2 (key: broadbandMarket): "Global Broadband Market vs Starlink
//     Penetration (2026-2035)" — replaces the old 2022-2026E market chart.
//
// Data sources:
//   Starlink series (both charts): SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//     → P&L_Consolidated line 4 "Starlink Connectivity (Consumer + Av/Mar)",
//       probability-weighted, $B 1dp. Margin = EBITDA / Revenue.
//   Market series (chart 2 only): NOT in the spreadsheet — extrapolated from
//     memo data ($580B 2026E, CAGR decaying 8.0%→6.2%, margin 38.1%→39.9%).
//     Replace with a sourced forecast if available.
//
// Design (per review feedback):
//   - Solid bars (no hatching); margin line in BLUE on right % axis (chart 1).
//   - Chart 2 uses a SINGLE $B axis for bars and both EBITDA lines (no dual
//     dollar scales); lines carry distinct stack keys so the stacked axis
//     doesn't sum them. Subscribers dropped — not modeled in the spreadsheet.
// ============================================================

// --- 1. DATA BLOCK (shared by both charts; place near the other data consts) ---
// Starlink Connectivity (Consumer + Av/Mar) — Dialectic model, P&L_Consolidated line 4,
// probability-weighted, 2026-2035 ($B). Margin = EBITDA / Revenue.
const starConnYears = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];
const starConnRevenue = [15.0,21.3,30.5,44.0,63.8,83.4,109.2,143.5,189.1,249.7];
const starConnEbitda = [9.3,13.4,19.3,28.0,40.9,53.6,70.5,92.9,122.6,162.3];
const starConnMargin = [62.2,62.7,63.2,63.7,64.1,64.3,64.5,64.7,64.8,65.0];

// --- 2. FACTORIES (add starlinkConnectivity as a NEW key in chartFactories;
//        broadbandMarket REPLACES the existing entry) ---
const chartFactories_starlink_market_growth = {
    starlinkConnectivity(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:starConnYears, datasets:[
        {label:"Revenue ($B)",data:starConnRevenue,backgroundColor:RED,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA ($B)",data:starConnEbitda,backgroundColor:DARK,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA margin (%)",type:"line",data:starConnMargin,borderColor:BLUE,backgroundColor:BLUE,pointStyle:"circle",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.32,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("margin")>-1)return ctx.dataset.label+": "+ctx.raw+"%";return ctx.dataset.label+": "+formatBillions(ctx.raw);}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions",{position:"left",beginAtZero:true}),y1:slickAxis("EBITDA margin (%)",{position:"right",grid:{display:false},min:55,max:70,ticks:{font:{size:10},color:BLUE,maxTicksLimit:6,callback:(value)=>value+"%"}})}}});
    },
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

// --- 3. chartImageMap ENTRY (replaces existing starlink_market_growth entry;
//        also mirror in index.html ~line 2147) ---
const chartImageMap_starlink_market_growth = {
    starlink_market_growth: {caption:"Starlink Connectivity Projections & Global Broadband Market", source:"Starlink Connectivity (Consumer + Av/Mar): revenue, EBITDA, and margin from Dialectic model P&L_Consolidated, probability-weighted, 2026-2035. All years are model projections. Broadband market panel: Starlink series from the model; market revenue/EBITDA extrapolated from memo data (~8% CAGR decaying to ~6%, not a model output).", panels:[{key:"starlinkConnectivity", title:"Starlink Connectivity - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380},{key:"broadbandMarket", title:"Global Broadband Market vs Starlink Penetration (2026-2035)", height:380}]},
};

// --- 4. CLEANUP: the old starSubs and starMargin consts are no longer
//        referenced and can be deleted. Keep starYears/starRevenue/starEbitda
//        ONLY if the mobileMarket chart still uses them.
