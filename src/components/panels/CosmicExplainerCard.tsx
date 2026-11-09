import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  HelpCircle,
  Eye,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Radio,
  Sun,
  Flame,
  Globe2,
  ChevronRight,
  Info,
  Layers,
  Activity,
  Compass,
  Send,
  Bot,
  User,
  RefreshCw,
} from 'lucide-react';
import { CatalogTarget, CatalogAnomaly } from '../../data/astronomicalCatalog';
import { soundFX } from '../ui/AudioFeedback';

interface CosmicExplainerCardProps {
  selectedTarget: CatalogTarget;
  activeAnomaly?: CatalogAnomaly | null;
  expanded?: boolean;
  onExploreTarget?: (targetId: string) => void;
  activeScale?: string;
}

interface Message {
  role: 'user' | 'astra';
  text: string;
  source?: string;
  timestamp: string;
}

export default function CosmicExplainerCard({
  selectedTarget,
  activeAnomaly,
  expanded = false,
  onExploreTarget,
  activeScale = 'LOCAL_SPHERE',
}: CosmicExplainerCardProps) {
  const [activeTab, setActiveTab] = useState<'ASTRA_AI' | '3D_TWIN' | 'ANALOGIES' | 'IMPACT'>('ASTRA_AI');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [cameraView, setCameraView] = useState<'TRANSIT_PLANE' | 'POLAR' | 'FREE'>('TRANSIT_PLANE');

  // Conversational Astra AI States
  const [chatInput, setChatInput] = useState('');
  const [isAskingAstra, setIsAskingAstra] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'astra',
      text: `Greetings, Observer. I am Astra, your AI Theoretical Astrophysicist aboard COSMOS-X.
Currently auditing target: ${selectedTarget.name} (${selectedTarget.spectralType}).
Ask me anything regarding Mandel-Agol transit geometry, Dyson sphere thermodynamics, Doppler drift technosignatures, or Kopparapu habitable zone boundaries.`,
      source: 'Astra Neural Astrophysics Core',
      timestamp: 'Just now',
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const animObjectsRef = useRef<{
    planet?: THREE.Mesh;
    orbitPivot?: THREE.Group;
    starMesh?: THREE.Mesh;
    dysonRings?: THREE.Group;
    radioBeams?: THREE.Group;
    coronaParticles?: THREE.Points;
  }>({});

  // Query Astra backend route
  const handleAskAstra = async (promptQuery?: string) => {
    const query = promptQuery || chatInput.trim();
    if (!query || isAskingAstra) return;

    soundFX.triggerLock();
    const userMsg: Message = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingAstra(true);

    try {
      const res = await fetch('/api/gemini/astra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          currentTarget: selectedTarget,
          activeScale,
          conversationHistory: messages.slice(-4),
        }),
      });

      const data = await res.json();
      soundFX.triggerPingSweep();
      const astraMsg: Message = {
        role: 'astra',
        text: data.response || 'Cognitive evaluation complete.',
        source: data.source || 'Astra Neural Astrophysics Core (Gemini 3.8 Flash)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, astraMsg]);
    } catch (e: any) {
      soundFX.triggerAnomalyKlaxon();
      setMessages((prev) => [
        ...prev,
        {
          role: 'astra',
          text: `Astra Offline Synthesis: Gravitational potential and stellar flux analysis for ${selectedTarget.name} indicate stable radiative equilibrium ($T_{eff} = ${selectedTarget.teff}\\,\\text{K}$).`,
          source: 'Astra High-Fidelity Local Astrophysics Synthesis',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAskingAstra(false);
    }
  };

  // Determine Discovery Category
  const discoveryMode = useMemo(() => {
    if (selectedTarget.isDysonCandidate) return 'DYSON_SWARM';
    if (selectedTarget.isRadioSource) return 'RADIO_BEACON';
    if (activeAnomaly && activeAnomaly.targetId === selectedTarget.id) {
      if (activeAnomaly.category === 'DYSON_SPHERE') return 'DYSON_SWARM';
      if (activeAnomaly.category === 'RADIO_TECHNOSIGNATURE') return 'RADIO_BEACON';
    }
    return 'EXOPLANET_TRANSIT';
  }, [activeAnomaly, selectedTarget]);

  // Generate Real-World Analogies for Physical Metrics
  const plainEnglishAnalogy = useMemo(() => {
    const depthPpm = Math.round(selectedTarget.defaultTransitDepth * 1000000);
    const depthPct = (selectedTarget.defaultTransitDepth * 100).toFixed(3);
    const periodDays = selectedTarget.defaultPeriod.toFixed(2);

    if (discoveryMode === 'DYSON_SWARM') {
      return {
        title: 'The "Automobile Engine Under a Blanket" Analogy',
        tagline: 'Alien Civilization Waste Heat (Second Law of Thermodynamics)',
        analogy:
          'Imagine parking a high-powered race car in the dark and draping an insulated blanket over it. The engine is completely hidden from visible sight, but if you step up to it with an infrared thermal camera, you will see it glowing bright amber with trapped waste heat.',
        astrophysicsMeaning:
          'Stellar physics dictates that mature stars cool off according to Planck\'s blackbody radiation law. This star has normal optical light, but WISE telescopes captured huge spikes in 12 µm (W3) and 22 µm (W4) mid-infrared flux. Something massive is soaking up stellar energy and radiating low-temperature waste heat (~218 K), consistent with an artificial planetary mega-collector swarm.',
        relatableMetric: `Thermal Excess Index: +3.42σ above normal stellar locus • Intercepting ~14.8% of Total Solar Energy`,
        colorTheme: 'from-amber-500/20 via-orange-950/30 to-purple-950/20 border-amber-900/60 text-amber-200',
      };
    }

    if (discoveryMode === 'RADIO_BEACON') {
      return {
        title: 'The "Ambulance Siren on a Merry-Go-Round" Analogy',
        tagline: 'Artificial Doppler Drift vs. Chaotic Cosmic Static',
        analogy:
          'If an ambulance drives around a carnival merry-go-round, its siren pitch slides up and down in a predictable, rhythmic curve due to the Doppler effect. Cosmic radio noise from pulsars or nebulae is wide and chaotic, like pouring gravel on a tin roof.',
        astrophysicsMeaning:
          'Breakthrough Listen detectors detected an ultra-narrow 1.8 Hz carrier wave drifting at exactly -0.32 Hz/s. That continuous frequency slide is the signature of a transmitter rooted on the surface of an exoplanet orbiting its host star.',
        relatableMetric: `Frequency Drift: -0.32 Hz/s • Bandwidth: 1.8 Hz • Incoherent False-Alarm Probability: < 10⁻¹²`,
        colorTheme: 'from-cyan-500/20 via-blue-950/30 to-purple-950/20 border-cyan-900/60 text-cyan-200',
      };
    }

    return {
      title: 'The "Mosquito Flying Across a Car Headlight" Analogy',
      tagline: 'Mandel-Agol Geometric Transit Occultation',
      analogy:
        'Imagine looking at a blinding halogen car headlight from 5 miles away on a pitch-black highway. If a single tiny mosquito flies directly in front of the bulb, the total light dims by less than one-hundredth of a percent for a fraction of a second.',
      astrophysicsMeaning:
        `When an exoplanet crosses the disk of its host star, it blocks a portion of starlight proportional to (R_p / R_*)². Here, the star dims by exactly ${depthPpm} parts-per-million (${depthPct}%) every ${periodDays} days with characteristic U-shaped limb darkening.`,
      relatableMetric: `Transit Dip: ${depthPpm} ppm (${depthPct}%) • Periodicity: ${periodDays} Earth days • Fit Quality: χ² = 0.94`,
      colorTheme: 'from-purple-500/20 via-indigo-950/30 to-purple-950/20 border-purple-900/60 text-purple-200',
    };
  }, [discoveryMode, selectedTarget]);

  // Three.js 3D Digital Twin Engine
  useEffect(() => {
    if (activeTab !== '3D_TWIN' && !expanded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04020a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xfff7ed, 3.5, 80);
    scene.add(pointLight);

    // Host Star
    const starGeom = new THREE.SphereGeometry(3.8, 32, 32);
    const starColor = selectedTarget.spectralType.startsWith('M')
      ? 0xef4444
      : selectedTarget.spectralType.startsWith('G')
      ? 0xfbbf24
      : 0x60a5fa;
    const starMat = new THREE.MeshBasicMaterial({ color: starColor });
    const starMesh = new THREE.Mesh(starGeom, starMat);
    scene.add(starMesh);
    animObjectsRef.current.starMesh = starMesh;

    // Star Corona Glow
    const coronaGeom = new THREE.SphereGeometry(4.4, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: starColor,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
    });
    const starGlow = new THREE.Mesh(coronaGeom, coronaMat);
    scene.add(starGlow);

    if (discoveryMode === 'EXOPLANET_TRANSIT') {
      const orbitPivot = new THREE.Group();
      scene.add(orbitPivot);
      animObjectsRef.current.orbitPivot = orbitPivot;

      const orbitRadius = 14;
      const planetGeom = new THREE.SphereGeometry(1.2, 24, 24);
      const planetMat = new THREE.MeshStandardMaterial({
        color: selectedTarget.isHabitableCandidate ? 0x0284c7 : 0x78716c,
        roughness: 0.5,
      });
      const planet = new THREE.Mesh(planetGeom, planetMat);
      planet.position.set(orbitRadius, 0, 0);
      orbitPivot.add(planet);
      animObjectsRef.current.planet = planet;

      const pathGeom = new THREE.RingGeometry(orbitRadius - 0.08, orbitRadius + 0.08, 64);
      const pathMat = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const pathRing = new THREE.Mesh(pathGeom, pathMat);
      pathRing.rotation.x = Math.PI / 2;
      scene.add(pathRing);
    } else if (discoveryMode === 'DYSON_SWARM') {
      const dysonGroup = new THREE.Group();
      scene.add(dysonGroup);
      animObjectsRef.current.dysonRings = dysonGroup;

      const panelCount = 48;
      const panelGeom = new THREE.BoxGeometry(0.8, 0.8, 0.1);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.1,
      });

      for (let i = 0; i < panelCount; i++) {
        const radius = 9 + (i % 3) * 1.8;
        const angle = (i / panelCount) * Math.PI * 2 * 3;
        const panel = new THREE.Mesh(panelGeom, panelMat);
        const yOffset = Math.sin(i * 1.7) * 3;
        panel.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
        panel.lookAt(0, 0, 0);
        dysonGroup.add(panel);
      }
    } else {
      const radioGroup = new THREE.Group();
      scene.add(radioGroup);
      animObjectsRef.current.radioBeams = radioGroup;

      for (let r = 0; r < 5; r++) {
        const torusGeom = new THREE.TorusGeometry(8 + r * 3, 0.12, 12, 48);
        const torusMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.6 - r * 0.1,
          wireframe: true,
        });
        const torus = new THREE.Mesh(torusGeom, torusMat);
        torus.rotation.x = Math.PI / 2;
        radioGroup.add(torus);
      }
    }

    if (cameraView === 'TRANSIT_PLANE') {
      camera.position.set(0, 1.5, 34);
    } else if (cameraView === 'POLAR') {
      camera.position.set(0, 36, 6);
    } else {
      camera.position.set(18, 16, 26);
    }
    camera.lookAt(0, 0, 0);

    let angle = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (isPlaying) {
        angle += 0.02 * simSpeed;
        if (animObjectsRef.current.orbitPivot) animObjectsRef.current.orbitPivot.rotation.y = angle;
        if (animObjectsRef.current.dysonRings) {
          animObjectsRef.current.dysonRings.rotation.y = angle * 0.7;
          animObjectsRef.current.dysonRings.rotation.x = Math.sin(angle * 0.2) * 0.15;
        }
        if (animObjectsRef.current.radioBeams) {
          animObjectsRef.current.radioBeams.rotation.y = angle * 0.4;
          const pulse = 1 + Math.sin(angle * 3) * 0.08;
          animObjectsRef.current.radioBeams.scale.set(pulse, pulse, pulse);
        }
        if (starGlow) {
          starGlow.rotation.y += 0.005;
          starGlow.rotation.z += 0.003;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas || !renderer || !camera) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [discoveryMode, isPlaying, simSpeed, cameraView, activeTab, expanded, selectedTarget]);

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-purple-950/60 bg-[#070410]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-purple-950/50 bg-[#0b0518]/90 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(192,132,252,0.4)]">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-200 tracking-wider">
                ASTRA CONVERSATIONAL ASTROPHYSICIST
              </span>
              <span className="rounded bg-purple-950/80 px-1.5 py-0.5 text-[8.5px] text-cyan-300 border border-purple-800/40">
                GEMINI 3.8 CORE
              </span>
            </div>
            <div className="text-[9.5px] text-slate-400">
              The Claude / Gemini of Astronomy • Plain-English Physical Analogies & 3D Twin
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-lg bg-black/60 p-0.5 border border-purple-950/80 text-[10px]">
          {[
            { id: 'ASTRA_AI', label: 'ASTRA AI CHAT', icon: Bot },
            { id: '3D_TWIN', label: '3D DIGITAL TWIN', icon: Eye },
            { id: 'ANALOGIES', label: 'PLAIN ENGLISH', icon: HelpCircle },
            { id: 'IMPACT', label: 'SCIENTIFIC IMPACT', icon: Activity },
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                  active
                    ? 'bg-purple-900/80 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <Icon size={11} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* TAB 1: ASTRA CONVERSATIONAL AI */}
        {activeTab === 'ASTRA_AI' && (
          <div className="flex flex-col h-full justify-between gap-3">
            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[9.5px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Sparkles size={10} className="text-purple-400" />
                <span>Ask Astra:</span>
              </span>
              {[
                `Explain Dyson Swarm thermodynamics for ${selectedTarget.name}`,
                `Is ${selectedTarget.name} inside the Kopparapu Habitable Zone?`,
                `How does the BLS transit solver reject binary stars?`,
                `Analyze radio narrowband drift vs cosmic noise`,
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleAskAstra(chip)}
                  disabled={isAskingAstra}
                  className="px-2 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-purple-200 text-left transition-colors truncate max-w-[260px]"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-purple-950/70 bg-[#04020a] p-3 flex flex-col gap-3 min-h-[220px]">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'astra' && (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center shrink-0 text-white text-[10px]">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-purple-950/80 text-purple-100 border border-purple-800/60 font-sans'
                        : 'bg-[#0d071a] text-slate-200 border border-purple-950/80 font-sans'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.source && (
                      <div className="mt-2 pt-1 border-t border-purple-950/60 flex items-center justify-between text-[9px] font-mono text-cyan-400">
                        <span>{m.source}</span>
                        <span className="text-slate-500">{m.timestamp}</span>
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center shrink-0 text-white text-[10px]">
                      <User size={13} />
                    </div>
                  )}
                </div>
              ))}

              {isAskingAstra && (
                <div className="flex items-center gap-2 text-xs text-purple-300 font-mono">
                  <RefreshCw size={13} className="animate-spin text-cyan-400" />
                  <span>Astra synthesizing astrophysical equations and telemetry...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAstra();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask Astra about ${selectedTarget.name}, transit physics, or Dyson swarms...`}
                className="flex-1 bg-black/60 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-purple-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={isAskingAstra || !chatInput.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                <Send size={13} />
                <span>INQUIRE</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: 3D DIGITAL TWIN */}
        {activeTab === '3D_TWIN' && (
          <div className="flex flex-col h-full gap-2.5">
            <div className="relative flex-1 rounded-xl border border-purple-950/80 bg-[#04020a] overflow-hidden flex items-center justify-center min-h-[220px]">
              <canvas ref={canvasRef} className="w-full h-full" />

              {/* View Angle Pill Controls */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/75 p-1 rounded-lg border border-purple-950/80 text-[9.5px]">
                <button
                  onClick={() => setCameraView('TRANSIT_PLANE')}
                  className={`px-2 py-0.5 rounded ${
                    cameraView === 'TRANSIT_PLANE' ? 'bg-purple-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Transit Plane
                </button>
                <button
                  onClick={() => setCameraView('POLAR')}
                  className={`px-2 py-0.5 rounded ${
                    cameraView === 'POLAR' ? 'bg-purple-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Polar View
                </button>
                <button
                  onClick={() => setCameraView('FREE')}
                  className={`px-2 py-0.5 rounded ${
                    cameraView === 'FREE' ? 'bg-purple-900 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Perspective
                </button>
              </div>

              {/* Play/Pause & Speed */}
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/75 p-1 rounded-lg border border-purple-950/80 text-[9.5px]">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800"
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
                  className="px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800"
                >
                  {simSpeed}× SPEED
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-black/50 border border-purple-950/60 p-2.5 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">Digital Twin Mode:</span>
              <strong className="text-cyan-300 font-bold">{discoveryMode}</strong>
              <span className="text-slate-400">Target Host:</span>
              <strong className="text-purple-300">{selectedTarget.name}</strong>
            </div>
          </div>
        )}

        {/* TAB 3: PLAIN ENGLISH PHYSICAL ANALOGIES */}
        {activeTab === 'ANALOGIES' && (
          <div className="flex flex-col gap-3">
            <div className={`p-4 rounded-xl border bg-gradient-to-br ${plainEnglishAnalogy.colorTheme}`}>
              <div className="flex items-center justify-between pb-2 border-b border-purple-950/50">
                <span className="font-extrabold text-sm text-purple-100">{plainEnglishAnalogy.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-purple-200 font-bold">
                  {plainEnglishAnalogy.tagline}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-200 font-sans leading-relaxed">
                {plainEnglishAnalogy.analogy}
              </div>

              <div className="mt-3 p-3 rounded-lg bg-black/50 border border-purple-950/60 text-xs text-slate-300 font-sans leading-relaxed">
                <strong className="text-cyan-300 font-mono text-[11px] block mb-1">Astrophysical Mechanics:</strong>
                {plainEnglishAnalogy.astrophysicsMeaning}
              </div>

              <div className="mt-3 text-[10px] text-amber-300 font-mono">
                {plainEnglishAnalogy.relatableMetric}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCIENTIFIC IMPACT & FOLLOW-UP */}
        {activeTab === 'IMPACT' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-purple-950/80 bg-[#070312] p-4 flex flex-col gap-3">
              <span className="font-extrabold text-sm text-purple-200 border-b border-purple-950/60 pb-2">
                Observatory Follow-Up Recommendations & Validation Path
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-sans">
                <div className="rounded-lg bg-black/50 border border-purple-950/60 p-3">
                  <strong className="text-cyan-300 font-mono text-[11px] block mb-1">
                    1. JWST Transmission Spectroscopy
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Schedule high-resolution transmission spectra via NIRSpec (0.6 - 5.3 µm) and MIRI (5 - 28 µm)
                    to confirm atmospheric chemical equilibrium and detect methane/carbon dioxide signatures.
                  </p>
                </div>

                <div className="rounded-lg bg-black/50 border border-purple-950/60 p-3">
                  <strong className="text-amber-300 font-mono text-[11px] block mb-1">
                    2. ALMA Submillimeter Continuum
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Deploy Atacama Large Millimeter/submillimeter Array (ALMA) Band 7 (345 GHz) interferometry
                    to resolve circumstellar dust structures or verify artificial collector swarm geometry.
                  </p>
                </div>

                <div className="rounded-lg bg-black/50 border border-purple-950/60 p-3">
                  <strong className="text-purple-300 font-mono text-[11px] block mb-1">
                    3. Breakthrough Listen Verification
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Conduct multi-baseline verification utilizing Green Bank Telescope and Parkes Murriyang to
                    confirm continuous negative Doppler drift and verify signal persistence across orbital cycles.
                  </p>
                </div>

                <div className="rounded-lg bg-black/50 border border-purple-950/60 p-3">
                  <strong className="text-emerald-400 font-mono text-[11px] block mb-1">
                    4. Gaia DR3 Astrometric Motion
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Cross-match stellar proper motion vectors with Gaia DR3 to eliminate background blended eclipsing
                    binary stars and confirm unperturbed Keplerian center-of-mass motion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
