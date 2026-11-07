/**
 * Locks the client-side engine to the v11 workbook cache.
 * Reads tests/fixtures/v11.json (inputs + cached outputs), not the live
 * data/baseline.json, so a later baseline update does not fail this test.
 *
 * Run: node tests/value-model.test.js
 */
const fs = require("fs");
const path = require("path");
const { valueAll, orderingIssues } = require("../assets/model/engine.js");

const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/v11.json"), "utf8"));
const out = valueAll(fx.model);
let failed = 0;

function check(name, got, exp, tol) {
  const err = Math.abs(got - exp) / Math.max(1e-9, Math.abs(exp));
  if (err > tol) {
    failed += 1;
    console.error("FAIL", name, "got", got, "exp", exp, "err", (err * 100).toFixed(3) + "%");
  }
}

for (const name of ["bear", "base", "bull"]) {
  const got = out.cases[name];
  const exp = fx.expected.dcf[name];
  check(name + " fair value", got.fairValue, exp.fairValue, 0.001);
  check(name + " EV 5yr", got.ev5, exp.ev5, 0.002);
  check(name + " EV 10yr", got.ev10, exp.ev10, 0.002);
  check(name + " EV 20yr", got.ev20, exp.ev20, 0.002);
  check(name + " EV blend", got.evBlend, exp.evBlend, 0.002);
  check(name + " peak new debt", got.peakNewDebt, exp.peakDebt, 0.005);
  for (const key of ["colossus", "orbital", "starlink", "launch"]) {
    check(name + " " + key + " EV", got.segments[key].ev, fx.expected.segments[key][name], 0.002);
  }
  for (let i = 0; i < 10; i++) {
    check(name + " revenue " + (2026 + i), got.revenue[i], exp.revenue[i], 0.002);
    check(name + " GW " + (2026 + i), got.physical.gw[i], fx.expected.physical[name].gw[i], 0.002);
    check(name + " ODC " + (2026 + i), got.physical.odc[i], fx.expected.physical[name].odc[i], 0.005);
  }
  if (got.negativeSegments.length) {
    failed += 1;
    console.error("FAIL", name, "negative segments", got.negativeSegments);
  }
}

const issues = orderingIssues(fx.model);
if (issues.length) {
  failed += 1;
  console.error("FAIL preset ordering", issues);
}

if (failed) {
  console.error(failed + " checks failed");
  process.exit(1);
}
console.log("v11 engine matches the workbook within tolerance");
console.log("bear", out.cases.bear.fairValue.toFixed(2), "base", out.cases.base.fairValue.toFixed(2), "bull", out.cases.bull.fairValue.toFixed(2));
