import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCourtroomDebate,
  WITNESS_BOT_PROFILES,
  PRESET_CROSS_EXAMINATION_PROMPTS,
} from './courtroomDebateEngine';

test('courtroomDebateEngine: presets and bot profiles exist for all scout agents', () => {
  assert.ok(PRESET_CROSS_EXAMINATION_PROMPTS.length >= 4, 'Must have at least 4 preset prompts');
  assert.ok(WITNESS_BOT_PROFILES.KEPLER_BOT, 'Kepler-Bot must have witness profile');
  assert.ok(WITNESS_BOT_PROFILES.VOID_WATCHER, 'Void-Watcher must have witness profile');
  assert.ok(WITNESS_BOT_PROFILES.SETI_SENTINEL, 'SETI-Sentinel must have witness profile');
  assert.ok(WITNESS_BOT_PROFILES.JWST_SPECTRA, 'JWST-Spectra must have witness profile');
  assert.ok(WITNESS_BOT_PROFILES.OUMUAMUA_TRACKER, 'Oumuamua-Tracker must have witness profile');
});

test('courtroomDebateEngine: generates complete 4-step debate transcript with witness, Dr. Vesta, user, and Director Bot', () => {
  const session = generateCourtroomDebate(
    'TIC-25155310',
    'STELLAR INFRARED ANOMALY (DYSON CANDIDATE)',
    'VOID_WATCHER',
    'How do you rule out background eclipsing binary blending?',
    85.0
  );

  assert.equal(session.turns.length, 4, 'Must generate exactly 4 debate turns');
  assert.equal(session.turns[0].stage, 'WITNESS_TESTIMONY');
  assert.equal(session.turns[1].stage, 'THEORETICAL_CHALLENGE');
  assert.equal(session.turns[2].stage, 'USER_CROSS_EXAMINATION');
  assert.equal(session.turns[3].stage, 'JUDICIAL_VERDICT');

  // Verify Dr. Vesta challenged theoretical constraints
  assert.equal(session.turns[1].speakerId, 'ASTRO_BOT');
  assert.ok(session.turns[1].testimony.length > 50, 'Dr. Vesta must give substantial theoretical rebuttal');

  // Verify Director Bot issued binding verdict
  assert.equal(session.turns[3].speakerId, 'DIRECTOR_BOT');
  assert.ok(session.turns[3].verdictScore !== undefined, 'Verdict score must be present');
  assert.ok(['RATIFIED_CERTIFIED', 'REMANDED_OBSERVATION', 'QUASHED_QUARANTINE'].includes(session.finalVerdict));
});

test('courtroomDebateEngine: user prompt about RFI triggers Doppler drift defense from SETI agent', () => {
  const session = generateCourtroomDebate(
    'PROXIMA-CENTAURI-B',
    'NARROWBAND RADIO ANOMALY',
    'SETI_SENTINEL',
    'Is this local ground RFI from airport radar?',
    80.0
  );

  const userTurn = session.turns[2];
  assert.ok(
    userTurn.testimony.toLowerCase().includes('rfi') || userTurn.testimony.toLowerCase().includes('drift'),
    'Response must address RFI and Doppler drift directly'
  );
});
