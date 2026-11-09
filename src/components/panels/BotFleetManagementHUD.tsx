import React, { useState } from 'react';
import {
  Bot,
  Network,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Zap,
  RefreshCw,
  CheckCircle2,
  Scale,
  Rocket,
  Flame,
  Atom,
  Radio,
  FileText,
  Activity,
  Layers,
  Award,
  MessageSquare,
} from 'lucide-react';
import { soundFX } from '../ui/AudioFeedback';
import { botOrchestrator } from '../../engine/botOrchestrator';
import { STELLA_CORES, runStellaSyndicateAudit } from '../../engine/stellaCoreEngine';
import CourtroomDebatePanel from './CourtroomDebatePanel';
import StellaInteractiveChatHUD from './StellaInteractiveChatHUD';

interface BotFleetManagementHUDProps {
  onSelectTarget?: (targetId: string) => void;
  onDeployRover?: (targetId: string) => void;
  initialSubTab?: 'TELEMETRY' | 'STELLA_NETWORK' | 'COURTROOM' | 'CHAT_RESEARCH';
  compactMode?: boolean;
}

export default function BotFleetManagementHUD({
  onSelectTarget,
  onDeployRover,
  initialSubTab = 'STELLA_NETWORK',
  compactMode = false,
}: BotFleetManagementHUDProps) {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'STELLA_NETWORK' | 'COURTROOM' | 'CHAT_RESEARCH'>(initialSubTab);
  const [selectedBot, setSelectedBot] = useState<string>('ASTRO_BOT');
  const [selectedStellaId, setSelectedStellaId] = useState<string>('STELLA_01');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const selectedStella = STELLA_CORES[selectedStellaId] || STELLA_CORES.STELLA_01;

  const bots = {
    KEPLER_BOT: {
      name: 'Kepler-Bot',
      role: 'Exoplanet Transit Sentinel',
      status: 'ACTIVE (TESS SECTOR 68 / 69)',
      icon: '🪐',
      tier: 'Data Scout',
      output:
        'Continuous Box Least Squares (BLS) period search across 2-min cadence TESS sectors. Flagged 1420 ppm periodic dip at P=4.2301 days. Transmitted light curve phase vector to Dr. Vesta.',
      linkTarget: 'Dr. Vesta (Lead Astrophysicist)',
      formulae: ['Box Least Squares SR = s² / (r(1-r))', 'Mandel-Agol Quadratic Limb Darkening'],
      stats: { metricA: '143 Scans', metricB: '5 Flags', metricC: '98.4% Efficiency' },
    },
    VOID_WATCHER: {
      name: 'Void-Watcher',
      role: 'Dark Anomaly & Dyson Swarm Scout',
      status: 'ACTIVE (WISE / GAIA DR3)',
      icon: '✨',
      tier: 'Data Scout',
      output:
        'Cross-matched 2MASS/WISE mid-IR photometries against Gaia DR3 stellar coordinates. Isolated non-thermal +3.42σ excess in W3 (12 µm) and W4 (22 µm) for target TIC-25155310.',
      linkTarget: 'Dr. Vesta (Lead Astrophysicist)',
      formulae: ['(W1 - W3) Color Excess Index', 'Rayleigh-Jeans Tail Departure'],
      stats: { metricA: '91 Scans', metricB: '2 Megastructures', metricC: '96.1% Efficiency' },
    },
    SETI_SENTINEL: {
      name: 'SETI-Sentinel',
      role: 'Radio Technosignature Analyst',
      status: 'ACTIVE (1.4 GHZ DOPPLER LOCK)',
      icon: '📡',
      tier: 'Data Scout',
      output:
        'Locked 1.8 Hz narrowband carrier with persistent -0.32 Hz/s linear Doppler shift matching topocentric orbital acceleration. Synchrotron galactic noise rejected.',
      linkTarget: 'Dr. Vesta (Lead Astrophysicist)',
      formulae: ['Breakthrough Listen Drift Filter', 'Shannon-Hartley SNR Threshold'],
      stats: { metricA: '312 Scans', metricB: '1 Carrier Lock', metricC: '99.2% Efficiency' },
    },
    JWST_SPECTRA: {
      name: 'JWST-Spectra-Bot',
      role: 'Atmospheric Transmission Chemist',
      status: 'ACTIVE (NIRSPEC 0.6–5.3 µm)',
      icon: '🔬',
      tier: 'Atmosphere Chemist',
      output:
        'Integrated transmission differential spectra during secondary eclipse. Detected simultaneous absorption peaks for CH4 (3.3 µm) and O3 (9.6 µm) disequilibrium in habitable zone candidate.',
      linkTarget: 'Dr. Vesta (Lead Astrophysicist)',
      formulae: ['Lambert-Beer Optical Depth τ(λ)', 'Atmospheric Scale Height H = kT / μg'],
      stats: { metricA: '74 Spectrograms', metricB: '3 Biosignatures', metricC: '97.8% Efficiency' },
    },
    OUMUAMUA_TRACKER: {
      name: 'Oumuamua-Tracker',
      role: 'Interstellar Astrometry Bot',
      status: 'ACTIVE (HYPERBOLIC APEX LOCK)',
      icon: '☄️',
      tier: 'Interstellar Scout',
      output:
        'Computed heliocentric orbital eccentricity e = 1.1995 (> 1.0) and non-gravitational outgassing acceleration vector A1 = 4.92×10⁻⁶ m/s². Traced entry vector to Solar Apex near Vega.',
      linkTarget: 'CNEOS-Doomsday-Sentinel',
      formulae: ['Vis-Viva Hyperbolic Velocity v² = GM(2/r + 1/a)', 'Eccentricity Vector e = (v×h)/GM - r/|r|'],
      stats: { metricA: '520 Objects', metricB: '2 Interstellar', metricC: '99.5% Efficiency' },
    },
    LIGO_RIPPLE: {
      name: 'LIGO-Ripple-Bot',
      role: 'Spacetime & Gravitational Wave Auditor',
      status: 'ACTIVE (LIGO-VIRGO 4π STERADIAN)',
      icon: '🌀',
      tier: 'Relativistic Core',
      output:
        'Matched-filter chirp bank correlated Quadrupole gravitational wave strain h(t) ~ 10⁻²¹. Flagged binary black hole inspiral 36 M_Sun + 29 M_Sun with sky localization 42 deg².',
      linkTarget: 'The Director Bot (Master Arbiter)',
      formulae: ['Chirp Mass M_c = (m1 m2)³⁄⁵ / (m1 + m2)¹⁄⁵', 'GW Quadrupole Strain h = 2(G/c⁴)(d²I/dt²)/r'],
      stats: { metricA: '198 Strains', metricB: '5 Mergers', metricC: '98.9% Efficiency' },
    },
    VASCO_ARCHIVIST: {
      name: 'Time-Domain-Archivist',
      role: 'Vanishing Star & Century Baseline Hunter',
      status: 'ACTIVE (1950 PALOMAR vs GAIA DR3)',
      icon: '🕰️',
      tier: 'Archive Scout',
      output:
        'Automated plate cross-matching of 1950s digitized Palomar Sky Survey photographic glass emulsions against Gaia DR3. Isolated 1 point source disappearance without supernova remnant.',
      linkTarget: 'Dr. Vesta (Lead Astrophysicist)',
      formulae: ['Century Baseline Proper Motion Delta', 'Supernova Remnant Shell Attenuation'],
      stats: { metricA: '412 Plates', metricB: '1 Vanishing Node', metricC: '95.3% Efficiency' },
    },
    CNEOS_SENTINEL: {
      name: 'CNEOS-Doomsday-Sentinel',
      role: 'Planetary Defense & Impact Risk Monitor',
      status: 'ACTIVE (RADAR COINCIDENCE)',
      icon: '🛡️',
      tier: 'Planetary Defense',
      output:
        'Continuous N-body gravitational ephemeris propagation of 34,000 Near-Earth Asteroids. Calculated 99942 Apophis 2029 close approach at 31,600 km with 0% impact probability.',
      linkTarget: 'Mission Command Registry',
      formulae: ['Torino & Palermo Technical Scale P = f(v, m, Δt)', 'Yarkovsky Thermal Radiation Drift'],
      stats: { metricA: '680 Trajectories', metricB: '0 Threat Left', metricC: '99.8% Efficiency' },
    },
    ASTRO_BOT: {
      name: 'Dr. Vesta (Lead Astrophysicist)',
      role: 'Chief Theoretical Arbiter',
      status: 'SYNCHRONIZED & AUDITING',
      icon: '👩‍🔬',
      tier: 'Physics Core',
      output:
        "Evaluated physical feasibility against Wien's Displacement Law, exoplanet bulk density limits (< 25 R_Earth), and Roche tidal disruption bounds. Certified 3 candidates as physically compliant.",
      linkTarget: 'The Director Bot (Master Arbiter)',
      formulae: ["Wien's Law λ_max = b / T", 'Roche Limit R_Roche = 2.44 * R* * (ρ*/ρ_p)^1/3'],
      stats: { metricA: '890 Audits', metricB: '100% Compliant', metricC: '99.9 Physics Score' },
    },
    DIRECTOR_BOT: {
      name: 'The Director Bot',
      role: 'Master Validation Arbiter & Chief Archivist',
      status: 'CERTIFYING NOVEL DISCOVERIES (85%+)',
      icon: '⚖️',
      tier: 'Supreme Arbiter',
      output:
        'Executed Gaia DR3, SIMBAD, and VizieR celestial cross-referencing. Purged 15 cosmic ray strikes and ground RFI events. Officially certified 3 novel discoveries with SHA-256 seal.',
      linkTarget: 'Global Discovery Registry',
      formulae: ['Gaia DR3 Astrometric Purity Verification', 'SIMBAD Catalog Cross-Match Exclusion'],
      stats: { metricA: '1,040 Audited', metricB: '15 Quashed', metricC: '3 Novel Certified' },
    },
  };

  const current = bots[selectedBot as keyof typeof bots] || bots.ASTRO_BOT;

  const handleRunFleetSync = () => {
    soundFX.triggerNeuralSync();
    setIsAuditing(true);
    setAuditMessage('Vegapunk Neural Bus: Synchronizing 7 Stella-Cores & 10 Autonomous Data Scouts...');

    setTimeout(() => {
      botOrchestrator.executeSweepCycle();
      soundFX.triggerPingSweep();
      setIsAuditing(false);
      setAuditMessage('Syndicate Consensus Achieved: 7 Stella-Cores Locked (99.4% Purity). Quantum pipeline online.');
    }, 900);
  };

  return (
    <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3 font-mono">
      {/* Top Header & Tri-Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-purple-950/40 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 via-purple-900 to-cyan-900 border border-purple-600/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Atom size={16} className="animate-spin text-amber-300" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 tracking-wider">
                7 STELLA-CORE VEGAPUNK NEURAL NETWORK
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-[9px] text-amber-300 font-bold">
                7 CORES + 10 BOTS ACTIVE
              </span>
            </div>
            <div className="text-[9px] text-slate-400">
              Einstein &bull; Feynman &bull; Sagan &bull; Newton &bull; Tesla &bull; Curie &bull; Pythagoras (Master Arbiter)
            </div>
          </div>
        </div>

        {/* View Switcher: Stella Network vs Fleet Topology vs Courtroom */}
        <div className="flex items-center gap-1 bg-black/70 p-1 rounded-xl border border-purple-900/60 text-[10px]">
          <button
            type="button"
            onClick={() => {
              soundFX.triggerNeuralSync();
              setActiveTab('STELLA_NETWORK');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'STELLA_NETWORK'
                ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Atom size={12} className="text-amber-300" />
            <span>7 Stella-Cores</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('TELEMETRY');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'TELEMETRY'
                ? 'bg-purple-900/80 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Bot size={12} />
            <span>10 Data Scouts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('COURTROOM');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'COURTROOM'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Scale size={12} className="text-cyan-300" />
            <span>Courtroom</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.triggerNeuralSync();
              setActiveTab('CHAT_RESEARCH');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'CHAT_RESEARCH'
                ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <MessageSquare size={12} className="text-amber-300" />
            <span>Chat With Minds</span>
          </button>
        </div>

        <button
          onClick={handleRunFleetSync}
          disabled={isAuditing}
          className="flex items-center gap-1.5 rounded-lg border border-purple-700/60 bg-purple-950/40 hover:bg-purple-900/60 px-2.5 py-1 text-[10px] text-purple-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={11} className={isAuditing ? 'animate-spin text-purple-400' : 'text-purple-400'} />
          <span>{isAuditing ? 'SYNCHRONIZING...' : 'SYNC ALL CORES'}</span>
        </button>
      </div>

      {/* Mode A: 7 Stella-Core Vegapunk Neural Network */}
      {activeTab === 'STELLA_NETWORK' && (
        <div className="flex flex-col gap-3">
          {/* Holographic Pulse Bus Linking all 7 Cores */}
          <div className="rounded-xl bg-black/60 border border-purple-900/40 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-purple-950/60 pb-1.5">
              <span className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>PULSING HOLOGRAPHIC STELLA BUS (REAL-TIME QUANTUM ENTANGLEMENT)</span>
              </span>
              <span className="text-cyan-300">ENTANGLEMENT COHERENCE: 99.8%</span>
            </div>

            {/* 7 Stella-Core Selector Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.values(STELLA_CORES).map((core) => {
                const isSelected = selectedStellaId === core.id;
                return (
                  <button
                    key={core.id}
                    type="button"
                    onClick={() => {
                      soundFX.triggerTick();
                      setSelectedStellaId(core.id);
                    }}
                    className={`rounded-xl p-2.5 text-left border flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                        : 'border-purple-950/60 bg-black/50 text-slate-400 hover:border-purple-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{core.icon}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="font-extrabold text-[10px] truncate text-slate-100">
                      {core.name.split(' ')[1]}
                    </div>
                    <div className="text-[8px] text-amber-300/80 truncate">
                      {core.id}
                    </div>
                    <div className="text-[7.5px] text-slate-500 font-mono truncate">
                      LOAD: {core.neuralLoadPct}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deep-Dive Inspector on Selected Stella Core */}
          <div className="rounded-xl border border-amber-900/60 bg-black/70 p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedStella.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{selectedStella.name}</span>
                    <span className="text-[9.5px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                      {selectedStella.avatarTitle}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    HISTORICAL ESSENCE: <strong className="text-purple-300">{selectedStella.historicalFigure}</strong> &bull; DOMAIN: {selectedStella.coreDomain}
                  </div>
                </div>
              </div>

              <span className="text-[9.5px] text-emerald-400 font-bold">
                {selectedStella.activeStatus}
              </span>
            </div>

            {/* Core Mathematical Law Equation */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-950/30 p-2.5 rounded-lg border border-purple-900/40 text-[10px]">
              <span className="text-slate-400 uppercase font-bold">GOVERNING MATHEMATICAL TENSOR:</span>
              <code className="text-amber-300 font-mono text-xs">{selectedStella.mathematicalEquation}</code>
            </div>

            {/* Active Syndicate Peer-Review Evaluation */}
            <div className="rounded-lg bg-black/60 p-3 border border-purple-950/60 text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-amber-300 font-mono">Live Theoretical Assessment: </strong>
              Cross-examining candidate anomalies against quantum field metrics and statistical equilibrium. Signals exceeding 7.0σ are certified with cryptographic SHA-256 validation for global preprint publishing.
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-purple-950/40">
              <span className="text-slate-500">NOBEL PRIZE CATEGORY:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Award size={12} className="text-amber-400" />
                <span>Nobel Prize in Physics &bull; Spacetime &amp; Technosignature Core</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mode B: Neural Cross-Examination Courtroom */}
      {activeTab === 'COURTROOM' && (
        <CourtroomDebatePanel
          onDeployRover={onDeployRover}
          onSelectTarget={onSelectTarget}
        />
      )}

      {/* Mode D: Interactive Chat with 7 Stella-Core Vegapunk Minds */}
      {activeTab === 'CHAT_RESEARCH' && (
        <div className="w-full">
          <StellaInteractiveChatHUD
            initialStellaId={selectedStellaId}
            compactMode={compactMode}
          />
        </div>
      )}

      {/* Mode C: 10 Data Scouts Topology */}
      {activeTab === 'TELEMETRY' && (
        <>
          {/* Interactive Topology Flow Graphic */}
          <div className="rounded-lg bg-black/40 border border-purple-950/30 p-2.5 flex items-center justify-between text-[10px] overflow-x-auto gap-2">
            <div className="flex items-center gap-1 shrink-0 flex-wrap max-w-[420px]">
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-cyan-900/50 text-cyan-300 text-[9px]">🪐 Kepler</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-900/50 text-amber-300 text-[9px]">✨ Void</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-violet-900/50 text-violet-300 text-[9px]">📡 SETI</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-emerald-900/50 text-emerald-300 text-[9px]">🔬 JWST</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-rose-900/50 text-rose-300 text-[9px]">☄️ 'Oumuamua</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-blue-900/50 text-blue-300 text-[9px]">🌀 LIGO</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-yellow-900/50 text-yellow-300 text-[9px]">🕰️ VASCO</span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-indigo-900/50 text-indigo-300 text-[9px]">🛡️ CNEOS</span>
            </div>

            <div className="flex items-center gap-1 text-purple-400 px-1 shrink-0">
              <ArrowRight size={12} className="animate-pulse" />
              <span className="text-[8.5px] text-purple-300/80 uppercase">Synthesis</span>
              <ArrowRight size={12} className="animate-pulse" />
            </div>

            <div className="shrink-0">
              <span className="px-2 py-1 rounded bg-purple-950/70 border border-purple-600 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)] text-[9.5px]">
                👩‍🔬 Dr. Vesta (Theory)
              </span>
            </div>

            <div className="flex items-center gap-1 text-purple-400 px-1 shrink-0">
              <ArrowRight size={12} />
              <span className="text-[8.5px] text-purple-300/80 uppercase">Arbitration</span>
              <ArrowRight size={12} />
            </div>

            <div className="shrink-0">
              <span className="px-2 py-1 rounded bg-indigo-950/70 border border-indigo-600 text-indigo-200 font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)] text-[9.5px]">
                ⚖️ Director Bot (Archivist)
              </span>
            </div>
          </div>

          {/* 10 Bot Selector Tabs (Grid of 5x2) */}
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(bots).map(([key, bot]) => {
              const isSelected = selectedBot === key;
              const isDrVesta = key === 'ASTRO_BOT';
              const isDirector = key === 'DIRECTOR_BOT';

              return (
                <button
                  key={key}
                  onClick={() => {
                    soundFX.triggerTick();
                    setSelectedBot(key);
                  }}
                  className={`rounded-lg p-2 text-left border transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? isDrVesta
                        ? 'border-purple-500 bg-purple-950/60 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                        : isDirector
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                        : 'border-cyan-500 bg-cyan-950/50 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'border-purple-950/30 bg-black/40 text-slate-400 hover:border-purple-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{bot.icon}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="font-bold text-[9.5px] truncate text-slate-200">
                    {bot.name.replace('-Bot', '').split(' ')[0]}
                  </div>
                  <div className="text-[8px] text-slate-500 truncate">{bot.tier}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Bot Deep-Dive Inspector */}
          <div className="rounded-lg border border-purple-950/40 bg-black/60 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{current.icon}</span>
                <span className="text-xs font-bold text-purple-200">{current.name}</span>
                <span className="text-[10px] text-slate-400">({current.role})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold">{current.status}</span>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.triggerTick();
                    setActiveTab('COURTROOM');
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-200 text-[9px] font-bold hover:bg-amber-900 cursor-pointer"
                >
                  <Scale size={10} />
                  <span>Cross-Examine</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 bg-purple-950/20 rounded-md p-2.5 border border-purple-900/30 leading-relaxed font-sans">
              <strong className="text-purple-300 font-mono">Live Pipeline Telemetry: </strong>
              {current.output}
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1">
              <span className="text-slate-500">MATHEMATICAL CHECKS:</span>
              <div className="flex gap-2 flex-wrap">
                {current.formulae.map((f, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-900/40 text-purple-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {auditMessage && (
        <div className="rounded bg-purple-950/60 border border-purple-700/60 px-3 py-1.5 text-[9.5px] text-purple-200 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>{auditMessage}</span>
        </div>
      )}
    </div>
  );
}
