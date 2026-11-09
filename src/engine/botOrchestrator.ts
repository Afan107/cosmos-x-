/**
 * Cosmos 10-Bot Autonomous Space Agency Orchestrator
 * Manages 10 synchronized autonomous AI discovery agents:
 * 1. KEPLER_BOT: Exoplanet Transit Sentinel
 * 2. VOID_WATCHER: Mid-IR Dyson Swarm Scout
 * 3. SETI_SENTINEL: Radio Technosignature Analyst
 * 4. JWST_SPECTRA: Atmospheric Chemist & Biosignature Auditor
 * 5. OUMUAMUA_TRACKER: Interstellar Astrometry Bot (e > 1.0)
 * 6. LIGO_RIPPLE: Spacetime Gravitational Wave & Black Hole Auditor
 * 7. VASCO_ARCHIVIST: Vanishing Star Hunter (VASCO Century Survey)
 * 8. CNEOS_SENTINEL: Planetary Defense & Asteroid Impact Risk Monitor
 * 9. ASTRO_BOT: Dr. Vesta (Lead Astrophysicist & Theorist)
 * 10. DIRECTOR_BOT: The Director Bot (Chief Arbiter & Master Archivist)
 */

export interface BotState {
  id: string;
  name: string;
  role: string;
  status: string;
  targetScans: number;
  discoveries: number;
  lastActive: string;
  currentSector: string;
  efficiencyScore: number;
  recentFinding?: string;
  icon?: string;
}

export type BotId =
  | 'KEPLER_BOT'
  | 'VOID_WATCHER'
  | 'SETI_SENTINEL'
  | 'JWST_SPECTRA'
  | 'OUMUAMUA_TRACKER'
  | 'LIGO_RIPPLE'
  | 'VASCO_ARCHIVIST'
  | 'CNEOS_SENTINEL'
  | 'ASTRO_BOT'
  | 'DIRECTOR_BOT';

export interface BotDiscoveryEvent {
  id: string;
  botId: BotId;
  botName: string;
  timestamp: string;
  title: string;
  description: string;
  significance: 'CRITICAL' | 'ELEVATED' | 'ROUTINE';
  coordinates: string;
  targetId?: string;
}

type EventListener = (event: BotDiscoveryEvent) => void;
type StateListener = (bots: Record<string, BotState>) => void;

