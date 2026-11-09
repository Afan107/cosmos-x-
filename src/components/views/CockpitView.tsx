import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Activity,
  Bot,
  ShieldCheck,
  Terminal,
  Sparkles,
  Maximize2,
  ChevronRight,
  Crosshair,
  Compass,
  Cpu,
  Layers,
  HelpCircle,
  Scale,
  Atom,
} from 'lucide-react';
import {
  CatalogTarget,
  CatalogAnomaly,
  CATALOG_STARS,
  CATALOG_ANOMALIES,
} from '../../data/astronomicalCatalog';
import HolographicStarMap from '../canvas/HolographicStarMap';
import BotTelemetryHUD from '../panels/BotTelemetryHUD';
import BotFleetManagementHUD from '../panels/BotFleetManagementHUD';
import DirectorHUD from '../panels/DirectorHUD';
import LightCurveViewer from '../charts/LightCurveViewer';
import { soundFX } from '../ui/AudioFeedback';

interface CockpitViewProps {
  selectedTarget: CatalogTarget;
  onSelectTarget: (target: CatalogTarget) => void;
  selectedAnomaly: CatalogAnomaly;
  onSelectAnomaly: (anomaly: CatalogAnomaly) => void;
  onSelectTargetById: (targetId: string) => void;
  onNavigateMode?: (mode: any) => void;
  onDeployVirtualProbe?: (targetId: string) => void;
}

