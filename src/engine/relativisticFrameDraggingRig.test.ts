import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateLenseThirringOmega,
  calculateErgosphereRadius,
  buildRelativisticFrameDraggingRig,
} from './relativisticFrameDraggingRig';

describe('Relativistic Frame-Dragging Engine (Lense-Thirring)', () => {
  it('computes positive frame-dragging angular velocity Omega_LT which decays with radius', () => {
    const omegaInner = calculateLenseThirringOmega(2.0, 0.94, 21.0);
    const omegaOuter = calculateLenseThirringOmega(10.0, 0.94, 21.0);

    assert.ok(omegaInner > 0, 'Inner frame-dragging angular velocity must be strictly positive');
    assert.ok(omegaOuter > 0, 'Outer frame-dragging angular velocity must be strictly positive');
    assert.ok(
      omegaInner > omegaOuter,
      'Inner frame-dragging angular velocity must exceed outer due to inverse cubic/polynomial falloff'
    );
  });

  it('calculates ergosphere radius correctly as a function of polar angle theta', () => {
    // At equator (theta = pi/2, cos(theta) = 0), r_E = M * (1 + 1) = 2M
    const ergoEquator = calculateErgosphereRadius(Math.PI / 2, 0.94, 1.0);
    assert.strictEqual(Math.round(ergoEquator), 2, 'Equatorial ergosphere radius should equal 2M');

    // At poles (theta = 0, cos(theta) = 1), r_E = M * (1 + sqrt(1 - a^2))
    const ergoPole = calculateErgosphereRadius(0, 0.94, 1.0);
    assert.ok(ergoPole < ergoEquator, 'Polar ergosphere radius must be strictly smaller than equatorial radius');
  });

  it('builds the Three.js relativistic frame-dragging rig and initializes all sub-components', () => {
    const rig = buildRelativisticFrameDraggingRig([0, 0, 0], 1.0);

    assert.ok(rig.group, 'Rig must create a main Three.js Group');
    assert.ok(rig.gridLineSegments, 'Rig must provide dynamic distorted grid line segments');
    assert.ok(rig.ergosphereMesh, 'Rig must provide Kerr ergosphere mesh');
    assert.ok(rig.eventHorizonMesh, 'Rig must provide event horizon core mesh');
    assert.ok(rig.primaryStarMesh, 'Rig must provide primary compact star mesh');
    assert.ok(rig.secondaryStarMesh, 'Rig must provide secondary companion star mesh');
    assert.ok(rig.vectorFieldMesh, 'Rig must provide Lense-Thirring vector flow field');

    const metrics = rig.getPhysicsMetrics();
    assert.ok(metrics.kerrSpinParam >= 0.9 && metrics.kerrSpinParam < 1.0);
    assert.ok(metrics.lenseThirringVelocityRadS > 0);
    assert.strictEqual(metrics.frameDraggingActive, true);

    // Test animation update without error
    rig.update(0.016);
    rig.update(0.033);

    // Test disposal
    assert.doesNotThrow(() => {
      rig.dispose();
    });
  });
});
