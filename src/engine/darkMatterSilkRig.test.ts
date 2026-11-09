import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateNfwDensity,
  calculateHubbleVelocity,
  buildDarkMatterSilkRig,
} from './darkMatterSilkRig';

describe('darkMatterSilkRig Engine', () => {
  it('calculates NFW dark matter density obeying 1/(r*(1+r)^2) decay', () => {
    const rhoInner = calculateNfwDensity(5, 20);
    const rhoScale = calculateNfwDensity(20, 20);
    const rhoOuter = calculateNfwDensity(100, 20);

    assert.ok(rhoInner > rhoScale, 'Inner density must be higher than scale radius density');
    assert.ok(rhoScale > rhoOuter, 'Scale radius density must be higher than virial radius density');
    assert.strictEqual(calculateHubbleVelocity(10, 67.4), 674);
  });

  it('builds Dark Matter silk rigs for all 3 scales with valid Three.js geometry', () => {
    const scales = ['SPIRAL_GALAXY', 'LOCAL_GROUP', 'LANIAKEA_WEB'];
    scales.forEach((scale) => {
      const rig = buildDarkMatterSilkRig(scale);
      assert.ok(rig.group, `Rig group must exist for scale ${scale}`);
      assert.ok(rig.silkMesh, `Silk mesh must exist for scale ${scale}`);
      assert.ok(rig.haloContours, `Halo contours must exist for scale ${scale}`);
      assert.ok(rig.expansionVectors, `Expansion vectors must exist for scale ${scale}`);

      const metrics = rig.getPhysicsMetrics();
      assert.strictEqual(metrics.scaleRadiusRsKpc, 20);
      assert.strictEqual(metrics.hubbleExpansionKmS, 67.4);

      // Verify update doesn't throw
      rig.update(0.016);
      rig.setVisible(false);
      assert.strictEqual(rig.group.visible, false);
      rig.dispose();
    });
  });
});
