import React, { useState } from 'react';
import {
  Scale,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Send,
  Zap,
  Atom,
} from 'lucide-react';
import {
  generateCourtroomDebate,
  CourtroomSession,
  WITNESS_BOT_PROFILES,
  PRESET_CROSS_EXAMINATION_PROMPTS,
  CourtVerdict,
} from '../../engine/courtroomDebateEngine';
import { STELLA_CORES } from '../../engine/stellaCoreEngine';
import { directorArbiter } from '../../engine/directorBot';
import { soundFX } from '../ui/AudioFeedback';

interface CourtroomDebatePanelProps {
  initialTargetId?: string;
  initialTargetType?: string;
  onDeployRover?: (targetId: string) => void;
  onSelectTarget?: (targetId: string) => void;
  compactMode?: boolean;
}

export default function CourtroomDebatePanel({
  initialTargetId = 'TIC-25155310',
  initialTargetType = 'STELLAR INFRARED ANOMALY (DYSON CANDIDATE)',
  onDeployRover,
  onSelectTarget,
  compactMode = false,
}: CourtroomDebatePanelProps) {
  const [targetId, setTargetId] = useState(initialTargetId);
  const [targetType, setTargetType] = useState(initialTargetType);
  const [selectedBotId, setSelectedBotId] = useState<string>('VOID_WATCHER');
  const [userPrompt, setUserPrompt] = useState<string>(
    'Could this infrared excess be natural circumstellar dust rather than an artificial megastructure?'
  );
  const [strictnessThreshold, setStrictnessThreshold] = useState<number>(85.0);

  // Active Courtroom Session
  const [session, setSession] = useState<CourtroomSession>(() =>
    generateCourtroomDebate(initialTargetId, initialTargetType, 'VOID_WATCHER', userPrompt, 85.0)
  );

  const [isConvening, setIsConvening] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Convene a new Tribunal session
  const handleConveneTribunal = (customPrompt?: string) => {
    soundFX.triggerTick();
    setIsConvening(true);
    setActionNotice('Convening Grand Courtroom Tribunal... Dr. Vesta and Scout entering witness box.');

    const promptToUse = customPrompt !== undefined ? customPrompt : userPrompt;

    setTimeout(() => {
      const newSession = generateCourtroomDebate(
        targetId,
        targetType,
        selectedBotId,
        promptToUse,
        strictnessThreshold
      );
      setSession(newSession);
      setIsConvening(false);
      soundFX.triggerGavelStrike();
      setActionNotice(`Gavel Struck! Grand Tribunal Ruling: ${newSession.finalVerdict.replace(/_/g, ' ')}`);
      setTimeout(() => setActionNotice(null), 4000);
    }, 700);
  };

  // Preset button click
  const handleSelectPreset = (promptText: string) => {
    setUserPrompt(promptText);
    handleConveneTribunal(promptText);
  };

  // Ratify and mint from courtroom
  const handleRatifyRuling = () => {
    soundFX.triggerCertifiedDiscoveryPing();
    soundFX.triggerGavelStrike();
    const approved = directorArbiter.approveAndMintSha256(session.targetId);
    setActionNotice(`Ruling Enforced: Target ${session.targetId} ratified with cryptographic SHA-256 seal.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Reject to Quarantine
  const handleQuarantineRuling = () => {
    soundFX.triggerAnomalyKlaxon();
    directorArbiter.rejectToQuarantine(session.targetId, 'Quashed during neural cross-examination tribunal');
    setActionNotice(`Ruling Enforced: Candidate ${session.targetId} purged to Quarantine.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-purple-900/60 bg-[#060310]/95 p-4 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.12)] font-mono text-slate-200 flex flex-col gap-3.5">
      {/* Courtroom Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-purple-950/70 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-700/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Scale size={20} className="text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300">
                10-BOT NEURAL CROSS-EXAMINATION COURTROOM
              </span>
              <span className="rounded bg-amber-950/80 border border-amber-800/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                TRIBUNAL IN SESSION
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>Scout Witness ➔ Dr. Vesta ➔ Commander Cross-Exam ➔ Director Bot Gavel</span>
              <span className="text-amber-400 font-bold">&bull; 7 Stella-Cores Advising:</span>
              <span className="text-purple-300">Einstein, Feynman, Sagan, Newton, Tesla, Curie, Pythagoras</span>
            </div>
          </div>
        </div>

        {/* Target and Strictness Threshold Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-purple-950">
            <span className="text-[9.5px] text-slate-400">STRICTNESS:</span>
            <span className="text-[10px] font-bold text-amber-300">{strictnessThreshold}%</span>
            <input
              type="range"
              min={70}
              max={99}
              step={1}
              value={strictnessThreshold}
              onChange={(e) => setStrictnessThreshold(Number(e.target.value))}
              className="h-1.5 w-16 appearance-none rounded bg-purple-950 accent-amber-400 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => handleConveneTribunal()}
            disabled={isConvening}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Play size={12} />
            <span>{isConvening ? 'CONVENING...' : 'CONVENE TRIBUNAL'}</span>
          </button>
        </div>
      </div>

      {/* Target & Witness Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-black/40 p-2.5 rounded-xl border border-purple-950/50 text-xs">
        {/* Target Anomaly Selector */}
        <div>
          <label className="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">
            TARGET UNDER ADJUDICATION:
          </label>
          <div className="flex items-center gap-1.5">
            <select
              value={targetId}
              onChange={(e) => {
                const val = e.target.value;
                setTargetId(val);
                if (val === 'TIC-25155310') {
                  setTargetType('STELLAR INFRARED ANOMALY (DYSON CANDIDATE)');
                  setSelectedBotId('VOID_WATCHER');
                } else if (val === 'Kepler-452 b') {
                  setTargetType('HABITABLE ZONE SUPER-EARTH (KOPPARAPU COMPLIANT)');
                  setSelectedBotId('KEPLER_BOT');
                } else if (val === '1I-2017-U1') {
                  setTargetType('HYPERBOLIC INTERSTELLAR VISITOR (e=1.1995)');
                  setSelectedBotId('OUMUAMUA_TRACKER');
                } else if (val === 'GW-260114') {
                  setTargetType('BINARY BLACK HOLE COALESCENCE CHIRP');
                  setSelectedBotId('LIGO_RIPPLE');
                } else {
                  setTargetType('ATMOSPHERIC TRANSMISSION BIOMARKER');
                  setSelectedBotId('JWST_SPECTRA');
                }
              }}
              className="w-full bg-black/80 border border-purple-900/60 rounded-lg px-2.5 py-1 text-xs text-purple-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="TIC-25155310">TIC-25155310 (WISE Dyson Swarm Candidate)</option>
              <option value="Kepler-452 b">Kepler-452 b (Earth 2.0 Habitable Candidate)</option>
              <option value="1I-2017-U1">'Oumuamua (Interstellar Visitor e=1.1995)</option>
              <option value="GW-260114">GW-260114 (Relativistic Black Hole Merger)</option>
              <option value="K2-18 b">K2-18 b (JWST Atmospheric Biosignature Candidate)</option>
            </select>
          </div>
        </div>

        {/* Witness Scout Bot */}
        <div className="md:col-span-2">
          <label className="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">
            SELECT SCOUT WITNESS TO TAKE THE STAND:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(WITNESS_BOT_PROFILES).map(([key, bot]) => {
              const isSelected = selectedBotId === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    soundFX.triggerTick();
                    setSelectedBotId(key);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-900/80 border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-black/50 border-purple-950 text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <span>{bot.icon}</span>
                  <span>{bot.name.replace('-Bot', '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preset Interrogation Rapid-Fire Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9.5px] text-slate-400">
          <span className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
            <Zap size={11} className="text-amber-400" />
            <span>RAPID-FIRE CROSS-EXAMINATION CHALLENGES:</span>
          </span>
          <span className="text-[9px] text-slate-500">Click any premise to instantly cross-examine</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CROSS_EXAMINATION_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.prompt)}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-purple-950/60 border border-purple-900/40 text-[9.5px] text-slate-300 hover:text-amber-200 transition-colors text-left"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Commander Cross-Examination Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConveneTribunal();
            }}
            placeholder="Type your own rigorous cross-examination challenge to the witness (e.g., 'How do you rule out a contact binary?')..."
            className="w-full rounded-xl bg-black/70 border border-purple-900/60 pl-3 pr-10 py-2 text-xs text-purple-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => handleConveneTribunal()}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-600 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] whitespace-nowrap"
        >
          <Send size={12} />
          <span>Cross-Examine</span>
        </button>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className="rounded-lg bg-purple-950/80 border border-purple-600/60 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* The 4-Turn Adversarial Courtroom Dialogue Transcript */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
        {session.turns.map((turn, idx) => {
          const isWitness = turn.stage === 'WITNESS_TESTIMONY';
          const isVesta = turn.stage === 'THEORETICAL_CHALLENGE';
          const isUser = turn.stage === 'USER_CROSS_EXAMINATION';
          const isVerdict = turn.stage === 'JUDICIAL_VERDICT';

          let borderTheme = 'border-purple-950/70 bg-[#0a0618]/90';
          let badgeTheme = 'bg-purple-950 text-purple-300 border-purple-800';

          if (isWitness) {
            borderTheme = 'border-cyan-900/60 bg-[#040c18]/90';
            badgeTheme = 'bg-cyan-950 text-cyan-300 border-cyan-800';
          } else if (isVesta) {
            borderTheme = 'border-purple-800/70 bg-[#120524]/90';
            badgeTheme = 'bg-purple-900 text-purple-200 border-purple-600';
          } else if (isUser) {
            borderTheme = 'border-emerald-900/60 bg-[#041610]/90';
            badgeTheme = 'bg-emerald-950 text-emerald-300 border-emerald-800';
          } else if (isVerdict) {
            borderTheme = 'border-amber-700/80 bg-[#1a0e03]/95 shadow-[0_0_25px_rgba(245,158,11,0.2)]';
            badgeTheme = 'bg-amber-950 text-amber-300 border-amber-700';
          }

          return (
            <div
              key={turn.id}
              className={`rounded-xl border p-3.5 backdrop-blur-md flex flex-col gap-2 transition-all ${borderTheme}`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{turn.speakerIcon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{turn.speakerName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] border font-bold ${badgeTheme}`}>
                        {turn.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400">{turn.speakerRole}</div>
                  </div>
                </div>

                {isVerdict && turn.verdictStatus && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        turn.verdictStatus === 'RATIFIED_CERTIFIED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : turn.verdictStatus === 'REMANDED_OBSERVATION'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                          : 'bg-rose-950/80 text-rose-300 border-rose-600'
                      }`}
                    >
                      {turn.verdictStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {turn.verdictScore?.toFixed(1)}% CONFIDENCE
                    </span>
                  </div>
                )}
              </div>

              {/* Testimony Body */}
              <div className="text-xs text-slate-200 leading-relaxed font-sans bg-black/40 p-2.5 rounded-lg border border-purple-950/40">
                {turn.testimony}
              </div>

              {/* Mathematical Principle & Evidence Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-950/40 text-[9.5px]">
                <div className="text-slate-400 flex items-center gap-1">
                  <span className="text-slate-500 font-bold uppercase">PHYSICAL PRINCIPLE:</span>
                  <span className="text-purple-300 font-mono font-semibold">{turn.mathematicalPrinciple}</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {turn.evidenceTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/40 text-[8.5px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cryptographic SHA-256 seal stamp on Ratified Verdict */}
              {isVerdict && turn.sha256Seal && (
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-600/50 p-2 text-[9px] text-emerald-300 font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>{turn.sha256Seal}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">TAMPER-PROOF MINT</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enforcement & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-purple-950/70 pt-2.5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRatifyRuling}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>Enforce Ruling &amp; Mint SHA-256</span>
          </button>

          <button
            type="button"
            onClick={handleQuarantineRuling}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 text-xs font-bold transition-all cursor-pointer"
          >
            <XCircle size={13} />
            <span>Quash to Quarantine</span>
          </button>
        </div>

        {onDeployRover && (
          <button
            type="button"
            onClick={() => onDeployRover(session.targetId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all cursor-pointer"
          >
            <Rocket size={13} />
            <span>Deploy 3D Rover to {session.targetId}</span>
          </button>
        )}
      </div>
    </div>
  );
}
