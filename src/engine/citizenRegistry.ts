/**
 * Citizen Science Registry & Relativistic Probe Telemetry Engine
 * Powers the end-to-end publishing pipeline:
 * - Commander Callsign management
 * - Real-time insertion at #1 on the Global Citizen Leaderboard
 * - Auto-population of the Astrophysical Journal (ApJ) LaTeX Preprint Dossier
 * - Relativistic Breakthrough Starshot probe flight calculations (γ = 1 / √(1 - v²/c²))
 */

export interface LeaderboardEntry {
  id: string;
  rank: number;
  observer: string;
  target: string;
  category: string;
  score: number;
  verified: boolean;
  time: string;
  sha256Seal: string;
  distanceLy: number;
  spectralType?: string;
}

export interface RelativisticFlightTelemetry {
  distanceLy: number;
  beta02: number;
  beta085: number;
  gamma02: number;
  gamma085: number;
  travelTimeEarth02Years: number;
  travelTimeShip02Years: number;
  travelTimeEarth085Years: number;
  travelTimeShip085Years: number;
  radioLatencyYears: number;
  laserBeamPowerGW: number;
  interstellarShieldingRequirement: string;
}

class CitizenRegistryStore {
  private callsign: string = 'CMD-CYGNUS-9';
  private entries: LeaderboardEntry[] = [];
  private activePreprintTarget: {
    targetId: string;
    targetName: string;
    spectralType: string;
    category: string;
    score: number;
    sha256Seal: string;
    timestamp: string;
    observer: string;
    distanceLy: number;
  } | null = null;

  private listeners: Array<() => void> = [];

