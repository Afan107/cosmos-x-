import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLightCurvePCA,
  calculateTransitAsymmetry,
  fetchOrSynthesizeObservationalStream,
  runAutonomousMLScan,
} from './aiDiscoveryPipeline';

test('aiDiscoveryPipeline: PCA extracts orthogonal systematic components and preserves array length', () => {
  const times = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const fluxes = [1.0, 0.999, 1.001, 0.998, 0.994, 0.993, 0.998, 1.0, 1.002, 0.999];

  const result = computeLightCurvePCA(times, fluxes);
  assert.equal(result.pcaComponents.length, 3, 'Must extract 3 systematic PCA components');
  assert.equal(result.residualFluxes.length, fluxes.length, 'Residual length must match input');
  assert.equal(result.pcaComponents[0].values.length, fluxes.length);
});

test('aiDiscoveryPipeline: calculateTransitAsymmetry detects non-spherical flux dips', () => {
  // Symmetric dip
  const symmetricDip = [1.0, 1.0, 0.99, 0.98, 0.97, 0.98, 0.99, 1.0, 1.0];
  const asym1 = calculateTransitAsymmetry(symmetricDip);
  assert.ok(asym1 < 5.0, 'Symmetric transit dip must have low asymmetry (<5%)');

  // Strongly asymmetric dip (steep ingress, stepped egress)
  const asymmetricDip = [1.0, 1.0, 0.95, 0.90, 0.88, 0.94, 0.96, 0.98, 0.99, 1.0];
  const asym2 = calculateTransitAsymmetry(asymmetricDip);
  assert.ok(asym2 > asym1, 'Asymmetric stepped transit must have higher asymmetry index');
});

test('aiDiscoveryPipeline: runAutonomousMLScan flags Alcubierre warp ripples with sigma >= 7.0 and Nobel threshold', () => {
  const stream = fetchOrSynthesizeObservationalStream('WARP-BUBBLE-ALPHA');
  const scan = runAutonomousMLScan(stream, 'ALCUBIERRE-WARP-01');

  assert.ok(scan.breakthroughs.length > 0, 'Must identify at least one breakthrough');
  const warpBreakthrough = scan.breakthroughs.find((b) => b.phenomenon === 'ALCUBIERRE_WARP_METRIC');
  assert.ok(warpBreakthrough, 'Must detect Alcubierre Warp phenomenon');
  assert.ok(warpBreakthrough!.statisticalSigma >= 7.0, 'Must exceed 7.0 sigma threshold');
  assert.equal(scan.isNobelTriggered, true, 'Nobel trigger must be active');
});

test('aiDiscoveryPipeline: runAutonomousMLScan detects exomoon TTV on Kepler candidate', () => {
  const stream = fetchOrSynthesizeObservationalStream('Kepler-452 b');
  const scan = runAutonomousMLScan(stream, 'Kepler-452 b Exomoon');

  const moonBreakthrough = scan.breakthroughs.find((b) => b.phenomenon === 'EXOMOON_TRANSIT_TTV');
  assert.ok(moonBreakthrough, 'Must detect Exomoon TTV phenomenon');
  assert.ok(moonBreakthrough!.ttvVarianceMinutes > 5.0, 'TTV variance must be detected');
});
