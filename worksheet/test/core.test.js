// Run with:  node --test worksheet/test/core.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calistar-core.js');

const RAD = Math.PI / 180;
const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg || 'value'}: got ${actual}, expected ${expected} ±${tol}`);

/** Measurements of an ideal print with the given defects. */
function synth({ width = 120, points = 3, sx = 1, sy = 1, skew = 0, offset = 0, only }) {
  const cos = Math.cos((90 + skew) * RAD);
  const sD = Math.sqrt((sx * sx + sy * sy + 2 * sx * sy * cos) / 2);
  const sd = Math.sqrt((sx * sx + sy * sy - 2 * sx * sy * cos) / 2);
  const m = {};
  for (const r of C.layout(width, points, 1)) {
    if (only && !only(r)) continue;
    const s = { x: sx, y: sy, D: sD, d: sd }[r.axis];
    m[r.id] = [s * r.nominal + (r.kind === 'outer' ? offset : -offset)];
  }
  return { width, points, measurements: m };
}

test('layout has the right rows for every size (issue #18: 5 points needs 4 diagonals)', () => {
  for (const points of [2, 3, 4, 5]) {
    const rows = C.layout(180, points, 1);
    assert.equal(rows.filter((r) => r.group === 'xo').length, points);
    assert.equal(rows.filter((r) => r.group === 'D').length, points - 1);
    assert.equal(rows.filter((r) => r.group === 'd').length, points - 1);
  }
  assert.deepEqual(C.layout(180, 5, 1).filter((r) => r.group === 'd').map((r) => r.nominal), [180, 144, 108, 72]);
  assert.deepEqual(C.layout(120, 3, 1).filter((r) => r.group === 'yi').map((r) => r.nominal), [120, 80, 40]);
});

test('recovers scale, flow offset and skew from a synthetic print', () => {
  const a = C.analyze(synth({ sx: 0.994, sy: 0.9925, skew: -0.2, offset: 0.08 }));
  near(a.x.scale, 0.994, 1e-9, 'x scale');
  near(a.y.scale, 0.9925, 1e-9, 'y scale');
  near(a.x.offset, 0.08, 1e-9, 'x offset');
  near(a.xy.offset, 0.08, 1e-3, 'xy offset');
  near(a.skew.degrees, -0.2, 2e-3, 'skew');
  assert.deepEqual(a.warnings, []);
});

test('a perfect print reads as zero', () => {
  const a = C.analyze(synth({}));
  near(a.x.error, 0, 1e-12);
  near(a.skew.degrees, 0, 1e-9);
  const v = C.assess(a, { material: 'PLA' });
  assert.equal(v.x.status, 'ok');
  assert.equal(v.skew.status, 'ok');
});

test('flow error does not masquerade as scale error', () => {
  const a = C.analyze(synth({ offset: 0.15 }));
  near(a.x.error, 0, 1e-9, 'scale stays put');
  near(a.x.offset, 0.15, 1e-9);
  // ...unless only outer measurements are given, which is flagged.
  const outer = C.analyze(synth({ offset: 0.15, only: (r) => r.kind === 'outer' }));
  assert.ok(outer.x.error > 0.001);
  assert.ok(outer.warnings.includes('noOffset:x'));
});

test('missing diagonal rows do not invent skew (issues #16, #21, #24)', () => {
  const full = synth({ width: 180, points: 5, sx: 0.999, sy: 0.998, skew: 0.09, offset: 0.05 });
  delete full.measurements.d4;
  delete full.measurements.D2;
  const a = C.analyze(full);
  near(a.skew.degrees, 0.09, 5e-3, 'skew');
});

test('data from issue #16 gives the sane answer, not 7 degrees', () => {
  const col = (v) => v.map((x) => [x]);
  const groups = {
    xo: col([179.86, 144.05, 108.0, 72.03, 36.04]),
    xi: col([179.9, 143.95, 107.89, 71.92, 35.96]),
    yo: col([179.66, 143.83, 107.83, 71.92, 35.97]),
    yi: col([179.7, 143.8, 107.77, 71.9, 35.94]),
    D: col([179.7, 143.73, 107.79, 71.89]),
    d: col([179.92, 143.96, 108.02]),
  };
  const measurements = {};
  for (const g in groups) groups[g].forEach((v, i) => (measurements[g + (i + 1)] = v));
  const a = C.analyze({ width: 180, points: 5, measurements });
  near(C.rotationDistance(40, a.x.scale), 39.985, 0.004, 'stepper_x');
  near(C.rotationDistance(40, a.y.scale), 39.938, 0.004, 'stepper_y');
  near(a.skew.degrees, 0.08, 0.03, 'skew');
});

test('repeat measurements and scatter widen the error bars', () => {
  const tidy = synth({ sx: 0.997, sy: 0.997 });
  const base = C.analyze(tidy);
  const noisy = JSON.parse(JSON.stringify(tidy));
  noisy.measurements.xo1 = [119.5, 119.8, 119.64];
  assert.ok(C.analyze(noisy).x.sigma > base.x.sigma);
});

test('typos are flagged, ABS-sized shrinkage is not (old page warned on any 0.5 mm)', () => {
  const abs = C.analyze(synth({ width: 180, points: 5, sx: 0.992, sy: 0.992 }));
  assert.ok(!abs.warnings.includes('suspect'));
  const typo = synth({});
  typo.measurements.xo2 = [90];
  const a = C.analyze(typo);
  assert.ok(a.warnings.includes('suspect'));
  assert.ok(a.rows.find((r) => r.id === 'xo2').suspect);
});

test('assess tells shrinkage from a mechanical error', () => {
  const abs = C.analyze(synth({ sx: 0.993, sy: 0.993 }));
  assert.equal(C.assess(abs, { material: 'ABS' }).xy.cause, 'shrinkage');
  assert.equal(C.assess(abs, { material: 'PLA' }).xy.cause, 'beyondShrinkage');
  const big = C.analyze(synth({ sx: 1.004, sy: 1.004 }));
  assert.equal(C.assess(big, { material: 'ABS' }).xy.cause, 'oversize');
  const lopsided = C.analyze(synth({ sx: 0.999, sy: 0.996 }));
  assert.equal(C.assess(lopsided, { material: 'ABS' }).axesDiffer, true);
});

test('Klipper skew lengths reproduce the correction in Klipper\'s own formula', () => {
  // klippy/extras/skew_correction.py: calc_skew_factor
  const klipperFactor = (ac, bd, ad) => {
    const side = Math.sqrt(2 * ac * ac + 2 * bd * bd - 4 * ad * ad) / 2;
    return Math.tan(Math.PI / 2 - Math.acos((ac * ac - side * side - ad * ad) / (2 * side * ad)));
  };
  const first = C.klipperSkew(-0.3);
  near(first.totalDegrees, 0.3, 1e-12);
  near(klipperFactor(first.ac, first.bd, first.ad), Math.tan(0.3 * RAD), 1e-9);
  assert.ok(first.ac > first.bd, 'D longer than d means AC longer than BD');

  // Second pass: 0.05 deg residual left with the first correction loaded.
  const second = C.klipperSkew(-0.05, first);
  near(second.previousDegrees, 0.3, 1e-9);
  near(second.totalDegrees, 0.35, 1e-9);
  near(C.marlinSkewFactor(-0.3), Math.tan(0.3 * RAD), 1e-12);
});

test('shrinkage settings in each slicer convention', () => {
  near(C.shrinkage('orca', '', 0.994), 99.4, 1e-9);
  near(C.shrinkage('orca', 99.4, 0.999), 99.3006, 1e-9, 'iterates on the current value (issue #13)');
  near(C.shrinkage('prusa', '', 0.994), 0.6, 1e-9);
  near(C.shrinkage('prusa', 0.6, 1), 0.6, 1e-9);
  near(C.shrinkage('cura', '', 0.994), 100.6036, 1e-4, 'Cura wants > 100 (issue #20)');
  near(C.shrinkage('scale', 100, 0.994), 100.6036, 1e-4);
  near(C.stepsPerMm(80, 0.998), 80.1603, 1e-4);
});
