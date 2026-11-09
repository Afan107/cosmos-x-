import { StellarParameters } from '../engine/transitSolver';
import { AnomalyEvaluation } from '../engine/anomalyEngine';

export interface CatalogTarget extends StellarParameters {
  id: string;
  constellation: string;
  spectralType: string;
  vMag: number;
  distanceLy: number;
  knownPlanets: number;
  primaryAnomaly?: string;
  isDysonCandidate?: boolean;
  isHabitableCandidate?: boolean;
  isRadioSource?: boolean;
  defaultPeriod: number;
  defaultTransitDepth: number; // relative dip
  defaultDurationHours: number;
  wisePhotometry: {
    w1: number;
    w2: number;
    w3: number;
    w4: number;
  };
  radioCharacteristics?: {
    bandwidthHz: number;
    driftRateHzS: number;
    snr: number;
    centerFreqMhz: number;
  };
  overview: string;
}

export interface CatalogAnomaly {
  id: string;
  title: string;
  targetId: string;
  category: 'DYSON_SPHERE' | 'RADIO_TECHNOSIGNATURE' | 'GRAVITATIONAL_MICROLENSING' | 'EXTREME_TRANSIT';
  priority: 'CRITICAL' | 'ELEVATED' | 'MONITOR';
  confidencePct: number;
  coordinates: {
    ra: string;
    dec: string;
    sector: string;
  };
  summary: string;
  details: string[];
  telemetryMetrics: Record<string, string | number>;
  recommendedFacility: string;
}

