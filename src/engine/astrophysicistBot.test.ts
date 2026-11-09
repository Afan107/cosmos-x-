import test from 'node:test';
import assert from 'node:assert/strict';
import { LeadAstrophysicistBot } from './astrophysicistBot';

test('LeadAstrophysicistBot validates stable habitable exoplanet', () => {
  const vesta = new LeadAstrophysicistBot();
  const result = vesta.auditPhysicalLaws({
    targetId: 'Kepler-452b',
    type: 'HABITABLE_EXOPLANET',
    planetRadiusEarth: 1.63,
    periodDays: 384.8,
    semiMajorAxisAu: 1.05,
    teff: 5757,
  });

  assert.equal(result.physicsValidated, true);
  assert.ok(result.astrophysicalScore >= 80.0);
  assert.equal(result.densityCheck, 'VALID');
  assert.equal(result.orbitalStability, 'STABLE_KEPLERIAN');
});

test('LeadAstrophysicistBot flags impossible planet radius (>25 R_Earth) as binary star', () => {
  const vesta = new LeadAstrophysicistBot();
  const result = vesta.auditPhysicalLaws({
    targetId: 'FALSE-TRANSIT-01',
    type: 'EXOPLANET_CANDIDATE',
    planetRadiusEarth: 32.4, // Impossible planet size
    periodDays: 2.1,
    semiMajorAxisAu: 0.03,
  });

  assert.equal(result.physicsValidated, false);
  assert.ok(result.astrophysicalScore < 80.0);
  assert.equal(result.densityCheck, 'ANOMALOUS_LOW');
  assert.ok(result.analyticalNotes.includes('exceeding the theoretical hydrogen-burning / degeneracy limit'));
});

test('LeadAstrophysicistBot evaluates Dyson candidate non-thermal blackbody excess', () => {
  const vesta = new LeadAstrophysicistBot();
  const result = vesta.auditPhysicalLaws({
    targetId: 'TIC-25155310',
    type: 'DYSON_SWARM_INFRARED_EXCESS',
    teff: 5420,
    w1w3Excess: 1.7,
    w3w4Excess: 1.5,
  });

  assert.equal(result.physicsValidated, true);
  assert.equal(result.thermodynamicState, 'EXCESS_NON_THERMAL');
  assert.ok(result.analyticalNotes.includes('violates classical stellar Rayleigh-Jeans tail'));
});
