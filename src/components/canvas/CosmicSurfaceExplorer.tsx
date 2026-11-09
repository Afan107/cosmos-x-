import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Globe,
  Satellite,
  Compass,
  Eye,
  Sliders,
  Sun,
  Moon,
  Wind,
  Gauge,
  Thermometer,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  Layers,
  Radio,
  Zap,
  Flame,
  Search,
  Rocket,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Crosshair,
  Navigation,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Video,
} from 'lucide-react';
import { CatalogTarget, CATALOG_STARS, CATALOG_ANOMALIES } from '../../data/astronomicalCatalog';
import { soundFX } from '../ui/AudioFeedback';
import { hiddenOps, LiveAstrophysicsState } from '../../engine/hiddenOpsBots';
import {
  RoverPhysicsState,
  VehicleInputs,
  AtmosphericEntryState,
  calculateAtmosphericEntryStep,
  stepVehiclePhysics,
  calculateAtmosphericScattering,
  getProceduralTerrainHeight,
} from '../../engine/roverPhysicsEngine';

export type CameraPerspective = 'SURFACE_VIEW' | 'LOW_ORBIT' | 'MEGASTRUCTURE_INSPECTOR';
export type PilotPerspective = 'CHASE_CAM' | 'COCKPIT_VIEW' | 'FREE_ORBIT';

// Curated destinations for quick jump chips, while Universal Search handles literally ANY body
export const EXPEDITION_DISCOVERY_CHIPS = [
  { id: 'HATS-72 b', label: '🪐 HATS-72 b (Gas Giant)', type: 'GAS_GIANT' },
  { id: 'WASP-103 b', label: '🔥 WASP-103 b (Lava Egg)', type: 'LAVA_WORLD' },
  { id: 'Kepler-452 b', label: '🌍 Kepler-452 b (Habitable)', type: 'TEMPERATE_OCEAN' },
  { id: 'TRAPPIST-1 e', label: '🌊 TRAPPIST-1 e (Crimson Ocean)', type: 'TEMPERATE_OCEAN' },
  { id: 'Jupiter Deck', label: '🌀 Jupiter Red Spot (No Ground)', type: 'GAS_GIANT' },
  { id: 'TIC-25155310', label: '🛸 TIC-25155310 (Dyson Ring)', type: 'DYSON_MEGASTRUCTURE' },
  { id: 'Sagittarius A*', label: '🕳️ Sagittarius A* (Kerr Black Hole)', type: 'BLACK_HOLE' },
  { id: "'Oumuamua", label: '☄️ 1I/2017 U1 (Interstellar Asteroid)', type: 'ASTEROID' },
];

interface CosmicSurfaceExplorerProps {
  initialTargetName?: string;
  selectedTarget?: CatalogTarget | null;
  onSelectTarget?: (target: CatalogTarget) => void;
  onExitSurfaceView?: () => void;
}

