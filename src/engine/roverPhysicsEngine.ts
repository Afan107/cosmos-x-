/**
 * COSMOS-X Procedural Rover & Drone Physics Engine
 * Handles atmospheric entry, aerodynamic drag, plasma heat-shield ionization,
 * 6-wheel suspension, planetary gravity scaling, and terrain collision dynamics.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type FlightStage =
  | 'ORBIT'
  | 'DEORBIT_BURN'
  | 'ATMOSPHERIC_ENTRY'
  | 'TERMINAL_DESCENT'
  | 'SURFACE_TOUCHDOWN';

export type VehicleMode = 'ROVER' | 'AERO_DRONE';

export interface VehicleInputs {
  forward: boolean;
  backward: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  jumpBoost: boolean;
  descend: boolean;
}

export interface RoverPhysicsState {
  position: Vector3D;
  velocity: Vector3D;
  headingRad: number; // Yaw
  pitchRad: number;
  rollRad: number;
  wheelRotationRad: number;
  isGrounded: boolean;
  speedMs: number;
  thrustPct: number;
  vehicleMode: VehicleMode;
  altitudeM: number;
}

export interface AtmosphericEntryState {
  stage: FlightStage;
  altitudeKm: number;
  velocityKms: number;
  dynamicPressureKPa: number;
  heatShieldTempK: number;
  plasmaGlowIntensity: number; // 0.0 to 1.0
  plasmaGlowColor: string; // CSS or hex color
  progressPct: number; // 0 to 100
  hudStatus: string;
}

/**
 * Calculates atmospheric density as a function of altitude:
 * rho(h) = rho_0 * exp(-h / H)
 */
export function calculateAtmosphericDensity(
  altitudeKm: number,
  surfacePressureAtm: number,
  scaleHeightKm: number
): number {
  if (altitudeKm < 0) altitudeKm = 0;
  if (scaleHeightKm <= 0) scaleHeightKm = 8.5;
  // Standard sea-level air density on Earth is ~1.225 kg/m^3 at 1 atm
  const rho0 = surfacePressureAtm * 1.225;
  return rho0 * Math.exp(-altitudeKm / scaleHeightKm);
}

/**
 * Computes the thermodynamic atmospheric entry re-entry state
 * Dynamic pressure: q = 0.5 * rho * v^2
 * Stagnation point heating: q_dot ~ K * sqrt(rho / R_nose) * v^3
 */
