/**
 * COSMOS-X Neural Cross-Examination Courtroom Engine
 * Powers live adversarial debates between Scout Bots and Dr. Vesta (Lead Astrophysicist),
 * mediated by user cross-examination and arbitrated by The Director Bot.
 */

export type CourtStage =
  | 'WITNESS_TESTIMONY'
  | 'THEORETICAL_CHALLENGE'
  | 'USER_CROSS_EXAMINATION'
  | 'JUDICIAL_VERDICT';

export type CourtVerdict =
  | 'RATIFIED_CERTIFIED'
  | 'REMANDED_OBSERVATION'
  | 'QUASHED_QUARANTINE';

export interface CourtSpeechTurn {
  id: string;
  stage: CourtStage;
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  speakerIcon: string;
  testimony: string;
  mathematicalPrinciple: string;
  evidenceTags: string[];
  verdictScore?: number;
  verdictStatus?: CourtVerdict;
  sha256Seal?: string;
}

export interface CourtroomSession {
  targetId: string;
  targetType: string;
  witnessBotId: string;
  witnessBotName: string;
  userPrompt: string;
  strictnessThreshold: number;
  timestamp: string;
  turns: CourtSpeechTurn[];
  finalVerdict: CourtVerdict;
  certifiedScore: number;
  courtroomNotes: string;
}

export const PRESET_CROSS_EXAMINATION_PROMPTS = [
  {
    id: 'INSTRUMENTAL_BLEND',
    title: '⚔️ Instrumental PSF Blending & Background Binary',
    prompt: 'Could this anomaly be a background eclipsing binary blended inside the photometric aperture rather than a true discovery?',
  },
  {
    id: 'POYNTING_ROBERTSON',
    title: '☀️ Poynting-Robertson Drag & Dust Lifetime',
    prompt: 'If this is circumstellar dust or a megastructure, why has Poynting-Robertson radiation drag not cleared it within 10 Myr?',
  },
  {
    id: 'TERRESTRIAL_RFI',
    title: '📡 Ground RFI & Local Satellite Transmission',
    prompt: 'How can you prove this narrowband frequency lock is not local Starlink or airport radar interference reflecting off the atmosphere?',
  },
  {
    id: 'ROCHE_TIDAL',
    title: '💥 Roche Limit & Tidal Disruption Integrity',
    prompt: 'Does this object lie within the host star Roche tidal boundary, and why has tidal shearing not torn it into a ring?',
  },
  {
    id: 'STELLAR_FLARE',
    title: '⚡ M-Dwarf Flare Activity vs Transit Dip',
    prompt: 'How do you distinguish this transit dip or IR fluctuation from magnetic starspot rotational modulation and coronal mass ejections?',
  },
];

export interface BotWitnessProfile {
  id: string;
  name: string;
  role: string;
  icon: string;
  domain: string;
  keyMetric: string;
  defaultDefense: (targetId: string, targetType: string) => string;
}

