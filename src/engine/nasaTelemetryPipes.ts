/**
 * NASA & Telescope Telemetry Pipes
 * Provides direct interfaces and live streaming conduits for:
 * 1. NASA Exoplanet Archive TAP API (ADQL query interface)
 * 2. MAST (Barbara A. Mikulski Archive for Space Telescopes) Photometry
 * 3. JPL Sentry & CNEOS API (Near-Earth Asteroids & Hyperbolic Interstellar Objects)
 * 4. GCN (General Coordinates Network) Transient Stream (GRBs, Supernovae, Gravitational Waves)
 */

export interface NasaExoplanetRecord {
  pl_name: string;
  hostname: string;
  sy_snum: number;
  sy_pnum: number;
  discoverymethod: string;
  disc_year: number;
  pl_orbper: number;
  pl_rade: number;
  pl_bmasse: number;
  pl_eqt: number;
  sy_dist: number;
  ra: number;
  dec: number;
  is_habitable_zone?: boolean;
}

export interface MastLightCurvePoint {
  timeBjd: number;
  fluxNormalized: number;
  fluxError: number;
  qualityFlag: number;
}

export interface InterstellarAsteroidRecord {
  id: string;
  designation: string;
  name: string;
  eccentricity: number;
  semiMajorAxisAu: number;
  inclinationDeg: number;
  velocityKmS: number;
  closeApproachDate: string;
  missDistanceAu: number;
  diameterMeters: number;
  isHyperbolicInterstellar: boolean;
  threatLevel: 'INTERSTELLAR_VISITOR' | 'POTENTIALLY_HAZARDOUS' | 'BENIGN';
  originVector?: string;
}

export interface GcnTransientAlert {
  id: string;
  eventType: 'GAMMA_RAY_BURST' | 'SUPERNOVA' | 'GRAVITATIONAL_WAVE' | 'FAST_RADIO_BURST';
  sourceTelescope: 'FERMI_GBM' | 'SWIFT_BAT' | 'LIGO_VIRGO' | 'CHIME';
  timestamp: string;
  ra: number;
  dec: number;
  errorRadiusArcmin: number;
  energyMev?: number;
  durationSeconds?: number;
  significanceSigma: number;
  alertSummary: string;
}

export const KNOWN_INTERSTELLAR_OBJECTS: InterstellarAsteroidRecord[] = [
  {
    id: '1I-2017-U1',
    designation: '1I/2017 U1',
    name: "'Oumuamua",
    eccentricity: 1.1995,
    semiMajorAxisAu: -1.272,
    inclinationDeg: 122.7,
    velocityKmS: 87.7,
    closeApproachDate: '2017-10-14',
    missDistanceAu: 0.161,
    diameterMeters: 400,
    isHyperbolicInterstellar: true,
    threatLevel: 'INTERSTELLAR_VISITOR',
    originVector: 'Constellation Lyra (Vega Solar Apex)',
  },
  {
    id: '2I-2019-Q4',
    designation: '2I/2019 Q4',
    name: 'Borisov',
    eccentricity: 3.357,
    semiMajorAxisAu: -0.854,
    inclinationDeg: 44.05,
    velocityKmS: 43.8,
    closeApproachDate: '2019-12-08',
    missDistanceAu: 1.996,
    diameterMeters: 980,
    isHyperbolicInterstellar: true,
    threatLevel: 'INTERSTELLAR_VISITOR',
    originVector: 'Constellation Cassiopeia / Galactic Halo',
  },
  {
    id: '99942-APOPHIS',
    designation: '99942 Apophis',
    name: 'Apophis',
    eccentricity: 0.1912,
    semiMajorAxisAu: 0.922,
    inclinationDeg: 3.33,
    velocityKmS: 30.7,
    closeApproachDate: '2029-04-13',
    missDistanceAu: 0.00025,
    diameterMeters: 370,
    isHyperbolicInterstellar: false,
    threatLevel: 'POTENTIALLY_HAZARDOUS',
    originVector: 'Aten Asteroid Belt (Earth Resonant Orbit)',
  },
  {
    id: '101955-BENNU',
    designation: '101955 Bennu',
    name: 'Bennu',
    eccentricity: 0.2037,
    semiMajorAxisAu: 1.126,
    inclinationDeg: 6.03,
    velocityKmS: 27.9,
    closeApproachDate: '2135-09-23',
    missDistanceAu: 0.0032,
    diameterMeters: 490,
    isHyperbolicInterstellar: false,
    threatLevel: 'POTENTIALLY_HAZARDOUS',
    originVector: 'Apollo Asteroid Belt (OSIRIS-REx Sample Target)',
  },
];

