import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CATALOG_STARS, CatalogTarget } from '../../data/astronomicalCatalog';
import { soundFX } from '../ui/AudioFeedback';
import {
  Globe,
  Layers,
  Sparkles,
  RotateCcw,
  Navigation,
  Crosshair,
  Sliders,
  ChevronRight,
  X,
  Compass,
  Sun,
  Radio,
} from 'lucide-react';

import {
  buildSurfaceAtmosphereRig,
  buildPlanetaryOrreryRig,
  buildLocalGroupRig,
  buildLaniakeaSuperclusterRig,
  SurfaceAtmosphereRig,
  PlanetaryOrreryRig,
  LocalGroupRig,
  LaniakeaWebRig,
} from '../../engine/cosmicScaleBuilders';
import {
  buildRelativisticFrameDraggingRig,
  RelativisticFrameDraggingRig,
  RelativisticMetrics,
} from '../../engine/relativisticFrameDraggingRig';

export type MapViewScale =
  | 'SURFACE_ATMOSPHERE'
  | 'PLANETARY_ORRERY'
  | 'LOCAL_SPHERE'
  | 'SPIRAL_GALAXY'
  | 'LOCAL_GROUP'
  | 'LANIAKEA_WEB';

export interface HolographicStarMapProps {
  selectedTargetId: string;
  onSelectTarget: (target: CatalogTarget) => void;
  activeAnomalyTargetId?: string | null;
  expandedView?: boolean;
  initialViewScale?: MapViewScale;
}

interface StarNode {
  id: string;
  name: string;
  coords: [number, number, number];
  isAnomaly: boolean;
  isCatalog: boolean;
  spectralClass: string;
  color: THREE.Color;
  targetRef?: CatalogTarget;
  galacticRegion?: string;
}