export function calculateAtmosphericEntryStep(
  currentAltKm: number,
  currentVelKms: number,
  surfacePressureAtm: number,
  scaleHeightKm: number,
  gravityG: number,
  dt: number,
  manualThrust = 0
): AtmosphericEntryState {
  const density = calculateAtmosphericDensity(currentAltKm, surfacePressureAtm, scaleHeightKm);

  // Aerodynamic drag deceleration (v in m/s, density in kg/m^3)
  // a_drag = 0.5 * rho * v^2 * Cd * A / mass (typical blunt capsule Cd*A/m ~ 0.005 m^2/kg)
  const vMs = currentVelKms * 1000;
  const ballisticFactor = 0.0035; // Aerodynamic drag coefficient factor
  const dragAccelMs2 = 0.5 * density * vMs * vMs * ballisticFactor;
  const gravityAccelMs2 = gravityG * 9.81;

  // New velocity
  const netAccelKms2 = (-dragAccelMs2 + (gravityAccelMs2 * 0.1) - (manualThrust * 15)) / 1000;
  let newVelKms = Math.max(0.05, currentVelKms + netAccelKms2 * dt);

  // New altitude
  let newAltKm = Math.max(0.003, currentAltKm - newVelKms * dt);

  // Dynamic pressure in kPa
  const qKPa = 0.5 * density * (newVelKms * 1000) * (newVelKms * 1000) / 1000;

  // Plasma stagnation heat-shield temperature (peak ionization ~ 1,800K to 3,200K)
  const ambientTempK = 180;
  const heatingCoeff = 0.45;
  const heatShieldTempK = Math.min(
    3800,
    ambientTempK + heatingCoeff * Math.sqrt(Math.max(0.0001, density)) * Math.pow(newVelKms * 10, 2.6)
  );

  // Plasma glow intensity: rises when q is high and altitude is in entry interface (25km to 90km)
  let plasmaIntensity = 0;
  let plasmaColor = '#f97316'; // Orange default
  let stage: FlightStage = 'ORBIT';
  let hudStatus = 'ORBITAL PATROL';

  if (newAltKm > 120) {
    stage = 'ORBIT';
    hudStatus = 'HIGH ORBIT (EXOSPHERE)';
    plasmaIntensity = 0;
  } else if (newAltKm > 80) {
    stage = 'DEORBIT_BURN';
    hudStatus = 'ATMOSPHERIC INTERFACE DETECTED';
    plasmaIntensity = Math.min(0.3, (120 - newAltKm) / 40 * 0.3);
    plasmaColor = '#f97316';
  } else if (newAltKm > 15) {
    stage = 'ATMOSPHERIC_ENTRY';
    hudStatus = `PLASMA SHEATH IONIZATION (${Math.round(heatShieldTempK)} K)`;
    plasmaIntensity = Math.min(1.0, 0.4 + (qKPa / 120) * 0.6);
    plasmaColor = heatShieldTempK > 2400 ? '#38bdf8' : heatShieldTempK > 1800 ? '#fbbf24' : '#ea580c';
  } else if (newAltKm > 0.05) {
    stage = 'TERMINAL_DESCENT';
    hudStatus = 'AEROBRAKING & RETRO-TOUCHDOWN BURN';
    plasmaIntensity = Math.max(0, (newAltKm / 15) * 0.2);
    plasmaColor = '#ea580c';
  } else {
    stage = 'SURFACE_TOUCHDOWN';
    hudStatus = 'SURFACE TOUCHDOWN COMPLETE — ROVER READY';
    plasmaIntensity = 0;
    newAltKm = 0.003;
    newVelKms = 0;
  }

  const initialMaxAlt = 150;
  const progressPct = Math.min(100, Math.max(0, (1 - newAltKm / initialMaxAlt) * 100));

  return {
    stage,
    altitudeKm: Number(newAltKm.toFixed(3)),
    velocityKms: Number(newVelKms.toFixed(3)),
    dynamicPressureKPa: Number(qKPa.toFixed(2)),
    heatShieldTempK: Math.round(heatShieldTempK),
    plasmaGlowIntensity: Number(plasmaIntensity.toFixed(3)),
    plasmaGlowColor: plasmaColor,
    progressPct: Number(progressPct.toFixed(1)),
    hudStatus,
  };
}

/**
 * Procedural height function matching CosmicSurfaceExplorer terrain
 */
export function getProceduralTerrainHeight(
  x: number,
  z: number,
  options?: { iceSpires?: boolean; magmaFissures?: boolean; hasLiquidWater?: boolean }
): number {
  let height =
    Math.sin(x * 0.015) * Math.cos(z * 0.015) * 16 +
    Math.sin(x * 0.04 + z * 0.02) * 6;

  if (options?.iceSpires) {
    height += Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.08)) * 18;
  }

  if (options?.magmaFissures) {
    height = Math.max(-4, height + Math.cos(x * 0.03) * 10);
  }

  if (options?.hasLiquidWater) {
    height = Math.max(-2, height);
  }

  return height;
}

/**
 * Step vehicle physics on the ground (Rover) or in the air (Drone)
 */
