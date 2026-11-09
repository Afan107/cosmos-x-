import test from 'node:test';
import assert from 'node:assert/strict';
import { DarkCosmosAnomalyEngine } from './anomalyEngine';

test('DarkCosmosAnomalyEngine flags Dyson sphere candidate with severe mid-IR excess', () => {
  const result = DarkCosmosAnomalyEngine.evaluateInfraredExcess({
    targetId: 'TIC-25155310',
    w1Mag: 8.5,
    w2Mag: 8.4,
    w3Mag: 6.8, // W1 - W3 = 1.7 (large excess)
    w4Mag: 5.4, // W3 - W4 = 1.4 (large excess)
    teff: 5420,
  });

  assert.equal(result.anomalyType, 'DYSON_SPHERE_CANDIDATE');
  assert.equal(result.threatOrPriority, 'CRITICAL');
  assert.ok(result.confidenceScore >= 88.0, `Confidence score should be high: ${result.confidenceScore}`);
  assert.equal(result.flags.nonStandardBlackbody, true);
  assert.ok(result.recommendation.includes('MEGASTRUCTURE CANDIDATE'));
});

test('DarkCosmosAnomalyEngine recognizes normal stellar blackbody equilibrium', () => {
  const result = DarkCosmosAnomalyEngine.evaluateInfraredExcess({
    targetId: 'SOLAR-ANALOG-01',
    w1Mag: 10.0,
    w2Mag: 9.98,
    w3Mag: 9.95, // W1 - W3 ~ 0.05
    w4Mag: 9.9,
    teff: 5778,
  });

  assert.equal(result.anomalyType, 'STELLAR_EQUILIBRIUM');
  assert.equal(result.threatOrPriority, 'NOMINAL');
  assert.equal(result.flags.nonStandardBlackbody, false);
});

test('DarkCosmosAnomalyEngine validates Breakthrough Listen narrowband technosignature candidate', () => {
  const result = DarkCosmosAnomalyEngine.evaluateRadioSignal(
    2.1, // Bandwidth 2.1 Hz (Narrowband <= 5 Hz)
    0.35, // Doppler drift rate 0.35 Hz/s
    24.5 // SNR 24.5
  );

  assert.equal(result.anomalyType, 'TECHNO_SIGNATURE_NARROWBAND');
  assert.equal(result.threatOrPriority, 'CRITICAL');
  assert.ok(result.confidenceScore >= 80.0);
  assert.equal(result.flags.narrowbandVerified, true);
  assert.equal(result.flags.dopplerDriftDetected, true);
});

test('DarkCosmosAnomalyEngine flags zero-drift narrowband signal as terrestrial RFI', () => {
  const result = DarkCosmosAnomalyEngine.evaluateRadioSignal(
    1.5, // Narrowband
    0.0001, // Zero drift -> Ground transmitter stationary relative to receiver
    35.0
  );

  assert.equal(result.anomalyType, 'NATURAL_RADIO_EMISSION');
  assert.equal(result.threatOrPriority, 'MONITOR');
  assert.equal(result.metrics.classification, 'SUSPECTED_LOCAL_RFI');
});
