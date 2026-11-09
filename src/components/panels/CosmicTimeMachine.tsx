import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Sparkles,
  Zap,
  Clock,
  Eye,
  Sliders,
  RotateCcw,
  ChevronRight,
  Maximize2,
  Atom,
  HelpCircle,
  Activity,
  Layers,
  Radio,
  Compass,
} from 'lucide-react';
import {
  COSMIC_EPOCHS,
  CosmicEpoch,
  calculateLookbackTimeGyr,
  calculateWavelengthShift,
  dewarpLensedCoordinate,
  calculateHubbleAtZ,
} from '../../engine/cosmicTimeMachineEngine';
import { soundFX } from '../ui/AudioFeedback';

interface CosmicTimeMachineProps {
  onFocusTarget?: (targetId: string) => void;
  compactMode?: boolean;
}

export default function CosmicTimeMachine({ compactMode = false }: CosmicTimeMachineProps) {
  // Modes: 'DE_WARPER' (3D Gravitational Optical Bench) vs 'CHRONO_SLIDER' (13.8 Gyr Time Machine)
  const [activeSubMode, setActiveSubMode] = useState<'DE_WARPER' | 'CHRONO_SLIDER'>('DE_WARPER');

  // De-Warper States
  const [dewarpFactor, setDewarpFactor] = useState<number>(0.0); // 0 = warped banana arcs, 1 = fully reconstructed
  const [lensMassLog, setLensMassLog] = useState<number>(14.2); // 10^14.2 M_sun galaxy cluster
  const [sourceRedshift, setSourceRedshift] = useState<number>(10.5); // JWST Little Red Dot baby galaxy
  const [isPlayingReconstruction, setIsPlayingReconstruction] = useState<boolean>(false);

  // Chrono-Slider States
  const [selectedRedshift, setSelectedRedshift] = useState<number>(8.5); // Default to JWST Little Red Dots
  const [selectedEpoch, setSelectedEpoch] = useState<CosmicEpoch>(COSMIC_EPOCHS[2]);

  // Three.js Canvas Reference
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Three.js Object References
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const lensClusterGroupRef = useRef<THREE.Group | null>(null);
  const sourceGalaxyMeshRef = useRef<THREE.Points | null>(null);
  const causticRingMeshRef = useRef<THREE.Mesh | null>(null);
  const lightRaysRef = useRef<THREE.LineSegments | null>(null);

  // Update selected epoch when slider changes
  useEffect(() => {
    let closest = COSMIC_EPOCHS[0];
    let minDiff = Math.abs(selectedRedshift - closest.redshift);
    for (const ep of COSMIC_EPOCHS) {
      const diff = Math.abs(selectedRedshift - ep.redshift);
      if (diff < minDiff) {
        minDiff = diff;
        closest = ep;
      }
    }
    setSelectedEpoch(closest);
  }, [selectedRedshift]);

  // Automated Reconstruction Animation Loop
  useEffect(() => {
    let animId = 0;
    if (isPlayingReconstruction) {
      soundFX.triggerPingSweep();
      const startTime = performance.now();
      const startFactor = dewarpFactor;
      const targetFactor = startFactor < 0.9 ? 1.0 : 0.0;
      const durationMs = 2400;

      const step = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1.0, elapsed / durationMs);
        // Smooth cubic ease-in-out
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const current = startFactor + (targetFactor - startFactor) * ease;
        setDewarpFactor(current);

        if (t < 1.0) {
          animId = requestAnimationFrame(step);
        } else {
          setIsPlayingReconstruction(false);
          soundFX.triggerTick();
        }
      };

      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlayingReconstruction]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030209');
    scene.fog = new THREE.FogExp2('#04020e', 0.0012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(0, 32, 130);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 15;
    controls.maxDistance = 600;
    controlsRef.current = controls;

    // Ambient & Accent Lights
    const ambientLight = new THREE.AmbientLight('#3b0764', 1.2);
    scene.add(ambientLight);

    const clusterLight = new THREE.PointLight('#fef08a', 2.5, 300);
    clusterLight.position.set(0, 0, 0);
    scene.add(clusterLight);

    const highZLight = new THREE.PointLight('#f43f5e', 3.0, 400);
    highZLight.position.set(0, 0, -85);
    scene.add(highZLight);

    // ==============================================================
    // 1. OPTICAL BENCH: OBSERVER (EARTH) ➔ LENS (CLUSTER) ➔ SOURCE (BABY GALAXY)
    // ==============================================================

    // Observer Node at Z = +80
    const obsGeom = new THREE.SphereGeometry(2.4, 20, 20);
    const obsMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const obsMesh = new THREE.Mesh(obsGeom, obsMat);
    obsMesh.position.set(0, 0, 80);
    scene.add(obsMesh);

    // Observer Sightline Reticle Ring
    const obsRingGeom = new THREE.RingGeometry(3.6, 4.2, 32);
    const obsRingMat = new THREE.MeshBasicMaterial({
      color: '#0284c7',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const obsRing = new THREE.Mesh(obsRingGeom, obsRingMat);
    obsRing.position.set(0, 0, 78);
    scene.add(obsRing);

    // Foreground Dark Matter Galaxy Cluster Lens at Z = 0
    const lensGroup = new THREE.Group();
    lensGroup.name = 'LENS_CLUSTER';
    scene.add(lensGroup);
    lensClusterGroupRef.current = lensGroup;

    // Brightest Cluster Galaxy (BCG) Core
    const bcgGeom = new THREE.SphereGeometry(4.2, 24, 24);
    const bcgMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const bcgMesh = new THREE.Mesh(bcgGeom, bcgMat);
    lensGroup.add(bcgMesh);

    // Satellite galaxies in cluster
    const clusterGalaxies = [
      { pos: [12, 6, -4], col: '#fde047', r: 1.8 },
      { pos: [-14, -5, 6], col: '#fbbf24', r: 1.6 },
      { pos: [6, -11, -2], col: '#fef08a', r: 1.5 },
      { pos: [-8, 9, 3], col: '#fed7aa', r: 1.4 },
    ];
    clusterGalaxies.forEach((cg) => {
      const g = new THREE.SphereGeometry(cg.r, 16, 16);
      const m = new THREE.MeshBasicMaterial({ color: cg.col });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(cg.pos[0], cg.pos[1], cg.pos[2]);
      lensGroup.add(mesh);
    });

    // Dark Matter Halo Caustic Envelope (Clean translucent white geodesic silk)
    const dmHaloGeom = new THREE.IcosahedronGeometry(26, 3);
    const dmHaloMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const dmHalo = new THREE.Mesh(dmHaloGeom, dmHaloMat);
    lensGroup.add(dmHalo);

    // Einstein Ring Critical Curve (Lensing Caustic Radius theta_E ~ 22 units)
    const einsteinRadius = 22.0;
    const causticGeom = new THREE.RingGeometry(einsteinRadius - 0.25, einsteinRadius + 0.25, 96);
    const causticMat = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const causticRing = new THREE.Mesh(causticGeom, causticMat);
    lensGroup.add(causticRing);
    causticRingMeshRef.current = causticRing;

    // ==============================================================
    // 2. WARPED BANANA ARCS ➔ DE-WARPED BABY GALAXY PARTICLES
    // ==============================================================
    const arcsGroup = new THREE.Group();
    arcsGroup.name = 'WARPED_AND_DEWARPED_ARCS';
    scene.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // Particle Cloud: 1,800 points simulating the high-redshift baby galaxy
    const POINT_COUNT = 1800;
    const arcPositions = new Float32Array(POINT_COUNT * 3);
    const arcColors = new Float32Array(POINT_COUNT * 3);

    // Initialize base points along lensed banana arcs (two giant arcs at top and bottom)
    const basePoints: { thetaX: number; thetaY: number; z: number; color: THREE.Color }[] = [];
    for (let i = 0; i < POINT_COUNT; i++) {
      const isTopArc = i < POINT_COUNT * 0.65;
      const angleCenter = isTopArc ? Math.PI / 2 : (3 * Math.PI) / 2;
      const angleSpread = isTopArc ? 1.45 : 0.95;
      const angle = angleCenter + (Math.random() - 0.5) * angleSpread;

      // Radial thickness near Einstein Ring
      const r = einsteinRadius + (Math.random() - 0.5) * 4.8;
      const thetaX = Math.cos(angle) * r;
      const thetaY = Math.sin(angle) * r;
      const zDepth = -60 + (Math.random() - 0.5) * 12;

      // Ruby red / warm orange color for high-z JWST baby galaxy (Little Red Dot)
      const colRand = Math.random();
      const col = colRand > 0.6 ? new THREE.Color('#f43f5e') : colRand > 0.25 ? new THREE.Color('#fb923c') : new THREE.Color('#fef08a');

      basePoints.push({ thetaX, thetaY, z: zDepth, color: col });

      arcPositions[i * 3] = thetaX;
      arcPositions[i * 3 + 1] = thetaY;
      arcPositions[i * 3 + 2] = zDepth;

      arcColors[i * 3] = col.r;
      arcColors[i * 3 + 1] = col.g;
      arcColors[i * 3 + 2] = col.b;
    }

    const arcGeom = new THREE.BufferGeometry();
    arcGeom.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
    arcGeom.setAttribute('color', new THREE.BufferAttribute(arcColors, 3));

    const arcMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sourceGalaxyMesh = new THREE.Points(arcGeom, arcMat);
    arcsGroup.add(sourceGalaxyMesh);
    sourceGalaxyMeshRef.current = sourceGalaxyMesh;

    // Optical Sightlines (Clean green & amber light paths connecting Earth ➔ Lens ➔ Source)
    const rayPositions: number[] = [];
    for (let r = 0; r < 36; r++) {
      const angle = (r / 36) * Math.PI * 2;
      const rx = Math.cos(angle) * einsteinRadius;
      const ry = Math.sin(angle) * einsteinRadius;

      // Ray 1: Observer (0, 0, 80) to Lens plane (rx, ry, 0)
      rayPositions.push(0, 0, 80, rx, ry, 0);
      // Ray 2: Lens plane (rx, ry, 0) bending back to Source plane (0, 0, -60)
      rayPositions.push(rx, ry, 0, 0, 0, -60);
    }

    const rayGeom = new THREE.BufferGeometry();
    rayGeom.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.25,
    });
    const lightRays = new THREE.LineSegments(rayGeom, rayMat);
    scene.add(lightRays);
    lightRaysRef.current = lightRays;

    // Main Render Loop
    let animId = 0;
    let isDisposed = false;
    let clock = performance.now();

    function renderLoop() {
      if (isDisposed) return;
      const now = performance.now();
      const delta = Math.min(0.1, (now - clock) / 1000);
      clock = now;

      controls.update();

      // Rotate Cluster & Halo
      if (lensClusterGroupRef.current) {
        lensClusterGroupRef.current.rotation.y += delta * 0.015;
      }
      if (causticRingMeshRef.current) {
        const pulse = 1.0 + Math.sin(now * 0.003) * 0.02;
        causticRingMeshRef.current.scale.set(pulse, pulse, pulse);
      }

      // Live De-Warp Vertex Morphing:
      // Smoothly morph base lensed points according to current dewarpFactor state
      if (sourceGalaxyMeshRef.current) {
        const posAttr = sourceGalaxyMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const curFactor = (window as any).__COSMIC_DEWARP_FACTOR ?? 0;

        for (let i = 0; i < POINT_COUNT; i++) {
          const bp = basePoints[i];
          const dewarped = dewarpLensedCoordinate(bp.thetaX, bp.thetaY, einsteinRadius, curFactor, 0.22);

          // In reconstructed mode (curFactor -> 1), pack tightly into baby galaxy spiral/core disk
          const targetZ = bp.z * (1 - curFactor) + (-65 + Math.sin(i * 0.1) * 2.0) * curFactor;

          posAttr.setXYZ(i, dewarped.x, dewarped.y, targetZ);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  // Sync state with global hook for Three.js render loop
  useEffect(() => {
    (window as any).__COSMIC_DEWARP_FACTOR = dewarpFactor;
  }, [dewarpFactor]);

  // Derived Lookback Time and Wavelength Shifts
  const currentLookback = calculateLookbackTimeGyr(selectedRedshift);
  const lyaShift = calculateWavelengthShift(121.6, selectedRedshift);
  const hAlphaShift = calculateWavelengthShift(656.3, selectedRedshift);
  const currentHz = calculateHubbleAtZ(selectedRedshift);
  const magnificationFactor = (1.0 / Math.max(0.04, 1.0 - dewarpFactor * 0.94)).toFixed(1);

  return (
    <div className="flex h-full w-full flex-col gap-2.5 rounded-xl border border-purple-950/60 bg-[#060312]/95 p-3.5 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.1)] font-mono text-xs overflow-hidden select-none">
      {/* Top Header & Sub-Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-950/60 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-rose-700 to-amber-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            <Clock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-purple-200 to-cyan-300 tracking-wider text-[11.5px]">
                COSMIC TIME MACHINE &amp; GRAVITATIONAL LENS DE-WARPER
              </span>
              <span className="rounded bg-rose-950/80 border border-rose-600/60 px-1.5 py-0.5 text-[8.5px] font-bold text-rose-300">
                GENERAL RELATIVITY OPTICS
              </span>
            </div>
            <div className="text-[9.5px] text-slate-400">
              Solve the Lens Equation &bull; Lookback Scrubbing across 13.8 Billion Years
            </div>
          </div>
        </div>

        {/* Sub-Mode Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-black/60 p-1 border border-purple-950/80 text-[10px]">
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveSubMode('DE_WARPER');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeSubMode === 'DE_WARPER'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Zap size={11} />
            <span>🔭 EINSTEIN RING DE-WARPER</span>
          </button>
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveSubMode('CHRONO_SLIDER');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeSubMode === 'CHRONO_SLIDER'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Clock size={11} />
            <span>⏳ 13.8 GYR COSMIC CHRONO-SLIDER</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: 3D Viewport on Left, Interactive Telemetry & Controls on Right */}
      <div className="flex flex-1 flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Left Column: 3D WebGL Optical Bench Canvas */}
        <div className="relative flex-1 rounded-xl border border-purple-950/60 bg-[#03010a] overflow-hidden min-h-[300px]">
          <div ref={canvasContainerRef} className="absolute inset-0 h-full w-full" />

          {/* Canvas HUD Overlays */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
            <span className="rounded bg-black/80 px-2 py-0.5 text-[9px] text-cyan-300 border border-cyan-800/60 font-mono">
              OPTICAL BENCH: [EARTH z=0] ➔ [CLUSTER LENS z=0.4] ➔ [BABY GALAXY z={sourceRedshift}]
            </span>
            <span className="rounded bg-black/80 px-2 py-0.5 text-[8.5px] text-purple-300 border border-purple-900/60 font-mono">
              LENS EQUATION: &beta; = &theta; - &alpha;(&theta;) &bull; MAGNIFICATION: <strong className="text-amber-300">{magnificationFactor}&times;</strong>
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <button
              onClick={() => {
                controlsRef.current?.reset();
                cameraRef.current?.position.set(0, 32, 130);
                soundFX.triggerTick();
              }}
              title="Reset Optical Bench Camera"
              className="flex items-center gap-1 rounded-lg bg-black/80 border border-purple-900/70 px-2 py-1 text-[9px] text-purple-200 hover:bg-purple-950 transition-colors"
            >
              <RotateCcw size={10} />
              <span>RESET BENCH</span>
            </button>
          </div>

          {/* Bottom Overlay: De-Warp Reconstruction Status Badge */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between rounded-lg bg-black/85 border border-purple-900/60 px-3 py-1.5 backdrop-blur-md text-[9.5px]">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dewarpFactor > 0.85 ? 'bg-emerald-400 animate-pulse' : dewarpFactor > 0.15 ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className="text-slate-300">
                STATE:{' '}
                <strong className={dewarpFactor > 0.85 ? 'text-emerald-300' : dewarpFactor > 0.15 ? 'text-amber-300' : 'text-rose-300'}>
                  {dewarpFactor > 0.85 ? 'PRISTINE RECONSTRUCTED BABY GALAXY' : dewarpFactor > 0.15 ? 'INVERSE SOLVER IN PROGRESS' : 'WARPED EINSTEIN BANANA ARCS'}
                </strong>
              </span>
            </div>
            <div className="text-cyan-300 font-bold">
              SOLVER CONVERGENCE: {Math.round(dewarpFactor * 100)}%
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Controls & Physics Narratives */}
        <div className="w-full lg:w-96 flex flex-col gap-2.5 overflow-y-auto pr-1">
          {/* TAB 1: EINSTEIN RING DE-WARPER CONTROLS */}
          {activeSubMode === 'DE_WARPER' && (
            <div className="flex flex-col gap-2.5">
              {/* De-Warp AI Slider Card */}
              <div className="rounded-xl border border-rose-900/60 bg-[#0d071a]/95 p-3 flex flex-col gap-2 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-300 text-[10.5px] flex items-center gap-1.5">
                    <Zap size={12} className="text-rose-400" />
                    <span>⚡ AI INVERSE DE-WARP SOLVER</span>
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-300">
                    {Math.round(dewarpFactor * 100)}% UN-WARPED
                  </span>
                </div>

                <div className="text-[9px] text-slate-400 leading-relaxed">
                  Solves the ray-tracing deflection equation &beta; = &theta; - &alpha;(&theta;). Pull the slider to continuously un-warp the smeared banana arcs into the pristine 3D ancient galaxy.
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dewarpFactor}
                  onChange={(e) => {
                    setDewarpFactor(parseFloat(e.target.value));
                    soundFX.triggerTick();
                  }}
                  className="accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer w-full mt-1"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsPlayingReconstruction(true);
                    }}
                    disabled={isPlayingReconstruction}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-[9.5px] transition-all flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={11} />
                    <span>Auto-Reconstruct Proto-Galaxy</span>
                  </button>

                  <button
                    onClick={() => {
                      setDewarpFactor(dewarpFactor > 0.5 ? 0 : 1);
                      soundFX.triggerTick();
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-purple-800 bg-purple-950/60 hover:bg-purple-900 text-purple-200 text-[9.5px] font-bold transition-colors cursor-pointer"
                  >
                    {dewarpFactor > 0.5 ? 'Show Warped' : 'De-Warp'}
                  </button>
                </div>
              </div>

              {/* Lensing Physical Metrics */}
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="rounded bg-black/60 border border-purple-950/80 p-2">
                  <div className="text-slate-400">CLUSTER DARK MATTER MASS</div>
                  <div className="text-amber-300 font-bold text-[10.5px]">1.58 &times; 10¹⁴ M☉</div>
                  <div className="text-[8px] text-slate-500">M_200 NFW Profile</div>
                </div>
                <div className="rounded bg-black/60 border border-purple-950/80 p-2">
                  <div className="text-slate-400">EINSTEIN RADIUS &theta;_E</div>
                  <div className="text-cyan-300 font-bold text-[10.5px]">22.4 arcsec</div>
                  <div className="text-[8px] text-slate-500">Critical Caustic Ring</div>
                </div>
                <div className="rounded bg-black/60 border border-purple-950/80 p-2">
                  <div className="text-slate-400">TARGET BABY REDSHIFT</div>
                  <div className="text-rose-400 font-bold text-[10.5px]">z = {sourceRedshift}</div>
                  <div className="text-[8px] text-slate-500">~13.38 Gyr Lookback</div>
                </div>
                <div className="rounded bg-black/60 border border-purple-950/80 p-2">
                  <div className="text-slate-400">GRAVITATIONAL ZOOM</div>
                  <div className="text-emerald-300 font-bold text-[10.5px]">{magnificationFactor}&times; BOOST</div>
                  <div className="text-[8px] text-slate-500">Cosmic Telescope Power</div>
                </div>
              </div>

              {/* Theoretical Narrative Box */}
              <div className="rounded-xl border border-purple-900/50 bg-[#080314]/90 p-3 text-[9.5px] text-slate-300 space-y-1.5 font-sans leading-relaxed">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-amber-300">
                  <Atom size={12} className="text-amber-400" />
                  <span>How Nature&apos;s Telescope Works:</span>
                </div>
                <p>
                  Foreground galaxy clusters bend starlight through general relativistic spacetime curvature (<span className="font-mono text-purple-300">G_&mu;&nu; = 8&pi;T_&mu;&nu;</span>). The intervening Dark Matter acts as an enormous natural magnifying lens, smearing ancient baby galaxies into banana-shaped Einstein arcs while boosting their faint photon flux by up to <strong>50&times;</strong>!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 13.8 GYR COSMIC CHRONO-SLIDER */}
          {activeSubMode === 'CHRONO_SLIDER' && (
            <div className="flex flex-col gap-2.5">
              {/* Chrono-Slider Card */}
              <div className="rounded-xl border border-cyan-900/60 bg-[#050816]/95 p-3 flex flex-col gap-2 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-300 text-[10.5px] flex items-center gap-1.5">
                    <Clock size={12} className="text-cyan-400" />
                    <span>SCRUB LOOKBACK TIME &amp; REDSHIFT (z)</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    z = {selectedRedshift.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Modern (z=0)</span>
                  <span>Cosmic Noon (z=2)</span>
                  <span>Little Red Dots (z=8.5)</span>
                  <span>Dawn (z=16)</span>
                  <span>CMB (z=1100)</span>
                </div>

                {/* Non-linear Redshift Slider */}
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={selectedRedshift > 20 ? 20 : selectedRedshift}
                  onChange={(e) => {
                    setSelectedRedshift(parseFloat(e.target.value));
                    soundFX.triggerTick();
                  }}
                  className="accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer w-full"
                />

                {/* Quick Epoch Preset Buttons */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[8.5px]">
                  {COSMIC_EPOCHS.map((epoch) => {
                    const active = selectedEpoch.id === epoch.id;
                    return (
                      <button
                        key={epoch.id}
                        onClick={() => {
                          setSelectedRedshift(epoch.redshift);
                          setSelectedEpoch(epoch);
                          soundFX.triggerPingSweep();
                        }}
                        className={`p-1 rounded text-center truncate border transition-all cursor-pointer ${
                          active
                            ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                            : 'border-slate-800 bg-black/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                        title={epoch.name}
                      >
                        {epoch.name.split(' (')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cosmological Wavelength Stretching Visualizer */}
              <div className="rounded-xl border border-purple-950/70 bg-black/60 p-2.5 flex flex-col gap-1.5 text-[9px]">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>COSMOLOGICAL REDSHIFT STRETCHING</span>
                  <span className="text-slate-400">&lambda;_obs = &lambda;_emit &times; (1 + z)</span>
                </div>

                <div className="rounded bg-black/80 border border-purple-900/40 p-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">UV Lyman-&alpha; (121.6 nm):</span>
                    <strong className="text-amber-300">{lyaShift.observedWavelengthNm} nm ({lyaShift.observedBandName})</strong>
                  </div>
                  <div className="text-[8px] text-purple-300">
                    &bull; Detected by: <strong className="text-white">{lyaShift.jwstInstrument}</strong>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-purple-950/60">
                    <span className="text-slate-400">Optical H-&alpha; (656.3 nm):</span>
                    <strong className="text-rose-300">{(hAlphaShift.observedWavelengthNm / 1000).toFixed(2)} &micro;m ({hAlphaShift.observedBandName})</strong>
                  </div>
                  <div className="text-[8px] text-purple-300">
                    &bull; Detected by: <strong className="text-white">{hAlphaShift.jwstInstrument}</strong>
                  </div>
                </div>
              </div>

              {/* Einstein & Sagan Narrator Cards */}
              <div className="rounded-xl border border-amber-900/50 bg-[#0d071a]/95 p-3 flex flex-col gap-2 font-sans text-[9.5px] leading-relaxed">
                {/* Einstein Briefing */}
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none">🧠</span>
                  <div>
                    <strong className="text-amber-300 font-mono text-[10px]">Albert Einstein:</strong>
                    <p className="text-slate-300 mt-0.5 italic">&ldquo;{selectedEpoch.einsteinNarration}&rdquo;</p>
                  </div>
                </div>

                {/* Sagan Briefing */}
                <div className="flex items-start gap-2 pt-2 border-t border-purple-950/60">
                  <span className="text-lg leading-none">✨</span>
                  <div>
                    <strong className="text-cyan-300 font-mono text-[10px]">Carl Sagan:</strong>
                    <p className="text-slate-300 mt-0.5 italic">&ldquo;{selectedEpoch.saganNarration}&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
