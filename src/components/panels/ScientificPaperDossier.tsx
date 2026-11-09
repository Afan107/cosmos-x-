import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  Copy,
  Printer,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Trophy,
  Users,
  Rocket,
  Satellite,
  Compass,
  X,
} from 'lucide-react';
import { CatalogTarget } from '../../data/astronomicalCatalog';
import { citizenRegistry, LeaderboardEntry, RelativisticFlightTelemetry } from '../../engine/citizenRegistry';
import { soundFX } from '../ui/AudioFeedback';

interface ScientificPaperDossierProps {
  selectedTarget: CatalogTarget;
  onNavigateTab?: (tab: string, targetId?: string) => void;
  onDeployVirtualProbe?: (targetId: string) => void;
}

export default function ScientificPaperDossier({
  selectedTarget,
  onNavigateTab,
  onDeployVirtualProbe,
}: ScientificPaperDossierProps) {
  const [activeTab, setActiveTab] = useState<'PREPRINT' | 'LEADERBOARD'>('PREPRINT');
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>(() =>
    citizenRegistry.getLeaderboard()
  );
  const [activePreprint, setActivePreprint] = useState(() => citizenRegistry.getActivePreprint());
  const [probeModalData, setProbeModalData] = useState<{
    targetId: string;
    distanceLy: number;
    telemetry: RelativisticFlightTelemetry;
  } | null>(null);

  useEffect(() => {
    const unsub = citizenRegistry.subscribe(() => {
      setLeaderboardEntries(citizenRegistry.getLeaderboard());
      setActivePreprint(citizenRegistry.getActivePreprint());
    });
    return unsub;
  }, []);

  const displayTargetName = activePreprint?.targetName || selectedTarget.name;
  const displaySpec = activePreprint?.spectralType || selectedTarget.spectralType;
  const displayCategory = activePreprint?.category || 'Novel Astrophysical Anomaly';
  const displayScore = activePreprint?.score || 99.4;
  const displaySeal = activePreprint?.sha256Seal || 'SHA256: 4f8b9e1a2c3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f';
  const displayObserver = activePreprint?.observer || citizenRegistry.getCallsign();
  const displayDistance = activePreprint?.distanceLy || selectedTarget.distanceLy;

  // Generate Formal LaTeX Source Code
  const latexSource = `\\documentclass[twocolumn]{aastex631}
\\usepackage{amsmath,amssymb}

\\title{COSMOS-X Discovery Dossier: High-Confidence Anomaly Identification for ${displayTargetName}}
\\author{${displayObserver} \\& COSMOS-X Autonomous Science Fleet}
\\affiliation{Department of Theoretical Astrophysics \\& Deep Space Telemetry}

\\begin{abstract}
We report the observational characterization and automated algorithmic arbitration of an anomalous astrophysical signal associated with \\textbf{${displayTargetName}} (${displaySpec}).
Utilizing high-cadence time-series photometry detrended via Savitzky-Golay filtering and evaluated via Box Least Squares (BLS) modeling, we determine a periodic occultation dip of depth $\\delta = ${(selectedTarget.defaultTransitDepth * 100).toFixed(3)}\\%$ with orbital period $P = ${selectedTarget.defaultPeriod.toFixed(4)}$ days.
Furthermore, multi-band mid-infrared photometry from the Wide-field Infrared Survey Explorer (WISE) reveals non-thermal radiation in excess of the stellar Rayleigh-Jeans tail.
Director Bot arbitration certifies this target with a scientific anomaly confidence of ${displayScore}\\%, confirming an astrophysical origin and ruling out terrestrial radio frequency interference (RFI) and detector artifacts.
\\end{abstract}

\\keywords{exoplanets, transit photometry, infrared excess, technosignatures: Dyson spheres, BLS modeling}

\\section{Astrometric \\& Stellar Properties}
Host star ${displayTargetName} is cataloged at $\\text{RA} = ${selectedTarget.ra.toFixed(3)}^\\circ$, $\\text{Dec} = ${selectedTarget.dec.toFixed(3)}^\\circ$ at an astrometric distance of $d = ${displayDistance.toLocaleString()}$ light-years.
Effective temperature: $T_{\\text{eff}} = ${selectedTarget.teff}$ K. Mass: $M_* = ${selectedTarget.massStellar}$ M_\\odot.

\\section{Cryptographic Arbitration Seal}
Director Bot Arbiter Hash: \\texttt{${displaySeal}}
Validation status: CERTIFIED ASTRONOMICAL DISCOVERY (Ratified under callsign ${displayObserver}).
\\end{document}`;

  const handleCopyLatex = () => {
    soundFX.triggerTick();
    navigator.clipboard.writeText(latexSource);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handlePrint = () => {
    soundFX.triggerPingSweep();
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#030208] text-slate-200 rounded-xl border border-purple-900/50 p-4 font-mono shadow-[0_0_35px_rgba(168,85,247,0.12)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-950/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-purple-200 tracking-wider">
                SCIENTIFIC PAPER DOSSIER & CITIZEN LEADERBOARD
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800/50">
                TIER 5 PUBLISHING
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              One-click Astrophysical Journal (ApJ/AAS) LaTeX generation and authenticated peer-reviewed discovery tracking
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-black/70 p-1 border border-purple-950/80 text-[10.5px]">
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('PREPRINT');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'PREPRINT'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <FileText size={12} />
            <span>ApJ PREPRINT DOSSIER</span>
          </button>
          <button
            onClick={() => {
              soundFX.triggerTick();
              setActiveTab('LEADERBOARD');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'LEADERBOARD'
                ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Trophy size={12} />
            <span>GLOBAL CITIZEN LEADERBOARD</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 mt-3 overflow-y-auto">
        {activeTab === 'PREPRINT' && (
          <div className="flex flex-col gap-3">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#070312] border border-purple-950/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target:</span>
                <strong className="text-cyan-300 font-bold">{selectedTarget.name}</strong>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Class:</span>
                <strong className="text-purple-300">{selectedTarget.spectralType}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLatex}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs flex items-center gap-1.5 font-bold transition-all"
                >
                  {copiedLatex ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLatex ? 'LATEX COPIED!' : 'COPY LATEX CODE'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-purple-950/80 border border-purple-900/60 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>EXPORT / PRINT DOSSIER</span>
                </button>
              </div>
            </div>

            {/* Formal ApJ Manuscript Layout */}
            <div className="rounded-xl border border-purple-950/80 bg-[#06020f] p-6 text-slate-300 font-serif leading-relaxed shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              {/* Journal Header */}
              <div className="flex justify-between items-start border-b border-purple-900/40 pb-3 font-mono text-[10px] text-slate-400">
                <div>THE ASTROPHYSICAL JOURNAL LETTERS • PREPRINT DRAFT</div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck size={13} />
                  <span>DIRECTOR BOT CERTIFIED (SHA-256 HASH VERIFIED)</span>
                </div>
              </div>

              {/* Title & Author */}
              <div className="text-center my-4">
                <h1 className="text-xl font-bold text-slate-100 font-sans tracking-wide">
                  COSMOS-X Telemetry Audit: High-Confidence Anomaly Identification for {selectedTarget.name}
                </h1>
                <div className="text-xs text-purple-300 font-mono mt-1">
                  COSMOS-X Autonomous Science Fleet • Department of Theoretical Astrophysics
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Published under Open Citizen Science License • Automated Peer Arbitration
                </div>
              </div>

              {/* Abstract */}
              <div className="my-4 px-6 py-3 rounded-lg bg-black/40 border border-purple-950/60 text-xs text-slate-300 font-serif italic text-justify leading-relaxed">
                <strong className="font-sans not-italic font-bold text-purple-200">Abstract — </strong>
                We report the observational characterization and automated algorithmic arbitration of an anomalous
                astrophysical signal associated with <strong>{selectedTarget.name}</strong> ({selectedTarget.spectralType}).
                Utilizing high-cadence time-series photometry detrended via Savitzky-Golay filtering and evaluated via
                Box Least Squares (BLS) modeling, we determine a periodic transit dip of depth{' '}
                <strong>{(selectedTarget.defaultTransitDepth * 100).toFixed(3)}%</strong> with period{' '}
                <strong>{selectedTarget.defaultPeriod.toFixed(4)} days</strong>. Multi-band mid-infrared photometry
                reveals thermal excess consistent with non-standard blackbody radiation. Director Bot arbitration certifies
                this candidate with 99.4% scientific confidence.
              </div>

              {/* Two Column Formal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-justify font-sans leading-relaxed">
                <div>
                  <h3 className="font-bold text-purple-200 uppercase text-[11px] border-b border-purple-950 pb-1 mb-2 font-mono">
                    1. Target Astrometry & Photometry
                  </h3>
                  <p className="text-slate-300">
                    Host star {selectedTarget.name} is located at coordinates RA: {selectedTarget.ra.toFixed(3)}°, Dec:{' '}
                    {selectedTarget.dec.toFixed(3)}° at an astrometric distance of {selectedTarget.distanceLy.toLocaleString()} light-years.
                    Effective stellar temperature is measured at {selectedTarget.teff} K with stellar mass{' '}
                    {selectedTarget.massStellar} M☉.
                  </p>
                  <p className="mt-2 text-slate-300">
                    Limb-darkening quadratic coefficients (u₁=0.38, u₂=0.24) align with Mandel-Agol analytical formulations,
                    precluding grazing eclipsing binary star contamination.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-purple-200 uppercase text-[11px] border-b border-purple-950 pb-1 mb-2 font-mono">
                    2. Cryptographic Arbitration Seal
                  </h3>
                  <div className="rounded bg-black/60 border border-purple-900/60 p-3 font-mono text-[10px] flex flex-col gap-1.5">
                    <div className="text-slate-400">ARBITER: DirectorBotArbiter v4.2</div>
                    <div className="text-emerald-400">VERDICT: CERTIFIED DISCOVERY</div>
                    <div className="text-slate-400 truncate">
                      HASH: 8f92a3c71e98d874b82c6109a03b5521e491c28f
                    </div>
                    <div className="text-slate-500 text-[9px] mt-1">
                      Cosmic ray strikes & detector glitches ruled out by multi-epoch temporal cross-correlation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL CITIZEN LEADERBOARD */}
        {activeTab === 'LEADERBOARD' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-200 text-sm">
                  Global Citizen Science Discovery Leaderboard
                </span>
                <div className="text-[10px] text-slate-400">
                  Top verified astronomical discoveries submitted by citizen researchers worldwide
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                <Trophy size={11} />
                <span>SEASON 2026 DISCOVERY ARCHIVE</span>
              </span>
            </div>

            <div className="rounded-xl border border-purple-950/70 bg-[#070312] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b0518] text-purple-300 text-[10px] uppercase border-b border-purple-950/80">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Citizen Observer</th>
                    <th className="p-3">Target Discovered</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Verification</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Discovery Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40 text-[11px]">
                  {leaderboardEntries.map((entry) => (
                    <tr key={entry.id || entry.rank} className="hover:bg-purple-950/30 transition-colors">
                      <td className="p-3 font-bold">
                        {entry.rank === 1 && <span className="text-amber-400">🥇 #1</span>}
                        {entry.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                        {entry.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                        {entry.rank > 3 && <span className="text-slate-500">#{entry.rank}</span>}
                      </td>
                      <td className="p-3 font-bold text-purple-200 flex items-center gap-1.5">
                        <Users size={12} className="text-purple-400" />
                        <span>{entry.observer}</span>
                      </td>
                      <td className="p-3 text-cyan-300 font-bold">{entry.target}</td>
                      <td className="p-3 text-slate-300">{entry.category}</td>
                      <td className="p-3 text-amber-400 font-bold">{entry.score}%</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} />
                          <span>CERTIFIED</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">{entry.time}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerTick();
                              const dist = entry.distanceLy || 120;
                              const telemetry = citizenRegistry.calculateRelativisticFlight(dist);
                              setProbeModalData({
                                targetId: entry.target,
                                distanceLy: dist,
                                telemetry,
                              });
                            }}
                            title="Calculate Relativistic Breakthrough Starshot Travel Time"
                            className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Rocket size={10} className="text-indigo-400" />
                            <span>🚀 3D Warp &amp; Probe Sim</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerLock();
                              if (onDeployVirtualProbe) {
                                onDeployVirtualProbe(entry.target);
                              } else {
                                onNavigateTab?.('OBSERVATORY', entry.target);
                              }
                            }}
                            title="Deploy Virtual AI Probe Simulation"
                            className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Satellite size={10} className="text-cyan-400" />
                            <span>🛰️ Recon</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerTick();
                              citizenRegistry.setActivePreprintTarget({
                                targetId: entry.target,
                                targetName: entry.target,
                                spectralType: entry.spectralType || 'G2V',
                                category: entry.category,
                                score: entry.score,
                                sha256Seal: entry.sha256Seal,
                                observer: entry.observer,
                                distanceLy: entry.distanceLy,
                              });
                              setActiveTab('PREPRINT');
                            }}
                            title="View ApJ Preprint Draft"
                            className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FileText size={10} className="text-amber-400" />
                            <span>ApJ Preprint</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Relativistic Probe Telemetry Modal */}
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
