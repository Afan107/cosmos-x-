import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
  Bot,
  Zap,
  Globe,
  Terminal,
  Activity,
} from 'lucide-react';
import { hiddenOps, DiagnosticLog } from '../../engine/hiddenOpsBots';
import { soundFX } from '../ui/AudioFeedback';

interface HiddenOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HiddenOpsModal({ isOpen, onClose }: HiddenOpsModalProps) {
  const [webhookUrl, setWebhookUrl] = useState(() => hiddenOps.getGoogleChatWebhook());
  const [logs, setLogs] = useState<DiagnosticLog[]>(() => hiddenOps.getLogs());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const unsub = hiddenOps.subscribe(() => {
      setLogs(hiddenOps.getLogs());
      setWebhookUrl(hiddenOps.getGoogleChatWebhook());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSaveWebhook = () => {
    soundFX.triggerTick();
    hiddenOps.setGoogleChatWebhook(webhookUrl);
    setFeedbackMsg({ text: 'Google Chat Webhook endpoint updated and armed.', isError: false });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleTestDispatch = async () => {
    soundFX.triggerTick();
    setIsTestingWebhook(true);
    setFeedbackMsg(null);
    try {
      const res = await hiddenOps.testDispatchGoogleChat();
      setFeedbackMsg({ text: res.message, isError: !res.success });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleClearLogs = () => {
    soundFX.triggerTick();
    hiddenOps.clearLogs();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-mono">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-purple-900/80 bg-[#070312] shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-purple-950/80 bg-[#0b051c] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Bot size={18} className="text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wider text-purple-200">
                  HIDDEN OPS DAEMON BOT CONTROL &amp; GOOGLE CHAT LOGS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-[9px] text-emerald-300 font-bold">
                  AUTONOMOUS SENTINEL ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Hidden Bot #1 (WatchdogSelfHealer) &bull; Hidden Bot #2 (LiveAstrophysicsRenderBot)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-purple-950/60 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Webhook Configuration Bar */}
        <div className="border-b border-purple-950/60 bg-black/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold">
              <Send size={13} className="text-cyan-400" />
              <span>GOOGLE CHAT INCOMING WEBHOOK CONDUIT</span>
            </div>
            <span className="text-[9.5px] text-slate-400">
              Dispatches real-time error traces and self-healing telemetry directly to your team space
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 rounded-xl bg-[#0e0720] border border-purple-900/60 px-3.5 py-2 text-xs text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-400 transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-600 text-purple-100 text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            >
              Arm Webhook
            </button>
            <button
              type="button"
              disabled={isTestingWebhook || !webhookUrl}
              onClick={handleTestDispatch}
              className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
            >
              {isTestingWebhook ? 'Testing...' : 'Test Ping'}
            </button>
          </div>

          {feedbackMsg && (
            <div
              className={`text-[10px] px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                feedbackMsg.isError
                  ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              }`}
            >
              {feedbackMsg.isError ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}
        </div>

        {/* Live Intercepted Diagnostics & Auto-Healing Stream */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Activity size={13} className="text-purple-400" />
              <span>INTERCEPTED RUNTIME LOGS &amp; AUTO-HEAL ACTIONS ({logs.length})</span>
            </div>
            <button
              type="button"
              onClick={handleClearLogs}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Clear Log Buffer</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <CheckCircle2 size={24} className="text-emerald-500/70" />
                <span>All telemetry pipelines nominal. No unhandled errors or NaN vectors recorded.</span>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-xl border p-3 text-xs flex flex-col gap-1.5 transition-all ${
                    log.level === 'ERROR'
                      ? 'border-rose-900/60 bg-rose-950/20'
                      : log.level === 'WARNING'
                      ? 'border-amber-900/60 bg-amber-950/20'
                      : 'border-emerald-900/60 bg-emerald-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                          log.level === 'ERROR'
                            ? 'bg-rose-900 text-rose-200'
                            : log.level === 'WARNING'
                            ? 'bg-amber-900 text-amber-200'
                            : 'bg-emerald-900 text-emerald-200'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="font-bold text-slate-200">{log.source}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {log.dispatchedToWebhook && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[8.5px]">
                          GOOGLE CHAT DISPATCHED
                        </span>
                      )}
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 font-sans">{log.message}</div>

                  {log.rawDetails && (
                    <div className="rounded bg-black/50 p-1.5 text-[9.5px] text-slate-400 border border-purple-950/60 font-mono break-all">
                      {log.rawDetails}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40">
                    <Zap size={11} className="text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-emerald-300">Auto-Fix Applied: </strong>
                      {log.autoFixApplied}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-purple-950/60 bg-[#090416] px-5 py-2.5 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Watchdog Daemon: Polling WebGL Context, Fetch Pipes &amp; Numerical NaNs</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-200 font-bold border border-purple-800"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
