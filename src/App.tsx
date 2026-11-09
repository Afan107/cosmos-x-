import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Radio,
  Terminal,
  Volume2,
  VolumeX,
  AlertTriangle,
  Bot,
  ShieldCheck,
  Compass,
  Star,
  Search,
  ChevronRight,
  Database,
  Crosshair,
  Layers,
  Sparkles,
  Network,
  LayoutGrid,
  Maximize2,
  Navigation,
  Satellite,
  Sliders,
  FileText,
  User,
  Globe,
  Edit2,
  Check,
  X,
  Rocket,
  Cpu,
  Flame,
} from 'lucide-react';
import {
  CATALOG_STARS,
  CATALOG_ANOMALIES,
  CatalogTarget,
  CatalogAnomaly,
} from './data/astronomicalCatalog';
import HolographicStarMap from './components/canvas/HolographicStarMap';
import CosmicSurfaceExplorer from './components/canvas/CosmicSurfaceExplorer';
import D3AnomalyHeatmap from './components/charts/D3AnomalyHeatmap';
import LightCurveViewer from './components/charts/LightCurveViewer';
import AnomalyRadar from './components/panels/AnomalyRadar';
import BotTelemetryHUD from './components/panels/BotTelemetryHUD';
import DirectorHUD from './components/panels/DirectorHUD';
import AstrobiologistAI from './components/panels/AstrobiologistAI';
import BotFleetManagementHUD from './components/panels/BotFleetManagementHUD';
import CockpitView from './components/views/CockpitView';
import CosmicExplainerCard from './components/panels/CosmicExplainerCard';
import NasaLiveStreamsHUD from './components/panels/NasaLiveStreamsHUD';
import PhysicsSandbox from './components/panels/PhysicsSandbox';
import ScientificPaperDossier from './components/panels/ScientificPaperDossier';
import HiddenOpsModal from './components/panels/HiddenOpsModal';
import AIDiscoveryPipelineHUD from './components/panels/AIDiscoveryPipelineHUD';
import WarpDriveTransition from './components/ui/WarpDriveTransition';
import { soundFX } from './components/ui/AudioFeedback';
import { citizenRegistry } from './engine/citizenRegistry';
import { hiddenOps } from './engine/hiddenOpsBots';