class CosmosBotOrchestrator {
  private bots: Record<string, BotState> = {
    KEPLER_BOT: {
      id: 'KEPLER_BOT',
      name: 'Kepler-Bot',
      role: 'Exoplanet Transit Sentinel',
      status: 'MONITORING TESS SEC-64 / 65',
      targetScans: 142,
      discoveries: 4,
      lastActive: 'Just now',
      currentSector: 'SECTOR-65 (NORTH ECLIPTIC)',
      efficiencyScore: 98.4,
      recentFinding: 'Transit dip flagged: 1420 ppm @ 4.23d (Habitable Zone)',
      icon: '🪐',
    },
    VOID_WATCHER: {
      id: 'VOID_WATCHER',
      name: 'Void-Watcher',
      role: 'Dark Anomaly & Dyson Swarm Scout',
      status: 'CROSS-MATCHING WISE W3/W4 & GAIA DR3',
      targetScans: 89,
      discoveries: 2,
      lastActive: 'Just now',
      currentSector: 'LMC CORE / 800 PC BUBBLE',
      efficiencyScore: 96.1,
      recentFinding: 'IR excess flagged: +3.42σ at 12 µm (Dyson candidate)',
      icon: '✨',
    },
    SETI_SENTINEL: {
      id: 'SETI_SENTINEL',
      name: 'SETI-Sentinel',
      role: 'Radio Technosignature Analyst',
      status: 'SCANNING NARROW-BAND 1420.4 MHZ',
      targetScans: 310,
      discoveries: 1,
      lastActive: 'Just now',
      currentSector: 'ALPHA CENTAURI / PARKES BEAM',
      efficiencyScore: 99.2,
      recentFinding: 'Drifting narrowband carrier: 1.8 Hz BW with -0.32 Hz/s shift',
      icon: '📡',
    },
    JWST_SPECTRA: {
      id: 'JWST_SPECTRA',
      name: 'JWST-Spectra-Bot',
      role: 'Atmospheric Transmission Chemist',
      status: 'CORRELATING NIRSPEC & MIRI INTEGRAL FIELD',
      targetScans: 74,
      discoveries: 3,
      lastActive: 'Just now',
      currentSector: 'K2-18 / TRAPPIST-1 CORRIDOR',
      efficiencyScore: 97.8,
      recentFinding: 'CH4 + O3 + CO2 photochemical disequilibrium detected',
      icon: '🔬',
    },
    OUMUAMUA_TRACKER: {
      id: 'OUMUAMUA_TRACKER',
      name: 'Oumuamua-Tracker',
      role: 'Interstellar Astrometry Bot',
      status: 'SEARCHING HYPERBOLIC ORBITS (e > 1.0)',
      targetScans: 520,
      discoveries: 2,
      lastActive: 'Just now',
      currentSector: 'SOLAR APEX / HELIOPAUSE VECTOR',
      efficiencyScore: 99.5,
      recentFinding: 'Confirmed e = 1.1995 hyperbolic excess from Vega apex',
      icon: '☄️',
    },
    LIGO_RIPPLE: {
      id: 'LIGO_RIPPLE',
      name: 'LIGO-Ripple-Bot',
      role: 'Gravitational Wave & Spacetime Auditor',
      status: 'LIGO-VIRGO-KAGRA COINCIDENCE FILTER',
      targetScans: 198,
      discoveries: 5,
      lastActive: 'Just now',
      currentSector: 'ALL-SKY 4π STERADIAN MONITOR',
      efficiencyScore: 98.9,
      recentFinding: 'Binary Black Hole inspiral locked: 36 M_Sun + 29 M_Sun',
      icon: '🌀',
    },
    VASCO_ARCHIVIST: {
      id: 'VASCO_ARCHIVIST',
      name: 'Time-Domain-Archivist',
      role: 'Vanishing Star & Century Baseline Hunter',
      status: 'PALOMAR 1950 vs GAIA DR3 DIFFERENTIAL',
      targetScans: 412,
      discoveries: 1,
      lastActive: 'Just now',
      currentSector: 'CYGNUS ARM DEEP DISK',
      efficiencyScore: 95.3,
      recentFinding: 'Zero-supernova stellar vanishing candidate logged',
      icon: '🕰️',
    },
    CNEOS_SENTINEL: {
      id: 'CNEOS_SENTINEL',
      name: 'CNEOS-Doomsday-Sentinel',
      role: 'Planetary Defense & Impact Risk Monitor',
      status: 'RADAR ORBIT PERTURBATION RUNNER',
      targetScans: 680,
      discoveries: 6,
      lastActive: 'Just now',
      currentSector: 'INNER SOLAR SYSTEM RESONANCE',
      efficiencyScore: 99.8,
      recentFinding: 'Apophis 2029-04-13 geocentric miss distance = 0.00025 AU',
      icon: '🛡️',
    },
    ASTRO_BOT: {
      id: 'ASTRO_BOT',
      name: 'Dr. Vesta (Lead Astrophysicist)',
      role: 'Chief Theoretical Arbiter',
      status: 'EVALUATING SYNTHETIC PLANETARY MODELS',
      targetScans: 890,
      discoveries: 12,
      lastActive: 'Just now',
      currentSector: 'THEORETICAL ARBITRATION BUS',
      efficiencyScore: 99.9,
      recentFinding: 'Kopparapu habitability models verified across 8 systems',
      icon: '👩‍🔬',
    },
    DIRECTOR_BOT: {
      id: 'DIRECTOR_BOT',
      name: 'The Director Bot',
      role: 'Supreme Validation & Archive Authority',
      status: 'ISSUING VERIFIED CREDENTIALS (NOISE-FREE 85%+)',
      targetScans: 1040,
      discoveries: 3,
      lastActive: 'Just now',
      currentSector: 'CRYPTO-VERIFIED ARCHIVE REGISTRY',
      efficiencyScore: 100.0,
      recentFinding: 'TIC-25155310 Certified as Novel Dyson Candidate (96.4%)',
      icon: '⚖️',
    },
  };

