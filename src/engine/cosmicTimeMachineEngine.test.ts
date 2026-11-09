import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateHubbleAtZ,
  calculateLookbackTimeGyr,
  calculateWavelengthShift,
  dewarpLensedCoordinate,
  COSMIC_EPOCHS,
} from './cosmicTimeMachineEngine';

describe('cosmicTimeMachineEngine', () => {
  it('calculates expansion rate H(z) monotonically increasing with redshift', () => {
    const h0 = calculateHubbleAtZ(0);
    const h2 = calculateHubbleAtZ(2);
    const h8 = calculateHubbleAtZ(8.5);

    assert.ok(Math.abs(h0 - 67.4) < 0.1, 'H(0) should equal H0');
    assert.ok(h2 > h0, 'H(2) must be greater than H(0)');
    assert.ok(h8 > h2, 'H(8.5) must be greater than H(2)');
  });

  it('calculates lookback time matching cosmological benchmarks', () => {
    const t0 = calculateLookbackTimeGyr(0);
    const t2 = calculateLookbackTimeGyr(2);
    const t8 = calculateLookbackTimeGyr(8.5);
    const t1100 = calculateLookbackTimeGyr(1100);

    assert.strictEqual(t0, 0);
    assert.ok(t2 > 10.0 && t2 < 11.0, `t(z=2) should be ~10.4 Gyr, got ${t2}`);
    assert.ok(t8 > 13.0 && t8 < 13.3, `t(z=8.5) should be ~13.1 Gyr, got ${t8}`);
    assert.ok(t1100 > 13.7, `t(z=1100) should approach 13.78 Gyr, got ${t1100}`);
  });

  it('correctly shifts rest-frame wavelengths into infrared bands', () => {
    // Lyman-alpha (121.6 nm) at z = 8.5
    const lya = calculateWavelengthShift(121.6, 8.5);
    assert.ok(Math.abs(lya.observedWavelengthNm - 1155.2) < 1.0);
    assert.strictEqual(lya.observedBandName, 'Near-Infrared (NIR)');
    assert.strictEqual(lya.jwstInstrument, 'JWST NIRCam / NIRSpec');

    // H-alpha (656.3 nm) at z = 8.5
    const halpha = calculateWavelengthShift(656.3, 8.5);
    assert.ok(Math.abs(halpha.observedWavelengthNm - 6234.8) < 2.0);
    assert.strictEqual(halpha.observedBandName, 'Mid-Infrared (MIR)');
    assert.strictEqual(halpha.jwstInstrument, 'JWST MIRI (Mid-Infrared Instrument)');
  });

  it('solves gravitational lens equation and de-warps coordinates to source plane', () => {
    const thetaX = 18.0;
    const thetaY = 0.0;
    const thetaE = 15.0;

    // At dewarpFactor = 0 (fully warped)
    const warped = dewarpLensedCoordinate(thetaX, thetaY, thetaE, 0);
    assert.strictEqual(warped.x, 18.0);
    assert.strictEqual(warped.y, 0.0);

    // At dewarpFactor = 1 (fully reconstructed pristine source)
    const unwarped = dewarpLensedCoordinate(thetaX, thetaY, thetaE, 1);
    assert.ok(unwarped.x < 18.0, 'Pristine unwarped source should be closer to optic axis beta');
  });

  it('contains 5 definitive epochs with rich narration from Einstein and Sagan', () => {
    assert.strictEqual(COSMIC_EPOCHS.length, 5);
    COSMIC_EPOCHS.forEach((epoch) => {
      assert.ok(epoch.name);
      assert.ok(epoch.einsteinNarration.length > 50);
      assert.ok(epoch.saganNarration.length > 50);
      assert.ok(epoch.primaryFeatures.length >= 3);
    });
  });
});