export function stepVehiclePhysics(
  current: RoverPhysicsState,
  inputs: VehicleInputs,
  gravityG: number,
  hasSolidSurface: boolean,
  dt: number,
  terrainHeightFunc: (x: number, z: number) => number = getProceduralTerrainHeight
): RoverPhysicsState {
  const safeDt = Math.min(0.1, Math.max(0.001, dt));
  const gravityAccel = Math.max(0.1, gravityG) * 9.81; // m/s^2

  const nextPos = { ...current.position };
  const nextVel = { ...current.velocity };
  let nextHeading = current.headingRad;
  let nextPitch = current.pitchRad;
  let nextRoll = current.rollRad;
  let nextWheelRot = current.wheelRotationRad;
  let isGrounded = false;
  let thrustPct = 0;

  // Steering / Yaw
  const steerRate = 1.8; // rad/s
  if (inputs.steerLeft) nextHeading += steerRate * safeDt;
  if (inputs.steerRight) nextHeading -= steerRate * safeDt;

  // Forward unit vector in ground X-Z plane
  const fwdX = -Math.sin(nextHeading);
  const fwdZ = -Math.cos(nextHeading);

  // (A) DRONE / AERO-PROBE (Used on Gas Giants, Sub-Neptunes, or when flying)
  if (!hasSolidSurface || current.vehicleMode === 'AERO_DRONE') {
    const droneAccel = 18.0; // m/s^2
    const droneDrag = 0.94; // air resistance

    if (inputs.forward) {
      nextVel.x += fwdX * droneAccel * safeDt;
      nextVel.z += fwdZ * droneAccel * safeDt;
      thrustPct = 0.8;
    }
    if (inputs.backward) {
      nextVel.x -= fwdX * droneAccel * 0.6 * safeDt;
      nextVel.z -= fwdZ * droneAccel * 0.6 * safeDt;
      thrustPct = 0.5;
    }

    // Vertical thrusters
    const liftThruster = inputs.jumpBoost ? 22.0 : 0;
    const descentThruster = inputs.descend ? -15.0 : 0;
    const buoyancy = gravityAccel * 0.98; // Neutral buoyancy hovering

    nextVel.y += (buoyancy - gravityAccel + liftThruster + descentThruster) * safeDt;

    // Apply drag
    nextVel.x *= Math.pow(droneDrag, safeDt * 60);
    nextVel.z *= Math.pow(droneDrag, safeDt * 60);
    nextVel.y *= Math.pow(0.92, safeDt * 60);

    // Apply velocity
    nextPos.x += nextVel.x * safeDt;
    nextPos.y += nextVel.y * safeDt;
    nextPos.z += nextVel.z * safeDt;

    // Minimum flight altitude floor
    const floorY = hasSolidSurface ? terrainHeightFunc(nextPos.x, nextPos.z) + 3.0 : 5.0;
    if (nextPos.y < floorY) {
      nextPos.y = floorY;
      nextVel.y = Math.max(0, nextVel.y);
      if (hasSolidSurface) isGrounded = true;
    }

    // Drone tilt on acceleration
    nextPitch = (nextVel.z * fwdZ + nextVel.x * fwdX) * 0.04;
    nextRoll = (inputs.steerLeft ? 0.2 : inputs.steerRight ? -0.2 : 0);

    const speed = Math.sqrt(nextVel.x * nextVel.x + nextVel.y * nextVel.y + nextVel.z * nextVel.z);

    return {
      position: nextPos,
      velocity: nextVel,
      headingRad: nextHeading,
      pitchRad: nextPitch,
      rollRad: nextRoll,
      wheelRotationRad: nextWheelRot,
      isGrounded,
      speedMs: Number(speed.toFixed(2)),
      thrustPct: Number(thrustPct.toFixed(2)),
      vehicleMode: current.vehicleMode,
      altitudeM: Number(Math.max(0, nextPos.y - floorY).toFixed(1)),
    };
  }

  // (B) SOLID GROUND ROVER
  const roverDriveAccel = 15.0; // m/s^2 engine force
  const groundFriction = 0.88;

  const currentGroundY = terrainHeightFunc(nextPos.x, nextPos.z);
  const roverBaseClearance = 1.35; // Distance from chassis center to ground
  const targetSurfaceY = currentGroundY + roverBaseClearance;

  const distAboveGround = nextPos.y - targetSurfaceY;
  isGrounded = distAboveGround <= 0.15;

  if (isGrounded) {
    // Engine acceleration when grounded
    if (inputs.forward) {
      nextVel.x += fwdX * roverDriveAccel * safeDt;
      nextVel.z += fwdZ * roverDriveAccel * safeDt;
      thrustPct = 0.75;
    }
    if (inputs.backward) {
      nextVel.x -= fwdX * (roverDriveAccel * 0.5) * safeDt;
      nextVel.z -= fwdZ * (roverDriveAccel * 0.5) * safeDt;
      thrustPct = 0.4;
    }

    // Thruster Boost / Low-G Jump
    if (inputs.jumpBoost) {
      // Compensate: lower gravity gives higher jump velocity
      const jumpVel = Math.min(25, 7.5 + (1.0 / Math.max(0.1, gravityG)) * 3.5);
      nextVel.y = jumpVel;
      isGrounded = false;
      thrustPct = 1.0;
    } else {
      // Pin to ground with suspension smoothing
      nextPos.y = targetSurfaceY;
      nextVel.y = 0;
    }

    // Friction
    nextVel.x *= Math.pow(groundFriction, safeDt * 60);
    nextVel.z *= Math.pow(groundFriction, safeDt * 60);
  } else {
    // Free-fall in gravity
    nextVel.y -= gravityAccel * safeDt;

    // Apply drag in air
    nextVel.x *= Math.pow(0.98, safeDt * 60);
    nextVel.z *= Math.pow(0.98, safeDt * 60);

    // Minor mid-air pitch/roll stabilization
    if (inputs.jumpBoost) {
      nextVel.y += 12.0 * safeDt; // Secondary RCS burst
      thrustPct = 0.9;
    }
  }

  // Update positions
  nextPos.x += nextVel.x * safeDt;
  nextPos.y += nextVel.y * safeDt;
  nextPos.z += nextVel.z * safeDt;

  // Ground collision check
  const newGroundY = terrainHeightFunc(nextPos.x, nextPos.z);
  const newTargetY = newGroundY + roverBaseClearance;
  if (nextPos.y < newTargetY) {
    nextPos.y = newTargetY;
    nextVel.y = 0;
    isGrounded = true;
  }

  // Calculate terrain slope for suspension pitch & roll
  const deltaSample = 1.5;
  const hFront = terrainHeightFunc(nextPos.x + fwdX * deltaSample, nextPos.z + fwdZ * deltaSample);
  const hBack = terrainHeightFunc(nextPos.x - fwdX * deltaSample, nextPos.z - fwdZ * deltaSample);
  const targetPitch = Math.atan2(hFront - hBack, deltaSample * 2);

  // Right unit vector
  const rightX = -fwdZ;
  const rightZ = fwdX;
  const hRight = terrainHeightFunc(nextPos.x + rightX * deltaSample, nextPos.z + rightZ * deltaSample);
  const hLeft = terrainHeightFunc(nextPos.x - rightX * deltaSample, nextPos.z - rightZ * deltaSample);
  const targetRoll = Math.atan2(hRight - hLeft, deltaSample * 2);

  // Smooth orientation
  nextPitch += (targetPitch - nextPitch) * Math.min(1.0, safeDt * 10);
  nextRoll += (targetRoll - nextRoll) * Math.min(1.0, safeDt * 10);

  // Wheel rotation proportional to forward speed
  const fwdSpeed = nextVel.x * fwdX + nextVel.z * fwdZ;
  nextWheelRot += (fwdSpeed / 0.45) * safeDt; // 0.45m wheel radius

  const totalSpeed = Math.sqrt(nextVel.x * nextVel.x + nextVel.y * nextVel.y + nextVel.z * nextVel.z);

  return {
    position: nextPos,
    velocity: nextVel,
    headingRad: nextHeading,
    pitchRad: nextPitch,
    rollRad: nextRoll,
    wheelRotationRad: nextWheelRot,
    isGrounded,
    speedMs: Number(totalSpeed.toFixed(2)),
    thrustPct: Number(thrustPct.toFixed(2)),
    vehicleMode: 'ROVER',
    altitudeM: Number(Math.max(0, nextPos.y - newTargetY).toFixed(1)),
  };
}

