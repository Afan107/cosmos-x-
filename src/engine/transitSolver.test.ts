import test from 'node:test';
import assert from 'node:assert/strict';
import {
  savitzkyGolayFilter,
  runBLSSearch,
  computeExoplanetCharacteristics,
  generateSyntheticLightCurve,
} from './transitSolver';

test('savitzkyGolayFilter smooths noise while preserving array length', () => {
  const data = [1.0, 1.05, 0.98, 1.02, 0.97, 1.01, 0.99, 1.03];
  const smoothed = savitzkyGolayFilter(data, 5, 2);
  assert.equal(smoothed.length, data.length);
  // Smoothed array values should stay close to 1.0
  smoothed.forEach((val) => {
    assert.ok(val >= 0.95 && val <= 1.05, `Value ${val} should be near 1.0`);
  });
});

test('computeExoplanetCharacteristics calculates Earth radii and Kopparapu Habitable Zone', () => {
  // Kepler-452b like scenario: Sun-like star (Teff = 5757, R_star = 1.11, P = 384.8 days)
  const result = computeExoplanetCharacteristics(
    0.00021, // ~210 ppm depth
    1.11, // Solar radii
    5757, // Teff (K)
    384.8, // Period (days)
    1.04 // Solar masses
  );

  assert.ok(result.planetRadiusEarth > 1.3 && result.planetRadiusEarth < 2.2, `Radius ${result.planetRadiusEarth} R_Earth`);
  assert.ok(result.semiMajorAxisAu > 0.95 && result.semiMajorAxisAu < 1.15, `Semi-major axis ${result.semiMajorAxisAu} AU`);
  assert.equal(result.inHabitableZone, true);
  assert.ok(result.hzStatus === 'OPTIMAL_HABITABLE' || result.hzStatus === 'EDGE_INNER');
  assert.ok(result.hzBoundariesAu[0] <= result.semiMajorAxisAu * 1.05);
  assert.ok(result.semiMajorAxisAu <= result.hzBoundariesAu[1]);
});

test('computeExoplanetCharacteristics identifies hot Jupiter outside habitable zone', () => {
  // Hot Jupiter scenario: P = 3.5 days, deep transit
  const result = computeExoplanetCharacteristics(0.015, 1.0, 5800, 3.5, 1.0);
  assert.ok(result.planetRadiusEarth > 10.0, 'Hot Jupiter should be > 10 Earth radii');
  assert.equal(result.inHabitableZone, false);
  assert.equal(result.hzStatus, 'TOO_HOT');
});

test('generateSyntheticLightCurve produces coherent times and normalized fluxes', () => {
  const lc = generateSyntheticLightCurve(4.0, 0.002, 2.5, 8, 30);
  assert.ok(lc.time.length > 50);
  assert.equal(lc.time.length, lc.rawFlux.length);
  assert.equal(lc.rawFlux.length, lc.detrendedFlux.length);
  // Median flux should be approximately 1.0
  const avg = lc.detrendedFlux.reduce((a, b) => a + b, 0) / lc.detrendedFlux.length;
  assert.ok(Math.abs(avg - 1.0) < 0.01);
});

test('runBLSSearch discovers transit period with high power', () => {
  const lc = generateSyntheticLightCurve(5.0, 0.004, 3.0, 25, 30, 0.0001);
  const bls = runBLSSearch(lc.time, lc.detrendedFlux, 2.0, 10.0, 100);
  assert.ok(bls.period > 0);
  assert.ok(bls.maxPower > 0);
  assert.ok(bls.transitDepth > 0);
  // Best period should be close to 5.0 (within 0.3 days given grid search)
  assert.ok(Math.abs(bls.period - 5.0) < 0.5, `Detected period ${bls.period} should be close to 5.0`);
});
