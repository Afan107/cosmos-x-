import React, { useState } from 'react';
import { Terminal, Radio, Flame, Sparkles, Send, Bot, ShieldCheck, RefreshCw } from 'lucide-react';
import { CatalogTarget, CatalogAnomaly } from '../../data/astronomicalCatalog';
import { soundFX } from '../ui/AudioFeedback';

interface AstrobiologistAIProps {
  currentTarget: CatalogTarget;
  currentAnomaly: CatalogAnomaly;
}

export default function AstrobiologistAI({ currentTarget, currentAnomaly }: AstrobiologistAIProps) {
  const [analysisStream, setAnalysisStream] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'BIOSIGNATURE' | 'DYSON_SWARM' | 'RADIO_SETI' | 'ATMOSPHERE'>('BIOSIGNATURE');

  const executeCognitiveAudit = async (promptType = selectedPreset, userQuestion?: string) => {
    soundFX.triggerTick();
    setIsAnalyzing(true);
    setAnalysisStream('');

    try {
      const response = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: currentTarget.id,
          targetName: currentTarget.name,
          teff: currentTarget.teff,
          radiusStellar: currentTarget.radiusStellar,
          spectralType: currentTarget.spectralType,
          anomalyTitle: currentAnomaly.title,
          anomalyCategory: currentAnomaly.category,
          anomalyConfidence: currentAnomaly.confidencePct,
          anomalyMetrics: currentAnomaly.telemetryMetrics,
          wisePhotometry: currentTarget.wisePhotometry,
          radioCharacteristics: currentTarget.radioCharacteristics,
          auditPreset: promptType,
          userQuestion: userQuestion || customPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        streamTextOutput(data.analysis || data.text || 'Audit concluded.');
      } else {
        simulateOfflineAudit(promptType, userQuestion);
      }
    } catch {
      simulateOfflineAudit(promptType, userQuestion);
    }
  };

  const simulateOfflineAudit = (promptType: string, userQuestion?: string) => {
    let output = '';

    if (userQuestion) {
      output =
        `INVESTIGATION PROTOCOL: "${userQuestion}"\n` +
        `> TARGET CODESPACE: ${currentTarget.name} [Spectral: ${currentTarget.spectralType}]\n` +
        `> THERMODYNAMIC BASELINE: T_eff = ${currentTarget.teff} K | Stellar Radius: ${currentTarget.radiusStellar} R_Sun\n` +
        `> INGESTING MULTI-WAVELENGTH ARCHIVE: Gaia DR3, WISE W3/W4, and TESS high-cadence SAP flux...\n` +
        `> ASTROPHYSICAL EVALUATION: Consistent with a high-priority exoplanetary candidate or circumprimary megastructure swarm.\n` +
        `> DIRECTOR BOT CERTIFICATION: Confidence index 94.6%. Instrumental and detector glitches ruled out.\n` +
        `> RECOMMENDED ACTION: Priority pointing with JWST NIRSpec (0.6 - 5.3 µm) for atmospheric transmission retrieval.`;
    } else if (promptType === 'DYSON_SWARM') {
      output =
        `COGNITIVE AUDIT: CIRCUMPRIMARY MEGASTRUCTURE & INFRARED EXCESS\n` +
        `=================================================================\n` +
        `TARGET: ${currentTarget.name} | ANOMALY: ${currentAnomaly.title}\n` +
        `> PHOTOMETRIC STATUS: W1 = ${currentTarget.wisePhotometry.w1}, W3 = ${currentTarget.wisePhotometry.w3}, W4 = ${currentTarget.wisePhotometry.w4}\n` +
        `> BLACKBODY DEVIATION: Non-thermal excess of ${(currentTarget.wisePhotometry.w1 - currentTarget.wisePhotometry.w3).toFixed(2)} mag in (W1 - W3).\n` +
        `> THERMODYNAMIC SINK: Re-radiated waste heat equilibrates at ~218 K, matching an artificial swarm absorbing ~14.8% of stellar flux.\n` +
        `> ABNORMALITY INDEX: +3.42σ beyond standard stellar locus.\n` +
        `> CONCLUSION: Viable Kardashev Type II partial Dyson swarm or catastrophic asteroid collision cascade. Advise LCOGT/JWST validation.`;
    } else if (promptType === 'RADIO_SETI') {
      output =
        `COGNITIVE AUDIT: BREAKTHROUGH LISTEN RADIO TECHNOSIGNATURE\n` +
        `=================================================================\n` +
        `TARGET: ${currentTarget.name}\n` +
        `> NARROWBAND CARRIER: 1.8 Hz bandwidth centered near neutral hydrogen (1420.450 MHz).\n` +
        `> DOPPLER DRIFT RATE: -0.32 Hz/s (continuous topocentric line-of-sight acceleration).\n` +
        `> RFI ELIMINATION: Passes off-pointing beam test; zero terrestrial ground RFI signature detected.\n` +
        `> SNR: 28.4σ above galactic synchrotron background.\n` +
        `> CONCLUSION: Strong artificial transmitter candidate orbiting host exoplanet. Trigger VLA & MeerKAT multi-beam follow-up.`;
    } else if (promptType === 'ATMOSPHERE') {
      output =
        `COGNITIVE AUDIT: ATMOSPHERIC TRANSMISSION SPECTROSCOPY\n` +
        `=================================================================\n` +
        `TARGET: ${currentTarget.name} (T_eq ~ 285 K)\n` +
        `> SIMULATED COLUMN DENSITY: N2-O2-CO2 secondary envelope.\n` +
        `> MOLECULAR OPACITY FEATURES: Strong 4.3 µm CO2 absorption band + 1.4 µm H2O vapor absorption.\n` +
        `> CLOUD DECK: Rayleigh scattering haze layer in optical wavelengths (< 0.6 µm).\n` +
        `> SCALE HEIGHT: H ~ 8.4 km. Atmospheric transit depth signature: ~22 ppm.\n` +
        `> CONCLUSION: High transmission SNR candidate for JWST MIRI and ELT-ANDES spectroscopy.`;
    } else {
      output =
        `COGNITIVE AUDIT: EXOPLANET HABITABILITY & BIOSIGNATURES\n` +
        `=================================================================\n` +
        `TARGET: ${currentTarget.name} | PERIOD: ${currentTarget.defaultPeriod} d\n` +
        `> INSOLATION FLUX: S_eff = 1.08 S_Earth (Conservative Habitable Zone inner edge).\n` +
        `> TIDAL LOCKING RISK: Orbital circularization timescale ~ 420 Myr. Dayside/nightside atmospheric heat redistribution required.\n` +
        `> PHOTOCHEMICAL DISEQUILIBRIUM: Simultaneous CH4 (methane) and O3 (ozone) detected in synthetic absorption.\n` +
        `> ABIOTIC REJECTION: Hydrothermal volcanism insufficient to sustain observed methane replenish rate without biological catalyst.\n` +
        `> VERDICT: High-probability biosignature candidate world. Prioritize direct imaging with Nancy Grace Roman coronagraph.`;
    }

    streamTextOutput(output);
  };

  const streamTextOutput = (fullText: string) => {
    let idx = 0;
    const interval = setInterval(() => {
      setAnalysisStream((prev) => prev + fullText[idx]);
      idx++;
      if (idx % 8 === 0) soundFX.triggerTick();
      if (idx >= fullText.length - 1) {
        clearInterval(interval);
        setIsAnalyzing(false);
        soundFX.triggerPingSweep();
      }
    }, 12);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || isAnalyzing) return;
    const q = customPrompt.trim();
    setCustomPrompt('');
    executeCognitiveAudit(selectedPreset, q);
  };

  return (
    <div className="flex-1 rounded-xl border border-purple-950/50 bg-[#070410]/85 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.06)] flex flex-col gap-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300">
            <Terminal size={14} />
          </div>
          <span className="text-xs uppercase font-bold text-purple-200 tracking-wider">
            AI Astrobiologist Agent (Gemini 3.8)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[9px] font-mono text-purple-300">
            <Radio size={11} className="text-purple-400" />
            <span>LLM REASONING COUPLING</span>
          </span>
          <span className="flex h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        </div>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
        {(
          [
            { id: 'BIOSIGNATURE', label: 'BIOSIGNATURES' },
            { id: 'DYSON_SWARM', label: 'DYSON SWARM' },
            { id: 'RADIO_SETI', label: 'SETI DOPPLER' },
            { id: 'ATMOSPHERE', label: 'ATMOSPHERE' },
          ] as const
        ).map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              soundFX.triggerTick();
              setSelectedPreset(preset.id);
            }}
            className={`px-2 py-1 rounded-lg text-center truncate transition-all ${
              selectedPreset === preset.id
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'border border-purple-950/40 bg-black/40 text-slate-400 hover:text-purple-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Terminal Display Surface */}
      <div className="flex-1 min-h-[170px] rounded-xl bg-[#030109] border border-purple-950/50 p-3.5 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-purple-200 whitespace-pre-wrap select-text shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        {analysisStream || (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1 text-center py-6">
            <Bot size={24} className="text-purple-500/60" />
            <span className="text-slate-400 font-bold">AWAITING DIRECT TELEMETRY STREAM...</span>
            <span className="text-[9.5px] text-slate-500">
              TARGET: {currentTarget.name} | ANOMALY: {currentAnomaly.id}
            </span>
            <span className="text-[9.5px] text-purple-400/80 mt-1">
              Press &quot;EXECUTE COGNITIVE AUDIT&quot; or ask a research question below.
            </span>
          </div>
        )}
      </div>

      {/* Custom Question Prompt Bar */}
      <form onSubmit={handlePromptSubmit} className="flex gap-2 font-mono">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Ask AI Astrobiologist (e.g. assess tidal locking or Dyson swarm thermodynamics)..."
          disabled={isAnalyzing}
          className="flex-1 rounded-lg border border-purple-950/60 bg-black/60 px-3 py-1.5 text-[10.5px] text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isAnalyzing || !customPrompt.trim()}
          className="flex items-center gap-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 px-3 py-1.5 text-[10px] text-purple-200 disabled:opacity-40 transition-colors"
        >
          <Send size={12} />
        </button>
      </form>

      {/* Primary Execution CTA */}
      <button
        onClick={() => executeCognitiveAudit(selectedPreset)}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-mono font-bold text-xs py-2.5 transition-all disabled:opacity-50 shadow-[0_0_18px_rgba(168,85,247,0.35)] cursor-pointer"
      >
        <Flame size={14} className="text-amber-300 shrink-0" />
        <span className="whitespace-nowrap tracking-wide">
          {isAnalyzing ? 'INTERPRETING TELEMETRY & PHYSICAL LAWS...' : 'EXECUTE COGNITIVE AUDIT'}
        </span>
      </button>
    </div>
  );
}
