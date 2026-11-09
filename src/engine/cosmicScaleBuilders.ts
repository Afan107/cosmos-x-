/**
 * Cosmic Scale Builders for COSMOS-X (6-Level "Powers of Ten" Engine)
 * Levels:
 * 1. SURFACE_ATMOSPHERE: Surface & Atmosphere View (clouds, oceans/terrain, atmospheric scattering, orbital megastructures)
 * 2. PLANETARY_ORRERY: Star system with Keplerian multi-planet orbits, habitable zone Goldilocks ring
 * 3. LOCAL_SPHERE: Local Stellar Neighborhood (2,600-node Fibonacci sphere)
 * 4. SPIRAL_GALAXY: Milky Way & LMC 4-arm logarithmic spiral
 * 5. LOCAL_GROUP: Intergalactic bridges (Milky Way, Andromeda M31, Triangulum M33, Magellanic Clouds)
 * 6. LANIAKEA_WEB: 500 Million Light-Year Deep Space Cosmic Web (Boötes Void, Great Attractor, 12,000+ cluster neurons)
 */

import * as THREE from 'three';
import { CatalogTarget } from '../data/astronomicalCatalog';

export interface SurfaceAtmosphereRig {
  group: THREE.Group;
  planetMesh: THREE.Mesh;
  cloudMesh: THREE.Mesh;
  atmosphereGlow: THREE.Mesh;
  megastructureRing?: THREE.Group;
  update: (delta: number) => void;
  dispose: () => void;
}

export interface OrreryPlanet {
  name: string;
  radius: number;
  orbitRadius: number;
  periodDays: number;
  color: string;
  isHabitable: boolean;
  hasRings?: boolean;
  mesh: THREE.Mesh;
  pivot: THREE.Group;
}

export interface PlanetaryOrreryRig {
  group: THREE.Group;
  starMesh: THREE.Mesh;
  habitableZoneRing: THREE.Mesh;
  planets: OrreryPlanet[];
  update: (delta: number, speedMultiplier?: number) => void;
  dispose: () => void;
}

export interface LocalGroupGalaxy {
  id: string;
  name: string;
  designation: string;
  coords: [number, number, number];
  morphology: string;
  stellarMassMsun: string;
  distanceKpc: number;
  radialVelocityKmS: number;
  darkMatterFraction: number;
  overview: string;
  color: string;
  radius: number;
}

export interface LocalGroupRig {
  group: THREE.Group;
  galaxiesPoints: THREE.Points;
  filaments: THREE.LineSegments;
  satelliteGalaxies: LocalGroupGalaxy[];
  satelliteMeshes: THREE.Mesh[];
  update: (delta: number) => void;
  dispose: () => void;
}

export interface LaniakeaWebRig {
  group: THREE.Group;
  clusterPoints: THREE.Points;
  filamentLines: THREE.LineSegments;
  voidBoundary: THREE.Mesh;
  greatAttractorWell: THREE.Mesh;
  update: (delta: number) => void;
  dispose: () => void;
}

/**
 * 1. Build Surface & Atmosphere View Rig
 */
