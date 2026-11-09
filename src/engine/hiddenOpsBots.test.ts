import { test } from 'node:test';
import assert from 'node:assert';
import { hiddenOps } from './hiddenOpsBots';

test('HiddenOpsEngine: LiveAstrophysicsRenderBot evaluates Gas Giant with ZERO water', () => {
  const state = hiddenOps.synthesizeAstrophysics({
    pl_name: 'HATS-72 b',
    pl_rade: 8.4,
    pl_eqt: 820,
    discoverymethod: 'Transit',
  });

  assert.strictEqual(state.targetCategory, 'GAS_GIANT');
  assert.strictEqual(state.phaseState, 'GASEOUS_SUPERCRITICAL');
  assert.strictEqual(state.hasLiquidWater, false);
  assert.strictEqual(state.hasSolidSurface, false);
  assert.strictEqual(state.isBuoyantProbeRequired, true);
  assert.strictEqual(state.renderingParams.oceanColor, undefined);
  assert.ok(state.renderingParams.hudWarningBanner?.includes('NO SOLID SURFACE'));
});

test('HiddenOpsEngine: LiveAstrophysicsRenderBot evaluates Ultra-Hot Lava World with magma and ZERO water', () => {
  const state = hiddenOps.synthesizeAstrophysics({
    pl_name: 'WASP-103 b',
    pl_rade: 1.5,
    pl_eqt: 2480,
  });

  assert.strictEqual(state.targetCategory, 'LAVA_WORLD');
  assert.strictEqual(state.phaseState, 'VOLCANIC_MAGMA');
  assert.strictEqual(state.hasLiquidWater, false);
  assert.strictEqual(state.renderingParams.magmaFissures, true);
  assert.strictEqual(state.renderingParams.oceanColor, undefined);
  assert.ok(state.renderingParams.hudWarningBanner?.includes('EXTREME THERMAL ENVIRONMENT'));
});

test('HiddenOpsEngine: LiveAstrophysicsRenderBot evaluates Temperate Habitable World with liquid oceans', () => {
  const state = hiddenOps.synthesizeAstrophysics({
    pl_name: 'Kepler-452 b',
    pl_rade: 1.63,
    pl_eqt: 265,
    isHabitableCandidate: true,
  });

  assert.strictEqual(state.targetCategory, 'TEMPERATE_OCEAN');
  assert.strictEqual(state.phaseState, 'LIQUID_OCEAN');
  assert.strictEqual(state.hasLiquidWater, true);
  assert.strictEqual(state.hasSolidSurface, true);
  assert.ok(state.renderingParams.oceanColor);
});

test('HiddenOpsEngine: WatchdogSelfHealerBot records and sanitizes error logs', () => {
  hiddenOps.handleRuntimeError(
    'Test WebGL Shader Compilation',
    'Simulated shader uniform error',
    'Fragment shader 0:12 uniform NaN',
    'Replaced NaN with default float 1.0'
  );

  const logs = hiddenOps.getLogs();
  assert.ok(logs.length > 0);
  assert.strictEqual(logs[0].source, 'Test WebGL Shader Compilation');
  assert.strictEqual(logs[0].autoFixApplied, 'Replaced NaN with default float 1.0');
});
