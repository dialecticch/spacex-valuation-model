(function(){
  "use strict";

  if(!window.Chart) return;

  const RED = "#e92c2c";
  const RED_SOFT = "#ef5252";
  const DARK = "#26252b";
  const GREY = "#a4a4a4";
  const LIGHT_GREY = "#d9d9d9";
  const BROWN = "#b7791f";
  const BLUE = "#2563eb";

  Chart.defaults.font.family = "Arial, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = "#666";

  const exhibitAnnotationPlugin = {
    id: "exhibitAnnotationPlugin",
    beforeDatasetsDraw(chart, args, opts){
      const ctx = chart.ctx;
      const area = chart.chartArea;
      const x = chart.scales.x;
      if(!area || !x) return;
      ctx.save();
      if(opts && opts.eraBands){
        opts.eraBands.forEach((band) => {
          const x1 = Math.max(area.left, x.getPixelForValue(band.from));
          const x2 = Math.min(area.right, x.getPixelForValue(band.to));
          if(!Number.isFinite(x1) || !Number.isFinite(x2)) return;
          ctx.fillStyle = band.color;
          ctx.fillRect(x1, area.top, x2 - x1, area.bottom - area.top);
          ctx.fillStyle = band.labelColor || "rgba(38,37,43,.38)";
          ctx.font = "700 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(band.label, (x1 + x2) / 2, area.bottom - 14);
        });
      }
      if(opts && opts.projectedAfterIndex != null){
        const a = x.getPixelForValue(Math.floor(opts.projectedAfterIndex));
        const b = x.getPixelForValue(Math.ceil(opts.projectedAfterIndex));
        const px = (a + b) / 2;
        ctx.strokeStyle = "rgba(0,0,0,.16)";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(px, area.top);
        ctx.lineTo(px, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        if(opts.projectedLabel !== false){
          ctx.fillStyle = "rgba(0,0,0,.42)";
          ctx.font = "11px Arial";
          ctx.textAlign = "left";
          ctx.fillText("projected", px + 12, area.top + 18);
        }
      }
      ctx.restore();
    },
    afterDatasetsDraw(chart, args, opts){
      const ctx = chart.ctx;
      const area = chart.chartArea;
      if(!area) return;
      ctx.save();
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if(meta.hidden) return;
        meta.data.forEach((point, index) => {
          const raw = dataset.data[index];
          if(!raw || !raw.label) return;
          const offset = raw.labelOffset || {x:8, y:-12};
          ctx.fillStyle = raw.labelColor || dataset.labelColor || "#555";
          ctx.font = raw.labelFont || "11px Arial";
          ctx.textAlign = raw.labelAlign || "left";
          String(raw.label).split("\n").forEach((line, lineIndex) => {
            ctx.fillText(line, point.x + offset.x, point.y + offset.y + lineIndex * 13);
          });
        });
      });
      if(opts && opts.totalLabels){
        const totals = opts.totalLabels.totals || [];
        const labels = opts.totalLabels.labels || totals;
        const y = chart.scales.y;
        ctx.fillStyle = opts.totalLabels.color || DARK;
        ctx.font = opts.totalLabels.font || "700 12px Arial";
        ctx.textAlign = "center";
        totals.forEach((total, index) => {
          const x = chart.scales.x.getPixelForValue(index);
          const yPos = y.getPixelForValue(total) - 8;
          ctx.fillText(labels[index], x, yPos);
        });
      }
      if(opts && opts.callouts){
        opts.callouts.forEach((callout) => {
          const x = chart.scales.x.getPixelForValue(callout.x) + (callout.dx || 0);
          const y = chart.scales.y.getPixelForValue(callout.y) + (callout.dy || 0);
          const lines = String(callout.text).split("\n");
          ctx.font = "700 12px Arial";
          const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 18;
          const height = lines.length * 15 + 12;
          ctx.fillStyle = callout.background || "#fff";
          ctx.strokeStyle = callout.border || RED;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 5);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = callout.color || RED;
          ctx.textAlign = "left";
          lines.forEach((line, lineIndex) => {
            ctx.fillText(line, x + 9, y + 18 + lineIndex * 15);
          });
        });
      }
      ctx.restore();
    }
  };
  Chart.register(exhibitAnnotationPlugin);

  function projectedPattern(color){
    const canvas = document.createElement("canvas");
    canvas.width = 12;
    canvas.height = 12;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 12, 12);
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 12);
    ctx.lineTo(12, -3);
    ctx.moveTo(3, 15);
    ctx.lineTo(15, 3);
    ctx.stroke();
    return ctx.createPattern(canvas, "repeat");
  }

  const projectedByColor = {};
  function projectedFor(color){
    projectedByColor[color] = projectedByColor[color] || projectedPattern(color);
    return projectedByColor[color];
  }

  function projectedColors(color){
    return [color, color, color, color, projectedFor(color)];
  }

  function formatBillions(value){
    return "$" + Number(value).toLocaleString(undefined, {maximumFractionDigits:1}) + "B";
  }

  function formatCost(value){
    if(value >= 1000) return "$" + Math.round(value / 1000) + "K/kg";
    return "$" + Math.round(value).toLocaleString() + "/kg";
  }

  function stackedTooltip(unit){
    return {
      callbacks: {
        label(ctx){
          const total = ctx.chart.data.datasets.reduce((sum, dataset) => sum + (Number(dataset.data[ctx.dataIndex]) || 0), 0);
          const value = Number(ctx.raw) || 0;
          const pct = total ? Math.round(value / total * 100) : 0;
          return ctx.dataset.label + ": " + value.toLocaleString() + unit + " (" + pct + "%)";
        },
        footer(items){
          if(!items.length) return "";
          const idx = items[0].dataIndex;
          const total = items[0].chart.data.datasets.reduce((sum, dataset) => sum + (Number(dataset.data[idx]) || 0), 0);
          return "Total: " + total.toLocaleString() + unit;
        }
      }
    };
  }

  const slickLegend = {
    position: "top",
    labels: {usePointStyle:true, boxWidth:8, boxHeight:8, padding:10, color:DARK, font:{size:10, weight:"700"}}
  };

  const slickTooltip = {
    backgroundColor: "rgba(17,17,19,.95)",
    titleColor: "#fff",
    bodyColor: "#fff",
    footerColor: LIGHT_GREY,
    borderColor: "rgba(233,44,44,.35)",
    borderWidth: 1,
    padding: 10,
    displayColors: true,
    boxPadding: 4
  };

  function withSlickTooltip(callbacks){
    return Object.assign({}, slickTooltip, {callbacks});
  }

  function slickAxis(title, extra){
    return Object.assign({
      title: {display:!!title, text:title, color:DARK, font:{size:11, weight:"700"}},
      ticks: {font:{size:10}, color:"#666", maxTicksLimit:6},
      grid: {color:"rgba(38,37,43,.08)", drawBorder:false}
    }, extra || {});
  }

  const launchYears = ["2022", "2023", "2024", "2025", "2026E"];
  const launchCats = [
    {label:"SpaceX", color:RED, counts:[61,98,134,165,170], mass:[680,1100,1498,1900,2200]},
    {label:"US Private", color:"#252329", counts:[13,14,18,22,31], mass:[55,55,89,112,130]},
    {label:"China State", color:"#414144", counts:[51,53,55,73,85], mass:[300,320,340,450,525]},
    {label:"China Commercial", color:"#a8a8a8", counts:[13,14,13,20,30], mass:[19,39,19,50,75]},
    {label:"Rest of World", color:LIGHT_GREY, counts:[48,44,39,40,38], mass:[340,310,280,295,295]}
  ];

  const starYears = ["2022", "2023", "2024", "2025", "2026E"];
  const starRevenue = [1.4,4.1,7.7,11.4,14.8];
  const starEbitda = [0.5,1.7,3.9,7.2,9.8];
  const starSubs = [1.0,2.3,5.0,9.5,14.0];
  const starMargin = [35,41,50,63,66];

  const sotpLabels = [
    "Starlink Connectivity",
    "Starlink D2C",
    "Colossus DCs",
    "Launch Services & Lunar Vehicles",
    "Starshield",
    "xAI Software",
    "Crewed Spaceflight",
    "Terafab — Semiconductor Manufacturing",
    "X Platform",
    "Orbital DCs",
    "Other Space Services",
    "Deep Space Optionality"
  ];
  const sotpContributions = {
    bear:[84,28,59,76,42,13,7,6,8,2,0,0],
    base:[745,380,329,324,190,86,63,54,53,27,6,0],
    bull:[1638,836,723,713,418,189,140,119,118,77,13,0]
  };
  // Starlink Connectivity (Consumer + Av/Mar) — model, P&L_Consolidated line 4, 2026-2035 ($B).
  const starConnYears = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];
  const starConnRevenue = [15.0,21.3,30.5,44.0,63.8,83.4,109.2,143.5,189.1,249.7];
  const starConnEbitda = [9.3,13.4,19.3,28.0,40.9,53.6,70.5,92.9,122.6,162.3];
  const starConnMargin = [62.2,62.7,63.2,63.7,64.1,64.3,64.5,64.7,64.8,65.0];
  // Starlink Direct-to-Cell — model, Starlink_D2C sheet, 2026-2035 ($B).
  const starD2CYears = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];
  const starD2CRevenue = [1.0,1.7,3.1,5.5,10.0,15.3,23.8,37.2,58.9,94.1];
  const starD2CEbitda = [0.6,1.0,1.8,3.3,6.1,9.6,15.0,23.8,38.2,61.7];
  const starD2CMargin = [58.0,58.9,59.8,60.7,61.5,62.4,63.2,64.0,64.8,65.5];
  const sotpScenarioColors = {bear:"#fca5a5", base:RED, bull:DARK};

  function cumulativeSotp(values, total){
    let running = 0;
    return values.map((value, index) => {
      running += value;
      return index === values.length - 1 ? total : running;
    });
  }

  const buChartDefs = {
    1:{re:{r:[12092,17315,24923,36047,52361,68583,90115,118746,156877,207734],e:[5573,8121,11874,17417,25619,33981,45156,60108,80130,106967]},fc:[1090,1728,2710,4213,6505,8945,12262,16765,22873,31154]},
    2:{re:{r:[2448,3052,3818,4795,6046,7306,8813,10659,12926,15717],e:[1283,1612,2033,2573,3267,3969,4825,5879,7178,8783]},fc:[873,1100,1390,1762,2242,2715,3305,4031,4925,6028]},
    3:{re:{r:[150,207,288,405,574,746,972,1269,1662,2180],e:[78,110,157,224,321,421,554,729,962,1272]},fc:[32,46,66,96,139,184,243,322,428,569]},
    4:{re:{r:[15010,21334,30534,44000,63826,83367,109233,143531,189089,249694],e:[9337,13377,19294,28008,40914,53623,70473,92852,122617,162261]},fc:[5134,7395,10717,15627,22922,29935,39205,51479,67757,89379]},
    5:{re:{r:[980,1725,3067,5510,9992,15324,23762,37237,58935,94140],e:[568,1016,1835,3343,6144,9560,15027,23849,38190,61655]},fc:[312,567,1038,1919,3572,5631,8960,14379,23256,37879]},
    6:{re:{r:[3334,4846,7086,10420,15402,20051,26187,34304,45064,59353],e:[1520,2250,3346,4997,7494,9866,13020,17221,22824,30306]},fc:[833,1247,1874,2826,4275,5665,7520,10000,13318,17761]},
    7:{re:{r:[2298,3451,5221,7954,12200,16977,23692,33149,46493,65349],e:[1094,1684,2610,4067,6372,8983,12689,17956,25452,36129]},fc:[230,360,565,891,1413,2005,2851,4059,5787,8261]},
    8:{re:{r:[15768,22468,32285,46754,68192,85855,108313,136906,173363,219905],e:[10763,15493,22469,32811,48216,60945,77173,97886,124359,158231]},fc:[1210,1982,3192,5080,8020,10506,13741,17953,23432,30558]},
    9:{re:{r:[4080,5678,7944,11169,15774,19373,23856,29453,36456,45236],e:[752,1074,1538,2212,3190,3993,5010,6298,7933,10013]},fc:[288,429,638,948,1408,1805,2316,2974,3821,4911]},
    10:{re:{r:[0,0,0,0,0,8600,14300,23942,40336,68341],e:[0,0,0,0,0,4530,7653,13005,22218,38140]},fc:[0,0,0,0,0,-51,103,464,1237,2814]},
    11:{re:{r:[0,0,0,0,0,23.5,27.5,32.3,38.4,45.9],e:[0,0,0,0,0,10.5,12.7,15.4,18.9,23.3]},fc:[0,0,0,0,0,0.5,0.7,0.9,1.2,1.5]},
    12:{re:{r:[0,0,0,0,0,4500,7444,12457,21074,36021],e:[0,0,0,0,0,1969,3340,5723,9895,17250]},fc:[0,0,0,0,0,419,819,1567,2963,5556]}
  };
  const buLabels = [2026,2027,2028,2029,2030,2031,2032,2033,2034,2035];
  const buScaleOpts = {
    x:{ticks:{font:{size:9}}, grid:{display:false}},
    y:{ticks:{callback:(value) => value >= 1000 ? "$" + (value / 1000).toFixed(0) + "B" : "$" + value + "M", font:{size:9}}, grid:{color:"#f5f5f5"}}
  };

  function translateValue(value){
    const translator = window.SpaceXDashboardTranslate;
    if(!translator || typeof translator.text !== "function") return value;
    return translator.text(value);
  }

  function shouldTranslateChartString(key){
    if(!key) return true;
    return !/(?:color|font|type|stack|axis|id|key|align|position|radius|width|height|dash|family|mode|intersect|fill)$/i.test(key);
  }

  function translateChartConfig(value, key){
    if(typeof value === "string") return shouldTranslateChartString(key) ? translateValue(value) : value;
    if(Array.isArray(value)) return value.map((item) => translateChartConfig(item, key));
    if(!value || typeof value !== "object") return value;
    const copy = {};
    Object.keys(value).forEach((childKey) => {
      copy[childKey] = translateChartConfig(value[childKey], childKey);
    });
    return copy;
  }

  function buildChart(canvas, config){
    return new Chart(canvas, config);
  }

  const chartFactories = {
    launchCost(canvas){
      return buildChart(canvas, {type:"line", data:{datasets:[
        {label:"Industry learning curve", data:[{x:1967,y:40000},{x:1981,y:58000},{x:1993,y:35000},{x:2004,y:12000},{x:2013,y:4200},{x:2022,y:1000},{x:2030,y:70}], borderColor:"rgba(233,44,44,.28)", borderDash:[7,5], pointRadius:0, tension:.35},
        {label:"Pre-SpaceX vehicles", type:"scatter", data:[
          {x:1967,y:85000,label:"Saturn V\nApollo era",labelOffset:{x:-56,y:-22}},
          {x:1981,y:65000,label:"Space Shuttle\nSTS-1",labelOffset:{x:18,y:38}},
          {x:1988,y:12000,label:"Ariane 4",labelOffset:{x:-54,y:50}},
          {x:1993,y:22000,label:"Delta II",labelOffset:{x:16,y:-24}},
          {x:1999,y:9000,label:"Proton-K",labelOffset:{x:-66,y:34}},
          {x:2004,y:12500,label:"Delta IV Heavy",labelOffset:{x:14,y:-20}}
        ], backgroundColor:"#a7a7a7", borderColor:"#fff", borderWidth:2, pointRadius:6, pointHoverRadius:8},
        {label:"SpaceX Falcon 9 era", data:[
          {x:2010,y:6200,label:"Falcon 9 v1.0\nF9 debut",labelOffset:{x:16,y:-28}},
          {x:2013,y:5200,label:"Falcon 9 v1.1",labelOffset:{x:-92,y:55}},
          {x:2016,y:3100,label:"Falcon 9 + landing\n1st reuse",labelOffset:{x:18,y:-36}},
          {x:2018,y:2900,label:"Falcon 9 Block 5\nroutine reuse",labelOffset:{x:-98,y:58}},
          {x:2022,y:2800,label:"Falcon 9\nrider/ops est.",labelOffset:{x:18,y:38}}
        ], borderColor:RED, backgroundColor:RED, pointStyle:"rectRot", pointRadius:7, pointHoverRadius:9, tension:.25},
        {label:"Rocket Lab benchmark", type:"scatter", data:[
          {x:2025,y:28300,label:"Rocket Lab Electron\n2025 avg rev./launch",tooltipLabel:"Rocket Lab Electron\n2025 avg rev./launch",labelOffset:{x:-156,y:-32},detail:"$8.5M revenue per launch / 300 kg LEO capacity"}
        ], backgroundColor:BLUE, borderColor:"#fff", borderWidth:2, pointStyle:"circle", pointRadius:7, pointHoverRadius:9, labelColor:BLUE},
        {label:"China launch benchmarks", type:"scatter", data:[
          {x:2017,y:10000,tooltipLabel:"Long March 11\nFAA est.",detail:"$5.3M estimated launch price / 530 kg LEO capacity"},
          {x:2017,y:8570,tooltipLabel:"Long March 2D\nFAA est.",detail:"$30M estimated launch price / 3,500 kg LEO capacity"},
          {x:2017,y:5830,tooltipLabel:"Long March 3B\nFAA est.",detail:"$70M estimated launch price / 12,000 kg LEO capacity"},
          {x:2024,y:5000,label:"Gravity-1\nreported",tooltipLabel:"Gravity-1\nreported",labelOffset:{x:10,y:-32},detail:"Published Gravity-1 figure: roughly $5,000/kg to LEO"}
        ], backgroundColor:BROWN, borderColor:"#fff", borderWidth:2, pointStyle:"triangle", pointRadius:7, pointHoverRadius:9, labelColor:"#8a5a13"},
        {label:"Starship era (est./target)", data:[
          {x:2024,y:400,label:"Starship\nearly ops est.",labelOffset:{x:8,y:-24}},
          {x:2026,y:100,label:"Starship\n2026 target",labelOffset:{x:8,y:38}},
          {x:2030,y:10,label:"Starship fleet\n2030 goal",labelOffset:{x:-86,y:-38}}
        ], borderColor:DARK, backgroundColor:DARK, pointStyle:"rect", pointRadius:7, pointHoverRadius:9, tension:.15}
      ]}, options:{responsive:true, maintainAspectRatio:false, interaction:{mode:"nearest",intersect:true}, plugins:{legend:{position:"top"}, tooltip:{callbacks:{label(ctx){const raw=ctx.raw;const visibleLabel=raw.tooltipLabel||raw.label;const base=ctx.dataset.label+": "+(visibleLabel?visibleLabel.replace(/\n/g," - ")+" / ":"")+raw.x+" / "+formatCost(raw.y);return raw.detail?[base,raw.detail]:base;}}}, exhibitAnnotationPlugin:{eraBands:[{from:2010,to:2023.5,color:"rgba(233,44,44,.08)",label:"FALCON 9 ERA",labelColor:"rgba(233,44,44,.55)"},{from:2023.5,to:2032,color:"rgba(38,37,43,.06)",label:"STARSHIP ERA",labelColor:"rgba(38,37,43,.48)"}],callouts:[{x:2017,y:850,text:"SpaceX: ~98% cost\nreduction 2010-2026",dx:0,dy:-20}]}}, scales:{x:{type:"linear",min:1963,max:2032,title:{display:true,text:"Year"},ticks:{stepSize:10},grid:{color:"#f2f2f2"}}, y:{type:"logarithmic",min:5,max:200000,title:{display:true,text:"Cost / price per kg to LEO (log scale)"},ticks:{callback:formatCost},grid:{color:"#eee"}}}}});
    },
    launchCount(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:launchYears, datasets:launchCats.map((cat) => ({label:cat.label,data:cat.counts,backgroundColor:projectedColors(cat.color),borderColor:"#fff",borderWidth:.8,stack:"count",borderRadius:cat.label==="Rest of World"?3:0}))}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:14,font:{size:10}}},tooltip:stackedTooltip(" launches"),exhibitAnnotationPlugin:{projectedAfterIndex:3.5,projectedLabel:false,totalLabels:{totals:[186,223,259,320,354],labels:["186","223","259","320","354"]}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,title:{display:true,text:"Number of orbital launches"},grid:{color:"#f0f0f0"},suggestedMax:390}}}});
    },
    launchMass(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:launchYears, datasets:launchCats.map((cat) => ({label:cat.label,data:cat.mass,backgroundColor:projectedColors(cat.color),borderColor:"#fff",borderWidth:.8,stack:"mass",borderRadius:cat.label==="Rest of World"?3:0}))}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:14,font:{size:10}}},tooltip:stackedTooltip("t"),exhibitAnnotationPlugin:{projectedAfterIndex:3.5,projectedLabel:false,totalLabels:{totals:[1394,1824,2226,2807,3225],labels:["1394t","1824t","2226t","2807t","3225t"]}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,title:{display:true,text:"Mass to orbit (tonnes)"},grid:{color:"#f0f0f0"},suggestedMax:3500}}}});
    },
    starlinkMetrics(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:starD2CYears, datasets:[
        {label:"Expected revenue ($B)",data:starD2CRevenue,backgroundColor:RED,borderRadius:4,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"Expected EBITDA ($B)",data:starD2CEbitda,backgroundColor:DARK,borderRadius:4,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"Blended EBITDA margin (%)",type:"line",data:starD2CMargin,borderColor:BLUE,backgroundColor:BLUE,pointStyle:"circle",pointRadius:3,pointHoverRadius:5,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.3,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("margin")>-1)return ctx.dataset.label+": "+ctx.raw+"%";return ctx.dataset.label+": "+formatBillions(ctx.raw);}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions (log scale)",{type:"logarithmic",min:0.3,max:120,ticks:{callback:(value)=>[0.5,1,2,5,10,25,50,100].indexOf(value)>-1?"$"+value+"B":null}}),y1:slickAxis("Blended EBITDA margin (%)",{position:"right",grid:{display:false},min:56,max:68,ticks:{font:{size:10},color:BLUE,maxTicksLimit:8,callback:(value)=>value+"%"}})}}});
    },
    starlinkConnectivity(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:starConnYears, datasets:[
        {label:"Revenue ($B)",data:starConnRevenue,backgroundColor:RED,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA ($B)",data:starConnEbitda,backgroundColor:DARK,borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA margin (%)",type:"line",data:starConnMargin,borderColor:BLUE,backgroundColor:BLUE,pointStyle:"circle",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.32,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("margin")>-1)return ctx.dataset.label+": "+ctx.raw+"%";return ctx.dataset.label+": "+formatBillions(ctx.raw);}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions",{position:"left",beginAtZero:true}),y1:slickAxis("EBITDA margin (%)",{position:"right",grid:{display:false},min:55,max:70,ticks:{font:{size:10},color:BLUE,maxTicksLimit:6,callback:(value)=>value+"%"}})}}});
    },
    broadbandMarket(canvas){
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
    mobileMarket(canvas){
      const mobileRevenue = [1060,1100,1150,1180,1210];
      const dtcRevenue = [.1,.2,.5,1.0,2.5];
      const mobileEbitda = [370,385,384,393,409];
      const dtcEbitda = [.02,.04,.11,.25,.75];
      const dtcShare = [.009,.018,.043,.085,.207];
      return buildChart(canvas, {type:"bar", data:{labels:starYears, datasets:[
        {label:"Global mobile (excl. DTC)",data:mobileRevenue.map((value,index)=>value-dtcRevenue[index]),backgroundColor:"#dedede",stack:"mobile",borderRadius:0,borderSkipped:false,barPercentage:.6,categoryPercentage:.72,yAxisID:"y"},
        {label:"Starlink DTC",data:dtcRevenue,backgroundColor:projectedColors(RED),stack:"mobile",borderRadius:0,borderSkipped:false,barPercentage:.6,categoryPercentage:.72,minBarLength:4,yAxisID:"y"},
        {label:"Mobile EBITDA ($B)",type:"line",data:mobileEbitda,borderColor:"#444",backgroundColor:"#444",pointStyle:"rectRounded",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#444",pointBorderWidth:1,borderWidth:2.5,borderDash:[7,4],tension:.18,yAxisID:"y1"},
        {label:"DTC EBITDA ($B)",type:"line",data:dtcEbitda,borderColor:RED,backgroundColor:RED,pointRadius:4,pointHoverRadius:6,pointBorderColor:RED,pointBorderWidth:1,borderWidth:2.5,borderDash:[2,4],tension:.18,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:14,right:4,bottom:0,left:0}},plugins:{legend:{position:"top",align:"start",labels:{usePointStyle:false,boxWidth:22,boxHeight:8,padding:10,color:DARK,font:{size:10,weight:"700"}}},tooltip:withSlickTooltip({label(ctx){return ctx.dataset.label+": "+formatBillions(ctx.raw);},afterBody(items){return "DTC market share: "+dtcShare[items[0].dataIndex]+"%";}}),exhibitAnnotationPlugin:{totalLabels:{totals:mobileRevenue,labels:mobileRevenue.map((value)=>"$"+value+"B"),color:DARK,font:"700 12px Arial"}}},scales:{x:slickAxis("",{stacked:true,grid:{display:false},ticks:{font:{size:10},color:"#444",maxRotation:0,minRotation:0}}),y:slickAxis("Total Market Revenue ($B)",{stacked:true,beginAtZero:true,max:1300,ticks:{font:{size:10},color:"#444",stepSize:200},grid:{color:"rgba(38,37,43,.08)",drawBorder:false}}),y1:slickAxis("EBITDA ($B)",{position:"right",beginAtZero:true,max:550,grid:{display:false},ticks:{font:{size:10},color:"#444",stepSize:100}})}}});
    },
    horizon(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["5-Year (2026-2030)","10-Year (2026-2035)","Blended (55/35/10)","20-Year (2026-2045)"],datasets:[{label:"Enterprise Value ($B)",data:[840,2686,2421,10191],backgroundColor:[LIGHT_GREY,RED,RED_SOFT,DARK],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>"$"+ctx.raw.toLocaleString()+"B"}}},scales:{y:{ticks:{callback:(value)=>"$"+value.toLocaleString()+"B"},grid:{color:"#f0f0f0"}},x:{grid:{display:false}}}}});
    },
    monteCarlo(canvas){
      const mcCounts = [45,243,236,184,218,299,462,444,386,326,285,239,221,189,249,113,111,168,85,59,49,44,81,36,20,23,19,20,17,15,22,18,7,5,37,6,4,2,1,12];
      const mcLabels = mcCounts.map((_,i)=>"$"+(i*0.25).toFixed(2)+"-"+((i+1)*0.25).toFixed(2)+"T");
      return buildChart(canvas, {type:"bar", data:{labels:mcLabels,datasets:[{label:"Trial Count",data:mcCounts,backgroundColor:(ctx)=>{const i=ctx.dataIndex;if(i<=2)return "#fecaca";if(i>=14)return "#bbf7d0";return RED;},borderRadius:1,barPercentage:.92,categoryPercentage:.96}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+" trials"}}},scales:{y:{title:{display:true,text:"Number of Trials"},grid:{color:"#f0f0f0"}},x:{ticks:{autoSkip:false,maxRotation:0,font:{size:10},callback:(value,index)=>index%4===0?"$"+(index*0.25)+"T":""},grid:{display:false}}}}});
    },
    sotp(canvas){
      const labelPlugin = {id:"sotpBaseValueLabels", afterDatasetsDraw(chart){const meta=chart.getDatasetMeta(1);const dataset=chart.data.datasets[1];const ctx=chart.ctx;ctx.save();ctx.fillStyle=DARK;ctx.font="700 10px Arial";ctx.textAlign="center";ctx.textBaseline="bottom";meta.data.forEach((bar,index)=>{const value=dataset.data[index];if(value<1)return;ctx.fillText("$"+value.toLocaleString(),bar.x,bar.y-4);});ctx.restore();}};
      return buildChart(canvas, {type:"bar", data:{labels:sotpLabels,datasets:[
        {label:"Bear EV",data:sotpContributions.bear,backgroundColor:sotpScenarioColors.bear,borderColor:RED_SOFT,borderWidth:1,borderRadius:2,barPercentage:.76,categoryPercentage:.7},
        {label:"Base EV",data:sotpContributions.base,backgroundColor:sotpScenarioColors.base,borderColor:RED,borderWidth:1,borderRadius:2,barPercentage:.76,categoryPercentage:.7},
        {label:"Bull EV",data:sotpContributions.bull,backgroundColor:sotpScenarioColors.bull,borderColor:DARK,borderWidth:1,borderRadius:2,barPercentage:.76,categoryPercentage:.7}
      ]}, plugins:[labelPlugin], options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{boxWidth:10,boxHeight:10,color:DARK,font:{size:11,weight:"700"}}},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw.toLocaleString()+"B"}}},scales:{y:{title:{display:true,text:"EV ($B)"},ticks:{callback:(value)=>"$"+value.toLocaleString()},grid:{color:"#e5e5e5"}},x:{title:{display:true,text:"Business segment"},grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}}}}});
    },
    sotpCumulative(canvas){
      return buildChart(canvas, {type:"line", data:{labels:sotpLabels,datasets:[
        {label:"Base cumulative",data:cumulativeSotp(sotpContributions.base,2257),borderColor:sotpScenarioColors.base,backgroundColor:"rgba(233,44,44,.08)",pointBackgroundColor:sotpScenarioColors.base,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:3,tension:.34,cubicInterpolationMode:"monotone",fill:false},
        {label:"Bear cumulative",data:cumulativeSotp(sotpContributions.bear,326),borderColor:sotpScenarioColors.bear,backgroundColor:"rgba(252,165,165,.12)",pointBackgroundColor:sotpScenarioColors.bear,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:2.5,tension:.34,cubicInterpolationMode:"monotone",fill:false},
        {label:"Bull cumulative",data:cumulativeSotp(sotpContributions.bull,4983),borderColor:sotpScenarioColors.bull,backgroundColor:"rgba(38,37,43,.08)",pointBackgroundColor:sotpScenarioColors.bull,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:2.5,tension:.34,cubicInterpolationMode:"monotone",fill:false}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{boxWidth:24,boxHeight:3,color:DARK,font:{size:11,weight:"700"}}},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw.toLocaleString()+"B",afterBody(items){if(!items.length)return "";const index=items[0].dataIndex;const key=items[0].datasetIndex===0?"base":items[0].datasetIndex===1?"bear":"bull";return "Segment contribution: $"+sotpContributions[key][index].toLocaleString()+"B";}}}},scales:{y:{title:{display:true,text:"Cumulative EV ($B)"},ticks:{callback:(value)=>"$"+value.toLocaleString()},grid:{color:"#e5e5e5"}},x:{title:{display:true,text:"Segment (largest to smallest by Base EV)"},grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}}}}});
    },
    revenue(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Starlink Connectivity",data:[15,21.3,30.5,44,63.8,83.4,109.2,143.5,189.1,249.7],backgroundColor:RED},
        {label:"Colossus DCs",data:[15.8,22.5,32.3,46.8,68.2,85.9,108.3,136.9,173.4,219.9],backgroundColor:DARK},
        {label:"Launch Services",data:[12.1,17.3,24.9,36,52.4,68.6,90.1,118.7,156.9,207.7],backgroundColor:RED_SOFT},
        {label:"Starlink D2C",data:[.98,1.7,3.1,5.5,10,15.3,23.8,37.2,58.9,94.1],backgroundColor:"#404042"},
        {label:"xAI + Starshield + Other",data:[12.3,17.2,24.4,34.7,50,77.6,105.3,145.3,204,292.2],backgroundColor:GREY}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw+"B"}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,ticks:{callback:(value)=>"$"+value+"B"},grid:{color:"#f0f0f0"}}}}});
    },
    ufcf(canvas){
      return buildChart(canvas, {type:"line", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Total UFCF ($B)",data:[10,14.9,22.2,33.4,50.5,67.8,91.3,124,169.8,234.9],borderColor:RED,backgroundColor:"rgba(233,44,44,.1)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:RED},
        {label:"Total Revenue ($B)",data:[56.2,80.1,115.2,167.1,244.4,330.7,436.7,581.7,782.3,1063.7],borderColor:DARK,backgroundColor:"rgba(38,37,43,.05)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:DARK,yAxisID:"y2"}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"}},scales:{y:{ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"UFCF ($B)"},grid:{color:"#f0f0f0"}},y2:{position:"right",ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"Revenue ($B)"},grid:{display:false}},x:{grid:{display:false}}}}});
    },
    comps(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["Defence Prime","Tech Mega-Cap","AI Labs Median","AI/Growth Median","SpaceX IPO $1.75T","SpaceX DCF Central","Palantir","NVIDIA"],datasets:[{label:"EV / Revenue",data:[2.1,4.7,24.5,16.5,31.4,43.1,46.7,21.5],backgroundColor:[LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,RED_SOFT,RED,"#404042",LIGHT_GREY],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+"x EV/Rev"}}},scales:{y:{ticks:{callback:(value)=>value+"x"},grid:{color:"#f0f0f0"}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
    },
    tornado(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["WACC +/-150bps","Terminal g +/-100bps","Governance discount","Starship 24-month slip","Speculative bucket","NOL / NWC assumptions","Colossus DCs demand","Starlink D2C"],datasets:[
        {label:"Downside Impact ($B)",data:[-751,-185,-482,-139,-27,-25,-25,-27],backgroundColor:"rgba(233,44,44,.8)"},
        {label:"Upside Impact ($B)",data:[1467,509,0,86,53,35,19,11],backgroundColor:"rgba(38,37,43,.8)"}
      ]}, options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"},tooltip:{callbacks:{label:(ctx)=>ctx.raw>0?"+$"+ctx.raw+"B":"$"+ctx.raw+"B"}}},scales:{x:{ticks:{callback:(value)=>"$"+value+"B"},grid:{color:"#f0f0f0"}},y:{grid:{display:false}}}}});
    },
    hyperliquid(canvas){
      return buildChart(canvas, {type:"line", data:{labels:["Wk-4","Wk-3","Wk-2","Wk-1","Now"],datasets:[
        {label:"EV Implied ($T)",data:[2.22,2.31,2.17,2.39,2.45],borderColor:RED,backgroundColor:"rgba(233,44,44,.08)",fill:true,tension:.4,pointRadius:5,pointBackgroundColor:RED},
        {label:"Daily Volume ($M)",data:[38,41,35,44,42],borderColor:"#404042",backgroundColor:"rgba(64,64,66,.05)",fill:false,tension:.4,pointRadius:4,pointBackgroundColor:"#404042",yAxisID:"y2"}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10}}}},scales:{y:{min:2,max:2.6,ticks:{callback:(value)=>"$"+value+"T"},grid:{color:"#f0f0f0"}},y2:{position:"right",ticks:{callback:(value)=>value+"M vol"},grid:{display:false}},x:{grid:{display:false}}}}});
    },
    polymarket(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["<$1.5T","$1.5-2.0T","$2.0-2.5T","$2.5-3.0T",">$3.0T"],datasets:[{label:"Market Probability",data:[4,12,58,19,7],backgroundColor:["#fca5a5","#fca5a5",RED,RED_SOFT,"#fca5a5"],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+"% probability"}}},scales:{y:{ticks:{callback:(value)=>value+"%"},grid:{color:"#f0f0f0"},max:70},x:{grid:{display:false},ticks:{font:{size:10}}}}}});
    },
    buRevenueEbitda(canvas){
      const d = buChartDefs[canvas.dataset.buIndex];
      return buildChart(canvas, {type:"bar", data:{labels:buLabels,datasets:[
        {label:"Revenue",data:d.re.r,backgroundColor:"rgba(233,44,44,.75)",borderRadius:2,order:2},
        {label:"EBITDA",data:d.re.e,backgroundColor:"rgba(38,37,43,.75)",borderRadius:2,order:1}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10}}}},scales:buScaleOpts}});
    },
    buUfcf(canvas){
      const d = buChartDefs[canvas.dataset.buIndex];
      return buildChart(canvas, {type:"line", data:{labels:buLabels,datasets:[
        {label:"UFCF",data:d.fc,borderColor:RED,backgroundColor:"rgba(233,44,44,.1)",fill:true,tension:.3,pointRadius:3,pointBackgroundColor:RED}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10}}}},scales:buScaleOpts}});
    }
  };

  const chartImageMap = {
    launch_cost_learning_curve: {caption:"Launch Cost Learning Curve: Cost / Price per kg to Low Earth Orbit", source:"Hover any point for vehicle, year, and cost/price per kg basis. Competitor points use public launch-price or reported revenue-per-launch benchmarks divided by published LEO capacity. Y-axis is logarithmic.", panels:[{key:"launchCost", title:"Launch Cost Learning Curve: Cost / Price per kg to Low Earth Orbit", height:430}]},
    global_launch_activity: {caption:"Global Orbital Launch Activity - 2022 to 2026E", source:"2026E bars use diagonal hatching to indicate projected estimates. Hover stacks for category-level counts and tonnage.", panels:[{key:"launchCount", title:"Annual Launches to Orbit - Count", height:330},{key:"launchMass", title:"Annual Mass Delivered to Orbit - Weight", height:330}]},
    starlink_market_growth: {caption:"Starlink Connectivity Projections & Global Broadband Market", source:"Starlink Connectivity (Consumer + Av/Mar): revenue, EBITDA, and margin from Dialectic model P&L_Consolidated, probability-weighted, 2026-2035. All years are model projections. Broadband market panel: Starlink series from the model; market revenue/EBITDA extrapolated from memo data (~8% CAGR decaying to ~6%, not a model output).", panels:[{key:"starlinkConnectivity", title:"Starlink Connectivity - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380},{key:"broadbandMarket", title:"Global Broadband Market vs Starlink Penetration (2026-2035)", height:380}]},
    starlink_penetration_v5: {caption:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", source:"Global mobile market and Starlink DTC penetration from the supplied memo chart data. D2C economics panel from Dialectic model Starlink_D2C sheet, probability-weighted, 2026-2035; revenue/EBITDA on logarithmic left axis.", panels:[{key:"mobileMarket", title:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", height:380},{key:"starlinkMetrics", title:"Starlink Direct-to-Cell - Revenue, EBITDA & Margin (Model, 2026-2035)", height:380}]},
    chart_01_horizon: {caption:"Enterprise value by horizon", source:"Dialectic SOTP-DCF model, 10-year horizon. WACC 9.0%, terminal growth 4.0%. Bear/Base/Bull scenario weighting via central Scenario Engine.", panels:[{key:"horizon", title:"Enterprise Value by Horizon", height:280}]},
    chart_02_montecarlo: {caption:"Monte Carlo equity-value distribution", source:"Dialectic Monte Carlo engine - 5,000 trials drawing on WACC, terminal growth, and per-segment scenario outcomes.", panels:[{key:"monteCarlo", title:"Monte Carlo Distribution - 5,000 Trials", height:280}]},
    chart_03_sotp: {caption:"SOTP enterprise value by segment", source:"Dialectic SOTP model - PV of 10-year UFCF plus Gordon-Growth terminal value, per business unit.", panels:[{key:"sotp", title:"SOTP - Segment EV ($B) by Scenario", height:360}]},
    chart_09_sotp_cumulative: {caption:"Cumulative SOTP enterprise value", source:"Same SOTP segment values as above, stacked cumulatively from largest to smallest Base EV contribution.", panels:[{key:"sotpCumulative", title:"SOTP Cumulative Build - How Segments Stack to Total EV", height:340}]},
    chart_04_revenue: {caption:"Consolidated revenue projections", source:"Dialectic consolidated P&L - probability-weighted segment revenue, anchored to SpaceX S-1 FY2025 revenue.", panels:[{key:"revenue", title:"Total Revenue by Business Unit - 2026 to 2035", height:320}]},
    chart_05_ufcf: {caption:"Revenue and UFCF projection profile", source:"Dialectic DCF model - scenario-weighted unlevered free cash flow build across the twelve business units.", panels:[{key:"ufcf", title:"Unlevered Free Cash Flow Growth - 2026 to 2035", height:280}]},
    chart_06_comps: {caption:"Comparable-company EV/revenue reference set", source:"Dialectic comparables set - company filings and street consensus; EV/Revenue multiples vs SpaceX at DCF conclusion.", panels:[{key:"comps", title:"EV / Revenue Multiple Comparison", height:300}]},
    chart_07_sensitivity: {caption:"WACC and terminal-growth sensitivity", source:"Dialectic sensitivity table (Sensitivities sheet, Table 1) - blended ENTERPRISE value across WACC and terminal growth assumptions. Base cell (WACC 9.0% / g 4.0%) = $2,424B.", table:"sensitivity"},
    chart_08_tornado: {caption:"Key valuation sensitivity drivers", source:"Dialectic single-variable sensitivity analysis - swings around base equity value of $2,408B (Sensitivities sheet, Table 4).", panels:[{key:"tornado", title:"Sensitivity Tornado: Key Equity Value Drivers", height:340}]},
    chart_10_hyperliquid: {caption:"Hyperliquid implied enterprise value signal", source:"Hyperliquid pre-IPO perpetual market - trailing 30-day implied valuation, illustrative.", panels:[{key:"hyperliquid", title:"Hyperliquid - SPCX Perpetual", height:240}]},
    chart_11_polymarket: {caption:"Polymarket valuation probability distribution", source:"Polymarket SpaceX valuation prediction markets - trailing 30-day, illustrative.", panels:[{key:"polymarket", title:"Polymarket - SpaceX IPO Valuation", height:240}]}
  };

  for(let i = 1; i <= 12; i += 1){
    chartImageMap["bu_" + String(i).padStart(2, "0")] = {
      caption: "Business-unit model output",
      source: "Dialectic SOTP-DCF model - scenario-weighted Bear/Base/Bull projections at 9.0% WACC / 4.0% terminal growth, anchored to SpaceX S-1 FY2025 segment disclosures where available.",
      panels: [
        {key:"buRevenueEbitda", title:"Revenue & EBITDA ($M)", height:230, buIndex:i},
        {key:"buUfcf", title:"Unlevered Free Cash Flow ($M)", height:230, buIndex:i}
      ]
    };
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  }

  function imageKeyFromSrc(src){
    const file = String(src || "").split("/").pop().split("?")[0].split("#")[0];
    return file.replace(/\.(png|jpg|jpeg|svg|webp)$/i, "");
  }

  function chartPanelMarkup(panel){
    const attrs = [
      `data-chart-key="${escapeHtml(panel.key)}"`,
      panel.buIndex ? `data-bu-index="${panel.buIndex}"` : "",
      `aria-label="${escapeHtml(panel.title)}"`
    ].filter(Boolean).join(" ");
    return `
      <div class="interactive-chart-panel">
        <div class="interactive-chart-title">${escapeHtml(panel.title)}</div>
        <div class="interactive-chart-stage" style="--chart-height:${Number(panel.height || 320)}px">
          <canvas ${attrs}></canvas>
        </div>
      </div>`;
  }

  function sensitivityTableMarkup(){
    const rows = [
      ["7.5%", ["$3,126","up-1"], ["$3,461","up-2"], ["$3,891","up-3"], ["$4,465","up-4"], ["$5,268","up-4"]],
      ["8.25%", ["$2,524","up-1"], ["$2,746","up-1"], ["$3,020","up-1"], ["$3,367","up-2"], ["$3,821","up-3"]],
      ["9.0%", ["$2,085","down-1"], ["$2,239","down-1"], ["$2,424","base-cell"], ["$2,650","up-1"], ["$2,933","up-2"]],
      ["9.75%", ["$1,753","down-2"], ["$1,864","down-1"], ["$1,995","down-1"], ["$2,150","down-1"], ["$2,339","down-1"]],
      ["10.5%", ["$1,495","down-3"], ["$1,578","down-2"], ["$1,673","down-2"], ["$1,784","down-1"], ["$1,916","down-1"]]
    ];
    return `
      <div class="interactive-table-wrap">
        <div class="interactive-table-panel">
          <div class="interactive-table-title">Blended Enterprise Value ($B): WACC x Terminal Growth</div>
          <table class="sensitivity-table">
            <thead>
              <tr>
                <th>WACC / g</th>
                <th>3.0%</th>
                <th>3.5%</th>
                <th>4.0%</th>
                <th>4.5%</th>
                <th>5.0%</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${row[0]}</td>
                  ${row.slice(1).map(([value, className]) => `<td class="${className}">${value}</td>`).join("")}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function replaceImageWithChart(img, spec){
    const figure = img.closest(".detail-chart-card");
    if(!figure || figure.dataset.interactiveReady === "true") return;
    const oldCaption = figure.querySelector(".detail-chart-caption")?.textContent.trim();
    const caption = oldCaption || spec.caption || img.alt || "Interactive chart";
    const panels = spec.panels || [];
    const panelCount = panels.length;
    figure.classList.add("is-interactive-chart");
    figure.dataset.interactiveReady = "true";
    figure.innerHTML = `
      ${panels.length ? `<div class="interactive-chart-grid" data-panel-count="${panelCount}">${panels.map(chartPanelMarkup).join("")}</div>` : ""}
      ${spec.table === "sensitivity" ? sensitivityTableMarkup() : ""}
      <div class="interactive-chart-source">${escapeHtml(spec.source || "")}</div>
      <figcaption class="detail-chart-caption">${escapeHtml(caption)}</figcaption>`;
  }

  function replaceChartImages(){
    document.querySelectorAll(".detail-chart-card img").forEach((img) => {
      const key = imageKeyFromSrc(img.getAttribute("src"));
      const spec = chartImageMap[key];
      if(spec) replaceImageWithChart(img, spec);
    });
    decorateCharts();
    initVisibleCharts();
  }

  const chartInstances = new WeakMap();

  function initChart(canvas){
    if(chartInstances.has(canvas)) return chartInstances.get(canvas);
    const factory = chartFactories[canvas.dataset.chartKey];
    if(!factory) return null;
    // Guard against Chart.js "Canvas is already in use" if a stray instance lingers on this canvas.
    if(window.Chart && typeof window.Chart.getChart === "function"){
      const existing = window.Chart.getChart(canvas);
      if(existing){ try{ existing.destroy(); }catch(error){} }
    }
    const chart = factory(canvas);
    chartInstances.set(canvas, chart);
    return chart;
  }

  function isCanvasVisible(canvas){
    const card = canvas.closest("[data-expand-card]");
    if(card && !card.classList.contains("is-open")) return false;
    const rect = canvas.getBoundingClientRect();
    return rect.width > 20 && rect.height > 20;
  }

  function initVisibleCharts(scope){
    (scope || document).querySelectorAll("canvas[data-chart-key]").forEach((canvas) => {
      if(!isCanvasVisible(canvas)) return;
      // Isolate each chart: one failing chart must not abort the rest of the loop
      // (otherwise a single bad chart blanks every other chart in the same card).
      try{
        initChart(canvas);
      }catch(error){
        console.error("Chart init failed:", canvas.dataset.chartKey, error);
      }
    });
  }

  function textContent(node){
    return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function chartTitle(canvas){
    const panel = canvas.closest(".interactive-chart-panel");
    return textContent(panel && panel.querySelector(".interactive-chart-title")) || canvas.getAttribute("aria-label") || "Chart";
  }

  function chartSource(canvas){
    const card = canvas.closest(".detail-chart-card");
    return textContent(card && card.querySelector(".interactive-chart-source"));
  }

  let modal;
  let titleEl;
  let sourceEl;
  let stage;
  let chartWrap;
  let expandedCanvas;
  let expandedChart;
  let zoomLabel;
  let zoom = 1;
  let baseWidth = 960;
  let baseHeight = 560;

  function createModal(){
    if(modal) return;
    modal = document.createElement("div");
    modal.className = "chart-lightbox";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="chart-lightbox-panel" role="document">
        <div class="chart-lightbox-top">
          <div class="chart-lightbox-title"></div>
          <div class="chart-lightbox-controls">
            <button class="chart-lightbox-control" type="button" data-chart-zoom="out" aria-label="Zoom out" title="Zoom out">-</button>
            <span class="chart-lightbox-zoom">100%</span>
            <button class="chart-lightbox-control" type="button" data-chart-zoom="in" aria-label="Zoom in" title="Zoom in">+</button>
            <button class="chart-lightbox-control" type="button" data-chart-zoom="reset" aria-label="Reset zoom" title="Reset zoom">1:1</button>
            <button class="chart-lightbox-control" type="button" data-chart-close aria-label="Close expanded chart" title="Close">x</button>
          </div>
        </div>
        <div class="chart-lightbox-stage"></div>
        <div class="chart-lightbox-source"></div>
      </div>`;
    document.body.appendChild(modal);
    titleEl = modal.querySelector(".chart-lightbox-title");
    sourceEl = modal.querySelector(".chart-lightbox-source");
    stage = modal.querySelector(".chart-lightbox-stage");
    zoomLabel = modal.querySelector(".chart-lightbox-zoom");

    modal.addEventListener("click", (event) => {
      if(event.target === modal) closeModal();
      const closeButton = event.target.closest("[data-chart-close]");
      if(closeButton) closeModal();
      const zoomButton = event.target.closest("[data-chart-zoom]");
      if(!zoomButton) return;
      const action = zoomButton.getAttribute("data-chart-zoom");
      if(action === "in") setZoom(zoom + .2);
      if(action === "out") setZoom(zoom - .2);
      if(action === "reset") setZoom(1);
    });

    stage.addEventListener("wheel", (event) => {
      if(modal.hidden || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      setZoom(zoom + (event.deltaY < 0 ? .15 : -.15));
    }, {passive:false});

    document.addEventListener("keydown", (event) => {
      if(!modal || modal.hidden) return;
      if(event.key === "Escape") closeModal();
      if(event.key === "+" || event.key === "=") setZoom(zoom + .2);
      if(event.key === "-") setZoom(zoom - .2);
      if(event.key === "0") setZoom(1);
    });
  }

  function setZoom(value){
    zoom = Math.max(.7, Math.min(2.8, value));
    if(chartWrap){
      chartWrap.style.width = Math.round(baseWidth * zoom) + "px";
      chartWrap.style.height = Math.round(baseHeight * zoom) + "px";
    }
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
    if(expandedChart){
      requestAnimationFrame(() => {
        try{
          expandedChart.resize();
          expandedChart.update("none");
        }catch(error){}
      });
    }
  }

  function destroyExpandedChart(){
    if(expandedChart){
      try{ expandedChart.destroy(); }catch(error){}
      expandedChart = null;
    }
    if(expandedCanvas){
      chartInstances.delete(expandedCanvas);
      expandedCanvas = null;
    }
    if(chartWrap){
      chartWrap.remove();
      chartWrap = null;
    }
  }

  function copyCanvasMetadata(source, target){
    target.dataset.chartKey = source.dataset.chartKey;
    target.setAttribute("aria-label", chartTitle(source));
    if(source.dataset.buIndex) target.dataset.buIndex = source.dataset.buIndex;
  }

  function closeModal(){
    if(!modal) return;
    modal.hidden = true;
    document.body.classList.remove("chart-lightbox-open");
    destroyExpandedChart();
  }

  function openChart(canvas){
    const chart = initChart(canvas);
    if(!chart) return;
    createModal();
    destroyExpandedChart();
    try{ chart.update("none"); }catch(error){}
    const rect = canvas.getBoundingClientRect();
    const viewportMax = Math.max(320, window.innerWidth - 112);
    const sourceStage = canvas.closest(".interactive-chart-stage");
    const sourceHeight = parseFloat(getComputedStyle(sourceStage || canvas).getPropertyValue("--chart-height")) || rect.height || 360;
    baseWidth = Math.min(Math.max(rect.width * 1.65, 900), viewportMax);
    baseHeight = Math.min(Math.max(sourceHeight * 1.25, 520), Math.max(320, window.innerHeight - 180));
    if(window.innerWidth < 720){
      baseWidth = Math.min(Math.max(rect.width * 1.25, 320), window.innerWidth - 56);
      baseHeight = Math.min(Math.max(sourceHeight * 1.05, 360), Math.max(280, window.innerHeight - 168));
    }
    titleEl.textContent = chartTitle(canvas);
    const source = chartSource(canvas);
    sourceEl.textContent = source;
    sourceEl.hidden = !source;
    chartWrap = document.createElement("div");
    chartWrap.className = "chart-lightbox-chart-wrap";
    expandedCanvas = document.createElement("canvas");
    copyCanvasMetadata(canvas, expandedCanvas);
    chartWrap.appendChild(expandedCanvas);
    stage.appendChild(chartWrap);
    modal.hidden = false;
    document.body.classList.add("chart-lightbox-open");
    setZoom(1);
    const modalCanvas = expandedCanvas;
    requestAnimationFrame(() => {
      if(!modalCanvas || modalCanvas !== expandedCanvas || modal.hidden) return;
      expandedChart = initChart(modalCanvas);
      if(expandedChart){
        try{
          expandedChart.resize();
          expandedChart.update("none");
        }catch(error){}
      }
    });
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    const close = modal.querySelector("[data-chart-close]");
    if(close) close.focus({preventScroll:true});
  }

  function decorateCanvas(canvas){
    if(canvas.dataset.expandableChart === "true") return;
    canvas.dataset.expandableChart = "true";
    const host = canvas.parentElement;
    if(!host) return;
    if(getComputedStyle(host).position === "static") host.style.position = "relative";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chart-expand-btn";
    button.setAttribute("aria-label", "Expand chart");
    button.title = "Expand chart";
    button.textContent = "Expand";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openChart(canvas);
    });
    host.appendChild(button);
  }

  function decorateCharts(){
    document.querySelectorAll("main canvas[data-chart-key]").forEach(decorateCanvas);
  }

  document.addEventListener("click", (event) => {
    const canvas = event.target.closest("canvas[data-expandable-chart='true']");
    if(!canvas || canvas.closest(".chart-lightbox")) return;
    openChart(canvas);
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".expand-trigger");
    if(!trigger) return;
    const card = trigger.closest("[data-expand-card]");
    if(!card) return;
    setTimeout(() => initVisibleCharts(card), 90);
    setTimeout(() => initVisibleCharts(card), 380);
  });

  const mutationObserver = new MutationObserver(() => {
    replaceChartImages();
    decorateCharts();
  });

  window.SpaceXDashboardCharts = Object.assign(window.SpaceXDashboardCharts || {}, {
    prepareForPrint(scope){
      replaceChartImages();
      decorateCharts();
      initVisibleCharts(scope || document);
    }
  });

  replaceChartImages();
  mutationObserver.observe(document.body, {childList:true, subtree:true});
  window.addEventListener("resize", () => initVisibleCharts(), {passive:true});
})();