  private isRunning = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private sweepIntervalMs = 6000;
  private eventListeners: EventListener[] = [];
  private stateListeners: StateListener[] = [];
  private eventCounter = 0;

  private createEventId(): string {
    this.eventCounter += 1;
    return `EVT-${Date.now()}-${this.eventCounter}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private recentEvents: BotDiscoveryEvent[] = [
    {
      id: 'EVT-01',
      botId: 'KEPLER_BOT',
      botName: 'Kepler-Bot',
      timestamp: '09:42:15 UTC',
      title: 'Periodic Occultation Confirmed in TESS Sector 65',
      description: 'BLS engine converged on 4.2301 day period with 1420 ppm depth (Rp = 1.84 R_Earth).',
      significance: 'ELEVATED',
      coordinates: 'RA 05h 36m / Dec -69° 12\'',
      targetId: 'TIC-25155310',
    },
    {
      id: 'EVT-02',
      botId: 'VOID_WATCHER',
      botName: 'Void-Watcher',
      timestamp: '09:38:40 UTC',
      title: 'Non-Thermal Infrared Excess Flagged',
      description: 'WISE W3/W4 photometry exceeds stellar blackbody curve by +3.42σ. Dyson Swarm candidate verified.',
      significance: 'CRITICAL',
      coordinates: 'RA 05h 36m / Dec -69° 12\'',
      targetId: 'TIC-25155310',
    },
    {
      id: 'EVT-03',
      botId: 'SETI_SENTINEL',
      botName: 'SETI-Sentinel',
      timestamp: '09:30:10 UTC',
      title: 'Doppler Narrowband Carrier Locked',
      description: 'Breakthrough Listen detected 1.8 Hz carrier with linear drift -0.32 Hz/s at 1420.450 MHz.',
      significance: 'CRITICAL',
      coordinates: 'RA 14h 29m / Dec -62° 40\'',
      targetId: 'Proxima-Centauri-b',
    },
    {
      id: 'EVT-04',
      botId: 'JWST_SPECTRA',
      botName: 'JWST-Spectra-Bot',
      timestamp: '09:22:04 UTC',
      title: 'Photochemical Disequilibrium Ingested',
      description: 'Atmospheric transmission spectroscopy reveals simultaneous CH4 and O3 absorption bands.',
      significance: 'CRITICAL',
      coordinates: 'RA 23h 06m / Dec -05° 02\'',
      targetId: 'TRAPPIST-1e',
    },
    {
      id: 'EVT-05',
      botId: 'OUMUAMUA_TRACKER',
      botName: 'Oumuamua-Tracker',
      timestamp: '09:15:30 UTC',
      title: 'Hyperbolic Trajectory Verified (e = 1.1995)',
      description: 'Inbound velocity 87.7 km/s exceeds solar escape velocity. Origin traced to Solar Apex.',
      significance: 'ELEVATED',
      coordinates: 'RA 18h 36m / Dec +38° 47\'',
      targetId: '1I-2017-U1',
    },
  ];

  public getBots(): Record<string, BotState> {
    return { ...this.bots };
  }

  public getRecentEvents(): BotDiscoveryEvent[] {
    const seen = new Set<string>();
    return this.recentEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.push(listener);
    listener(this.getBots());
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  public startAutonomousSweep(intervalMs = 6000) {
    this.isRunning = true;
    this.sweepIntervalMs = intervalMs;
    if (this.timer) {
      clearInterval(this.timer);
    }
    const defaultScanningStatuses: Record<BotId, string> = {
      KEPLER_BOT: 'SCANNING TESS SECTOR 68 / 69 (BLS ACTIVE)',
      VOID_WATCHER: 'SCANNING WISE / GAIA DR3 (MID-IR PHOTOMETRY)',
      SETI_SENTINEL: 'SCANNING NARROW-BAND 1420.4 MHZ (CARRIER LOCK)',
      JWST_SPECTRA: 'SCANNING NIRSPEC TRANSMISSION SPECTRA',
      OUMUAMUA_TRACKER: 'SCANNING HYPERBOLIC ORBITS (e > 1.0)',
      LIGO_RIPPLE: 'SCANNING LIGO-VIRGO-KAGRA STRAIN CHIRPS',
      VASCO_ARCHIVIST: 'SCANNING PALOMAR 1950 vs GAIA DR3 PLATES',
      CNEOS_SENTINEL: 'SCANNING NEAR-EARTH ASTEROID DEFENSE RADAR',
      ASTRO_BOT: 'SYNTHESIZING KOPPARAPU HABITABILITY MODELS',
      DIRECTOR_BOT: 'CERTIFYING NOVEL DISCOVERIES (85%+)',
    };
    (Object.keys(this.bots) as BotId[]).forEach((key) => {
      if (defaultScanningStatuses[key]) {
        this.bots[key].status = defaultScanningStatuses[key];
      }
    });
    this.notifyState();
    this.timer = setInterval(() => {
      this.executeSweepCycle();
    }, this.sweepIntervalMs);
  }

  public stopAutonomousSweep() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    Object.keys(this.bots).forEach((key) => {
      this.bots[key].status = 'STANDBY / SWEEP PAUSED';
    });
    this.notifyState();
  }

  public isSweepRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a single sweep cycle across all 10 autonomous discovery bots
   */
  public executeSweepCycle(): BotDiscoveryEvent | null {
    const timestamp = new Date().toISOString().substring(11, 19) + ' UTC';
    let newEvent: BotDiscoveryEvent | null = null;
    const botKeys = Object.keys(this.bots) as BotId[];
    const chosenBotKey = botKeys[Math.floor(Math.random() * botKeys.length)];

    // Increment scans on all bots
    botKeys.forEach((key) => {
      this.bots[key].targetScans += Math.floor(Math.random() * 2 + 1);
    });

    const activeBot = this.bots[chosenBotKey];
    activeBot.lastActive = 'Active now';

    if (chosenBotKey === 'KEPLER_BOT') {
      activeBot.discoveries += 1;
      const period = (Math.random() * 25 + 0.8).toFixed(3);
      const depth = Math.floor(Math.random() * 2000 + 350);
      activeBot.recentFinding = `New transit dip: ${depth} ppm @ P=${period}d`;
      newEvent = {
        id: this.createEventId(),
        botId: 'KEPLER_BOT',
        botName: 'Kepler-Bot',
        timestamp,
        title: `Exoplanet Candidate Dip (${depth} ppm)`,
        description: `Autonomous BLS scan detected periodic occultation with P = ${period} days in Sector 68.`,
        significance: depth > 1200 ? 'ELEVATED' : 'ROUTINE',
        coordinates: `RA 05h 36m / Dec -69° 12'`,
        targetId: 'TIC-25155310',
      };
    } else if (chosenBotKey === 'VOID_WATCHER') {
      activeBot.discoveries += 1;
      const sigma = (Math.random() * 2.5 + 2.0).toFixed(2);
      activeBot.recentFinding = `Mid-IR excess +${sigma}σ detected`;
      newEvent = {
        id: this.createEventId(),
        botId: 'VOID_WATCHER',
        botName: 'Void-Watcher',
        timestamp,
        title: `Thermal Anomaly Flagged (+${sigma}σ Excess)`,
        description: `Cross-matched Gaia stellar temperature with WISE W3/W4 photometry. Non-standard blackbody curve detected.`,
        significance: 'CRITICAL',
        coordinates: `RA 20h 06m / Dec +44° 27'`,
        targetId: 'KIC-8462852',
      };
    } else if (chosenBotKey === 'SETI_SENTINEL') {
      activeBot.discoveries += 1;
      const drift = (Math.random() * 0.8 - 0.4).toFixed(3);
      activeBot.recentFinding = `Narrowband carrier locked: ${drift} Hz/s drift`;
      newEvent = {
        id: this.createEventId(),
        botId: 'SETI_SENTINEL',
        botName: 'SETI-Sentinel',
        timestamp,
        title: `Narrowband Signal Locked (${drift} Hz/s Drift)`,
        description: `Sub-5Hz bandwidth carrier detected with linear Doppler shift consistent with exoplanet orbital acceleration.`,
        significance: 'CRITICAL',
        coordinates: `RA 14h 29m / Dec -62° 40'`,
        targetId: 'Proxima-Centauri-b',
      };
    } else if (chosenBotKey === 'JWST_SPECTRA') {
      activeBot.discoveries += 1;
      activeBot.recentFinding = 'Methane + Ozone signature verified at 3.3 µm';
      newEvent = {
        id: this.createEventId(),
        botId: 'JWST_SPECTRA',
        botName: 'JWST-Spectra-Bot',
        timestamp,
        title: 'Biosignature Candidate Detected in Transmission Spectra',
        description: 'NIRSpec 0.6–5.3 µm transmission spectrum confirms CH4 and CO2 balance indicative of oceanic atmosphere.',
        significance: 'CRITICAL',
        coordinates: 'RA 23h 06m / Dec -05° 02\'',
        targetId: 'TRAPPIST-1e',
      };
    } else if (chosenBotKey === 'OUMUAMUA_TRACKER') {
      activeBot.discoveries += 1;
      activeBot.recentFinding = 'Hyperbolic orbital vector locked (e = 1.1995)';
      newEvent = {
        id: this.createEventId(),
        botId: 'OUMUAMUA_TRACKER',
        botName: 'Oumuamua-Tracker',
        timestamp,
        title: 'Hyperbolic Interstellar Visitor Flagged',
        description: 'High-eccentricity body detected entering solar system with non-gravitational acceleration component.',
        significance: 'ELEVATED',
        coordinates: 'RA 18h 36m / Dec +38° 47\'',
        targetId: '1I-2017-U1',
      };
    } else if (chosenBotKey === 'LIGO_RIPPLE') {
      activeBot.discoveries += 1;
      activeBot.recentFinding = 'Spacetime strain detected: SNR 28.4';
      newEvent = {
        id: this.createEventId(),
        botId: 'LIGO_RIPPLE',
        botName: 'LIGO-Ripple-Bot',
        timestamp,
        title: 'Gravitational Wave Merger Alert (LIGO-Virgo Coincidence)',
        description: 'Chirp signal detected from 36 M_Sun + 29 M_Sun binary black hole inspiral at 1.2 Gpc.',
        significance: 'ELEVATED',
        coordinates: 'RA 13h 14m / Dec -18° 14\'',
      };
    } else if (chosenBotKey === 'VASCO_ARCHIVIST') {
      activeBot.discoveries += 1;
      activeBot.recentFinding = 'Centennial stellar disappearance candidate logged';
      newEvent = {
        id: this.createEventId(),
        botId: 'VASCO_ARCHIVIST',
        botName: 'Time-Domain-Archivist',
        timestamp,
        title: 'Vanishing Star Candidate Flagged (VASCO Survey)',
        description: 'Optical point source on 1950 Palomar photographic plate missing from Gaia DR3 down to G = 21.0 mag.',
        significance: 'CRITICAL',
        coordinates: 'RA 21h 12m / Dec +38° 11\'',
        targetId: 'KIC-8462852',
      };
    } else if (chosenBotKey === 'CNEOS_SENTINEL') {
      activeBot.discoveries += 1;
      activeBot.recentFinding = 'Orbital collision probability calculated < 10^-6';
      newEvent = {
        id: this.createEventId(),
        botId: 'CNEOS_SENTINEL',
        botName: 'CNEOS-Doomsday-Sentinel',
        timestamp,
        title: 'Near-Earth Asteroid Flyby Trajectory Updated',
        description: 'Radar orbit determination confirms safe close-approach clearance inside geostationary ring.',
        significance: 'ROUTINE',
        coordinates: 'RA 08h 12m / Dec -03° 22\'',
      };
    } else {
      activeBot.recentFinding = 'Autonomous theoretical arbitration cycle completed';
    }

    if (newEvent) {
      this.recentEvents = [newEvent, ...this.recentEvents.filter((e) => e.id !== newEvent!.id)].slice(0, 25);
      this.notifyEvents(newEvent);
    }

    this.notifyState();
    return newEvent;
  }

  private notifyState() {
    const botsCopy = this.getBots();
    this.stateListeners.forEach((listener) => {
      try {
        listener(botsCopy);
      } catch (e) {
        console.error('Error in bot state listener', e);
      }
    });
  }

  private notifyEvents(event: BotDiscoveryEvent) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in bot event listener', e);
      }
    });
  }
}

export const botOrchestrator = new CosmosBotOrchestrator();
