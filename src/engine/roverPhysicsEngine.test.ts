import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAtmosphericDensity,
  calculateAtmosphericEntryStep,
  stepVehiclePhysics,
  calculateAtmosphericScattering,
  RoverPhysicsState,
  VehicleInputs,
} from './roverPhysicsEngine';

test('roverPhysicsEngine: atmospheric density scales exponentially with altitude', () => {
  const seaLevel = calculateAtmosphericDensity(0, 1.0, 8.5);
  const stratosphere = calculateAtmosphericDensity(17.0, 1.0, 8.5); // 2 scale heights
  const exosphere = calculateAtmosphericDensity(85.0, 1.0, 8.5);

  assert.ok(seaLevel > stratosphere, 'Sea level density must exceed stratosphere');
  assert.ok(stratosphere > exosphere, 'Stratosphere density must exceed exosphere');
  // At 2 scale heights: rho ~ rho0 * e^-2 ~ 0.135
  const ratio = stratosphere / seaLevel;
  assert.ok(Math.abs(ratio - 0.135) < 0.05, `Expected e^-2 ratio ~0.135, got ${ratio}`);
});

test('roverPhysicsEngine: atmospheric entry generates plasma heat-shield peak and de-accelerates', () => {
  let altKm = 100;
  let velKms = 7.8; // Low orbit velocity ~7.8 km/s
  const step = calculateAtmosphericEntryStep(altKm, velKms, 1.0, 8.5, 1.0, 0.5);

  assert.ok(step.dynamicPressureKPa >= 0, 'Dynamic pressure must be positive');
  assert.ok(step.heatShieldTempK >= 180, 'Heat shield temperature must be valid');
  assert.ok(step.progressPct >= 0 && step.progressPct <= 100, 'Progress must be in 0-100%');

  // As altitude drops to 40km with high velocity, plasma intensity must peak
  const entryStep = calculateAtmosphericEntryStep(40, 6.2, 1.0, 8.5, 1.0, 0.5);
  assert.equal(entryStep.stage, 'ATMOSPHERIC_ENTRY');
  assert.ok(entryStep.plasmaGlowIntensity > 0.3, 'Plasma glow must be active during entry phase');
  assert.ok(entryStep.heatShieldTempK > 1500, 'Heat shield must be incandescent (>1500K)');
});

test('roverPhysicsEngine: surface rover responds to WASD controls and obeys planetary gravity', () => {
  const initialRover: RoverPhysicsState = {
    position: { x: 0, y: 1.35, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    headingRad: 0,
    pitchRad: 0,
    rollRad: 0,
    wheelRotationRad: 0,
    isGrounded: true,
    speedMs: 0,
    thrustPct: 0,
    vehicleMode: 'ROVER',
    altitudeM: 0,
  };

  const inputs: VehicleInputs = {
    forward: true,
    backward: false,
    steerLeft: false,
    steerRight: false,
    jumpBoost: false,
    descend: false,
  };

  // Step 1: Forward acceleration
  const moved = stepVehiclePhysics(initialRover, inputs, 1.0, true, 0.1);
  assert.ok(moved.velocity.z < 0, 'Forward driving should yield negative Z velocity');
  assert.ok(moved.speedMs > 0, 'Speed must be positive');
  assert.ok(moved.wheelRotationRad > 0, 'Wheel rotation should advance');

  // Step 2: Test jump on low-gravity vs super-Earth
  const jumpInputs: VehicleInputs = { ...inputs, forward: false, jumpBoost: true };
  const jumpLowG = stepVehiclePhysics(initialRover, jumpInputs, 0.1, true, 0.1); // 0.1g asteroid
  const jumpSuperEarth = stepVehiclePhysics(initialRover, jumpInputs, 2.5, true, 0.1); // 2.5g super-Earth

  assert.ok(jumpLowG.velocity.y > jumpSuperEarth.velocity.y, 'Low-G world must generate larger vertical jump impulse');
});

test('roverPhysicsEngine: converts to buoyant Aero-Drone on worlds with no solid ground', () => {
  const droneState: RoverPhysicsState = {
    position: { x: 0, y: 50, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    headingRad: 0,
    pitchRad: 0,
    rollRad: 0,
    wheelRotationRad: 0,
    isGrounded: false,
    speedMs: 0,
    thrustPct: 0,
    vehicleMode: 'AERO_DRONE',
    altitudeM: 50,
  };

  const inputs: VehicleInputs = {
    forward: true,
    backward: false,
    steerLeft: false,
    steerRight: false,
    jumpBoost: true, // Vertical climb
    descend: false,
  };

  // Gas Giant: hasSolidSurface = false
  const updated = stepVehiclePhysics(droneState, inputs, 2.4, false, 0.1);
  assert.ok(updated.velocity.y > 0, 'Lift thrusters must ascend in aero-probe mode');
  assert.ok(updated.speedMs > 0, 'Forward propulsion must move drone in gas atmosphere');
});

test('roverPhysicsEngine: atmospheric scattering scales sky color and fog with altitude', () => {
  const surfaceScattering = calculateAtmosphericScattering(0, 1.0, 8.5, '#7dd3fc', '#0284c7');
  const spaceScattering = calculateAtmosphericScattering(80, 1.0, 8.5, '#7dd3fc', '#0284c7');

  assert.ok(surfaceScattering.fogDensity > spaceScattering.fogDensity, 'Surface fog must be thicker than space');
  assert.ok(spaceScattering.spaceBlackBlend > 0.9, 'High altitude must blend into black of space');
});
