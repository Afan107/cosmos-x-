/**
 * Anomaly Heatmap Engine for D3 Celestial Density Visualizations
 *
 * Provides astronomical coordinate transformations (Equatorial RA/Dec to Galactic l/b),
 * technosignature probability weighting, 2D Kernel Density Estimation (KDE) preprocessing,
 * and high-probability technosignature cluster identification.
 */

import {
  CATALOG_STARS,
  CATALOG_ANOMALIES,
  CatalogTarget,
  CatalogAnomaly,
} from '../data/astronomicalCatalog';

export interface CelestialPoint {
  id: string;
  name: string;
  ra: number; // Right Ascension in decimal degrees (0 to 360)
  dec: number; // Declination in decimal degrees (-90 to +90)
  spectralClass: string;
  distanceLy: number;
  vMag: number;
  isAnomaly: boolean;
  anomalyId?: string;
  anomalyTitle?: string;
  category: 'DYSON_SPHERE' | 'RADIO_TECHNOSIGNATURE' | 'GRAVITATIONAL_MICROLENSING' | 'EXTREME_TRANSIT' | 'SURVEY_BASELINE';
  priority: 'CRITICAL' | 'ELEVATED' | 'MONITOR' | 'NOMINAL';
  confidencePct: number; // 0 to 100
  technoWeight: number; // Weighting factor for KDE heat contours (>= 0)
  sector: string;
  details?: string[];
  targetRef?: CatalogTarget;
  anomalyRef?: CatalogAnomaly;
}

export interface TechnosignatureHotspot {
  id: string;
  name: string;
  ra: number;
  dec: number;
  radiusDeg: number;
  peakConfidencePct: number;
  category: string;
  primaryTargetId: string;
  description: string;
  technoScore: number; // 0 to 100
}

/**
 * Converts Decimal Right Ascension to Sexagesimal (hh:mm:ss.s)
 */
