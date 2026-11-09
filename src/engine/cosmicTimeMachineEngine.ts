/**
 * Cosmic Time Machine & Gravitational Lens De-Warper Engine
 *
 * Implements:
 * 1. Precision flat Lambda-CDM lookback time & cosmological distance integrals:
 *    H(z) = H_0 * sqrt( Omega_m*(1+z)^3 + Omega_r*(1+z)^4 + Omega_Lambda )
 *    t_L(z) = \int_0^z dz' / [ (1+z') * H(z') ]
 * 2. Gravitational Lens Equation Solver & Inverse De-Warping:
 *    beta = theta - alpha(theta), where alpha(theta) = theta_E^2 / |theta|
 * 3. Cosmological Redshift Wavelength Stretching:
 *    lambda_obs = lambda_emit * (1 + z)
 * 4. 5 Definitive Cosmic Epochs with Einstein & Sagan Narration.
 */

export interface CosmicEpoch {
  id: string;
  name: string;
  redshift: number;
  lookbackGyr: number;
  ageOfUniverseMyr: number;
  scaleFactorA: number;
  cmbTempKelvin: number;
  opticalAppearance: string;
  primaryFeatures: string[];
  einsteinNarration: string;
  saganNarration: string;
}

export interface WavelengthShift {
  restWavelengthNm: number;
  observedWavelengthNm: number;
  restBandName: string;
  observedBandName: string;
  jwstInstrument: string;
}

export interface LensSystemParams {
  lensRedshift: number; // e.g. 0.4
  sourceRedshift: number; // e.g. 10.5
  lensMassMsun: number; // e.g. 1.2e14 (cluster mass)
  einsteinRadiusArcsec: number; // e.g. 18.5
  ellipticity: number; // e.g. 0.25
}

// Flat Lambda-CDM parameters (Planck 2018 / DESI)
export const COSMO_PARAMS = {
  H0: 67.4, // km/s/Mpc
  OmegaM: 0.315,
  OmegaLambda: 0.685,
  OmegaR: 9.0e-5, // radiation
  T0_CMB: 2.7255, // Kelvin
  AgeOfUniverseGyr: 13.787,
};

/**
 * Calculates expansion rate H(z) in km/s/Mpc
 */
export function calculateHubbleAtZ(z: number): number {
  const { H0, OmegaM, OmegaLambda, OmegaR } = COSMO_PARAMS;
  const zp1 = 1 + z;
  const term = OmegaM * Math.pow(zp1, 3) + OmegaR * Math.pow(zp1, 4) + OmegaLambda;
  return H0 * Math.sqrt(Math.max(0.001, term));
}

/**
 * Calculates Lookback Time in Billion Years (Gyr) using numerical integration (Simpson's rule)
 */
export function calculateLookbackTimeGyr(z: number): number {
  if (z <= 0) return 0;
  // Convert 1/H0: 1 km/s/Mpc = 1.0227e-3 Gyr^-1
  const steps = 120;
  const dz = z / steps;
  let sum = 0;

  for (let i = 0; i <= steps; i++) {
    const curZ = i * dz;
    const zp1 = 1 + curZ;
    const Hz = calculateHubbleAtZ(curZ);
    const weight = i === 0 || i === steps ? 1 : i % 2 === 1 ? 4 : 2;
    // 977.8 converts (km/s/Mpc)^-1 to Gyr
    sum += weight * (977.8 / (zp1 * Hz));
  }

  const lookback = (dz / 3) * sum;
  return Math.min(COSMO_PARAMS.AgeOfUniverseGyr, Number(lookback.toFixed(3)));
}

/**
 * Computes observed wavelength given rest wavelength and redshift
 */
