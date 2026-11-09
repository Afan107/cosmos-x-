import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Globe2,
  AlertTriangle,
  Flame,
  Sun,
  Layers,
  Thermometer,
} from 'lucide-react';
import { soundFX } from '../ui/AudioFeedback';

interface Body {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
  isPerturber?: boolean;
}

export default function PhysicsSandbox() {
  const [activeTab, setActiveTab] = useState<'N_BODY' | 'TERRAFORMING'>('N_BODY');

  // ==========================================
  // 1. N-BODY GRAVITY SIMULATOR STATES
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [gravityG, setGravityG] = useState(1.0);
  const [timeStep, setTimeStep] = useState(0.5);
  const [perturbationCount, setPerturbationCount] = useState(0);

  const bodiesRef = useRef<Body[]>([]);

  const initNBodySystem = () => {
    bodiesRef.current = [
      // Central Star (Mass 500)
      {
        id: 'star',
        name: 'Host Star',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 600,
        radius: 12,
        color: '#fbbf24',
        trail: [],
      },
      // Planet 1 (Inner Terrestrial)
      {
        id: 'p1',
        name: 'Vulcan (Inner)',
        x: 65,
        y: 0,
        vx: 0,
        vy: 3.0,
        mass: 1.5,
        radius: 4,
        color: '#f87171',
        trail: [],
      },
      // Planet 2 (Habitable Candidate)
      {
        id: 'p2',
        name: 'Terranova (Goldilocks)',
        x: 110,
        y: 0,
        vx: 0,
        vy: 2.3,
        mass: 2.2,
        radius: 5,
        color: '#38bdf8',
        trail: [],
      },
      // Planet 3 (Gas Giant)
      {
        id: 'p3',
        name: 'Jovian Prime',
        x: 175,
        y: 0,
        vx: 0,
        vy: 1.82,
        mass: 14.0,
        radius: 8,
        color: '#c084fc',
        trail: [],
      },
      // Planet 4 (Outer Ice World)
      {
        id: 'p4',
        name: 'Cryo-Minor',
        x: 235,
        y: 0,
        vx: 0,
        vy: 1.58,
        mass: 3.0,
        radius: 5,
        color: '#22d3ee',
        trail: [],
      },
    ];
  };

  useEffect(() => {
    initNBodySystem();
  }, []);

  // N-Body Gravitational Physics Loop
  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (isPlaying) {
        const bodies = bodiesRef.current;
        const dt = 0.15 * timeStep;

        // Gravitational interaction: F = G * m1 * m2 / (r^2 + epsilon^2)
        const softening = 8.0;
        for (let i = 0; i < bodies.length; i++) {
          let fx = 0;
          let fy = 0;
          const b1 = bodies[i];

          for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const b2 = bodies[j];
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distSq = dx * dx + dy * dy + softening * softening;
            const dist = Math.sqrt(distSq);
            const force = (gravityG * b1.mass * b2.mass) / distSq;

            fx += force * (dx / dist);
            fy += force * (dy / dist);
          }

          // Acceleration a = F / m
          const ax = fx / b1.mass;
          const ay = fy / b1.mass;

          b1.vx += ax * dt;
          b1.vy += ay * dt;
        }

        // Position update and trail recording
        for (const b of bodies) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 55) {
            b.trail.shift();
          }
        }
      }

      // Draw onto canvas
      ctx.fillStyle = '#030208';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Habitable Zone green ring on canvas
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 26;
      ctx.stroke();
      ctx.restore();

      // Draw Orbit Trails & Bodies
      for (const b of bodiesRef.current) {
        // Trail
        if (b.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(cx + b.trail[0].x, cy + b.trail[0].y);
          for (let k = 1; k < b.trail.length; k++) {
            ctx.lineTo(cx + b.trail[k].x, cy + b.trail[k].y);
          }
          ctx.strokeStyle = b.isPerturber ? 'rgba(239, 68, 68, 0.6)' : `${b.color}44`;
          ctx.lineWidth = b.isPerturber ? 2 : 1.2;
          ctx.stroke();
        }

        // Body Sphere
        ctx.beginPath();
        ctx.arc(cx + b.x, cy + b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.radius * 2;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(b.name, cx + b.x + b.radius + 3, cy + b.y + 3);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gravityG, timeStep]);

  // Inject Rogue Black Hole Perturber
  const injectRogueBlackHole = () => {
    soundFX.triggerAnomalyKlaxon();
    setPerturbationCount((c) => c + 1);
    const newPerturber: Body = {
      id: `bh-${Date.now()}`,
      name: 'ROGUE BLACK HOLE (10 M☉)',
      x: -240,
      y: (Math.random() - 0.5) * 140,
      vx: 1.8 + Math.random() * 0.6,
      vy: (Math.random() - 0.5) * 1.5,
      mass: 380,
      radius: 9,
      color: '#ef4444',
      trail: [],
      isPerturber: true,
    };
    bodiesRef.current.push(newPerturber);
  };

  // Inject Super-Jupiter Perturber
  const injectSuperJupiter = () => {
    soundFX.triggerPingSweep();
    setPerturbationCount((c) => c + 1);
    const newJup: Body = {
      id: `sj-${Date.now()}`,
      name: 'HYPERBOLIC SUPER-JUPITER',
      x: 240,
      y: (Math.random() - 0.5) * 120,
      vx: -1.9 - Math.random() * 0.4,
      vy: (Math.random() - 0.5) * 1.2,
      mass: 65,
      radius: 7,
      color: '#f97316',
      trail: [],
      isPerturber: true,
    };
    bodiesRef.current.push(newJup);
  };

  // ==========================================
  // 2. TERRAFORMING & DYSON SWARM BUILDER STATES
  // ==========================================
  const [semiMajorAxisAU, setSemiMajorAxisAU] = useState(1.0);
  const [stellarLuminosity, setStellarLuminosity] = useState(1.0);
  const [surfaceAlbedo, setSurfaceAlbedo] = useState(0.3);
  const [greenhouseBars, setGreenhouseBars] = useState(1.0);
  const [dysonCoveringPct, setDysonCoveringPct] = useState(14.8);

  // Physical calculations:
  // Solar constant S = 1361 W/m^2 * (L / d^2)
  const insolation = stellarLuminosity / (semiMajorAxisAU * semiMajorAxisAU);
  // Equilibrium temperature T_eq = 278.5 * ( (L * (1 - A)) / d^2 )^0.25 (K)
  const teqKelvin = Math.round(
    278.5 * Math.pow((stellarLuminosity * (1 - surfaceAlbedo)) / (semiMajorAxisAU * semiMajorAxisAU), 0.25)
  );
  // Greenhouse surface temperature T_surf = T_eq * (1 + 0.75 * tau)^0.25 where optical depth tau ~= 0.8 * greenhouseBars
  const opticalDepth = 0.8 * greenhouseBars;
  const tsurfKelvin = Math.round(teqKelvin * Math.pow(1 + 0.75 * opticalDepth, 0.25));
  const tsurfCelsius = tsurfKelvin - 273;

  const isLiquidWater = tsurfCelsius >= 0 && tsurfCelsius <= 100;

  // WISE Mid-IR flux excess from Dyson Swarm
  // Excess flux (microJansky) roughly proportional to covering fraction * stellar luminosity
  const wiseW3FluxExcess = Math.round((dysonCoveringPct / 100) * stellarLuminosity * 1420);
  const wiseW4FluxExcess = Math.round((dysonCoveringPct / 100) * stellarLuminosity * 3850);

  return (
    <div className="flex flex-col h-full bg-[#030208] text-slate-200 rounded-xl border border-purple-900/50 p-4 font-mono shadow-[0_0_35px_rgba(168,85,247,0.12)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-950/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sliders size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-purple-200 tracking-wider">
                INTERACTIVE ASTROPHYSICS & WHAT-IF SANDBOX
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/50">
                TIER 4 SIMULATOR
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Live orbital mechanics, rogue perturber collisions, and Dyson Swarm thermodynamic engineering
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-black/70 p-1 border border-purple-950/80 text-[10.5px]">
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('N_BODY');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'N_BODY'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Zap size={12} />
            <span>N-BODY GRAVITY SIMULATOR</span>
          </button>
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('TERRAFORMING');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'TERRAFORMING'
                ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Thermometer size={12} />
            <span>TERRAFORMING & DYSON SWARM BUILDER</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox View */}
      <div className="flex-1 mt-3 overflow-y-auto">
        {/* ============================================================== */}
        {/* TAB 1: N-BODY GRAVITY SIMULATOR */}
        {/* ============================================================== */}
        {activeTab === 'N_BODY' && (
          <div className="flex flex-col gap-3">
            {/* Control Strip */}
            <div className="rounded-xl bg-[#070312] border border-purple-950/80 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFX.triggerTick();
                    setIsPlaying(!isPlaying);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 text-xs flex items-center gap-1.5 font-bold"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? 'PAUSE SIM' : 'RESUME'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.triggerTick();
                    initNBodySystem();
                    setPerturbationCount(0);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-purple-950 text-slate-300 border border-purple-950 text-xs flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  <span>RESET ORBITS</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10.5px]">Gravitational Constant G:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.1"
                    value={gravityG}
                    onChange={(e) => setGravityG(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500"
                  />
                  <span className="text-purple-300 font-bold">{gravityG.toFixed(1)}×</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10.5px]">Simulation Speed:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={timeStep}
                    onChange={(e) => setTimeStep(parseFloat(e.target.value))}
                    className="w-24 accent-cyan-500"
                  />
                  <span className="text-cyan-300 font-bold">{timeStep.toFixed(1)}×</span>
                </div>
              </div>

              {/* Injection Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={injectRogueBlackHole}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/70 text-rose-200 text-xs flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                >
                  <AlertTriangle size={12} className="text-rose-400" />
                  <span>INJECT ROGUE BLACK HOLE</span>
                </button>

                <button
                  onClick={injectSuperJupiter}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/70 text-amber-200 text-xs flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>INJECT SUPER-JUPITER</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="relative w-full h-[400px] rounded-xl border border-purple-950/80 bg-[#030208] overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />

              {/* Overlay HUD indicators */}
              <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 text-[10px] font-mono">
                <div className="px-2 py-0.5 rounded bg-black/70 border border-purple-900/60 text-purple-300">
                  Active Bodies: <strong>{bodiesRef.current.length}</strong>
                </div>
                <div className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                  Green Zone: Habitable Zone (Kopparapu limit)
                </div>
                {perturbationCount > 0 && (
                  <div className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-800/80 text-rose-300 animate-pulse font-bold">
                    PERTURBER ACTIVE: {perturbationCount} INJECTED
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TERRAFORMING & DYSON SWARM BUILDER */}
        {/* ============================================================== */}
        {activeTab === 'TERRAFORMING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Sliders & Controls */}
            <div className="rounded-xl border border-purple-950/80 bg-[#070312] p-4 flex flex-col gap-4">
              <span className="font-extrabold text-sm text-purple-200 border-b border-purple-950/60 pb-2">
                Circumstellar & Atmospheric Tuning Parameters
              </span>

              {/* Slider 1: Distance */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Semi-Major Axis (Orbital Distance):</span>
                  <span className="text-cyan-300 font-bold">{semiMajorAxisAU.toFixed(2)} AU</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={semiMajorAxisAU}
                  onChange={(e) => setSemiMajorAxisAU(parseFloat(e.target.value))}
                  className="accent-cyan-500"
                />
              </div>

              {/* Slider 2: Stellar Luminosity */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Host Star Luminosity:</span>
                  <span className="text-amber-300 font-bold">{stellarLuminosity.toFixed(2)} L☉</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={stellarLuminosity}
                  onChange={(e) => setStellarLuminosity(parseFloat(e.target.value))}
                  className="accent-amber-500"
                />
              </div>

              {/* Slider 3: Surface Albedo */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Surface Planetary Albedo (α):</span>
                  <span className="text-purple-300 font-bold">{surfaceAlbedo.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.85"
                  step="0.05"
                  value={surfaceAlbedo}
                  onChange={(e) => setSurfaceAlbedo(parseFloat(e.target.value))}
                  className="accent-purple-500"
                />
              </div>

              {/* Slider 4: Atmospheric Pressure & Greenhouse */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Atmospheric Greenhouse Pressure:</span>
                  <span className="text-emerald-300 font-bold">{greenhouseBars.toFixed(1)} bar</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.1"
                  value={greenhouseBars}
                  onChange={(e) => setGreenhouseBars(parseFloat(e.target.value))}
                  className="accent-emerald-500"
                />
              </div>

              {/* Slider 5: Dyson Swarm Covering Fraction */}
              <div className="flex flex-col gap-1 pt-2 border-t border-purple-950/60">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>Dyson Swarm Covering Fraction:</span>
                  </span>
                  <span className="text-amber-400 font-bold">{dysonCoveringPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="100.0"
                  step="0.5"
                  value={dysonCoveringPct}
                  onChange={(e) => setDysonCoveringPct(parseFloat(e.target.value))}
                  className="accent-amber-400"
                />
              </div>
            </div>

            {/* Right Column: Live Thermodynamics & WISE Diagnostic */}
            <div className="rounded-xl border border-purple-950/80 bg-[#070312] p-4 flex flex-col justify-between gap-4">
              <div>
                <span className="font-extrabold text-sm text-purple-200 border-b border-purple-950/60 pb-2 block">
                  Live Planetary & Infrared Thermodynamics
                </span>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded bg-black/50 border border-purple-950/60 p-2.5">
                    <div className="text-[10px] text-slate-500">EQUILIBRIUM TEMP (T_eq)</div>
                    <div className="text-lg font-bold text-cyan-300">{teqKelvin} K</div>
                    <div className="text-[9.5px] text-slate-400">{teqKelvin - 273}°C</div>
                  </div>

                  <div className="rounded bg-black/50 border border-purple-950/60 p-2.5">
                    <div className="text-[10px] text-slate-500">SURFACE TEMP (T_surf)</div>
                    <div
                      className={`text-lg font-bold ${
                        isLiquidWater ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tsurfKelvin} K
                    </div>
                    <div className="text-[9.5px] text-slate-400">{tsurfCelsius}°C</div>
                  </div>

                  <div className="rounded bg-black/50 border border-purple-950/60 p-2.5">
                    <div className="text-[10px] text-slate-500">INSOLATION FLUX</div>
                    <div className="text-base font-bold text-amber-300">{insolation.toFixed(2)} S☉</div>
                    <div className="text-[9.5px] text-slate-400">Earth equivalent: 1.00</div>
                  </div>

                  <div className="rounded bg-black/50 border border-purple-950/60 p-2.5">
                    <div className="text-[10px] text-slate-500">HABITABILITY STATUS</div>
                    <div
                      className={`text-xs font-bold mt-1 ${
                        isLiquidWater ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isLiquidWater ? 'LIQUID WATER STABLE' : tsurfCelsius < 0 ? 'FROZEN GLACIAL' : 'RUNAWAY STEAM'}
                    </div>
                  </div>
                </div>

                {/* Dyson Swarm Mid-IR Excess Box */}
                <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-900/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Flame size={13} />
                      <span>WISE Mid-IR Radiative Excess Signature</span>
                    </span>
                    <span className="text-[9.5px] text-amber-400 font-mono">
                      Waste Heat: {Math.round(dysonCoveringPct * 3.828)} × 10²⁴ W
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/60 rounded p-1.5">
                      <span className="text-[9.5px] text-slate-400">WISE W3 (12 µm):</span>
                      <div className="text-amber-300 font-bold">+{wiseW3FluxExcess} µJy excess</div>
                    </div>
                    <div className="bg-black/60 rounded p-1.5">
                      <span className="text-[9.5px] text-slate-400">WISE W4 (22 µm):</span>
                      <div className="text-amber-300 font-bold">+{wiseW4FluxExcess} µJy excess</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-purple-950/60 text-xs text-slate-300 font-sans leading-relaxed">
                {isLiquidWater
                  ? 'Thermodynamic equilibrium confirmed: Surface temperatures support open oceans, hydrological cycles, and potential photosynthesis or chemosynthetic marine ecosystems.'
                  : tsurfCelsius < 0
                  ? 'Planetary conditions are below freezing (Snowball planet). Albedo feedback traps cold. Consider increasing greenhouse gases or migrating closer to the host star.'
                  : 'Atmospheric runaway greenhouse state triggered. Oceans have vaporized into the upper atmosphere, causing rapid hydrogen loss via UV photolysis.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
