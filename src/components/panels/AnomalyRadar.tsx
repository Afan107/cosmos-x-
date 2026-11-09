import React, { useState } from 'react';
import {
  AlertTriangle,
  Radio,
  Flame,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { CATALOG_ANOMALIES, CatalogAnomaly } from '../../data/astronomicalCatalog';
import { directorArbiter } from '../../engine/directorBot';
import { soundFX } from '../ui/AudioFeedback';

interface AnomalyRadarProps {
  activeAnomalyId: string;
  onSelectAnomaly: (anomaly: CatalogAnomaly) => void;
  onAuditWithDirector?: (anomaly: CatalogAnomaly) => void;
  onOpenHeatmap?: () => void;
}

export default function AnomalyRadar({
  activeAnomalyId,
  onSelectAnomaly,
  onAuditWithDirector,
  onOpenHeatmap,
}: AnomalyRadarProps) {
  const [selectedTab, setSelectedTab] = useState<'DETAILS' | 'IR_COLOR' | 'WATERFALL'>('DETAILS');
  const [certifiedSuccess, setCertifiedSuccess] = useState<string | null>(null);

  const activeAnomaly =
    CATALOG_ANOMALIES.find((a) => a.id === activeAnomalyId) || CATALOG_ANOMALIES[0];

  const handleCertify = () => {
    soundFX.triggerTick();
    const cert = directorArbiter.evaluateAndCertify({
      id: `CAND-${Date.now()}`,
      targetId: activeAnomaly.targetId,
      sourceBot:
        activeAnomaly.category === 'DYSON_SPHERE'
          ? 'VOID_WATCHER'
          : activeAnomaly.category === 'RADIO_TECHNOSIGNATURE'
          ? 'SETI_SENTINEL'
          : 'KEPLER_BOT',
      candidateType:
        activeAnomaly.category === 'DYSON_SPHERE'
          ? 'STELLAR_INFRARED_ANOMALY'
          : activeAnomaly.category === 'RADIO_TECHNOSIGNATURE'
          ? 'NARROWBAND_TECHNOSIGNATURE'
          : 'HABITABLE_EXOPLANET',
      preliminaryScore: activeAnomaly.confidencePct,
      snr: 24.5,
      coordinates: {
        ra: activeAnomaly.coordinates.ra,
        dec: activeAnomaly.coordinates.dec,
      },
      artifactFlags: [],
      metrics: activeAnomaly.telemetryMetrics,
    });

    setCertifiedSuccess(`Director certified: ${cert.status} (${cert.certifiedScore}%)`);
    soundFX.triggerPingSweep();
    if (onAuditWithDirector) {
      onAuditWithDirector(activeAnomaly);
    }
  };

  return (
    <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-950/50 border border-amber-700/50 text-amber-400">
            <AlertTriangle size={14} />
          </div>
          <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
            Anomaly Scanner &amp; Dark Signatures
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenHeatmap && (
            <button
              onClick={() => {
                soundFX.triggerPingSweep();
                onOpenHeatmap();
              }}
              className="flex items-center gap-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 px-2 py-0.5 text-[9px] font-mono font-bold transition-all cursor-pointer"
              title="Open Full-Sky D3 Anomaly Heat Density Map"
            >
              <span>🔥 D3 HEATMAP</span>
            </button>
          )}
          <span className="rounded-full bg-amber-950/80 px-2.5 py-0.5 text-[9px] text-amber-300 border border-amber-700/60 font-mono">
            RADAR: ACTIVE (5 CLASSIFIED)
          </span>
        </div>
      </div>

      {/* Anomaly Selection Cards */}
      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
        {CATALOG_ANOMALIES.map((anom) => {
          const isSelected = activeAnomaly.id === anom.id;
          const isCritical = anom.priority === 'CRITICAL';

          return (
            <div
              key={anom.id}
              onClick={() => {
                soundFX.triggerAnomalyKlaxon();
                onSelectAnomaly(anom);
                setCertifiedSuccess(null);
              }}
              className={`cursor-pointer rounded-lg border p-2 text-xs transition-all font-mono ${
                isSelected
                  ? 'border-amber-400/80 bg-amber-950/40 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border-purple-950/40 bg-black/40 text-slate-400 hover:border-amber-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-[10px] truncate max-w-[130px]">
                  {anom.id}
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {anom.priority}
                </span>
              </div>
              <div className="text-[9.5px] text-slate-200 truncate mt-0.5">{anom.title}</div>
              <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                <span>CONF: {anom.confidencePct}%</span>
                <span className="text-purple-300">{anom.category.replace('_', ' ')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Anomaly Inspector */}
      <div className="rounded-lg border border-purple-950/40 bg-black/60 p-3 flex flex-col gap-2 font-mono">
        {/* Inspector Sub-Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-950/40 text-[10px]">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'DETAILS', label: 'ANOMALY DOSSIER' },
                { id: 'IR_COLOR', label: 'WISE IR DIAGRAM' },
                { id: 'WATERFALL', label: 'RADIO WATERFALL' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.triggerTick();
                  setSelectedTab(tab.id);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedTab === tab.id
                    ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCertify}
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white px-2.5 py-1 text-[9.5px] font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all"
          >
            <Award size={11} />
            <span>SUBMIT TO DIRECTOR</span>
          </button>
        </div>

        {certifiedSuccess && (
          <div className="rounded-md bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-1 text-[9.5px] text-emerald-300 flex items-center justify-between">
            <span>{certifiedSuccess}</span>
            <span className="text-[8px] text-emerald-400 font-bold uppercase">REGISTRY CERTIFIED</span>
          </div>
        )}

        {/* Tab 1: Dossier Details */}
        {selectedTab === 'DETAILS' && (
          <div className="space-y-2 text-xs">
            <div className="text-slate-300 text-[11px] leading-relaxed">
              {activeAnomaly.summary}
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center mt-2">
              {Object.entries(activeAnomaly.telemetryMetrics).map(([k, v]) => (
                <div key={k} className="rounded-md bg-purple-950/20 border border-purple-900/30 p-1.5">
                  <div className="text-[8px] text-slate-400">{k}</div>
                  <div className="text-[10px] font-bold text-amber-300">{v}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-purple-950/40 space-y-0.5 text-[9.5px] text-slate-300">
              {activeAnomaly.details.map((d, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-purple-400">•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>

            <div className="text-[9.5px] text-cyan-300 pt-1">
              OBSERVATORY RECOMMENDATION: {activeAnomaly.recommendedFacility}
            </div>
          </div>
        )}

        {/* Tab 2: WISE Mid-IR Color-Color Diagram */}
        {selectedTab === 'IR_COLOR' && (
          <div className="h-32 w-full rounded-lg bg-[#04020a] border border-purple-950/50 p-2.5 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 100">
              <line x1="30" y1="85" x2="280" y2="85" stroke="#581c87" strokeWidth="1" />
              <line x1="30" y1="15" x2="30" y2="85" stroke="#581c87" strokeWidth="1" />

              <text x="230" y="96" fill="#a855f7" fontSize="7" fontFamily="monospace">
                (W1 - W3) µm →
              </text>
              <text x="5" y="25" fill="#a855f7" fontSize="7" fontFamily="monospace" transform="rotate(-90 10 25)">
                (W3 - W4) →
              </text>

              {/* Main Sequence Normal Stellar Locus */}
              <ellipse cx="65" cy="72" rx="22" ry="10" fill="#2e1065" opacity="0.6" stroke="#c084fc" strokeWidth="1" />
              <text x="48" y="74" fill="#e2e8f0" fontSize="6.5" fontFamily="monospace">
                Main Sequence Locus
              </text>

              {/* Anomaly Offset Marker */}
              <circle cx="210" cy="30" r="5.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="140" y="24" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                TARGET OFFSET: +3.42σ (DYSON SWARM LOCUS)
              </text>

              <line x1="75" y1="70" x2="205" y2="33" stroke="#fbbf24" strokeDasharray="2,2" strokeWidth="1" />
            </svg>
            <div className="absolute top-1.5 right-2 text-[8px] text-purple-300 font-mono">
              WISE W3 (12µm) / W4 (22µm)
            </div>
          </div>
        )}

        {/* Tab 3: Breakthrough Listen Radio Waterfall */}
        {selectedTab === 'WATERFALL' && (
          <div className="h-32 w-full rounded-lg bg-[#02030a] border border-purple-950/50 p-2.5 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 100">
              {Array.from({ length: 15 }).map((_, i) => (
                <rect
                  key={i}
                  x="20"
                  y={10 + i * 5.5}
                  width="260"
                  height="4"
                  fill="#1e1b4b"
                  opacity={0.35 + (i % 3) * 0.15}
                />
              ))}

              <line x1="220" y1="12" x2="110" y2="88" stroke="#22d3ee" strokeWidth="2.5" />
              <circle cx="165" cy="50" r="3.5" fill="#38bdf8" />

              <text x="175" y="52" fill="#22d3ee" fontSize="7" fontFamily="monospace">
                BW: 1.8 Hz | DRIFT: -0.32 Hz/s
              </text>
              <text x="25" y="95" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                FREQ: 1420.450 MHz (NEUTRAL HYDROGEN WINDOW)
              </text>
            </svg>
            <div className="absolute top-1.5 right-2 text-[8px] text-cyan-300 font-mono">
              RADIO SPECTROGRAM
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