export function formatRaSexagesimal(raDeg: number): string {
  const normRa = ((raDeg % 360) + 360) % 360;
  const totalHours = normRa / 15.0;
  const h = Math.floor(totalHours);
  const totalMinutes = (totalHours - h) * 60;
  const m = Math.floor(totalMinutes);
  const s = ((totalMinutes - m) * 60).toFixed(1);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`;
}

/**
 * Converts Decimal Declination to Sexagesimal (+-dd:mm:ss)
 */
export function formatDecSexagesimal(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const absDec = Math.abs(decDeg);
  const d = Math.floor(absDec);
  const totalMinutes = (absDec - d) * 60;
  const m = Math.floor(totalMinutes);
  const s = Math.round((totalMinutes - m) * 60);
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;
}

/**
 * Converts Equatorial (RA, Dec in degrees) to Galactic Coordinates (l, b in degrees)
 * Uses standard IAU J2000 galactic pole constants:
 * RA_G = 192.85948°, Dec_G = 27.12825°, l_0 = 32.93192°
 */
export function equatorialToGalactic(raDeg: number, decDeg: number): { l: number; b: number } {
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  const raRad = raDeg * deg2rad;
  const decRad = decDeg * deg2rad;

  const raGRad = 192.85948 * deg2rad;
  const decGRad = 27.12825 * deg2rad;
  const lNcpRad = 122.93192 * deg2rad;

  const sinB =
    Math.sin(decRad) * Math.sin(decGRad) +
    Math.cos(decRad) * Math.cos(decGRad) * Math.cos(raRad - raGRad);
  const bRad = Math.asin(Math.max(-1, Math.min(1, sinB)));

  const y = Math.cos(decRad) * Math.sin(raRad - raGRad);
  const x =
    Math.sin(decRad) * Math.cos(decGRad) -
    Math.cos(decRad) * Math.sin(decGRad) * Math.cos(raRad - raGRad);

  let lRad = lNcpRad - Math.atan2(y, x);
  let lDeg = (lRad * rad2deg) % 360;
  if (lDeg < 0) lDeg += 360;

  return {
    l: Number(lDeg.toFixed(3)),
    b: Number((bRad * rad2deg).toFixed(3)),
  };
}

/**
 * Computes Technosignature Density Weight based on anomaly category, confidence, and priority
 */
export function computeTechnosignatureWeight(
  confidencePct: number,
  priority: 'CRITICAL' | 'ELEVATED' | 'MONITOR' | 'NOMINAL',
  category: string
): number {
  if (confidencePct <= 0) return 0.05; // Ambient background survey density

  const confFactor = Math.pow(confidencePct / 100, 1.8);
  let priorityMultiplier = 1.0;
  if (priority === 'CRITICAL') priorityMultiplier = 4.8;
  else if (priority === 'ELEVATED') priorityMultiplier = 2.6;
  else if (priority === 'MONITOR') priorityMultiplier = 1.3;

  // Technosignatures (Dyson Spheres and Narrowband carriers) carry elevated significance
  let categoryMultiplier = 1.0;
  if (category === 'DYSON_SPHERE') categoryMultiplier = 1.45;
  if (category === 'RADIO_TECHNOSIGNATURE') categoryMultiplier = 1.35;
  if (category === 'EXTREME_TRANSIT') categoryMultiplier = 1.15;

  return Number((confFactor * priorityMultiplier * categoryMultiplier * 10).toFixed(2));
}

/**
 * Known High-Probability Technosignature Hotspots
 */
export const TECHNOSIGNATURE_HOTSPOTS: TechnosignatureHotspot[] = [
  {
    id: 'HOTSPOT-LMC-DYSON',
    name: 'LMC Mega-Engineering Cluster',
    ra: 84.152,
    dec: -69.214,
    radiusDeg: 8.5,
    peakConfidencePct: 96.4,
    category: 'DYSON_SPHERE',
    primaryTargetId: 'TIC-25155310',
    description: 'Significant 3.42σ infrared excess at 12 & 22 µm. Low-temperature waste heat (218 K) matching orbital Dyson swarm.',
    technoScore: 96,
  },
  {
    id: 'HOTSPOT-PROXIMA-BLC1',
    name: 'Alpha Centauri Radio Corridor',
    ra: 217.429,
    dec: -62.679,
    radiusDeg: 5.0,
    peakConfidencePct: 94.2,
    category: 'RADIO_TECHNOSIGNATURE',
    primaryTargetId: 'Proxima-Centauri-b',
    description: 'Monochromatic 1.8 Hz carrier at 1420.45 MHz exhibiting linear Doppler drift (-0.32 Hz/s) matching exoplanetary orbit.',
    technoScore: 94,
  },
  {
    id: 'HOTSPOT-CYGNUS-SWARM',
    name: 'Cygnus Variable Megastructure Zone',
    ra: 301.549,
    dec: 44.456,
    radiusDeg: 7.2,
    peakConfidencePct: 85.3,
    category: 'EXTREME_TRANSIT',
    primaryTargetId: 'KIC-8462852',
    description: 'Aperiodic multi-percent transit dips (up to 22%) and secular multi-decade dimming trend incompatible with spherical bodies.',
    technoScore: 85,
  },
  {
    id: 'HOTSPOT-FRB-CANCER',
    name: 'Northern Periodic Extragalactic Beacon',
    ra: 132.838,
    dec: 31.25,
    radiusDeg: 6.0,
    peakConfidencePct: 88.1,
    category: 'RADIO_TECHNOSIGNATURE',
    primaryTargetId: 'FRB-20261021A',
    description: '16.35-day repeating radio burst with extreme rotation measure (+8,420 rad/m²) traversing dense plasma.',
    technoScore: 88,
  },
  {
    id: 'HOTSPOT-BULGE-LENS',
    name: 'Galactic Bulge Caustic Crossing',
    ra: 269.592,
    dec: -29.02,
    radiusDeg: 6.5,
    peakConfidencePct: 74.0,
    category: 'GRAVITATIONAL_MICROLENSING',
    primaryTargetId: 'TIC-25155310',
    description: 'Extreme 84.2x gravitational magnification with anomalous caustic spike indicating sub-Earth planetary or compact companion.',
    technoScore: 74,
  },
  {
    id: 'HOTSPOT-CYG-X1-KERR',
    name: 'Cygnus X-1 Relativistic Binary Vortex',
    ra: 299.59,
    dec: 35.20,
    radiusDeg: 5.5,
    peakConfidencePct: 82.0,
    category: 'GRAVITATIONAL_MICROLENSING',
    primaryTargetId: 'CYG-X1-MASSIVE-BINARY',
    description: 'Extreme Lense-Thirring frame-dragging vortex around 21.2 M☉ Kerr black hole with spin parameter a* = 0.942.',
    technoScore: 82,
  },
];

/**
 * Builds the comprehensive unified dataset of celestial points for D3 heatmap projection
 */
export function buildCelestialHeatmapDataset(): CelestialPoint[] {
  const points: CelestialPoint[] = [];

  // 1. Process Star Catalog Entries
  CATALOG_STARS.forEach((star) => {
    const anomaly = CATALOG_ANOMALIES.find(
      (a) => a.id === star.primaryAnomaly || a.targetId === star.id
    );

    const isAnomaly = Boolean(anomaly || star.isDysonCandidate || star.isRadioSource);
    const category = anomaly?.category ?? (star.isDysonCandidate ? 'DYSON_SPHERE' : star.isRadioSource ? 'RADIO_TECHNOSIGNATURE' : 'SURVEY_BASELINE');
    const priority = anomaly?.priority ?? (isAnomaly ? 'ELEVATED' : 'NOMINAL');
    const confidencePct = anomaly?.confidencePct ?? (isAnomaly ? 70 : 0);
    const technoWeight = computeTechnosignatureWeight(confidencePct, priority, category);

    points.push({
      id: star.id,
      name: star.name,
      ra: star.ra,
      dec: star.dec,
      spectralClass: star.spectralType,
      distanceLy: star.distanceLy,
      vMag: star.vMag,
      isAnomaly,
      anomalyId: anomaly?.id,
      anomalyTitle: anomaly?.title,
      category,
      priority,
      confidencePct,
      technoWeight,
      sector: anomaly?.coordinates.sector ?? star.constellation,
      details: anomaly?.details,
      targetRef: star,
      anomalyRef: anomaly,
    });
  });

  // 2. High-Probability Technosignature Cluster Seed Points
  // Generate Gaussian cluster points around active anomaly centers to create authentic,
  // high-density heat contours across the celestial sphere
  TECHNOSIGNATURE_HOTSPOTS.forEach((hotspot) => {
    const clusterCount = Math.round(18 + (hotspot.peakConfidencePct / 100) * 24);
    for (let i = 0; i < clusterCount; i++) {
      // Box-Muller Gaussian jitter around hotspot center
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

      const scatter = hotspot.radiusDeg * 0.45;
      const raJitter = hotspot.ra + z0 * scatter;
      const decJitter = Math.max(-89.5, Math.min(89.5, hotspot.dec + z1 * scatter));

      const radialDist = Math.sqrt(z0 * z0 + z1 * z1);
      const confDropoff = Math.max(
        15,
        Math.round(hotspot.peakConfidencePct * Math.exp(-0.5 * Math.pow(radialDist / 1.5, 2)))
      );

      points.push({
        id: `${hotspot.id}-SIG-${i}`,
        name: `${hotspot.name} Sector Node ${i + 1}`,
        ra: ((raJitter % 360) + 360) % 360,
        dec: decJitter,
        spectralClass: i % 2 === 0 ? 'G-Dwarf Sector' : 'M-Dwarf Probe',
        distanceLy: Math.round(100 + Math.random() * 2400),
        vMag: Number((11.0 + Math.random() * 3.5).toFixed(1)),
        isAnomaly: true,
        category: hotspot.category as any,
        priority: confDropoff > 80 ? 'CRITICAL' : confDropoff > 50 ? 'ELEVATED' : 'MONITOR',
        confidencePct: confDropoff,
        technoWeight: computeTechnosignatureWeight(confDropoff, confDropoff > 80 ? 'CRITICAL' : 'ELEVATED', hotspot.category),
        sector: hotspot.name,
        details: [
          `Sub-beam sensor correlation: ${confDropoff}% confidence`,
          `Observed frequency drift: ${(-0.15 * Math.random()).toFixed(3)} Hz/s`,
          `Signal coherence baseline: ${(0.82 + Math.random() * 0.16).toFixed(3)}`,
        ],
      });
    }
  });

  // 3. Ambient Celestial Survey Baseline (Gaia DR3 / Kepler / TESS deep-sky field)
  // Uniform pseudorandom distribution across RA [0, 360) and Dec [-90, +90] (weighted by cos(dec))
  const ambientCount = 380;
  for (let s = 0; s < ambientCount; s++) {
    const ra = Math.random() * 360;
    // Cosine distribution for spherical declination
    const sinDec = 2.0 * Math.random() - 1.0;
    const dec = (Math.asin(sinDec) * 180) / Math.PI;

    // Galactic coordinate check
    const gal = equatorialToGalactic(ra, dec);
    const nearGalacticPlane = Math.abs(gal.b) < 14;

    const spectralTypes = ['M4V Red Dwarf', 'K2V Orange Dwarf', 'G2V Solar Twin', 'F5V White', 'A0V Azure'];
    const spectral = spectralTypes[s % spectralTypes.length];

    points.push({
      id: `GAIA-DR3-${10000 + s}`,
      name: `GAIA DR3 ${41020000 + s}`,
      ra: Number(ra.toFixed(3)),
      dec: Number(dec.toFixed(3)),
      spectralClass: spectral,
      distanceLy: Math.round(45 + Math.random() * 3800),
      vMag: Number((8.5 + Math.random() * 6.5).toFixed(1)),
      isAnomaly: false,
      category: 'SURVEY_BASELINE',
      priority: 'NOMINAL',
      confidencePct: 0,
      technoWeight: nearGalacticPlane ? 0.08 : 0.04,
      sector: nearGalacticPlane ? 'Galactic Equator Belt' : 'Deep Celestial Sky',
    });
  }

  return points;
}