export default function CosmicSurfaceExplorer({
  initialTargetName = 'Kepler-452 b',
  selectedTarget,
  onSelectTarget,
  onExitSurfaceView,
}: CosmicSurfaceExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Search & Target states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTargetName, setActiveTargetName] = useState<string>(() => {
    return selectedTarget?.name || initialTargetName;
  });

  // 4D Deep-Time Chrono-Engine state (-4.5 Gyr Proto-planetary -> 0.0 Gyr Present -> +5.0 Gyr Red Giant/Remnant)
  const [chronoGyr, setChronoGyr] = useState<number>(0.0);

  // Relativistic Doppler & Gravitational Lensing Flight Mode (0.00c to 0.95c)
  const [relativisticBeta, setRelativisticBeta] = useState<number>(0.0);

  // Camera & Environment controls
  const [cameraMode, setCameraMode] = useState<CameraPerspective>('SURFACE_VIEW');
  const [altitudeKm, setAltitudeKm] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // 0h to 24h
  const [scanLinesEnabled, setScanLinesEnabled] = useState(true);

  // Pilot & Rover/Drone state
  const [isPilotMode, setIsPilotMode] = useState<boolean>(false);
  const [pilotCamMode, setPilotCamMode] = useState<PilotPerspective>('CHASE_CAM');
  const [isDroneMode, setIsDroneMode] = useState<boolean>(false);
  const [isEntryActive, setIsEntryActive] = useState<boolean>(false);
  const [entryProgress, setEntryProgress] = useState<AtmosphericEntryState>({
    stage: 'ORBIT',
    altitudeKm: 120,
    velocityKms: 7.8,
    dynamicPressureKPa: 0,
    heatShieldTempK: 290,
    plasmaGlowIntensity: 0,
    plasmaGlowColor: '#f97316',
    progressPct: 0,
    hudStatus: 'ORBITAL PATROL',
  });

  // Rover Live Telemetry for HUD
  const [roverTelemetry, setRoverTelemetry] = useState<{
    speedKmh: number;
    speedMs: number;
    altitudeM: number;
    pitchDeg: number;
    rollDeg: number;
    headingDeg: number;
    gForce: number;
    isGrounded: boolean;
  }>({
    speedKmh: 0,
    speedMs: 0,
    altitudeM: 0,
    pitchDeg: 0,
    rollDeg: 0,
    headingDeg: 0,
    gForce: 1.0,
    isGrounded: true,
  });

  // Keys ref for 60Hz physics step
  const keysRef = useRef<VehicleInputs>({
    forward: false,
    backward: false,
    steerLeft: false,
    steerRight: false,
    jumpBoost: false,
    descend: false,
  });

  // Rover physics internal state
  const roverStateRef = useRef<RoverPhysicsState>({
    position: { x: 0, y: 3.0, z: 0 },
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
  });

  // Entry simulation internal state
  const entryStateRef = useRef<AtmosphericEntryState>({
    stage: 'ORBIT',
    altitudeKm: 120,
    velocityKms: 7.8,
    dynamicPressureKPa: 0,
    heatShieldTempK: 290,
    plasmaGlowIntensity: 0,
    plasmaGlowColor: '#f97316',
    progressPct: 0,
    hudStatus: 'ORBITAL PATROL',
  });

  // Synchronize when parent passes a new selectedTarget
  useEffect(() => {
    if (selectedTarget && selectedTarget.name) {
      setActiveTargetName(selectedTarget.name);
    }
  }, [selectedTarget]);

  // Compute live astrophysics and shader parameters via Hidden Bot #2 (LiveAstrophysicsRenderBot)
  const physicsState: LiveAstrophysicsState = useMemo(() => {
    const rawTarget =
      selectedTarget && selectedTarget.name === activeTargetName
        ? {
            ...selectedTarget,
            name: activeTargetName,
            pl_name: activeTargetName,
          }
        : {
            name: activeTargetName,
            pl_name: activeTargetName,
            id: activeTargetName,
          };

    const baseState = hiddenOps.synthesizeAstrophysics(rawTarget as any);

    // Apply 4D Deep-Time Chrono-Evolution modifications:
    if (chronoGyr < -3.0) {
      return {
        ...baseState,
        phaseState: 'VOLCANIC_MAGMA',
        equilibriumTempK: baseState.equilibriumTempK + 800,
        hasLiquidWater: false,
        surfacePressureAtm: baseState.surfacePressureAtm * 3.5,
        renderingParams: {
          ...baseState.renderingParams,
          terrainColor: '#050505',
          magmaFissures: true,
          oceanColor: undefined,
          skyHorizonColor: '#ea580c',
          skyZenithColor: '#450a0a',
          description: `[-${Math.abs(chronoGyr).toFixed(1)} Gyr Proto-Planetary Epoch] Accretion bombardment era. Global Hadean magma oceans, volatile outgassing, and continuous meteorite impacts.`,
        },
      };
    } else if (chronoGyr > 3.0) {
      return {
        ...baseState,
        phaseState: baseState.targetCategory === 'GAS_GIANT' ? 'GASEOUS_SUPERCRITICAL' : 'SOLID_CRUST',
        equilibriumTempK: baseState.equilibriumTempK + 650,
        hasLiquidWater: false,
        renderingParams: {
          ...baseState.renderingParams,
          terrainColor: '#78350f',
          oceanColor: undefined,
          skyHorizonColor: '#f97316',
          skyZenithColor: '#7c2d12',
          description: `[+${chronoGyr.toFixed(1)} Gyr Red Giant Era] Stellar luminosity increased by +180%. Runaway greenhouse boiling has desiccated all planetary oceans into ionized vapor.`,
        },
      };
    }

    return baseState;
  }, [activeTargetName, selectedTarget, chronoGyr]);

  // Determine if world lacks solid ground (Gas Giants & Sub-Neptunes automatically drone mode)
  useEffect(() => {
    if (!physicsState.hasSolidSurface) {
      setIsDroneMode(true);
      roverStateRef.current.vehicleMode = 'AERO_DRONE';
    }
  }, [physicsState.hasSolidSurface]);

  // Lorentz Factor: γ = 1 / √(1 - β²)
  const lorentzGamma = useMemo(() => {
    if (relativisticBeta <= 0) return 1.0;
    const safeBeta = Math.min(0.95, relativisticBeta);
    return Number((1 / Math.sqrt(1 - safeBeta * safeBeta)).toFixed(3));
  }, [relativisticBeta]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Meshes
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const oceanMeshRef = useRef<THREE.Mesh | null>(null);
  const skyDomeRef = useRef<THREE.Mesh | null>(null);
  const hostStarLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hostStarMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const megastructureGroupRef = useRef<THREE.Group | null>(null);
  const blackHoleGroupRef = useRef<THREE.Group | null>(null);
  const asteroidMeshRef = useRef<THREE.Mesh | null>(null);
  const magmaFissuresGroupRef = useRef<THREE.Group | null>(null);
  const lightningLightRef = useRef<THREE.PointLight | null>(null);

  // Vehicle 3D Model References
  const roverGroupRef = useRef<THREE.Group | null>(null);
  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const thrusterPlumesRef = useRef<THREE.Mesh[]>([]);
  const heatShieldMeshRef = useRef<THREE.Mesh | null>(null);
  const plasmaParticlesRef = useRef<THREE.Points | null>(null);
  const roverHeadlightLeftRef = useRef<THREE.SpotLight | null>(null);
  const roverHeadlightRightRef = useRef<THREE.SpotLight | null>(null);

  // Setup Three.js scene strictly obeying physicsState
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const rendering = physicsState.renderingParams;
    scene.fog = new THREE.FogExp2(new THREE.Color(rendering.skyHorizonColor), rendering.fogDensity);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 9000);
    cameraRef.current = camera;
    camera.position.set(0, 3, 20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 2400;
    controls.target.set(0, 10, -50);

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Host Star directional light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(200, 300, -500);
    scene.add(sunLight);
    hostStarLightRef.current = sunLight;

    // Host Star celestial sphere
    const sunGeom = new THREE.SphereGeometry(38, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: rendering.boilingPlasmaCorona ? 0xffaa22 : 0xffffff,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.copy(sunLight.position);
    scene.add(sunMesh);
    hostStarMeshRef.current = sunMesh;

    // Sky Dome
    const skyGeom = new THREE.SphereGeometry(4000, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(rendering.skyZenithColor),
      side: THREE.BackSide,
    });
    const skyDome = new THREE.Mesh(skyGeom, skyMat);
    scene.add(skyDome);
    skyDomeRef.current = skyDome;

    // (A) GAS GIANTS & SUB-NEPTUNES: ZERO SOLID SURFACE & ZERO WATER
    if (physicsState.targetCategory === 'GAS_GIANT' || physicsState.targetCategory === 'SUB_NEPTUNE') {
      const gasDeckGroup = new THREE.Group();
      for (let layer = 0; layer < 4; layer++) {
        const deckGeom = new THREE.PlaneGeometry(2800, 2800, 40, 40);
        deckGeom.rotateX(-Math.PI / 2);
        const deckMat = new THREE.MeshStandardMaterial({
          color: layer % 2 === 0 ? 0xb45309 : 0x78350f,
          roughness: 0.9,
          metalness: 0.1,
          transparent: true,
          opacity: 0.65 - layer * 0.1,
          depthWrite: false,
        });
        const deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, -layer * 50, 0);
        gasDeckGroup.add(deck);
      }
      scene.add(gasDeckGroup);

      const lightning = new THREE.PointLight(0x38bdf8, 0, 800);
      lightning.position.set(50, 20, -100);
      scene.add(lightning);
      lightningLightRef.current = lightning;
    } else if (physicsState.targetCategory === 'STAR') {
      const photoGeom = new THREE.SphereGeometry(600, 48, 48);
      const photoMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const photoMesh = new THREE.Mesh(photoGeom, photoMat);
      photoMesh.position.set(0, -560, -100);
      scene.add(photoMesh);
    } else if (physicsState.targetCategory === 'BLACK_HOLE') {
      const bhGroup = new THREE.Group();
      const horizonGeom = new THREE.SphereGeometry(80, 48, 48);
      const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const horizon = new THREE.Mesh(horizonGeom, horizonMat);
      horizon.position.set(0, 180, -600);
      bhGroup.add(horizon);

      const diskGeom = new THREE.RingGeometry(95, 320, 64);
      diskGeom.rotateX(-Math.PI / 2.5);
      const diskMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      const disk = new THREE.Mesh(diskGeom, diskMat);
      disk.position.copy(horizon.position);
      bhGroup.add(disk);

      scene.add(bhGroup);
      blackHoleGroupRef.current = bhGroup;
    } else if (physicsState.targetCategory === 'ASTEROID') {
      const astGeom = new THREE.CylinderGeometry(20, 45, 300, 24, 12);
      astGeom.rotateZ(Math.PI / 4);
      const astMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rendering.terrainColor),
        roughness: 0.95,
        flatShading: true,
      });
      const ast = new THREE.Mesh(astGeom, astMat);
      ast.position.set(0, 100, -250);
      scene.add(ast);
      asteroidMeshRef.current = ast;
    } else {
      // Solid planetary bedrock
      const terrainGeom = new THREE.PlaneGeometry(1800, 1800, 90, 90);
      terrainGeom.rotateX(-Math.PI / 2);
      const posAttr = terrainGeom.attributes.position;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        let height =
          Math.sin(x * 0.015) * Math.cos(z * 0.015) * 16 +
          Math.sin(x * 0.04 + z * 0.02) * 6;

        if (rendering.iceSpires) {
          height += Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.08)) * 18;
        }

        if (rendering.magmaFissures) {
          height = Math.max(-4, height + Math.cos(x * 0.03) * 10);
        }

        posAttr.setY(i, physicsState.hasLiquidWater ? Math.max(-2, height) : height);
      }
      terrainGeom.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rendering.terrainColor),
        roughness: rendering.iceSpires ? 0.3 : 0.85,
        metalness: rendering.iceSpires ? 0.7 : 0.1,
        flatShading: true,
      });
      const terrain = new THREE.Mesh(terrainGeom, terrainMat);
      terrain.position.set(0, 0, 0);
      scene.add(terrain);
      terrainMeshRef.current = terrain;

      // Magma Fissures
      if (rendering.magmaFissures) {
        const magmaGroup = new THREE.Group();
        const magmaPlaneGeom = new THREE.PlaneGeometry(1800, 1800);
        magmaPlaneGeom.rotateX(-Math.PI / 2);
        const magmaPlaneMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        const magmaPlane = new THREE.Mesh(magmaPlaneGeom, magmaPlaneMat);
        magmaPlane.position.set(0, -3.8, 0);
        magmaGroup.add(magmaPlane);
        scene.add(magmaGroup);
        magmaFissuresGroupRef.current = magmaGroup;
      }

      // Liquid Oceans
      if (physicsState.hasLiquidWater && rendering.oceanColor) {
        const oceanGeom = new THREE.PlaneGeometry(1800, 1800);
        oceanGeom.rotateX(-Math.PI / 2);
        const oceanMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(rendering.oceanColor),
          roughness: 0.12,
          metalness: 0.88,
          transparent: true,
          opacity: 0.82,
        });
        const ocean = new THREE.Mesh(oceanGeom, oceanMat);
        ocean.position.set(0, 1.2, 0);
        scene.add(ocean);
        oceanMeshRef.current = ocean;
      }
    }

    // Clouds
    if (rendering.hasClouds) {
      const cloudGeom = new THREE.PlaneGeometry(2600, 2600);
      cloudGeom.rotateX(-Math.PI / 2);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rendering.cloudColor),
        transparent: true,
        opacity: 0.42,
        roughness: 0.9,
      });
      const clouds = new THREE.Mesh(cloudGeom, cloudMat);
      clouds.position.set(0, 170, 0);
      scene.add(clouds);
      cloudsMeshRef.current = clouds;
    }

    // Dyson Swarm Ring
    if (rendering.dysonRings) {
      const megaGroup = new THREE.Group();
      const ringGeom = new THREE.TorusGeometry(850, 28, 16, 100, Math.PI);
      ringGeom.rotateX(Math.PI / 3);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.set(0, 210, -200);
      megaGroup.add(ringMesh);
      scene.add(megaGroup);
      megastructureGroupRef.current = megaGroup;
    }

    // ==========================================
    // PROCEDURAL 3D SURFACE ROVER & DRONE MODEL
    // ==========================================
    const vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(0, 3, 0);
    scene.add(vehicleGroup);
    roverGroupRef.current = vehicleGroup;

    // (1) Titanium Chassis
    const chassisGeom = new THREE.BoxGeometry(2.2, 0.8, 3.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      metalness: 0.85,
      roughness: 0.35,
    });
    const chassis = new THREE.Mesh(chassisGeom, chassisMat);
    chassis.position.set(0, 0.4, 0);
    vehicleGroup.add(chassis);

    // Front Bumper / Radiator
    const bumperGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.0);
    bumperGeom.rotateZ(Math.PI / 2);
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.4 });
    const bumper = new THREE.Mesh(bumperGeom, bumperMat);
    bumper.position.set(0, 0.3, -1.85);
    vehicleGroup.add(bumper);

    // (2) Cockpit Canopy Glass Dome
    const canopyGeom = new THREE.SphereGeometry(0.85, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.72,
    });
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 0.8, -0.3);
    vehicleGroup.add(canopy);

    // (3) Rotating Lidar / Sensor Mast
    const mastGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.7);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(0.65, 1.15, 0.8);
    vehicleGroup.add(mast);

    const dishGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 16);
    const dishMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(0.65, 1.5, 0.8);
    dish.rotation.x = Math.PI / 4;
    vehicleGroup.add(dish);

    // (4) 6 Articulated All-Terrain Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.42, 18);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.2,
      flatShading: true,
    });

    const wheelHubMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const wheelOffsets = [
      { x: -1.35, z: -1.2 },
      { x: -1.35, z: 0.0 },
      { x: -1.35, z: 1.2 },
      { x: 1.35, z: -1.2 },
      { x: 1.35, z: 0.0 },
      { x: 1.35, z: 1.2 },
    ];

    wheelOffsets.forEach((off) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(off.x, 0, off.z);

      const hubGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12);
      hubGeom.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeom, wheelHubMat);
      wheel.add(hub);

      vehicleGroup.add(wheel);
      wheels.push(wheel);
    });
    wheelMeshesRef.current = wheels;

    // (5) Headlights: twin SpotLights casting illumination onto the terrain ahead
    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0, -50);
    vehicleGroup.add(headlightTarget);

    const spotLeft = new THREE.SpotLight(0xe0f2fe, 5.0, 220, Math.PI / 7, 0.35);
    spotLeft.position.set(-0.7, 0.6, -1.8);
    spotLeft.target = headlightTarget;
    vehicleGroup.add(spotLeft);
    roverHeadlightLeftRef.current = spotLeft;

    const spotRight = new THREE.SpotLight(0xe0f2fe, 5.0, 220, Math.PI / 7, 0.35);
    spotRight.position.set(0.7, 0.6, -1.8);
    spotRight.target = headlightTarget;
    vehicleGroup.add(spotRight);
    roverHeadlightRightRef.current = spotRight;

    // Headlight glowing lenses
    const lensGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const lensL = new THREE.Mesh(lensGeom, lensMat);
    lensL.position.copy(spotLeft.position);
    vehicleGroup.add(lensL);
    const lensR = new THREE.Mesh(lensGeom, lensMat);
    lensR.position.copy(spotRight.position);
    vehicleGroup.add(lensR);

    // (6) Rear Ion Thrusters & Plasma Exhaust Plumes
    const plumes: THREE.Mesh[] = [];
    const plumeGeom = new THREE.ConeGeometry(0.35, 1.8, 16);
    plumeGeom.rotateX(-Math.PI / 2);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    const plumeL = new THREE.Mesh(plumeGeom, plumeMat);
    plumeL.position.set(-0.6, 0.4, 2.5);
    vehicleGroup.add(plumeL);
    plumes.push(plumeL);

    const plumeR = new THREE.Mesh(plumeGeom, plumeMat.clone());
    plumeR.position.set(0.6, 0.4, 2.5);
    vehicleGroup.add(plumeR);
    plumes.push(plumeR);
    thrusterPlumesRef.current = plumes;

    // (7) Atmospheric Entry Heat Shield Cone & Ionization Envelope
    const heatShieldGeom = new THREE.ConeGeometry(2.4, 2.8, 24);
    heatShieldGeom.rotateX(Math.PI / 2);
    const heatShieldMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.0,
      wireframe: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const heatShield = new THREE.Mesh(heatShieldGeom, heatShieldMat);
    heatShield.position.set(0, 0.2, -0.6);
    vehicleGroup.add(heatShield);
    heatShieldMeshRef.current = heatShield;

    // (8) Atmospheric Re-Entry Ionized Spark Particles
    const sparkCount = 300;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let s = 0; s < sparkCount; s++) {
      sparkPositions[s * 3] = (Math.random() - 0.5) * 8;
      sparkPositions[s * 3 + 1] = (Math.random() - 0.5) * 4;
      sparkPositions[s * 3 + 2] = Math.random() * 25;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.45,
      transparent: true,
      opacity: 0.0,
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    vehicleGroup.add(sparkPoints);
    plasmaParticlesRef.current = sparkPoints;

    // Keyboard Listeners on window
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.steerLeft = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.steerRight = true;
      if (code === 'Space') {
        e.preventDefault();
        keysRef.current.jumpBoost = true;
        soundFX.triggerThrusterPulse();
      }
      if (code === 'KeyC' || code === 'ShiftLeft') keysRef.current.descend = true;
      if (code === 'KeyV') {
        // Toggle pilot camera perspective
        setPilotCamMode((prev) => (prev === 'CHASE_CAM' ? 'COCKPIT_VIEW' : prev === 'COCKPIT_VIEW' ? 'FREE_ORBIT' : 'CHASE_CAM'));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.steerLeft = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.steerRight = false;
      if (code === 'Space') keysRef.current.jumpBoost = false;
      if (code === 'KeyC' || code === 'ShiftLeft') keysRef.current.descend = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop using modern THREE.Timer
    let animId: number;
    const timer = new THREE.Timer();
    let entryAudioTicker = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      timer.update();
      const delta = timer.getDelta();

      // Cloud movement
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += delta * rendering.cloudSpeed;
      }

      // Black Hole disk rotation
      if (blackHoleGroupRef.current) {
        blackHoleGroupRef.current.rotation.y += delta * 0.08;
      }

      // Asteroid tumbling
      if (asteroidMeshRef.current) {
        asteroidMeshRef.current.rotation.x += delta * 0.04;
        asteroidMeshRef.current.rotation.y += delta * 0.06;
      }

      // Gas Giant internal lightning flicker
      if (lightningLightRef.current && rendering.lightningFrequency > 0) {
        if (Math.random() < 0.04) {
          lightningLightRef.current.intensity = 18.0 + Math.random() * 25.0;
        } else {
          lightningLightRef.current.intensity = THREE.MathUtils.lerp(
            lightningLightRef.current.intensity,
            0,
            0.15
          );
        }
      }

      // Dish antenna rotation
      dish.rotation.z += delta * 1.5;

      // ==========================================
      // (1) ATMOSPHERIC RE-ENTRY SEQUENCE STEPPER
      // ==========================================
      if (entryStateRef.current.stage !== 'SURFACE_TOUCHDOWN' && isEntryActive) {
        const entry = entryStateRef.current;
        const nextEntry = calculateAtmosphericEntryStep(
          entry.altitudeKm,
          entry.velocityKms,
          physicsState.surfacePressureAtm,
          physicsState.scaleHeightKm,
          physicsState.surfaceGravityG,
          delta,
          keysRef.current.jumpBoost ? 0.3 : 0
        );
        entryStateRef.current = nextEntry;
        setEntryProgress(nextEntry);

        // Sound effect roar
        entryAudioTicker += delta;
        if (entryAudioTicker > 0.4 && nextEntry.plasmaGlowIntensity > 0.2) {
          entryAudioTicker = 0;
          soundFX.triggerAtmosphericEntryRoar(nextEntry.plasmaGlowIntensity);
        }

        // Sync heat shield glow material
        if (heatShieldMeshRef.current) {
          const mat = heatShieldMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = nextEntry.plasmaGlowIntensity * 0.85;
          mat.color.set(nextEntry.plasmaGlowColor);
        }

        // Stream plasma sparks backwards
        if (plasmaParticlesRef.current) {
          const pMat = plasmaParticlesRef.current.material as THREE.PointsMaterial;
          pMat.opacity = nextEntry.plasmaGlowIntensity * 0.9;
          pMat.color.set(nextEntry.plasmaGlowColor);
          const pos = plasmaParticlesRef.current.geometry.attributes.position;
          for (let s = 0; s < sparkCount; s++) {
            let z = pos.getZ(s) + delta * 60 * (nextEntry.velocityKms + 1);
            if (z > 35) z = -10 + Math.random() * 5;
            pos.setZ(s, z);
          }
          pos.needsUpdate = true;
        }

        // Sync rover height to entry altitude
        roverStateRef.current.position.y = Math.max(3.0, nextEntry.altitudeKm * 3.5);
        vehicleGroup.position.copy(roverStateRef.current.position as any);

        // Tilt craft slightly downward into the plasma sheath
        vehicleGroup.rotation.x = 0.22;

        // Dynamic atmospheric scattering during re-entry
        const scattering = calculateAtmosphericScattering(
          nextEntry.altitudeKm,
          physicsState.surfacePressureAtm,
          physicsState.scaleHeightKm,
          rendering.skyHorizonColor,
          rendering.skyZenithColor
        );
        scene.fog = new THREE.FogExp2(new THREE.Color(scattering.skyHorizonHex), scattering.fogDensity);

        if (nextEntry.stage === 'SURFACE_TOUCHDOWN') {
          setIsEntryActive(false);
          setIsPilotMode(true);
          soundFX.triggerCertifiedDiscoveryPing();
        }
      }

      // ==========================================
      // (2) SURFACE ROVER / DRONE PHYSICS STEPPER
      // ==========================================
      if (isPilotMode || (!isEntryActive && roverStateRef.current.isGrounded)) {
        const heightFunc = (x: number, z: number) =>
          getProceduralTerrainHeight(x, z, {
            iceSpires: rendering.iceSpires,
            magmaFissures: rendering.magmaFissures,
            hasLiquidWater: physicsState.hasLiquidWater,
          });

        const nextRover = stepVehiclePhysics(
          roverStateRef.current,
          keysRef.current,
          physicsState.surfaceGravityG,
          physicsState.hasSolidSurface,
          delta,
          heightFunc
        );
        roverStateRef.current = nextRover;

        // Apply position and 3D orientation to Three.js Vehicle Group
        vehicleGroup.position.set(nextRover.position.x, nextRover.position.y, nextRover.position.z);
        vehicleGroup.rotation.y = nextRover.headingRad;
        vehicleGroup.rotation.x = nextRover.pitchRad;
        vehicleGroup.rotation.z = nextRover.rollRad;

        // Animate Wheels
        wheelMeshesRef.current.forEach((w) => {
          w.rotation.x = nextRover.wheelRotationRad;
        });

        // Animate Thruster Plumes
        const plumeScale = Math.max(0.1, nextRover.thrustPct * 1.8);
        thrusterPlumesRef.current.forEach((plume) => {
          const mat = plume.material as THREE.MeshBasicMaterial;
          mat.opacity = nextRover.thrustPct > 0.1 ? 0.85 : 0.0;
          plume.scale.set(plumeScale, plumeScale, plumeScale);
        });

        // Hide re-entry heat shield when landed
        if (heatShieldMeshRef.current) {
          (heatShieldMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        if (plasmaParticlesRef.current) {
          (plasmaParticlesRef.current.material as THREE.PointsMaterial).opacity = 0;
        }

        // Camera Tracking in Chase or Cockpit View
        if (isPilotMode) {
          if (pilotCamMode === 'CHASE_CAM') {
            const chaseDist = 9.0;
            const chaseHeight = 3.8;
            const camTargetX = nextRover.position.x + Math.sin(nextRover.headingRad) * chaseDist;
            const camTargetZ = nextRover.position.z + Math.cos(nextRover.headingRad) * chaseDist;
            const camTargetY = nextRover.position.y + chaseHeight;

            camera.position.lerp(new THREE.Vector3(camTargetX, camTargetY, camTargetZ), 0.12);
            controls.target.set(
              nextRover.position.x,
              nextRover.position.y + 1.2,
              nextRover.position.z
            );
          } else if (pilotCamMode === 'COCKPIT_VIEW') {
            // First person inside canopy
            camera.position.set(
              nextRover.position.x - Math.sin(nextRover.headingRad) * 0.4,
              nextRover.position.y + 1.1,
              nextRover.position.z - Math.cos(nextRover.headingRad) * 0.4
            );
            const lookAtX = nextRover.position.x - Math.sin(nextRover.headingRad) * 60;
            const lookAtZ = nextRover.position.z - Math.cos(nextRover.headingRad) * 60;
            controls.target.set(lookAtX, nextRover.position.y + 1.0, lookAtZ);
          }
        }

        // Sync Live HUD state throttled
        setRoverTelemetry({
          speedKmh: Math.round(nextRover.speedMs * 3.6),
          speedMs: Number(nextRover.speedMs.toFixed(1)),
          altitudeM: nextRover.altitudeM,
          pitchDeg: Math.round(nextRover.pitchRad * (180 / Math.PI)),
          rollDeg: Math.round(nextRover.rollRad * (180 / Math.PI)),
          headingDeg: Math.round(((nextRover.headingRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * (180 / Math.PI)),
          gForce: Number(physicsState.surfaceGravityG.toFixed(2)),
          isGrounded: nextRover.isGrounded,
        });
      }

      // Relativistic Aberration FOV compression
      if (cameraRef.current) {
        const baseFov = 65;
        const compressionFactor = Math.sqrt((1 - Math.min(0.95, relativisticBeta)) / (1 + Math.min(0.95, relativisticBeta)));
        cameraRef.current.fov = Math.max(28, baseFov * compressionFactor);
        cameraRef.current.updateProjectionMatrix();
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
      controls.dispose();
      if (container) container.innerHTML = '';
    };
  }, [physicsState, isPilotMode, pilotCamMode, isEntryActive]);

  // Adjust camera perspective in non-pilot mode
  useEffect(() => {
    if (isPilotMode) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    if (cameraMode === 'SURFACE_VIEW') {
      const baseAlt = physicsState.hasSolidSurface ? 3 : 45;
      cam.position.set(0, Math.max(baseAlt, altitudeKm * 0.1 + baseAlt), 18);
      ctrl.target.set(0, Math.max(baseAlt + 5, altitudeKm * 0.1 + baseAlt + 5), -80);
      ctrl.maxPolarAngle = Math.PI / 2 + 0.02;
    } else if (cameraMode === 'LOW_ORBIT') {
      cam.position.set(0, 390 + altitudeKm * 0.4, 460);
      ctrl.target.set(0, 40, -100);
      ctrl.maxPolarAngle = Math.PI;
    } else if (cameraMode === 'MEGASTRUCTURE_INSPECTOR') {
      cam.position.set(80, 220, -120);
      ctrl.target.set(0, 180, -250);
      ctrl.maxPolarAngle = Math.PI;
    }
  }, [cameraMode, altitudeKm, physicsState, isPilotMode]);

  // Time-of-day lighting
  useEffect(() => {
    const sunLight = hostStarLightRef.current;
    const sunMesh = hostStarMeshRef.current;
    const skyDome = skyDomeRef.current;
    if (!sunLight || !sunMesh || !skyDome) return;

    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;
    const sunY = Math.sin(angle) * 450;
    const sunZ = -Math.cos(angle) * 650;
    const isDay = sunY > -30;

    sunLight.position.set(120, sunY, sunZ);
    sunMesh.position.copy(sunLight.position);
    sunLight.intensity = Math.max(0.1, (sunY / 450) * 2.2);

    if (!isDay) {
      skyDome.material = new THREE.MeshBasicMaterial({ color: 0x020008, side: THREE.BackSide });
    } else if (sunY < 80) {
      skyDome.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(physicsState.renderingParams.skyHorizonColor),
        side: THREE.BackSide,
      });
    } else {
      skyDome.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(physicsState.renderingParams.skyZenithColor),
        side: THREE.BackSide,
      });
    }
  }, [timeOfDay, physicsState]);

  // Trigger Atmospheric Entry & Landing Sequence
  const handleInitiateAtmosphericEntry = () => {
    soundFX.triggerPingSweep();
    soundFX.triggerAtmosphericEntryRoar(0.8);
    setIsEntryActive(true);
    setIsPilotMode(true);
    setPilotCamMode('CHASE_CAM');
    entryStateRef.current = {
      stage: 'ATMOSPHERIC_ENTRY',
      altitudeKm: 95.0,
      velocityKms: 7.4,
      dynamicPressureKPa: 12.0,
      heatShieldTempK: 2150,
      plasmaGlowIntensity: 0.85,
      plasmaGlowColor: '#f97316',
      progressPct: 15.0,
      hudStatus: 'PLASMA IONIZATION SHOCK LAYER ACTIVATED',
    };
    setEntryProgress(entryStateRef.current);
  };

  // Toggle Driving Pilot Mode
  const handleTogglePilot = () => {
    soundFX.triggerTick();
    if (isPilotMode) {
      setIsPilotMode(false);
      setIsEntryActive(false);
    } else {
      setIsPilotMode(true);
      setCameraMode('SURFACE_VIEW');
      if (roverStateRef.current.position.y > 20) {
        roverStateRef.current.position.y = 3.0;
      }
    }
  };

  // Universal Celestial Search handler
  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    soundFX.triggerPingSweep();
    const clean = searchQuery.trim();
    setActiveTargetName(clean);

    const match = CATALOG_STARS.find(
      (s) => s.id.toLowerCase() === clean.toLowerCase() || s.name.toLowerCase().includes(clean.toLowerCase())
    );
    if (match && onSelectTarget) {
      onSelectTarget(match);
    }
    setSearchQuery('');
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#030208] font-mono text-slate-200 select-none">
      {/* Top Street View & Universal Probe Launcher Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-purple-950/60 bg-[#070410]/95 px-4 py-2 backdrop-blur-md z-20 gap-3">
        {/* Left: Adventure Platform Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            <span className="text-xs font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-purple-300 to-indigo-300">
              COSMOS-X SURFACE EXPLORER &amp; ROVER ENGINE
            </span>
          </div>

          <span className="rounded bg-cyan-950/70 border border-cyan-700/50 px-2 py-0.5 text-[9.5px] text-cyan-300 font-bold">
            {physicsState.targetName}
          </span>
        </div>

        {/* Center: Live Universal Celestial Search & Probe Launcher Bar */}
        <form onSubmit={handleExecuteSearch} className="flex-1 max-w-md flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="Search or Synthesize (e.g. HATS-72 b, WASP-103 b, GJ 3470 b, Betelgeuse)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-black/60 border border-purple-900/60 pl-8 pr-3 py-1.5 text-xs text-purple-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] whitespace-nowrap"
          >
            <Rocket size={12} />
            <span>Launch Probe</span>
          </button>
        </form>

        {/* Pilot & Re-entry Quick Action Controls */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          {/* Initiate Cinematic Atmospheric Entry Sequence Button */}
          <button
            type="button"
            onClick={handleInitiateAtmosphericEntry}
            disabled={isEntryActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.45)] transition-all cursor-pointer disabled:opacity-50"
            title="Execute space-to-surface atmospheric entry with heat-shield glow"
          >
            <Flame size={13} className="text-amber-200 animate-pulse" />
            <span>{isEntryActive ? 'RE-ENTRY IN PROGRESS...' : '⚡ Atmospheric Entry & Land'}</span>
          </button>

          {/* Pilot Rover / Drone Toggle */}
          <button
            type="button"
            onClick={handleTogglePilot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              isPilotMode
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'bg-black/60 border-purple-900 text-slate-300 hover:border-cyan-500'
            }`}
          >
            <Navigation size={13} className={isPilotMode ? 'text-cyan-200' : 'text-slate-400'} />
            <span>{isPilotMode ? 'PILOT ACTIVE (WASD)' : 'Drive Rover / Drone'}</span>
          </button>

          {/* Perspective Selector when Piloting */}
          {isPilotMode && (
            <button
              type="button"
              onClick={() => {
                soundFX.triggerTick();
                setPilotCamMode((p) => (p === 'CHASE_CAM' ? 'COCKPIT_VIEW' : p === 'COCKPIT_VIEW' ? 'FREE_ORBIT' : 'CHASE_CAM'));
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-purple-900 text-[10px] text-purple-300 hover:text-white cursor-pointer"
            >
              <Video size={11} />
              <span>{pilotCamMode === 'CHASE_CAM' ? '3rd Person' : pilotCamMode === 'COCKPIT_VIEW' ? 'Cockpit' : 'Orbit'}</span>
            </button>
          )}

          {/* Reticle & Exit */}
          <button
            type="button"
            onClick={() => setScanLinesEnabled(!scanLinesEnabled)}
            className={`px-2 py-1 rounded border text-[9.5px] cursor-pointer transition-colors ${
              scanLinesEnabled
                ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                : 'bg-black/50 border-purple-950 text-slate-500'
            }`}
          >
            HUD: {scanLinesEnabled ? 'ON' : 'OFF'}
          </button>

          {onExitSurfaceView && (
            <button
              type="button"
              onClick={onExitSurfaceView}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-bold cursor-pointer"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Archival Jump Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-[#060310]/95 border-b border-purple-950/40 text-xs z-10 no-scrollbar">
        <span className="text-[10px] text-slate-500 font-bold shrink-0 uppercase tracking-wider">
          DESTINATIONS:
        </span>
        {EXPEDITION_DISCOVERY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              soundFX.triggerTick();
              setActiveTargetName(chip.id);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all cursor-pointer border ${
              activeTargetName.toLowerCase().includes(chip.id.toLowerCase())
                ? 'bg-purple-900/80 border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-black/40 border-purple-950 text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
            }`}
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Main 3D Viewport with Three.js Canvas */}
      <div className="relative flex-1 w-full overflow-hidden bg-black">
        <div ref={containerRef} className="h-full w-full" />

        {/* Spacecraft HUD Scanlines & Crosshair Overlay */}
        {scanLinesEnabled && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(0,0,0,0.6)_100%)]">
            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-cyan-400/70" />
            <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-cyan-400/70" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-cyan-400/70" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-cyan-400/70" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40">
              <div className="h-16 w-16 rounded-full border border-cyan-400/40" />
              <div className="absolute h-0.5 w-24 bg-cyan-400/40" />
              <div className="absolute h-24 w-0.5 bg-cyan-400/40" />
            </div>

            {/* Warning banner for Gas Giants, Lava Worlds, or Cryo environments */}
            {physicsState.renderingParams.hudWarningBanner && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/80 border border-amber-500/80 px-4 py-1 text-[10px] text-amber-300 font-mono tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                {physicsState.renderingParams.hudWarningBanner}
              </div>
            )}
          </div>
        )}

        {/* ATMOSPHERIC RE-ENTRY PLASMA IONIZATION HUD OVERLAY */}
        {isEntryActive && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 animate-fade-in">
            <div className="rounded-2xl border border-amber-500/80 bg-black/85 p-3.5 backdrop-blur-2xl shadow-[0_0_35px_rgba(245,158,11,0.4)] text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-amber-950 pb-2">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber-400 animate-pulse" />
                  <span className="font-extrabold text-amber-300 uppercase tracking-wide">
                    ATMOSPHERIC ENTRY &bull; HEAT-SHIELD IONIZATION
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-[10px] font-bold text-amber-200">
                  {entryProgress.stage}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="rounded bg-black/70 p-1.5 border border-amber-950">
                  <div className="text-slate-400">ALTITUDE</div>
                  <div className="text-cyan-300 font-bold text-xs">{entryProgress.altitudeKm.toFixed(1)} km</div>
                </div>
                <div className="rounded bg-black/70 p-1.5 border border-amber-950">
                  <div className="text-slate-400">RE-ENTRY VELOCITY</div>
                  <div className="text-amber-300 font-bold text-xs">{entryProgress.velocityKms.toFixed(2)} km/s</div>
                </div>
                <div className="rounded bg-black/70 p-1.5 border border-amber-950">
                  <div className="text-slate-400">HEAT SHIELD TEMP</div>
                  <div className="text-rose-400 font-bold text-xs">{entryProgress.heatShieldTempK} K</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>DESCENT PROFILE</span>
                  <span className="text-amber-300 font-bold">{entryProgress.hudStatus}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-amber-950">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${entryProgress.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SURFACE ROVER PILOT FLIGHT DECK (ACTIVE IN PILOT MODE) */}
        {isPilotMode && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-xl w-full px-4">
            <div className="w-full rounded-2xl border border-cyan-800/70 bg-[#060414]/90 p-3 backdrop-blur-2xl shadow-[0_0_35px_rgba(34,211,238,0.2)] text-xs flex flex-col gap-2">
              {/* Pilot Deck Top Status */}
              <div className="flex items-center justify-between border-b border-cyan-950/80 pb-1.5 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-cyan-300">
                    {physicsState.hasSolidSurface && !isDroneMode
                      ? 'ALL-TERRAIN SURFACE ROVER (ACTIVE)'
                      : 'BUOYANT AERO-DRONE / AERIAL PROBE (ACTIVE)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>HEADING: <strong className="text-white">{roverTelemetry.headingDeg}°</strong></span>
                  <span>&bull;</span>
                  <span>STATUS: <strong className="text-emerald-400">{roverTelemetry.isGrounded ? 'GROUNDED' : 'AIRBORNE'}</strong></span>
                </div>
              </div>

              {/* Gauges Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="rounded bg-black/60 p-1.5 border border-cyan-950">
                  <div className="text-slate-400 text-[8.5px]">SPEED</div>
                  <div className="font-bold text-cyan-200 text-xs">{roverTelemetry.speedKmh} km/h</div>
                  <div className="text-[8px] text-slate-500">{roverTelemetry.speedMs} m/s</div>
                </div>

                <div className="rounded bg-black/60 p-1.5 border border-cyan-950">
                  <div className="text-slate-400 text-[8.5px]">LOCAL GRAVITY</div>
                  <div className="font-bold text-purple-300 text-xs">{roverTelemetry.gForce} g</div>
                  <div className="text-[8px] text-slate-500">{(roverTelemetry.gForce * 9.81).toFixed(1)} m/s²</div>
                </div>

                <div className="rounded bg-black/60 p-1.5 border border-cyan-950">
                  <div className="text-slate-400 text-[8.5px]">ALTITUDE (AGL)</div>
                  <div className="font-bold text-emerald-300 text-xs">{roverTelemetry.altitudeM} m</div>
                  <div className="text-[8px] text-slate-500">RADAR ALTIMETER</div>
                </div>

                <div className="rounded bg-black/60 p-1.5 border border-cyan-950">
                  <div className="text-slate-400 text-[8.5px]">ATTITUDE</div>
                  <div className="font-bold text-amber-300 text-xs">{roverTelemetry.pitchDeg}° / {roverTelemetry.rollDeg}°</div>
                  <div className="text-[8px] text-slate-500">PITCH &bull; ROLL</div>
                </div>
              </div>

              {/* Keyboard Instruction Badge */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-cyan-950/60">
                <span className="text-cyan-300 font-bold">
                  [W/S] Throttle/Reverse &bull; [A/D] Steer &bull; [SPACE] Thruster Boost &bull; [V] Camera
                </span>

                {physicsState.hasSolidSurface && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.triggerTick();
                      setIsDroneMode(!isDroneMode);
                      roverStateRef.current.vehicleMode = isDroneMode ? 'ROVER' : 'AERO_DRONE';
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 text-[8.5px] font-bold cursor-pointer transition-colors"
                  >
                    SWITCH TO {isDroneMode ? '🚗 GROUND ROVER' : '🛸 AERO DRONE'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Continuous Telemetry HUD Overlay (Left Panel) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-xs animate-fade-in no-scrollbar max-h-[85vh] overflow-y-auto">
          <div className="rounded-xl border border-cyan-900/60 bg-[#060312]/90 p-3 backdrop-blur-xl shadow-[0_0_25px_rgba(34,211,238,0.15)] space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-950/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                <Satellite size={13} className="text-cyan-400 animate-pulse" />
                <span>PHYSICS TELEMETRY ENGINE</span>
              </div>
              <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {physicsState.phaseState}
              </span>
            </div>

            {/* Core physical metrics calculated in real-time */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-black/60 p-1.5 border border-purple-950/60">
                <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                  <Gauge size={10} className="text-purple-400" />
                  <span>SURFACE GRAVITY</span>
                </div>
                <div className="font-bold text-white text-xs mt-0.5">
                  {physicsState.surfaceGravityG.toFixed(2)} g
                </div>
              </div>

              <div className="rounded bg-black/60 p-1.5 border border-purple-950/60">
                <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                  <Thermometer size={10} className="text-amber-400" />
                  <span>EQ. TEMPERATURE</span>
                </div>
                <div className="font-bold text-amber-300 text-xs mt-0.5">
                  {physicsState.equilibriumTempK} K ({physicsState.equilibriumTempK - 273}°C)
                </div>
              </div>

              <div className="rounded bg-black/60 p-1.5 border border-purple-950/60">
                <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                  <Layers size={10} className="text-cyan-400" />
                  <span>ATM. PRESSURE</span>
                </div>
                <div className="font-bold text-cyan-300 text-xs mt-0.5">
                  {physicsState.surfacePressureAtm.toFixed(2)} atm
                </div>
              </div>

              <div className="rounded bg-black/60 p-1.5 border border-purple-950/60">
                <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                  <Wind size={10} className="text-emerald-400" />
                  <span>SCALE HEIGHT H</span>
                </div>
                <div className="font-bold text-emerald-300 text-xs mt-0.5">
                  {physicsState.scaleHeightKm} km
                </div>
              </div>
            </div>

            {/* JWST Biosignature Disequilibrium & Kardashev Technosignature Matrix */}
            <div className="rounded-lg bg-black/70 p-2 border border-purple-950/70 space-y-1.5 text-[9.5px]">
              <div className="flex items-center justify-between border-b border-purple-950/80 pb-1">
                <span className="text-slate-400 font-bold uppercase">JWST Biosignature Index:</span>
                <span className={`font-bold ${physicsState.biosignatureDisequilibriumScore > 70 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {physicsState.biosignatureDisequilibriumScore.toFixed(1)}% DISEQUAL.
                </span>
              </div>
              {physicsState.biosignatureMolecules.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {physicsState.biosignatureMolecules.map((mol, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-[8px] text-emerald-300">
                      {mol}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-b border-purple-950/80 pb-1 pt-0.5">
                <span className="text-slate-400 font-bold uppercase">Kardashev Scale:</span>
                <span className={`font-bold ${physicsState.kardashevIndex >= 1.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  Type {physicsState.kardashevIndex.toFixed(2)} ({physicsState.technosignatureScore.toFixed(0)}% TECHNO)
                </span>
              </div>
            </div>

            {/* Atmospheric Composition Breakdown */}
            <div className="space-y-1 pt-1 border-t border-purple-950/60">
              <div className="text-[8.5px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Chemical Spectra Breakdown</span>
                <span className="text-cyan-400">λ_max: {physicsState.wienPeakNm} nm</span>
              </div>
              <div className="space-y-1">
                {physicsState.atmosphereComposition.map((gas) => (
                  <div key={gas.formula} className="space-y-0.5">
                    <div className="flex justify-between text-[8px] text-slate-300">
                      <span>{gas.formula}</span>
                      <span>{gas.pct}%</span>
                    </div>
                    <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${gas.pct}%`, backgroundColor: gas.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Liquid Water State Banner */}
            <div className="pt-1 border-t border-purple-950/60 text-[9px] flex items-center justify-between">
              <span className="text-slate-400">LIQUID WATER STATE:</span>
              <span
                className={`font-bold ${
                  physicsState.hasLiquidWater ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {physicsState.hasLiquidWater ? 'STABLE LIQUID OCEANS' : 'ZERO LIQUID WATER (DRY/GAS/LAVA)'}
              </span>
            </div>

            <div className="text-[9px] text-slate-400 italic leading-relaxed pt-1 border-t border-purple-950/60">
              &quot;{physicsState.renderingParams.description}&quot;
            </div>
          </div>
        </div>

        {/* Mobile / Touch On-Screen D-Pad & Controls (Bottom Right when Piloting) */}
        {isPilotMode && (
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1.5 bg-black/80 p-2 rounded-2xl border border-cyan-900/60 backdrop-blur-xl">
            <button
              type="button"
              onMouseDown={() => (keysRef.current.forward = true)}
              onMouseUp={() => (keysRef.current.forward = false)}
              onTouchStart={() => (keysRef.current.forward = true)}
              onTouchEnd={() => (keysRef.current.forward = false)}
              className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-600/80 flex items-center justify-center text-cyan-200 active:bg-cyan-800"
            >
              <ArrowUp size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onMouseDown={() => (keysRef.current.steerLeft = true)}
                onMouseUp={() => (keysRef.current.steerLeft = false)}
                onTouchStart={() => (keysRef.current.steerLeft = true)}
                onTouchEnd={() => (keysRef.current.steerLeft = false)}
                className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-600/80 flex items-center justify-center text-cyan-200 active:bg-cyan-800"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onMouseDown={() => {
                  keysRef.current.jumpBoost = true;
                  soundFX.triggerThrusterPulse();
                }}
                onMouseUp={() => (keysRef.current.jumpBoost = false)}
                onTouchStart={() => {
                  keysRef.current.jumpBoost = true;
                  soundFX.triggerThrusterPulse();
                }}
                onTouchEnd={() => (keysRef.current.jumpBoost = false)}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-600 to-purple-600 border border-amber-400 flex items-center justify-center text-white font-bold text-[10px] active:scale-95"
              >
                BOOST
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current.steerRight = true)}
                onMouseUp={() => (keysRef.current.steerRight = false)}
                onTouchStart={() => (keysRef.current.steerRight = true)}
                onTouchEnd={() => (keysRef.current.steerRight = false)}
                className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-600/80 flex items-center justify-center text-cyan-200 active:bg-cyan-800"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <button
              type="button"
              onMouseDown={() => (keysRef.current.backward = true)}
              onMouseUp={() => (keysRef.current.backward = false)}
              onTouchStart={() => (keysRef.current.backward = true)}
              onTouchEnd={() => (keysRef.current.backward = false)}
              className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-600/80 flex items-center justify-center text-cyan-200 active:bg-cyan-800"
            >
              <ArrowDown size={16} />
            </button>
          </div>
        )}

        {/* Interactive Master Flight & Chrono-Engine Slider Dock (Bottom Center) */}
        {!isPilotMode && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-purple-900/60 bg-[#070312]/95 px-4 py-2 backdrop-blur-xl shadow-[0_0_35px_rgba(0,0,0,0.85)] text-xs max-w-[95vw]">
            {/* 4D Deep-Time Chrono Scrubber (-4.5 Gyr to +5.0 Gyr) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] text-amber-300 font-bold whitespace-nowrap">
                4D CHRONO: <strong className="text-amber-200">{chronoGyr === 0 ? '0.0 Gyr (Present)' : `${chronoGyr > 0 ? '+' : ''}${chronoGyr.toFixed(1)} Gyr`}</strong>
              </span>
              <input
                type="range"
                min={-4.5}
                max={5.0}
                step={0.5}
                value={chronoGyr}
                onChange={(e) => setChronoGyr(Number(e.target.value))}
                title="Scrub deep time from -4.5 Gyr proto-planetary era to +5.0 Gyr red giant era"
                className="h-1.5 w-24 appearance-none rounded-lg bg-amber-950 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="h-4 w-px bg-purple-900/60" />

            {/* Relativistic Velocity Slider */}
            <div className="flex items-center gap-1.5">
              <Rocket size={11} className="text-cyan-400" />
              <span className="text-[9.5px] text-cyan-300 font-bold whitespace-nowrap">
                RELATIVISTIC: <strong className="text-cyan-200">{relativisticBeta.toFixed(2)}c (γ={lorentzGamma})</strong>
              </span>
              <input
                type="range"
                min={0.0}
                max={0.95}
                step={0.05}
                value={relativisticBeta}
                onChange={(e) => setRelativisticBeta(Number(e.target.value))}
                className="h-1.5 w-20 appearance-none rounded-lg bg-cyan-950 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="h-4 w-px bg-purple-900/60" />

            {/* Altitude Slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] text-purple-300 font-bold whitespace-nowrap">
                ALT: <strong className="text-cyan-300">{altitudeKm} km</strong>
              </span>
              <input
                type="range"
                min={0}
                max={600}
                step={10}
                value={altitudeKm}
                onChange={(e) => {
                  setAltitudeKm(Number(e.target.value));
                  if (Number(e.target.value) > 300) setCameraMode('LOW_ORBIT');
                  else if (Number(e.target.value) === 0) setCameraMode('SURFACE_VIEW');
                }}
                className="h-1.5 w-20 appearance-none rounded-lg bg-purple-950 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="h-4 w-px bg-purple-900/60" />

            {/* Time of Day Slider */}
            <div className="flex items-center gap-1.5">
              <Sun size={11} className="text-amber-400" />
              <span className="text-[9.5px] text-purple-300 font-bold whitespace-nowrap">
                TIME: <strong className="text-amber-300">{timeOfDay.toFixed(0)}:00h</strong>
              </span>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
                className="h-1.5 w-16 appearance-none rounded-lg bg-purple-950 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="h-4 w-px bg-purple-900/60" />

            <button
              type="button"
              onClick={() => soundFX.sonifySignal(physicsState.targetName)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-200 text-[9.5px] font-bold cursor-pointer transition-all"
            >
              <Volume2 size={11} />
              <span>Sonify</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