export default function CockpitView({
  selectedTarget,
  onSelectTarget,
  selectedAnomaly,
  onSelectAnomaly,
  onSelectTargetById,
  onNavigateMode,
  onDeployVirtualProbe,
}: CockpitViewProps) {
  // Quadrant 2 tab-isolated toggle: 'TELEMETRY' vs 'STELLA_CORES' vs 'STELLA_CHAT' vs 'NEURAL_DEBATE'
  const [topRightTab, setTopRightTab] = useState<'TELEMETRY' | 'STELLA_CORES' | 'STELLA_CHAT' | 'NEURAL_DEBATE'>('TELEMETRY');

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden bg-[#030208] p-1.5 font-sans">
      {/* Cockpit Aerospace Command Header Bar */}
      <div className="flex shrink-0 items-center justify-between rounded-xl border border-purple-950/60 bg-[#070312]/95 px-4 py-2 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)] font-mono text-xs">
        {/* Left: Active Telemetry Lock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </div>
            <span className="text-[10.5px] font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-300">
              MISSION CONTROL COCKPIT • 4-QUADRANT SPLIT-SCREEN BRIDGE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-purple-900/50 bg-[#0e0722] px-2.5 py-0.5 text-[9.5px] text-slate-300">
            <Crosshair size={11} className="text-purple-400" />
            <span className="text-purple-400">LOCKED:</span>
            <span className="font-semibold text-white">{selectedTarget.name}</span>
            <span className="text-slate-400">({selectedTarget.spectralType})</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-md border border-amber-900/40 bg-amber-950/20 px-2 py-0.5 text-[9.5px] text-amber-300">
            <span className="text-amber-500 font-bold">RADAR:</span>
            <span className="font-semibold">{selectedAnomaly.title}</span>
          </div>
        </div>

        {/* Right: Mode Jump Shortcuts */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="hidden xl:inline text-slate-500">DIRECT JUMP:</span>
          {onNavigateMode && (
            <div className="flex items-center gap-1 rounded-lg bg-black/50 p-0.5 border border-purple-950/80">
              <button
                onClick={() => {
                  soundFX.triggerTick();
                  onNavigateMode('OBSERVATORY');
                }}
                className="px-2 py-0.5 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
              >
                1. MAP
              </button>
              <button
                onClick={() => {
                  soundFX.triggerTick();
                  onNavigateMode('TRANSIT');
                }}
                className="px-2 py-0.5 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
              >
                2. TRANSIT
              </button>
              <button
                onClick={() => {
                  soundFX.triggerTick();
                  onNavigateMode('FLEET_AUDIT');
                }}
                className="px-2 py-0.5 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
              >
                3. FLEET
              </button>
              <button
                onClick={() => {
                  soundFX.triggerTick();
                  onNavigateMode('ASTRA');
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors font-bold"
              >
                <Sparkles size={10} className="text-amber-400" />
                <span>4. ASTRA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Master 4-Quadrant Split-Screen Mission Control Grid (Exact 2x2 Grid) */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-2 overflow-hidden p-1 min-h-0">
        {/* ============================================================== */}
        {/* QUADRANT 1 (Top Left): Live 3D Star Map Auto-Tracker           */}
        {/* ============================================================== */}
        <div className="flex flex-col h-full rounded-xl border border-purple-950/60 bg-[#070410]/85 p-2 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] overflow-hidden min-h-0">
          <div className="flex shrink-0 items-center justify-between px-2 py-1 border-b border-purple-950/50 mb-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider">
              <Globe size={12} className="text-purple-400" />
              <span>Q1 • 3D STAR MAP AUTO-TRACKER</span>
            </div>
            <span className="rounded bg-purple-950/80 px-2 py-0.5 text-[8.5px] text-cyan-300 border border-purple-800/40 truncate max-w-[160px]">
              {selectedTarget.name}
            </span>
          </div>
          <div className="flex-1 relative rounded-lg overflow-hidden border border-purple-950/50 bg-[#05020c] min-h-0">
            <HolographicStarMap
              selectedTargetId={selectedTarget.id}
              onSelectTarget={onSelectTarget}
              activeAnomalyTargetId={selectedAnomaly.targetId}
              expandedView={false}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 2 (Top Right): 10-Bot Telemetry Bus & Debate Log      */}
        {/* ============================================================== */}
        <div className="flex flex-col h-full rounded-xl border border-purple-950/60 bg-[#070410]/85 p-2 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] overflow-hidden min-h-0">
          <div className="flex shrink-0 items-center justify-between px-2 py-1 border-b border-purple-950/50 mb-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider">
              <Bot size={12} className="text-cyan-400" />
              <span>Q2 • FLEET, STELLA &amp; DEBATE</span>
            </div>
            <div className="flex items-center rounded bg-black/60 p-0.5 border border-purple-950/60 text-[8.5px]">
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerTick();
                  setTopRightTab('TELEMETRY');
                }}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  topRightTab === 'TELEMETRY' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                10-BOT BUS
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerNeuralSync();
                  setTopRightTab('STELLA_CORES');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all ${
                  topRightTab === 'STELLA_CORES' ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <Atom size={9} className="text-amber-300" />
                <span>7 STELLA-CORES</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerNeuralSync();
                  setTopRightTab('STELLA_CHAT');
                }}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  topRightTab === 'STELLA_CHAT' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                CHAT
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerTick();
                  setTopRightTab('NEURAL_DEBATE');
                }}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  topRightTab === 'NEURAL_DEBATE' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                COURTROOM
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-0.5">
            {topRightTab === 'TELEMETRY' ? (
              <BotTelemetryHUD
                onSelectTarget={onSelectTargetById}
                onSelectAnomaly={(anomId) => {
                  const match = CATALOG_ANOMALIES.find((a) => a.id === anomId);
                  if (match) onSelectAnomaly(match);
                }}
                onNavigateTab={onNavigateMode}
                onDeployVirtualProbe={onDeployVirtualProbe}
              />
            ) : topRightTab === 'STELLA_CORES' ? (
              <BotFleetManagementHUD
                onSelectTarget={onSelectTargetById}
                onDeployRover={onDeployVirtualProbe}
                initialSubTab="STELLA_NETWORK"
                compactMode={true}
              />
            ) : topRightTab === 'STELLA_CHAT' ? (
              <BotFleetManagementHUD
                onSelectTarget={onSelectTargetById}
                onDeployRover={onDeployVirtualProbe}
                initialSubTab="CHAT_RESEARCH"
                compactMode={true}
              />
            ) : (
              <BotFleetManagementHUD
                onSelectTarget={onSelectTargetById}
                onDeployRover={onDeployVirtualProbe}
                initialSubTab="COURTROOM"
                compactMode={true}
              />
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 3 (Bottom Left): Live Photometric & Spectra Analyzer  */}
        {/* ============================================================== */}
        <div className="flex flex-col h-full rounded-xl border border-purple-950/60 bg-[#070410]/85 p-2 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] overflow-hidden min-h-0">
          <div className="flex shrink-0 items-center justify-between px-2 py-1 border-b border-purple-950/50 mb-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider">
              <Activity size={12} className="text-cyan-400" />
              <span>Q3 • PHOTOMETRIC &amp; SPECTRA</span>
            </div>
            <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-[8.5px] text-cyan-300 border border-cyan-800/40">
              SAVITZKY-GOLAY &amp; BLS
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-0.5 min-h-0">
            <LightCurveViewer target={selectedTarget} />
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 4 (Bottom Right): Director Bot SHA-256 Queue          */}
        {/* ============================================================== */}
        <div className="flex flex-col h-full rounded-xl border border-purple-950/60 bg-[#070410]/85 p-2 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] overflow-hidden min-h-0">
          <div className="flex shrink-0 items-center justify-between px-2 py-1 border-b border-purple-950/50 mb-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-wider">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Q4 • THE DIRECTOR BOT ARBITRATION</span>
            </div>
            <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[8.5px] text-emerald-300 border border-emerald-800/40">
              SHA-256 RATIFIED
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-0.5 min-h-0">
            <DirectorHUD
              onSelectCertifiedTarget={onSelectTargetById}
              onNavigateTab={onNavigateMode}
              onDeployVirtualProbe={onDeployVirtualProbe}
              compactMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
