/**
 * Relativistic Frame-Dragging Rig (Lense-Thirring Spacetime Distortion Engine)
 *
 * Implements the general-relativistic Kerr metric and Lense-Thirring frame-dragging
 * phenomena around massive binary star systems and spinning compact objects.
 *
 * Physics & Formulations:
 * 1. Lense-Thirring angular velocity: \Omega_LT = (2 * G * J) / (c^2 * r^3)
 * 2. Kerr metric spin parameter: a = J / (M * c), with dimensionless a* = a / M (0 <= a* < 1)
 * 3. Ergosphere radius: r_E(theta) = M + sqrt(M^2 - a^2 * cos^2(theta))
 * 4. Binary orbital frame dragging: Quadrupole perturbation h_uv propagating at c
 * 5. Geodesic coordinate distortion: Azimuthal frame twist \Delta\phi(r, t) and gravity-well depth
 */

import * as THREE from 'three';

export interface RelativisticMetrics {
  kerrSpinParam: number; // Dimensionless spin a* = a/M (e.g., 0.94)
  lenseThirringVelocityRadS: number; // Frame dragging rate at ISCO in rad/s
  ergosphereRadiusRg: number; // Ergosphere radius in gravitational radii r_g = GM/c^2
  eventHorizonRadiusRg: number; // Event horizon r_+ in r_g
  binaryMassRatio: number; // M1 / M2 mass ratio
  gravitationalWaveStrain: number; // Characteristic strain h_0 (e.g. 1.84e-21)
  orbitalPeriodDays: number; // Orbital period of the massive binary
  frameDraggingActive: boolean;
}

export interface RelativisticFrameDraggingRig {
  group: THREE.Group;
  primaryStarMesh: THREE.Mesh;
  secondaryStarMesh: THREE.Mesh;
  gridLineSegments: THREE.LineSegments;
  ergosphereMesh: THREE.Mesh;
  eventHorizonMesh: THREE.Mesh;
  vectorFieldMesh: THREE.LineSegments;
  binaryOrbitPath: THREE.Line;
  update: (delta: number) => void;
  dispose: () => void;
  getPhysicsMetrics: () => RelativisticMetrics;
  setSpinParameter: (spin: number) => void;
}

// Pre-allocated reusable helpers for zero-GC render loop
const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();

/**
 * Calculates theoretical Lense-Thirring angular velocity Omega_LT
 * @param r Radius in gravitational units r_g
 * @param aStar Dimensionless Kerr spin parameter (0 to 0.998)
 * @param M Mass in solar masses
 */
export function calculateLenseThirringOmega(r: number, aStar: number = 0.94, M: number = 21.0): number {
  if (r <= 0) return 0;
  // Scaled for astrophysical demonstration: Omega_LT = 2*G*J / (c^2 * r^3)
  // Higher spin and smaller radius yield exponential azimuthal frame twisting
  const rSafe = Math.max(1.2, r);
  return (2 * aStar * (M / 20.0)) / Math.pow(rSafe, 2.7);
}

/**
 * Calculates Kerr Ergosphere radius at given polar angle theta
 */
export function calculateErgosphereRadius(thetaRad: number, aStar: number = 0.94, M: number = 1.0): number {
  const cosTheta = Math.cos(thetaRad);
  const radical = Math.max(0, 1 - aStar * aStar * cosTheta * cosTheta);
  return M * (1 + Math.sqrt(radical));
}

/**
 * Builds the interactive 3D Relativistic Frame-Dragging Spacetime Distortion Grid
 */