export function buildSurfaceAtmosphereRig(target?: CatalogTarget | null): SurfaceAtmosphereRig {
  const group = new THREE.Group();
  group.name = 'SURFACE_ATMOSPHERE_RIG';

  const isDyson = Boolean(target?.isDysonCandidate);
  const isHabitable = Boolean(target?.isHabitableCandidate);

  // Surface Sphere (Radius 16)
  const planetGeom = new THREE.SphereGeometry(16, 48, 48);
  const baseColor = isDyson
    ? '#f59e0b' // Amber/Gold mineral plains
    : isHabitable
    ? '#0284c7' // Azure ocean world with continents
    : target?.spectralType.startsWith('M')
    ? '#dc2626' // Basaltic red dwarf world
    : '#eab308'; // Jovian gas cloud

  const planetMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.65,
    metalness: isDyson ? 0.45 : 0.15,
  });
  const planetMesh = new THREE.Mesh(planetGeom, planetMat);
  group.add(planetMesh);

  // Continental/Topographical Layer Details (Secondary Overlay)
  const landGeom = new THREE.SphereGeometry(16.08, 36, 36);
  const landMat = new THREE.MeshStandardMaterial({
    color: isHabitable ? '#15803d' : isDyson ? '#b45309' : '#991b1b',
    roughness: 0.8,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const landMesh = new THREE.Mesh(landGeom, landMat);
  planetMesh.add(landMesh);

  // Dynamic Atmospheric Cloud Sphere (Radius 16.5)
  const cloudGeom = new THREE.SphereGeometry(16.5, 36, 36);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.4,
    roughness: 0.3,
  });
  const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
  group.add(cloudMesh);

  // Inverted Fresnel Atmospheric Aura Glow Ring
  const atmoGeom = new THREE.SphereGeometry(17.8, 32, 32);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: isDyson ? '#fbbf24' : '#38bdf8',
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
  });
  const atmosphereGlow = new THREE.Mesh(atmoGeom, atmoMat);
  group.add(atmosphereGlow);

  // Optional: Alien Megastructure Swarm & Orbital Space Tether Rings
  let megastructureRing: THREE.Group | undefined;
  if (isDyson) {
    megastructureRing = new THREE.Group();
    const ringCount = 36;
    const panelGeom = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    const panelMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.85,
      roughness: 0.15,
    });

    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const r = 24.0;
      const panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(Math.cos(angle) * r, Math.sin(i * 1.5) * 2.5, Math.sin(angle) * r);
      panel.lookAt(0, 0, 0);
      megastructureRing.add(panel);
    }

    // Concentric Equatorial Tether Ring
    const tetherGeom = new THREE.TorusGeometry(24.0, 0.15, 12, 64);
    const tetherMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.6,
    });
    const tetherRing = new THREE.Mesh(tetherGeom, tetherMat);
    tetherRing.rotation.x = Math.PI / 2;
    megastructureRing.add(tetherRing);

    group.add(megastructureRing);
  }

  return {
    group,
    planetMesh,
    cloudMesh,
    atmosphereGlow,
    megastructureRing,
    update: (delta: number) => {
      planetMesh.rotation.y += delta * 0.08;
      cloudMesh.rotation.y += delta * 0.12;
      cloudMesh.rotation.x += delta * 0.02;
      if (megastructureRing) {
        megastructureRing.rotation.y -= delta * 0.06;
      }
    },
    dispose: () => {
      planetGeom.dispose();
      planetMat.dispose();
      landGeom.dispose();
      landMat.dispose();
      cloudGeom.dispose();
      cloudMat.dispose();
      atmoGeom.dispose();
      atmoMat.dispose();
    },
  };
}

/**
 * 2. Build Planetary System Orrery View Rig (Multi-Planet Real-Time Keplerian Orbits)
 */
