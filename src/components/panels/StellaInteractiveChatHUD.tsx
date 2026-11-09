import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Atom,
  Bot,
  Sparkles,
  ShieldCheck,
  Scale,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { STELLA_CORES, StellaMind } from '../../engine/stellaCoreEngine';
import { generateStellaChatResponse, StellaChatMessage } from '../../engine/stellaConversationalEngine';
import { auth, signInWithGoogle, logoutUser, subscribeAuth, db, handleFirestoreError, OperationType } from '../../engine/firebaseClient';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { soundFX } from '../ui/AudioFeedback';
import type { User } from 'firebase/auth';

interface StellaInteractiveChatHUDProps {
  targetName?: string;
  anomalyTitle?: string;
  spectralType?: string;
  initialStellaId?: string;
  compactMode?: boolean;
}

export default function StellaInteractiveChatHUD({
  targetName = 'TIC-25155310',
  anomalyTitle = 'Dyson Sphere Candidate (Mid-IR Thermal Excess)',
  spectralType = 'G5V Dwarf',
  initialStellaId = 'STELLA_01',
  compactMode = false,
}: StellaInteractiveChatHUDProps) {
  const [selectedStellaId, setSelectedStellaId] = useState<string>(initialStellaId);
  const [userPrompt, setUserPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [messages, setMessages] = useState<StellaChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMind: StellaMind = STELLA_CORES[selectedStellaId] || STELLA_CORES.STELLA_01;

  // Listen to Auth state
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Initialize initial greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = generateStellaChatResponse(
        selectedStellaId,
        'Welcome to the observatory. State your initial theoretical hypothesis.',
        { name: targetName, anomalyTitle, spectralType }
      );
      setMessages([
        {
          id: `greet-${Date.now()}`,
          stellaId: selectedStellaId,
          role: 'assistant',
          content: greeting.response,
          eli10Summary: greeting.eli10,
          targetId: targetName,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [selectedStellaId, targetName, anomalyTitle, spectralType]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : userPrompt).trim();
    if (!content) return;

    soundFX.triggerTick();
    const userMsg: StellaChatMessage = {
      id: `usr-${Date.now()}`,
      stellaId: selectedStellaId,
      role: 'user',
      content,
      targetId: targetName,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserPrompt('');
    setIsTyping(true);

    // If authenticated, also persist to Firestore in background
    if (currentUser) {
      try {
        await addDoc(collection(db, 'stella_chats'), {
          userId: currentUser.uid,
          stellaId: selectedStellaId,
          role: 'user',
          content,
          targetId: targetName,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firebase store sync note:', err);
      }
    }

    setTimeout(async () => {
      const generated = generateStellaChatResponse(selectedStellaId, content, {
        name: targetName,
        anomalyTitle,
        spectralType,
      });

      const assistantMsg: StellaChatMessage = {
        id: `ast-${Date.now()}`,
        stellaId: selectedStellaId,
        role: 'assistant',
        content: generated.response,
        eli10Summary: generated.eli10,
        targetId: targetName,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      soundFX.triggerNeuralSync();

      // Persist assistant message to Firestore if authenticated
      if (currentUser) {
        try {
          await addDoc(collection(db, 'stella_chats'), {
            userId: currentUser.uid,
            stellaId: selectedStellaId,
            role: 'assistant',
            content: generated.response,
            eli10Summary: generated.eli10,
            targetId: targetName,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Firebase assistant sync note:', err);
        }
      }
    }, 700);
  };

  const handleGoogleAuth = async () => {
    soundFX.triggerTick();
    try {
      if (currentUser) {
        await logoutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const quickQuestions: Record<string, string[]> = {
    STELLA_01: [
      'What happens if I ride alongside a beam of light?',
      'Does the Alcubierre warp metric violate general relativity?',
      'How does spacetime curvature bend light around this star?',
    ],
    STELLA_02: [
      'How do Feynman path integrals explain this radio signal?',
      'Can quantum vacuum noise create false positive technosignatures?',
      'Why is the Doppler drift so regular?',
    ],
    STELLA_03: [
      'Is this Dyson swarm built by an alien civilization?',
      'What does the +3.42σ infrared excess tell us about their energy?',
      'Could there be a pale blue dot orbiting in this habitable zone?',
    ],
    STELLA_04: [
      'How does the exomoon perturb the planet orbit via TTV?',
      'Calculate the Hill sphere stability radius for this target.',
      'Are the orbital resonances secularly stable over billions of years?',
    ],
    STELLA_05: [
      'How does Poynting vector integration filter out galactic synchrotron noise?',
      'Is this 1420.45 MHz carrier a directed energy transmission?',
      'Explain how radiator panels dissipate thermal waste heat.',
    ],
    STELLA_06: [
      'Does simultaneous methane and ozone prove biological activity?',
      'What does atmospheric scale height H tell us about the planet air?',
      'Are these transmission absorption lines free from refractory haze?',
    ],
    STELLA_07: [
      'Explain how your 7.0-sigma threshold eliminates false positives.',
      'Show me the plain-English ELI10 translation of this discovery.',
      'How does the SHA-256 seal guarantee scientific provenance?',
    ],
  };

  const currentQuestions = quickQuestions[selectedStellaId] || quickQuestions.STELLA_01;

  return (
    <div className="flex h-full flex-col gap-2.5 rounded-xl border border-purple-950/60 bg-[#060312]/95 p-3.5 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.1)] font-mono text-xs">
      {/* Top Header: 7 Stella Selector & Firebase Auth */}
      <div className="flex flex-wrap items-center justify-between border-b border-purple-950/60 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 via-purple-900 to-cyan-900 border border-purple-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Atom size={15} className="animate-spin" style={{ animationDuration: '9s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 tracking-wider text-[11px]">
                7 STELLA-CORE CONVERSATIONAL ENGINE
              </span>
              <span className="rounded bg-amber-950/80 border border-amber-600/60 px-1.5 py-0.2 text-[8.5px] font-bold text-amber-300">
                PYTHAGORAS ELI10 FILTER
              </span>
            </div>
            <div className="text-[9px] text-slate-400">
              Interactive Dialogue &bull; Target: <strong className="text-cyan-300">{targetName}</strong>
            </div>
          </div>
        </div>

        {/* Right: Cloud Sync Auth Button */}
        <div className="flex items-center gap-2 text-[9.5px]">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all cursor-pointer ${
              currentUser
                ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-purple-800/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60'
            }`}
            title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in with Google to sync chats with Firestore'}
          >
            {currentUser ? (
              <>
                <UserIcon size={11} className="text-emerald-400" />
                <span className="truncate max-w-[90px]">{currentUser.displayName?.split(' ')[0] || 'SYNCED'}</span>
                <LogOut size={10} className="text-slate-400" />
              </>
            ) : (
              <>
                <LogIn size={11} className="text-amber-400" />
                <span>SIGN IN &bull; FIRESTORE CLOUD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7 Stella-Core Mind Selector Ribbon (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[9.5px]">
        {Object.values(STELLA_CORES).map((mind) => {
          const isSelected = selectedStellaId === mind.id;
          return (
            <button
              key={mind.id}
              type="button"
              onClick={() => {
                soundFX.triggerTick();
                setSelectedStellaId(mind.id);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/60 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-[1.02]'
                  : 'border-purple-950/60 bg-black/50 text-slate-400 hover:border-purple-800/80 hover:text-purple-200'
              }`}
            >
              <span className="text-sm">{mind.icon}</span>
              <div className="flex flex-col text-left">
                <span className="leading-tight text-slate-100">{mind.name.split(' ')[1]}</span>
                <span className="text-[7.5px] text-amber-300/80 leading-tight">{mind.id}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mind Banner */}
      <div className="rounded-lg bg-black/60 border border-purple-900/40 p-2 flex items-center justify-between text-[9.5px]">
        <div className="flex items-center gap-2">
          <span className="text-base">{activeMind.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100">{activeMind.name}</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-amber-300 font-semibold">{activeMind.avatarTitle}</span>
            </div>
            <div className="text-[8.5px] text-slate-400 font-sans">
              Domain: <strong className="text-purple-300 font-mono">{activeMind.coreDomain}</strong>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[8.5px] text-emerald-400 font-mono">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>NEURAL LOAD: {activeMind.neuralLoadPct}%</span>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 min-h-[220px] max-h-[380px] no-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const mind = STELLA_CORES[msg.stellaId] || activeMind;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 rounded-xl p-3 backdrop-blur-md transition-all ${
                isUser
                  ? 'border border-cyan-800/60 bg-[#031522]/90 ml-6 text-cyan-100'
                  : 'border border-purple-900/60 bg-[#0e0722]/90 mr-6 text-purple-100'
              }`}
            >
              {/* Speaker header */}
              <div className="flex items-center justify-between text-[9px] border-b border-purple-950/40 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{isUser ? '🧑‍🚀' : mind.icon}</span>
                  <span className="font-bold text-slate-200">
                    {isUser ? 'Commander (You)' : mind.name}
                  </span>
                </div>
                <span className="text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              {/* Message text */}
              <div className="text-xs leading-relaxed font-sans text-slate-200">
                {msg.content}
              </div>

              {/* Pythagoras ELI10 Noise Filter & Plain-English Translation */}
              {msg.eli10Summary && (
                <div className="rounded-lg bg-amber-950/30 border border-amber-600/40 p-2 text-[10px] text-amber-200 font-sans flex flex-col gap-0.5 mt-1">
                  <div className="flex items-center gap-1 font-bold text-amber-400 font-mono text-[8.5px] uppercase tracking-wider">
                    <Scale size={10} className="text-amber-400" />
                    <span>PYTHAGORAS NOISE FILTER &bull; PLAIN-ENGLISH ELI10</span>
                  </div>
                  <div className="italic text-amber-100/90 leading-snug">
                    {msg.eli10Summary}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 rounded-xl border border-purple-900/50 bg-[#0e0722]/80 p-2.5 text-xs text-purple-300 animate-pulse">
            <span className="text-sm">{activeMind.icon}</span>
            <span>{activeMind.name} is formulating theoretical physics response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[8.5px] text-slate-500">
          <span className="flex items-center gap-1 text-purple-400 font-bold uppercase">
            <Lightbulb size={9} className="text-amber-400" />
            <span>Suggested Inquiries for {activeMind.name.split(' ')[1]}:</span>
          </span>
          <span>Click to ask</span>
        </div>
        <div className="flex flex-wrap gap-1 text-[9px]">
          {currentQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="px-2 py-0.5 rounded-lg bg-black/60 hover:bg-purple-950/70 border border-purple-900/40 text-slate-300 hover:text-amber-300 transition-colors text-left truncate max-w-full cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={`Ask ${activeMind.name.split(' ')[1]} about ${targetName}, Lorentz factors, or megastructures...`}
          className="flex-1 rounded-xl bg-black/80 border border-purple-900/60 px-3 py-2 text-xs text-purple-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!userPrompt.trim() || isTyping}
          className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 px-3.5 py-2 font-bold text-white shadow-[0_0_12px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send size={12} />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
}
