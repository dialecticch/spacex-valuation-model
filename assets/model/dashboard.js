(function () {
  const YEARS = SpaceXModel.YEARS;
  const CASE_NAME = { bear: "Bear", base: "Base", bull: "Bull" };
  let baseline, state, published, active = "base", tab = "compute", last;
  const weights = { bear: 0.05, base: 0.65, bull: 0.30 };
  const charts = {};

  const $ = (id) => document.getElementById(id);

  function fmtShare(x) {
    if (!Number.isFinite(x)) return "—";
    return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtB(x) {
    if (!Number.isFinite(x)) return "—";
    const sign = x < 0 ? "−" : "";
    const ax = Math.abs(x);
    if (ax >= 1000) return sign + "$" + (ax / 1000).toFixed(2) + "T";
    return sign + "$" + ax.toFixed(1) + "B";
  }
  function fmtPct(x) {
    if (!Number.isFinite(x)) return "—";
    return (x * 100).toFixed(1) + "%";
  }
  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }
  function n(x) { return Number.isFinite(+x) ? +x : 0; }

  function boot() {
    Promise.all([
      fetch("./data/baseline.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("baseline.json " + r.status);
        return r.json();
      }),
      fetch("./data/videos.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : { videos: [] }).catch(() => ({ videos: [] })),
      fetch("./data/news.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).catch(() => ({}))
    ]).then(([model, videos, news]) => {
      baseline = model;
      state = SpaceXModel.clone(model);
      published = SpaceXModel.valueAll(baseline);
      $("badge").innerHTML = "Baseline as of <strong>" + fmtDate(model.as_of) + "</strong> · v" + model.version;
      renderChanges(model);
      renderVideos(videos);
      renderNews(news);
      renderTabs();
      bindPresets();
      renderInputs();
      renderOutputs();
    }).catch((err) => {
      $("badge").textContent = "Could not load data/baseline.json";
      $("warnings").innerHTML = '<div class="warn">' + String(err.message || err) + "</div>";
    });
  }

  function bindPresets() {
    document.querySelectorAll("[data-case]").forEach((btn) => {
      btn.addEventListener("click", () => {
        active = btn.getAttribute("data-case");
        document.querySelectorAll("[data-case]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        renderInputs();
        renderOutputs();
      });
    });
    $("reset").addEventListener("click", () => {
      state.cases[active] = SpaceXModel.clone(baseline.cases[active]);
      state.valuation = SpaceXModel.clone(baseline.valuation);
      renderInputs();
      renderOutputs();
    });
  }

  function renderTabs() {
    const tabs = [
      ["compute", "Compute"],
      ["orbital", "Orbital"],
      ["starlink", "Starlink"],
      ["launch", "Launch"],
      ["capital", "Capital"]
    ];
    $("tabs").innerHTML = "";
    tabs.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab";
      b.textContent = label;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", id === tab ? "true" : "false");
      b.addEventListener("click", () => {
        tab = id;
        renderTabs();
        renderInputs();
      });
      $("tabs").appendChild(b);
    });
  }

  function kase() { return state.cases[active]; }

  function renderInputs() {
    const host = $("inputs");
    host.innerHTML = "";
    const builders = { compute: inputsCompute, orbital: inputsOrbital, starlink: inputsStarlink, launch: inputsLaunch, capital: inputsCapital };
    builders[tab](host);
  }

  function section(host, title, hint) {
    const h = document.createElement("h2");
    h.textContent = title;
    host.appendChild(h);
    if (hint) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = hint;
      host.appendChild(p);
    }
  }

  function yearTable(host, rows) {
    const scroll = document.createElement("div");
    scroll.className = "year-scroll";
    const table = document.createElement("table");
    table.className = "year-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    const blank = document.createElement("th");
    blank.textContent = "";
    hr.appendChild(blank);
    YEARS.forEach((y) => {
      const th = document.createElement("th");
      th.textContent = String(y);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tb = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = row.label;
      tr.appendChild(th);
      for (let i = 0; i < 10; i++) {
        const td = document.createElement("td");
        if (row.read) {
          td.className = "readout";
          td.dataset.read = row.read;
          td.dataset.i = String(i);
          td.textContent = "—";
        } else {
          const input = document.createElement("input");
          input.type = "number";
          input.step = row.step || "any";
          input.setAttribute("aria-label", row.label + " " + YEARS[i]);
          const raw = row.get(i);
          const scale = row.scale || 1;
          input.value = raw == null || raw === "" ? "" : String(round(n(raw) * scale, row.digits == null ? 4 : row.digits));
          input.addEventListener("input", () => {
            const parsed = parseField(input.value);
            if (parsed == null) return;
            row.set(i, parsed / scale);
            renderOutputs();
          });
          td.appendChild(input);
        }
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    scroll.appendChild(table);
    host.appendChild(scroll);
  }

  function round(x, d) {
    const p = Math.pow(10, d);
    return Math.round(x * p) / p;
  }
  function parseField(raw) {
    const t = String(raw).trim();
    if (t === "" || t === "-" || t === "." || t === "-.") return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
  }

  function scalars(host, fields) {
    const wrap = document.createElement("div");
    wrap.className = "scalars";
    fields.forEach((f) => {
      const box = document.createElement("label");
      box.className = "scalar";
      const scale = f.scale || 1;
      const current = n(f.get()) * scale;
      const span = document.createElement("span");
      const name = document.createElement("em");
      name.textContent = f.label;
      name.style.fontStyle = "normal";
      const num = document.createElement("input");
      num.type = "number";
      num.step = f.step || "any";
      num.value = String(round(current, f.digits == null ? 2 : f.digits));
      span.appendChild(name);
      span.appendChild(num);
      box.appendChild(span);
      if (f.min != null && f.max != null) {
        const range = document.createElement("input");
        range.type = "range";
        range.min = String(f.min);
        range.max = String(f.max);
        range.step = f.step || "0.1";
        range.value = String(current);
        const write = (display) => {
          f.set(n(display) / scale);
          num.value = String(round(n(display), f.digits == null ? 2 : f.digits));
          range.value = String(display);
          renderOutputs();
        };
        range.addEventListener("input", () => write(range.value));
        num.addEventListener("input", () => {
          const parsed = parseField(num.value);
          if (parsed == null) return;
          f.set(parsed / scale);
          range.value = String(parsed);
          renderOutputs();
        });
        box.appendChild(range);
      } else {
        num.addEventListener("input", () => {
          const parsed = parseField(num.value);
          if (parsed == null) return;
          f.set(parsed / scale);
          renderOutputs();
        });
      }
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  }

  function series(obj, key) {
    if (!obj[key]) obj[key] = YEARS.map(() => 0);
    return obj[key];
  }

  function inputsCompute(host) {
    section(host, "Terrestrial compute", "Year-end gigawatts, external share, rent and build cost. About 80% internal by 2029 in the base case is a 20% external share. From 2031 the path is capped by demand. Build cost after the last entered year fades at the capital-tab rate.");
    const c = kase().colossus;
    scalars(host, [
      { label: "Rent, Q4 2026 ($B/GW-yr)", get: () => c.rentQ4_26, set: (v) => { c.rentQ4_26 = v; }, min: 10, max: 80, step: "0.5" },
      { label: "Rent, Q1 2027", get: () => c.rentQ1_27, set: (v) => { c.rentQ1_27 = v; }, min: 10, max: 90, step: "0.5" },
      { label: "Rent exit, 2027", get: () => c.rent2027, set: (v) => { c.rent2027 = v; }, min: 15, max: 100, step: "0.5" },
      { label: "Rent floor", get: () => c.rentFloor, set: (v) => { c.rentFloor = v; }, min: 5, max: 40, step: "0.5" },
      { label: "Demand cap from", get: () => c.capFrom, set: (v) => { c.capFrom = v; }, min: 2026, max: 2035, step: "1", digits: 0 },
      { label: "YE27 share persistence", get: () => c.persistence, set: (v) => { c.persistence = v; }, min: 0, max: 1.5, step: "0.05" }
    ]);
    yearTable(host, [
      { label: "YE GW path", step: "0.1", digits: 2, get: (i) => c.yeGw[i], set: (i, v) => setGw(c, i, v) },
      { label: "YE GW online", read: "gw" },
      { label: "External share %", scale: 100, step: "0.5", digits: 1, get: (i) => c.externalShare[i], set: (i, v) => { c.externalShare[i] = v; } },
      { label: "Internal $B/GW-yr", step: "0.5", digits: 1, get: (i) => c.internalPerGw[i], set: (i, v) => { c.internalPerGw[i] = v; } },
      { label: "Rent change %", scale: 100, step: "0.5", digits: 1, get: (i) => c.rentChange[i], set: (i, v) => { c.rentChange[i] = v; } },
      {
        label: "Build cost $B/GW",
        step: "0.1",
        digits: 2,
        get: (i) => buildShown(c, i),
        set: (i, v) => { c.buildCost[i] = v; }
      },
      { label: "EBITDA margin %", scale: 100, step: "0.5", digits: 1, get: (i) => c.ebitdaMargin[i], set: (i, v) => { c.ebitdaMargin[i] = v; } }
    ]);
  }

  function buildShown(c, i) {
    if (c.buildCost[i] != null && c.buildCost[i] !== "") return c.buildCost[i];
    let v = null;
    let at = -1;
    for (let k = 0; k < 10; k++) {
      if (c.buildCost[k] != null && c.buildCost[k] !== "") {
        v = n(c.buildCost[k]);
        at = k;
      }
    }
    if (v == null || i < at) return c.buildCost[i];
    return v * Math.pow(1 + n(state.valuation.buildCostFade), i - at);
  }

  function setGw(c, i, v) {
    const prev26 = n(c.yeGw[0]);
    const prev27 = n(c.yeGw[1]);
    c.yeGw[i] = v;
    if (i === 0 || i === 1) {
      const ye26 = n(c.yeGw[0]);
      const ye27 = n(c.yeGw[1]);
      const span0 = prev27 - prev26 || 1;
      const span = ye27 - ye26;
      c.q2027 = (c.q2027 || [0, 0, 0, 0]).map((q) => ye26 + ((n(q) - prev26) / span0) * span);
      const sep = n(c.sep26Gw, 1.7);
      const denom = prev26 - sep || 1;
      c.q4AvgGw = sep + ((n(c.q4AvgGw) - sep) / denom) * (ye26 - sep);
    }
  }

  function inputsOrbital(host) {
    section(host, "Orbital data centres", "Installed GW is the flights the model can spare after Starlink, external missions, Mars and Starfall, times MW per flight. Share is scaled by MW versus the base case, and does not exceed the base efficiency. Edit a GW cell to override that year.");
    const o = kase().orbital;
    scalars(host, [
      { label: "First year online", get: () => o.firstYear, set: (v) => { o.firstYear = v; }, min: 2026, max: 2035, step: "1", digits: 0 },
      { label: "MW per flight (all years)", get: () => o.mwPerFlight[0], set: (v) => { o.mwPerFlight = YEARS.map(() => v); }, min: 5, max: 80, step: "1", digits: 0 },
      { label: "Rent premium vs terrestrial", scale: 100, get: () => o.rentPremium, set: (v) => { o.rentPremium = v; }, min: 0, max: 50, step: "1", digits: 0 }
    ]);
    yearTable(host, [
      { label: "Target share %", scale: 100, step: "0.5", digits: 1, get: (i) => o.targetShare[i], set: (i, v) => { o.targetShare[i] = v; } },
      { label: "GW from flights", read: "odc" },
      { label: "GW override", step: "0.01", digits: 2, get: (i) => (o.gwOverride && o.gwOverride[i] != null ? o.gwOverride[i] : null), set: (i, v) => setOdc(o, i, v) }
    ]);
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = "Leave GW blank to use the flight build. A number fixes that year’s installed base.";
    host.appendChild(note);
  }

  function setOdc(o, i, v) {
    if (!o.gwOverride) {
      const cur = last && last.cases[active] ? last.cases[active].physical.odc.slice() : YEARS.map(() => 0);
      o.gwOverride = cur;
    }
    o.gwOverride[i] = v;
  }

  function inputsStarlink(host) {
    section(host, "Starlink", "Consumer subscribers start at 13.6 million and add the net-add row. Direct-to-cell is Starlink Mobile. Spectrum is cash, inside this segment and the consolidated free cash flow.");
    const s = kase().starlink;
    const open = n(state.constants.consumerOpeningM, 13.6);
    scalars(host, [
      { label: "Consumer ARPU, 2026 $/mo", get: () => s.arpu[0], set: (v) => { s.arpu = YEARS.map(() => v); }, min: 30, max: 120, step: "1", digits: 0 },
      { label: "Direct-to-cell ARPU $/mo", get: () => s.directArpu, set: (v) => { s.directArpu = v; }, min: 5, max: 40, step: "1", digits: 0 },
      { label: "Flights per M broadband adds", get: () => s.flightsPerMConsumer, set: (v) => { s.flightsPerMConsumer = v; }, min: 0, max: 8, step: "0.1" },
      { label: "Hardware uplift on ARPU", get: () => s.consumerUplift, set: (v) => { s.consumerUplift = v; }, min: 1, max: 1.6, step: "0.01" }
    ]);
    yearTable(host, [
      { label: "Broadband net adds, M", step: "0.1", digits: 1, get: (i) => s.netAdds[i], set: (i, v) => { s.netAdds[i] = v; } },
      {
        label: "Broadband subs YE, M",
        step: "0.1",
        digits: 1,
        get: (i) => {
          let sub = open;
          for (let k = 0; k <= i; k++) sub += n(s.netAdds[k]);
          return sub;
        },
        set: (i, v) => {
          let prev = open;
          for (let k = 0; k < i; k++) prev += n(s.netAdds[k]);
          s.netAdds[i] = v - prev;
        }
      },
      { label: "Mobile subs YE, M", step: "1", digits: 1, get: (i) => s.mobileYe[i], set: (i, v) => { s.mobileYe[i] = v; } },
      { label: "EBITDA margin %", scale: 100, step: "0.5", digits: 1, get: (i) => s.ebitdaMargin[i], set: (i, v) => { s.ebitdaMargin[i] = v; } },
      { label: "Spectrum $B", step: "0.1", digits: 1, get: (i) => s.spectrum[i], set: (i, v) => { s.spectrum[i] = v; } },
      { label: "Non-SI capex % of sales", scale: 100, step: "1", digits: 0, get: (i) => s.nonsiCapexPct[i], set: (i, v) => { s.nonsiCapexPct[i] = v; } }
    ]);
  }

  function inputsLaunch(host) {
    section(host, "Launch", "Starship flights are a path. From 2029 each flight has to be a real use: Starlink, commercial and government, HLS, Mars, Starfall, orbital compute, or the 5% spare. Flights with no use are cut. Starfall revenue starts in 2027. Falcon is the customer and Starlink counts.");
    const L = kase().launch;
    scalars(host, [
      { label: "Spare allowance from 2029", scale: 100, get: () => L.sparePct, set: (v) => { L.sparePct = v; }, min: 0, max: 15, step: "0.5", digits: 1 },
      { label: "Starfall capsules / Starship", get: () => L.starfallPerStarship, set: (v) => { L.starfallPerStarship = v; }, min: 1, max: 40, step: "1", digits: 0 },
      { label: "Customer revenue $B / mission", get: () => L.revenuePerCustomer, set: (v) => { L.revenuePerCustomer = v; }, min: 0.05, max: 0.4, step: "0.005", digits: 3 },
      { label: "HLS revenue $B / flight", get: () => L.hlsRevenuePerFlight, set: (v) => { L.hlsRevenuePerFlight = v; }, min: 0.02, max: 0.3, step: "0.005", digits: 3 }
    ]);
    yearTable(host, [
      { label: "Starship path", step: "1", digits: 0, get: (i) => L.starshipFlights[i], set: (i, v) => { L.starshipFlights[i] = v; } },
      { label: "Flown", read: "flown" },
      { label: "Cut vs path", read: "cut" },
      { label: "Starlink, 2026–28 alloc.", step: "1", digits: 0, get: (i) => L.starlinkAllocated[i], set: (i, v) => { L.starlinkAllocated[i] = v; } },
      { label: "Commercial & gov", step: "1", digits: 0, get: (i) => L.commercial[i], set: (i, v) => { L.commercial[i] = v; } },
      { label: "Lunar cargo", step: "1", digits: 0, get: (i) => L.lunar[i], set: (i, v) => { L.lunar[i] = v; } },
      { label: "Point to point", step: "1", digits: 0, get: (i) => L.pointToPoint[i], set: (i, v) => { L.pointToPoint[i] = v; } },
      { label: "HLS / Artemis", step: "1", digits: 0, get: (i) => L.hls[i], set: (i, v) => { L.hls[i] = v; } },
      { label: "Mars", step: "1", digits: 0, get: (i) => L.mars[i], set: (i, v) => { L.mars[i] = v; } },
      { label: "Starfall missions", step: "1", digits: 0, get: (i) => L.starfallMissions[i], set: (i, v) => { L.starfallMissions[i] = v; } },
      { label: "Starfall price $M", step: "0.5", digits: 1, get: (i) => L.starfallPrice[i], set: (i, v) => { L.starfallPrice[i] = v; } },
      { label: "Falcon customer", step: "1", digits: 0, get: (i) => L.falconCustomer[i], set: (i, v) => { L.falconCustomer[i] = v; } },
      { label: "Falcon Starlink", step: "1", digits: 0, get: (i) => L.falconStarlink[i], set: (i, v) => { L.falconStarlink[i] = v; } },
      { label: "Starship cost $M", step: "1", digits: 0, get: (i) => L.starshipCost[i], set: (i, v) => { L.starshipCost[i] = v; } }
    ]);
  }

  function inputsCapital(host) {
    section(host, "Capital and valuation", "Fair value uses the horizon weights below, not a blend of bear, base and bull. The cellular and M&A provision is added to consolidated capex in 2027–2030 and is outside the four segment cash flows. 2026 capex can be overridden to the quarterly guide.");
    const V = state.valuation;
    scalars(host, [
      { label: "WACC %", scale: 100, get: () => V.wacc, set: (v) => { V.wacc = v; }, min: 6, max: 14, step: "0.1", digits: 1 },
      { label: "Terminal growth %", scale: 100, get: () => V.terminalGrowth, set: (v) => { V.terminalGrowth = v; }, min: 0, max: 6, step: "0.1", digits: 1 },
      { label: "Shares, millions", get: () => V.sharesM, set: (v) => { V.sharesM = v; }, min: 10000, max: 18000, step: "1", digits: 0 },
      { label: "5-year weight %", scale: 100, get: () => V.horizon5, set: (v) => { V.horizon5 = v; }, min: 0, max: 100, step: "1", digits: 0 },
      { label: "10-year weight %", scale: 100, get: () => V.horizon10, set: (v) => { V.horizon10 = v; }, min: 0, max: 100, step: "1", digits: 0 },
      { label: "20-year weight %", scale: 100, get: () => V.horizon20, set: (v) => { V.horizon20 = v; }, min: 0, max: 100, step: "1", digits: 0 },
      { label: "Cellular / M&A $B per year", get: () => V.cellularProvision, set: (v) => { V.cellularProvision = v; }, min: 0, max: 100, step: "1", digits: 0 },
      { label: "2026 capex override $B", get: () => V.capexOverride[0], set: (v) => { V.capexOverride[0] = v; }, min: 0, max: 80, step: "0.5" },
      { label: "Build-cost fade from 2032", scale: 100, get: () => V.buildCostFade, set: (v) => { V.buildCostFade = v; }, min: -8, max: 2, step: "0.5", digits: 1 },
      { label: "Cash, 30 Sep 2026 $B", get: () => V.cash, set: (v) => { V.cash = v; }, min: 0, max: 150, step: "0.1" },
      { label: "Debt, 30 Sep 2026 $B", get: () => V.debt, set: (v) => { V.debt = v; }, min: 0, max: 80, step: "0.1" },
      { label: "Rate on existing debt %", scale: 100, get: () => V.rateExisting, set: (v) => { V.rateExisting = v; }, min: 2, max: 10, step: "0.05", digits: 2 },
      { label: "Rate on new debt %", scale: 100, get: () => V.rateNew, set: (v) => { V.rateNew = v; }, min: 3, max: 12, step: "0.1", digits: 1 },
      { label: "Rate on cash %", scale: 100, get: () => V.rateCash, set: (v) => { V.rateCash = v; }, min: 0, max: 8, step: "0.1", digits: 1 },
      { label: "Minimum cash $B", get: () => V.minCash, set: (v) => { V.minCash = v; }, min: 0, max: 50, step: "1", digits: 0 },
      { label: "Market price $/sh", get: () => V.marketPrice, set: (v) => { V.marketPrice = v; }, min: 20, max: 400, step: "0.5" }
    ]);
  }

  function renderOutputs() {
    last = SpaceXModel.valueAll(state);
    const cur = last.cases[active];
    const pub = published.cases[active];
    $("fv-label").textContent = CASE_NAME[active] + " fair value";
    $("fv").innerHTML = fmtShare(cur.fairValue) + "<small>/sh</small>";
    const delta = cur.fairValue - pub.fairValue;
    $("fv-meta").innerHTML = "Equity <b>" + fmtB(cur.equity) + "</b> · enterprise value <b>" + fmtB(cur.evBlend) + "</b> · versus the loaded baseline <b>" + (delta >= 0 ? "+" : "−") + fmtShare(Math.abs(delta)) + "</b>";

    const blend = weights.bear * last.cases.bear.fairValue + weights.base * last.cases.base.fairValue + weights.bull * last.cases.bull.fairValue;
    $("metrics").innerHTML = [
      ["5-year", fmtShare(cur.perShare5)],
      ["10-year", fmtShare(cur.perShare10)],
      ["20-year", fmtShare(cur.perShare20)],
      ["Upside vs $" + n(state.valuation.marketPrice).toFixed(2), fmtPct(cur.upside)],
      ["Optional case blend", fmtShare(blend)],
      ["Net cash", fmtB(cur.netCash)]
    ].map(([k, v]) => '<div class="metric"><span>' + k + "</span><strong>" + v + "</strong></div>").join("");
    renderWeights();

    renderWarnings(cur);
    paintReadouts(cur);
    renderSegments(cur);
    renderTornado();
    renderCompare();
    renderFinance(cur);
    renderCharts();
    renderNotes(cur);
  }

  function weightInput(name) {
    return '<input data-w="' + name + '" type="number" step="1" aria-label="' + name + ' weight percent" value="' + Math.round(weights[name] * 100) + '">';
  }

  function renderWeights() {
    const host = $("weights");
    if (!host.querySelector("input")) {
      host.innerHTML = '<span id="horizon-note"></span> Optional weights on the three cases, bear / base / bull: ' +
        weightInput("bear") + " / " + weightInput("base") + " / " + weightInput("bull") +
        ". The case blend is not a cell in v11.";
      host.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => {
          const parsed = parseField(input.value);
          if (parsed == null) return;
          weights[input.dataset.w] = parsed / 100;
          renderOutputs();
        });
      });
    }
    const note = $("horizon-note");
    if (note) {
      note.textContent = "Horizon blend inside each case: " +
        fmtPct(state.valuation.horizon5) + " / " + fmtPct(state.valuation.horizon10) + " / " + fmtPct(state.valuation.horizon20) +
        " on the 5-, 10- and 20-year values. That is the workbook’s 65/30/5. ";
    }
  }

  function renderWarnings(cur) {
    const issues = SpaceXModel.orderingIssues(state);
    const bits = [];
    if (cur.invalid) bits.push("WACC has to sit above terminal growth. The Gordon growth value is undefined at these settings.");
    if (cur.negativeSegments.length) {
      bits.push("Negative segment enterprise value: " + cur.negativeSegments.join(", ") + ".");
    }
    const cut = cur.physical.cut.reduce((m, x) => Math.max(m, x), 0);
    if (issues.length) {
      const sample = issues.slice(0, 6).map((i) => i.label + " " + i.year + " (" + i.bear + " / " + i.base + " / " + i.bull + ")").join("; ");
      bits.push("Preset order is broken on " + issues.length + " input" + (issues.length === 1 ? "" : "s") + ". Bear should sit at or below base, and base at or below bull, except build cost, which runs the other way. " + sample);
    }
    const cutNote = cut > 1
      ? " In the busiest year, " + Math.round(cut) + " Starship flights on the path have no demand-backed use, so they are cut and not valued."
      : "";
    if (!bits.length) {
      $("warnings").innerHTML = '<p class="ok-note">Presets keep bear ≤ base ≤ bull on the physical inputs. Build cost runs the other way: the bear is the expensive case. No segment value is negative.' + cutNote + "</p>";
      return;
    }
    $("warnings").innerHTML = '<div class="warn"><strong>Check the case.</strong><ul>' + bits.map((b) => "<li>" + b + "</li>").join("") + "</ul></div>";
  }

  function paintReadouts(cur) {
    document.querySelectorAll("[data-read]").forEach((td) => {
      const i = +td.dataset.i;
      const key = td.dataset.read;
      const map = { gw: cur.physical.gw, flown: cur.physical.flown, cut: cur.physical.cut, odc: cur.physical.odc };
      const v = map[key] ? map[key][i] : null;
      td.textContent = v == null ? "—" : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2));
    });
  }

  function renderSegments(cur) {
    const rows = [
      ["Colossus", cur.segments.colossus],
      ["Orbital DCs", cur.segments.orbital],
      ["Starlink", cur.segments.starlink],
      ["Launch", cur.segments.launch]
    ];
    const max = Math.max.apply(null, rows.map((r) => Math.abs(r[1].ev)));
    $("segments").innerHTML = rows.map(([name, seg]) => {
      const w = max ? Math.max(0, seg.ev) / max * 100 : 0;
      return '<div class="seg-row"><span>' + name + '</span><div class="bar"><span style="width:' + w.toFixed(1) + '%"></span></div><span class="t-num">' + fmtB(seg.ev) + " · " + fmtShare(seg.perShare) + "</span></div>";
    }).join("") + '<p class="hint">Segments sum to ' + fmtB(cur.segmentSum) + ". Consolidated enterprise value is " + fmtB(cur.evBlend) + ". Gap " + fmtB(cur.reconciliation) + " is the cellular and M&A provision, which is only in the consolidated cash flows. The workbook’s own check is the same shape.</p>";
  }

  function shock(label, mutate) {
    const baseFv = last.cases[active].fairValue;
    const down = SpaceXModel.clone(state);
    const up = SpaceXModel.clone(state);
    mutate(down, -1);
    mutate(up, 1);
    const lo = SpaceXModel.valueAll(down).cases[active].fairValue - baseFv;
    const hi = SpaceXModel.valueAll(up).cases[active].fairValue - baseFv;
    return { label, lo, hi };
  }

  function renderTornado() {
    const cpath = (group, key) => (m) => m.cases[active][group][key];
    const rows = [
      shock("WACC ±100 bps", (m, d) => { m.valuation.wacc = n(m.valuation.wacc) + d * 0.01; }),
      shock("Terminal growth ±50 bps", (m, d) => { m.valuation.terminalGrowth = n(m.valuation.terminalGrowth) + d * 0.005; }),
      shock("Terrestrial GW ±10%", (m, d) => { cpath("colossus", "yeGw")(m).forEach((v, i, a) => { if (v != null) a[i] = v * (1 + d * 0.1); }); }),
      shock("2027 exit rent ±10%", (m, d) => { m.cases[active].colossus.rent2027 = n(m.cases[active].colossus.rent2027) * (1 + d * 0.1); }),
      shock("Build cost ±10%", (m, d) => { const a = cpath("colossus", "buildCost")(m); a.forEach((v, i) => { if (v != null) a[i] = v * (1 + d * 0.1); }); }),
      shock("External share ±5 pp", (m, d) => { cpath("colossus", "externalShare")(m).forEach((v, i, a) => { a[i] = Math.min(1, Math.max(0, n(v) + d * 0.05)); }); }),
      shock("Broadband net adds ±10%", (m, d) => { cpath("starlink", "netAdds")(m).forEach((v, i, a) => { a[i] = n(v) * (1 + d * 0.1); }); }),
      shock("Consumer ARPU ±10%", (m, d) => { cpath("starlink", "arpu")(m).forEach((v, i, a) => { a[i] = n(v) * (1 + d * 0.1); }); }),
      shock("Starship path ±10%", (m, d) => { cpath("launch", "starshipFlights")(m).forEach((v, i, a) => { a[i] = n(v) * (1 + d * 0.1); }); }),
      shock("Orbital share ±2 pp", (m, d) => { cpath("orbital", "targetShare")(m).forEach((v, i, a) => { a[i] = Math.max(0, n(v) + d * 0.02); }); }),
      shock("Cellular provision ±$10B", (m, d) => { m.valuation.cellularProvision = n(m.valuation.cellularProvision) + d * 10; }),
      shock("New-debt rate ±100 bps", (m, d) => { m.valuation.rateNew = n(m.valuation.rateNew) + d * 0.01; })
    ].sort((a, b) => Math.max(Math.abs(b.lo), Math.abs(b.hi)) - Math.max(Math.abs(a.lo), Math.abs(a.hi)));
    const span = Math.max.apply(null, rows.map((r) => Math.max(Math.abs(r.lo), Math.abs(r.hi)))) || 1;
    $("tornado").innerHTML = rows.map((r) => {
      const loW = Math.abs(Math.min(0, r.lo, r.hi)) / span * 50;
      const hiW = Math.abs(Math.max(0, r.lo, r.hi)) / span * 50;
      const worse = Math.min(r.lo, r.hi);
      const better = Math.max(r.lo, r.hi);
      return '<div class="tornado-row"><span>' + r.label + '</span><div class="tornado-track"><i class="lo" style="width:' + loW.toFixed(1) + '%;right:50%"></i><i class="hi" style="width:' + hiW.toFixed(1) + '%;left:50%"></i></div><span class="t-num">' + signed(worse) + " / " + signed(better) + "</span></div>";
    }).join("");
  }

  function signed(x) {
    if (!Number.isFinite(x)) return "—";
    const sign = x > 0 ? "+" : x < 0 ? "−" : "";
    return sign + "$" + Math.abs(x).toFixed(2);
  }

  function renderCompare() {
    const head = "<tr><th>Case</th><th>Baseline</th><th>Live</th><th>Delta</th><th>Equity, live</th></tr>";
    const body = ["bear", "base", "bull"].map((name) => {
      const a = published.cases[name].fairValue;
      const b = last.cases[name].fairValue;
      return "<tr><td>" + CASE_NAME[name] + "</td><td>" + fmtShare(a) + "</td><td>" + fmtShare(b) + "</td><td>" + signed(b - a) + "</td><td>" + fmtB(last.cases[name].equity) + "</td></tr>";
    }).join("");
    $("compare").innerHTML = '<table class="data"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  function renderFinance(cur) {
    const years = [2027, 2028, 2029, 2030, 2031];
    const head = "<tr><th></th>" + years.map((y) => "<th>" + y + "</th>").join("") + "</tr>";
    const idx = years.map((y) => y - 2026);
    const row = (label, arr, fmt) => "<tr><td>" + label + "</td>" + idx.map((i) => "<td>" + fmt(arr[i]) + "</td>").join("") + "</tr>";
    $("finance").innerHTML = '<table class="data"><thead>' + head + "</thead><tbody>" +
      row("Revenue", cur.revenue, fmtB) +
      row("EBITDA", cur.ebitda, fmtB) +
      row("Capex", cur.capex, fmtB) +
      row("Unlevered FCF", cur.ufcf, fmtB) +
      row("Net interest", cur.netInterest, fmtB) +
      row("Net debt, year end", cur.endNetDebt, fmtB) +
      "</tbody></table><p class=\"hint\">Cumulative capex 2026–2030, including the cellular provision and spectrum, is " +
      fmtB(cur.cumCapex2026_30) + ". Peak new debt " + fmtB(cur.peakNewDebt) + ". Funding need beyond opening net cash " + fmtB(cur.fundingNeed) +
      ". If that gap were equity at the market price, fair value would be " + fmtShare(cur.equityFunded) + ".</p>";
  }

  function renderCharts() {
    const host = $("charts");
    if (!host.childElementCount) {
      [
        ["gw", "Compute online, GW"],
        ["rent", "External rent, $B per GW-year"],
        ["build", "Build cost per new GW, $B"],
        ["launch", "Starship flights by use"],
        ["subs", "Starlink subscribers, million"],
        ["odc", "Orbital data centres, GW"]
      ].forEach(([id, title]) => {
        const card = document.createElement("article");
        card.className = "chart-card";
        const h = document.createElement("h3");
        h.textContent = title;
        const box = document.createElement("div");
        box.className = "chart-box";
        const canvas = document.createElement("canvas");
        canvas.id = "chart-" + id;
        box.appendChild(canvas);
        const src = document.createElement("p");
        src.className = "src";
        src.textContent = "Dialectic physical-driver model · bear grey, base red, bull white";
        card.appendChild(h);
        card.appendChild(box);
        card.appendChild(src);
        host.appendChild(card);
      });
    }
    const labels = YEARS.map(String);
    const bear = last.cases.bear.physical;
    const base = last.cases.base.physical;
    const bull = last.cases.bull.physical;
    const cur = last.cases[active].physical;
    lineChart("gw", labels, [
      seriesLine("Bear total", bear.totalGw, "#A4A4A4", [4, 4]),
      seriesLine("Base total", base.totalGw, "#E92C2C", []),
      seriesLine("Bull total", bull.totalGw, "#F5F2EE", [2, 3])
    ], "GW, year-end");
    lineChart("rent", labels, [
      seriesLine("Bear", bear.rent, "#A4A4A4", [4, 4]),
      seriesLine("Base", base.rent, "#E92C2C", []),
      seriesLine("Bull", bull.rent, "#F5F2EE", [2, 3])
    ], "$B / GW-year");
    lineChart("build", labels, [
      seriesLine("Bear", bear.build, "#A4A4A4", [4, 4]),
      seriesLine("Base", base.build, "#E92C2C", []),
      seriesLine("Bull", bull.build, "#F5F2EE", [2, 3])
    ], "$B / GW");
    stackChart("launch", labels, [
      bar("Starlink", cur.uses.starlink, "#E92C2C"),
      bar("Commercial & gov", cur.uses.commercial, "#F5F2EE"),
      bar("HLS", cur.uses.hls, "#D9D9D9"),
      bar("Mars", cur.uses.mars, "#A4A4A4"),
      bar("Starfall", cur.uses.starfall, "#8d1f1f"),
      bar("Orbital DCs", cur.uses.orbital, "#5c5c66")
    ]);
    lineChart("subs", labels, [
      seriesLine("Bear broadband", bear.subs, "#A4A4A4", [4, 4]),
      seriesLine("Base broadband", base.subs, "#E92C2C", []),
      seriesLine("Bull broadband", bull.subs, "#F5F2EE", [2, 3]),
      seriesLine(CASE_NAME[active] + " direct-to-cell", cur.mobile, "#D9D9D9", [1, 2])
    ], "Million subscribers");
    lineChart("odc", labels, [
      seriesLine("Bear", bear.odc, "#A4A4A4", [4, 4]),
      seriesLine("Base", base.odc, "#E92C2C", []),
      seriesLine("Bull", bull.odc, "#F5F2EE", [2, 3])
    ], "GW, year-end");
    const launchSrc = document.querySelector("#chart-launch") && document.querySelector("#chart-launch").parentElement.querySelector(".src");
    if (launchSrc) launchSrc.textContent = CASE_NAME[active] + " case · flights actually flown, by use · Dialectic model";
  }

  function seriesLine(label, data, color, dash) {
    return { label, data, borderColor: color, backgroundColor: color, pointRadius: 0, borderWidth: 2, borderDash: dash, tension: 0.15 };
  }
  function bar(label, data, color) {
    return { label, data, backgroundColor: color, stack: "s", borderWidth: 0 };
  }

  function axis(title) {
    return {
      ticks: { color: "#A4A4A4", maxTicksLimit: 6 },
      grid: { color: "rgba(245,242,238,.08)" },
      title: { display: true, text: title, color: "#A4A4A4" }
    };
  }

  function lineChart(id, labels, datasets, yTitle) {
    upsert(id, "line", labels, datasets, yTitle, false);
  }
  function stackChart(id, labels, datasets) {
    upsert(id, "bar", labels, datasets, "Flights", true);
  }
  function upsert(id, type, labels, datasets, yTitle, stacked) {
    const canvas = $("chart-" + id);
    if (!canvas) return;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { labels: { boxWidth: 10, color: "#D9D9D9", font: { size: 10 } } } },
      scales: {
        x: { ticks: { color: "#A4A4A4", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false }, stacked: !!stacked, title: { display: true, text: "Year", color: "#A4A4A4" } },
        y: Object.assign(axis(yTitle), { stacked: !!stacked, beginAtZero: true })
      }
    };
    if (charts[id]) {
      charts[id].data.labels = labels;
      charts[id].data.datasets = datasets;
      charts[id].update();
      return;
    }
    charts[id] = new Chart(canvas, { type, data: { labels, datasets }, options });
  }

  function renderChanges(model) {
    const list = $("changes");
    list.innerHTML = "";
    (model.changelog || []).forEach((item) => {
      const li = document.createElement("li");
      const time = document.createElement("time");
      time.dateTime = item.date;
      time.textContent = "v" + item.version + " · " + fmtDate(item.date);
      const p = document.createElement("p");
      p.textContent = item.note + (item.source ? " " + item.source : "");
      li.appendChild(time);
      li.appendChild(p);
      if (item.source_url) {
        const a = document.createElement("a");
        a.href = item.source_url;
        a.textContent = item.source_url;
        a.rel = "noopener";
        li.appendChild(a);
      }
      list.appendChild(li);
    });
  }

  function renderVideos(file) {
    const host = $("videos");
    host.innerHTML = "";
    (file.videos || []).forEach((video) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "video-card";
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.src = "https://i.ytimg.com/vi/" + video.youtube_id + "/hqdefault.jpg";
      const span = document.createElement("span");
      span.textContent = video.title + (video.year ? " · " + video.year : "");
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener("click", () => {
        const frame = document.createElement("iframe");
        frame.className = "video-frame";
        frame.title = video.title;
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        frame.allowFullscreen = true;
        frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(video.youtube_id) + "?autoplay=1";
        btn.replaceWith(frame);
      });
      host.appendChild(btn);
    });
  }

  function renderNews(file) {
    const host = $("news");
    host.innerHTML = "";
    const posts = file.posts || [];
    posts.forEach((post) => {
      if (!post.url) return;
      const quote = document.createElement("blockquote");
      quote.className = "twitter-tweet";
      quote.setAttribute("data-theme", "dark");
      const a = document.createElement("a");
      a.href = post.url;
      a.textContent = post.note || post.url;
      quote.appendChild(a);
      host.appendChild(quote);
    });
    const timeline = file.timeline;
    if (timeline && timeline.href) {
      const a = document.createElement("a");
      a.className = "twitter-timeline";
      a.setAttribute("data-theme", "dark");
      a.setAttribute("data-chrome", "noheader nofooter transparent");
      a.setAttribute("data-height", String(timeline.height || 560));
      a.href = timeline.href;
      a.textContent = "Posts by @" + (timeline.handle || "SpaceX");
      host.appendChild(a);
    }
    if (!host.childElementCount) {
      host.innerHTML = '<p class="news-fallback">No timeline configured. Add a handle in data/news.json.</p>';
      return;
    }
    const start = () => {
      if (document.querySelector("script[data-x-widgets]")) return;
      const s = document.createElement("script");
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      s.charset = "utf-8";
      s.setAttribute("data-x-widgets", "1");
      document.body.appendChild(s);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      }, { rootMargin: "200px" });
      io.observe(host);
    } else start();
  }

  function renderNotes(cur) {
    $("notes").innerHTML = "v" + baseline.version + " presets reproduce the 6 Nov 2026 workbook: bear " +
      fmtShare(published.cases.bear.fairValue) + ", base " + fmtShare(published.cases.base.fairValue) + ", bull " +
      fmtShare(published.cases.bull.fairValue) + " per share. Valuation is unlevered free cash flow at a " +
      fmtPct(state.valuation.wacc) + " WACC and " + fmtPct(state.valuation.terminalGrowth) +
      " terminal growth, blended " + fmtPct(state.valuation.horizon5) + " / " + fmtPct(state.valuation.horizon10) + " / " +
      fmtPct(state.valuation.horizon20) + " across horizons, plus net cash, on " + n(state.valuation.sharesM).toLocaleString("en-US") +
      " million shares. The 2026–27 gigawatt columns are the raw path. The demand cap is applied from 2028 and only binds once the year reaches the cap-from setting. Every case prices a gigawatt off the base-case blended rent. " +
      "Selected-case cumulative capex 2026–30 is " + fmtB(cur.cumCapex2026_30) + ". <a href=\"./index.html\">Back to the memorandum</a>.";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