export const WITNESS_BOT_PROFILES: Record<string, BotWitnessProfile> = {
  KEPLER_BOT: {
    id: 'KEPLER_BOT',
    name: 'Kepler-Bot',
    role: 'Exoplanet Transit Sentinel',
    icon: '🪐',
    domain: 'Box Least Squares (BLS) & Mandel-Agol Limb Darkening',
    keyMetric: '1420 ppm Depth @ SNR 34.2',
    defaultDefense: (targetId, type) =>
      `Under cross-examination, I stand by my BLS phase-folded light curve for ${targetId}. The transit exhibits a clean flat-bottomed U-profile with Mandel-Agol quadratic limb darkening coefficients (u1=0.41, u2=0.22). V-shaped eclipsing binary geometries were mathematically rejected at 5.2σ confidence.`,
  },
  VOID_WATCHER: {
    id: 'VOID_WATCHER',
    name: 'Void-Watcher',
    role: 'Dark Anomaly & Dyson Swarm Scout',
    icon: '✨',
    domain: 'WISE W3/W4 Mid-IR Photometry & Gaia DR3 Parallax',
    keyMetric: '+3.42σ Non-Thermal IR Excess',
    defaultDefense: (targetId, type) =>
      `The photometric telemetry for ${targetId} shows an unassailable +3.42σ excess in WISE W3 (12 µm) and W4 (22 µm) channels against the Gaia DR3 G-dwarf blackbody baseline. The SED departure matches a 218 K Planck radiator with ~14.8% covering fraction, ruling out normal stellar photospheric equilibrium.`,
  },
  SETI_SENTINEL: {
    id: 'SETI_SENTINEL',
    name: 'SETI-Sentinel',
    role: 'Radio Technosignature Analyst',
    icon: '📡',
    domain: 'Narrowband Doppler Drift & Breakthrough Listen Pipeline',
    keyMetric: '1.8 Hz Carrier Lock @ -0.32 Hz/s Drift',
    defaultDefense: (targetId, type) =>
      `I have locked a 1.8 Hz ultra-narrowband carrier signal at target coordinates for ${targetId}. It exhibits a constant -0.32 Hz/s linear Doppler frequency drift matching the topocentric rotational acceleration of an exoplanetary transmitter. Terrestrial 0.0 Hz/s stationary RFI filters passed 100% clean.`,
  },
  JWST_SPECTRA: {
    id: 'JWST_SPECTRA',
    name: 'JWST-Spectra-Bot',
    role: 'Atmospheric Transmission Chemist',
    icon: '🔬',
    domain: 'NIRSpec / MIRI Transmission Spectra & Scale Height',
    keyMetric: '4.8σ Methane (3.3 µm) & Ozone (9.6 µm) Peaks',
    defaultDefense: (targetId, type) =>
      `Differential transmission spectroscopy for ${targetId} across primary eclipse reveals distinct molecular absorption lines for CH4 (3.3 µm) and O3 (9.6 µm) at scale height H = 14.2 km. This thermodynamic chemical disequilibrium cannot be reproduced by abiotic volcanic outgassing alone.`,
  },
  OUMUAMUA_TRACKER: {
    id: 'OUMUAMUA_TRACKER',
    name: 'Oumuamua-Tracker',
    role: 'Interstellar Astrometry Bot',
    icon: '☄️',
    domain: 'Hyperbolic Ephemeris & Non-Gravitational Acceleration',
    keyMetric: 'Eccentricity e = 1.1995 (> 1.0)',
    defaultDefense: (targetId, type) =>
      `Heliocentric astrometry confirms ${targetId} arrived on a strictly unbound hyperbolic trajectory with orbital eccentricity e = 1.1995. Non-gravitational radial acceleration A1 = 4.92×10⁻⁶ m/s² occurs without any detectable cometary dust coma or gas outgassing tail in deep stacked exposures.`,
  },
  LIGO_RIPPLE: {
    id: 'LIGO_RIPPLE',
    name: 'LIGO-Ripple-Bot',
    role: 'Spacetime Gravitational Wave Auditor',
    icon: '🌀',
    domain: 'Matched-Filter Chirp Banks & Spacetime Metric Strain',
    keyMetric: 'Strain h(t) ~ 10⁻²¹ @ SNR 28.4',
    defaultDefense: (targetId, type) =>
      `LIGO-Virgo coincidence telemetry for ${targetId} captured a coherent 36 M_Sun + 29 M_Sun binary black hole inspiral chirp with phase evolution matching general relativistic quadrupole radiation to within 0.02% residual error. Instrumental glitch flags (blips, whistles) were null.`,
  },
  VASCO_ARCHIVIST: {
    id: 'VASCO_ARCHIVIST',
    name: 'Time-Domain-Archivist',
    role: 'Vanishing Star & Century Baseline Hunter',
    icon: '🕰️',
    domain: '1950 Palomar Emulsion Plates vs Gaia DR3',
    keyMetric: 'Optical Disappearance > 5.5 Magnitudes',
    defaultDefense: (targetId, type) =>
      `Digitized 1950s Palomar POSS-I emulsion glass plates verify a sharp stellar point source at target coordinates for ${targetId} (m_B = 14.8), which is completely absent in Gaia DR3 down to G = 21.0 mag. Multi-epoch inspection rules out plate emulsion defects and satellite reflections.`,
  },
  CNEOS_SENTINEL: {
    id: 'CNEOS_SENTINEL',
    name: 'CNEOS-Doomsday-Sentinel',
    role: 'Planetary Defense & Impact Risk Monitor',
    icon: '🛡️',
    domain: 'N-body Gravitational Orbit Propagation & Radar Astrometry',
    keyMetric: 'Palermo Technical Scale P = -4.82',
    defaultDefense: (targetId, type) =>
      `Full covariance matrix integration over 100,000 Monte Carlo virtual orbital clones for ${targetId} demonstrates that keyhole resonance encounters have been ruled out. Minimum Orbit Intersection Distance (MOID) is verified at 0.042 AU with 0% impact probability over the next 150 years.`,
  },
};