export const CATALOG_STARS: CatalogTarget[] = [
  {
    id: 'TIC-25155310',
    targetId: 'TIC-25155310',
    name: 'TIC-25155310 (LMC Sector 64)',
    teff: 5420,
    radiusStellar: 0.94,
    massStellar: 0.96,
    ra: 84.152,
    dec: -69.214,
    constellation: 'Dorado / LMC',
    spectralType: 'G5V Dwarf',
    vMag: 11.2,
    distanceLy: 163000,
    knownPlanets: 1,
    primaryAnomaly: 'IR_EXCESS_DYSON_LMC_04',
    isDysonCandidate: true,
    isHabitableCandidate: true,
    defaultPeriod: 4.2301,
    defaultTransitDepth: 0.00142, // 1420 ppm
    defaultDurationHours: 2.85,
    wisePhotometry: {
      w1: 10.42,
      w2: 10.38,
      w3: 8.72, // Severe W1 - W3 excess = 1.70
      w4: 7.21, // Severe W3 - W4 excess = 1.51
    },
    radioCharacteristics: {
      bandwidthHz: 120.0,
      driftRateHzS: 0.0,
      snr: 4.2,
      centerFreqMhz: 1420.4,
    },
    overview:
      'A mature G-type dwarf exhibiting a 3.42-sigma infrared flux excess at 12 µm and 22 µm alongside a sharp, periodic 1420 ppm exoplanetary occultation. Candidate for non-thermal circumstellar absorption.',
  },
  {
    id: 'KIC-8462852',
    targetId: 'KIC-8462852',
    name: "KIC-8462852 (Boyajian's Star)",
    teff: 6750,
    radiusStellar: 1.58,
    massStellar: 1.43,
    ra: 301.549,
    dec: 44.456,
    constellation: 'Cygnus',
    spectralType: 'F3V Main Sequence',
    vMag: 11.7,
    distanceLy: 1470,
    knownPlanets: 0,
    primaryAnomaly: 'KIC_8462852_WISE_SWARM',
    isDysonCandidate: true,
    defaultPeriod: 20.4,
    defaultTransitDepth: 0.0215, // Up to 2.15% (historically up to 22%)
    defaultDurationHours: 48.0,
    wisePhotometry: {
      w1: 10.72,
      w2: 10.69,
      w3: 9.21,
      w4: 7.95,
    },
    radioCharacteristics: {
      bandwidthHz: 4.2,
      driftRateHzS: 0.12,
      snr: 9.8,
      centerFreqMhz: 1420.405,
    },
    overview:
      "Famous for irregular, asymmetric, non-periodic occultations blocking up to 22% of stellar flux. Hypotheses range from massive disintegrating exocomets to an uneven circumstellar Dyson swarm.",
  },
  {
    id: 'Kepler-452b',
    targetId: 'Kepler-452',
    name: "Kepler-452 (Earth's Cousin)",
    teff: 5757,
    radiusStellar: 1.11,
    massStellar: 1.04,
    ra: 296.009,
    dec: 44.278,
    constellation: 'Cygnus',
    spectralType: 'G2V Solar Twin',
    vMag: 13.4,
    distanceLy: 1400,
    knownPlanets: 1,
    isHabitableCandidate: true,
    defaultPeriod: 384.84,
    defaultTransitDepth: 0.00021, // 210 ppm
    defaultDurationHours: 10.5,
    wisePhotometry: {
      w1: 12.1,
      w2: 12.08,
      w3: 12.02,
      w4: 11.95,
    },
    overview:
      'Super-Earth exoplanet orbiting within the conservative habitable zone of a G2V star with an orbital period of 384.8 days (~1.05 AU), receiving 1.1x the solar flux Earth receives.',
  },
  {
    id: 'TRAPPIST-1e',
    targetId: 'TRAPPIST-1',
    name: 'TRAPPIST-1 (Compact System)',
    teff: 2566,
    radiusStellar: 0.121,
    massStellar: 0.089,
    ra: 346.622,
    dec: -5.041,
    constellation: 'Aquarius',
    spectralType: 'M8V Ultra-Cool Dwarf',
    vMag: 18.8,
    distanceLy: 39.5,
    knownPlanets: 7,
    isHabitableCandidate: true,
    defaultPeriod: 6.0996,
    defaultTransitDepth: 0.0051, // 5100 ppm
    defaultDurationHours: 0.95,
    wisePhotometry: {
      w1: 10.35,
      w2: 10.25,
      w3: 10.15,
      w4: 10.02,
    },
    overview:
      'Host to 7 Earth-sized terrestrial planets in resonance. Planet e has Earth Similarity Index (ESI) of 0.85 with core density indicative of an iron core and potential liquid surface water oceans.',
  },
  {
    id: 'TOI-700-d',
    targetId: 'TOI-700',
    name: 'TOI-700 (TESS Habitable Planet)',
    teff: 3480,
    radiusStellar: 0.42,
    massStellar: 0.415,
    ra: 97.098,
    dec: -65.679,
    constellation: 'Dorado',
    spectralType: 'M2V Red Dwarf',
    vMag: 13.1,
    distanceLy: 101.4,
    knownPlanets: 4,
    isHabitableCandidate: true,
    defaultPeriod: 37.426,
    defaultTransitDepth: 0.00063, // 630 ppm
    defaultDurationHours: 3.2,
    wisePhotometry: {
      w1: 9.85,
      w2: 9.81,
      w3: 9.77,
      w4: 9.72,
    },
    overview:
      'TESS prime mission discovery: a quiet, non-flaring M-dwarf with a terrestrial Earth-size planet in its conservative habitable zone with mild insolation of 0.86 S_Earth.',
  },
  {
    id: 'Proxima-Centauri-b',
    targetId: 'Proxima-Centauri',
    name: 'Proxima Centauri (Alpha Centauri C)',
    teff: 3042,
    radiusStellar: 0.154,
    massStellar: 0.122,
    ra: 217.429,
    dec: -62.679,
    constellation: 'Centaurus',
    spectralType: 'M5.5V Flare Star',
    vMag: 11.05,
    distanceLy: 4.24,
    knownPlanets: 2,
    primaryAnomaly: 'BL_TECHNO_SIGNAL_PROXIMA_01',
    isRadioSource: true,
    defaultPeriod: 11.186,
    defaultTransitDepth: 0.0038,
    defaultDurationHours: 1.15,
    wisePhotometry: {
      w1: 4.38,
      w2: 4.25,
      w3: 4.15,
      w4: 4.02,
    },
    radioCharacteristics: {
      bandwidthHz: 1.8,
      driftRateHzS: 0.32, // Characteristic Breakthrough Listen drift
      snr: 28.4,
      centerFreqMhz: 1420.45,
    },
    overview:
      'The nearest known exoplanet to our Solar System. Target of the Breakthrough Listen BLC1 candidate investigation due to a persistent 982 MHz / 1420 MHz drifting carrier.',
  },
  {
    id: 'HD-209458-b',
    targetId: 'HD-209458',
    name: 'HD 209458 (Osiris Prototype)',
    teff: 6065,
    radiusStellar: 1.20,
    massStellar: 1.15,
    ra: 330.795,
    dec: 18.884,
    constellation: 'Pegasus',
    spectralType: 'G0V Yellow Dwarf',
    vMag: 7.65,
    distanceLy: 159,
    knownPlanets: 1,
    defaultPeriod: 3.5247,
    defaultTransitDepth: 0.0146, // 14,600 ppm
    defaultDurationHours: 3.08,
    wisePhotometry: {
      w1: 6.32,
      w2: 6.31,
      w3: 6.29,
      w4: 6.25,
    },
    overview:
      'First exoplanet observed in transit and first with detected atmospheric evaporation. Features a bloated envelope of hydrogen, sodium, and carbon escaping at hydrodynamic rates.',
  },
  {
    id: 'FRB-20261021A',
    targetId: 'FRB-20261021A-SRC',
    name: 'FRB 20261021A Host Galaxy System',
    teff: 4800,
    radiusStellar: 0.82,
    massStellar: 0.88,
    ra: 132.84,
    dec: 31.25,
    constellation: 'Cancer',
    spectralType: 'K2V / Extragalactic Host',
    vMag: 16.4,
    distanceLy: 480000000,
    knownPlanets: 0,
    primaryAnomaly: 'FRB_LOC_20261021A',
    isRadioSource: true,
    defaultPeriod: 16.35, // Periodic periodicity window
    defaultTransitDepth: 0.0008,
    defaultDurationHours: 1.2,
    wisePhotometry: {
      w1: 14.2,
      w2: 14.1,
      w3: 13.9,
      w4: 13.6,
    },
    radioCharacteristics: {
      bandwidthHz: 3.8,
      driftRateHzS: -1.45,
      snr: 44.2,
      centerFreqMhz: 1400.0,
    },
    overview:
      'High dispersion measure (DM = 557 pc/cm³) repeating Fast Radio Burst source showing 16.35-day periodicity window and sub-burst downward frequency drifting (sad trombone effect).',
  },
];

