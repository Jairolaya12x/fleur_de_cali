/*
 * Calistar calibration maths.
 *
 * Pure functions, no DOM. Loaded by index.html as a classic script (so the
 * page works straight from disk) and by Node for the tests in test/.
 *
 * Model used for each axis:
 *
 *     outer measurement = scale * nominal + offset
 *     inner measurement = scale * nominal - offset
 *
 * `scale` is what shrinkage compensation / rotation_distance / steps-per-mm
 * correct. `offset` is the constant error from extrusion width (flow), which
 * no amount of scaling can fix, so it is fitted separately and reported.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CalistarCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RAD = Math.PI / 180;

  const GROUPS = [
    { id: 'xo', axis: 'x', kind: 'outer' },
    { id: 'xi', axis: 'x', kind: 'inner' },
    { id: 'yo', axis: 'y', kind: 'outer' },
    { id: 'yi', axis: 'y', kind: 'inner' },
    { id: 'D', axis: 'D', kind: 'outer' },
    { id: 'd', axis: 'd', kind: 'outer' },
  ];

  // Upper bound of the shrinkage you would expect from cooling alone, in %.
  const MATERIALS = { PLA: 0.3, PETG: 0.8, ABS: 1.6, ASA: 1.6, Other: null };

  const DEFAULTS = { width: 120, points: 3, scale: 1, caliperError: 0.02 };

  /** Every measurement row of a calistar_{width}x{points} print. */
  function layout(width, points, scale) {
    const s = scale > 0 ? scale : 1;
    const rows = [];
    for (const g of GROUPS) {
      const diagonal = g.axis === 'D' || g.axis === 'd';
      const count = diagonal ? points - 1 : points;
      for (let loc = 1; loc <= count; loc++) {
        rows.push({
          id: g.id + loc,
          group: g.id,
          axis: g.axis,
          kind: g.kind,
          loc: loc,
          nominal: Math.round(width * (1 - (loc - 1) / points) * s * 1e6) / 1e6,
        });
      }
    }
    return rows;
  }

  function stats(values) {
    const v = (values || []).map(Number).filter((x) => Number.isFinite(x) && x > 0);
    const n = v.length;
    if (!n) return { n: 0, mean: NaN, sd: 0 };
    const mean = v.reduce((a, b) => a + b, 0) / n;
    const ss = v.reduce((a, b) => a + (b - mean) * (b - mean), 0);
    return { n: n, mean: mean, sd: n > 1 ? Math.sqrt(ss / (n - 1)) : 0 };
  }

  /**
   * Weighted least squares of mean = scale*nominal + offset*sign.
   * The offset is only fitted when both outer and inner rows are present;
   * otherwise it cannot be told apart from scale and the fit goes through 0.
   */
  function fit(rows) {
    const used = rows.filter((r) => r.n > 0);
    if (!used.length) return null;
    const hasOffset = used.some((r) => r.kind === 'outer') && used.some((r) => r.kind === 'inner');

    let A = 0, B = 0, C = 0, U = 0, V = 0;
    for (const r of used) {
      const w = 1 / r.variance;
      const g = r.kind === 'outer' ? 1 : -1;
      A += w * r.nominal * r.nominal;
      B += w * r.nominal * g;
      C += w;
      U += w * r.nominal * r.mean;
      V += w * g * r.mean;
    }

    let scale, offset = null, varScale, varOffset = null;
    if (hasOffset) {
      const det = A * C - B * B;
      scale = (C * U - B * V) / det;
      offset = (A * V - B * U) / det;
      varScale = C / det;
      varOffset = A / det;
    } else {
      scale = U / A;
      varScale = 1 / A;
    }

    let chi2 = 0;
    for (const r of used) {
      const g = r.kind === 'outer' ? 1 : -1;
      r.residual = r.mean - scale * r.nominal - (offset || 0) * g;
      chi2 += (r.residual * r.residual) / r.variance;
    }
    // If the print scatters more than the calipers explain, say so in the
    // error bars rather than pretending to a precision we do not have.
    const dof = used.length - (hasOffset ? 2 : 1);
    const inflation = dof >= 2 && chi2 / dof > 1 ? chi2 / dof : 1;

    return {
      n: used.length,
      scale: scale,
      error: scale - 1,
      sigma: Math.sqrt(varScale * inflation),
      offset: offset,
      offsetSigma: varOffset === null ? null : Math.sqrt(varOffset * inflation),
      inflation: inflation,
    };
  }

  function analyze(input) {
    const cfg = Object.assign({}, DEFAULTS, input || {});
    const measurements = cfg.measurements || {};
    const rows = layout(cfg.width, cfg.points, cfg.scale);

    let pooledSS = 0, pooledDof = 0;
    for (const r of rows) {
      Object.assign(r, stats(measurements[r.id]));
      r.deviation = r.n ? r.mean - r.nominal : NaN;
      r.residual = NaN;
      if (r.n > 1) { pooledSS += (r.n - 1) * r.sd * r.sd; pooledDof += r.n - 1; }
    }
    const repeatSd = pooledDof ? Math.sqrt(pooledSS / pooledDof) : 0;
    const cal = cfg.caliperError > 0 ? cfg.caliperError : DEFAULTS.caliperError;
    for (const r of rows) r.variance = cal * cal + (r.n ? (repeatSd * repeatSd) / r.n : 0);

    const of = (axis) => rows.filter((r) => r.axis === axis);
    const xy = fit(of('x').concat(of('y')));
    const x = fit(of('x'));   // run the per-axis fits last so that
    const y = fit(of('y'));   // row.residual refers to its own axis

    const skew = skewFrom(of('D'), of('d'), x, y, xy);

    const warnings = [];
    if (!x) warnings.push('needX');
    if (!y) warnings.push('needY');
    if (!skew) warnings.push('needDiagonals');
    for (const axis of ['x', 'y']) {
      const f = axis === 'x' ? x : y;
      if (!f) continue;
      const has = (kind, loc) => rows.some((r) => r.axis === axis && r.kind === kind && r.loc === loc && r.n > 0);
      let unpaired = false;
      for (let loc = 1; loc <= cfg.points; loc++) if (has('outer', loc) !== has('inner', loc)) unpaired = true;
      if (f.offset === null) warnings.push('noOffset:' + axis);
      else if (unpaired) warnings.push('unpaired:' + axis);
    }

    for (const r of rows) {
      r.suspect = false;
      if (!r.n) continue;
      const gross = Math.abs(r.deviation) > 0.03 * r.nominal + 0.5;
      const odd = Number.isFinite(r.residual) && Math.abs(r.residual) > Math.max(0.25, 4 * Math.sqrt(r.variance));
      r.suspect = gross || odd;
    }
    if (rows.some((r) => r.suspect)) warnings.push('suspect');

    return { config: cfg, rows: rows, repeatSd: repeatSd, x: x, y: y, xy: xy, skew: skew, warnings: warnings };
  }

  /**
   * Skew from the two diagonals. With D and d normalised by their nominal
   * length, a parallelogram with axis scales sx, sy and angle alpha between
   * the axes gives D^2 - d^2 = 2*sx*sy*cos(alpha).
   */
  function skewFrom(rowsD, rowsd, x, y, xy) {
    const offset = xy && xy.offset !== null ? xy.offset : 0;
    const varOffset = xy && xy.offsetSigma !== null ? xy.offsetSigma * xy.offsetSigma : 0;
    const inflation = xy ? xy.inflation : 1;

    function slope(rows) {
      const used = rows.filter((r) => r.n > 0);
      if (!used.length) return null;
      let A = 0, U = 0, S = 0;
      for (const r of used) {
        const w = 1 / r.variance;
        A += w * r.nominal * r.nominal;
        U += w * r.nominal * (r.mean - offset);
        S += w * r.nominal;
      }
      const value = U / A;
      for (const r of used) r.residual = r.mean - offset - value * r.nominal;
      return { value: value, variance: inflation / A, lever: S / A, n: used.length };
    }

    const p = slope(rowsD);
    const q = slope(rowsd);
    if (!p || !q) return null;

    const sx = x ? x.scale : xy ? xy.scale : 1;
    const sy = y ? y.scale : xy ? xy.scale : 1;
    const cosA = Math.max(-1, Math.min(1, (p.value * p.value - q.value * q.value) / (2 * sx * sy)));
    const alpha = Math.acos(cosA);
    const sinA = Math.sin(alpha);

    const k = sx * sy * sinA;
    const lever = p.value * p.lever - q.value * q.lever;
    const relScale = (x ? (x.sigma / sx) ** 2 : 0) + (y ? (y.sigma / sy) ** 2 : 0);
    const variance =
      (p.value * p.value * p.variance + q.value * q.value * q.variance + lever * lever * varOffset) / (k * k) +
      (cosA * cosA * relScale) / (sinA * sinA);

    const degrees = alpha / RAD - 90;
    return {
      degrees: degrees,                       // > 0 when diagonal d is the long one
      sigma: Math.sqrt(variance) / RAD,
      angle: alpha / RAD,                     // angle between the printer's X and Y
      mmPer100: 100 * Math.tan(Math.abs(degrees) * RAD),
      p: p.value,
      q: q.value,
      n: p.n + q.n,
    };
  }

  /**
   * Turn the numbers into a decision.
   * `tolerance` is the error you are willing to live with, in mm per 100 mm.
   */
  function assess(analysis, options) {
    const opt = Object.assign({ material: 'PLA', tolerance: 0.05 }, options || {});
    const tolPct = opt.tolerance;                     // mm per 100 mm == %
    const tolDeg = Math.atan(opt.tolerance / 100) / RAD;
    const maxShrink = Object.prototype.hasOwnProperty.call(MATERIALS, opt.material) ? MATERIALS[opt.material] : null;

    function level(value, sigma, tol) {
      if (Math.abs(value) <= tol) return 'ok';
      if (Math.abs(value) < 2 * sigma) return 'noise';
      return 'adjust';
    }
    function scale(f) {
      if (!f) return null;
      const pct = f.error * 100, sig = f.sigma * 100;
      const status = level(pct, sig, tolPct);
      let cause = 'none';
      if (status === 'adjust') {
        if (pct > 0) cause = 'oversize';
        else if (maxShrink === null || -pct <= maxShrink + 2 * sig) cause = 'shrinkage';
        else cause = 'beyondShrinkage';
      }
      return { percent: pct, sigma: sig, status: status, cause: cause };
    }

    const out = {
      tolerancePercent: tolPct,
      toleranceDegrees: tolDeg,
      maxShrinkage: maxShrink,
      x: scale(analysis.x),
      y: scale(analysis.y),
      xy: scale(analysis.xy),
      axesDiffer: false,
      skew: null,
      offset: null,
    };
    if (analysis.x && analysis.y) {
      const diff = Math.abs(analysis.x.error - analysis.y.error) * 100;
      const sig = Math.hypot(analysis.x.sigma, analysis.y.sigma) * 100;
      out.axesDiffer = diff > Math.max(2 * tolPct, 2 * sig);
    }
    if (analysis.skew) {
      out.skew = { status: level(analysis.skew.degrees, analysis.skew.sigma, tolDeg) };
    }
    if (analysis.xy && analysis.xy.offset !== null) {
      // 0.1 mm on a wall pair is about a quarter of a 0.4 mm line: worth a look.
      const o = analysis.xy.offset;
      out.offset = { status: Math.abs(o) <= 0.05 ? 'ok' : Math.abs(o) < 2 * analysis.xy.offsetSigma ? 'noise' : 'adjust' };
    }
    return out;
  }

  /* ---- Corrections ------------------------------------------------- */

  /**
   * Klipper SET_SKEW lengths. `previous` is the AC/BD/AD already loaded in
   * the printer when the calistar was printed (so the tuning can iterate);
   * leave it out if the print was made with no skew correction.
   */
  function klipperSkew(skewDegrees, previous) {
    let before = 0;
    const pv = previous || {};
    if (pv.ac > 0 && pv.bd > 0 && pv.ad > 0) {
      const ab = Math.sqrt((pv.ac * pv.ac + pv.bd * pv.bd - 2 * pv.ad * pv.ad) / 2);
      const cos = (pv.ac * pv.ac - pv.bd * pv.bd) / (4 * ab * pv.ad);
      if (Number.isFinite(cos) && Math.abs(cos) <= 1) before = Math.PI / 2 - Math.acos(cos);
    }
    const total = before - skewDegrees * RAD;
    return {
      ac: 100 * Math.sqrt(1 + Math.sin(total)),
      bd: 100 * Math.sqrt(1 - Math.sin(total)),
      ad: 100 * Math.SQRT1_2,
      previousDegrees: before / RAD,
      totalDegrees: total / RAD,
    };
  }

  /** Marlin XY skew factor for `M852 I<factor>`. */
  function marlinSkewFactor(skewDegrees) {
    return Math.tan(-skewDegrees * RAD);
  }

  /** Klipper: new rotation_distance. `scale` = measured / nominal. */
  function rotationDistance(current, scale) {
    return current * scale;
  }

  /** Marlin: new steps per mm for M92. */
  function stepsPerMm(current, scale) {
    return current / scale;
  }

  /**
   * New slicer shrinkage setting. `scale` = measured / nominal of a print
   * sliced with `current` already applied.
   *   orca   - OrcaSlicer / BambuStudio / SuperSlicer "Shrinkage (XY)": size the part ends up at, 100 = none
   *   prusa  - PrusaSlicer "Shrinkage compensation XY": how much it shrinks, 0 = none
   *   cura   - Cura "Scaling Factor Shrinkage Compensation": how much to enlarge, 100 = none
   *   scale  - plain model scaling in any slicer, 100 = none
   */
  function shrinkage(style, current, scale) {
    const has = current !== null && current !== undefined && current !== '' && Number.isFinite(Number(current));
    const c = Number(current);
    switch (style) {
      case 'orca': return (has && c > 0 ? c : 100) * scale;
      case 'prusa': return 100 * (1 - (1 - (has ? c : 0) / 100) * scale);
      case 'cura':
      case 'scale': return (has && c > 0 ? c : 100) / scale;
      default: throw new Error('unknown shrinkage style: ' + style);
    }
  }

  return {
    GROUPS: GROUPS,
    MATERIALS: MATERIALS,
    DEFAULTS: DEFAULTS,
    layout: layout,
    stats: stats,
    analyze: analyze,
    assess: assess,
    klipperSkew: klipperSkew,
    marlinSkewFactor: marlinSkewFactor,
    rotationDistance: rotationDistance,
    stepsPerMm: stepsPerMm,
    shrinkage: shrinkage,
  };
});