export function buildPlanetaryOrreryRig(target?: CatalogTarget | null): PlanetaryOrreryRig {
  const group = new THREE.Group();
  group.name = 'PLANETARY_ORRERY_RIG';

  // Central Host Star (Radius 5.5)
  const starGeom = new THREE.SphereGeometry(5.5, 32, 32);
  const isDwarf = target?.spectralType.startsWith('M');
  const starColor = isDwarf ? '#f87171' : target?.spectralType.startsWith('G') ? '#fde047' : '#e0f2fe';
  const starMat = new THREE.MeshBasicMaterial({ color: starColor });
  const starMesh = new THREE.Mesh(starGeom, starMat);
  group.add(starMesh);

  // Stellar Corona Glow
  const coronaGeom = new THREE.SphereGeometry(6.4, 24, 24);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: starColor,
    transparent: true,
    opacity: 0.3,
    wireframe: true,
  });
  const corona = new THREE.Mesh(coronaGeom, coronaMat);
  group.add(corona);

  // Habitable Zone Green Goldilocks Torus (Kopparapu boundary, radius 26 to 42)
  const hzInner = 26;
  const hzOuter = 44;
  const hzGeom = new THREE.RingGeometry(hzInner, hzOuter, 64);
  const hzMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.18,
  });
  const habitableZoneRing = new THREE.Mesh(hzGeom, hzMat);
  habitableZoneRing.rotation.x = Math.PI / 2;
  group.add(habitableZoneRing);

  // Habitable Zone Outer Border Ring
  const hzBorderGeom = new THREE.RingGeometry(hzOuter - 0.2, hzOuter, 64);
  const hzBorderMat = new THREE.MeshBasicMaterial({
    color: '#34d399',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
  });
  const hzBorder = new THREE.Mesh(hzBorderGeom, hzBorderMat);
  hzBorder.rotation.x = Math.PI / 2;
  group.add(hzBorder);

  // Planets Definition (Modeled after multi-planet candidate systems like TRAPPIST-1 / Kepler)
  const planetConfigs = [
    { name: 'Planet b (Rocky Inner)', r: 1.1, dist: 12, period: 1.51, color: '#f87171', hz: false },
    { name: 'Planet c (Warm Sub-Earth)', r: 1.25, dist: 17, period: 2.42, color: '#fb923c', hz: false },
    { name: 'Planet d (Inner Edge)', r: 1.15, dist: 23, period: 4.05, color: '#fde047', hz: false },
    { name: 'Planet e (Habitable Zone Goldilocks)', r: 1.45, dist: 31, period: 6.1, color: '#38bdf8', hz: true },
    { name: 'Planet f (Ocean Super-Earth)', r: 1.35, dist: 38, period: 9.21, color: '#22d3ee', hz: true },
    { name: 'Planet g (Outer Terrestrial)', r: 1.3, dist: 46, period: 12.35, color: '#a855f7', hz: false },
    { name: 'Planet h (Frozen Sub-Neptune)', r: 2.2, dist: 58, period: 20.0, color: '#818cf8', hz: false, rings: true },
  ];

  const planets: OrreryPlanet[] = [];

  planetConfigs.forEach((cfg) => {
    // Orbital Path Wire Ring
    const pathGeom = new THREE.RingGeometry(cfg.dist - 0.12, cfg.dist + 0.12, 64);
    const pathMat = new THREE.MeshBasicMaterial({
      color: cfg.hz ? '#10b981' : '#6b21a8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: cfg.hz ? 0.45 : 0.25,
    });
    const pathRing = new THREE.Mesh(pathGeom, pathMat);
    pathRing.rotation.x = Math.PI / 2;
    group.add(pathRing);

    // Planet Orbit Pivot
    const pivot = new THREE.Group();
    group.add(pivot);

    // Planet Mesh
    const pGeom = new THREE.SphereGeometry(cfg.r, 20, 20);
    const pMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.5,
      metalness: 0.2,
    });
    const pMesh = new THREE.Mesh(pGeom, pMat);
    pMesh.position.set(cfg.dist, 0, 0);

    // Optional Rings (e.g. outer gas giant)
    if (cfg.rings) {
      const ringGeom = new THREE.RingGeometry(cfg.r * 1.5, cfg.r * 2.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#c084fc',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      pMesh.add(ringMesh);
    }

    pivot.add(pMesh);

    planets.push({
      name: cfg.name,
      radius: cfg.r,
      orbitRadius: cfg.dist,
      periodDays: cfg.period,
      color: cfg.color,
      isHabitable: cfg.hz,
      hasRings: cfg.rings,
      mesh: pMesh,
      pivot,
    });
  });

  return {
    group,
    starMesh,
    habitableZoneRing,
    planets,
    update: (delta: number, speedMultiplier = 1) => {
      corona.rotation.y += delta * 0.05;
      planets.forEach((p) => {
        // Keplerian angular velocity omega = 2*pi / T
        const omega = (2 * Math.PI) / (p.periodDays * 4.0);
        p.pivot.rotation.y += omega * delta * speedMultiplier;
        p.mesh.rotation.y += delta * 0.5;
      });
    },
    dispose: () => {
      starGeom.dispose();
      starMat.dispose();
      coronaGeom.dispose();
      coronaMat.dispose();
      hzGeom.dispose();
      hzMat.dispose();
    },
  };
}

