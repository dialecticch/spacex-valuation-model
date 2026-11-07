/**
 * Dialectic SpaceX physical-driver valuation, v11 (6 Nov 2026).
 *
 * Client-side port of the workbook: Colossus terrestrial compute, orbital data
 * centres, Starlink (including Starlink Mobile / direct-to-cell), and launch,
 * consolidated in an unlevered DCF. Fair value is enterprise value blended
 * 65/30/5 across the 5-, 10- and 20-year horizons, plus 30 Sep 2026 net cash,
 * divided by fully diluted shares.
 *
 * Interest is a financing memo. It is not deducted again: the cost of capital
 * is the WACC. Segment enterprise values use each segment's own unlevered
 * free cash flow. The cellular / M&A provision sits only in consolidated
 * capex, so the four segment EVs add up to more than consolidated EV. The
 * workbook's own check is not zero; this port reproduces that gap.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SpaceXModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

  function n(x, d) {
    const v = typeof x === "number" ? x : x == null || x === "" ? NaN : +x;
    return Number.isFinite(v) ? v : d == null ? 0 : d;
  }

  function s10(arr) {
    const out = new Array(10);
    for (let i = 0; i < 10; i++) out[i] = n(arr && arr[i], 0);
    return out;
  }

  function sum(arr, a, b) {
    let t = 0;
    for (let i = a; i <= b; i++) t += arr[i] || 0;
    return t;
  }

  function buildCostPath(inputs, fade) {
    const raw = inputs || [];
    const out = new Array(10);
    for (let i = 0; i < 10; i++) {
      if (raw[i] != null && raw[i] !== "") out[i] = n(raw[i]);
      else out[i] = (out[i - 1] || 0) * (1 + n(fade));
    }
    return out;
  }

  function blanks(len, fill) {
    const a = new Array(len);
    for (let i = 0; i < len; i++) a[i] = fill;
    return a;
  }

  /**
   * Base-case anchor. Every case converts the global AI-spend pool into a
   * gigawatt cap using the BASE blended $/GW, and scales that cap by how far
   * the case's 2027 GW sits from the base 2027 GW. Matches Colossus rows
   * 133–135 (and the bear/bull copies, which also point at the base block).
   */
  function rentPath(c) {
    // 2026 is the Q4 book rate. 2027 is the average of the Q1 ramp and the
    // Q4-27 exit rate. From 2028 the path compounds off the EXIT rate, not
    // off that 2027 average (Colossus row 144).
    const change = s10(c.rentChange);
    const floor = n(c.rentFloor, 0);
    const exit = n(c.rent2027);
    const rent = new Array(10);
    rent[0] = n(c.rentQ4_26);
    rent[1] = (n(c.rentQ1_27) + exit) / 2;
    rent[2] = Math.max(floor, exit * (1 + change[2]));
    for (let i = 3; i < 10; i++) rent[i] = Math.max(floor, rent[i - 1] * (1 + change[i]));
    return rent;
  }

  function baseAnchor(base, aiSpend) {
    const c = base.colossus;
    const share = s10(c.externalShare);
    const internal = s10(c.internalPerGw);
    const rent = rentPath(c);
    const blended = share.map((sh, i) => sh * rent[i] + (1 - sh) * internal[i]);
    const ye27 = n(c.yeGw && c.yeGw[1]);
    const ext27 = n(c.externalShare && c.externalShare[1]);
    const monetisation27 = ext27 * n(c.rent2027) + (1 - ext27) * n(c.internalPerGw && c.internalPerGw[1]);
    const spend2028 = n(aiSpend && aiSpend[2]);
    const baseShare = spend2028 ? (ye27 * monetisation27) / spend2028 : 0;
    return { blended, ye27, baseShare };
  }

  function computeCase(kase, anchor, model) {
    const V = model.valuation;
    const C = model.constants;
    const ai = s10(model.globalAiSpend);
    const fade = n(V.buildCostFade);
    const col = kase.colossus;
    const orb = kase.orbital;
    const sl = kase.starlink;
    const ln = kase.launch;

    const period = [n(C.flow2026, 0.25)];
    for (let i = 1; i < 10; i++) period.push(1);

    const extShare = s10(col.externalShare);
    const util = s10(col.utilisation).map((u, i) => (col.utilisation && col.utilisation[i] == null ? 1 : u || 0));
    for (let i = 0; i < 10; i++) if (!col.utilisation || col.utilisation[i] == null) util[i] = 1;
    const internal = s10(col.internalPerGw);
    const rent = rentPath(col);
    const blended = extShare.map((sh, i) => sh * rent[i] + (1 - sh) * internal[i]);
    const build = buildCostPath(col.buildCost, fade);
    const itShare = n(col.itShare, 0.844);
    const itLife = n(col.itLife, 5) || 5;
    const margin = s10(col.ebitdaMargin);
    const shock = s10(col.revenueShock);
    const path = s10(col.yeGw);
    const capFrom = n(col.capFrom, 2031);
    const persistence = n(col.persistence, 0);
    const caseShare = anchor.ye27 ? anchor.baseShare * (1 + persistence * (n(path[1]) / anchor.ye27 - 1)) : anchor.baseShare;
    const capGw = ai.map((spend, i) => (anchor.blended[i] ? (caseShare * spend) / anchor.blended[i] : 0));

    const spare = n(ln.sparePct, 0.05);
    const ssPath = s10(ln.starshipFlights);
    const commercial = s10(ln.commercial);
    const lunar = s10(ln.lunar);
    const p2p = s10(ln.pointToPoint);
    const hls = s10(ln.hls);
    const mars = s10(ln.mars);
    const external = commercial.map((v, i) => v + lunar[i] + p2p[i] + hls[i]);
    const starfallMissions = s10(ln.starfallMissions);
    const perShip = n(ln.starfallPerStarship, 20) || 20;
    const starfallFlights = starfallMissions.map((m, i) => (YEARS[i] >= 2029 ? m / perShip : 0));
    const testInput = s10(ln.testFlights);
    const allocated = s10(ln.starlinkAllocated);
    const f9Customer = s10(ln.falconCustomer);
    const f9Starlink = s10(ln.falconStarlink);
    const ssCost = s10(ln.starshipCost);
    const ssPrice = s10(ln.starshipPrice);
    const reuse = s10(ln.reuse);

    const netAdds = s10(sl.netAdds);
    const mobile = s10(sl.mobileYe);
    const v3 = s10(sl.v3PerStarship);
    const v3Terminal = v3[9] || v3[v3.length - 1] || 60;
    const v2PerF9 = n(sl.v2PerFalcon, 27);
    const equalsF9 = n(sl.starshipEqualsFalcon, 10);
    const v2PerV3 = v3Terminal ? (v2PerF9 * equalsF9) / v3Terminal : 1;
    const life = n(sl.designLife, 5) || 5;
    const flightsPerM = n(sl.flightsPerMConsumer, 3);
    const flightsPerDtc = n(sl.flightsPerMDirect, 0.11);
    const openingSats = n(sl.constellationSep26, 0);

    const mw = s10(orb.mwPerFlight);
    const baseMw = s10(model.cases.base.orbital.mwPerFlight);
    // Launch efficiency versus the base case: share is scaled by MW per flight
    // capped at 1 (Orbital_DCs row 112; bear/bull divide by the base-case MW).
    const targetShare = s10(orb.targetShare).map((share, i) => {
      if (!mw[i] || !baseMw[i]) return 0;
      return share * Math.min(1, mw[i] / baseMw[i]);
    });
    const firstOdc = n(orb.firstYear, 2030);
    const odcPremium = n(orb.rentPremium, 0);
    const gwOverride = Array.isArray(kase.orbital.gwOverride) ? kase.orbital.gwOverride : null;

    const starlinkFlights = blanks(10, 0);
    const odcFlights = blanks(10, 0);
    const testFlights = blanks(10, 0);
    const odcAdded = blanks(10, 0);
    const odc = blanks(10, 0);
    const replFlights = blanks(10, 0);
    const fleetV3 = blanks(10, 0);
    const need = blanks(10, 0);

    for (let i = 0; i < 10; i++) {
      const budget = (1 + spare) ? ssPath[i] / (1 + spare) : ssPath[i];
      if (i < 3) {
        testFlights[i] = Math.min(testInput[i], Math.max(0, ssPath[i] - external[i] - mars[i]));
        starlinkFlights[i] = Math.min(
          allocated[i],
          Math.max(0, ssPath[i] - external[i] - mars[i] - starfallFlights[i] - testFlights[i])
        );
      } else {
        const eol = (i === 0 ? 0 : fleetV3[i - 1]) / life;
        const growth = flightsPerM * netAdds[i] + flightsPerDtc * (mobile[i] - (i ? mobile[i - 1] : 0));
        const repl = v3[i] ? eol / v3[i] : 0;
        need[i] = Math.max(starlinkFlights[i - 1], growth + repl);
        starlinkFlights[i] = Math.min(
          need[i],
          Math.max(0, budget - external[i] - mars[i] - starfallFlights[i])
        );
      }

      const priorOdc = i ? odc[i - 1] : 0;
      const target = YEARS[i] >= firstOdc ? targetShare[i] * capGw[i] : 0;
      const headroom = Math.max(0, target - priorOdc);
      replFlights[i] = i === 0 || !mw[i] ? 0 : (priorOdc / itLife) * 1000 / mw[i];
      const wantNew = !mw[i] ? 0 : headroom * 1000 / mw[i];
      const available = Math.max(0, budget - external[i] - mars[i] - starfallFlights[i] - starlinkFlights[i]);
      odcFlights[i] = Math.min(replFlights[i] + wantNew, available);
      const added = Math.max(0, odcFlights[i] - replFlights[i]) * (mw[i] || 0) / 1000;
      if (gwOverride && gwOverride[i] != null && gwOverride[i] !== "") {
        odc[i] = Math.max(0, n(gwOverride[i]));
        odcAdded[i] = Math.max(0, odc[i] - priorOdc);
      } else {
        odcAdded[i] = added;
        odc[i] = priorOdc + added;
      }

      if (i >= 3) {
        testFlights[i] = spare * (external[i] + mars[i] + starfallFlights[i] + starlinkFlights[i] + odcFlights[i]);
      }

      const deployedV3 = (v2PerV3 ? f9Starlink[i] * v2PerF9 / v2PerV3 : 0) + starlinkFlights[i] * v3[i];
      if (i === 0) fleetV3[i] = (v2PerV3 ? openingSats / v2PerV3 : 0) + deployedV3;
      else fleetV3[i] = fleetV3[i - 1] + deployedV3 - fleetV3[i - 1] / life;
    }

    const gw = new Array(10);
    gw[0] = path[0];
    gw[1] = path[1];
    for (let i = 2; i < 10; i++) {
      if (YEARS[i] >= capFrom) gw[i] = Math.max(gw[i - 1], Math.min(path[i], capGw[i] - odc[i]));
      else gw[i] = path[i];
    }

    const q = [n(col.q2027 && col.q2027[0]), n(col.q2027 && col.q2027[1]), n(col.q2027 && col.q2027[2]), n(col.q2027 && col.q2027[3])];
    const avg = new Array(10);
    avg[0] = n(col.q4AvgGw, (n(col.sep26Gw, 1.7) + gw[0]) / 2);
    avg[1] = ((gw[0] + q[0]) / 2 + (q[0] + q[1]) / 2 + (q[1] + q[2]) / 2 + (q[2] + q[3]) / 2) / 4;
    for (let i = 2; i < 10; i++) avg[i] = (gw[i - 1] + gw[i]) / 2;

    const sep = n(col.sep26Gw, 1.7);
    const addedGw = gw.map((g, i) => g - (i ? gw[i - 1] : sep));
    const pre = s10(col.refreshPre2026);
    const refreshGw = addedGw.map((a, i) => (i >= 5 ? addedGw[i - 5] : 0) + pre[i]);
    const growthCapex = addedGw.map((a, i) => a * build[i]);
    const refreshCapex = refreshGw.map((a, i) => a * itShare * build[i]);
    const siCapex = growthCapex.map((g, i) => g + refreshCapex[i]);

    const extRev = avg.map((g, i) => g * extShare[i] * rent[i] * util[i] * period[i]);
    const ownRev = avg.map((g, i) => g * (1 - extShare[i]) * internal[i] * period[i]);
    const colRev = extRev.map((r, i) => r + ownRev[i] + shock[i]);
    const colEbitda = colRev.map((r, i) => r * margin[i]);

    const odcAvg = odc.map((g, i) => (i ? (odc[i - 1] + g) / 2 : g / 2));
    const odcRent = blended.map((b) => b * (1 + odcPremium));
    const odcRev = odcAvg.map((g, i) => g * odcRent[i] * period[i]);
    const odcEbitda = odcRev.map((r, i) => r * margin[i]);
    const odcCost = build.map((b, i) => (mw[i] ? b + ((1 + spare) * ssCost[i]) / mw[i] : b));
    const odcCapex = odcAdded.map((a, i) => (a + (i ? odc[i - 1] / itLife : 0)) * odcCost[i]);

    const openingSubs = n(C.consumerOpeningM, 13.6);
    const subs = new Array(10);
    subs[0] = openingSubs + netAdds[0];
    for (let i = 1; i < 10; i++) subs[i] = subs[i - 1] + netAdds[i];
    const avgSubs = subs.map((s, i) => ((i ? subs[i - 1] : openingSubs) + s) / 2);
    const arpu = s10(sl.arpu);
    const uplift = n(sl.consumerUplift, 1);
    const consumerRev = avgSubs.map((s, i) => (s * arpu[i] * 12 * uplift * period[i]) / 1000);
    const entGrowth = s10(sl.enterpriseGrowth);
    const ent = new Array(10);
    ent[0] = n(sl.enterpriseQ4_26);
    ent[1] = n(C.enterpriseQ3Quarterly, 2.127) * 4 * (1 + entGrowth[1]);
    for (let i = 2; i < 10; i++) ent[i] = ent[i - 1] * (1 + entGrowth[i]);
    const dtcArpu = n(sl.directArpu, 0);
    const dtc = mobile.map((m, i) => (i === 0 ? 0 : (((i ? mobile[i - 1] : 0) + m) / 2) * dtcArpu * 12) / 1000);
    const connRev = consumerRev.map((r, i) => r + ent[i] + dtc[i]);
    const connMargin = s10(sl.ebitdaMargin);
    const connEbitda = connRev.map((r, i) => r * connMargin[i]);

    const flown = external.map((e, i) => e + mars[i] + starfallFlights[i] + starlinkFlights[i] + odcFlights[i] + testFlights[i]);
    const cut = ssPath.map((p, i) => p - flown[i]);
    const priceCustomer = n(ln.revenuePerCustomer, 0.14725);
    const hlsPrice = n(ln.hlsRevenuePerFlight, 0);
    const starfallPrice = s10(ln.starfallPrice);
    const already = n(C.customerMissionsAlready2026, 39);
    const customerMissions = f9Customer.map((f, i) => f + external[i] - (i === 0 ? already : 0));
    const falconRev = customerMissions.map((m, i) => (m - external[i]) * priceCustomer);
    const starshipRev = commercial.map((c, i) => (c + lunar[i] + p2p[i]) * ssPrice[i]);
    const hlsRev = hls.map((h) => h * hlsPrice);
    const starfallRev = starfallMissions.map((m, i) => (m * starfallPrice[i]) / 1000);
    const spaceRev = falconRev.map((r, i) => r + starshipRev[i] + hlsRev[i] + starfallRev[i]);
    const f9Total = f9Customer.map((f, i) => f + f9Starlink[i]);
    const ssShare = flown.map((f, i) => (f9Total[i] + f ? f / (f9Total[i] + f) : 0));
    const spaceMargin = ssShare.map((sh, i) => n(ln.marginQ3, 0.202) + (n(ln.marginMature, 0.47) - n(ln.marginQ3, 0.202)) * sh * reuse[i]);
    const nonrevFlights = mars.map((m, i) => (i >= 3 ? spare * (external[i] + m + starfallFlights[i]) + m : 0));
    const nonrevCost = nonrevFlights.map((f, i) => (f * ssCost[i]) / 1000);
    const spaceEbitda = spaceRev.map((r, i) => (r - starfallRev[i]) * spaceMargin[i] + starfallRev[i] * n(ln.marginQ3, 0.202) - nonrevCost[i]);

    const deployCost = starlinkFlights.map((f, i) => (f * (1 + spare) * ssCost[i]) / 1000);
    const nonsiPct = s10(sl.nonsiCapexPct);
    const nonsi = connRev.map((r, i) => Math.max((r + spaceRev[i] - starfallRev[i]) * nonsiPct[i], deployCost[i]));
    const spectrum = s10(sl.spectrum);

    const sats = new Array(10);
    const rawFleet = new Array(10);
    for (let i = 0; i < 10; i++) {
      sats[i] = f9Starlink[i] * v2PerF9 + starlinkFlights[i] * v3[i];
      const retired = i === 0 ? 0 : rawFleet[i - 1] / life;
      rawFleet[i] = (i === 0 ? openingSats : rawFleet[i - 1]) + sats[i] - retired;
    }

    const maintCol = avg.map((g, i) => (g * itShare * build[i]) / itLife);
    const gTerm = n(V.terminalGrowth, 0.04);
    const tax = n(V.taxRate, 0.21);
    const colNorm = colEbitda.map((e, i) => {
      const p = period[i] || 1;
      return (e - tax * Math.max(0, e - maintCol[i] * p)) / p - maintCol[i] - gTerm * avg[i] * build[i];
    });
    const maintOdc = odcAvg.map((g, i) => (g * odcCost[i]) / itLife);
    const odcNorm = odcEbitda.map((e, i) => {
      const p = period[i] || 1;
      return (e - tax * Math.max(0, e - maintOdc[i] * p)) / p - maintOdc[i] - gTerm * odcAvg[i] * odcCost[i];
    });
    const slNorm = connEbitda.map((e, i) => (e - tax * Math.max(0, e - nonsi[i]) - nonsi[i]) / (period[i] || 1));
    const spNorm = spaceEbitda.map((e, i) => (e - tax * Math.max(0, e)) / (period[i] || 1));

    const site = s10(ln.siteTx).map((t, i) => t + n(ln.siteKsc && ln.siteKsc[i]) + n(ln.siteSlc && ln.siteSlc[i]) + n(ln.siteFurther && ln.siteFurther[i]));
    const permitted = s10(ln.permitted);

    return {
      years: YEARS.slice(),
      period,
      gw, path, avg, capGw, caseShare, rent, blended, build, extShare, internal,
      addedGw, siCapex, colRev, colEbitda, extRev, ownRev, colNorm,
      odc, odcAdded, odcFlights, odcRev, odcEbitda, odcCapex, odcCost, odcNorm, replFlights,
      subs, avgSubs, mobile, consumerRev, ent, dtc, connRev, connEbitda, nonsi, spectrum, slNorm, deployCost,
      sats, rawFleet, fleetV3, starlinkFlights, need,
      external, commercial, lunar, p2p, hls, mars, starfallFlights, starfallMissions, starfallRev,
      testFlights, flown, cut, f9Customer, f9Starlink, spaceRev, spaceEbitda, spNorm,
      ssPath, ssCost, site, permitted,
    };
  }

  function taxDA(capex, period) {
    const da = [];
    for (let i = 0; i < capex.length; i++) {
      if (i === 0) da.push(capex[0] * 0.8 * period[0]);
      else {
        const from = i < 5 ? 0 : i - 4;
        da.push((sum(capex, from, i) / 5) * period[i]);
      }
    }
    return da;
  }

  function discount(wacc, nYears, flow0) {
    const t = new Array(nYears);
    const df = new Array(nYears);
    t[0] = flow0;
    for (let i = 1; i < nYears; i++) t[i] = t[i - 1] + 1;
    for (let i = 0; i < nYears; i++) df[i] = 1 / Math.pow(1 + wacc, t[i]);
    return df;
  }

  function gordon(fcf, g, wacc, df) {
    if (!(wacc > g)) return NaN;
    return fcf * (1 + g) / (wacc - g) * df;
  }

  function consolidate(built, model) {
    const V = model.valuation;
    const wacc = n(V.wacc, 0.1);
    const g = n(V.terminalGrowth, 0.04);
    const tax = n(V.taxRate, 0.21);
    const w5 = n(V.horizon5, 0.65);
    const w10 = n(V.horizon10, 0.3);
    const w20 = n(V.horizon20, 0.05);
    const shares = n(V.sharesM, 13811);
    const cash0 = n(V.cash, 0);
    const debt0 = n(V.debt, 0);
    const netCash = cash0 - debt0;
    const cellular = n(V.cellularProvision, 0);
    const cFrom = n(V.cellularFrom, 2027);
    const cTo = n(V.cellularTo, 2030);
    const override = s10(V.capexOverride);

    const siRev = built.colRev.map((r, i) => r + built.odcRev[i]);
    const siEbitda = built.colEbitda.map((e, i) => e + built.odcEbitda[i]);

    const revenue = siRev.map((r, i) => r + built.connRev[i] + built.spaceRev[i]);
    const ebitda = siEbitda.map((e, i) => e + built.connEbitda[i] + built.spaceEbitda[i]);
    const bottom = built.siCapex.map((c, i) => c + built.odcCapex[i] + built.nonsi[i]);
    const scale = bottom.map((b, i) => (b ? ((override[i] > 0 ? override[i] : b) / b) : 1));
    const capex = new Array(10);
    for (let i = 0; i < 10; i++) {
      capex[i] = (override[i] > 0 ? override[i] : bottom[i]);
      const year = YEARS[i];
      if (year >= cFrom && year <= cTo) capex[i] += cellular;
    }
    const spectrum = built.spectrum;
    const norm = built.colNorm.map((c, i) => c + built.odcNorm[i] + built.slNorm[i] + built.spNorm[i]);

    const da0 = taxDA(capex, built.period);
    const cashTax = ebitda.map((e, i) => Math.max(0, e - da0[i]) * tax);
    const ufcf = ebitda.map((e, i) => e - cashTax[i] - capex[i] - spectrum[i]);

    return finishConsolidate(built, {
      wacc, g, tax, w5, w10, w20, shares, cash0, debt0, netCash,
      revenue, ebitda, capex, spectrum, norm, cashTax, ufcf, scale, bottom, siRev, siEbitda,
    }, model);
  }

  function finishConsolidate(built, x, model) {
    const V = model.valuation;
    const { wacc, g, tax, w5, w10, w20, shares, cash0, debt0, netCash } = x;
    let { revenue, ebitda, capex, spectrum, norm, cashTax, ufcf } = x;

    const itShareGuess = built.itShare;
    const itLife = built.itLife || 5;
    const steadyDollars =
      built.gw[9] * itShareGuess * built.build[9] / itLife +
      g * built.gw[9] * built.build[9] +
      built.odc[9] * built.odcCost[9] / itLife +
      g * built.odc[9] * built.odcCost[9] +
      built.nonsi[9];
    const rev9 = revenue[9] || 0;
    const steadyRatio = rev9 ? steadyDollars / rev9 : 0;
    const capexRatio = rev9 ? capex[9] / rev9 : 0;
    const margin2035 = rev9 ? ebitda[9] / rev9 : 0;
    const g2035 = revenue[8] ? revenue[9] / revenue[8] - 1 : g;

    revenue = revenue.slice();
    ebitda = ebitda.slice();
    capex = capex.slice();
    spectrum = spectrum.slice();
    cashTax = cashTax.slice();
    ufcf = ufcf.slice();
    const period = built.period.slice();

    for (let k = 1; k <= 10; k++) {
      const year = 2035 + k;
      const w = (year - 2035) / 10;
      const gFade = g2035 + (g - g2035) * w;
      const prev = revenue[revenue.length - 1];
      const rev = prev * (1 + gFade);
      const ebit = rev * margin2035;
      const ratio = capexRatio + (steadyRatio - capexRatio) * w;
      const cx = rev * ratio;
      revenue.push(rev);
      ebitda.push(ebit);
      capex.push(cx);
      spectrum.push(0);
      period.push(1);
    }
    const da = taxDA(capex, period);
    for (let i = 10; i < 20; i++) {
      cashTax[i] = Math.max(0, ebitda[i] - da[i]) * tax;
      ufcf[i] = ebitda[i] - cashTax[i] - capex[i];
    }
    // Rebuild explicit-year cash tax with the same D&A (already correct for 0..9
    // because those capex figures were not changed). Keep the pre-tail cash tax.
    for (let i = 0; i < 10; i++) {
      cashTax[i] = x.cashTax[i];
      ufcf[i] = x.ufcf[i];
    }

    const df = discount(wacc, 20, period[0]);
    const pv = ufcf.map((u, i) => u * df[i]);
    const ev5 = sum(pv, 0, 4) + gordon(norm[4], g, wacc, df[4]);
    const ev10 = sum(pv, 0, 9) + gordon(norm[9], g, wacc, df[9]);
    const ev20 = sum(pv, 0, 19) + gordon(ufcf[19], g, wacc, df[19]);
    const evBlend = w5 * ev5 + w10 * ev10 + w20 * ev20;
    const equity = evBlend + netCash;
    const fairValue = shares ? (equity / shares) * 1000 : NaN;
    const tailBeyond = ev20 - sum(pv, 0, 9);

    function segment(ebitdaSeg, capexSeg, normSeg) {
      const u = [];
      const p = [];
      for (let i = 0; i < 10; i++) {
        const alloc = ebitda[i] ? (cashTax[i] * ebitdaSeg[i]) / ebitda[i] : 0;
        const uu = ebitdaSeg[i] - alloc - capexSeg[i];
        u.push(uu);
        p.push(uu * df[i]);
      }
      const s5 = sum(p, 0, 4) + gordon(normSeg[4], g, wacc, df[4]);
      const s10 = sum(p, 0, 9) + gordon(normSeg[9], g, wacc, df[9]);
      const share = norm[9] ? normSeg[9] / norm[9] : 0;
      const s20 = sum(p, 0, 9) + tailBeyond * share;
      const blend = w5 * s5 + w10 * s10 + w20 * s20;
      return { ev5: s5, ev10: s10, ev20: s20, ev: blend, perShare: shares ? (blend / shares) * 1000 : NaN, ufcf: u, pv: p };
    }

    const scale = x.scale;
    const colCapex = built.siCapex.map((c, i) => c * scale[i]);
    const odcCapex = built.odcCapex.map((c, i) => c * scale[i]);
    const slCapex = built.nonsi.map((c, i) => c * scale[i] + built.spectrum[i]);
    const spCapex = blanks(10, 0);

    const segments = {
      colossus: segment(built.colEbitda, colCapex, built.colNorm),
      orbital: segment(built.odcEbitda, odcCapex, built.odcNorm),
      starlink: segment(built.connEbitda, slCapex, built.slNorm),
      launch: segment(built.spaceEbitda, spCapex, built.spNorm),
    };
    const segmentSum = segments.colossus.ev + segments.orbital.ev + segments.starlink.ev + segments.launch.ev;

    // Financing memo. One pass, matching the sheet: interest uses a draw
    // estimated before interest, then cash and debt are rolled after interest.
    const minCash = n(V.minCash, 20);
    const rateE = n(V.rateExisting, 0);
    const rateN = n(V.rateNew, 0);
    const rateC = n(V.rateCash, 0);
    const amort = n(V.debtAmortYears, 3) || 3;
    const surplusShare = n(V.surplusReturn, 0);
    let cash = cash0;
    let newDebt = 0;
    const hist = [];
    const netInterest = [];
    const endDebt = [];
    const endCash = [];
    const endNetDebt = [];
    for (let i = 0; i < 10; i++) {
      const openCash = i === 0 ? cash0 : cash;
      const openDebt = newDebt;
      const fundingNeed = Math.max(0, minCash - (openCash + ebitda[i] - cashTax[i] - capex[i] - (spectrum[i] || 0)));
      const intE = debt0 * rateE * period[i];
      const intN = (openDebt + 0.5 * fundingNeed) * rateN * period[i];
      const intC = openCash * rateC * period[i];
      const netInt = intE + intN - intC;
      const pretax = ebitda[i] - da[i] - netInt;
      const taxP = Math.max(0, pretax) * tax;
      const lfcf = ebitda[i] - taxP - capex[i] - (spectrum[i] || 0) - netInt;
      const before = openCash + lfcf;
      const drawn = Math.max(0, minCash - before);
      let repaid = 0;
      if (i > 0) {
        const peak = hist.length ? Math.max.apply(null, hist) : 0;
        repaid = Math.min(openDebt, Math.max(0, before - minCash), peak / amort);
      }
      newDebt = openDebt + drawn - repaid;
      const returned = newDebt > 0.001 ? 0 : surplusShare * Math.max(0, before + drawn - repaid - minCash);
      cash = before + drawn - repaid - returned;
      hist.push(newDebt);
      netInterest.push(netInt);
      endDebt.push(debt0 + newDebt);
      endCash.push(cash);
      endNetDebt.push(debt0 + newDebt - cash);
    }

    let trough = Infinity;
    let cum = 0;
    const cumulative = [];
    for (let i = 0; i < 10; i++) {
      cum += ufcf[i];
      cumulative.push(cum);
      if (cum < trough) trough = cum;
    }
    const fundingNeed = Math.max(0, -trough - netCash);
    const price = n(V.marketPrice, 0);
    const equityFunded = price
      ? ((equity + fundingNeed) / (shares + (fundingNeed / price) * 1000)) * 1000
      : NaN;
    const upside = price ? fairValue / price - 1 : NaN;

    const negative = [];
    Object.keys(segments).forEach((key) => {
      if (segments[key].ev < -1e-6) negative.push(key);
    });

    return {
      fairValue, equity, ev5, ev10, ev20, evBlend, netCash, shares,
      perShare5: shares ? ((ev5 + netCash) / shares) * 1000 : NaN,
      perShare10: shares ? ((ev10 + netCash) / shares) * 1000 : NaN,
      perShare20: shares ? ((ev20 + netCash) / shares) * 1000 : NaN,
      revenue: revenue.slice(0, 10),
      ebitda: ebitda.slice(0, 10),
      capex: capex.slice(0, 10),
      ufcf: ufcf.slice(0, 10),
      cashTax: cashTax.slice(0, 10),
      norm,
      segments,
      segmentSum,
      reconciliation: segmentSum - evBlend,
      negativeSegments: negative,
      netInterest, endDebt, endCash, endNetDebt,
      peakNewDebt: hist.length ? Math.max.apply(null, hist) : 0,
      cumulative, trough, fundingNeed, equityFunded, upside,
      cumCapex2026_30: sum(capex, 0, 4) + sum(spectrum, 0, 4),
      wacc, terminalGrowth: g,
      invalid: !(wacc > g),
    };
  }

  function attachFactors(built, kase) {
    built.itShare = n(kase.colossus.itShare, 0.844);
    built.itLife = n(kase.colossus.itLife, 5) || 5;
    return built;
  }

  function valueAll(model) {
    const anchor = baseAnchor(model.cases.base, s10(model.globalAiSpend));
    const out = { anchor, cases: {} };
    ["bear", "base", "bull"].forEach((name) => {
      const built = attachFactors(computeCase(model.cases[name], anchor, model), model.cases[name]);
      const v = consolidate(built, model);
      v.physical = {
        years: YEARS.slice(),
        gw: built.gw,
        path: built.path,
        odc: built.odc,
        totalGw: built.gw.map((g, i) => g + built.odc[i]),
        rent: built.rent,
        build: built.build,
        externalShare: built.extShare,
        internalShare: built.extShare.map((s) => 1 - s),
        subs: built.subs,
        mobile: built.mobile,
        sats: built.rawFleet,
        deployed: built.sats,
        starship: built.ssPath,
        flown: built.flown,
        cut: built.cut,
        uses: {
          starlink: built.starlinkFlights,
          commercial: built.commercial.map((c, i) => c + built.lunar[i] + built.p2p[i]),
          hls: built.hls,
          mars: built.mars,
          starfall: built.starfallFlights,
          orbital: built.odcFlights,
          test: built.testFlights,
          falcon: built.f9Customer.map((f, i) => f + built.f9Starlink[i]),
        },
        revenue: v.revenue,
        capex: v.capex,
      };
      v.detail = {
        colRev: built.colRev,
        odcRev: built.odcRev,
        connRev: built.connRev,
        spaceRev: built.spaceRev,
        colEbitda: built.colEbitda,
        connEbitda: built.connEbitda,
        spaceEbitda: built.spaceEbitda,
      };
      out.cases[name] = v;
    });
    return out;
  }

  const ORDERED_PATHS = [
    ["colossus", "yeGw", "Terrestrial GW path", "up"],
    ["colossus", "internalPerGw", "Internal $/GW", "up"],
    ["colossus", "buildCost", "Build cost $/GW", "down"],
    ["colossus", "externalShare", "External share of compute", "up"],
    ["orbital", "targetShare", "Orbital share of compute", "up"],
    ["orbital", "mwPerFlight", "ODC MW per flight", "up"],
    ["starlink", "mobileYe", "Starlink Mobile subscribers", "up"],
    ["starlink", "arpu", "Consumer ARPU", "up"],
    ["launch", "starshipFlights", "Starship flights", "up"],
    ["launch", "starfallMissions", "Starfall missions", "up"],
    ["launch", "commercial", "Commercial Starship missions", "up"],
  ];

  function orderingIssues(model) {
    const issues = [];
    ORDERED_PATHS.forEach(([group, key, label, sense]) => {
      const b = model.cases.bear[group][key] || [];
      const a = model.cases.base[group][key] || [];
      const u = model.cases.bull[group][key] || [];
      const len = Math.max(b.length, a.length, u.length);
      for (let i = 0; i < len; i++) {
        const bv = b[i]; const av = a[i]; const uv = u[i];
        if (bv == null || av == null || uv == null || bv === "" || av === "" || uv === "") continue;
        const bad = sense === "down"
          ? (+bv < +av - 1e-9 || +av < +uv - 1e-9)
          : (+bv > +av + 1e-9 || +av > +uv + 1e-9);
        if (bad) issues.push({ label, year: YEARS[i] || i, bear: +bv, base: +av, bull: +uv, sense });
      }
    });
    // Subscriber year-end levels, derived from net adds.
    const open = n(model.constants.consumerOpeningM, 13.6);
    const ye = {};
    ["bear", "base", "bull"].forEach((name) => {
      const adds = s10(model.cases[name].starlink.netAdds);
      const subs = [];
      let s = open;
      for (let i = 0; i < 10; i++) { s += adds[i]; subs.push(s); }
      ye[name] = subs;
    });
    for (let i = 0; i < 10; i++) {
      if (ye.bear[i] > ye.base[i] + 1e-9 || ye.base[i] > ye.bull[i] + 1e-9) {
        issues.push({ label: "Starlink subscribers", year: YEARS[i], bear: ye.bear[i], base: ye.base[i], bull: ye.bull[i] });
      }
    }
    return issues;
  }

  /**
   * Shock one assumption on a deep copy and return the active case fair value.
   * Used by the tornado. `shock` is {scope, path, yearIndex, mode, amount}.
   */
  function clone(model) {
    return JSON.parse(JSON.stringify(model));
  }

  return {
    YEARS,
    valueAll,
    orderingIssues,
    clone,
    baseAnchor,
  };
});