  constructor() {
    // Load persisted callsign if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('cosmosx_callsign');
        if (saved && saved.trim()) {
          this.callsign = saved.trim().toUpperCase();
        }
      } catch {
        // Safe localStorage fallback
      }
    }

    this.entries = [
      {
        id: 'LB-001',
        rank: 1,
        observer: 'AstroSeeker_99',
        target: 'TIC-25155310',
        category: 'Dyson Swarm Candidate (+3.42σ Mid-IR)',
        score: 99.8,
        verified: true,
        time: '2 hours ago',
        sha256Seal: 'SHA256: 4f8b9e1a2c3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
        distanceLy: 163000,
        spectralType: 'G2V',
      },
      {
        id: 'LB-002',
        rank: 2,
        observer: 'QuantumPulsar',
        target: 'Kepler-452b',
        category: 'Habitable Zone Super-Earth',
        score: 98.4,
        verified: true,
        time: '5 hours ago',
        sha256Seal: 'SHA256: 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        distanceLy: 1402,
        spectralType: 'G2V',
      },
      {
        id: 'LB-003',
        rank: 3,
        observer: 'SETI_Operator_Alpha',
        target: 'Proxima Centauri b',
        category: 'Narrowband Radio Drift (-0.32 Hz/s)',
        score: 96.7,
        verified: true,
        time: '1 day ago',
        sha256Seal: 'SHA256: 3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b',
        distanceLy: 4.246,
        spectralType: 'M5.5V',
      },
      {
        id: 'LB-004',
        rank: 4,
        observer: 'VoyagerProbeX',
        target: 'TRAPPIST-1e',
        category: 'Biosignature Atmospheric Disequilibrium',
        score: 95.9,
        verified: true,
        time: '2 days ago',
        sha256Seal: 'SHA256: e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7',
        distanceLy: 39.46,
        spectralType: 'M8V',
      },
      {
        id: 'LB-005',
        rank: 5,
        observer: 'CosmicVoyager42',
        target: 'Oumuamua-Astrometry',
        category: 'Hyperbolic Non-Grav Acceleration',
        score: 94.2,
        verified: true,
        time: '3 days ago',
        sha256Seal: 'SHA256: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        distanceLy: 0.00042,
        spectralType: 'Interstellar Planetesimal',
      },
    ];

    // Default active preprint target is the #1 discovery
    this.activePreprintTarget = {
      targetId: this.entries[0].target,
      targetName: this.entries[0].target,
      spectralType: this.entries[0].spectralType || 'G2V',
      category: this.entries[0].category,
      score: this.entries[0].score,
      sha256Seal: this.entries[0].sha256Seal,
      timestamp: '2026-10-26 09:38:40 UTC',
      observer: this.entries[0].observer,
      distanceLy: this.entries[0].distanceLy,
    };
  }

  public getCallsign(): string {
    return this.callsign;
  }

  public setCallsign(newCallsign: string) {
    const clean = (newCallsign || 'CMD-CYGNUS-9').trim().toUpperCase().slice(0, 18);
    this.callsign = clean;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('cosmosx_callsign', clean);
      } catch {
        // Safe ignore
      }
    }
    this.notify();
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.entries];
  }

  public getActivePreprint() {
    return this.activePreprintTarget;
  }

  public setActivePreprintTarget(target: {
    targetId: string;
    targetName: string;
    spectralType?: string;
    category: string;
    score: number;
    sha256Seal: string;
    timestamp?: string;
    observer?: string;
    distanceLy?: number;
  }) {
    this.activePreprintTarget = {
      targetId: target.targetId,
      targetName: target.targetName || target.targetId,
      spectralType: target.spectralType || 'Stellar Target',
      category: target.category,
      score: target.score,
      sha256Seal: target.sha256Seal,
      timestamp: target.timestamp || new Date().toISOString(),
      observer: target.observer || this.callsign,
      distanceLy: target.distanceLy || 120,
    };
    this.notify();
  }

  /**
   * Insert newly minted certified discovery at Rank #1 on the Global Citizen Leaderboard
   * and auto-populate the ApJ Preprint Dossier
   */
  public mintAndPublishDiscovery(discovery: {
    targetId: string;
    type: string;
    certifiedScore: number;
    sha256Seal: string;
    distanceLy?: number;
    spectralType?: string;
  }): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      id: `LB-${Date.now().toString(36).toUpperCase()}`,
      rank: 1,
      observer: this.callsign,
      target: discovery.targetId,
      category: discovery.type,
      score: Number(discovery.certifiedScore.toFixed(1)),
      verified: true,
      time: 'Just now',
      sha256Seal: discovery.sha256Seal,
      distanceLy: discovery.distanceLy || 120,
      spectralType: discovery.spectralType || 'G2V',
    };

    // Re-rank previous entries
    const updated = [newEntry, ...this.entries.filter((e) => e.target !== discovery.targetId)].slice(0, 20);
    this.entries = updated.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Auto-populate ApJ LaTeX Preprint Dossier
    this.activePreprintTarget = {
      targetId: discovery.targetId,
      targetName: discovery.targetId,
      spectralType: discovery.spectralType || 'G2V',
      category: discovery.type,
      score: discovery.certifiedScore,
      sha256Seal: discovery.sha256Seal,
      timestamp: new Date().toISOString(),
      observer: this.callsign,
      distanceLy: discovery.distanceLy || 120,
    };

    this.notify();
    return newEntry;
  }

  /**
   * Relativistic Breakthrough Starshot probe flight physics:
   * γ = 1 / √(1 - v²/c²)
   */
  public calculateRelativisticFlight(distanceLy: number): RelativisticFlightTelemetry {
    const dist = Math.max(0.0001, distanceLy);

    // Speed 1: Breakthrough Starshot standard v = 0.20c
    const beta02 = 0.2;
    const gamma02 = 1 / Math.sqrt(1 - beta02 * beta02); // ~1.02062
    const travelTimeEarth02 = dist / beta02;
    const travelTimeShip02 = travelTimeEarth02 / gamma02;

    // Speed 2: Advanced Relativistic Laser Sail v = 0.85c
    const beta085 = 0.85;
    const gamma085 = 1 / Math.sqrt(1 - beta085 * beta085); // ~1.89832
    const travelTimeEarth085 = dist / beta085;
    const travelTimeShip085 = travelTimeEarth085 / gamma085;

    // Radio data transmission return time to mission control (Earth Frame)
    const radioLatency = dist; // Speed of light c = 1 ly/yr

    // Phased-array laser sail beam power in gigawatts: P ~ m * a * c
    // For a 1-gram wafer probe accelerated to 0.2c over 10 minutes: ~100 GW
    const laserBeamPowerGW = 100;

    return {
      distanceLy: dist,
      beta02,
      beta085,
      gamma02: Number(gamma02.toFixed(4)),
      gamma085: Number(gamma085.toFixed(4)),
      travelTimeEarth02Years: Number(travelTimeEarth02.toFixed(2)),
      travelTimeShip02Years: Number(travelTimeShip02.toFixed(2)),
      travelTimeEarth085Years: Number(travelTimeEarth085.toFixed(2)),
      travelTimeShip085Years: Number(travelTimeShip085.toFixed(2)),
      radioLatencyYears: Number(radioLatency.toFixed(2)),
      laserBeamPowerGW,
      interstellarShieldingRequirement:
        beta085 > 0.5 ? 'Beryllium-aerogel ablative impact shield required (v > 0.5c)' : 'Carbon-nanotube thin wafer',
    };
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const citizenRegistry = new CitizenRegistryStore();
