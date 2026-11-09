import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STELLA_CORES,
  calculateStatisticalSignificance,
  evaluateFalsePositiveRisk,
  runStellaSyndicateAudit,
  AnomalyCandidate,
} from './stellaCoreEngine';

test('stellaCoreEngine: all 7 Stella-Core Vegapunk minds exist with distinct scientific formulations', () => {
  const mindKeys = Object.keys(STELLA_CORES);
  assert.equal(mindKeys.length, 7, 'Must have exactly 7 Stella Cores');

  assert.equal(STELLA_CORES.STELLA_01.historicalFigure, 'Albert Einstein');
  assert.equal(STELLA_CORES.STELLA_02.historicalFigure, 'Richard Feynman');
  assert.equal(STELLA_CORES.STELLA_03.historicalFigure, 'Carl Sagan');
  assert.equal(STELLA_CORES.STELLA_04.historicalFigure, 'Isaac Newton');
  assert.equal(STELLA_CORES.STELLA_05.historicalFigure, 'Nikola Tesla');
  assert.equal(STELLA_CORES.STELLA_06.historicalFigure, 'Marie Curie');
  assert.equal(STELLA_CORES.STELLA_07.historicalFigure, 'Pythagoras');
});

test('stellaCoreEngine: statistical significance calculates Gaussian multi-epoch accumulation', () => {
  const sigma1 = calculateStatisticalSignificance(5.0, 1);
  const sigmaMany = calculateStatisticalSignificance(5.0, 16);

  assert.ok(sigmaMany > sigma1, 'Multi-epoch observations must yield higher statistical significance');
  assert.ok(sigmaMany > 7.0, '16 epochs with SNR 5.0 must exceed 7.0 sigma');
});

test('stellaCoreEngine: evaluateFalsePositiveRisk identifies zero-drift radio signals as terrestrial RFI', () => {
  const rfiSignal: AnomalyCandidate = {
    id: 'SIG-01',
    targetId: 'EARTH-ORBIT',
    type: 'NARROWBAND_TECHNOSIGNATURE',
    snr: 25.0,
    measuredSigma: 8.5,
    driftHzS: 0.001, // Zero drift indicates ground transmitter!
  };

  const risk = evaluateFalsePositiveRisk(rfiSignal);
  assert.equal(risk.isFalsePositive, true);
  assert.equal(risk.riskCategory, 'GROUND_RFI_LEAKAGE');
});

test('stellaCoreEngine: runStellaSyndicateAudit generates publication-ready Nobel Dossier with SHA-256 seal when sigma >= 7.0', () => {
  const warpCandidate: AnomalyCandidate = {
    id: 'WARP-CAND-01',
    targetId: 'TIC-25155310',
    type: 'ALCUBIERRE_WARP_METRIC',
    snr: 32.0,
    measuredSigma: 8.4,
  };

  const dossier = runStellaSyndicateAudit(warpCandidate);
  assert.equal(dossier.peerReviewVotes.length, 7);
  assert.equal(dossier.isNobelThresholdExceeded, true);
  assert.ok(dossier.compositeSigma >= 7.0);
  assert.ok(dossier.sha256Seal.startsWith('SHA256:'));
  assert.ok(dossier.arxivPreprintLatex.includes('\\documentclass'));
  assert.ok(dossier.arxivPreprintLatex.includes('Stella-01 Einstein'));
  assert.ok(dossier.arxivPreprintLatex.includes('Stella-07 Pythagoras'));
});
