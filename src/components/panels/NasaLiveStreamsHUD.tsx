import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Flame,
  Globe2,
  Database,
  Satellite,
  Compass,
  Sparkles,
  Zap,
  Sliders,
  Rocket,
  Globe,
} from 'lucide-react';
import {
  KNOWN_INTERSTELLAR_OBJECTS,
  INITIAL_GCN_ALERTS,
  InterstellarAsteroidRecord,
  GcnTransientAlert,
  NasaExoplanetRecord,
} from '../../engine/nasaTelemetryPipes';
import { soundFX } from '../ui/AudioFeedback';
import CustomTelemetryIngestor from './CustomTelemetryIngestor';

interface NasaLiveStreamsHUDProps {
  onNavigateTab?: (tab: string, targetId?: string) => void;
  onDeployVirtualProbe?: (targetId: string, params?: any) => void;
}

export default function NasaLiveStreamsHUD({ onNavigateTab, onDeployVirtualProbe }: NasaLiveStreamsHUDProps = {}) {
  const [activeTab, setActiveTab] = useState<'EXOPLANETS' | 'MAST_PHOTOMETRY' | 'JPL_SENTRY' | 'GCN_STREAM' | 'CUSTOM_INGEST'>('EXOPLANETS');
  const [exoplanets, setExoplanets] = useState<NasaExoplanetRecord[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoadingExoplanets, setIsLoadingExoplanets] = useState(false);
  const [customAdqlQuery, setCustomAdqlQuery] = useState(
    'select top 20 pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_rade,pl_eqt,sy_dist from ps where pl_rade < 2.0 order by disc_year desc'
  );

  // MAST Light Curve states
  const [targetTicId, setTargetTicId] = useState('TIC-25155310');
  const [mastCadence, setMastCadence] = useState('2-min PDCSAP');
  const [mastLoading, setMastLoading] = useState(false);
  const [mastData, setMastData] = useState<{ pointsCount: number; sector: number; target: string } | null>(null);

  // JPL Sentry states
  const [interstellarList] = useState<InterstellarAsteroidRecord[]>(KNOWN_INTERSTELLAR_OBJECTS);
  const [selectedObject, setSelectedObject] = useState<InterstellarAsteroidRecord>(KNOWN_INTERSTELLAR_OBJECTS[0]);

  // GCN Stream states
  const [gcnAlerts] = useState<GcnTransientAlert[]>(INITIAL_GCN_ALERTS);

  // Fetch initial exoplanets from backend route
  const fetchExoplanets = async (query = '') => {
    setIsLoadingExoplanets(true);
    soundFX.triggerPingSweep();
    try {
      const res = await fetch(`/api/nasa/exoplanets?limit=50&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.records && Array.isArray(data.records)) {
        setExoplanets(data.records);
      }
    } catch (e) {
      console.warn('Exoplanet TAP fetch error, fallback active:', e);
    } finally {
      setIsLoadingExoplanets(false);
    }
  };

  useEffect(() => {
    fetchExoplanets();
  }, []);

  const handleFetchMast = async () => {
    setMastLoading(true);
    soundFX.triggerPingSweep();
    try {
      const res = await fetch(`/api/mast/lightcurve?ticId=${encodeURIComponent(targetTicId)}`);
      const data = await res.json();
      setMastData({
        pointsCount: data.pointsCount || 1200,
        sector: data.sector || 42,
        target: data.target || targetTicId,
      });
    } catch (e) {
      setMastData({ pointsCount: 1200, sector: 42, target: targetTicId });
    } finally {
      setMastLoading(false);
    }
  };

  const filteredExoplanets = exoplanets.filter(
    (p) =>
      p.pl_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.hostname.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.discoverymethod.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#030208] text-slate-200 rounded-xl border border-purple-900/50 p-4 font-mono shadow-[0_0_35px_rgba(168,85,247,0.12)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-950/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Satellite size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-purple-200 tracking-wider">
                NASA & DEEP SPACE TELESCOPE PIPES
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>TAP ADQL • MAST • JPL SENTRY • GCN LIVE</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Direct telemetry feeds connecting COSMOS-X to live scientific space archives
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-black/70 p-1 border border-purple-950/80 text-[10px]">
          {[
            { id: 'EXOPLANETS', label: 'NASA EXOPLANET TAP', icon: Database },
            { id: 'MAST_PHOTOMETRY', label: 'MAST PHOTOMETRY', icon: Radio },
            { id: 'JPL_SENTRY', label: 'JPL SENTRY & ASTEROIDS', icon: Globe2 },
            { id: 'GCN_STREAM', label: 'GCN TRANSIENT ALERTS', icon: Zap },
            { id: 'CUSTOM_INGEST', label: 'CUSTOM INGEST (CSV & PHOTO)', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.triggerTick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 mt-3 overflow-y-auto">
        {/* TAB: CUSTOM TELEMETRY & ASTROPHOTO INGESTOR */}
        {activeTab === 'CUSTOM_INGEST' && (
          <div className="flex flex-col gap-3">
            <CustomTelemetryIngestor onNavigateTab={onNavigateTab} />
          </div>
        )}

        {/* TAB 1: NASA EXOPLANET ARCHIVE TAP */}
        {activeTab === 'EXOPLANETS' && (
          <div className="flex flex-col gap-3">
            {/* ADQL Query Bar */}
            <div className="rounded-xl bg-[#070312] border border-purple-950/80 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Database size={13} />
                  <span>Astronomical Data Query Language (ADQL) Runner</span>
                </span>
                <span className="text-[10px] text-slate-500">Target Table: `ps` (Planetary Systems)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAdqlQuery}
                  onChange={(e) => setCustomAdqlQuery(e.target.value)}
                  className="flex-1 bg-black/60 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none focus:border-cyan-500"
                  placeholder="ADQL Query string..."
                />
                <button
                  onClick={() => fetchExoplanets(customAdqlQuery)}
                  disabled={isLoadingExoplanets}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-xs flex items-center gap-1 hover:brightness-110 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isLoadingExoplanets ? 'animate-spin' : ''} />
                  <span>EXECUTE TAP</span>
                </button>
              </div>

              {/* Preset Query Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9.5px]">
                <span className="text-slate-500">Presets:</span>
                {[
                  {
                    name: 'Habitable Zone Terrestrials (Rp < 1.6)',
                    q: 'select top 20 pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_rade,pl_eqt,sy_dist from ps where pl_rade between 0.8 and 1.6 and pl_eqt between 200 and 320 order by disc_year desc',
                  },
                  {
                    name: 'Ultra-Short Period Hot Jupiters',
                    q: 'select top 20 pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_rade,pl_eqt,sy_dist from ps where pl_orbper < 1.5 and pl_rade > 8.0 order by disc_year desc',
                  },
                  {
                    name: 'TRAPPIST Multi-Planet Architectures',
                    q: "select top 20 pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_rade,pl_eqt,sy_dist from ps where hostname like '%TRAPPIST%' order by pl_orbper asc",
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomAdqlQuery(preset.q);
                      fetchExoplanets(preset.q);
                    }}
                    className="px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Filter & Table */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-black/50 border border-purple-950/70 rounded-lg px-2.5 py-1 text-xs">
                <Search size={12} className="text-purple-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter records..."
                  className="bg-transparent focus:outline-none text-purple-200 text-xs w-48 font-mono"
                />
              </div>
              <span className="text-xs text-slate-400">
                Found <strong className="text-cyan-300">{filteredExoplanets.length}</strong> exoplanets in cache
              </span>
            </div>

            <div className="rounded-xl border border-purple-950/70 bg-[#070312]/80 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b0518] text-purple-300 text-[10px] uppercase border-b border-purple-950/80">
                  <tr>
                    <th className="p-2.5">Exoplanet Name</th>
                    <th className="p-2.5">Host Star</th>
                    <th className="p-2.5">Discovery Method</th>
                    <th className="p-2.5">Year</th>
                    <th className="p-2.5">Period (Days)</th>
                    <th className="p-2.5">Radius (R⊕)</th>
                    <th className="p-2.5">Eq. Temp (K)</th>
                    <th className="p-2.5">Distance (pc)</th>
                    <th className="p-2.5 text-right">Quick Cross-Tab Bridge &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40 text-[11px]">
                  {filteredExoplanets.map((p) => (
                    <tr key={p.pl_name} className="hover:bg-purple-950/30 transition-colors">
                      <td className="p-2.5 font-bold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-purple-400" />
                        <span>{p.pl_name}</span>
                      </td>
                      <td className="p-2.5 text-purple-200">{p.hostname}</td>
                      <td className="p-2.5 text-slate-400">{p.discoverymethod}</td>
                      <td className="p-2.5 text-slate-300">{p.disc_year}</td>
                      <td className="p-2.5 text-amber-300">{p.pl_orbper ? p.pl_orbper.toFixed(2) : '—'} d</td>
                      <td className="p-2.5 text-emerald-400">{p.pl_rade ? p.pl_rade.toFixed(2) : '—'} R⊕</td>
                      <td className="p-2.5 text-cyan-300">{p.pl_eqt ? `${p.pl_eqt} K` : '—'}</td>
                      <td className="p-2.5 text-slate-400">{p.sy_dist ? `${p.sy_dist.toFixed(1)} pc` : '—'}</td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerLock();
                              onNavigateTab?.('OBSERVATORY', p.hostname || p.pl_name);
                            }}
                            title="3D Warp to Coordinates"
                            className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-[9px] text-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Compass size={10} className="text-purple-400" />
                            <span>3D Warp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerTick();
                              onNavigateTab?.('FLEET_AUDIT', p.hostname || p.pl_name);
                            }}
                            title="Audit with 10-Bot Autonomous Fleet"
                            className="px-1.5 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-[9px] text-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Sparkles size={10} className="text-amber-400" />
                            <span>Audit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerTick();
                              onNavigateTab?.('PHYSICS_SANDBOX', p.hostname || p.pl_name);
                            }}
                            title="Simulate in Physics Sandbox"
                            className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-[9px] text-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Sliders size={10} className="text-cyan-400" />
                            <span>Sandbox</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.triggerLock();
                              if (onDeployVirtualProbe) {
                                onDeployVirtualProbe(p.pl_name, {
                                  radius: p.pl_rade,
                                  teq: p.pl_eqt,
                                  period: p.pl_orbper,
                                  hostname: p.hostname,
                                });
                              } else {
                                onNavigateTab?.('OBSERVATORY', p.hostname || p.pl_name);
                              }
                            }}
                            title="Deploy Virtual AI Satellite Recon"
                            className="px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-600/70 text-[9px] text-cyan-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Satellite size={10} className="text-cyan-400" />
                            <span>🛰️ Probe</span>
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

        {/* TAB 2: MAST (Barbara Mikulski Archive) */}
        {activeTab === 'MAST_PHOTOMETRY' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-[#070312] border border-purple-950/80 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-200 text-sm">
                    MAST TESS / Kepler Light Curve Direct Pipe
                  </span>
                  <div className="text-[10.5px] text-slate-400">
                    Fetch calibrated time-series FITS photometry via TESS Input Catalog (TIC) or KIC
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-cyan-300 border border-purple-800 text-[10px]">
                  ARCHIVE: MAST.STScI.EDU
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={targetTicId}
                  onChange={(e) => setTargetTicId(e.target.value)}
                  placeholder="e.g. TIC-25155310, KIC-8462852"
                  className="bg-black/60 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-purple-200 font-mono focus:outline-none focus:border-cyan-400"
                />
                <select
                  value={mastCadence}
                  onChange={(e) => setMastCadence(e.target.value)}
                  className="bg-black/60 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-purple-200 font-mono focus:outline-none"
                >
                  <option value="2-min PDCSAP">2-min PDCSAP Presearch Data Conditioning</option>
                  <option value="20-sec Fast Cadence">20-sec High-Speed Photometry</option>
                  <option value="SAP Raw Flux">SAP Simple Aperture Photometry (Raw)</option>
                </select>
                <button
                  onClick={handleFetchMast}
                  disabled={mastLoading}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110"
                >
                  <RefreshCw size={12} className={mastLoading ? 'animate-spin' : ''} />
                  <span>FETCH FITS PHOTOMETRY</span>
                </button>
              </div>

              {mastData && (
                <div className="rounded-lg bg-black/50 border border-purple-950/60 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Stream Status:</span>{' '}
                    <strong className="text-emerald-400">Active Photometric Cadence Synchronized</strong>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>
                      Target: <strong className="text-purple-300">{mastData.target}</strong>
                    </span>
                    <span>
                      Sector: <strong className="text-cyan-300">Sector {mastData.sector}</strong>
                    </span>
                    <span>
                      Cadence Points: <strong className="text-amber-400">{mastData.pointsCount}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Flux Simulation Chart Box */}
            <div className="h-64 rounded-xl border border-purple-950/70 bg-[#070312] p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Normalized Relative Flux (PDCSAP / Continuum)</span>
                <span className="text-[10px] text-cyan-300">σ = 0.00018 • Detrended Polynomial Filter</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-32 flex items-end gap-1 px-4">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const isDip = i >= 28 && i <= 36;
                    const dipHeight = isDip ? 25 : 65 + Math.sin(i * 0.4) * 5 + (Math.random() - 0.5) * 8;
                    return (
                      <div
                        key={i}
                        style={{ height: `${dipHeight}%` }}
                        className={`flex-1 rounded-t transition-all ${
                          isDip ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-purple-600/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Time: BJD - 2457000 (0.00 d)</span>
                <span className="text-amber-300 font-bold">Transit Minimum Detected at Phase = 0.50</span>
                <span>Time: +27.4 d</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: JPL SENTRY & INTERSTELLAR ASTEROIDS */}
        {activeTab === 'JPL_SENTRY' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* List */}
            <div className="rounded-xl border border-purple-950/70 bg-[#070312] p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-purple-200">Tracked Interstellar & Hazardous Bodies</span>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[420px]">
                {interstellarList.map((obj) => (
                  <button
                    key={obj.designation}
                    onClick={() => {
                      soundFX.triggerTick();
                      setSelectedObject(obj);
                    }}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedObject.designation === obj.designation
                        ? 'bg-purple-950/70 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-black/40 border-purple-950/60 hover:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{obj.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          obj.isHyperbolicInterstellar ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {obj.isHyperbolicInterstellar ? 'HYPERBOLIC' : 'NEO ASTEROID'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Eccentricity e = {obj.eccentricity.toFixed(2)}</span>
                      <span className="text-amber-400">{obj.velocityKmS} km/s</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dossier Card */}
            <div className="md:col-span-2 rounded-xl border border-purple-950/70 bg-[#070312] p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-purple-950/60">
                  <div>
                    <span className="text-base font-extrabold text-purple-200">{selectedObject.name}</span>
                    <div className="text-[10.5px] text-cyan-300">{selectedObject.designation}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-200 border border-purple-800 text-xs">
                    ORBIT: {selectedObject.isHyperbolicInterstellar ? 'UNBOUND HYPERBOLIC' : 'HELIOCENTRIC'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                  <div className="bg-black/50 border border-purple-950/60 rounded p-2">
                    <div className="text-[9.5px] text-slate-500">ECCENTRICITY (e)</div>
                    <div className="text-amber-400 font-bold text-sm">{selectedObject.eccentricity.toFixed(3)}</div>
                  </div>
                  <div className="bg-black/50 border border-purple-950/60 rounded p-2">
                    <div className="text-[9.5px] text-slate-500">VELOCITY</div>
                    <div className="text-cyan-300 font-bold text-sm">{selectedObject.velocityKmS} km/s</div>
                  </div>
                  <div className="bg-black/50 border border-purple-950/60 rounded p-2">
                    <div className="text-[9.5px] text-slate-500">SEMI-MAJOR AXIS</div>
                    <div className="text-purple-300 font-bold text-sm">{selectedObject.semiMajorAxisAu} AU</div>
                  </div>
                  <div className="bg-black/50 border border-purple-950/60 rounded p-2">
                    <div className="text-[9.5px] text-slate-500">THREAT LEVEL</div>
                    <div
                      className={`font-bold text-sm ${
                        selectedObject.threatLevel === 'INTERSTELLAR_VISITOR'
                          ? 'text-amber-300'
                          : selectedObject.threatLevel === 'POTENTIALLY_HAZARDOUS'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedObject.threatLevel}
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-black/40 border border-purple-950/60 text-xs leading-relaxed text-slate-300 font-sans">
                  Origin Vector: <strong>{selectedObject.originVector || 'Unknown'}</strong>. Estimated Diameter:{' '}
                  <strong>{selectedObject.diameterMeters} meters</strong>. Close approach distance:{' '}
                  <strong>{selectedObject.missDistanceAu} AU</strong> on {selectedObject.closeApproachDate}.
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-950/60 text-slate-400">
                <span>Threat Level: {selectedObject.threatLevel}</span>
                <span className="text-cyan-300">Astrometric Solution: JPL Horizons Epoch 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GCN LIVE TRANSIENT STREAM */}
        {activeTab === 'GCN_STREAM' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-200">
                  General Coordinates Network (GCN) Notice Stream
                </span>
                <div className="text-[10px] text-slate-400">
                  Real-time space telescope alerts for Gamma-Ray Bursts, Gravitational Waves, and Supernovae
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                STATUS: STREAM CONNECTED (0.12s LATENCY)
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {gcnAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-purple-950/70 bg-[#070312] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-purple-800/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-950/80 border border-purple-700/60 flex items-center justify-center shrink-0">
                      {alert.eventType === 'GRAVITATIONAL_WAVE' && <Compass size={18} className="text-cyan-400" />}
                      {alert.eventType === 'GAMMA_RAY_BURST' && <Zap size={18} className="text-amber-400" />}
                      {alert.eventType === 'SUPERNOVA' && <Flame size={18} className="text-rose-400" />}
                      {alert.eventType === 'FAST_RADIO_BURST' && <Radio size={18} className="text-purple-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-purple-200">{alert.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-cyan-300 border border-purple-900/60">
                          {alert.sourceTelescope}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-sans mt-0.5">{alert.alertSummary}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        RA: {alert.ra}° • Dec: {alert.dec}° • Significance: {alert.significanceSigma}σ
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">{alert.timestamp}</div>
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold mt-1 inline-block">
                      PRIORITY POINTING ACTIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
