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
    "Launch Services",
    "Starshield",
    "xAI Software",
    "Crewed Dragon",
    "Terafab",
    "X Platform",
    "Orbital DCs",
    "Other Space Services",
    "Deep Space Optionality"
  ];
  const sotpContributions = {
    bear:[84,28,59,70,42,13,3,6,13,2,0,0],
    base:[745,380,329,297,190,86,63,54,54,27,6,0],
    bull:[1638,836,723,654,418,189,29,119,85,77,9,0]
  };
  const sotpScenarioColors = {bear:"#fca5a5", base:RED, bull:DARK};

  function cumulativeSotp(values, total){
    let running = 0;
    return values.map((value, index) => {
      running += value;
      return index === values.length - 1 ? total : running;
    });
  }

  const buChartDefs = {
    1:{re:{r:[11500,16400,23600,34000,49300,64500,84600,111300,146800,194100],e:[5200,7600,11100,16300,23900,31700,42100,56000,74600,99500]},fc:[979,1600,2500,3800,5900,8200,11200,15400,21000,28600]},
    2:{re:{r:[2400,3100,3800,4800,6000,7300,8800,10700,12900,15700],e:[1300,1600,2000,2600,3300,4000,4800,5900,7200,8800]},fc:[873,1100,1400,1800,2200,2700,3300,4000,4900,6000]},
    3:{re:{r:[150,207,288,405,574,746,972,1300,1700,2200],e:[78,110,157,224,321,421,554,729,962,1300]},fc:[32,46,66,96,139,184,243,322,428,569]},
    4:{re:{r:[15000,21300,30500,44000,63800,83400,109200,143500,189100,249700],e:[9300,13400,19300,28000,40900,53600,70500,92900,122600,162300]},fc:[5100,7400,10700,15600,22900,29900,39200,51500,67800,89400]},
    5:{re:{r:[980,1700,3100,5500,10000,15300,23800,37200,58900,94100],e:[568,1000,1800,3300,6100,9600,15000,23800,38200,61700]},fc:[312,567,1000,1900,3600,5600,9000,14400,23300,37900]},
    6:{re:{r:[3300,4800,7100,10400,15400,20100,26200,34300,45100,59400],e:[1500,2300,3300,5000,7500,9900,13000,17200,22800,30300]},fc:[833,1200,1900,2800,4300,5700,7500,10000,13300,17800]},
    7:{re:{r:[2300,3500,5200,8000,12200,17000,23700,33100,46500,65300],e:[1100,1700,2600,4100,6400,9000,12700,18000,25500,36100]},fc:[230,360,565,891,1400,2000,2900,4100,5800,8300]},
    8:{re:{r:[15800,22500,32300,46800,68200,85900,108300,136900,173400,219900],e:[10800,15500,22500,32800,48200,60900,77200,97900,124400,158200]},fc:[1200,2000,3200,5100,8000,10500,13700,18000,23400,30600]},
    9:{re:{r:[4100,5700,7900,11200,15800,19400,23900,29500,36500,45200],e:[752,1100,1500,2200,3200,4000,5000,6300,7900,10000]},fc:[288,429,638,948,1400,1800,2300,3000,3800,4900]},
    10:{re:{r:[0,0,0,0,0,8600,14300,23900,40300,68300],e:[0,0,0,0,0,4500,7700,13000,22200,38100]},fc:[0,0,0,0,0,-51,103,464,1200,2800]},
    11:{re:{r:[0,0,0,0,0,24,27,32,38,46],e:[0,0,0,0,0,11,13,15,19,23]},fc:[0,0,0,0,0,0,1,1,1,2]},
    12:{re:{r:[0,0,0,0,0,4500,7400,12500,21100,36000],e:[0,0,0,0,0,2000,3300,5700,9900,17300]},fc:[0,0,0,0,0,419,819,1600,3000,5600]}
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
      return buildChart(canvas, {type:"bar", data:{labels:starYears, datasets:[
        {label:"Revenue ($B)",data:starRevenue,backgroundColor:projectedColors(RED),borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"EBITDA ($B)",data:starEbitda,backgroundColor:projectedColors(DARK),borderRadius:5,borderSkipped:false,barPercentage:.68,categoryPercentage:.72,yAxisID:"y"},
        {label:"Subscribers (M)",type:"line",data:starSubs,borderColor:"#ff5252",backgroundColor:"#ff5252",pointStyle:"circle",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.32,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){if(ctx.dataset.label.indexOf("Subscribers")>-1)return ctx.dataset.label+": "+ctx.raw+"M";return ctx.dataset.label+": "+formatBillions(ctx.raw);},afterBody(items){const idx=items[0].dataIndex;return "EBITDA margin: "+starMargin[idx]+"%";}})},scales:{x:slickAxis("",{grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("USD billions",{position:"left",beginAtZero:true}),y1:slickAxis("Active subscribers (M)",{position:"right",grid:{display:false},ticks:{font:{size:10},color:"#ff5252",maxTicksLimit:6}})}}});
    },
    broadbandMarket(canvas){
      const marketRevenue = [420,457,500,548,580];
      const marketEbitda = [155,169,185,208,221];
      const share = [.3,.9,1.5,2.1,2.5];
      return buildChart(canvas, {type:"bar", data:{labels:starYears, datasets:[
        {label:"Rest of market revenue ($B)",data:marketRevenue.map((value,index)=>value-starRevenue[index]),backgroundColor:"#dedede",stack:"rev",borderRadius:5,borderSkipped:false,barPercentage:.72,categoryPercentage:.72,yAxisID:"y"},
        {label:"Starlink revenue ($B)",data:starRevenue,backgroundColor:projectedColors(RED),stack:"rev",borderRadius:5,borderSkipped:false,barPercentage:.72,categoryPercentage:.72,yAxisID:"y"},
        {label:"Market EBITDA ($B)",type:"line",data:marketEbitda,borderColor:DARK,backgroundColor:DARK,pointStyle:"rectRounded",pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[6,4],tension:.3,yAxisID:"y1"},
        {label:"Starlink EBITDA ($B)",type:"line",data:starEbitda,borderColor:RED,backgroundColor:RED,pointRadius:4,pointHoverRadius:6,pointBorderColor:"#fff",pointBorderWidth:1.5,borderWidth:2.5,borderDash:[2,4],tension:.3,yAxisID:"y1"}
      ]}, options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:2,right:2,bottom:0,left:0}},plugins:{legend:slickLegend,tooltip:withSlickTooltip({label(ctx){return ctx.dataset.label+": "+formatBillions(ctx.raw);},afterBody(items){return "Starlink market share: "+share[items[0].dataIndex]+"%";}})},scales:{x:slickAxis("",{stacked:true,grid:{display:false},ticks:{font:{size:10},color:"#666",maxRotation:35,minRotation:35}}),y:slickAxis("Total market revenue ($B)",{stacked:true,beginAtZero:true}),y1:slickAxis("EBITDA ($B)",{position:"right",grid:{display:false},ticks:{font:{size:10},color:"#666",maxTicksLimit:6}})}}});
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
      return buildChart(canvas, {type:"bar", data:{labels:["5-Year (2026-2030)","10-Year (2026-2035)","Blended (55/35/10)","20-Year (2026-2045)"],datasets:[{label:"Enterprise Value ($B)",data:[831,2657,2393,10064],backgroundColor:[LIGHT_GREY,RED,RED_SOFT,DARK],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>"$"+ctx.raw.toLocaleString()+"B"}}},scales:{y:{ticks:{callback:(value)=>"$"+value.toLocaleString()+"B"},grid:{color:"#f0f0f0"}},x:{grid:{display:false}}}}});
    },
    monteCarlo(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["$0-0.25T","$0.25-0.5T","$0.5-0.75T","$0.75-1.0T","$1.0-1.25T","$1.25-1.5T","$1.5-1.75T","$1.75-2.0T","$2.0-2.25T","$2.25-2.5T","$2.5-2.75T","$2.75-3.0T","$3.0-3.5T","$3.5-4.0T","$4.0-4.5T","$4.5T+"],datasets:[{label:"Trial Count",data:[45,60,110,186,280,340,420,480,510,480,380,310,420,350,265,364],backgroundColor:(ctx)=>{const i=ctx.dataIndex;if(i<=2)return "#fecaca";if(i>=13)return "#bbf7d0";return RED;},borderRadius:2}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+" trials"}}},scales:{y:{title:{display:true,text:"Number of Trials"},grid:{color:"#f0f0f0"}},x:{ticks:{maxRotation:45,font:{size:10}},grid:{display:false}}}}});
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
        {label:"Base cumulative",data:cumulativeSotp(sotpContributions.base,2230),borderColor:sotpScenarioColors.base,backgroundColor:"rgba(233,44,44,.08)",pointBackgroundColor:sotpScenarioColors.base,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:3,tension:.34,cubicInterpolationMode:"monotone",fill:false},
        {label:"Bear cumulative",data:cumulativeSotp(sotpContributions.bear,320),borderColor:sotpScenarioColors.bear,backgroundColor:"rgba(252,165,165,.12)",pointBackgroundColor:sotpScenarioColors.bear,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:2.5,tension:.34,cubicInterpolationMode:"monotone",fill:false},
        {label:"Bull cumulative",data:cumulativeSotp(sotpContributions.bull,4777),borderColor:sotpScenarioColors.bull,backgroundColor:"rgba(38,37,43,.08)",pointBackgroundColor:sotpScenarioColors.bull,pointBorderColor:"#fff",pointBorderWidth:1.5,pointRadius:3,pointHoverRadius:6,borderWidth:2.5,tension:.34,cubicInterpolationMode:"monotone",fill:false}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{boxWidth:24,boxHeight:3,color:DARK,font:{size:11,weight:"700"}}},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw.toLocaleString()+"B",afterBody(items){if(!items.length)return "";const index=items[0].dataIndex;const key=items[0].datasetIndex===0?"base":items[0].datasetIndex===1?"bear":"bull";return "Segment contribution: $"+sotpContributions[key][index].toLocaleString()+"B";}}}},scales:{y:{title:{display:true,text:"Cumulative EV ($B)"},ticks:{callback:(value)=>"$"+value.toLocaleString()},grid:{color:"#e5e5e5"}},x:{title:{display:true,text:"Segment (largest to smallest by Base EV)"},grid:{display:false},ticks:{font:{size:9},maxRotation:45,minRotation:45}}}}});
    },
    revenue(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Starlink Connectivity",data:[15,21.3,30.5,44,63.8,83.4,109.2,143.5,189.1,249.7],backgroundColor:RED},
        {label:"Colossus DCs",data:[15.8,22.5,32.3,46.8,68.2,85.9,108.3,136.9,173.4,219.9],backgroundColor:DARK},
        {label:"Launch Services",data:[11.5,16.4,23.6,34,49.3,64.5,84.6,111.3,146.8,194.1],backgroundColor:RED_SOFT},
        {label:"Starlink D2C",data:[.98,1.7,3.1,5.5,10,15.3,23.8,37.2,58.9,94.1],backgroundColor:"#404042"},
        {label:"xAI + Starshield + Other",data:[12.2,17.3,24.3,34.8,50,77.7,105.3,145.3,204.1,292.1],backgroundColor:GREY}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"},tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label+": $"+ctx.raw+"B"}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,ticks:{callback:(value)=>"$"+value+"B"},grid:{color:"#f0f0f0"}}}}});
    },
    ufcf(canvas){
      return buildChart(canvas, {type:"line", data:{labels:["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"],datasets:[
        {label:"Total UFCF ($B)",data:[9.8,14.7,22,32.9,49.8,67,90.3,122.8,167.9,232.5],borderColor:RED,backgroundColor:"rgba(233,44,44,.1)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:RED},
        {label:"Total Revenue ($B)",data:[55.5,79.2,113.8,165.1,241.3,326.8,431.2,574.2,772.3,1049.9],borderColor:DARK,backgroundColor:"rgba(38,37,43,.05)",fill:true,tension:.3,pointRadius:5,pointBackgroundColor:DARK,yAxisID:"y2"}
      ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top"}},scales:{y:{ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"UFCF ($B)"},grid:{color:"#f0f0f0"}},y2:{position:"right",ticks:{callback:(value)=>"$"+value+"B"},title:{display:true,text:"Revenue ($B)"},grid:{display:false}},x:{grid:{display:false}}}}});
    },
    comps(canvas){
      return buildChart(canvas, {type:"bar", data:{labels:["Defence Prime","Tech Mega-Cap","AI Labs Median","AI/Growth Median","SpaceX IPO $1.75T","SpaceX DCF Central","Palantir","NVIDIA"],datasets:[{label:"EV / Revenue",data:[2.1,4.6,24.5,16.5,31.7,43.1,46.7,21.5],backgroundColor:[LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,LIGHT_GREY,RED_SOFT,RED,"#404042",LIGHT_GREY],borderRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>ctx.raw+"x EV/Rev"}}},scales:{y:{ticks:{callback:(value)=>value+"x"},grid:{color:"#f0f0f0"}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
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
    starlink_market_growth: {caption:"Starlink Growth vs Global Internet Markets - 2022 to 2026E", source:"Starlink revenue, EBITDA, subscribers, and global broadband market penetration from the supplied memo chart data.", panels:[{key:"starlinkMetrics", title:"Starlink - Revenue, EBITDA & Subscriber Growth", height:380},{key:"broadbandMarket", title:"Global Broadband Internet Service Market vs Starlink Penetration", height:380}]},
    starlink_penetration_v5: {caption:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", source:"Global mobile market and Starlink DTC penetration from the supplied memo chart data.", panels:[{key:"mobileMarket", title:"Global Mobile / Cellular Market vs Starlink Direct-to-Cell", height:380}]},
    chart_01_horizon: {caption:"Enterprise value by horizon", source:"Dialectic SOTP-DCF model, 10-year horizon. WACC 9.0%, terminal growth 4.0%. Bear/Base/Bull scenario weighting via central Scenario Engine.", panels:[{key:"horizon", title:"Enterprise Value by Horizon", height:280}]},
    chart_02_montecarlo: {caption:"Monte Carlo equity-value distribution", source:"Dialectic Monte Carlo engine - 5,000 trials drawing on WACC, terminal growth, and per-segment scenario outcomes.", panels:[{key:"monteCarlo", title:"Monte Carlo Distribution - 5,000 Trials", height:280}]},
    chart_03_sotp: {caption:"SOTP enterprise value by segment", source:"Dialectic SOTP model - PV of 10-year UFCF plus Gordon-Growth terminal value, per business unit.", panels:[{key:"sotp", title:"SOTP - Segment EV ($B) by Scenario", height:360}]},
    chart_09_sotp_cumulative: {caption:"Cumulative SOTP enterprise value", source:"Same SOTP segment values as above, stacked cumulatively from largest to smallest Base EV contribution.", panels:[{key:"sotpCumulative", title:"SOTP Cumulative Build - How Segments Stack to Total EV", height:340}]},
    chart_04_revenue: {caption:"Consolidated revenue projections", source:"Dialectic consolidated P&L - probability-weighted segment revenue, anchored to SpaceX S-1 FY2025 revenue.", panels:[{key:"revenue", title:"Total Revenue by Business Unit - 2026 to 2035", height:320}]},
    chart_05_ufcf: {caption:"Revenue and UFCF projection profile", source:"Dialectic DCF model - scenario-weighted unlevered free cash flow build across the twelve business units.", panels:[{key:"ufcf", title:"Unlevered Free Cash Flow Growth - 2026 to 2035", height:280}]},
    chart_06_comps: {caption:"Comparable-company EV/revenue reference set", source:"Dialectic comparables set - company filings and street consensus; EV/Revenue multiples vs SpaceX at DCF conclusion.", panels:[{key:"comps", title:"EV / Revenue Multiple Comparison", height:300}]},
    chart_07_sensitivity: {caption:"WACC and terminal-growth sensitivity", source:"Dialectic sensitivity table - blended equity value across WACC and terminal growth assumptions.", table:"sensitivity"},
    chart_08_tornado: {caption:"Key valuation sensitivity drivers", source:"Dialectic single-variable sensitivity analysis - swings around base equity value of $2,380B.", panels:[{key:"tornado", title:"Sensitivity Tornado: Key Equity Value Drivers", height:340}]},
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
      ["7.5%", ["$3,276","up-1"], ["$3,639","up-2"], ["$4,106","up-3"], ["$4,728","up-4"], ["$5,599","up-4"]],
      ["8.25%", ["$2,693","up-1"], ["$2,939","up-1"], ["$3,243","up-1"], ["$3,628","up-2"], ["$4,132","up-3"]],
      ["9.0%", ["$2,262","down-1"], ["$2,436","down-1"], ["$2,646","base-cell"], ["$2,902","up-1"], ["$3,223","up-2"]],
      ["9.75%", ["$1,930","down-2"], ["$2,059","down-1"], ["$2,210","down-1"], ["$2,389","down-1"], ["$2,607","down-1"]],
      ["10.5%", ["$1,669","down-3"], ["$1,766","down-2"], ["$1,879","down-2"], ["$2,009","down-1"], ["$2,164","down-1"]]
    ];
    return `
      <div class="interactive-table-wrap">
        <div class="interactive-table-panel">
          <div class="interactive-table-title">Blended Equity Value ($B): WACC x Terminal Growth</div>
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
      if(isCanvasVisible(canvas)) initChart(canvas);
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