/**
 * 5. Build Local Group & Intergalactic Bridges Rig
 */
export function buildLocalGroupRig(): LocalGroupRig {
  const group = new THREE.Group();
  group.name = 'LOCAL_GROUP_RIG';

  const TOTAL_LOCAL_GROUP_STARS = 11000;
  const positions = new Float32Array(TOTAL_LOCAL_GROUP_STARS * 3);
  const colors = new Float32Array(TOTAL_LOCAL_GROUP_STARS * 3);

  let pIdx = 0;

  // 1. Milky Way Galaxy (Center at 0, 0, 0, ~3,500 particles)
  for (let i = 0; i < 3500; i++) {
    const r = Math.pow(Math.random(), 0.8) * 55;
    const angle = i * 0.12 + Math.log(Math.max(1, r / 8)) * 2.2;
    const scatter = (Math.random() - 0.5) * 6;
    const x = Math.cos(angle) * r + scatter;
    const y = (Math.random() - 0.5) * 4;
    const z = Math.sin(angle) * r + scatter;

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    colors[pIdx * 3] = 0.75;
    colors[pIdx * 3 + 1] = 0.52;
    colors[pIdx * 3 + 2] = 0.98; // Violet / Purple
    pIdx++;
  }

  // 2. Andromeda Galaxy M31 (Offset at 220, 45, -140, ~4,500 particles, tilted 35 deg)
  const m31Center = [220, 45, -140];
  for (let i = 0; i < 4500; i++) {
    const r = Math.pow(Math.random(), 0.8) * 75;
    const angle = i * 0.09 + Math.log(Math.max(1, r / 10)) * 2.5;
    const scatter = (Math.random() - 0.5) * 8;
    const localX = Math.cos(angle) * r + scatter;
    const localY = (Math.random() - 0.5) * 5;
    const localZ = Math.sin(angle) * r + scatter;

    // Tilt transformation
    const tilt = 0.55;
    const x = m31Center[0] + localX;
    const y = m31Center[1] + localY * Math.cos(tilt) - localZ * Math.sin(tilt);
    const z = m31Center[2] + localY * Math.sin(tilt) + localZ * Math.cos(tilt);

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    colors[pIdx * 3] = 0.22;
    colors[pIdx * 3 + 1] = 0.82;
    colors[pIdx * 3 + 2] = 0.98; // Cyan / Azure
    pIdx++;
  }

  // 3. Triangulum Galaxy M33 (Offset at -150, -35, 110, ~2,000 particles)
  const m33Center = [-150, -35, 110];
  for (let i = 0; i < 2000; i++) {
    const r = Math.pow(Math.random(), 0.8) * 36;
    const angle = i * 0.14 + Math.log(Math.max(1, r / 6)) * 2.1;
    const scatter = (Math.random() - 0.5) * 4;
    const x = m33Center[0] + Math.cos(angle) * r + scatter;
    const y = m33Center[1] + (Math.random() - 0.5) * 4;
    const z = m33Center[2] + Math.sin(angle) * r + scatter;

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    colors[pIdx * 3] = 0.98;
    colors[pIdx * 3 + 1] = 0.74;
    colors[pIdx * 3 + 2] = 0.22; // Amber
    pIdx++;
  }

  // 4. Large & Small Magellanic Clouds (Remaining ~1,000 particles)
  const lmcCenter = [45, -25, 35];
  while (pIdx < TOTAL_LOCAL_GROUP_STARS) {
    const r = Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    positions[pIdx * 3] = lmcCenter[0] + Math.cos(theta) * r;
    positions[pIdx * 3 + 1] = lmcCenter[1] + (Math.random() - 0.5) * 6;
    positions[pIdx * 3 + 2] = lmcCenter[2] + Math.sin(theta) * r;

    colors[pIdx * 3] = 0.95;
    colors[pIdx * 3 + 1] = 0.92;
    colors[pIdx * 3 + 2] = 0.65;
    pIdx++;
  }

  const galGeom = new THREE.BufferGeometry();
  galGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const galMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const galaxiesPoints = new THREE.Points(galGeom, galMat);
  group.add(galaxiesPoints);

  // Dark Matter Intergalactic Bridges (Connecting Milky Way <-> Andromeda <-> Triangulum)
  const bridgePositions: number[] = [];
  const addBridgeSegment = (start: number[], end: number[], samples = 64) => {
    for (let s = 0; s < samples; s++) {
      const t1 = s / samples;
      const t2 = (s + 1) / samples;
      const arcHeight1 = Math.sin(t1 * Math.PI) * 22;
      const arcHeight2 = Math.sin(t2 * Math.PI) * 22;

      bridgePositions.push(
        start[0] + (end[0] - start[0]) * t1,
        start[1] + (end[1] - start[1]) * t1 + arcHeight1,
        start[2] + (end[2] - start[2]) * t1
      );
      bridgePositions.push(
        start[0] + (end[0] - start[0]) * t2,
        start[1] + (end[1] - start[1]) * t2 + arcHeight2,
        start[2] + (end[2] - start[2]) * t2
      );
    }
  };

  addBridgeSegment([0, 0, 0], m31Center);
  addBridgeSegment([0, 0, 0], m33Center);
  addBridgeSegment(m31Center, m33Center);
  addBridgeSegment([0, 0, 0], lmcCenter);

  const bridgeGeom = new THREE.BufferGeometry();
  bridgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(bridgePositions, 3));
  const bridgeMat = new THREE.LineBasicMaterial({
    color: '#8b5cf6',
    transparent: true,
    opacity: 0.35,
  });
  const filaments = new THREE.LineSegments(bridgeGeom, bridgeMat);
  group.add(filaments);

  return {
    group,
    galaxiesPoints,
    filaments,
    update: (delta: number) => {
      galaxiesPoints.rotation.y += delta * 0.012;
      filaments.rotation.y += delta * 0.008;
    },
    dispose: () => {
      galGeom.dispose();
      galMat.dispose();
      bridgeGeom.dispose();
      bridgeMat.dispose();
    },
  };
}