export const CATALOG_ANOMALIES: CatalogAnomaly[] = [
  {
    id: 'IR_EXCESS_DYSON_LMC_04',
    title: 'Dyson Sphere Candidate (Mid-IR Thermal Excess)',
    targetId: 'TIC-25155310',
    category: 'DYSON_SPHERE',
    priority: 'CRITICAL',
    confidencePct: 96.4,
    coordinates: {
      ra: '05h 36m 36s',
      dec: "-69° 12' 50\"",
      sector: 'TESS SEC-64 / LMC CORE',
    },
    summary:
      'Significant non-thermal mid/far-infrared excess in WISE W3 (12 µm) and W4 (22 µm) filters inconsistent with mature G-dwarf stellar blackbody. Matches low-temperature waste heat (~220K) expected from an alien megastructure swarm.',
    details: [
      'W1 - W3 Color Index: +1.70 (Standard stellar locus: 0.05 ± 0.12)',
      'W3 - W4 Color Index: +1.51 (Violation of Rayleigh-Jeans tail)',
      'Estimated fractional luminosity intercept: 14.8% of stellar output',
      'No optical nebular emission or known YSO star-forming cluster within 15 arcminutes',
    ],
    telemetryMetrics: {
      'Anomaly Index': '+3.42σ',
      'Waste Heat Temp': '218 K',
      'Covering Fraction': '14.8%',
      'Stellar Teff': '5,420 K',
    },
    recommendedFacility: 'JWST MIRI (Mid-Infrared Instrument) & NIRSpec integral field spectroscopy',
  },
  {
    id: 'BL_TECHNO_SIGNAL_PROXIMA_01',
    title: 'Narrowband Carrier with Linear Doppler Drift',
    targetId: 'Proxima-Centauri-b',
    category: 'RADIO_TECHNOSIGNATURE',
    priority: 'CRITICAL',
    confidencePct: 94.2,
    coordinates: {
      ra: '14h 29m 43s',
      dec: "-62° 40' 46\"",
      sector: 'DEEP SOUTH / ALPHA CEN CLUSTER',
    },
    summary:
      'Unclassified narrow-band signal (1.8 Hz bandwidth) detected at 1420.45 MHz (near neutral hydrogen line) exhibiting a persistent -0.32 Hz/s Doppler drift consistent with transmitter orbital motion.',
    details: [
      'Signal Bandwidth: 1.8 Hz (Natural cosmic sources are > 50 Hz)',
      'Doppler Drift Rate: -0.32 Hz/s (Matches topocentric exoplanet orbital acceleration)',
      'Signal-to-Noise Ratio (SNR): 28.4σ above galactic synchrotron baseline',
      'Passes on-off spatial pointing test: Absent when beam pointed at off-target calibrator',
    ],
    telemetryMetrics: {
      'Bandwidth': '1.8 Hz',
      'Drift Rate': '-0.32 Hz/s',
      'Center Freq': '1420.450 MHz',
      'SNR': '28.4',
    },
    recommendedFacility: 'Square Kilometre Array (SKA-1 Low) & Very Large Array (VLA) multi-beam verification',
  },
  {
    id: 'FRB_LOC_20261021A',
    title: 'Repeater Fast Radio Burst with High DM',
    targetId: 'FRB-20261021A',
    category: 'RADIO_TECHNOSIGNATURE',
    priority: 'ELEVATED',
    confidencePct: 88.1,
    coordinates: {
      ra: '08h 51m 21s',
      dec: "+31° 15' 00\"",
      sector: 'NORTHERN EQUATORIAL / CANCER',
    },
    summary:
      'Extragalactic millisecond-duration radio burst repeating every 16.35 days. Dispersion measure of 557 pc/cm³ indicates extragalactic origin traversing dense magnetized plasma.',
    details: [
      'Dispersion Measure (DM): 557.4 pc/cm³ (Milky Way contribution: ~45 pc/cm³)',
      'Rotation Measure (RM): +8,420 rad/m² (Extreme magneto-ionic environment)',
      'Pulse width: 1.84 milliseconds with microsecond sub-structure',
    ],
    telemetryMetrics: {
      'DM': '557.4 pc/cm³',
      'Period Window': '16.35 d',
      'Peak Flux': '14.2 Jy',
      'RM': '+8,420 rad/m²',
    },
    recommendedFacility: 'CHIME Radio Telescope & FAST 500-meter Aperture Spherical Telescope',
  },
  {
    id: 'KIC_8462852_WISE_SWARM',
    title: 'Aperiodic Megastructure Occultation Dips',
    targetId: 'KIC-8462852',
    category: 'EXTREME_TRANSIT',
    priority: 'ELEVATED',
    confidencePct: 85.3,
    coordinates: {
      ra: '20h 06m 15s',
      dec: "+44° 27' 24\"",
      sector: 'KEPLER FOV / CYGNUS',
    },
    summary:
      'Deep asymmetric dips up to 22% in Kepler archive and confirmed long-term secular dimming rate of ~0.34% per year over decades. Non-spherical occulting bodies confirmed by chromatic transmission.',
    details: [
      'Peak Transit Depth: 21,500 ppm (up to 220,000 ppm historically)',
      'Secular dimming trend: -0.341% / yr confirmed by DASCH photographic plates',
      'Dip shape: Sharp ingress, elongated jagged egress incompatible with spherical planet',
    ],
    telemetryMetrics: {
      'Peak Depth': '2.15%',
      'Secular Drift': '-0.34%/yr',
      'Spectral Type': 'F3V',
      'Distance': '1,470 ly',
    },
    recommendedFacility: 'Las Cumbres Observatory Global Telescope (LCOGT) robotic multi-color network',
  },
  {
    id: 'LENS_ANOM_984_EINSTEIN',
    title: 'Gravitational Microlensing Caustic Spike',
    targetId: 'TIC-25155310',
    category: 'GRAVITATIONAL_MICROLENSING',
    priority: 'MONITOR',
    confidencePct: 74.0,
    coordinates: {
      ra: '17h 58m 22s',
      dec: "-29° 01' 11\"",
      sector: 'GALACTIC BULGE WINDOW',
    },
    summary:
      'Extreme point-source magnification peak (A0 = 84.2) showing secondary caustic-crossing perturbation. Indicates a low-mass companion (sub-Earth exoplanet or primordial black hole) in lens plane.',
    details: [
      'Peak Magnification: 84.2x baseline flux',
      'Einstein Ring Crossing Time (t_E): 38.6 days',
      'Caustic anomaly duration: 9.4 hours with dual-spike signature',
    ],
    telemetryMetrics: {
      'A0 Peak': '84.2x',
      't_E': '38.6 days',
      'Mass Ratio q': '4.8 × 10⁻⁵',
    },
    recommendedFacility: 'Nancy Grace Roman Space Telescope (Roman Galactic Exoplanet Survey)',
  },
];