export type AppMode =
  | 'OBSERVATORY'
  | 'HEATMAP'
  | 'SURFACE_EXPLORER'
  | 'TRANSIT'
  | 'FLEET_AUDIT'
  | 'AI_DISCOVERY'
  | 'ASTRA'
  | 'NASA_PIPES'
  | 'PHYSICS_SANDBOX'
  | 'DOSSIER'
  | 'COCKPIT';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CatalogTarget>(CATALOG_STARS[0]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<CatalogAnomaly>(CATALOG_ANOMALIES[0]);
  const [activeMode, setActiveMode] = useState<AppMode>('OBSERVATORY');
  const [observatorySubView, setObservatorySubView] = useState<'3D_MAP' | 'D3_HEATMAP'>('3D_MAP');
  const [callsign, setCallsign] = useState(() => citizenRegistry.getCallsign());
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [callsignInput, setCallsignInput] = useState(() => citizenRegistry.getCallsign());
  const [hiddenOpsOpen, setHiddenOpsOpen] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [warpDestination, setWarpDestination] = useState('');

  useEffect(() => {
    soundFX.setMuted(!soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    // Arm Watchdog Sentinel on load
    hiddenOps.initWatchdog();
  }, []);

  useEffect(() => {
    const unsub = citizenRegistry.subscribe(() => {
      setCallsign(citizenRegistry.getCallsign());
    });
    return unsub;
  }, []);

  const triggerWarpTo = useCallback((name: string) => {
    setWarpDestination(name);
    setIsWarping(true);
    soundFX.triggerWarpDrive();
  }, []);

  const handleSelectTarget = useCallback((target: CatalogTarget) => {
    setSelectedTarget(target);
    triggerWarpTo(target.name);
    if (target.primaryAnomaly) {
      const match = CATALOG_ANOMALIES.find((a) => a.id === target.primaryAnomaly);
      if (match) setSelectedAnomaly(match);
    }
  }, [triggerWarpTo]);

  const handleSelectAnomaly = useCallback((anomaly: CatalogAnomaly) => {
    setSelectedAnomaly(anomaly);
    const match = CATALOG_STARS.find((s) => s.id === anomaly.targetId);
    if (match) {
      setSelectedTarget(match);
      triggerWarpTo(match.name);
    }
  }, [triggerWarpTo]);

  const handleSelectTargetById = useCallback((targetId: string) => {
    const match = CATALOG_STARS.find((s) => s.id === targetId || s.targetId === targetId || s.name.toLowerCase() === targetId.toLowerCase());
    if (match) {
      setSelectedTarget(match);
      triggerWarpTo(match.name);
      if (match.primaryAnomaly) {
        const aMatch = CATALOG_ANOMALIES.find((a) => a.id === match.primaryAnomaly);
        if (aMatch) setSelectedAnomaly(aMatch);
      }
    }
  }, [triggerWarpTo]);

  // Cross-Tab Action Bridge router
  const handleNavigateTab = useCallback(
    (tab: string, targetId?: string) => {
      soundFX.triggerTick();
      if (targetId) {
        handleSelectTargetById(targetId);
      }
      const map: Record<string, AppMode> = {
        '1. MAP': 'OBSERVATORY',
        MAP: 'OBSERVATORY',
        OBSERVATORY: 'OBSERVATORY',
        HEATMAP: 'HEATMAP',
        'D3 HEATMAP': 'HEATMAP',
        '🔥 D3 HEATMAP': 'HEATMAP',
        'ANOMALY HEATMAP': 'HEATMAP',
        SURFACE: 'SURFACE_EXPLORER',
        SURFACE_EXPLORER: 'SURFACE_EXPLORER',
        '2. TRANSIT': 'TRANSIT',
        TRANSIT: 'TRANSIT',
        '3. 10-BOT FLEET': 'FLEET_AUDIT',
        FLEET_AUDIT: 'FLEET_AUDIT',
        'AI_DISCOVERY': 'AI_DISCOVERY',
        '⚡ AI DISCOVERY': 'AI_DISCOVERY',
        PIPELINE: 'AI_DISCOVERY',
        '4. ASTRA AI & 3D': 'ASTRA',
        ASTRA: 'ASTRA',
        '5. NASA & TELESCOPES': 'NASA_PIPES',
        NASA_PIPES: 'NASA_PIPES',
        '6. PHYSICS SANDBOX': 'PHYSICS_SANDBOX',
        PHYSICS_SANDBOX: 'PHYSICS_SANDBOX',
        '7. DISCOVERY DOSSIER': 'DOSSIER',
        DOSSIER: 'DOSSIER',
        COCKPIT: 'COCKPIT',
      };
      const resolved = map[tab] || 'OBSERVATORY';
      setActiveMode(resolved);
    },
    [handleSelectTargetById]
  );

  // Deploy virtual probe -> Switch to 3D surface explorer or Star Map with telemetry
  const handleDeployVirtualProbe = useCallback(
    (targetId: string) => {
      handleSelectTargetById(targetId);
      soundFX.triggerPingSweep();
      setActiveMode('SURFACE_EXPLORER');
    },
    [handleSelectTargetById]
  );

  const handleSaveCallsign = () => {
    soundFX.triggerTick();
    citizenRegistry.setCallsign(callsignInput);
    setIsEditingCallsign(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-[#030208] text-slate-100 font-sans select-none overflow-hidden antialiased">
      {/* Tactical Top Bar (Obsidian & Deep Nebula) */}
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-purple-950/40 bg-[#06030f]/90 px-3 backdrop-blur-xl z-30 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc] animate-pulse" />
            <span className="text-sm font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-400 to-indigo-300 font-mono">
              COSMOS<span className="text-amber-400">-X</span>
            </span>
          </div>

          {/* Commander Citizen Callsign Badge */}
          <div className="flex items-center gap-1 rounded-lg border border-purple-900/60 bg-black/50 px-2 py-0.5 font-mono text-[9.5px]">
            <User size={10} className="text-amber-400" />
            <span className="text-slate-400 hidden xl:inline">CALLSIGN:</span>
            {isEditingCallsign ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCallsign()}
                  maxLength={18}
                  className="w-20 rounded bg-purple-950/80 px-1 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/60 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCallsign}
                  className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  title="Save Callsign"
                >
                  <Check size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCallsign(false)}
                  className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                  title="Cancel"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerTick();
                  setCallsignInput(callsign);
                  setIsEditingCallsign(true);
                }}
                className="flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 cursor-pointer group"
                title="Click to edit Commander Callsign"
              >
                <span>{callsign}</span>
                <Edit2 size={8} className="opacity-60 group-hover:opacity-100 text-slate-400" />
              </button>
            )}
          </div>

          {/* Quick Target Selector Dropdown */}
          <div className="hidden 2xl:flex items-center gap-1.5 ml-1 pl-2 border-l border-purple-950/60 font-mono">
            <Crosshair size={11} className="text-purple-400" />
            <select
              value={selectedTarget.id}
              onChange={(e) => {
                const found = CATALOG_STARS.find((s) => s.id === e.target.value);
                if (found) {
                  soundFX.triggerTick();
                  handleSelectTarget(found);
                }
              }}
              className="rounded bg-[#0b0518] border border-purple-900/60 px-1.5 py-0.5 text-[9.5px] text-purple-200 focus:outline-none focus:border-purple-400 transition-colors cursor-pointer"
            >
              {CATALOG_STARS.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0b0518] text-slate-200">
                  {s.name} ({s.spectralType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Central Workspace Mode Switcher (Sleek Compact Buttons) */}
        <div className="flex items-center gap-0.5 rounded-xl bg-black/60 p-0.5 border border-purple-950/50 font-mono text-[9px] overflow-x-auto max-w-full scrollbar-none">
          {(
            [
              { id: 'OBSERVATORY', label: '1. MAP', icon: Compass },
              { id: 'HEATMAP', label: '🔥 D3 HEATMAP', icon: Flame },
              { id: 'SURFACE_EXPLORER', label: '🌍 3D RECON', icon: Globe },
              { id: 'TRANSIT', label: '2. TRANSIT', icon: Activity },
              { id: 'FLEET_AUDIT', label: '3. 10-BOT FLEET', icon: Network },
              { id: 'AI_DISCOVERY', label: '⚡ AI PIPELINE', icon: Cpu },
              { id: 'ASTRA', label: '4. ASTRA', icon: Sparkles },
              { id: 'NASA_PIPES', label: '5. NASA', icon: Satellite },
              { id: 'PHYSICS_SANDBOX', label: '6. SANDBOX', icon: Sliders },
              { id: 'DOSSIER', label: '7. DOSSIER', icon: FileText },
              { id: 'COCKPIT', label: 'COCKPIT', icon: LayoutGrid },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.triggerTick();
                  setActiveMode(tab.id);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Icon size={10} className={isActive ? 'text-white' : tab.id === 'HEATMAP' ? 'text-rose-400' : tab.id === 'AI_DISCOVERY' ? 'text-amber-400 animate-pulse' : tab.id === 'SURFACE_EXPLORER' ? 'text-cyan-400' : tab.id === 'ASTRA' ? 'text-amber-400' : 'text-purple-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Telemetry Metrics, Hidden Ops Modal Trigger & Audio Toggle */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          {/* Hidden Ops & Google Chat Error Diagnostics Drawer Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.triggerTick();
              setHiddenOpsOpen(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-purple-800/60 bg-purple-950/50 hover:bg-purple-900/60 px-2 py-1 text-[9.5px] text-purple-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            title="Open Hidden Ops Daemon Bots & Google Chat Webhook Error Logs"
          >
            <Bot size={11} className="text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">HIDDEN OPS &bull; GOOGLE CHAT</span>
            <span className="sm:hidden">OPS</span>
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) soundFX.triggerTick();
            }}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[9.5px] transition-all font-mono cursor-pointer ${
              soundEnabled
                ? 'border-purple-600 bg-purple-950/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'border-purple-950/60 bg-black/40 text-slate-500 hover:text-purple-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={11} className="text-purple-400" /> : <VolumeX size={11} />}
            <span>{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>
        </div>
      </header>

      {/* Hidden Ops Daemon Modal */}
      <HiddenOpsModal isOpen={hiddenOpsOpen} onClose={() => setHiddenOpsOpen(false)} />

      {/* Cinematic Warp-Drive Relativistic Star-Stretching Transition */}
      <WarpDriveTransition
        isActive={isWarping}
        destinationName={warpDestination}
        onComplete={() => setIsWarping(false)}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 p-3 overflow-hidden">
        {/* ============================================================== */}
        {/* MODE 1: OBSERVATORY MAP (Expansive 3D + Tactical Inspector) */}
        {/* ============================================================== */}
        {activeMode === 'OBSERVATORY' && (
          <div className="grid h-full grid-cols-12 gap-3">
            {/* Expansive 3D Star Map or D3 Technosignature Heatmap (8 cols) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col h-full rounded-xl overflow-hidden border border-purple-950/40 relative">
              {/* Observatory Sub-View Switcher Tab */}
              <div className="absolute top-2.5 left-14 z-30 flex items-center gap-1 rounded-lg bg-black/85 p-1 border border-purple-900/60 font-mono text-[9px] shadow-[0_4px_15px_rgba(0,0,0,0.6)]">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.triggerTick();
                    setObservatorySubView('3D_MAP');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    observatorySubView === '3D_MAP'
                      ? 'bg-purple-600 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <Compass size={10} />
                  <span>3D MAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.triggerPingSweep();
                    setObservatorySubView('D3_HEATMAP');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    observatorySubView === 'D3_HEATMAP'
                      ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Flame size={10} className="text-amber-400" />
                  <span>D3 HEATMAP</span>
                </button>
              </div>

              {observatorySubView === '3D_MAP' ? (
                <HolographicStarMap
                  selectedTargetId={selectedTarget.id}
                  onSelectTarget={handleSelectTarget}
                  activeAnomalyTargetId={selectedAnomaly.targetId}
                  expandedView={true}
                />
              ) : (
                <D3AnomalyHeatmap
                  selectedTargetId={selectedTarget.id}
                  onSelectTarget={handleSelectTarget}
                  onSelectAnomaly={handleSelectAnomaly}
                  onSelectTargetById={handleSelectTargetById}
                />
              )}
            </div>

            {/* Target & Anomaly Right Inspector (4 cols) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 h-full overflow-y-auto pr-1">
              {/* Target Quick Bio Card */}
              <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-2 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-purple-950/40">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                      Locked System Profile
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-bold">{selectedTarget.id}</span>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {selectedTarget.overview}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-1">
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">DISTANCE</div>
                    <div className="text-xs font-bold text-purple-200">
                      {selectedTarget.distanceLy.toLocaleString()} ly
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">SPECTRAL TYPE</div>
                    <div className="text-xs font-bold text-amber-300">{selectedTarget.spectralType}</div>
                  </div>
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">TEMPERATURE</div>
                    <div className="text-xs font-bold text-cyan-300">{selectedTarget.teff} K</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-950/40 text-[9.5px] text-slate-400">
                  <span>RA: {selectedTarget.ra.toFixed(3)}° | DEC: {selectedTarget.dec.toFixed(3)}°</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFX.triggerTick();
                        handleDeployVirtualProbe(selectedTarget.id);
                      }}
                      className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-bold underline decoration-cyan-600/50 cursor-pointer"
                    >
                      <Globe size={11} />
                      <span>Explore Surface</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFX.triggerTick();
                        setActiveMode('TRANSIT');
                      }}
                      className="flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold underline decoration-purple-600/50 cursor-pointer"
                    >
                      <span>Light Curve</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Anomaly Radar Panel */}
              <AnomalyRadar
                activeAnomalyId={selectedAnomaly.id}
                onSelectAnomaly={handleSelectAnomaly}
                onAuditWithDirector={() => setActiveMode('FLEET_AUDIT')}
                onOpenHeatmap={() => {
                  soundFX.triggerPingSweep();
                  setActiveMode('HEATMAP');
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1.5: D3 CELESTIAL ANOMALY HEAT DENSITY MAP (Direct View) */}
        {/* ============================================================== */}
        {activeMode === 'HEATMAP' && (
          <div className="grid h-full grid-cols-12 gap-3">
            <div className="col-span-12 lg:col-span-8 flex flex-col h-full rounded-xl overflow-hidden border border-purple-950/40">
              <D3AnomalyHeatmap
                selectedTargetId={selectedTarget.id}
                onSelectTarget={handleSelectTarget}
                onSelectAnomaly={handleSelectAnomaly}
                onSelectTargetById={handleSelectTargetById}
              />
            </div>

            {/* Target & Anomaly Right Inspector (4 cols) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 h-full overflow-y-auto pr-1">
              {/* Target Quick Bio Card */}
              <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-2 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-purple-950/40">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                      Locked System Profile
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-bold">{selectedTarget.id}</span>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {selectedTarget.overview}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-1">
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">DISTANCE</div>
                    <div className="text-xs font-bold text-purple-200">
                      {selectedTarget.distanceLy.toLocaleString()} ly
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">SPECTRAL TYPE</div>
                    <div className="text-xs font-bold text-amber-300">{selectedTarget.spectralType}</div>
                  </div>
                  <div className="rounded-lg bg-black/50 border border-purple-950/40 p-2">
                    <div className="text-[8.5px] text-slate-500">TEMPERATURE</div>
                    <div className="text-xs font-bold text-cyan-300">{selectedTarget.teff} K</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-950/40 text-[9.5px] text-slate-400">
                  <span>RA: {selectedTarget.ra.toFixed(3)}° | DEC: {selectedTarget.dec.toFixed(3)}°</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFX.triggerTick();
                        handleDeployVirtualProbe(selectedTarget.id);
                      }}
                      className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-bold underline decoration-cyan-600/50 cursor-pointer"
                    >
                      <Globe size={11} />
                      <span>Explore Surface</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFX.triggerTick();
                        setActiveMode('TRANSIT');
                      }}
                      className="flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold underline decoration-purple-600/50 cursor-pointer"
                    >
                      <span>Light Curve</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Anomaly Radar Panel */}
              <AnomalyRadar
                activeAnomalyId={selectedAnomaly.id}
                onSelectAnomaly={handleSelectAnomaly}
                onAuditWithDirector={() => setActiveMode('FLEET_AUDIT')}
                onOpenHeatmap={() => {
                  soundFX.triggerPingSweep();
                  setActiveMode('HEATMAP');
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE: COSMIC GOOGLE EARTH SURFACE EXPLORER (3D Low-Orbit & Ground) */}
        {/* ============================================================== */}
        {activeMode === 'SURFACE_EXPLORER' && (
          <div className="h-full w-full rounded-xl overflow-hidden border border-purple-950/40">
            <CosmicSurfaceExplorer
              selectedTarget={selectedTarget}
              onSelectTarget={handleSelectTarget}
              onExitSurfaceView={() => setActiveMode('OBSERVATORY')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: TRANSIT & LIGHT CURVES (Photometry & Anomaly Deep-Dive) */}
        {/* ============================================================== */}
        {activeMode === 'TRANSIT' && (
          <div className="grid h-full grid-cols-12 gap-3 overflow-y-auto">
            {/* Primary Photometric Solver (7 cols) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
              <LightCurveViewer target={selectedTarget} />
            </div>

            {/* Anomaly Scanner & Director Bot (5 cols) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
              <AnomalyRadar
                activeAnomalyId={selectedAnomaly.id}
                onSelectAnomaly={handleSelectAnomaly}
                onAuditWithDirector={() => setActiveMode('FLEET_AUDIT')}
              />
              <DirectorHUD
                onSelectCertifiedTarget={handleSelectTargetById}
                onNavigateTab={handleNavigateTab}
                onDeployVirtualProbe={handleDeployVirtualProbe}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: AI FLEET & DIRECTOR AUDIT (5 Bots & Dr. Vesta Bus)   */}
        {/* ============================================================== */}
        {activeMode === 'FLEET_AUDIT' && (
          <div className="grid h-full grid-cols-12 gap-3 overflow-y-auto">
            {/* Left: Inter-Bot Neural Bus & Dr. Vesta (7 cols) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
              <BotFleetManagementHUD
                onSelectTarget={handleSelectTargetById}
                onDeployRover={handleDeployVirtualProbe}
              />
              <DirectorHUD
                onSelectCertifiedTarget={handleSelectTargetById}
                onNavigateTab={handleNavigateTab}
                onDeployVirtualProbe={handleDeployVirtualProbe}
              />
            </div>

            {/* Right: AI Astrobiologist Research Terminal (5 cols) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
              <AstrobiologistAI
                currentTarget={selectedTarget}
                currentAnomaly={selectedAnomaly}
              />
              <BotTelemetryHUD
                onSelectTarget={handleSelectTargetById}
                onSelectAnomaly={(anomId) => {
                  const match = CATALOG_ANOMALIES.find((a) => a.id === anomId);
                  if (match) handleSelectAnomaly(match);
                }}
                onNavigateTab={handleNavigateTab}
                onDeployVirtualProbe={handleDeployVirtualProbe}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE: AI DISCOVERY PIPELINE & NOBEL BREAKTHROUGHS              */}
        {/* ============================================================== */}
        {activeMode === 'AI_DISCOVERY' && (
          <div className="h-full w-full">
            <AIDiscoveryPipelineHUD
              onDeployRover={handleDeployVirtualProbe}
              onSelectTarget={handleSelectTargetById}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 4: ASTRA COSMIC EXPLAINER & 3D DIGITAL TWIN               */}
        {/* ============================================================== */}
        {activeMode === 'ASTRA' && (
          <div className="grid h-full grid-cols-12 gap-3 overflow-y-auto">
            {/* Left Column (7 cols): Astra Explainer & Interactive 3D Twin */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 min-h-[500px]">
              <CosmicExplainerCard
                selectedTarget={selectedTarget}
                activeAnomaly={selectedAnomaly}
                expanded={true}
                onExploreTarget={handleSelectTargetById}
              />
            </div>

            {/* Right Column (5 cols): AI Astrobiologist & Target Flux */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
              <AstrobiologistAI
                currentTarget={selectedTarget}
                currentAnomaly={selectedAnomaly}
              />
              <AnomalyRadar
                activeAnomalyId={selectedAnomaly.id}
                onSelectAnomaly={handleSelectAnomaly}
                onAuditWithDirector={() => setActiveMode('FLEET_AUDIT')}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 5: NASA & TELESCOPE PIPES (Tier 2 Live Astronomy Feeds)   */}
        {/* ============================================================== */}
        {activeMode === 'NASA_PIPES' && (
          <div className="h-full w-full">
            <NasaLiveStreamsHUD
              onNavigateTab={handleNavigateTab}
              onDeployVirtualProbe={handleDeployVirtualProbe}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 6: PHYSICS SANDBOX (Tier 4 Orbital & Dyson Simulator)     */}
        {/* ============================================================== */}
        {activeMode === 'PHYSICS_SANDBOX' && (
          <div className="h-full w-full">
            <PhysicsSandbox />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 7: DISCOVERY DOSSIER (Tier 5 ApJ Preprint & Leaderboard)   */}
        {/* ============================================================== */}
        {activeMode === 'DOSSIER' && (
          <div className="h-full w-full">
            <ScientificPaperDossier
              selectedTarget={selectedTarget}
              onNavigateTab={handleNavigateTab}
              onDeployVirtualProbe={handleDeployVirtualProbe}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 8: COCKPIT VIEW (Unified High-Density Aerospace HUD)      */}
        {/* ============================================================== */}
        {activeMode === 'COCKPIT' && (
          <CockpitView
            selectedTarget={selectedTarget}
            onSelectTarget={handleSelectTarget}
            selectedAnomaly={selectedAnomaly}
            onSelectAnomaly={handleSelectAnomaly}
            onSelectTargetById={handleSelectTargetById}
            onNavigateMode={handleNavigateTab as any}
            onDeployVirtualProbe={handleDeployVirtualProbe}
          />
        )}
      </main>
    </div>
  );
}
