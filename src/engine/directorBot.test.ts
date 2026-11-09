import test from 'node:test';
import assert from 'node:assert/strict';
import { DirectorBotArbiter } from './directorBot';

test('DirectorBotArbiter certifies clean high-confidence candidate', () => {
  const arbiter = new DirectorBotArbiter(85.0);
  const result = arbiter.evaluateAndCertify({
    id: 'CAND-01',
    targetId: 'TIC-9999123',
    sourceBot: 'KEPLER_BOT',
    candidateType: 'HABITABLE_EXOPLANET',
    preliminaryScore: 95.0,
    snr: 22.4,
    coordinates: { ra: 120.5, dec: 42.1 },
    artifactFlags: [],
    metrics: { period: 18.4, depthPpm: 920 },
  });

  assert.equal(result.status, 'VERIFIED_NOVEL_DISCOVERY');
  assert.ok(result.certifiedScore >= 85.0);
  assert.equal(result.catalogCrossmatch.gaiaDr3Match, true);
  assert.ok(result.directorNotes.includes('Passed rigorous false-positive filtration'));
});

test('DirectorBotArbiter rejects cosmic ray hit and detector glitches', () => {
  const arbiter = new DirectorBotArbiter(85.0);
  const result = arbiter.evaluateAndCertify({
    id: 'CAND-02',
    targetId: 'ARTIFACT-SOURCE',
    sourceBot: 'VOID_WATCHER',
    candidateType: 'STELLAR_INFRARED_ANOMALY',
    preliminaryScore: 99.0,
    snr: 45.0,
    coordinates: { ra: 15.0, dec: -10.2 },
    artifactFlags: ['cosmic_ray_hit', 'detector_glitch'],
    metrics: {},
  });

  assert.equal(result.status, 'REJECTED_FALSE_POSITIVE');
  assert.equal(result.certifiedScore, 0.0);
  assert.ok(result.rejectionReason?.includes('Instrumental artifact') || result.rejectionReason?.includes('cosmic ray'));
});

test('DirectorBotArbiter correctly manages pending reviews and discovery lists', () => {
  const arbiter = new DirectorBotArbiter(85.0);
  const verified = arbiter.getCertifiedRegistry();
  const pending = arbiter.getPendingReviews();
  const all = arbiter.getAllDiscoveries();

  assert.equal(verified.length, 3);
  assert.equal(pending.length, 3);
  assert.equal(all.length, 6);

  // Sub-threshold candidate gets categorized as PENDING_REVIEW
  const marginalResult = arbiter.evaluateAndCertify({
    id: 'CAND-03',
    targetId: 'MARGINAL-STAR',
    sourceBot: 'KEPLER_BOT',
    candidateType: 'HABITABLE_EXOPLANET',
    preliminaryScore: 78.0,
    snr: 8.5,
    coordinates: { ra: 280.0, dec: 35.0 },
    artifactFlags: [],
    metrics: { period: 45.0 },
  });

  assert.equal(marginalResult.status, 'PENDING_REVIEW');
  assert.equal(arbiter.getPendingReviews().length, 4);
  assert.equal(arbiter.getAllDiscoveries().length, 7);
});