export function calculateWavelengthShift(restNm: number, z: number): WavelengthShift {
  const obsNm = restNm * (1 + z);
  let restBand = 'Ultraviolet (UV)';
  if (restNm >= 380 && restNm <= 750) restBand = 'Visible Optical';
  else if (restNm > 750 && restNm <= 2500) restBand = 'Near-Infrared (NIR)';
  else if (restNm > 2500) restBand = 'Mid/Far-Infrared';

  let obsBand = 'Visible Optical';
  let jwstInst = 'Ground Optical / Hubble';
  if (obsNm >= 750 && obsNm <= 5000) {
    obsBand = 'Near-Infrared (NIR)';
    jwstInst = 'JWST NIRCam / NIRSpec';
  } else if (obsNm > 5000 && obsNm <= 28000) {
    obsBand = 'Mid-Infrared (MIR)';
    jwstInst = 'JWST MIRI (Mid-Infrared Instrument)';
  } else if (obsNm > 28000 && obsNm <= 1e6) {
    obsBand = 'Far-Infrared / Sub-mm';
    jwstInst = 'ALMA Radio Array';
  } else if (obsNm > 1e6) {
    obsBand = 'Microwave / Radio';
    jwstInst = 'Planck / CMB Detectors';
  }

  return {
    restWavelengthNm: Number(restNm.toFixed(1)),
    observedWavelengthNm: Number(obsNm.toFixed(1)),
    restBandName: restBand,
    observedBandName: obsBand,
    jwstInstrument: jwstInst,
  };
}

/**
 * Solves Gravitational Lens Equation & Inverse De-Warp:
 * Computes pristine source plane coordinates (betaX, betaY) from warped image plane (thetaX, thetaY)
 * with continuous dewarpFactor in [0, 1].
 */
export function dewarpLensedCoordinate(
  thetaX: number,
  thetaY: number,
  thetaE: number,
  dewarpFactor: number, // 0 = fully warped banana arc, 1 = fully reconstructed baby galaxy
  ellipticity = 0.2
): { x: number; y: number; magnification: number } {
  const r = Math.sqrt(thetaX * thetaX + thetaY * thetaY);
  if (r <= 0.001) return { x: 0, y: 0, magnification: 1 };

  // Deflection angle alpha(theta) with elliptical quadrupole perturbation
  const cos2phi = (thetaX * thetaX - thetaY * thetaY) / (r * r);
  const alphaMag = (thetaE * thetaE) / r * (1 + ellipticity * cos2phi);

  const alphaX = (thetaX / r) * alphaMag;
  const alphaY = (thetaY / r) * alphaMag;

  // True un-warped source plane position: beta = theta - alpha
  const betaX = thetaX - alphaX;
  const betaY = thetaY - alphaY;

  // Interpolate between warped image plane and un-warped reconstructed source plane
  const x = thetaX * (1 - dewarpFactor) + betaX * dewarpFactor;
  const y = thetaY * (1 - dewarpFactor) + betaY * dewarpFactor;

  // Gravitational lensing magnification mu = 1 / |(1 - theta_E/r)|
  const mag = Math.min(50, Math.max(1, 1 / Math.abs(1 - (thetaE / Math.max(0.1, r)) + 0.02)));

  return { x, y, magnification: Number(mag.toFixed(1)) };
}

/**
 * 5 Definitive Cosmic Epochs
 */
