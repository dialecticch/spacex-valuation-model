// ============================================================
// CHART: starlinkMetrics
// Title: Starlink Direct-to-Cell — Revenue, EBITDA & Margin (Model, 2026–2035)
// Source of truth: SpaceX_Valuation_Q2-2026_VF_Dialectic V2 (3).xlsx
//   → Starlink_D2C sheet, Economics block:
//     - Expected revenue (× materialization), $M → $B 1dp
//     - Expected EBITDA, $M → $B 1dp
//     - Blended EBITDA margin (58.0% 2026 → 65.5% 2035)
// Design: solid bars on logarithmic left axis (~96x range),
//   BLUE dashed margin line on right axis (56–68%). All years are projections.
// Wiring: starlink_penetration_v5 figure, panel 2 (next to mobileMarket).
// ============================================================

// --- 1. DATA BLOCK (place near the other data consts) ---
// Starlink Direct-to-Cell — Dialectic model, Starlink_D2C sheet:
// Expected revenue (× materialization), Expected EBITDA, Blended EBITDA margin, 2026-2035 ($B)
const starD2CYears = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];
const starD2CRevenue = [1.0,1.7,3.1,5.5,10.0,15.3,23.8,37.2,58.9,94.1];
const starD2CEbitda = [0.6,1.0,1.8,3.3,6.1,9.6,15.0,23.8,38.2,61.7];
const starD2CMargin = [58.0,58.9,59.8,60.7,61.5,62.4,63.2,64.0,64.8,65.5];

// --- 2. FACTORY (replaces the existing starlinkMetrics entry in chartFactories) ---
const chartFactories_starlinkMetrics = {
    starlinkMetrics(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:starD2CYears, datasets:[
        {label:"Expected revenue ($B)",data:starD2CRevenue,backgroundColor:RED,borderRadius:4,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"Expected EBITDA ($B)",data:starD2CEbitda,backgroundColor:DARK,borderRadius:4,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"Blended EBITDA margin (%)",type:"line",data:starD2CMargin,borderColor:BLUE,backgroundColor:BLUE,pointStyle:"circle",pointRadius:3,pointHoverRadius:5,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.3,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("margin")>-1)return ctx.dataset.label+": "+ctx.raw+"%";return ctx.dataset.label+": "+formatBillions(ctx.raw);}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions (log scale)",{type:"logarithmic",min:0.3,max:120,ticks:{callback:(value)=>[0.5,1,2,5,10,25,50,100].indexOf(value)>-1?"$"+value+"B":null}}),y1:slickAxis("Blended EBITDA margin (%)",{position:"right",grid:{display:false},min:56,max:68,ticks:{font:{size:10},color:BLUE,maxTicksLimit:8,callback:(value)=>value+"%"}})}}});
    },
};

// --- 3. chartImageMap ENTRY (replaces existing starlink_penetration_v5 entry;
//        also mirror this in index.html ~line 2148) ---
const chartImageMap_starlink_penetration_v5 = {
    starlink_penetration_v5: {caption:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", source:"Global mobile market and Starlink DTC penetration from the supplied memo chart data. D2C economics panel from Dialectic model Starlink_D2C sheet, probability-weighted, 2026-2035; revenue/EBITDA on logarithmic left axis.", panels:[{key:"mobileMarket", title:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", height:380},{key:"starlinkMetrics", title:"Starlink Direct-to-Cell - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380}]},
};