/**
 * Real-time atmospheric scattering calculator:
 * As camera/vehicle altitude changes, compute Rayleigh extinction,
 * sky horizon/zenith blend, and fog density.
 */
export function calculateAtmosphericScattering(
  altitudeKm: number,
  surfacePressureAtm: number,
  scaleHeightKm: number,
  baseHorizonHex: string,
  baseZenithHex: string
): {
  fogDensity: number;
  skyHorizonHex: string;
  skyZenithHex: string;
  spaceBlackBlend: number;
} {
  const density = calculateAtmosphericDensity(altitudeKm, surfacePressureAtm, scaleHeightKm);
  const normalizedDensity = Math.min(3.0, density);

  // Scale fog: thicker near surface, transparent in space
  const baseFog = 0.0012;
  const fogDensity = Number((baseFog * normalizedDensity * Math.exp(-altitudeKm / 12)).toFixed(6));

  // Blend with space black (#010006) as altitude rises into the stratosphere / exosphere
  const spaceBlackBlend = Math.min(1.0, Math.max(0, altitudeKm / 45));

  return {
    fogDensity,
    skyHorizonHex: spaceBlackBlend > 0.85 ? '#020008' : baseHorizonHex,
    skyZenithHex: spaceBlackBlend > 0.5 ? '#010006' : baseZenithHex,
    spaceBlackBlend: Number(spaceBlackBlend.toFixed(3)),
  };
}
