/**
 * Dark Cosmos Anomaly Engine
 * Evaluates infrared excess (Dyson sphere waste heat signatures),
 * narrow-band radio signals (Breakthrough Listen drift rate protocols),
 * and astrophysical gravitational anomalies.
 */

export interface InfraredPhotometry {
  targetId: string;
  w1Mag: number; // 3.4 µm (WISE)
  w2Mag: number; // 4.6 µm
  w3Mag: number; // 12.0 µm
  w4Mag: number; // 22.0 µm
  teff: number; // Stellar effective temp (Kelvin)
  stellarClass?: string;
}

export interface AnomalyEvaluation {
  anomalyType:
    | 'DYSON_SPHERE_CANDIDATE'
    | 'WARM_DEBRIS_DISK'
    | 'STELLAR_EQUILIBRIUM'
    | 'TECHNO_SIGNATURE_NARROWBAND'
    | 'NATURAL_RADIO_EMISSION'
    | 'GRAVITATIONAL_MICROLENSING';
  confidenceScore: number; // 0 - 100
  threatOrPriority: 'CRITICAL' | 'ELEVATED' | 'MONITOR' | 'NOMINAL';
  metrics: Record<string, number | string | boolean>;
  flags: {
    w1w3Excess: number;
    w3w4Excess: number;
    nonStandardBlackbody: boolean;
    narrowbandVerified?: boolean;
    dopplerDriftDetected?: boolean;
  };
  recommendation: string;
}

export class DarkCosmosAnomalyEngine {
  /**
   * Evaluates candidate stars for mid/far-infrared excesses consistent with
   * alien megastructure waste heat (Dyson spheres / swarms) re-radiating intercepted starlight.
   *
   * Standard main-sequence stellar photospheres follow Rayleigh-Jeans tails:
   * (W1 - W3) ~ 0.0 to 0.15, (W3 - W4) ~ 0.0 to 0.2.
   * Strong infrared excess with W1 - W3 > 1.2 and W3 - W4 > 1.0 on a mature star (Teff > 4500K)
   * indicates large dust or artificial structures absorbing ~10-80% of stellar luminosity.
   */
  public static evaluateInfraredExcess(photo: InfraredPhotometry): AnomalyEvaluation {
    const w1w3 = photo.w1Mag - photo.w3Mag;
    const w3w4 = photo.w3Mag - photo.w4Mag;

    // Normal main sequence expectation
    const expectedW1W3 = 0.05;
    const sigmaExcess = (w1w3 - expectedW1W3) / 0.18;

    const isMatureStar = photo.teff >= 4200;
    const isMajorExcess = w1w3 > 1.35 && w3w4 > 1.1;
    const isModerateExcess = w1w3 > 0.65 || w3w4 > 0.6;

    let anomalyType: AnomalyEvaluation['anomalyType'] = 'STELLAR_EQUILIBRIUM';
    let priority: AnomalyEvaluation['threatOrPriority'] = 'NOMINAL';
    let confidenceScore = 8.5;
    let recommendation = 'Standard survey monitoring. Photosphere within expected stellar blackbody curve.';

    if (isMajorExcess && isMatureStar) {
      anomalyType = 'DYSON_SPHERE_CANDIDATE';
      priority = 'CRITICAL';
      confidenceScore = Math.min(99.4, Math.max(88.0, 75 + sigmaExcess * 3.5));
      recommendation =
        'FLAGGED MEGASTRUCTURE CANDIDATE: Extreme mid-IR excess without known protostellar context. Trigger priority high-resolution spectroscopic follow-up (JWST MIRI/NIRSpec & Keck HIRES).';
    } else if (isModerateExcess) {
      anomalyType = 'WARM_DEBRIS_DISK';
      priority = 'ELEVATED';
      confidenceScore = Math.min(84.0, Math.max(50.0, 45 + sigmaExcess * 2.8));
      recommendation =
        'Anomalous circumprimary dust or collision cascade debris. Schedule ALMA sub-millimeter continuum mapping.';
    }

    return {
      anomalyType,
      confidenceScore: Number(confidenceScore.toFixed(1)),
      threatOrPriority: priority,
      metrics: {
        w1Mag: photo.w1Mag,
        w2Mag: photo.w2Mag,
        w3Mag: photo.w3Mag,
        w4Mag: photo.w4Mag,
        w1w3Index: Number(w1w3.toFixed(3)),
        w3w4Index: Number(w3w4.toFixed(3)),
        teffK: photo.teff,
        excessSigma: Number(sigmaExcess.toFixed(2)),
      },
      flags: {
        w1w3Excess: Number(w1w3.toFixed(3)),
        w3w4Excess: Number(w3w4.toFixed(3)),
        nonStandardBlackbody: isMajorExcess || isModerateExcess,
      },
      recommendation,
    };
  }