/**
 * 6. Build Laniakea Supercluster & Cosmic Web Rig (500 Mly Scale)
 */
export function buildLaniakeaSuperclusterRig(): LaniakeaWebRig {
  const group = new THREE.Group();
  group.name = 'LANIAKEA_WEB_RIG';

  // 12,000+ Galaxy Cluster Nodes
  const CLUSTER_COUNT = 13500;
  const positions = new Float32Array(CLUSTER_COUNT * 3);
  const colors = new Float32Array(CLUSTER_COUNT * 3);

  // Great Attractor Coordinate Core: (140, -45, -90)
  const ga = [140, -45, -90];
  // Boötes Void: (-160, 85, 120) with radius 75
  const voidCenter = [-160, 85, 120];
  const voidRadius = 75;

  let cIdx = 0;
  while (cIdx < CLUSTER_COUNT) {
    // Generate cluster in web-like filaments using trigonometric harmonics
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI - Math.PI / 2;
    const dist = 50 + Math.pow(Math.random(), 0.75) * 320;

    let x = dist * Math.cos(v) * Math.cos(u);
    let y = dist * Math.sin(v) * 0.55;
    let z = dist * Math.cos(v) * Math.sin(u);

    // Filamentary clustering perturbation
    const filamentWarp = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 28;
    x += filamentWarp;
    z += filamentWarp;

    // Check if inside Boötes Void: repel/expel outward to create void emptiness
    const dX = x - voidCenter[0];
    const dY = y - voidCenter[1];
    const dZ = z - voidCenter[2];
    const dVoid = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

    if (dVoid < voidRadius) {
      // Push to void boundary wall
      const pushFactor = voidRadius / (dVoid + 0.1);
      x = voidCenter[0] + dX * pushFactor;
      y = voidCenter[1] + dY * pushFactor;
      z = voidCenter[2] + dZ * pushFactor;
    }

    positions[cIdx * 3] = x;
    positions[cIdx * 3 + 1] = y;
    positions[cIdx * 3 + 2] = z;

    // Color gradient: Golden near Great Attractor, electric violet along filaments, cyan in cluster nodes
    const dGa = Math.sqrt((x - ga[0]) ** 2 + (y - ga[1]) ** 2 + (z - ga[2]) ** 2);
    if (dGa < 80) {
      colors[cIdx * 3] = 0.98;
      colors[cIdx * 3 + 1] = 0.82;
      colors[cIdx * 3 + 2] = 0.28; // Golden Great Attractor
    } else {
      colors[cIdx * 3] = 0.65;
      colors[cIdx * 3 + 1] = 0.35;
      colors[cIdx * 3 + 2] = 0.95; // Electric Violet Cosmic Web
    }

    cIdx++;
  }

  const clusterGeom = new THREE.BufferGeometry();
  clusterGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  clusterGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const clusterMat = new THREE.PointsMaterial({
    size: 2.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const clusterPoints = new THREE.Points(clusterGeom, clusterMat);
  group.add(clusterPoints);

  // Neural Filament Bridges connecting random neighboring cluster nodes
  const filamentLinesPos: number[] = [];
  for (let i = 0; i < 900; i++) {
    const idxA = Math.floor(Math.random() * (CLUSTER_COUNT - 1));
    const idxB = Math.floor(Math.random() * (CLUSTER_COUNT - 1));
    const pAx = positions[idxA * 3];
    const pAy = positions[idxA * 3 + 1];
    const pAz = positions[idxA * 3 + 2];
    const pBx = positions[idxB * 3];
    const pBy = positions[idxB * 3 + 1];
    const pBz = positions[idxB * 3 + 2];

    const dist = Math.sqrt((pAx - pBx) ** 2 + (pAy - pBy) ** 2 + (pAz - pBz) ** 2);
    if (dist < 65 && dist > 10) {
      filamentLinesPos.push(pAx, pAy, pAz);
      filamentLinesPos.push(pBx, pBy, pBz);
    }
  }

  const filamentGeom = new THREE.BufferGeometry();
  filamentGeom.setAttribute('position', new THREE.Float32BufferAttribute(filamentLinesPos, 3));
  const filamentMat = new THREE.LineBasicMaterial({
    color: '#a855f7',
    transparent: true,
    opacity: 0.28,
  });
  const filamentLines = new THREE.LineSegments(filamentGeom, filamentMat);
  group.add(filamentLines);

  // Boötes Void Wireframe Cage Marker
  const voidGeom = new THREE.SphereGeometry(voidRadius, 24, 16);
  const voidMat = new THREE.MeshBasicMaterial({
    color: '#6b21a8',
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const voidBoundary = new THREE.Mesh(voidGeom, voidMat);
  voidBoundary.position.set(voidCenter[0], voidCenter[1], voidCenter[2]);
  group.add(voidBoundary);

  // Great Attractor Gravity Well Glow Ring
  const gaGeom = new THREE.SphereGeometry(32, 24, 24);
  const gaMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.35,
    wireframe: true,
  });
  const greatAttractorWell = new THREE.Mesh(gaGeom, gaMat);
  greatAttractorWell.position.set(ga[0], ga[1], ga[2]);
  group.add(greatAttractorWell);

  return {
    group,
    clusterPoints,
    filamentLines,
    voidBoundary,
    greatAttractorWell,
    update: (delta: number) => {
      clusterPoints.rotation.y += delta * 0.005;
      filamentLines.rotation.y += delta * 0.005;
      voidBoundary.rotation.y -= delta * 0.008;
      greatAttractorWell.rotation.y += delta * 0.02;
    },
    dispose: () => {
      clusterGeom.dispose();
      clusterMat.dispose();
      filamentGeom.dispose();
      filamentMat.dispose();
      voidGeom.dispose();
      voidMat.dispose();
      gaGeom.dispose();
      gaMat.dispose();
    },
  };
}
