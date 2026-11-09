import { describe, it } from 'node:test';
import assert from 'node:assert';
import { citizenRegistry } from './citizenRegistry.ts';

describe('CitizenRegistry and Relativistic Probe Physics', () => {
  it('correctly calculates relativistic Lorentz factor and time dilation', () => {
    // Distance to Proxima Centauri: ~4.246 ly
    const telemetry = citizenRegistry.calculateRelativisticFlight(4.246);

    // At 0.20c: γ ≈ 1.0206
    assert.strictEqual(telemetry.beta02, 0.2);
    assert.ok(Math.abs(telemetry.gamma02 - 1.0206) < 0.005);
    // Earth time: 4.246 / 0.2 = 21.23 years
    assert.ok(Math.abs(telemetry.travelTimeEarth02Years - 21.23) < 0.1);
    // Ship proper time should be strictly less than Earth time
    assert.ok(telemetry.travelTimeShip02Years < telemetry.travelTimeEarth02Years);

    // At 0.85c: γ ≈ 1.8983
    assert.strictEqual(telemetry.beta085, 0.85);
    assert.ok(Math.abs(telemetry.gamma085 - 1.8983) < 0.005);
    // Earth time: 4.246 / 0.85 = ~5.00 years
    assert.ok(Math.abs(telemetry.travelTimeEarth085Years - 5.0) < 0.1);
    // Ship time: 5.00 / 1.8983 ≈ 2.63 years
    assert.ok(Math.abs(telemetry.travelTimeShip085Years - 2.63) < 0.15);
  });

  it('updates Commander Callsign and persists to store', () => {
    citizenRegistry.setCallsign('CMD-ORION-7');
    assert.strictEqual(citizenRegistry.getCallsign(), 'CMD-ORION-7');
  });

  it('inserts newly minted discovery at rank #1 and updates active preprint', () => {
    citizenRegistry.setCallsign('CMD-TESTER-X');
    const entry = citizenRegistry.mintAndPublishDiscovery({
      targetId: 'TIC-NEW-DISCOVERY',
      type: 'NARROWBAND RADIO ANOMALY',
      certifiedScore: 99.4,
      sha256Seal: 'SHA256: 1234567890abcdef1234567890abcdef1234567890abcdef',
      distanceLy: 42.5,
      spectralType: 'F5V',
    });

    const leaderboard = citizenRegistry.getLeaderboard();
    assert.strictEqual(leaderboard[0].target, 'TIC-NEW-DISCOVERY');
    assert.strictEqual(leaderboard[0].rank, 1);
    assert.strictEqual(leaderboard[0].observer, 'CMD-TESTER-X');

    const preprint = citizenRegistry.getActivePreprint();
    assert.ok(preprint);
    assert.strictEqual(preprint?.targetId, 'TIC-NEW-DISCOVERY');
    assert.strictEqual(preprint?.observer, 'CMD-TESTER-X');
  });
});
