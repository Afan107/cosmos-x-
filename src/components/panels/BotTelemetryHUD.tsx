import React, { useState, useEffect } from 'react';
import { Bot, Cpu, Play, Pause, RefreshCw, Bell, Radio, Compass, Sliders, Satellite, Sparkles } from 'lucide-react';
import { botOrchestrator, BotState, BotDiscoveryEvent } from '../../engine/botOrchestrator';
import { soundFX } from '../ui/AudioFeedback';

interface BotTelemetryHUDProps {
  onSelectTarget?: (targetId: string) => void;
  onSelectAnomaly?: (anomalyId: string) => void;
  onNavigateTab?: (tab: string, targetId?: string) => void;
  onDeployVirtualProbe?: (targetId: string) => void;
}

export default function BotTelemetryHUD({
  onSelectTarget,
  onSelectAnomaly,
  onNavigateTab,
  onDeployVirtualProbe,
}: BotTelemetryHUDProps) {
  const [bots, setBots] = useState<Record<string, BotState>>(() => botOrchestrator.getBots());
  const [events, setEvents] = useState<BotDiscoveryEvent[]>(() =>
    botOrchestrator.getRecentEvents().slice(0, 30)
  );
  const [isSweeping, setIsSweeping] = useState(() => botOrchestrator.isSweepRunning());
  const [isManualSweeping, setIsManualSweeping] = useState(false);

  useEffect(() => {
    botOrchestrator.startAutonomousSweep(8000);
    setIsSweeping(true);

    const unsubState = botOrchestrator.subscribeState((updatedBots) => {
      setBots(updatedBots);
    });

    const unsubEvents = botOrchestrator.subscribeEvents((newEvent) => {
      setEvents((prev) => {
        const filtered = prev.filter((e) => e.id !== newEvent.id);
        return [newEvent, ...filtered].slice(0, 30);
      });
      if (newEvent.significance === 'CRITICAL') {
        soundFX.triggerAnomalyKlaxon();
      } else {
        soundFX.triggerPingSweep();
      }
    });

    return () => {
      unsubState();
      unsubEvents();
      botOrchestrator.stopAutonomousSweep();
    };
  }, []);

  const toggleAutonomousSweep = () => {
    soundFX.triggerTick();
    if (isSweeping) {
      botOrchestrator.stopAutonomousSweep();
      setIsSweeping(false);
    } else {
      botOrchestrator.startAutonomousSweep(8000);
      setIsSweeping(true);
    }
  };

  const handleManualSweep = () => {
    soundFX.triggerTick();
    setIsManualSweeping(true);
    // botOrchestrator.executeSweepCycle emits to all subscribers via notifyEvents
    botOrchestrator.executeSweepCycle();
    setTimeout(() => {
      setIsManualSweeping(false);
    }, 600);
  };

  return (
    <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300">
            <Bot size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Autonomous Discovery Fleet (10 Bots)
            </span>
            <span className="text-[9px] text-purple-400 font-mono flex items-center gap-1">
              <span>8 Data Scouts ➔ Dr. Vesta ➔ Director Bot</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-amber-300 font-semibold">7 Stella-Core Vegapunk Neural Bus Active</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutonomousSweep}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer ${
              isSweeping
                ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'border-amber-700/60 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            {isSweeping ? <Pause size={10} /> : <Play size={10} />}
            <span>{isSweeping ? 'AUTO-SWEEP ON' : 'PAUSED'}</span>
          </button>

          <button
            onClick={handleManualSweep}
            disabled={isManualSweeping}
            title="Trigger Immediate Sector Sweep"
            className="flex items-center gap-1 rounded-full border border-purple-700/60 bg-purple-950/50 px-2.5 py-0.5 text-[9px] font-mono text-purple-300 hover:bg-purple-900/70 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={10} className={isManualSweeping ? 'animate-spin' : ''} />
            <span>SWEEP NOW</span>
          </button>
        </div>
      </div>

      {/* 10 Bot Telemetry Status Cards (Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
        {Object.entries(bots).map(([botKey, bot]) => {
          const isKepler = botKey === 'KEPLER_BOT';
          const isVoid = botKey === 'VOID_WATCHER';
          const isDirector = botKey === 'DIRECTOR_BOT';
          const isDrVesta = botKey === 'ASTRO_BOT';

          const accentColor = isKepler
            ? 'text-cyan-400'
            : isVoid
            ? 'text-amber-400'
            : isDirector
            ? 'text-emerald-400'
            : isDrVesta
            ? 'text-purple-300'
            : 'text-indigo-300';

          const borderColor = isKepler
            ? 'border-cyan-950/60 hover:border-cyan-700'
            : isVoid
            ? 'border-amber-950/60 hover:border-amber-700'
            : isDirector
            ? 'border-emerald-950/60 hover:border-emerald-700'
            : 'border-purple-950/60 hover:border-purple-700';

          // When auto-sweep is active, show the active scanning status (not standby)
          const displayStatus = isSweeping
            ? bot.status.includes('STANDBY') || bot.status.includes('PAUSED')
              ? 'SCANNING ACTIVE SECTOR'
              : bot.status
            : 'STANDBY / SWEEP PAUSED';

          return (
            <div
              key={botKey}
              className={`rounded-lg border bg-black/50 p-2 flex flex-col gap-1 transition-all ${borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs shrink-0">{bot.icon || '🤖'}</span>
                  <span className={`text-[9.5px] font-mono font-bold tracking-wider truncate ${accentColor}`}>
                    {bot.name}
                  </span>
                </div>
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isSweeping ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
                  }`}
                  title={isSweeping ? 'Active Scanning' : 'Paused'}
                />
              </div>

              <div
                className={`text-[8.5px] font-mono truncate ${
                  isSweeping ? 'text-cyan-300' : 'text-slate-500'
                }`}
                title={displayStatus}
              >
                {displayStatus}
              </div>

              <div className="text-[8px] text-slate-400 font-mono truncate" title={bot.recentFinding || bot.role}>
                {bot.recentFinding || bot.role}
              </div>

              <div className="flex justify-between items-center mt-auto pt-1 border-t border-purple-950/40 text-[8.5px] font-mono">
                <span className="text-slate-400">
                  SCANS: <strong className="text-slate-200">{bot.targetScans}</strong>
                </span>
                <span className="font-bold text-amber-400">★ {bot.discoveries}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Discovery Event Feed (Capped to latest 30 events) */}
      <div className="flex flex-col gap-1 mt-0.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5">
          <span className="flex items-center gap-1 text-purple-400 font-bold">
            <Bell size={10} /> LIVE SCOUT DISCOVERY STREAM ({events.length}/30)
          </span>
          <span className="flex items-center gap-1 text-emerald-400 text-[8.5px]">
            <Radio size={9} className="animate-pulse" />
            <span>IPC BUS ACTIVE</span>
          </span>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {events.slice(0, 30).map((evt, idx) => (
            <div
              key={`${evt.id}-${idx}`}
              onClick={() => {
                soundFX.triggerTick();
                if (evt.targetId && onSelectTarget) {
                  onSelectTarget(evt.targetId);
                }
              }}
              className="cursor-pointer rounded-lg border border-purple-950/40 bg-black/45 p-2 text-[9px] font-mono transition-all hover:border-purple-600/70 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold shrink-0 ${
                      evt.significance === 'CRITICAL'
                        ? 'text-amber-400'
                        : evt.significance === 'ELEVATED'
                        ? 'text-purple-300'
                        : 'text-slate-300'
                    }`}
                  >
                    [{evt.botName}]
                  </span>
                  <span className="text-slate-200 truncate">{evt.title}</span>
                </div>
                <div className="text-slate-400 truncate mt-0.5">{evt.description}</div>
                {evt.targetId && (
                  <div className="flex items-center gap-1 mt-1 pt-1 border-t border-purple-950/30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.triggerLock();
                        const tid = evt.targetId || 'TIC-25155310';
                        onSelectTarget?.(tid);
                        onNavigateTab?.('OBSERVATORY', tid);
                      }}
                      className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/40 text-[8px] text-purple-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <Compass size={8} /> 3D Warp
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.triggerTick();
                        const tid = evt.targetId || 'TIC-25155310';
                        onNavigateTab?.('PHYSICS_SANDBOX', tid);
                      }}
                      className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/40 text-[8px] text-purple-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <Sliders size={8} /> Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.triggerLock();
                        const tid = evt.targetId || 'TIC-25155310';
                        if (onDeployVirtualProbe) onDeployVirtualProbe(tid);
                        else onNavigateTab?.('OBSERVATORY', tid);
                      }}
                      className="px-1.5 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/40 text-[8px] text-cyan-300 flex items-center gap-0.5 cursor-pointer transition-colors font-bold"
                    >
                      <Satellite size={8} /> 🛰️ Probe
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[8.5px] text-slate-500 whitespace-nowrap shrink-0">{evt.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