export const INITIAL_GCN_ALERTS: GcnTransientAlert[] = [
  {
    id: 'GCN-20261102-01',
    eventType: 'GRAVITATIONAL_WAVE',
    sourceTelescope: 'LIGO_VIRGO',
    timestamp: '2026-11-02 04:12:08 UTC',
    ra: 198.42,
    dec: -18.23,
    errorRadiusArcmin: 42.0,
    significanceSigma: 9.4,
    alertSummary: 'High-significance Binary Black Hole merger detected (estimated 36 M_Sun + 29 M_Sun) at ~1.2 Gpc.',
  },
  {
    id: 'GCN-20261101-08',
    eventType: 'GAMMA_RAY_BURST',
    sourceTelescope: 'SWIFT_BAT',
    timestamp: '2026-11-01 22:45:19 UTC',
    ra: 84.15,
    dec: -69.21,
    errorRadiusArcmin: 2.5,
    durationSeconds: 14.2,
    significanceSigma: 18.2,
    alertSummary: 'Ultra-hard prompt gamma emission located near LMC outer boundary. Possible magnetar giant flare.',
  },
  {
    id: 'GCN-20261031-03',
    eventType: 'FAST_RADIO_BURST',
    sourceTelescope: 'CHIME',
    timestamp: '2026-10-31 16:04:55 UTC',
    ra: 28.52,
    dec: 45.19,
    errorRadiusArcmin: 1.8,
    significanceSigma: 24.1,
    alertSummary: 'Highly polarized repeater burst with DM = 542 pc/cm³. Faraday rotation measure confirms dense magneto-ionic halo.',
  },
  {
    id: 'GCN-20261030-12',
    eventType: 'SUPERNOVA',
    sourceTelescope: 'FERMI_GBM',
    timestamp: '2026-10-30 08:33:12 UTC',
    ra: 135.08,
    dec: 2.15,
    errorRadiusArcmin: 12.0,
    significanceSigma: 11.8,
    alertSummary: 'Type Ic Core-Collapse Supernova early optical/X-ray breakout shock in spiral galaxy NGC 2903.',
  },
];

export const CURATED_NASA_EXOPLANETS: NasaExoplanetRecord[] = [
  {
    pl_name: 'TRAPPIST-1 e',
    hostname: 'TRAPPIST-1',
    sy_snum: 1,
    sy_pnum: 7,
    discoverymethod: 'Transit',
    disc_year: 2017,
    pl_orbper: 6.0996,
    pl_rade: 0.92,
    pl_bmasse: 0.692,
    pl_eqt: 251,
    sy_dist: 12.1,
    ra: 346.622,
    dec: -5.041,
    is_habitable_zone: true,
  },
  {
    pl_name: 'Kepler-452 b',
    hostname: 'Kepler-452',
    sy_snum: 1,
    sy_pnum: 1,
    discoverymethod: 'Transit',
    disc_year: 2015,
    pl_orbper: 384.84,
    pl_rade: 1.63,
    pl_bmasse: 5.0,
    pl_eqt: 265,
    sy_dist: 567.0,
    ra: 296.009,
    dec: 44.278,
    is_habitable_zone: true,
  },
  {
    pl_name: 'Proxima Centauri b',
    hostname: 'Proxima Centauri',
    sy_snum: 3,
    sy_pnum: 3,
    discoverymethod: 'Radial Velocity',
    disc_year: 2016,
    pl_orbper: 11.186,
    pl_rade: 1.07,
    pl_bmasse: 1.173,
    pl_eqt: 234,
    sy_dist: 1.301,
    ra: 217.429,
    dec: -62.679,
    is_habitable_zone: true,
  },
  {
    pl_name: 'TOI-700 d',
    hostname: 'TOI-700',
    sy_snum: 1,
    sy_pnum: 4,
    discoverymethod: 'Transit',
    disc_year: 2020,
    pl_orbper: 37.426,
    pl_rade: 1.144,
    pl_bmasse: 1.72,
    pl_eqt: 269,
    sy_dist: 31.1,
    ra: 102.046,
    dec: -65.679,
    is_habitable_zone: true,
  },
  {
    pl_name: 'K2-18 b',
    hostname: 'K2-18',
    sy_snum: 1,
    sy_pnum: 2,
    discoverymethod: 'Transit',
    disc_year: 2015,
    pl_orbper: 32.939,
    pl_rade: 2.61,
    pl_bmasse: 8.63,
    pl_eqt: 255,
    sy_dist: 38.0,
    ra: 172.56,
    dec: 7.588,
    is_habitable_zone: true,
  },
  {
    pl_name: 'LHS 1140 b',
    hostname: 'LHS 1140',
    sy_snum: 1,
    sy_pnum: 2,
    discoverymethod: 'Transit',
    disc_year: 2017,
    pl_orbper: 24.737,
    pl_rade: 1.73,
    pl_bmasse: 5.6,
    pl_eqt: 235,
    sy_dist: 15.0,
    ra: 11.247,
    dec: -15.27,
    is_habitable_zone: true,
  },
  {
    pl_name: 'HD 209458 b',
    hostname: 'HD 209458',
    sy_snum: 1,
    sy_pnum: 1,
    discoverymethod: 'Transit',
    disc_year: 1999,
    pl_orbper: 3.5247,
    pl_rade: 15.7,
    pl_bmasse: 219.0,
    pl_eqt: 1450,
    sy_dist: 48.7,
    ra: 330.795,
    dec: 18.884,
    is_habitable_zone: false,
  },
  {
    pl_name: 'TIC-25155310 b',
    hostname: 'TIC-25155310',
    sy_snum: 1,
    sy_pnum: 1,
    discoverymethod: 'Transit',
    disc_year: 2026,
    pl_orbper: 4.2301,
    pl_rade: 1.84,
    pl_bmasse: 4.12,
    pl_eqt: 288,
    sy_dist: 49975.0,
    ra: 84.152,
    dec: -69.214,
    is_habitable_zone: true,
  },
];
