import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Crosshair,
  ListChecks,
  Sliders,
  Check,
  X,
  FileCheck,
  Radio,
  Sparkles,
  Zap,
  Flame,
  Orbit,
  Download,
  Copy,
  Volume2,
  Rocket,
  Scale,
  MessageSquare,
  Satellite,
  Compass,
} from 'lucide-react';
import {
  CertifiedDiscovery,
  QuarantineRecord,
  QuarantineCategory,
  AdversarialDebateStep,
  directorArbiter,
} from '../../engine/directorBot';
import { citizenRegistry, RelativisticFlightTelemetry } from '../../engine/citizenRegistry';
import { soundFX } from '../ui/AudioFeedback';

export type DiscoveryStatusFilter = 'VERIFIED' | 'PENDING' | 'ALL';

interface DirectorHUDProps {
  onSelectCertifiedTarget?: (targetId: string) => void;
  onNavigateTab?: (tab: string, targetId?: string) => void;
  onDeployVirtualProbe?: (targetId: string) => void;
  compactMode?: boolean;
}

export default function DirectorHUD({
  onSelectCertifiedTarget,
  onNavigateTab,
  onDeployVirtualProbe,
  compactMode = false,
}: DirectorHUDProps) {
  const [filter, setFilter] = useState<DiscoveryStatusFilter>('VERIFIED');
  const [threshold, setThreshold] = useState<number>(() => directorArbiter.getStrictnessThreshold());
  const [allDiscoveries, setAllDiscoveries] = useState<CertifiedDiscovery[]>(() =>
    directorArbiter.getAllDiscoveries()
  );
  const [quarantineLog, setQuarantineLog] = useState<QuarantineRecord[]>(() =>
    directorArbiter.getQuarantineLog()
  );
  const [quarantineCategory, setQuarantineCategory] = useState<string>('ALL');
  const [showQuarantine, setShowQuarantine] = useState(false);
  const [expandedCertId, setExpandedCertId] = useState<string | null>('CERT-2026-001');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [sonifyingId, setSonifyingId] = useState<string | null>(null);
  const [probeModalData, setProbeModalData] = useState<{
    targetId: string;
    distanceLy: number;
    telemetry: RelativisticFlightTelemetry;
  } | null>(null);

  // Sync threshold with arbiter
  const handleThresholdChange = (newVal: number) => {
    setThreshold(newVal);
    directorArbiter.setStrictnessThreshold(newVal);
    soundFX.triggerTick();
  };

  // Sonify signal frequency
  const handleSonifySignal = (e: React.MouseEvent, item: CertifiedDiscovery) => {
    e.stopPropagation();
    setSonifyingId(item.id);
    soundFX.sonifySignal(item.type);
    setTimeout(() => setSonifyingId(null), 1200);
  };

  // Open Relativistic Breakthrough Starshot probe simulation modal
  const handleOpenProbeSim = (e: React.MouseEvent, item: CertifiedDiscovery) => {
    e.stopPropagation();
    soundFX.triggerTick();
    const dist = item.targetId === 'TIC-25155310' ? 163000 : item.targetId === 'Kepler-452b' ? 1402 : 4.246;
    const telemetry = citizenRegistry.calculateRelativisticFlight(dist);
    setProbeModalData({
      targetId: item.targetId,
      distanceLy: dist,
      telemetry,
    });
  };

  // Action: Approve & Mint SHA-256 seal
  const handleApproveAndMint = (e: React.MouseEvent, item: CertifiedDiscovery) => {
    e.stopPropagation();
    soundFX.triggerCertifiedDiscoveryPing();
    const approved = directorArbiter.approveAndMintSha256(item.id);
    if (approved) {
      setAllDiscoveries(directorArbiter.getAllDiscoveries());
      setQuarantineLog(directorArbiter.getQuarantineLog());
      setExpandedCertId(approved.id);
      setActionSuccessMsg(`Ratified ${approved.targetId}! Minted SHA-256 seal & published to Leaderboard #1.`);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    }
  };

  // Action: Reject to Quarantine
  const handleRejectToQuarantine = (e: React.MouseEvent, item: CertifiedDiscovery) => {
    e.stopPropagation();
    soundFX.triggerAnomalyKlaxon();
    const ok = directorArbiter.rejectToQuarantine(
      item.id,
      `Rejected under Director strictness threshold (${threshold}%). Marginal telemetry quashed.`
    );
    if (ok) {
      setAllDiscoveries(directorArbiter.getAllDiscoveries());
      setQuarantineLog(directorArbiter.getQuarantineLog());
      setActionSuccessMsg(`Moved ${item.targetId} to Quarantine drawer.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  // Export certified JSON receipt
  const handleExportCertificate = (e: React.MouseEvent, item: CertifiedDiscovery) => {
    e.stopPropagation();
    soundFX.triggerTick();
    const certData = {
      certificationId: item.id,
      targetId: item.targetId,
      classificationType: item.type,
      status: item.status,
      certifiedTimestamp: item.certifiedTimestamp,
      certifiedScore: item.certifiedScore,
      sha256Seal: item.sha256Seal || 'SEAL-PENDING',
      sourceBot: item.sourceBot,
      consensusScouts: item.consensusMatrix,
      catalogCrossmatch: item.catalogCrossmatch,
      directorNotes: item.directorNotes,
      arbitrationProtocol: 'COSMOS-X Director Autonomous Consensus Engine v2.4'
    };
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COSMOS-X_CERT_${item.targetId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionSuccessMsg(`Exported cryptographic certificate for ${item.targetId}`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Copy SHA-256 seal to clipboard
  const handleCopySeal = (e: React.MouseEvent, sealText: string) => {
    e.stopPropagation();
    soundFX.triggerTick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sealText).catch(() => {});
    }
    setActionSuccessMsg(`Copied SHA-256 seal: ${sealText.slice(0, 16)}...`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Filtered discoveries list based on interactive status toggle
  const filteredDiscoveries = useMemo(() => {
    if (filter === 'VERIFIED') {
      return allDiscoveries.filter((item) => item.status === 'VERIFIED_NOVEL_DISCOVERY');
    }
    if (filter === 'PENDING') {
      return allDiscoveries.filter((item) => item.status === 'PENDING_REVIEW');
    }
    return allDiscoveries;
  }, [allDiscoveries, filter]);

  // Filtered quarantine records based on active drawer category tab
  const filteredQuarantine = useMemo(() => {
    if (quarantineCategory === 'ALL') return quarantineLog;
    return quarantineLog.filter((q) => q.category === quarantineCategory);
  }, [quarantineLog, quarantineCategory]);

  const verifiedCount = allDiscoveries.filter((d) => d.status === 'VERIFIED_NOVEL_DISCOVERY').length;
  const pendingCount = allDiscoveries.filter((d) => d.status === 'PENDING_REVIEW').length;
  const totalCount = allDiscoveries.length;
  const stats = directorArbiter.getStats();

  const cosmicRayCount = quarantineLog.filter((q) => q.category === 'COSMIC_RAYS').length;
  const groundRfiCount = quarantineLog.filter((q) => q.category === 'GROUND_RFI').length;
  const satelliteCount = quarantineLog.filter((q) => q.category === 'SATELLITE_STREAKS').length;
  const binaryCount = quarantineLog.filter((q) => q.category === 'ECLIPSING_BINARIES').length;

  return (
    <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-300">
            <ShieldCheck size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-indigo-200 tracking-wider">
              The Director Bot: Master Validator
            </span>
            <span className="text-[9.5px] text-slate-400 font-mono">
              Gaia DR3, SIMBAD &amp; Multi-Bot Consensus Matrix
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-950/80 px-2 py-0.5 text-[9px] text-indigo-300 border border-indigo-700/60 font-mono">
            PURITY: {stats.purityRate}%
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>
      </div>

      {/* Interactive Strictness Threshold Control */}
      <div className="rounded-lg border border-purple-900/40 bg-purple-950/20 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Sliders size={13} className="text-cyan-400 shrink-0" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Strictness Threshold
            </div>
            <div className="text-xs font-bold text-cyan-300">
              {threshold}% CONFIDENCE {threshold >= 90 ? '(Ultra-Rigorous)' : threshold >= 80 ? '(High Purity)' : '(Flexible)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[9px] text-slate-500">70%</span>
          <input
            type="range"
            min={70}
            max={99}
            value={threshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            className="w-32 sm:w-44 accent-cyan-400 cursor-pointer h-1.5 bg-black/60 rounded-lg appearance-none"
          />
          <span className="text-[9px] text-slate-500">99%</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="rounded-lg bg-emerald-950/60 border border-emerald-600/70 p-2 text-[10px] font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
          <FileCheck size={12} className="text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="rounded-lg border border-purple-950/40 bg-black/50 p-2">
          <div className="text-[9px] text-slate-500">CERTIFIED</div>
          <div className="text-xs font-bold text-emerald-400">{verifiedCount} VERIFIED</div>
        </div>
        <div className="rounded-lg border border-purple-950/40 bg-black/50 p-2">
          <div className="text-[9px] text-slate-500">PENDING REVIEW</div>
          <div className="text-xs font-bold text-amber-400">{pendingCount} IN ARBITRATION</div>
        </div>
        <div className="rounded-lg border border-purple-950/40 bg-black/50 p-2">
          <div className="text-[9px] text-slate-500">NOISE QUASHED</div>
          <div className="text-xs font-bold text-rose-400">{quarantineLog.length} PURGED</div>
        </div>
      </div>

      {/* Interactive Discovery Status Filter Toggles */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/60 border border-purple-950/50 text-[10px] font-mono">
        <button
          type="button"
          onClick={() => {
            soundFX.triggerTick();
            setFilter('VERIFIED');
            const match = allDiscoveries.find((d) => d.status === 'VERIFIED_NOVEL_DISCOVERY');
            if (match) setExpandedCertId(match.id);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
            filter === 'VERIFIED'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Show only certified and verified novel discoveries"
        >
          <CheckCircle2 size={11} className={filter === 'VERIFIED' ? 'text-emerald-400' : 'text-slate-500'} />
          <span className="truncate">Verified Only</span>
          <span
            className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[8.5px] font-bold ${
              filter === 'VERIFIED'
                ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700/60'
                : 'bg-slate-800/80 text-slate-400'
            }`}
          >
            {verifiedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.triggerTick();
            setFilter('PENDING');
            const match = allDiscoveries.find((d) => d.status === 'PENDING_REVIEW');
            if (match) setExpandedCertId(match.id);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
            filter === 'PENDING'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Show discoveries currently in multi-epoch arbitration"
        >
          <Clock size={11} className={filter === 'PENDING' ? 'text-amber-400' : 'text-slate-500'} />
          <span className="truncate">Pending Review</span>
          <span
            className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[8.5px] font-bold ${
              filter === 'PENDING'
                ? 'bg-amber-900/90 text-amber-200 border border-amber-700/60'
                : 'bg-slate-800/80 text-slate-400'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.triggerTick();
            setFilter('ALL');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-purple-950/80 text-purple-200 border border-purple-600/70 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Show all verified and pending discoveries"
        >
          <Layers size={11} className={filter === 'ALL' ? 'text-purple-300' : 'text-slate-500'} />
          <span className="truncate">All Discoveries</span>
          <span
            className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[8.5px] font-bold ${
              filter === 'ALL'
                ? 'bg-purple-900/90 text-purple-200 border border-purple-700/60'
                : 'bg-slate-800/80 text-slate-400'
            }`}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Discoveries List (Filtered) */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filteredDiscoveries.length === 0 ? (
          <div className="rounded-lg border border-purple-950/40 bg-black/40 p-4 text-center font-mono text-xs text-slate-500">
            No discoveries matching current filter status.
          </div>
        ) : (
          filteredDiscoveries.map((item, itemIdx) => {
            const isVerified = item.status === 'VERIFIED_NOVEL_DISCOVERY';
            const isExpanded = expandedCertId === item.id;
            const meetsThreshold = item.certifiedScore >= threshold;

            return (
              <div
                key={`${item.id}-${itemIdx}`}
                onClick={() => {
                  soundFX.triggerTick();
                  setExpandedCertId(isExpanded ? null : item.id);
                  if (onSelectCertifiedTarget) {
                    onSelectCertifiedTarget(item.targetId);
                  }
                }}
                className={`cursor-pointer rounded-lg border p-3 text-xs transition-all font-mono ${
                  isVerified
                    ? 'border-purple-950/40 bg-black/50 hover:border-emerald-600/60'
                    : 'border-amber-950/40 bg-amber-950/10 hover:border-amber-600/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isVerified ? (
                      <Award size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <Clock size={14} className="text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-purple-200 truncate">{item.targetId}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold ${
                        isVerified ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      ★ {item.certifiedScore}%
                    </span>

                    {isVerified ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[8.5px] text-emerald-300 border border-emerald-700/60">
                        <CheckCircle2 size={10} /> CERTIFIED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[8.5px] text-amber-300 border border-amber-700/60">
                        <Clock size={10} /> PENDING
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 mt-1 truncate">{item.type}</div>

                {/* Consensus Matrix Badge Preview */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-purple-950/30">
                  <span className="rounded bg-indigo-950/70 border border-indigo-700/50 px-1.5 py-0.5 text-[8px] text-cyan-300 font-bold uppercase tracking-wider">
                    CONSENSUS ({item.consensusMatrix?.length || 3}/8 + DR. VESTA)
                  </span>

                  {item.consensusMatrix?.map((scout, sIdx) => (
                    <span
                      key={`${scout.botId}-${sIdx}`}
                      className="inline-flex items-center gap-1 rounded bg-black/60 border border-purple-900/40 px-1.5 py-0.5 text-[8px] text-slate-300"
                      title={`${scout.name}: ${scout.finding}`}
                    >
                      <span>{scout.icon}</span>
                      <span className="hidden sm:inline">{scout.name}</span>
                    </span>
                  ))}
                </div>

                {/* Quick Action Buttons for Pending Review items */}
                {!isVerified && (
                  <div className="mt-2 pt-2 border-t border-purple-950/30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleApproveAndMint(e, item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/80 text-emerald-200 text-[9px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    >
                      <Check size={11} className="text-emerald-400" />
                      <span>Approve &amp; Mint SHA-256</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRejectToQuarantine(e, item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-rose-950/60 hover:bg-rose-900/70 border border-rose-600/70 text-rose-300 text-[9px] font-bold font-mono transition-all cursor-pointer"
                    >
                      <X size={11} className="text-rose-400" />
                      <span>Reject to Quarantine</span>
                    </button>
                  </div>
                )}

                {/* Expanded Details and Arbitration Actions */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-purple-950/40 text-[10px] text-slate-300 space-y-2.5">
                    {/* Cryptographic SHA-256 Seal if Certified */}
                    {item.sha256Seal && (
                      <div className="rounded-md border border-emerald-700/60 bg-emerald-950/20 p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] text-emerald-300 font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCheck size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate select-all">{item.sha256Seal}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopySeal(e, item.sha256Seal!)}
                            title="Copy SHA-256 Seal"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800/70 border border-emerald-600/60 text-emerald-200 text-[8px] font-bold cursor-pointer transition-all"
                          >
                            <Copy size={9} />
                            <span>Copy Seal</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleExportCertificate(e, item)}
                            title="Export Signed Certificate JSON"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-600/60 text-cyan-200 text-[8px] font-bold cursor-pointer transition-all"
                          >
                            <Download size={9} />
                            <span>Export JSON</span>
                          </button>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/60 font-bold">
                            RATIFIED
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-slate-400">
                      PRIMARY SCOUT: <strong className="text-purple-300">{item.sourceBot}</strong> | TIME:{' '}
                      {item.certifiedTimestamp}
                    </div>

                    <div
                      className={`p-2 rounded-md border leading-relaxed ${
                        isVerified
                          ? 'bg-purple-950/25 border-purple-900/40 text-purple-200/90'
                          : 'bg-amber-950/20 border-amber-900/40 text-amber-200/90'
                      }`}
                    >
                      &quot;{item.directorNotes}&quot;
                    </div>

                    {/* Multi-Bot Consensus Matrix Detailed Breakdown */}
                    {item.consensusMatrix && item.consensusMatrix.length > 0 && (
                      <div className="rounded-md border border-indigo-950/60 bg-indigo-950/15 p-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-indigo-300">
                          <span className="flex items-center gap-1">
                            <Sparkles size={11} className="text-cyan-400" />
                            <span>Multi-Bot Corroboration Breakdown</span>
                          </span>
                          <span className="text-[8.5px] text-cyan-400 font-mono">
                            {item.consensusMatrix.length} INDEPENDENT SENSORS
                          </span>
                        </div>

                        <div className="space-y-1 pt-0.5">
                          {item.consensusMatrix.map((scout, sIdx) => (
                            <div
                              key={`${scout.botId}-${sIdx}`}
                              className="rounded bg-black/40 border border-indigo-950/40 p-1.5 flex items-start gap-2 text-[9px]"
                            >
                              <span className="text-xs shrink-0">{scout.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200">{scout.name}</span>
                                  <span className="text-[8px] text-cyan-400 font-mono">{scout.role}</span>
                                </div>
                                <div className="text-slate-400 text-[8.5px] mt-0.5">{scout.finding}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending review arbitration pipeline */}
                    {item.pendingChecklist && item.pendingChecklist.length > 0 && (
                      <div className="rounded-md border border-purple-950/50 bg-black/40 p-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-indigo-300">
                          <ListChecks size={11} />
                          <span>Director Arbitration Pipeline</span>
                        </div>
                        <div className="space-y-1 pt-0.5">
                          {item.pendingChecklist.map((task, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-400">{task.item}</span>
                              {task.completed ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle2 size={9} /> PASSED
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Clock size={9} /> IN QUEUE
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adversarial 3-Agent Courtroom Debate Transcript */}
                    {item.adversarialDebate && item.adversarialDebate.length > 0 && (
                      <div className="rounded-lg border border-purple-900/60 bg-[#090415]/90 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-purple-300 border-b border-purple-950/60 pb-1">
                          <span className="flex items-center gap-1.5">
                            <Scale size={11} className="text-amber-400" />
                            <span>Adversarial 3-Agent Courtroom Debate Transcript</span>
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-cyan-300 border border-purple-800/40">
                            SCOUT ➔ DR. VESTA ➔ DIRECTOR
                          </span>
                        </div>

                        <div className="space-y-2 pt-1">
                          {item.adversarialDebate.map((step, dIdx) => {
                            const isScout = step.stage === 'SCOUT_CLAIM';
                            const isVesta = step.stage === 'THEORETICAL_COUNTER';
                            const isDirector = step.stage === 'DIRECTOR_SYNTHESIS';

                            const bgStyle = isScout
                              ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200'
                              : isVesta
                              ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                              : 'bg-emerald-950/25 border-emerald-700/50 text-emerald-200';

                            const tagStyle = isScout
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-700/50'
                              : isVesta
                              ? 'bg-amber-950 text-amber-300 border-amber-700/50'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700/50';

                            return (
                              <div
                                key={dIdx}
                                className={`rounded-md border p-2 text-[9px] leading-relaxed flex flex-col gap-1 ${bgStyle}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span className="text-xs">{step.icon}</span>
                                    <span>{step.agent}</span>
                                  </div>
                                  <span className={`text-[7.5px] uppercase font-mono px-1.5 py-0.5 rounded border ${tagStyle}`}>
                                    {step.role}
                                  </span>
                                </div>
                                <div className="text-slate-300 italic pl-1">&quot;{step.statement}&quot;</div>
                                <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono pt-0.5 border-t border-purple-950/30">
                                  <span>PHYSICS: {step.physicalPrinciple}</span>
                                  <span className="font-bold text-slate-300">[{step.verdictFlag}]</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Catalog crossmatches */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-purple-950/30">
                      <span>
                        Gaia DR3:{' '}
                        <strong className={item.catalogCrossmatch.gaiaDr3Match ? 'text-emerald-400' : 'text-amber-400'}>
                          {item.catalogCrossmatch.gaiaDr3Match ? 'Matched' : 'Unmatched'}
                        </strong>
                      </span>
                      <span>
                        SIMBAD: <strong className="text-purple-300">{item.catalogCrossmatch.simbadKnownSource}</strong>
                      </span>
                    </div>

                    {/* Interactive Multi-Action Controls: Sonify, Relativistic Probe Sim, and Cross-Tab Bridge */}
                    <div className="pt-2 border-t border-purple-950/40 space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleSonifySignal(e, item)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[9px] font-bold font-mono transition-all cursor-pointer ${
                            sonifyingId === item.id
                              ? 'bg-cyan-900 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.5)] animate-pulse'
                              : 'bg-cyan-950/60 hover:bg-cyan-900/70 border-cyan-700/60 text-cyan-200'
                          }`}
                        >
                          <Volume2 size={12} className={sonifyingId === item.id ? 'animate-bounce' : 'text-cyan-400'} />
                          <span>{sonifyingId === item.id ? 'SYNTHESIZING...' : '🔊 Sonify Signal'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenProbeSim(e, item)}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/60 text-indigo-200 text-[9px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                        >
                          <Rocket size={12} className="text-indigo-400" />
                          <span>🚀 Relativistic Probe Sim</span>
                        </button>
                      </div>

                      {/* Cross-Tab Action Bridge Row */}
                      <div className="grid grid-cols-4 gap-1 text-[8px] font-mono">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.triggerLock();
                            onSelectCertifiedTarget?.(item.targetId);
                            onNavigateTab?.('OBSERVATORY', item.targetId);
                          }}
                          className="flex items-center justify-center gap-1 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 cursor-pointer transition-colors"
                        >
                          <Compass size={10} className="text-purple-400" />
                          <span>3D Warp</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.triggerTick();
                            onNavigateTab?.('FLEET_AUDIT', item.targetId);
                          }}
                          className="flex items-center justify-center gap-1 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 cursor-pointer transition-colors font-bold"
                          title="Open Neural Cross-Examination Courtroom for this target"
                        >
                          <Scale size={10} className="text-amber-400" />
                          <span>Cross-Examine</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.triggerTick();
                            onNavigateTab?.('FLEET_AUDIT', item.targetId);
                          }}
                          className="flex items-center justify-center gap-1 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 cursor-pointer transition-colors"
                        >
                          <Sparkles size={10} className="text-amber-400" />
                          <span>Audit Fleet</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.triggerTick();
                            onNavigateTab?.('PHYSICS_SANDBOX', item.targetId);
                          }}
                          className="flex items-center justify-center gap-1 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 cursor-pointer transition-colors"
                        >
                          <Sliders size={10} className="text-cyan-400" />
                          <span>Sandbox</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.triggerLock();
                            if (onDeployVirtualProbe) {
                              onDeployVirtualProbe(item.targetId);
                            } else {
                              onNavigateTab?.('OBSERVATORY', item.targetId);
                            }
                          }}
                          className="flex items-center justify-center gap-1 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-200 cursor-pointer transition-colors font-bold"
                        >
                          <Satellite size={10} className="text-cyan-400" />
                          <span>Deploy Probe</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Action Buttons for Pending Review items */}
                    {!isVerified && (
                      <div className="pt-2 border-t border-purple-950/40 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleApproveAndMint(e, item)}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/80 text-emerald-200 text-[9.5px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                        >
                          <Check size={12} className="text-emerald-400" />
                          <span>Approve &amp; Mint SHA-256</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleRejectToQuarantine(e, item)}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-600/70 text-rose-300 text-[9.5px] font-bold font-mono transition-all cursor-pointer"
                        >
                          <X size={12} className="text-rose-400" />
                          <span>Reject to Quarantine</span>
                        </button>
                      </div>
                    )}

                    {onSelectCertifiedTarget && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof soundFX?.triggerLock === 'function') {
                            soundFX.triggerLock();
                          } else {
                            soundFX.triggerTick();
                          }
                          onSelectCertifiedTarget(item.targetId);
                        }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/50 text-[9.5px] text-purple-200 font-bold transition-all cursor-pointer"
                      >
                        <Crosshair size={11} className="text-cyan-400" />
                        <span>Lock System Telemetry &amp; Coordinates</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Categorized Quarantine Noise Breakdown Drawer */}
      <div className="pt-2 border-t border-purple-950/40">
        <button
          onClick={() => {
            soundFX.triggerTick();
            setShowQuarantine(!showQuarantine);
          }}
          className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-purple-300 py-1.5 px-2 rounded-lg bg-black/40 border border-purple-950/40 font-mono transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <AlertOctagon size={13} className="text-rose-400" />
            <span className="font-bold">
              View Quarantined Noise &amp; Glitches ({quarantineLog.length} Purged)
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8.5px] text-rose-400/80">4 Categories</span>
            {showQuarantine ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>

        {showQuarantine && (
          <div className="mt-2 p-2.5 rounded-lg border border-rose-950/50 bg-black/70 space-y-2 animate-fade-in">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setQuarantineCategory('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  quarantineCategory === 'ALL'
                    ? 'bg-rose-900 text-white font-bold'
                    : 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40'
                }`}
              >
                ALL ({quarantineLog.length})
              </button>

              <button
                type="button"
                onClick={() => setQuarantineCategory('COSMIC_RAYS')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  quarantineCategory === 'COSMIC_RAYS'
                    ? 'bg-purple-900 text-white font-bold'
                    : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40'
                }`}
              >
                COSMIC RAYS ({cosmicRayCount})
              </button>

              <button
                type="button"
                onClick={() => setQuarantineCategory('GROUND_RFI')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  quarantineCategory === 'GROUND_RFI'
                    ? 'bg-amber-900 text-white font-bold'
                    : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                }`}
              >
                GROUND RFI ({groundRfiCount})
              </button>

              <button
                type="button"
                onClick={() => setQuarantineCategory('SATELLITE_STREAKS')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  quarantineCategory === 'SATELLITE_STREAKS'
                    ? 'bg-cyan-900 text-white font-bold'
                    : 'bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40'
                }`}
              >
                SATELLITES ({satelliteCount})
              </button>

              <button
                type="button"
                onClick={() => setQuarantineCategory('ECLIPSING_BINARIES')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  quarantineCategory === 'ECLIPSING_BINARIES'
                    ? 'bg-rose-900 text-white font-bold'
                    : 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40'
                }`}
              >
                ECLIPSING BINARIES ({binaryCount})
              </button>
            </div>

            {/* Categorized False Positives List */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredQuarantine.map((q, qIdx) => {
                const isCosmic = q.category === 'COSMIC_RAYS';
                const isRfi = q.category === 'GROUND_RFI';
                const isSat = q.category === 'SATELLITE_STREAKS';

                const catBadgeClass = isCosmic
                  ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                  : isRfi
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : isSat
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800';

                return (
                  <div
                    key={`${q.id}-${qIdx}`}
                    className="rounded-md border border-rose-950/40 bg-rose-950/15 p-2 text-[9px] font-mono text-slate-300 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{q.target}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[8px] uppercase ${catBadgeClass}`}>
                          {q.categoryLabel}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[8.5px]">{q.bot}</span>
                    </div>

                    <div className="text-rose-200/90 leading-snug">{q.reason}</div>
                    <div className="text-slate-400 text-[8px] font-mono">{q.telemetry}</div>
                    <div className="text-slate-500 text-[7.5px] text-right">{q.timestamp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Relativistic Breakthrough Starshot Probe Telemetry Modal */}
      {probeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-mono">
          <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/50 bg-[#090518] p-5 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-indigo-950/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Rocket className="text-cyan-400" size={18} />
                <span className="font-bold text-sm text-indigo-200">
                  Relativistic Probe Telemetry • {probeModalData.targetId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProbeModalData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Breakthrough Starshot relativistic flyby trajectory calculation (&gamma; = 1/&radic;(1 - v&sup2;/c&sup2;)) to target at{' '}
              <strong className="text-cyan-300">{probeModalData.distanceLy.toLocaleString()} light-years</strong>:
            </div>

            {/* Flight parameters grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Option A: 0.20c */}
              <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Standard Starshot</span>
                  <span>v = 0.20 c</span>
                </div>
                <div className="text-[10px] text-slate-300 space-y-1">
                  <div>Lorentz Factor &gamma;: <strong>{probeModalData.telemetry.gamma02}</strong></div>
                  <div>Earth Frame Duration: <strong className="text-amber-300">{probeModalData.telemetry.travelTimeEarth02Years.toLocaleString()} yrs</strong></div>
                  <div>Probe Proper Time &tau;: <strong className="text-emerald-300">{probeModalData.telemetry.travelTimeShip02Years.toLocaleString()} yrs</strong></div>
                  <div className="text-[9px] text-slate-400">Time Dilation &Delta;t: {(probeModalData.telemetry.travelTimeEarth02Years - probeModalData.telemetry.travelTimeShip02Years).toFixed(2)} yrs</div>
                </div>
              </div>

              {/* Option B: 0.85c */}
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span>Advanced Laser Sail</span>
                  <span>v = 0.85 c</span>
                </div>
                <div className="text-[10px] text-slate-300 space-y-1">
                  <div>Lorentz Factor &gamma;: <strong>{probeModalData.telemetry.gamma085}</strong></div>
                  <div>Earth Frame Duration: <strong className="text-amber-300">{probeModalData.telemetry.travelTimeEarth085Years.toLocaleString()} yrs</strong></div>
                  <div>Probe Proper Time &tau;: <strong className="text-emerald-300">{probeModalData.telemetry.travelTimeShip085Years.toLocaleString()} yrs</strong></div>
                  <div className="text-[9px] text-slate-400">Time Dilation &Delta;t: {(probeModalData.telemetry.travelTimeEarth085Years - probeModalData.telemetry.travelTimeShip085Years).toFixed(2)} yrs</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-black/60 border border-purple-950/60 p-2.5 text-[10px] text-slate-400 space-y-1">
              <div>Radio Return Telemetry Latency: <strong className="text-purple-300">{(probeModalData.telemetry.travelTimeEarth02Years + probeModalData.distanceLy).toLocaleString()} years</strong> back to Earth</div>
              <div>Ground Phased Array Laser Power: <strong className="text-cyan-300">{probeModalData.telemetry.laserBeamPowerGW} GW</strong> optical drive array</div>
              <div>Interstellar Shielding: <strong className="text-emerald-300">{probeModalData.telemetry.interstellarShieldingRequirement}</strong></div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-purple-950/60">
              <button
                type="button"
                onClick={() => {
                  soundFX.triggerLock();
                  onSelectCertifiedTarget?.(probeModalData.targetId);
                  onNavigateTab?.('OBSERVATORY', probeModalData.targetId);
                  setProbeModalData(null);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                <Compass size={14} />
                <span>Engage 3D Warp to Target</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.triggerLock();
                  if (onDeployVirtualProbe) {
                    onDeployVirtualProbe(probeModalData.targetId);
                  } else {
                    onNavigateTab?.('OBSERVATORY', probeModalData.targetId);
                  }
                  setProbeModalData(null);
                }}
                className="py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Satellite size={14} />
                <span>Virtual Recon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
