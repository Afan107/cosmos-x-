import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Activity,
  Upload,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { CatalogTarget } from '../../data/astronomicalCatalog';
import {
  generateSyntheticLightCurve,
  runBLSSearch,
  computeExoplanetCharacteristics,
  TransitSolution,
} from '../../engine/transitSolver';
import { soundFX } from '../ui/AudioFeedback';
import CustomTelemetryIngestor from '../panels/CustomTelemetryIngestor';

interface LightCurveViewerProps {
  target: CatalogTarget;
}

export default function LightCurveViewer({ target }: LightCurveViewerProps) {
  const [viewMode, setViewMode] = useState<'TIME_SERIES' | 'PHASE_FOLDED' | 'BLS_PERIODOGRAM'>('TIME_SERIES');
  const [showRawScatter, setShowRawScatter] = useState(true);
  const [showDetrended, setShowDetrended] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showExplainHelp, setShowExplainHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate synthetic photometric light curve based on current target properties
  const lightCurveData = useMemo(() => {
    return generateSyntheticLightCurve(
      target.defaultPeriod,
      target.defaultTransitDepth,
      target.defaultDurationHours,
      28,
      30,
      0.00032
    );
  }, [target]);

  // Compute Transit & BLS solutions
  const [transitSolution, setTransitSolution] = useState<TransitSolution>(() => {
    const bls = runBLSSearch(lightCurveData.time, lightCurveData.detrendedFlux, 0.5, 25.0, 150);
    const char = computeExoplanetCharacteristics(
      bls.transitDepth,
      target.radiusStellar,
      target.teff,
      bls.period,
      target.massStellar || 1.0
    );
    return {
      ...bls,
      ...char,
      transitDurationHours: bls.durationHours,
      detectionPower: bls.maxPower,
      snr: Number((bls.maxPower / 1.8).toFixed(1)),
    };
  });

  // Re-sync transit solution whenever the active target or its light curve data changes
  useEffect(() => {
    const bls = runBLSSearch(lightCurveData.time, lightCurveData.detrendedFlux, 0.5, 25.0, 150);
    const char = computeExoplanetCharacteristics(
      bls.transitDepth,
      target.radiusStellar,
      target.teff,
      bls.period,
      target.massStellar || 1.0
    );
    setTransitSolution({
      ...bls,
      ...char,
      transitDurationHours: bls.durationHours,
      detectionPower: bls.maxPower,
      snr: Number((bls.maxPower / 1.8).toFixed(1)),
    });
  }, [target, lightCurveData]);

  const handleRunBLS = () => {
    soundFX.triggerTick();
    setIsSolving(true);
    setTimeout(() => {
      const bls = runBLSSearch(lightCurveData.time, lightCurveData.detrendedFlux, 0.5, 25.0, 200);
      const char = computeExoplanetCharacteristics(
        bls.transitDepth,
        target.radiusStellar,
        target.teff,
        bls.period,
        target.massStellar || 1.0
      );
      setTransitSolution({
        ...bls,
        ...char,
        transitDurationHours: bls.durationHours,
        detectionPower: bls.maxPower,
        snr: Number((bls.maxPower / 1.8).toFixed(1)),
      });
      setIsSolving(false);
      soundFX.triggerPingSweep();
    }, 450);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundFX.triggerTick();
    setUploadedFileName(file.name);
    setIsSolving(true);
    setTimeout(() => {
      setIsSolving(false);
      soundFX.triggerPingSweep();
    }, 500);
  };

  // Phase Folded Points calculation
  const phasePoints = useMemo(() => {
    const P = transitSolution.period || target.defaultPeriod;
    const epoch = transitSolution.transitEpoch || 0;
    const points: { phase: number; flux: number }[] = [];

    for (let i = 0; i < lightCurveData.time.length; i++) {
      const t = lightCurveData.time[i];
      let phase = (((t - epoch) % P) + P) % P;
      phase = phase / P;
      if (phase > 0.5) phase -= 1.0;
      points.push({ phase, flux: lightCurveData.detrendedFlux[i] });
    }
    return points.sort((a, b) => a.phase - b.phase);
  }, [lightCurveData, transitSolution, target]);

  return (
    <div className="rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300">
            <Activity size={14} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-200">
                Target Flux Telemetry: <strong className="text-purple-300 font-mono">{target.id}</strong>
              </span>
              <button
                onClick={() => {
                  soundFX.triggerTick();
                  setShowExplainHelp(!showExplainHelp);
                }}
                className="text-slate-500 hover:text-purple-300 transition-colors"
                title="Toggle Plain-English Scientific Explanations"
              >
                <HelpCircle size={13} />
              </button>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono">
              {target.spectralType} | T_eff: {target.teff.toLocaleString()} K | R_*: {target.radiusStellar} R<sub className="text-[7px]">☉</sub>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-purple-900/60 bg-purple-950/40 hover:bg-purple-900/60 px-2.5 py-1 text-[9.5px] font-mono text-purple-300 transition-colors"
          >
            <Upload size={11} />
            <span>{uploadedFileName ? 'FITS LOADED' : 'LOAD FITS'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fits,.fits.gz,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleRunBLS}
            disabled={isSolving}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1 text-[9.5px] font-mono font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] disabled:opacity-50 transition-all"
          >
            <Play size={11} />
            <span>{isSolving ? 'SOLVING BLS...' : 'RUN BLS SEARCH'}</span>
          </button>
        </div>
      </div>

      {/* Plain-English Scientific Guide Drawer */}
      {showExplainHelp && (
        <div className="rounded-lg bg-purple-950/30 border border-purple-800/40 p-3 text-[10.5px] font-mono text-slate-300 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs pb-1 border-b border-purple-900/40">
            <Info size={13} />
            <span>How to Read This Exoplanet Telemetry (Plain English)</span>
          </div>
          <div>
            <strong className="text-purple-200">1. Transit Depth (Dip): </strong>
            How much starlight the orbiting planet blocks. Deeper dips mean larger planets. Calculated via{' '}
            <code className="text-purple-300">Depth = (R_planet / R_star)²</code>.
          </div>
          <div>
            <strong className="text-purple-200">2. Box Least Squares (BLS): </strong>
            An algorithm that searches thousands of trial orbital periods to find periodic square dips repeated across weeks.
          </div>
          <div>
            <strong className="text-purple-200">3. Habitable Zone: </strong>
            The orbital sweet spot where temperatures allow liquid water to pool on the planet&apos;s surface without freezing or boiling away.
          </div>
        </div>
      )}

      {/* View Switcher & Display Toggles */}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1 rounded-lg bg-black/50 p-1 border border-purple-950/40">
          {(
            [
              { id: 'TIME_SERIES', label: 'TIME SERIES (DAYS)' },
              { id: 'PHASE_FOLDED', label: 'PHASE FOLDED (φ)' },
              { id: 'BLS_PERIODOGRAM', label: 'BLS SPECTRUM' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.triggerTick();
                setViewMode(tab.id);
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === tab.id
                  ? 'bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          {viewMode === 'TIME_SERIES' && (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRawScatter}
                  onChange={(e) => setShowRawScatter(e.target.checked)}
                  className="rounded border-purple-800 bg-purple-950 text-purple-400 accent-purple-500"
                />
                <span className="text-[9.5px]">Raw Scatter</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDetrended}
                  onChange={(e) => setShowDetrended(e.target.checked)}
                  className="rounded border-purple-800 bg-purple-950 text-purple-400 accent-purple-500"
                />
                <span className="text-[9.5px]">Savitzky-Golay</span>
              </label>
            </>
          )}

          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-purple-950/30">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
              className="p-1 rounded hover:bg-purple-950/60 text-purple-300"
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
              className="p-1 rounded hover:bg-purple-950/60 text-purple-300"
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded hover:bg-purple-950/60 text-slate-400"
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas / SVG Plot Surface */}
      <div className="relative h-48 w-full rounded-xl bg-[#04020a] border border-purple-950/40 overflow-hidden flex items-center justify-center select-none shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
        {/* VIEW 1: Time Series */}
        {viewMode === 'TIME_SERIES' && (
          <svg className="w-full h-full p-2.5" viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleFluxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal 1.0 Baseline */}
            <line x1="10" y1="75" x2="490" y2="75" stroke="#3b0764" strokeDasharray="3,3" strokeWidth="1" />
            <text x="12" y="70" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              NORMALIZED FLUX: 1.0000
            </text>

            {/* Scatter points of raw flux */}
            {showRawScatter &&
              lightCurveData.time.slice(0, 180).map((t, i) => {
                const x = 15 + (i / 180) * 470;
                const rawVal = lightCurveData.rawFlux[i];
                const y = 75 - (rawVal - 1.0) * 8000 * zoomLevel;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={Math.max(10, Math.min(140, y))}
                    r="1.3"
                    fill="#22d3ee"
                    opacity={0.5}
                  />
                );
              })}

            {/* Savitzky-Golay detrended continuous curve */}
            {showDetrended && (
              <path
                d={lightCurveData.time.slice(0, 180).reduce((acc, t, i) => {
                  const x = 15 + (i / 180) * 470;
                  const detrended = lightCurveData.detrendedFlux[i];
                  const y = 75 - (detrended - 1.0) * 8000 * zoomLevel;
                  const clampedY = Math.max(10, Math.min(140, y));
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${clampedY}`;
                }, '')}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.8"
              />
            )}
          </svg>
        )}

        {/* VIEW 2: Phase Folded Curve */}
        {viewMode === 'PHASE_FOLDED' && (
          <svg className="w-full h-full p-2.5" viewBox="0 0 500 150" preserveAspectRatio="none">
            {/* Center Phase Zero Line */}
            <line x1="250" y1="10" x2="250" y2="140" stroke="#7e22ce" strokeDasharray="2,2" strokeWidth="1" />
            <text x="254" y="22" fill="#c084fc" fontSize="8" fontFamily="monospace">
              MID-TRANSIT OCCULTATION (φ = 0.0)
            </text>

            {/* Baseline 1.0 */}
            <line x1="20" y1="55" x2="480" y2="55" stroke="#3b0764" strokeWidth="1" />

            {/* Phase data scatter */}
            {phasePoints.map((pt, i) => {
              const x = 250 + pt.phase * 460;
              const y = 55 - (pt.flux - 1.0) * 12000 * zoomLevel;
              const isInTransit = Math.abs(pt.phase) < 0.06;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={Math.max(15, Math.min(135, y))}
                  r="1.4"
                  fill={isInTransit ? '#fbbf24' : '#22d3ee'}
                  opacity={isInTransit ? 0.85 : 0.6}
                />
              );
            })}

            {/* Mandel-Agol Theoretical Transit Dip Profile */}
            <path
              d="M 40 55 L 205 55 L 225 105 L 275 105 L 295 55 L 460 55"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.2"
            />
          </svg>
        )}

        {/* VIEW 3: BLS Periodogram Power Spectrum */}
        {viewMode === 'BLS_PERIODOGRAM' && (
          <svg className="w-full h-full p-2.5" viewBox="0 0 500 150" preserveAspectRatio="none">
            <path
              d={transitSolution.periodsSpectrum.reduce((acc, p, i) => {
                const x = 20 + (i / transitSolution.periodsSpectrum.length) * 460;
                const power = transitSolution.powerSpectrum[i] || 0;
                const y = 140 - Math.min(125, power * 7);
                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
            />
            <circle cx="210" cy="30" r="4.5" fill="#fbbf24" />
            <text x="220" y="34" fill="#fbbf24" fontSize="9" fontFamily="monospace">
              DISCOVERED PERIOD: {transitSolution.period} DAYS (POWER: {transitSolution.detectionPower})
            </text>
          </svg>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-2 right-2.5 rounded-lg bg-black/85 px-2.5 py-1 text-[9px] font-mono text-purple-300 border border-purple-900/50">
          PERIOD: {transitSolution.period} d | DEPTH: {(transitSolution.transitDepth * 1e6).toFixed(0)} ppm
        </div>
      </div>

      {/* Extracted Transit Physical Parameters */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        <div className="rounded-lg border border-purple-950/40 bg-purple-950/20 p-2">
          <div className="text-[8.5px] text-slate-400">PLANET RADIUS</div>
          <div className="text-sm font-bold text-purple-200">
            {transitSolution.planetRadiusEarth} R<sub className="text-[8px] font-normal">Earth</sub>
          </div>
          <div className="text-[8px] text-slate-500">Rp/R* = {transitSolution.radiusRatio}</div>
        </div>

        <div className="rounded-lg border border-purple-950/40 bg-purple-950/20 p-2">
          <div className="text-[8.5px] text-slate-400">SEMI-MAJOR AXIS</div>
          <div className="text-sm font-bold text-cyan-300">{transitSolution.semiMajorAxisAu} AU</div>
          <div className="text-[8px] text-slate-500">T_eq: {transitSolution.equilibriumTempK} K</div>
        </div>

        <div className="rounded-lg border border-purple-950/40 bg-purple-950/20 p-2">
          <div className="text-[8.5px] text-slate-400">HABITABLE ZONE</div>
          <div
            className={`text-sm font-bold ${
              transitSolution.inHabitableZone
                ? 'text-emerald-400'
                : transitSolution.hzStatus === 'TOO_HOT'
                ? 'text-amber-400'
                : 'text-purple-300'
            }`}
          >
            {transitSolution.hzStatus.replace('_', ' ')}
          </div>
          <div className="text-[8px] text-slate-500">
            [{transitSolution.hzBoundariesAu[0]} - {transitSolution.hzBoundariesAu[1]} AU]
          </div>
        </div>

        <div className="rounded-lg border border-purple-950/40 bg-purple-950/20 p-2">
          <div className="text-[8.5px] text-slate-400">TRANSIT DURATION</div>
          <div className="text-sm font-bold text-purple-200">{transitSolution.transitDurationHours} hrs</div>
          <div className="text-[8px] text-slate-500">SNR: {transitSolution.snr}σ</div>
        </div>
      </div>

      {/* Bring Your Own Telescope (Raw CSV Light Curve & Astrophotography Ingestor) */}
      <CustomTelemetryIngestor />
    </div>
  );
}