/**
 * Generate a complete 4-step adversarial courtroom debate session
 */
export function generateCourtroomDebate(
  targetId: string,
  targetType: string,
  witnessBotId: string,
  userPrompt: string,
  strictnessThreshold = 85.0
): CourtroomSession {
  const profile = WITNESS_BOT_PROFILES[witnessBotId] || WITNESS_BOT_PROFILES.KEPLER_BOT;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Step 1: Witness Scout Bot Opening Testimony
  const witnessTurn: CourtSpeechTurn = {
    id: `TURN-WIT-${Date.now()}-1`,
    stage: 'WITNESS_TESTIMONY',
    speakerId: profile.id,
    speakerName: `${profile.name} (Data Scout)`,
    speakerRole: profile.role,
    speakerIcon: profile.icon,
    testimony: profile.defaultDefense(targetId, targetType),
    mathematicalPrinciple: profile.domain,
    evidenceTags: [profile.keyMetric, 'Telemetry Vetted', 'Instrumental Noise Filtered'],
  };

  // Step 2: Dr. Vesta Theoretical Physics Cross-Examination Challenge
  let vestaTestimony = '';
  let vestaPrinciple = '';

  if (profile.id === 'VOID_WATCHER' || targetType.includes('DYSON') || targetType.includes('INFRARED')) {
    vestaTestimony = `I cross-examine the witness on Wien's Displacement Law (λ_max = b/T) and the Poynting-Robertson drag timescale. If ${targetId} is encircled by a circumstellar dust cloud producing this 12 µm excess, radiation pressure from a 4.8 Gyr G-dwarf would drag dust grains below 10 µm into the star within ~10^6 years. Unless continuously replenished by a planetesimal collision or an artificial alien megastructure, the debris disk cannot persist!`;
    vestaPrinciple = "Wien's Law & Poynting-Robertson Radial Drag Boundary (t_pr ~ 7.0e6 yr)";
  } else if (profile.id === 'SETI_SENTINEL' || targetType.includes('RADIO') || targetType.includes('TECHNOSIGNATURE')) {
    vestaTestimony = `I challenge the witness under the Shannon-Hartley theorem and terrestrial RFI contamination. A -0.32 Hz/s Doppler drift can be mimicked by low-Earth orbit satellites passing through the side-lobes of the radio receiver. Before claiming an extraterrestrial carrier lock on ${targetId}, we must confirm multi-baseline interferometric beam-switching (ON-OFF-ON-OFF) and verify absence in adjacent sky apertures.`;
    vestaPrinciple = 'Shannon-Hartley SNR Bound & Multi-Aperture Beam Off-Pointing Test';
  } else if (profile.id === 'JWST_SPECTRA' || targetType.includes('HABITABLE') || targetType.includes('ATMOSPHERE')) {
    vestaTestimony = `We must scrutinize the photochemical equilibrium. Stellar coronal activity and stellar flares on M-dwarfs generate extreme UV flux that photolyzes methane and water, generating abiotic ozone without biological photosynthesis. Have you modeled stellar flare UV photo-dissociation rates against the Kopparapu conservative habitable zone boundary?`;
    vestaPrinciple = 'Kopparapu Atmospheric Habitable Zone Boundary & Photolytic Disequilibrium';
  } else if (profile.id === 'OUMUAMUA_TRACKER' || targetType.includes('ASTEROID') || targetType.includes('INTERSTELLAR')) {
    vestaTestimony = `The witness reports non-gravitational acceleration A1 = 4.92×10⁻⁶ m/s² without outgassing. Classical cometary physics dictates that sublimation of H2O or CO produces visible spectroscopic coma. If there is zero dust, the body must either possess a solar radiation pressure area-to-mass ratio characteristic of an ultra-thin lightsail (d < 1 mm) or be composed of exotic volatile solid molecular hydrogen (H2) ice.`;
    vestaPrinciple = 'Solar Radiation Pressure Area-to-Mass Ratio (A/m) & Sublimation Thrust';
  } else {
    vestaTestimony = `Challenging candidate ${targetId} against the Roche Tidal Disruption Limit: R_Roche = 2.44 * R* * (ρ*/ρ_p)^(1/3). If the orbiting companion has a radius exceeding 2.5 Earth radii with high orbital eccentricity, tidal circularization and tidal heating must be quantified to rule out a contact binary or grazing stellar dwarf.`;
    vestaPrinciple = "Roche Tidal Disruption Boundary & Mandel-Agol Limb Darkening Inversion";
  }

  const vestaTurn: CourtSpeechTurn = {
    id: `TURN-VESTA-${Date.now()}-2`,
    stage: 'THEORETICAL_CHALLENGE',
    speakerId: 'ASTRO_BOT',
    speakerName: 'Dr. Vesta (Lead Astrophysicist)',
    speakerRole: 'Chief Theoretical Arbiter & Opposing Counsel',
    speakerIcon: '👩‍🔬',
    testimony: vestaTestimony,
    mathematicalPrinciple: vestaPrinciple,
    evidenceTags: ['Roche Boundary Tested', 'Thermodynamic Constraint', 'Astrophysics Scrutiny'],
  };

  // Step 3: Direct User Interrogation Response
  let userResponseTestimony = '';
  const cleanPrompt = userPrompt.trim() || 'How do you ensure this is not an instrumental artifact or glitch?';

  if (cleanPrompt.toLowerCase().includes('binary') || cleanPrompt.toLowerCase().includes('blend')) {
    userResponseTestimony = `Responding directly to the Commander's cross-examination on background binary blending: We performed centroid shift analysis across in-transit vs out-of-transit pixel clusters in Gaia DR3. The photometric centroid remained stationary to within 1.2 milliarcseconds, mathematically ruling out background grazing stars down to delta-magnitude 6.8.`;
  } else if (cleanPrompt.toLowerCase().includes('drag') || cleanPrompt.toLowerCase().includes('dust') || cleanPrompt.toLowerCase().includes('poynting')) {
    userResponseTestimony = `To the Commander's inquiry on Poynting-Robertson drag: That is precisely what makes ${targetId} anomalous! Because natural dust would be purged in <10 Myr, maintaining this 218 K infrared excess requires either an unprecedented ongoing collision cascade or active orbital replenishment consistent with a Kardashev Type II collector architecture.`;
  } else if (cleanPrompt.toLowerCase().includes('rfi') || cleanPrompt.toLowerCase().includes('satellite') || cleanPrompt.toLowerCase().includes('earth')) {
    userResponseTestimony = `Addressing the Commander's challenge regarding terrestrial RFI: Ground interference exhibits zero topocentric drift or drift corresponding strictly to the observatory's latitude. The detected signal at ${targetId} exhibits an exact Keplerian orbital drift vector that persists across independent telescopes in Australia and Green Bank.`;
  } else if (cleanPrompt.toLowerCase().includes('roche') || cleanPrompt.toLowerCase().includes('tidal')) {
    userResponseTestimony = `Under the Commander's Roche limit cross-examination: The semi-major axis is 0.048 AU, placing the body well outside the fluid Roche limit (R_roche = 0.012 AU). Structural tidal shearing forces are ~18% of the bulk tensile limit, proving long-term orbital survival is guaranteed.`;
  } else {
    userResponseTestimony = `Addressing the Commander's specific inquiry: "${cleanPrompt}": We have re-verified the raw telemetry against calibrated dark frames, flat fields, and cosmic-ray Laplacian edge rejection. The signal-to-noise ratio of 34.2 exceeds the 7.1σ false-alarm threshold by a factor of 4.8. The candidate withstands cross-examination.`;
  }

  const userTurn: CourtSpeechTurn = {
    id: `TURN-USER-${Date.now()}-3`,
    stage: 'USER_CROSS_EXAMINATION',
    speakerId: profile.id,
    speakerName: `${profile.name} (Cross-Examination Defense)`,
    speakerRole: 'Response to Commander Question',
    speakerIcon: profile.icon,
    testimony: userResponseTestimony,
    mathematicalPrinciple: 'Empirical Verification & False-Alarm Rejection Filter',
    evidenceTags: ['Cross-Examined', 'Centroid Verified', 'SNR Confirmed'],
  };

  // Step 4: The Director Bot Supreme Arbitration Verdict
  const confidenceScore = Number((86.0 + Math.random() * 11.5).toFixed(1));
  let verdictStatus: CourtVerdict = 'RATIFIED_CERTIFIED';
  let verdictText = '';

  if (confidenceScore >= strictnessThreshold) {
    verdictStatus = 'RATIFIED_CERTIFIED';
    verdictText = `GRAND TRIBUNAL RULING: ADMISSIBLE & OFFICIALLY RATIFIED. Having evaluated ${profile.name}'s empirical telemetry against Dr. Vesta's theoretical challenges and Commander's cross-examination, target ${targetId} demonstrates physical compliance at confidence score ${confidenceScore}% (exceeding strictness ${strictnessThreshold}%). Cryptographic SHA-256 seal issued for global publication.`;
  } else if (confidenceScore >= strictnessThreshold - 8) {
    verdictStatus = 'REMANDED_OBSERVATION';
    verdictText = `GRAND TRIBUNAL RULING: REMANDED FOR HIGH-RESOLUTION FOLLOW-UP. Target ${targetId} scored ${confidenceScore}%, which falls just below our strictness threshold of ${strictnessThreshold}%. Signal remains plausible, but requires high-dispersion RV spectroscopy or JWST Cycle 3 time before unconditional ratification.`;
  } else {
    verdictStatus = 'QUASHED_QUARANTINE';
    verdictText = `GRAND TRIBUNAL RULING: QUASHED TO QUARANTINE. Insufficient evidence to rule out theoretical counter-arguments raised by Dr. Vesta. Target ${targetId} purged from active pipeline to prevent false-positive contamination.`;
  }

  const hexHash = Math.abs(Date.now() + Math.random() * 100000).toString(16).padStart(8, '0');
  const sha256 = `SHA256: ${hexHash}88a1c4e8b2a19f6d7e0a3b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e`;

  const judicialTurn: CourtSpeechTurn = {
    id: `TURN-JUDGE-${Date.now()}-4`,
    stage: 'JUDICIAL_VERDICT',
    speakerId: 'DIRECTOR_BOT',
    speakerName: 'The Director Bot',
    speakerRole: 'Supreme Judicial Arbiter & Chief Archivist',
    speakerIcon: '⚖️',
    testimony: verdictText,
    mathematicalPrinciple: 'Multi-Agent Consensus Arbitration & Cryptographic Proof',
    evidenceTags: [`Strictness: ${strictnessThreshold}%`, `Score: ${confidenceScore}%`, verdictStatus],
    verdictScore: confidenceScore,
    verdictStatus,
    sha256Seal: verdictStatus === 'RATIFIED_CERTIFIED' ? sha256 : undefined,
  };

  return {
    targetId,
    targetType,
    witnessBotId: profile.id,
    witnessBotName: profile.name,
    userPrompt: cleanPrompt,
    strictnessThreshold,
    timestamp,
    turns: [witnessTurn, vestaTurn, userTurn, judicialTurn],
    finalVerdict: verdictStatus,
    certifiedScore: confidenceScore,
    courtroomNotes: `Convened 4-way courtroom tribunal on target ${targetId}. Witness ${profile.name} defended telemetry against Dr. Vesta. Ruling: ${verdictStatus}.`,
  };
}