export const COSMIC_EPOCHS: CosmicEpoch[] = [
  {
    id: 'MODERN_ERA',
    name: 'Modern Era (Mature Cosmos)',
    redshift: 0.0,
    lookbackGyr: 0.0,
    ageOfUniverseMyr: 13787,
    scaleFactorA: 1.0,
    cmbTempKelvin: 2.73,
    opticalAppearance: 'Vibrant grand-design spiral galaxies, yellow solar stars, Keplerian multi-planetary systems.',
    primaryFeatures: ['Milky Way & Andromeda', 'Keplerian Exoplanets', 'Equilibrium Cosmic Web'],
    einsteinNarration:
      'In our contemporary epoch, spacetime is cold and smoothly curved by mature galactic mass tensors. Gravitational dynamics obey our standard general relativistic field equations in their quietest state.',
    saganNarration:
      'We stand on our pale blue dot, looking back across cosmic time. The stars we see tonight are mature, tranquil suns that have nurtured elements across billions of generations.',
  },
  {
    id: 'COSMIC_NOON',
    name: 'Cosmic Noon (Peak Starburst & Quasars)',
    redshift: 2.0,
    lookbackGyr: 10.45,
    ageOfUniverseMyr: 3337,
    scaleFactorA: 0.333,
    cmbTempKelvin: 8.18,
    opticalAppearance: 'Intense violet ultraviolet glow, massive colliding gas-rich disks, supermassive black hole relativistic jets.',
    primaryFeatures: ['Peak Cosmic Star Formation (SFR)', 'Maximum Quasar Luminosity', 'Clumpy Turbulent Disks'],
    einsteinNarration:
      'At z = 2, matter was packed three times more densely, triggering violent relativistic accretion disks where gravitational potential energy converted into brilliant synchrotron radiation with 40% efficiency.',
    saganNarration:
      'This was the roaring teenager phase of the universe! Stars were being born at ten times today\'s rate, lighting up the cosmos like a dazzling firework display.',
  },
  {
    id: 'JWST_LITTLE_RED_DOTS',
    name: 'JWST Era ("Little Red Dots" & Monster Seeds)',
    redshift: 8.5,
    lookbackGyr: 13.12,
    ageOfUniverseMyr: 667,
    scaleFactorA: 0.105,
    cmbTempKelvin: 25.9,
    opticalAppearance: 'Extremely compact, ruby-red infrared beacons with screaming broad-line hydrogen emission and supermassive seeds.',
    primaryFeatures: [
      'Direct-Collapse Black Holes (10^7-10^9 M☉)',
      'Super-Eddington Gas Accretion',
      'Population III Blue Supergiants',
    ],
    einsteinNarration:
      'These "Little Red Dots" discovered by JWST challenge standard accretion limits! They represent massive direct-collapse seeds formed when pristine primordial clouds collapsed straight into gravitational singularities without fragmenting into stars.',
    saganNarration:
      'JWST peers into the cosmic nursery and finds full-grown giants sleeping in infant cribs! Overmassive black holes shining through dense dust cocoons, defying all our classic textbook assumptions.',
  },
  {
    id: 'COSMIC_DAWN',
    name: 'Reionization & Cosmic Dawn',
    redshift: 16.0,
    lookbackGyr: 13.54,
    ageOfUniverseMyr: 247,
    scaleFactorA: 0.059,
    cmbTempKelvin: 46.4,
    opticalAppearance: 'Luminescent ionized bubbles carving through opaque neutral hydrogen fog; pure metal-free monster stars.',
    primaryFeatures: ['First Stellar Ignitions', '21-cm Lyman-Alpha Ionization Bubbles', 'Zero Metal Abundance (Z = 0)'],
    einsteinNarration:
      'Here the first photons tore electrons from primordial hydrogen atoms. The energy-momentum tensor was dominated by pristine hydrogen-helium gas falling into dark matter potential wells.',
    saganNarration:
      'The cosmic dark ages end! After hundred-million-year-long night, the very first stars flickered on, banishing the dark and transforming the universe from a cold fog into a cathedral of light.',
  },
  {
    id: 'CMB_LAST_SCATTERING',
    name: 'Cosmic Microwave Background (Surface of Last Scattering)',
    redshift: 1100.0,
    lookbackGyr: 13.787,
    ageOfUniverseMyr: 0.38,
    scaleFactorA: 0.0009,
    cmbTempKelvin: 3000.0,
    opticalAppearance: 'Blinding 3,000 K glowing orange thermal plasma surface; acoustic pressure oscillations in photon-baryon fluid.',
    primaryFeatures: ['Baryon-Photon Decoupling', 'Acoustic Sound Horizon Peaks', 'Sachs-Wolfe Metric Perturbations'],
    einsteinNarration:
      'The surface of last scattering! At 380,000 years after the initial expansion, electrons bound with protons for the first time, liberating photons to travel freely across the Riemannian geodesics of our universe.',
    saganNarration:
      'The baby picture of the universe! This is the oldest starlight in existence—an echo of creation itself, stretched by 13.8 billion years of cosmic expansion into gentle microwave whispers we can detect today.',
  },
];