  /**
   * Evaluates candidate radio signals for artificial technosignature characteristics
   * compliant with Breakthrough Listen protocols (narrow-band emissions with Doppler drift).
   */
  public static evaluateRadioSignal(
    bandwidthHz: number,
    driftRateHzS: number,
    snr: number,
    centerFreqMhz = 1420.405 // Hydrogen 21cm line default
  ): AnomalyEvaluation {
    // Natural astrophysical sources (pulsars, quasars, masers) are broad (> tens of Hz).
    // Engineered transmitters concentrate power into narrow channels <= 5 Hz.
    const isNarrowband = bandwidthHz <= 5.0;

    // Transmitters on rotating planets or orbiting craft exhibit Doppler drift:
    // Typical |df/dt| = 0.01 to 10.0 Hz/s. Zero drift usually means terrestrial RFI!
    const absDrift = Math.abs(driftRateHzS);
    const hasAcceleratingDoppler = absDrift >= 0.015 && absDrift <= 9.5;
    const hasHighSnr = snr >= 10.0;

    const isTechnoCandidate = isNarrowband && hasAcceleratingDoppler && hasHighSnr;

    if (isTechnoCandidate) {
      return {
        anomalyType: 'TECHNO_SIGNATURE_NARROWBAND',
        confidenceScore: Number(Math.min(98.8, 80 + (snr / 25) * 12).toFixed(1)),
        threatOrPriority: 'CRITICAL',
        metrics: {
          bandwidthHz,
          driftRateHzS,
          snr,
          centerFreqMhz,
          signalType: 'CARRIER_WITH_MODULATION',
        },
        flags: {
          w1w3Excess: 0,
          w3w4Excess: 0,
          nonStandardBlackbody: false,
          narrowbandVerified: true,
          dopplerDriftDetected: true,
        },
        recommendation:
          'UNCLASSIFIED ARTIFICIAL TRANSMISSION: Narrowband carrier with continuous topocentric Doppler shift. Initiate verification with secondary radio arrays (VLA / MeerKAT / Parkes).',
      };
    }

    const isTerrestrialRfi = isNarrowband && absDrift < 0.01;

    return {
      anomalyType: 'NATURAL_RADIO_EMISSION',
      confidenceScore: isTerrestrialRfi ? 42.0 : 15.0,
      threatOrPriority: isTerrestrialRfi ? 'MONITOR' : 'NOMINAL',
      metrics: {
        bandwidthHz,
        driftRateHzS,
        snr,
        centerFreqMhz,
        classification: isTerrestrialRfi ? 'SUSPECTED_LOCAL_RFI' : 'ASTROPHYSICAL_BROADBAND',
      },
      flags: {
        w1w3Excess: 0,
        w3w4Excess: 0,
        nonStandardBlackbody: false,
        narrowbandVerified: isNarrowband,
        dopplerDriftDetected: hasAcceleratingDoppler,
      },
      recommendation: isTerrestrialRfi
        ? 'Zero Doppler acceleration detected. Consistent with local ground or satellite RFI. Nulling applied.'
        : 'Broadband natural dispersion. Consistent with interstellar plasma or distant pulsar beam.',
    };
  }

  /**
   * Evaluates Gravitational Microlensing event parameters (Paczyński curve fit)
   */
  public static evaluateMicrolensing(
    peakMagnificationA0: number,
    einsteinCrossingTimeDays: number,
    hasCausticCrossing: boolean
  ): AnomalyEvaluation {
    const isExoticLensing = peakMagnificationA0 > 50.0 || hasCausticCrossing;

    return {
      anomalyType: 'GRAVITATIONAL_MICROLENSING',
      confidenceScore: Number(Math.min(97.0, 60 + peakMagnificationA0 * 0.4).toFixed(1)),
      threatOrPriority: isExoticLensing ? 'ELEVATED' : 'MONITOR',
      metrics: {
        peakMagnificationA0,
        einsteinCrossingTimeDays,
        causticCrossingAnomaly: hasCausticCrossing,
        lensMassEstimate: hasCausticCrossing ? 'BINARY_OR_PLANETARY_SYSTEM' : 'ISOLATED_COMPACT_OBJECT',
      },
      flags: {
        w1w3Excess: 0,
        w3w4Excess: 0,
        nonStandardBlackbody: false,
      },
      recommendation: hasCausticCrossing
        ? 'Secondary caustic spike detected: High probability of exoplanet or primordial black hole in lens plane. Trigger continuous photometric cadence.'
        : 'Symmetric Paczyński curve: Routine stellar-mass compact lens passing line of sight.',
    };
  }
}