const _v1 = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export default function HolographicStarMap({
  selectedTargetId,
  onSelectTarget,
  activeAnomalyTargetId,
  expandedView = false,
  initialViewScale = 'LOCAL_SPHERE',
}: HolographicStarMapProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [viewScale, setViewScale] = useState<MapViewScale>(initialViewScale);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<StarNode | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [cameraDistance, setCameraDistance] = useState<number>(180);
  const [isFlying, setIsFlying] = useState(false);

  // Multi-Layer Architecture Toggles (Frame-dragging starts OFF to prevent visual clutter)
  const [showLayerBodies, setShowLayerBodies] = useState(true);
  const [showLayerWebArcs, setShowLayerWebArcs] = useState(true);
  const [showLayerTelemetryRings, setShowLayerTelemetryRings] = useState(true);
  const [showFrameDragging, setShowFrameDragging] = useState(false);
  const [showRelativisticHUD, setShowRelativisticHUD] = useState(false);
  const [frameDraggingMetrics, setFrameDraggingMetrics] = useState<RelativisticMetrics | null>(null);
  const [showLayerControls, setShowLayerControls] = useState(false);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const relativisticRigRef = useRef<RelativisticFrameDraggingRig | null>(null);

  // Local Sphere Objects
  const celestialSphereWireRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const localInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const cosmicArcsMeshRef = useRef<THREE.LineSegments | null>(null);
  const localDustParticlesRef = useRef<THREE.Points | null>(null);

  // Spiral Galaxy Objects
  const galaxyGroupRef = useRef<THREE.Group | null>(null);
  const galaxyPointsRef = useRef<THREE.Points | null>(null);
  const galaxyNebulaDustRef = useRef<THREE.Points | null>(null);
  const galacticCoreBulgeRef = useRef<THREE.Mesh | null>(null);
  const galacticAccretionRingRef = useRef<THREE.Mesh | null>(null);
  const galaxyInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);

  // 6 Cosmic Scale Rig References
  const surfaceAtmosphereRigRef = useRef<SurfaceAtmosphereRig | null>(null);
  const planetaryOrreryRigRef = useRef<PlanetaryOrreryRig | null>(null);
  const localGroupRigRef = useRef<LocalGroupRig | null>(null);
  const laniakeaWebRigRef = useRef<LaniakeaWebRig | null>(null);

  // Target Reticles
  const targetRingRef = useRef<THREE.Mesh | null>(null);
  const targetOuterRingRef = useRef<THREE.Mesh | null>(null);

  // Target flight vectors
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 55, 220));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioningRef = useRef<boolean>(false);

  // Star data arrays
  const localStarsRef = useRef<StarNode[]>([]);
  const galaxyStarsRef = useRef<StarNode[]>([]);
  const activeStarsRef = useRef<StarNode[]>([]);

  const selectedTargetIdRef = useRef(selectedTargetId);
  selectedTargetIdRef.current = selectedTargetId;
  const onSelectTargetRef = useRef(onSelectTarget);
  onSelectTargetRef.current = onSelectTarget;
  const viewScaleRef = useRef(viewScale);
  viewScaleRef.current = viewScale;

  // Camera Fly-to-Target
  const flyToTarget = useCallback((targetId: string) => {
    const list = activeStarsRef.current.length > 0 ? activeStarsRef.current : localStarsRef.current;
    const star = list.find((s) => s.id === targetId || s.targetRef?.id === targetId);
    if (star && controlsRef.current && cameraRef.current) {
      setIsFlying(true);
      isTransitioningRef.current = true;
      setSelectedNode(star);
      setShowDossier(true);

      const offsetDist = viewScaleRef.current === 'SPIRAL_GALAXY' ? 24 : 18;
      targetLookAtRef.current.set(...star.coords);
      targetCamPosRef.current.set(
        star.coords[0] + offsetDist * 0.7,
        star.coords[1] + offsetDist * 0.5,
        star.coords[2] + offsetDist
      );

      if (targetRingRef.current) {
        targetRingRef.current.position.set(...star.coords);
        targetRingRef.current.visible = true;
      }
      if (targetOuterRingRef.current) {
        targetOuterRingRef.current.position.set(...star.coords);
        targetOuterRingRef.current.visible = true;
      }

      setTimeout(() => {
        setIsFlying(false);
        isTransitioningRef.current = false;
      }, 850);
    }
  }, []);

  // Fly to Relativistic Massive Binary Vortex
  const flyToBinaryVortex = useCallback(() => {
    soundFX.triggerPingSweep();
    setIsFlying(true);
    isTransitioningRef.current = true;
    targetLookAtRef.current.set(38, -6, -28);
    targetCamPosRef.current.set(38 + 26, -6 + 18, -28 + 38);
    if (targetRingRef.current) {
      targetRingRef.current.position.set(38, -6, -28);
      targetRingRef.current.visible = true;
    }
    if (targetOuterRingRef.current) {
      targetOuterRingRef.current.position.set(38, -6, -28);
      targetOuterRingRef.current.visible = true;
    }
    setTimeout(() => {
      setIsFlying(false);
      isTransitioningRef.current = false;
    }, 850);
  }, []);

  // God's-Eye View Reset
  const resetToGodsEye = useCallback(() => {
    soundFX.triggerTick();
    isTransitioningRef.current = true;
    switch (viewScaleRef.current) {
      case 'SURFACE_ATMOSPHERE':
        targetCamPosRef.current.set(0, 10, 42);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'PLANETARY_ORRERY':
        targetCamPosRef.current.set(0, 55, 85);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LOCAL_SPHERE':
        targetCamPosRef.current.set(0, 55, 220);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'SPIRAL_GALAXY':
        targetCamPosRef.current.set(0, 220, 320);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LOCAL_GROUP':
        targetCamPosRef.current.set(0, 260, 480);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LANIAKEA_WEB':
        targetCamPosRef.current.set(0, 380, 620);
        targetLookAtRef.current.set(0, 0, 0);
        break;
    }
    setSelectedNode(null);
    setShowDossier(false);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 750);
  }, []);

  // View Scale Switcher
  const handleToggleViewScale = (scale: MapViewScale) => {
    if (scale === viewScale) return;
    soundFX.triggerPingSweep();
    setViewScale(scale);
    viewScaleRef.current = scale;
    isTransitioningRef.current = true;

    const isSurface = scale === 'SURFACE_ATMOSPHERE';
    const isOrrery = scale === 'PLANETARY_ORRERY';
    const isLocalSphere = scale === 'LOCAL_SPHERE';
    const isGalaxy = scale === 'SPIRAL_GALAXY';
    const isLocalGroup = scale === 'LOCAL_GROUP';
    const isLaniakea = scale === 'LANIAKEA_WEB';

    // Rig 1: Surface
    if (surfaceAtmosphereRigRef.current) surfaceAtmosphereRigRef.current.group.visible = isSurface;
    // Rig 2: Orrery
    if (planetaryOrreryRigRef.current) planetaryOrreryRigRef.current.group.visible = isOrrery;
    // Rig 3: Local Sphere
    if (celestialSphereWireRef.current) celestialSphereWireRef.current.visible = isLocalSphere;
    if (gridHelperRef.current) gridHelperRef.current.visible = isLocalSphere || isOrrery;
    if (localInstancedMeshRef.current) localInstancedMeshRef.current.visible = isLocalSphere && showLayerBodies;
    if (cosmicArcsMeshRef.current) cosmicArcsMeshRef.current.visible = isLocalSphere && showLayerWebArcs;
    if (localDustParticlesRef.current) localDustParticlesRef.current.visible = isLocalSphere;
    // Rig 4: Galaxy
    if (galaxyGroupRef.current) galaxyGroupRef.current.visible = isGalaxy;
    if (galaxyInstancedMeshRef.current) galaxyInstancedMeshRef.current.visible = isGalaxy && showLayerBodies;
    // Rig 5: Local Group
    if (localGroupRigRef.current) localGroupRigRef.current.group.visible = isLocalGroup;
    // Rig 6: Laniakea Web
    if (laniakeaWebRigRef.current) laniakeaWebRigRef.current.group.visible = isLaniakea;
    // Relativistic Frame-Dragging Grid (Default OFF, never allowed in Orrery or Atmosphere)
    if (relativisticRigRef.current) {
      relativisticRigRef.current.group.visible = showFrameDragging && (isLocalSphere || isGalaxy);
    }

    activeStarsRef.current = isGalaxy ? galaxyStarsRef.current : localStarsRef.current;

    switch (scale) {
      case 'SURFACE_ATMOSPHERE':
        targetCamPosRef.current.set(0, 10, 42);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'PLANETARY_ORRERY':
        targetCamPosRef.current.set(0, 55, 85);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LOCAL_SPHERE':
        targetCamPosRef.current.set(0, 55, 220);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'SPIRAL_GALAXY':
        targetCamPosRef.current.set(0, 220, 320);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LOCAL_GROUP':
        targetCamPosRef.current.set(0, 260, 480);
        targetLookAtRef.current.set(0, 0, 0);
        break;
      case 'LANIAKEA_WEB':
        targetCamPosRef.current.set(0, 380, 620);
        targetLookAtRef.current.set(0, 0, 0);
        break;
    }

    const match = activeStarsRef.current.find((s) => s.id === selectedTargetIdRef.current);
    if (match) {
      setSelectedNode(match);
    }

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 850);
  };

  useEffect(() => {
    if (selectedTargetId) {
      flyToTarget(selectedTargetId);
    }
  }, [selectedTargetId, flyToTarget]);

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene setup with Deep Nebula Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030208');
    scene.fog = new THREE.FogExp2('#05020c', 0.0006);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
    camera.position.set(0, 55, 220);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls for silky-smooth deep space exploration
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 10;
    controls.maxDistance = 1200;
    controls.zoomSpeed = 1.1;
    controls.rotateSpeed = 0.75;
    controls.panSpeed = 0.85;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Scene Illumination: Cosmic Ambient + Purple Core + Cyan Arm Lights
    const ambientLight = new THREE.AmbientLight('#2e1065', 1.0);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight('#fde047', 2.8, 1200);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const purpleNebulaLight = new THREE.PointLight('#c084fc', 2.2, 900);
    purpleNebulaLight.position.set(80, 50, -80);
    scene.add(purpleNebulaLight);

    const cyanLight = new THREE.PointLight('#22d3ee', 2.0, 800);
    cyanLight.position.set(-110, -40, 110);
    scene.add(cyanLight);

    // ==============================================================
    // 1. LOCAL SPHERE MODE OBJECTS (God's-Eye 2,600-Node Fibonacci)
    // ==============================================================
    const sphereRadius = 145;
    const sphereWireGeom = new THREE.SphereGeometry(sphereRadius, 36, 18);
    const sphereWireMat = new THREE.MeshBasicMaterial({
      color: '#581c87',
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const celestialSphereWire = new THREE.Mesh(sphereWireGeom, sphereWireMat);
    scene.add(celestialSphereWire);
    celestialSphereWireRef.current = celestialSphereWire;

    const gridHelper = new THREE.GridHelper(520, 32, '#9333ea', '#3b0764');
    gridHelper.position.y = -60;
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Local Stars generation
    const localStars: StarNode[] = [];
    const totalLocalStars = 2600;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Catalog stars mapped to Local Bubble coordinates
    CATALOG_STARS.forEach((catStar) => {
      const raRad = (catStar.ra * Math.PI) / 180;
      const decRad = (catStar.dec * Math.PI) / 180;
      const dist = Math.min(135, Math.max(35, Math.log10(catStar.distanceLy + 10) * 32));

      const x = dist * Math.cos(decRad) * Math.sin(raRad);
      const y = dist * Math.sin(decRad) * 0.75;
      const z = dist * Math.cos(decRad) * Math.cos(raRad);

      let color = new THREE.Color('#38bdf8');
      if (catStar.isDysonCandidate) {
        color = new THREE.Color('#fbbf24'); // Stellar Amber
      } else if (catStar.spectralType.startsWith('M')) {
        color = new THREE.Color('#f87171');
      } else if (catStar.spectralType.startsWith('G')) {
        color = new THREE.Color('#fde047');
      } else if (catStar.spectralType.startsWith('F')) {
        color = new THREE.Color('#e0f2fe');
      }

      localStars.push({
        id: catStar.id,
        name: catStar.name,
        coords: [x, y, z],
        isAnomaly: Boolean(catStar.primaryAnomaly || catStar.isDysonCandidate),
        isCatalog: true,
        spectralClass: catStar.spectralType,
        color,
        targetRef: catStar,
        galacticRegion: 'Local Bubble (Solar Neighborhood)',
      });
    });

    // Massive Binary Star System exhibiting extreme Relativistic Frame-Dragging (Lense-Thirring Vortex)
    localStars.push({
      id: 'CYG-X1-MASSIVE-BINARY',
      name: 'Cygnus X-1 (Relativistic Massive Binary)',
      coords: [38, -6, -28],
      isAnomaly: true,
      isCatalog: false,
      spectralClass: 'Kerr Black Hole (21.2 M☉) + O-Supergiant (14.8 M☉)',
      color: new THREE.Color('#38bdf8'),
      galacticRegion: 'Cygnus Relativistic Vortex (Frame-Dragging Zone)',
    });

    // Fibonacci Sphere Distribution for background celestial nodes
    for (let i = 0; i < totalLocalStars; i++) {
      const y = 1 - (i / (totalLocalStars - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const shellR = 60 + (i % 7) * 11 + Math.random() * 8;
      const x = Math.cos(theta) * radiusAtY * shellR;
      const z = Math.sin(theta) * radiusAtY * shellR;
      const posY = y * shellR * 0.75;

      const rand = Math.random();
      let color = new THREE.Color('#a855f7');
      let spectral = 'M Dwarf';
      if (rand > 0.94) {
        color = new THREE.Color('#22d3ee');
        spectral = 'A-type Main';
      } else if (rand > 0.82) {
        color = new THREE.Color('#fef08a');
        spectral = 'G-type Solar';
      } else if (rand > 0.65) {
        color = new THREE.Color('#fb923c');
        spectral = 'K-type Orange';
      } else if (rand > 0.40) {
        color = new THREE.Color('#f87171');
        spectral = 'M Dwarf';
      } else {
        color = new THREE.Color('#64748b');
      }

      localStars.push({
        id: `FIBO-${i}`,
        name: `CEL-${4100 + (i % 6000)}-${i}`,
        coords: [x, posY, z],
        isAnomaly: false,
        isCatalog: false,
        spectralClass: spectral,
        color,
        galacticRegion: 'Local Sphere Coordinate Lattice',
      });
    }

    localStarsRef.current = localStars;

    // Instanced Mesh for Local Nodes
    const localStarGeom = new THREE.SphereGeometry(0.85, 8, 8);
    const localStarMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const localInstancedMesh = new THREE.InstancedMesh(localStarGeom, localStarMat, localStars.length);

    localStars.forEach((star, i) => {
      _dummy.position.set(...star.coords);
      const scale = star.isAnomaly ? 2.6 : star.isCatalog ? 2.0 : Math.random() * 0.6 + 0.45;
      _dummy.scale.set(scale, scale, scale);
      _dummy.updateMatrix();
      localInstancedMesh.setMatrixAt(i, _dummy.matrix);
      localInstancedMesh.setColorAt(i, star.color);
    });

    localInstancedMesh.instanceMatrix.needsUpdate = true;
    if (localInstancedMesh.instanceColor) localInstancedMesh.instanceColor.needsUpdate = true;
    localInstancedMesh.computeBoundingSphere();
    scene.add(localInstancedMesh);
    localInstancedMeshRef.current = localInstancedMesh;

    // Cosmic Web Filament Arcs connecting catalog stars in local mode
    const arcPositions: number[] = [];
    const localCatIndices: number[] = [];
    localStars.forEach((s, idx) => {
      if (s.isCatalog) localCatIndices.push(idx);
    });

    for (let i = 0; i < localCatIndices.length; i++) {
      for (let j = i + 1; j < localCatIndices.length; j++) {
        const s1 = localStars[localCatIndices[i]];
        const s2 = localStars[localCatIndices[j]];
        const dX = s1.coords[0] - s2.coords[0];
        const dY = s1.coords[1] - s2.coords[1];
        const dZ = s1.coords[2] - s2.coords[2];
        const dist = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

        if (dist < 180) {
          const midX = (s1.coords[0] + s2.coords[0]) / 2;
          const midY = (s1.coords[1] + s2.coords[1]) / 2 + 10;
          const midZ = (s1.coords[2] + s2.coords[2]) / 2;

          arcPositions.push(s1.coords[0], s1.coords[1], s1.coords[2]);
          arcPositions.push(midX, midY, midZ);
          arcPositions.push(midX, midY, midZ);
          arcPositions.push(s2.coords[0], s2.coords[1], s2.coords[2]);
        }
      }
    }

    const arcGeom = new THREE.BufferGeometry();
    arcGeom.setAttribute('position', new THREE.Float32BufferAttribute(arcPositions, 3));
    const arcMat = new THREE.LineBasicMaterial({
      color: '#7e22ce',
      transparent: true,
      opacity: 0.35,
    });
    const cosmicArcsMesh = new THREE.LineSegments(arcGeom, arcMat);
    scene.add(cosmicArcsMesh);
    cosmicArcsMeshRef.current = cosmicArcsMesh;

    // Local Dust Particles
    const dustCount = 1400;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount * 3; d += 3) {
      dustPositions[d] = (Math.random() - 0.5) * 450;
      dustPositions[d + 1] = (Math.random() - 0.5) * 220;
      dustPositions[d + 2] = (Math.random() - 0.5) * 450;
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: '#c084fc',
      size: 2.2,
      transparent: true,
      opacity: 0.4,
    });
    const localDustParticles = new THREE.Points(dustGeom, dustMat);
    scene.add(localDustParticles);
    localDustParticlesRef.current = localDustParticles;

    // ==============================================================
    // 2. 3D SPIRAL GALAXY MODE (Milky Way & LMC Deep Space, 16,500+ stars)
    // ==============================================================
    const galaxyGroup = new THREE.Group();
    galaxyGroup.visible = initialViewScale === 'SPIRAL_GALAXY';
    scene.add(galaxyGroup);
    galaxyGroupRef.current = galaxyGroup;

    // (A) Galactic Core Bulge & Sagittarius A* Accretion Disk
    const coreBulgeGeom = new THREE.SphereGeometry(14, 28, 28);
    const coreBulgeMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.85,
    });
    const galacticCoreBulge = new THREE.Mesh(coreBulgeGeom, coreBulgeMat);
    galaxyGroup.add(galacticCoreBulge);
    galacticCoreBulgeRef.current = galacticCoreBulge;

    // Accretion Disk Glow Ring
    const accretionGeom = new THREE.RingGeometry(16, 26, 48);
    const accretionMat = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const galacticAccretionRing = new THREE.Mesh(accretionGeom, accretionMat);
    galacticAccretionRing.rotation.x = Math.PI / 2;
    galaxyGroup.add(galacticAccretionRing);
    galacticAccretionRingRef.current = galacticAccretionRing;

    // Supermassive Black Hole Shadow Core
    const smbhGeom = new THREE.SphereGeometry(4.2, 20, 20);
    const smbhMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const smbhMesh = new THREE.Mesh(smbhGeom, smbhMat);
    galaxyGroup.add(smbhMesh);

    // (B) 16,500+ Swirling Logarithmic Spiral Arm Stars
    const GALAXY_STARS_COUNT = 16500;
    const galaxyPositions = new Float32Array(GALAXY_STARS_COUNT * 3);
    const galaxyColors = new Float32Array(GALAXY_STARS_COUNT * 3);

    const armCount = 4;
    const armColors = [
      new THREE.Color('#38bdf8'), // Cyan / Blue young OB stars (Perseus)
      new THREE.Color('#c084fc'), // Electric Violet / Purple (Scutum-Centaurus)
      new THREE.Color('#818cf8'), // Indigo / Azure (Sagittarius)
      new THREE.Color('#fde047'), // Golden Yellow / Orange (Norma)
    ];

    let pIdx = 0;

    // 1. Core Bulge Dense Stars (3,200 stars)
    const CORE_STARS = 3200;
    for (let i = 0; i < CORE_STARS; i++) {
      const r = Math.pow(Math.random(), 2.0) * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.45;
      const z = r * Math.sin(phi) * Math.sin(theta);

      galaxyPositions[pIdx * 3] = x;
      galaxyPositions[pIdx * 3 + 1] = y;
      galaxyPositions[pIdx * 3 + 2] = z;

      const coreMix = Math.random();
      const rColor = coreMix > 0.4 ? 1.0 : 0.95;
      const gColor = coreMix > 0.4 ? 0.92 : 0.82;
      const bColor = coreMix > 0.7 ? 0.75 : 0.45;

      galaxyColors[pIdx * 3] = rColor;
      galaxyColors[pIdx * 3 + 1] = gColor;
      galaxyColors[pIdx * 3 + 2] = bColor;

      pIdx++;
    }

    // 2. 4 Spiral Arms (11,500 stars)
    const ARM_STARS = 11500;
    for (let i = 0; i < ARM_STARS; i++) {
      const armIndex = i % armCount;
      const armBaseAngle = (armIndex * (Math.PI * 2)) / armCount;

      const distFromCenter = 24 + Math.pow(Math.random(), 0.9) * 195;
      const spiralTwist = Math.log(distFromCenter / 20) * 2.85;
      const angle = armBaseAngle + spiralTwist;

      const armScatter = (Math.random() - 0.5) * (14 + distFromCenter * 0.11);
      const verticalScatter = (Math.random() - 0.5) * (6 + distFromCenter * 0.05);

      const x = Math.cos(angle) * distFromCenter + Math.sin(angle) * armScatter;
      const y = verticalScatter;
      const z = Math.sin(angle) * distFromCenter - Math.cos(angle) * armScatter;

      galaxyPositions[pIdx * 3] = x;
      galaxyPositions[pIdx * 3 + 1] = y;
      galaxyPositions[pIdx * 3 + 2] = z;

      const starType = Math.random();
      let starColor = armColors[armIndex];
      if (starType > 0.6) {
        starColor = new THREE.Color('#38bdf8');
      } else if (starType > 0.35) {
        starColor = new THREE.Color('#c084fc');
      } else if (starType > 0.15) {
        starColor = new THREE.Color('#fde047');
      } else {
        starColor = new THREE.Color('#f43f5e');
      }

      galaxyColors[pIdx * 3] = starColor.r;
      galaxyColors[pIdx * 3 + 1] = starColor.g;
      galaxyColors[pIdx * 3 + 2] = starColor.b;

      pIdx++;
    }

    // 3. Large Magellanic Cloud (LMC) Satellite Dwarf Galaxy (1,800 stars)
    const LMC_OFFSET = [210, -55, 175];
    const LMC_STARS = GALAXY_STARS_COUNT - pIdx;
    for (let i = 0; i < LMC_STARS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.8) * 38;
      const x = LMC_OFFSET[0] + Math.cos(angle) * r;
      const y = LMC_OFFSET[1] + (Math.random() - 0.5) * 16;
      const z = LMC_OFFSET[2] + Math.sin(angle) * r * 0.8;

      galaxyPositions[pIdx * 3] = x;
      galaxyPositions[pIdx * 3 + 1] = y;
      galaxyPositions[pIdx * 3 + 2] = z;

      const isLmcCluster = Math.random() > 0.5;
      const lmcColor = isLmcCluster ? new THREE.Color('#22d3ee') : new THREE.Color('#fbbf24');
      galaxyColors[pIdx * 3] = lmcColor.r;
      galaxyColors[pIdx * 3 + 1] = lmcColor.g;
      galaxyColors[pIdx * 3 + 2] = lmcColor.b;

      pIdx++;
    }

    const galaxyGeom = new THREE.BufferGeometry();
    galaxyGeom.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
    galaxyGeom.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

    const galaxyMat = new THREE.PointsMaterial({
      size: 2.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const galaxyPoints = new THREE.Points(galaxyGeom, galaxyMat);
    galaxyGroup.add(galaxyPoints);
    galaxyPointsRef.current = galaxyPoints;

    // (C) Electric Violet Nebula Dust Lanes
    const DUST_LANE_COUNT = 3200;
    const dustLanePositions = new Float32Array(DUST_LANE_COUNT * 3);
    const dustLaneColors = new Float32Array(DUST_LANE_COUNT * 3);

    for (let i = 0; i < DUST_LANE_COUNT; i++) {
      const armIdx = i % armCount;
      const armBase = (armIdx * (Math.PI * 2)) / armCount;
      const r = 30 + Math.pow(Math.random(), 0.85) * 180;
      const twist = Math.log(r / 20) * 2.85 - 0.18;
      const angle = armBase + twist;

      const scatter = (Math.random() - 0.5) * 12;
      dustLanePositions[i * 3] = Math.cos(angle) * r + Math.sin(angle) * scatter;
      dustLanePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustLanePositions[i * 3 + 2] = Math.sin(angle) * r - Math.cos(angle) * scatter;

      const violetTone = Math.random() > 0.4 ? new THREE.Color('#9333ea') : new THREE.Color('#3b0764');
      dustLaneColors[i * 3] = violetTone.r;
      dustLaneColors[i * 3 + 1] = violetTone.g;
      dustLaneColors[i * 3 + 2] = violetTone.b;
    }

    const dustLaneGeom = new THREE.BufferGeometry();
    dustLaneGeom.setAttribute('position', new THREE.BufferAttribute(dustLanePositions, 3));
    dustLaneGeom.setAttribute('color', new THREE.BufferAttribute(dustLaneColors, 3));

    const dustLaneMat = new THREE.PointsMaterial({
      size: 4.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxyNebulaDust = new THREE.Points(dustLaneGeom, dustLaneMat);
    galaxyGroup.add(galaxyNebulaDust);
    galaxyNebulaDustRef.current = galaxyNebulaDust;

    // (D) Catalog Stars in Spiral Galaxy Coordinates
    const galaxyStars: StarNode[] = [
      {
        id: 'TIC-25155310',
        name: 'TIC-25155310 (LMC Sector 64)',
        coords: [214, -54, 178],
        isAnomaly: true,
        isCatalog: true,
        spectralClass: 'G-Dwarf (Dyson Candidate)',
        color: new THREE.Color('#fbbf24'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'TIC-25155310'),
        galacticRegion: 'Large Magellanic Cloud (LMC Dwarf Galaxy)',
      },
      {
        id: 'KIC-8462852',
        name: "KIC-8462852 (Boyajian's Star)",
        coords: [24.5, 6.2, 124.0],
        isAnomaly: true,
        isCatalog: true,
        spectralClass: 'F3 V (Dyson Candidate)',
        color: new THREE.Color('#f59e0b'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'KIC-8462852'),
        galacticRegion: 'Cygnus Spiral Arm (Galactic Quadrant I)',
      },
      {
        id: 'Kepler-452b',
        name: "Kepler-452 (Earth's Cousin)",
        coords: [22.0, 5.8, 122.5],
        isAnomaly: false,
        isCatalog: true,
        spectralClass: 'G2 V Solar Analog',
        color: new THREE.Color('#fef08a'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'Kepler-452b'),
        galacticRegion: 'Cygnus Spiral Arm (Kepler Field)',
      },
      {
        id: 'Proxima-Centauri-b',
        name: 'Proxima Centauri (Alpha Centauri C)',
        coords: [0.8, 0.2, 105.2],
        isAnomaly: true,
        isCatalog: true,
        spectralClass: 'M5.5 V Flare Star',
        color: new THREE.Color('#f87171'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'Proxima-Centauri-b'),
        galacticRegion: 'Orion Spur (Solar Neighborhood / 4.2 ly)',
      },
      {
        id: 'TRAPPIST-1e',
        name: 'TRAPPIST-1 (Compact System)',
        coords: [-3.2, 1.1, 103.5],
        isAnomaly: false,
        isCatalog: true,
        spectralClass: 'M8 V Ultra-Cool Dwarf',
        color: new THREE.Color('#f87171'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'TRAPPIST-1e'),
        galacticRegion: 'Orion Spur (Aquarius / 39 ly)',
      },
      {
        id: 'TOI-700-d',
        name: 'TOI-700 (TESS Habitable Planet)',
        coords: [8.5, -4.2, 108.1],
        isAnomaly: false,
        isCatalog: true,
        spectralClass: 'M2 V Dwarf',
        color: new THREE.Color('#fb923c'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'TOI-700-d'),
        galacticRegion: 'Orion Spur (Dorado / 101 ly)',
      },
      {
        id: 'HD-209458-b',
        name: 'HD 209458 (Osiris Prototype)',
        coords: [-6.4, 2.5, 112.0],
        isAnomaly: false,
        isCatalog: true,
        spectralClass: 'G0 V Solar Type',
        color: new THREE.Color('#fde047'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'HD-209458-b'),
        galacticRegion: 'Orion Spur (Pegasus / 159 ly)',
      },
      {
        id: 'FRB-20261021A',
        name: 'FRB 20261021A Host Galaxy System',
        coords: [-310, 140, -280],
        isAnomaly: true,
        isCatalog: true,
        spectralClass: 'Deep Space Extragalactic Beacon',
        color: new THREE.Color('#38bdf8'),
        targetRef: CATALOG_STARS.find((s) => s.id === 'FRB-20261021A'),
        galacticRegion: 'Extragalactic Deep Space Beacon (480 Mly)',
      },
      {
        id: 'SAGITTARIUS-A',
        name: 'Sagittarius A* (Supermassive Black Hole)',
        coords: [0, 0, 0],
        isAnomaly: true,
        isCatalog: false,
        spectralClass: 'Galactic Center (4.3 Million Solar Masses)',
        color: new THREE.Color('#fbbf24'),
        galacticRegion: 'Galactic Core (Zero Point Origin)',
      },
      {
        id: 'SOLAR-SYSTEM',
        name: 'Solar System (Sun / Sol Coordinates)',
        coords: [0, 0, 105],
        isAnomaly: false,
        isCatalog: false,
        spectralClass: 'G2 V Yellow Dwarf (Home Origin)',
        color: new THREE.Color('#fef08a'),
        galacticRegion: 'Orion-Cygnus Arm Spur (~26,000 ly from Core)',
      },
      {
        id: 'TARANTULA-NEBULA',
        name: '30 Doradus (Tarantula Starburst Locus)',
        coords: [225, -58, 185],
        isAnomaly: false,
        isCatalog: false,
        spectralClass: 'Super-Giant H-II Starburst Complex',
        color: new THREE.Color('#22d3ee'),
        galacticRegion: 'Large Magellanic Cloud (Star-Forming Nebula)',
      },
      {
        id: 'CYG-X1-MASSIVE-BINARY',
        name: 'Cygnus X-1 (Relativistic Massive Binary)',
        coords: [38, -6, -28],
        isAnomaly: true,
        isCatalog: false,
        spectralClass: 'Kerr Black Hole (21.2 M☉) + O-Supergiant (14.8 M☉)',
        color: new THREE.Color('#38bdf8'),
        galacticRegion: 'Cygnus Arm (Relativistic Lense-Thirring Vortex)',
      },
    ];

    galaxyStarsRef.current = galaxyStars;

    // Galaxy Instanced Mesh for interactive pins
    const gStarGeom = new THREE.SphereGeometry(1.6, 12, 12);
    const gStarMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const galaxyInstancedMesh = new THREE.InstancedMesh(gStarGeom, gStarMat, galaxyStars.length);

    galaxyStars.forEach((star, i) => {
      _dummy.position.set(...star.coords);
      const scale = star.isAnomaly ? 3.4 : 2.4;
      _dummy.scale.set(scale, scale, scale);
      _dummy.updateMatrix();
      galaxyInstancedMesh.setMatrixAt(i, _dummy.matrix);
      galaxyInstancedMesh.setColorAt(i, star.color);
    });

    galaxyInstancedMesh.instanceMatrix.needsUpdate = true;
    if (galaxyInstancedMesh.instanceColor) galaxyInstancedMesh.instanceColor.needsUpdate = true;
    galaxyInstancedMesh.computeBoundingSphere();
    galaxyGroup.add(galaxyInstancedMesh);
    galaxyInstancedMeshRef.current = galaxyInstancedMesh;

    activeStarsRef.current = initialViewScale === 'SPIRAL_GALAXY' ? galaxyStars : localStars;

    // 5. LAYER 3: TELEMETRY PULSING TARGET RETICLE RINGS
    const ringGeom = new THREE.RingGeometry(3.2, 3.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#c084fc',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const targetRing = new THREE.Mesh(ringGeom, ringMat);
    targetRing.visible = false;
    scene.add(targetRing);
    targetRingRef.current = targetRing;

    const outerRingGeom = new THREE.RingGeometry(5.2, 5.6, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const targetOuterRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    targetOuterRing.visible = false;
    scene.add(targetOuterRing);
    targetOuterRingRef.current = targetOuterRing;

    // Set initial focus
    const initialList = initialViewScale === 'SPIRAL_GALAXY' ? galaxyStars : localStars;
    const initialStar = initialList.find((s) => s.id === selectedTargetIdRef.current) || initialList[0];
    if (initialStar) {
      setSelectedNode(initialStar);
      targetRing.position.set(...initialStar.coords);
      targetRing.visible = true;
      targetOuterRing.position.set(...initialStar.coords);
      targetOuterRing.visible = true;
    }

    // 6-Level "Powers of Ten" Cosmic Scale Rigs
    const curTarget = CATALOG_STARS.find((s) => s.id === selectedTargetIdRef.current) || CATALOG_STARS[0];
    const surfaceRig = buildSurfaceAtmosphereRig(curTarget);
    surfaceRig.group.visible = initialViewScale === 'SURFACE_ATMOSPHERE';
    scene.add(surfaceRig.group);
    surfaceAtmosphereRigRef.current = surfaceRig;

    const orreryRig = buildPlanetaryOrreryRig(curTarget);
    orreryRig.group.visible = initialViewScale === 'PLANETARY_ORRERY';
    scene.add(orreryRig.group);
    planetaryOrreryRigRef.current = orreryRig;

    const localGroupRig = buildLocalGroupRig();
    localGroupRig.group.visible = initialViewScale === 'LOCAL_GROUP';
    scene.add(localGroupRig.group);
    localGroupRigRef.current = localGroupRig;

    const laniakeaRig = buildLaniakeaSuperclusterRig();
    laniakeaRig.group.visible = initialViewScale === 'LANIAKEA_WEB';
    scene.add(laniakeaRig.group);
    laniakeaWebRigRef.current = laniakeaRig;

    // 7. Relativistic Frame-Dragging Spacetime Distortion Rig (Default visibility: false so it never clutters the star map or orrery)
    const relativisticRig = buildRelativisticFrameDraggingRig([38, -6, -28], 1.0);
    relativisticRig.group.visible = false;
    scene.add(relativisticRig.group);
    relativisticRigRef.current = relativisticRig;
    setFrameDraggingMetrics(relativisticRig.getPhysicsMetrics());

    // Apply initial view scale
    if (initialViewScale === 'SPIRAL_GALAXY') {
      celestialSphereWire.visible = false;
      gridHelper.visible = false;
      localInstancedMesh.visible = false;
      cosmicArcsMesh.visible = false;
      localDustParticles.visible = false;
      galaxyGroup.visible = true;
      camera.position.set(0, 220, 320);
      controls.target.set(0, 0, 0);
    } else if (initialViewScale === 'SURFACE_ATMOSPHERE') {
      celestialSphereWire.visible = false;
      gridHelper.visible = false;
      localInstancedMesh.visible = false;
      cosmicArcsMesh.visible = false;
      localDustParticles.visible = false;
      galaxyGroup.visible = false;
      camera.position.set(0, 10, 42);
      controls.target.set(0, 0, 0);
    } else if (initialViewScale === 'PLANETARY_ORRERY') {
      celestialSphereWire.visible = false;
      localInstancedMesh.visible = false;
      cosmicArcsMesh.visible = false;
      localDustParticles.visible = false;
      galaxyGroup.visible = false;
      camera.position.set(0, 55, 85);
      controls.target.set(0, 0, 0);
    } else if (initialViewScale === 'LOCAL_GROUP') {
      celestialSphereWire.visible = false;
      gridHelper.visible = false;
      localInstancedMesh.visible = false;
      cosmicArcsMesh.visible = false;
      localDustParticles.visible = false;
      galaxyGroup.visible = false;
      camera.position.set(0, 260, 480);
      controls.target.set(0, 0, 0);
    } else if (initialViewScale === 'LANIAKEA_WEB') {
      celestialSphereWire.visible = false;
      gridHelper.visible = false;
      localInstancedMesh.visible = false;
      cosmicArcsMesh.visible = false;
      localDustParticles.visible = false;
      galaxyGroup.visible = false;
      camera.position.set(0, 380, 620);
      controls.target.set(0, 0, 0);
    }

    // Main Render Loop with monotonic performance.now()
    let animId = 0;
    let isDisposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;

    function renderLoop() {
      if (isDisposed) return;
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      elapsedTime += delta;

      // Handle animated camera fly-to transition
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, Math.min(1.0, delta * 3.8));
        controls.target.lerp(targetLookAtRef.current, Math.min(1.0, delta * 4.2));
      }

      controls.update();

      // Dynamic distance metric update
      _v1.subVectors(camera.position, controls.target);
      const currentDist = Math.round(_v1.length());
      setCameraDistance(currentDist);

      // (1) Local Sphere Mode Animations
      if (celestialSphereWire.visible) {
        celestialSphereWire.rotation.y += delta * 0.015;
        celestialSphereWire.rotation.x += delta * 0.005;
      }
      if (localDustParticles.visible) {
        localDustParticles.rotation.y -= delta * 0.008;
      }
      if (cosmicArcsMesh.visible) {
        cosmicArcsMesh.rotation.y += delta * 0.012;
      }

      // (2) Spiral Galaxy Mode Animations
      if (galaxyGroup.visible) {
        galaxyGroup.rotation.y += delta * 0.018;

        if (galacticCoreBulge) {
          const corePulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.05;
          galacticCoreBulge.scale.set(corePulse, corePulse, corePulse);
        }
        if (galacticAccretionRing) {
          galacticAccretionRing.rotation.z += delta * 0.8;
        }
        if (galaxyNebulaDust) {
          galaxyNebulaDust.rotation.y += delta * 0.006;
        }
      }

      // (3) Surface & Atmosphere Rig
      if (surfaceAtmosphereRigRef.current && surfaceAtmosphereRigRef.current.group.visible) {
        surfaceAtmosphereRigRef.current.update(delta);
      }

      // (4) Planetary Orrery Rig
      if (planetaryOrreryRigRef.current && planetaryOrreryRigRef.current.group.visible) {
        planetaryOrreryRigRef.current.update(delta);
      }

      // (5) Local Group Rig
      if (localGroupRigRef.current && localGroupRigRef.current.group.visible) {
        localGroupRigRef.current.update(delta);
      }

      // (6) Laniakea Supercluster Web Rig
      if (laniakeaWebRigRef.current && laniakeaWebRigRef.current.group.visible) {
        laniakeaWebRigRef.current.update(delta);
      }

      // (7) Relativistic Frame-Dragging Spacetime Distortion Rig (Lense-Thirring Vortex)
      if (relativisticRigRef.current && relativisticRigRef.current.group.visible) {
        relativisticRigRef.current.update(delta);
      }

      // Reticle Pulse Animation
      if (targetRing.visible) {
        targetRing.quaternion.copy(camera.quaternion);
        targetOuterRing.quaternion.copy(camera.quaternion);
        const pulse = 1.0 + Math.sin(elapsedTime * 3.5) * 0.12;
        targetRing.scale.set(pulse, pulse, pulse);
        const outerPulse = 1.0 - Math.sin(elapsedTime * 3.5) * 0.08;
        targetOuterRing.scale.set(outerPulse, outerPulse, outerPulse);
        targetOuterRing.rotation.z += delta * 0.6;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Mouse Pointer Raycast Check for Hover Tooltip
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current) return;
      _raycaster.setFromCamera(_mouse, cameraRef.current);

      const isGalaxy = viewScaleRef.current === 'SPIRAL_GALAXY';
      const targetMesh = isGalaxy ? galaxyInstancedMeshRef.current : localInstancedMeshRef.current;
      const starList = isGalaxy ? galaxyStarsRef.current : localStarsRef.current;

      if (targetMesh && targetMesh.visible) {
        const intersects = _raycaster.intersectObject(targetMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const star = starList[intersects[0].instanceId];
          setHoveredStar(star);
        } else {
          setHoveredStar(null);
        }
      }
    };

    // Click Handler: Lock Target, Open Dossier, and Trigger Flight
    const handleClick = (e: MouseEvent) => {
      if (!cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, cameraRef.current);
      const isGalaxy = viewScaleRef.current === 'SPIRAL_GALAXY';
      const targetMesh = isGalaxy ? galaxyInstancedMeshRef.current : localInstancedMeshRef.current;
      const starList = isGalaxy ? galaxyStarsRef.current : localStarsRef.current;

      if (targetMesh && targetMesh.visible) {
        const intersects = _raycaster.intersectObject(targetMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const star = starList[intersects[0].instanceId];
          soundFX.triggerTick();
          setSelectedNode(star);
          setShowDossier(true);

          if (star.targetRef) {
            onSelectTargetRef.current(star.targetRef);
            flyToTarget(star.id);
          } else {
            isTransitioningRef.current = true;
            targetLookAtRef.current.set(...star.coords);
            targetCamPosRef.current.set(star.coords[0] + 25, star.coords[1] + 18, star.coords[2] + 35);
            targetRing.position.set(...star.coords);
            targetRing.visible = true;
            targetOuterRing.position.set(...star.coords);
            targetOuterRing.visible = true;
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 800);
          }
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);

      controls.dispose();

      surfaceAtmosphereRigRef.current?.dispose();
      planetaryOrreryRigRef.current?.dispose();
      localGroupRigRef.current?.dispose();
      laniakeaWebRigRef.current?.dispose();
      relativisticRigRef.current?.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  // Synchronize Layer Toggles & View Scale Visibility
  useEffect(() => {
    const isSurface = viewScale === 'SURFACE_ATMOSPHERE';
    const isOrrery = viewScale === 'PLANETARY_ORRERY';
    const isLocal = viewScale === 'LOCAL_SPHERE';
    const isGalaxy = viewScale === 'SPIRAL_GALAXY';
    const isLocalGroup = viewScale === 'LOCAL_GROUP';
    const isLaniakea = viewScale === 'LANIAKEA_WEB';

    if (surfaceAtmosphereRigRef.current) surfaceAtmosphereRigRef.current.group.visible = isSurface;
    if (planetaryOrreryRigRef.current) planetaryOrreryRigRef.current.group.visible = isOrrery;

    if (celestialSphereWireRef.current) celestialSphereWireRef.current.visible = isLocal;
    if (gridHelperRef.current) gridHelperRef.current.visible = isLocal || isOrrery;
    if (localInstancedMeshRef.current) localInstancedMeshRef.current.visible = isLocal && showLayerBodies;
    if (cosmicArcsMeshRef.current) cosmicArcsMeshRef.current.visible = isLocal && showLayerWebArcs;
    if (localDustParticlesRef.current) localDustParticlesRef.current.visible = isLocal;

    if (galaxyGroupRef.current) galaxyGroupRef.current.visible = isGalaxy;
    if (galaxyInstancedMeshRef.current) galaxyInstancedMeshRef.current.visible = isGalaxy && showLayerBodies;

    if (localGroupRigRef.current) localGroupRigRef.current.group.visible = isLocalGroup;
    if (laniakeaWebRigRef.current) laniakeaWebRigRef.current.group.visible = isLaniakea;

    // Relativistic Frame-Dragging Spacetime Distortion Grid (Never show in Orrery or Atmosphere)
    if (relativisticRigRef.current) {
      const allowedScales = isLocal || isGalaxy;
      relativisticRigRef.current.group.visible = showFrameDragging && allowedScales;
    }

    activeStarsRef.current = isGalaxy ? galaxyStarsRef.current : localStarsRef.current;
  }, [viewScale, showLayerBodies, showLayerWebArcs, showFrameDragging]);

  useEffect(() => {
    if (targetRingRef.current && targetOuterRingRef.current) {
      targetRingRef.current.visible = showLayerTelemetryRings && Boolean(selectedNode);
      targetOuterRingRef.current.visible = showLayerTelemetryRings && Boolean(selectedNode);
    }
  }, [showLayerTelemetryRings, selectedNode]);

  // Derived orbital velocity estimation for active node
  const estimatedOrbitalVelocity = selectedNode?.targetRef
    ? Math.round(
        Math.sqrt(
          (6.6743e-11 * (selectedNode.targetRef.massStellar || 1.0) * 1.989e30) /
            (selectedNode.targetRef.defaultPeriod * 86400 * 200)
        ) / 1000
      )
    : 29.8;

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#030208] rounded-xl overflow-hidden border border-purple-950/40 shadow-[0_0_35px_rgba(168,85,247,0.08)] select-none">
      {/* Dedicated Three.js WebGL Viewport (z-0) */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 h-full w-full" />
      {/* Top Tactical Command Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-900/50 bg-[#070312]/90 px-3 py-1.5 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.6)] font-mono text-xs">
        {/* Left: View Mode Title & Astrometric Tag */}
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-purple-400 shrink-0" />
          <span className="font-extrabold tracking-wider text-purple-200 uppercase text-[10.5px]">
            {viewScale === 'SURFACE_ATMOSPHERE' && 'Level 1: Exoplanet Atmosphere & Surface'}
            {viewScale === 'PLANETARY_ORRERY' && 'Level 2: Planetary System (Orrery & Habitable Zone)'}
            {viewScale === 'LOCAL_SPHERE' && "Level 3: Local Stellar Neighborhood (800 pc)"}
            {viewScale === 'SPIRAL_GALAXY' && 'Level 4: Spiral Galaxy (Milky Way & LMC)'}
            {viewScale === 'LOCAL_GROUP' && 'Level 5: Local Group & Intergalactic Bridges'}
            {viewScale === 'LANIAKEA_WEB' && 'Level 6: Laniakea Supercluster & Cosmic Web'}
          </span>
          <span className="rounded-full bg-purple-950/80 px-2 py-0.5 text-[8.5px] text-cyan-300 border border-purple-800/50">
            {viewScale === 'SURFACE_ATMOSPHERE' && '100 KM • ATMO GLOW'}
            {viewScale === 'PLANETARY_ORRERY' && '7 WORLDS • GOLDILOCKS'}
            {viewScale === 'LOCAL_SPHERE' && '2,600 FIBONACCI NODES'}
            {viewScale === 'SPIRAL_GALAXY' && '16,500+ STARS • 4 ARMS'}
            {viewScale === 'LOCAL_GROUP' && '11,000 NODES • DARK MATTER'}
            {viewScale === 'LANIAKEA_WEB' && '13,500 CLUSTERS • BOÖTES VOID'}
          </span>
        </div>

        {/* Center: 6-Level "Powers of Ten" Seamless Scale Switcher */}
        <div className="flex items-center gap-0.5 rounded-lg bg-black/75 p-0.5 border border-purple-950/70 text-[9px] overflow-x-auto max-w-full">
          {[
            { id: 'SURFACE_ATMOSPHERE', label: '1. ATMO', tip: 'Surface & Atmosphere' },
            { id: 'PLANETARY_ORRERY', label: '2. ORRERY', tip: 'Planetary System' },
            { id: 'LOCAL_SPHERE', label: '3. SPHERE', tip: 'Stellar Neighborhood' },
            { id: 'SPIRAL_GALAXY', label: '4. GALAXY', tip: 'Spiral Galaxy' },
            { id: 'LOCAL_GROUP', label: '5. LOCAL GRP', tip: 'Intergalactic Bridges' },
            { id: 'LANIAKEA_WEB', label: '6. LANIAKEA', tip: '500 Mly Cosmic Web' },
          ].map((item) => {
            const active = viewScale === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleToggleViewScale(item.id as MapViewScale)}
                title={item.tip}
                className={`px-2 py-1 rounded transition-all whitespace-nowrap font-mono ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Frame Dragging, Layers & Reset */}
        <div className="flex items-center gap-1.5 text-[9.5px]">
          {/* Relativistic Frame-Dragging Toggle Button */}
          <button
            onClick={() => {
              soundFX.triggerPingSweep();
              setShowFrameDragging(!showFrameDragging);
            }}
            title="Toggle Relativistic Frame-Dragging (Lense-Thirring Vortex Grid)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9.5px] font-mono transition-all ${
              showFrameDragging
                ? 'border-cyan-500/80 bg-cyan-950/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.35)]'
                : 'border-purple-900/60 bg-[#0d071a]/80 text-slate-400 hover:text-purple-300'
            }`}
          >
            <span className="text-[11px] leading-none">🌀</span>
            <span className="font-bold">FRAME-DRAGGING</span>
            <span
              className={`rounded px-1 text-[8px] font-mono ${
                showFrameDragging ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showFrameDragging ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Kerr Metric Telemetry HUD Trigger */}
          <button
            onClick={() => {
              soundFX.triggerTick();
              setShowRelativisticHUD(!showRelativisticHUD);
            }}
            title="Open Relativistic Kerr Metric & Lense-Thirring Telemetry HUD"
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9.5px] transition-colors ${
              showRelativisticHUD
                ? 'border-indigo-400/80 bg-indigo-950/80 text-indigo-200 shadow-[0_0_12px_rgba(129,140,248,0.4)]'
                : 'border-purple-800/60 bg-[#0d071a]/90 hover:bg-purple-950/70 text-purple-200'
            }`}
          >
            <Compass size={11} className="text-cyan-400" />
            <span>KERR a/M: <strong className="text-cyan-300">0.94</strong></span>
          </button>

          <button
            onClick={() => {
              soundFX.triggerTick();
              setShowLayerControls(!showLayerControls);
            }}
            className="flex items-center gap-1 rounded-lg border border-purple-800/60 bg-[#0d071a]/90 hover:bg-purple-950/70 px-2 py-1 text-purple-200 transition-colors"
          >
            <Layers size={11} className="text-purple-400" />
            <span>
              LAYERS (
              {(showLayerBodies ? 1 : 0) +
                (showLayerWebArcs ? 1 : 0) +
                (showLayerTelemetryRings ? 1 : 0) +
                (showFrameDragging ? 1 : 0)}
              /4)
            </span>
          </button>

          <button
            onClick={resetToGodsEye}
            title="God's-Eye Reset View"
            className="flex items-center gap-1 rounded-lg border border-purple-800/60 bg-[#0d071a]/90 hover:bg-purple-950/70 px-2 py-1 text-purple-200 transition-colors"
          >
            <RotateCcw size={10} className="text-purple-400" />
            <span>RESET</span>
          </button>

          {showLayerControls && (
            <div className="absolute top-11 right-3 w-60 rounded-xl border border-purple-800/60 bg-[#0b0518]/95 p-3 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col gap-2 z-30">
              <div className="text-[10px] font-bold text-purple-300 pb-1 border-b border-purple-950/60 flex items-center justify-between">
                <span>MULTI-LAYER ARCHITECTURE</span>
                <button onClick={() => setShowLayerControls(false)} className="text-slate-500 hover:text-slate-200">
                  <X size={12} />
                </button>
              </div>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Layer 1: Orbital Bodies</span>
                </span>
                <input
                  type="checkbox"
                  checked={showLayerBodies}
                  onChange={(e) => {
                    soundFX.triggerTick();
                    setShowLayerBodies(e.target.checked);
                  }}
                  className="accent-purple-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Layer 2: Cosmic Web Arcs</span>
                </span>
                <input
                  type="checkbox"
                  checked={showLayerWebArcs}
                  onChange={(e) => {
                    soundFX.triggerTick();
                    setShowLayerWebArcs(e.target.checked);
                  }}
                  className="accent-purple-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Layer 3: Telemetry Rings</span>
                </span>
                <input
                  type="checkbox"
                  checked={showLayerTelemetryRings}
                  onChange={(e) => {
                    soundFX.triggerTick();
                    setShowLayerTelemetryRings(e.target.checked);
                  }}
                  className="accent-purple-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                  <span className="text-cyan-200 font-semibold">Layer 4: Relativistic Frame Drag</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFrameDragging}
                  onChange={(e) => {
                    soundFX.triggerTick();
                    setShowFrameDragging(e.target.checked);
                  }}
                  className="accent-cyan-500 rounded"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Camera Fly-to-Target Flight Indicator */}
      {isFlying && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1.5 rounded-full bg-purple-950/90 border border-purple-500/80 px-3 py-1 text-[10px] font-mono text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <Navigation size={12} className="animate-spin text-purple-400" />
          <span>FLYING TO TARGET COORDINATES...</span>
        </div>
      )}

      {/* Hover Tooltip Card */}
      {hoveredStar && (
        <div className="pointer-events-none absolute bottom-14 left-4 z-20 rounded-lg border border-purple-700/60 bg-[#0d071a]/95 px-3 py-2 font-mono text-xs backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-200">{hoveredStar.name}</span>
            {hoveredStar.isAnomaly && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600 text-[8.5px] font-bold">
                ANOMALY FLAGGED
              </span>
            )}
          </div>
          <div className="text-[9.5px] text-slate-400 mt-0.5">
            REGION: <span className="text-cyan-300">{hoveredStar.galacticRegion || 'Local Bubble'}</span>
          </div>
          <div className="text-[9.5px] text-slate-400">
            CLASS: <span className="text-slate-200">{hoveredStar.spectralClass}</span>
          </div>
        </div>
      )}

      {/* Interactive Info Dossier (Slide-Out Telemetry Card) */}
      {showDossier && selectedNode && (
        <div className="absolute top-14 right-4 z-20 w-80 rounded-xl border border-purple-600/60 bg-[#0d071a]/95 p-3.5 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.35)] flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-950/60">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <span className="font-bold text-purple-200 truncate">{selectedNode.name}</span>
            </div>
            <button
              onClick={() => {
                soundFX.triggerTick();
                setShowDossier(false);
              }}
              className="text-slate-500 hover:text-slate-200 shrink-0"
            >
              <X size={13} />
            </button>
          </div>

          <div className="text-[9px] text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 rounded px-2 py-0.5">
            GALACTIC SECTOR: {selectedNode.galacticRegion || 'Milky Way Core Disk'}
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
            <div className="rounded bg-black/50 border border-purple-950/50 p-1.5">
              <div className="text-slate-500">COORDINATES</div>
              <div className="text-purple-300 font-bold">
                X:{selectedNode.coords[0].toFixed(0)} Y:{selectedNode.coords[1].toFixed(0)} Z:{selectedNode.coords[2].toFixed(0)}
              </div>
            </div>

            <div className="rounded bg-black/50 border border-purple-950/50 p-1.5">
              <div className="text-slate-500">EST. ORBIT VELOCITY</div>
              <div className="text-cyan-300 font-bold">{estimatedOrbitalVelocity} km/s</div>
            </div>

            <div className="rounded bg-black/50 border border-purple-950/50 p-1.5">
              <div className="text-slate-500">SPECTRAL CLASS</div>
              <div className="text-amber-300 font-bold truncate">{selectedNode.spectralClass}</div>
            </div>

            <div className="rounded bg-black/50 border border-purple-950/50 p-1.5">
              <div className="text-slate-500">PHYSICS STATUS</div>
              <div className="text-emerald-400 font-bold">
                {selectedNode.isAnomaly ? 'ANOMALY LOCK' : 'KEPLERIAN STABLE'}
              </div>
            </div>
          </div>

          {selectedNode.targetRef && (
            <div className="text-[10px] text-slate-300 bg-purple-950/30 rounded p-2 border border-purple-900/40 leading-relaxed font-sans max-h-24 overflow-y-auto">
              {selectedNode.targetRef.overview}
            </div>
          )}

          <div className="flex items-center justify-between text-[9px] pt-1 border-t border-purple-950/40">
            <span className="text-slate-500">RANGE: {cameraDistance} PC</span>
            <button
              onClick={() => {
                soundFX.triggerTick();
                if (selectedNode.targetRef) onSelectTarget(selectedNode.targetRef);
                flyToTarget(selectedNode.id);
              }}
              className="text-purple-300 hover:text-purple-200 font-bold underline decoration-purple-500/60 flex items-center gap-0.5"
            >
              <span>Engage Focus</span>
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Relativistic Frame-Dragging & Lense-Thirring Telemetry HUD Card */}
      {showRelativisticHUD && (
        <div className="absolute top-14 right-4 z-20 w-80 rounded-xl border border-cyan-500/70 bg-[#070314]/95 p-3.5 backdrop-blur-xl shadow-[0_0_35px_rgba(34,211,238,0.3)] flex flex-col gap-2.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-900/50">
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400 text-sm">🌀</span>
              <span className="font-extrabold text-cyan-200 tracking-wide text-[11px]">
                RELATIVISTIC FRAME DRAGGING
              </span>
            </div>
            <button
              onClick={() => {
                soundFX.triggerTick();
                setShowRelativisticHUD(false);
              }}
              className="text-slate-500 hover:text-slate-200 shrink-0"
            >
              <X size={13} />
            </button>
          </div>

          <div className="text-[9px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded px-2 py-1">
            TARGET: <strong className="text-white">Cygnus X-1 Massive Binary System</strong> (21.2 M☉ BH + 14.8 M☉ Companion)
          </div>

          {/* Formulations & Physics Badges */}
          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            <div className="rounded bg-black/60 border border-cyan-950/70 p-1.5">
              <div className="text-slate-400">KERR SPIN PARAMETER</div>
              <div className="text-cyan-300 font-bold text-[11px]">
                a* = {frameDraggingMetrics?.kerrSpinParam.toFixed(3) ?? '0.942'}
              </div>
            </div>

            <div className="rounded bg-black/60 border border-cyan-950/70 p-1.5">
              <div className="text-slate-400">LENSE-THIRRING Ω_LT</div>
              <div className="text-purple-300 font-bold text-[11px]">
                {frameDraggingMetrics?.lenseThirringVelocityRadS ?? 1480} rad/s
              </div>
            </div>

            <div className="rounded bg-black/60 border border-cyan-950/70 p-1.5">
              <div className="text-slate-400">ERGOSPHERE RADIUS</div>
              <div className="text-rose-400 font-bold text-[11px]">
                r_E = 2.00 r_g
              </div>
            </div>

            <div className="rounded bg-black/60 border border-cyan-950/70 p-1.5">
              <div className="text-slate-400">GW QUADRUPOLE STRAIN</div>
              <div className="text-amber-300 font-bold text-[11px]">
                h_0 ~ 1.84×10⁻²¹
              </div>
            </div>
          </div>

          {/* Scientific Equation Display */}
          <div className="rounded bg-[#0c0618] border border-cyan-900/40 p-2 text-[9px] text-slate-300 space-y-1">
            <div className="text-cyan-400 font-bold">LENSE-THIRRING GEODESIC DRAG:</div>
            <div className="text-purple-200 font-mono text-[9.5px]">
              Ω_LT = (2 · G · J) / (c² · r³)
            </div>
            <div className="text-slate-400 text-[8.5px] leading-tight">
              Spacetime itself is dragged azimuthally into a dynamic vortex around the orbiting massive binary pair, twisting radial geodesics into spirals.
            </div>
          </div>

          {/* Interactive Kerr Spin Control */}
          <div className="rounded bg-black/50 border border-purple-950/60 p-2 flex flex-col gap-1 text-[9px]">
            <div className="flex justify-between text-slate-300">
              <span>ADJUST KERR SPIN a*</span>
              <span className="text-cyan-300 font-bold">{frameDraggingMetrics?.kerrSpinParam.toFixed(3) ?? '0.942'}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.998"
              step="0.005"
              value={frameDraggingMetrics?.kerrSpinParam ?? 0.942}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                relativisticRigRef.current?.setSpinParameter(val);
                setFrameDraggingMetrics((prev) =>
                  prev ? { ...prev, kerrSpinParam: val } : null
                );
              }}
              className="accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Action Navigation */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-cyan-950/50">
            <button
              onClick={flyToBinaryVortex}
              className="flex-1 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[9.5px] transition-colors flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
            >
              <span>Target Binary Vortex</span>
              <ChevronRight size={11} />
            </button>

            <button
              onClick={() => {
                soundFX.triggerTick();
                setShowFrameDragging(!showFrameDragging);
              }}
              className={`py-1 px-2 rounded border text-[9px] font-mono transition-colors ${
                showFrameDragging
                  ? 'border-cyan-700 bg-cyan-950/50 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              Grid: {showFrameDragging ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Filter & Orbit Navigation Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl border border-purple-900/60 bg-[#0c0618]/90 px-3.5 py-1 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.15)] font-mono text-[9.5px]">
        <Sliders size={12} className="text-purple-400 mr-0.5" />
        <button
          onClick={resetToGodsEye}
          className="px-2 py-0.5 rounded text-purple-300 hover:bg-purple-950/60 transition-colors"
        >
          RESET GOD&apos;S-EYE
        </button>
        <div className="h-3 w-px bg-purple-900/70 mx-0.5" />
        <span className="text-slate-400">
          SCALE:{' '}
          <strong className="text-purple-300">
            {viewScale === 'SURFACE_ATMOSPHERE' && '1. SURFACE & ATMO'}
            {viewScale === 'PLANETARY_ORRERY' && '2. PLANETARY ORRERY'}
            {viewScale === 'LOCAL_SPHERE' && '3. FIBONACCI SPHERE'}
            {viewScale === 'SPIRAL_GALAXY' && '4. SPIRAL GALAXY'}
            {viewScale === 'LOCAL_GROUP' && '5. LOCAL GROUP'}
            {viewScale === 'LANIAKEA_WEB' && '6. LANIAKEA WEB'}
          </strong>
        </span>
        <div className="h-3 w-px bg-purple-900/70 mx-0.5" />
        <span className="text-slate-400">
          NODES:{' '}
          <strong className="text-cyan-300">
            {viewScale === 'SURFACE_ATMOSPHERE' && 'SURFACE MESH'}
            {viewScale === 'PLANETARY_ORRERY' && '7 PLANETS + STAR'}
            {viewScale === 'LOCAL_SPHERE' && '2,600 NODES'}
            {viewScale === 'SPIRAL_GALAXY' && '16,500+ STARS'}
            {viewScale === 'LOCAL_GROUP' && '11,000 STARS'}
            {viewScale === 'LANIAKEA_WEB' && '13,500 CLUSTERS'}
          </strong>
        </span>
        <div className="h-3 w-px bg-purple-900/70 mx-0.5" />
        <span className="text-slate-400">
          RANGE: <strong className="text-amber-400">{cameraDistance} PC</strong>
        </span>

        {showFrameDragging && (
          <>
            <div className="h-3 w-px bg-cyan-900/70 mx-0.5" />
            <button
              onClick={() => {
                soundFX.triggerTick();
                setShowRelativisticHUD(!showRelativisticHUD);
              }}
              className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>FRAME DRAG: ON</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
