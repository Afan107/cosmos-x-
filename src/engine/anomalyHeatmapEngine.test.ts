import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatRaSexagesimal,
  formatDecSexagesimal,
  equatorialToGalactic,
  computeTechnosignatureWeight,
  buildCelestialHeatmapDataset,
  TECHNOSIGNATURE_HOTSPOTS,
} from './anomalyHeatmapEngine';

describe('Anomaly Heatmap Engine', () => {
  it('formats Right Ascension in sexagesimal notation correctly', () => {
    // 0 deg = 00h 00m 00.0s
    assert.strictEqual(formatRaSexagesimal(0), '00h 00m 00.0s');
    // 180 deg = 12h 00m 00.0s
    assert.strictEqual(formatRaSexagesimal(180), '12h 00m 00.0s');
    // 84.152 deg
    const formatted = formatRaSexagesimal(84.152);
    assert.ok(formatted.startsWith('05h 36m'));
  });

  it('formats Declination in sexagesimal notation with correct sign', () => {
    assert.strictEqual(formatDecSexagesimal(0), '+00° 00\' 00"');
    assert.ok(formatDecSexagesimal(45.5).startsWith('+45° 30\''));
    assert.ok(formatDecSexagesimal(-69.214).startsWith('-69° 12\''));
  });

  it('converts Equatorial coordinates to Galactic coordinates correctly', () => {
    // North Galactic Pole: RA = 192.86°, Dec = 27.13° -> b ~ 90°
    const ngp = equatorialToGalactic(192.859, 27.128);
    assert.ok(Math.abs(ngp.b - 90) < 0.1, `Expected b ~ 90°, got ${ngp.b}°`);

    // Galactic Center (Sagittarius A*): RA = 266.417°, Dec = -29.008° -> l ~ 0° or 360°, b ~ 0°
    const sgrA = equatorialToGalactic(266.417, -29.008);
    assert.ok(Math.abs(sgrA.b) < 1.0, `Expected b ~ 0°, got ${sgrA.b}°`);
    assert.ok(sgrA.l < 2.0 || sgrA.l > 358.0, `Expected l ~ 0°/360°, got ${sgrA.l}°`);
  });

  it('computes elevated technosignature weights for high-confidence critical anomalies', () => {
    const ambientWeight = computeTechnosignatureWeight(0, 'NOMINAL', 'SURVEY_BASELINE');
    const elevatedWeight = computeTechnosignatureWeight(85.0, 'ELEVATED', 'EXTREME_TRANSIT');
    const criticalDysonWeight = computeTechnosignatureWeight(96.4, 'CRITICAL', 'DYSON_SPHERE');

    assert.ok(criticalDysonWeight > elevatedWeight, 'Critical Dyson sphere should have higher weight than elevated transit');
    assert.ok(elevatedWeight > ambientWeight, 'Elevated transit should have higher weight than ambient baseline');
    assert.ok(criticalDysonWeight > 20, 'Critical technosignature weight should be substantial');
  });

  it('builds unified celestial dataset with stars, technosignature clusters, and ambient baseline', () => {
    const dataset = buildCelestialHeatmapDataset();

    assert.ok(dataset.length > 400, 'Dataset should contain hundreds of celestial points');

    const dysonTarget = dataset.find((p) => p.id === 'TIC-25155310');
    assert.ok(dysonTarget, 'TIC-25155310 should exist in dataset');
    assert.strictEqual(dysonTarget.isAnomaly, true);
    assert.strictEqual(dysonTarget.category, 'DYSON_SPHERE');

    const proximaTarget = dataset.find((p) => p.id === 'Proxima-Centauri-b');
    assert.ok(proximaTarget, 'Proxima-Centauri-b should exist in dataset');
    assert.strictEqual(proximaTarget.category, 'RADIO_TECHNOSIGNATURE');

    // Check hotspot definitions
    assert.ok(TECHNOSIGNATURE_HOTSPOTS.length >= 5, 'Should define at least 5 technosignature hotspots');
  });
});