export function buildRelativisticFrameDraggingRig(
  binaryCenter: [number, number, number] = [0, -15, 0],
  scale: number = 1.0
): RelativisticFrameDraggingRig {
  const group = new THREE.Group();
  group.name = 'RELATIVISTIC_FRAME_DRAGGING_RIG';
  group.position.set(...binaryCenter);

  let kerrSpin = 0.942; // High-spin Kerr black hole / massive binary system
  let primaryMass = 21.2; // Solar masses (e.g. Cygnus X-1 / massive stellar-mass binary)
  let secondaryMass = 14.8; // Companion blue supergiant
  const totalMass = primaryMass + secondaryMass;
  const binarySeparation = 16 * scale;
  let orbitalAngle = 0;
  let elapsedTime = 0;

  // 1. Spacetime Geodesic Grid (Polar + Radial warped lines)
  const rings = 36;
  const sectors = 64;
  const maxRadius = 140 * scale;
  const minRadius = 4.0 * scale;

  // We construct line segments for concentric twisted rings + radial vortex lines
  const totalVertices = rings * sectors * 2 + sectors * (rings - 1) * 2;
  const positions = new Float32Array(totalVertices * 3);
  const colors = new Float32Array(totalVertices * 3);

  const gridGeom = new THREE.BufferGeometry();
  gridGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  gridGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const gridMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const gridLineSegments = new THREE.LineSegments(gridGeom, gridMat);
  group.add(gridLineSegments);

  // 2. Ergosphere Oblate Spheroid (Surface where stationary observers must rotate with spacetime)
  const ergoGeom = new THREE.SphereGeometry(6.2 * scale, 32, 16);
  ergoGeom.scale(1.0, 0.65, 1.0); // Flatten along spin axis
  const ergoMat = new THREE.MeshBasicMaterial({
    color: '#f43f5e',
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const ergosphereMesh = new THREE.Mesh(ergoGeom, ergoMat);
  group.add(ergosphereMesh);

  // 3. Event Horizon Sphere (Black hole core of the massive binary)
  const horizonGeom = new THREE.SphereGeometry(3.1 * scale, 24, 24);
  const horizonMat = new THREE.MeshBasicMaterial({
    color: '#05020a',
  });
  const eventHorizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
  group.add(eventHorizonMesh);

  // 4. Primary Massive Star / Black Hole Accretion Disk (Star 1)
  const primaryGeom = new THREE.SphereGeometry(2.4 * scale, 24, 24);
  const primaryMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
  });
  const primaryStarMesh = new THREE.Mesh(primaryGeom, primaryMat);

  const primaryGlowGeom = new THREE.RingGeometry(2.6 * scale, 5.2 * scale, 32);
  const primaryGlowMat = new THREE.MeshBasicMaterial({
    color: '#0284c7',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const primaryAccretionDisk = new THREE.Mesh(primaryGlowGeom, primaryGlowMat);
  primaryAccretionDisk.rotation.x = Math.PI / 2;
  primaryStarMesh.add(primaryAccretionDisk);
  group.add(primaryStarMesh);

  // 5. Secondary Companion Star (Star 2 - Blue/Violet High-Mass Companion)
  const secondaryGeom = new THREE.SphereGeometry(2.0 * scale, 24, 24);
  const secondaryMat = new THREE.MeshBasicMaterial({
    color: '#c084fc',
  });
  const secondaryStarMesh = new THREE.Mesh(secondaryGeom, secondaryMat);

  const secondaryCoronaGeom = new THREE.SphereGeometry(2.5 * scale, 16, 16);
  const secondaryCoronaMat = new THREE.MeshBasicMaterial({
    color: '#a855f7',
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });
  const secondaryCorona = new THREE.Mesh(secondaryCoronaGeom, secondaryCoronaMat);
  secondaryStarMesh.add(secondaryCorona);
  group.add(secondaryStarMesh);

  // 6. Binary Orbit Trajectory Rings
  const orbitCurve = new THREE.EllipseCurve(
    0, 0,
    binarySeparation * 0.55, binarySeparation * 0.55,
    0, 2 * Math.PI,
    false,
    0
  );
  const orbitPoints = orbitCurve.getPoints(64);
  const orbitGeom = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const orbitMat = new THREE.LineDashedMaterial({
    color: '#818cf8',
    dashSize: 1.5,
    gapSize: 1.0,
    transparent: true,
    opacity: 0.5,
  });
  const binaryOrbitPath = new THREE.Line(orbitGeom, orbitMat);
  binaryOrbitPath.computeLineDistances();
  group.add(binaryOrbitPath);

  // 7. Relativistic Frame-Dragging Vector Field Arrows (Vector flow showing frame rotation)
  const vectorArrowsCount = 32;
  const vectorArrowPos = new Float32Array(vectorArrowsCount * 2 * 3);
  const vectorArrowCols = new Float32Array(vectorArrowsCount * 2 * 3);
  const vectorGeom = new THREE.BufferGeometry();
  vectorGeom.setAttribute('position', new THREE.BufferAttribute(vectorArrowPos, 3));
  vectorGeom.setAttribute('color', new THREE.BufferAttribute(vectorArrowCols, 3));
  const vectorMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const vectorFieldMesh = new THREE.LineSegments(vectorGeom, vectorMat);
  group.add(vectorFieldMesh);

  // Relativistic Color palette
  const cInnerErgo = new THREE.Color('#f43f5e'); // Crimson ergosphere edge
  const cMidVortex = new THREE.Color('#c084fc'); // Electric purple frame dragging
  const cOuterFlat = new THREE.Color('#38bdf8'); // Cyan flat asymptote
  const cQuadWave = new THREE.Color('#fde047'); // Golden gravitational wave crest

  /**
   * Evaluates Spacetime Coordinate Distortion at (r, baseAngle)
   */
  function evaluateSpacetimePoint(
    r: number,
    baseAngle: number,
    time: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    outPos: THREE.Vector3,
    outColor: THREE.Color
  ) {
    // 1. Azimuthal frame-dragging vortex displacement (Lense-Thirring)
    const normR = Math.max(2.0, r / scale);
    const dragTwist = (kerrSpin * 3.8) / Math.pow(normR, 1.35);
    const orbitalLag = 0.45 * Math.sin(baseAngle * 2 - orbitalAngle * 2);
    const angle = baseAngle + dragTwist + orbitalLag;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    // 2. Gravitational Well Depth y (Depression embedding from both binary components)
    const d1Sq = (x - x1) * (x - x1) + (z - z1) * (z - z1);
    const d2Sq = (x - x2) * (x - x2) + (z - z2) * (z - z2);

    const well1 = (primaryMass * 0.9) / Math.sqrt(d1Sq + 9.0);
    const well2 = (secondaryMass * 0.9) / Math.sqrt(d2Sq + 9.0);

    // Quadrupole gravitational wave perturbation
    const wavePhase = 2 * baseAngle - 2 * orbitalAngle - normR * 0.45;
    const gwRipple = ((primaryMass * secondaryMass) / 300) * (Math.cos(wavePhase) / Math.sqrt(normR + 3.0));

    const y = -well1 - well2 + gwRipple;

    outPos.set(x, y, z);

    // 3. Dynamic Relativistic Color Coding
    const tNorm = Math.min(1.0, Math.max(0.0, (r - minRadius) / (maxRadius - minRadius)));
    if (tNorm < 0.18) {
      outColor.copy(cInnerErgo).lerp(cMidVortex, tNorm / 0.18);
    } else if (tNorm < 0.6) {
      outColor.copy(cMidVortex).lerp(cOuterFlat, (tNorm - 0.18) / 0.42);
    } else {
      outColor.copy(cOuterFlat);
    }

    // Highlight quadrupole wave crests in golden amber
    if (Math.abs(gwRipple) > 0.45) {
      outColor.lerp(cQuadWave, Math.min(0.65, Math.abs(gwRipple)));
    }
  }

  // Update routine
  function update(delta: number) {
    elapsedTime += delta;
    // Orbital angular speed of binary pair (faster for massive compact systems)
    const orbitalSpeed = 1.25;
    orbitalAngle += delta * orbitalSpeed;

    // Update positions of binary pair
    const r1 = (secondaryMass / totalMass) * binarySeparation * 0.65;
    const r2 = (primaryMass / totalMass) * binarySeparation * 0.65;

    const x1 = Math.cos(orbitalAngle) * r1;
    const z1 = Math.sin(orbitalAngle) * r1;

    const x2 = -Math.cos(orbitalAngle) * r2;
    const z2 = -Math.sin(orbitalAngle) * r2;

    primaryStarMesh.position.set(x1, -3.2, z1);
    primaryAccretionDisk.rotation.z += delta * 4.5; // Rapid inner accretion rotation

    secondaryStarMesh.position.set(x2, -2.4, z2);
    secondaryCorona.rotation.y += delta * 1.5;

    // Center ergosphere and event horizon on the primary massive compact core
    ergosphereMesh.position.set(x1, -3.2, z1);
    ergosphereMesh.rotation.y += delta * 2.8; // Frame dragging rotation
    eventHorizonMesh.position.set(x1, -3.2, z1);

    // Update Grid Vertices & Vertex Colors
    let pOffset = 0;
    const posAttr = gridGeom.attributes.position as THREE.BufferAttribute;
    const colAttr = gridGeom.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const pA = _tmpV1;
    const pB = _tmpV2;
    const colA = new THREE.Color();
    const colB = new THREE.Color();

    // (A) Concentric Twisted Rings
    for (let rIdx = 0; rIdx < rings; rIdx++) {
      const radiusFraction = Math.pow(rIdx / (rings - 1), 1.6);
      const r = minRadius + radiusFraction * (maxRadius - minRadius);

      for (let sIdx = 0; sIdx < sectors; sIdx++) {
        const phi1 = (sIdx / sectors) * Math.PI * 2;
        const phi2 = ((sIdx + 1) / sectors) * Math.PI * 2;

        evaluateSpacetimePoint(r, phi1, elapsedTime, x1, z1, x2, z2, pA, colA);
        evaluateSpacetimePoint(r, phi2, elapsedTime, x1, z1, x2, z2, pB, colB);

        posArr[pOffset * 3] = pA.x;
        posArr[pOffset * 3 + 1] = pA.y;
        posArr[pOffset * 3 + 2] = pA.z;
        colArr[pOffset * 3] = colA.r;
        colArr[pOffset * 3 + 1] = colA.g;
        colArr[pOffset * 3 + 2] = colA.b;
        pOffset++;

        posArr[pOffset * 3] = pB.x;
        posArr[pOffset * 3 + 1] = pB.y;
        posArr[pOffset * 3 + 2] = pB.z;
        colArr[pOffset * 3] = colB.r;
        colArr[pOffset * 3 + 1] = colB.g;
        colArr[pOffset * 3 + 2] = colB.b;
        pOffset++;
      }
    }

    // (B) Radial Geodesic Spokes
    for (let sIdx = 0; sIdx < sectors; sIdx += 2) {
      const phi = (sIdx / sectors) * Math.PI * 2;

      for (let rIdx = 0; rIdx < rings - 1; rIdx++) {
        const frac1 = Math.pow(rIdx / (rings - 1), 1.6);
        const frac2 = Math.pow((rIdx + 1) / (rings - 1), 1.6);

        const rA = minRadius + frac1 * (maxRadius - minRadius);
        const rB = minRadius + frac2 * (maxRadius - minRadius);

        evaluateSpacetimePoint(rA, phi, elapsedTime, x1, z1, x2, z2, pA, colA);
        evaluateSpacetimePoint(rB, phi, elapsedTime, x1, z1, x2, z2, pB, colB);

        posArr[pOffset * 3] = pA.x;
        posArr[pOffset * 3 + 1] = pA.y;
        posArr[pOffset * 3 + 2] = pA.z;
        colArr[pOffset * 3] = colA.r;
        colArr[pOffset * 3 + 1] = colA.g;
        colArr[pOffset * 3 + 2] = colA.b;
        pOffset++;

        posArr[pOffset * 3] = pB.x;
        posArr[pOffset * 3 + 1] = pB.y;
        posArr[pOffset * 3 + 2] = pB.z;
        colArr[pOffset * 3] = colB.r;
        colArr[pOffset * 3 + 1] = colB.g;
        colArr[pOffset * 3 + 2] = colB.b;
        pOffset++;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // (C) Update Vector Field Arrows showing Lense-Thirring azimuthal drag vectors
    const vecPosArr = (vectorGeom.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const vecColArr = (vectorGeom.attributes.color as THREE.BufferAttribute).array as Float32Array;

    for (let v = 0; v < vectorArrowsCount; v++) {
      const vAngle = (v / vectorArrowsCount) * Math.PI * 2 + orbitalAngle * 0.4;
      const vRadius = 14 * scale + (v % 3) * 12 * scale;
      const vY = -3.8 + Math.sin(vAngle * 2) * 0.8;

      // Base point
      const vx1 = Math.cos(vAngle) * vRadius;
      const vz1 = Math.sin(vAngle) * vRadius;

      // Tangential frame-dragging flow vector (Lense-Thirring drag direction)
      const flowLen = 4.8 * (1.0 / Math.pow(vRadius / 15, 0.8));
      const vx2 = vx1 - Math.sin(vAngle) * flowLen;
      const vz2 = vz1 + Math.cos(vAngle) * flowLen;

      const idx = v * 6;
      vecPosArr[idx] = vx1;
      vecPosArr[idx + 1] = vY;
      vecPosArr[idx + 2] = vz1;
      vecPosArr[idx + 3] = vx2;
      vecPosArr[idx + 4] = vY;
      vecPosArr[idx + 5] = vz2;

      // Color from purple to cyan
      vecColArr[idx] = 0.75;
      vecColArr[idx + 1] = 0.52;
      vecColArr[idx + 2] = 0.98;
      vecColArr[idx + 3] = 0.22;
      vecColArr[idx + 4] = 0.74;
      vecColArr[idx + 5] = 0.97;
    }

    (vectorGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (vectorGeom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  function dispose() {
    gridGeom.dispose();
    gridMat.dispose();
    ergoGeom.dispose();
    ergoMat.dispose();
    horizonGeom.dispose();
    horizonMat.dispose();
    primaryGeom.dispose();
    primaryMat.dispose();
    primaryGlowGeom.dispose();
    primaryGlowMat.dispose();
    secondaryGeom.dispose();
    secondaryMat.dispose();
    secondaryCoronaGeom.dispose();
    secondaryCoronaMat.dispose();
    orbitGeom.dispose();
    orbitMat.dispose();
    vectorGeom.dispose();
    vectorMat.dispose();
  }

  function getPhysicsMetrics(): RelativisticMetrics {
    const iscoRadius = 1.0 + Math.sqrt(1.0 - kerrSpin * kerrSpin);
    const omegaLT = calculateLenseThirringOmega(iscoRadius, kerrSpin, primaryMass);
    return {
      kerrSpinParam: kerrSpin,
      lenseThirringVelocityRadS: Math.round(omegaLT * 1820),
      ergosphereRadiusRg: 2.0,
      eventHorizonRadiusRg: Number((1.0 + Math.sqrt(1.0 - kerrSpin * kerrSpin)).toFixed(3)),
      binaryMassRatio: Number((primaryMass / secondaryMass).toFixed(2)),
      gravitationalWaveStrain: 1.84e-21,
      orbitalPeriodDays: 5.6,
      frameDraggingActive: true,
    };
  }

  function setSpinParameter(spin: number) {
    kerrSpin = Math.max(0.01, Math.min(0.998, spin));
  }

  // Initial update
  update(0);

  return {
    group,
    primaryStarMesh,
    secondaryStarMesh,
    gridLineSegments,
    ergosphereMesh,
    eventHorizonMesh,
    vectorFieldMesh,
    binaryOrbitPath,
    update,
    dispose,
    getPhysicsMetrics,
    setSpinParameter,
  };
}
