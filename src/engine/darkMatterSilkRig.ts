/**
 * Dark Matter NFW (Navarro-Frenk-White) & Gravitational Lensing Caustic Silk Rig
 * 
 * Replaces harsh neon grids with a clean, translucent white geodesic silk mesh
 * visualizing:
 * 1. Invisible Dark Matter NFW Halos: rho(r) = rho_0 / [ (r/r_s) * (1 + r/r_s)^2 ]
 * 2. Gravitational Lensing Caustics: where optical magnification mu -> infty
 * 3. Dark Energy Hubble Expansion Vectors: v = H_0 * r (67.4 km/s/Mpc)
 */

import * as THREE from 'three';

export interface DarkMatterPhysicsMetrics {
  scaleRadiusRsKpc: number;
  concentrationParam: number;
  virialMassM200Msun: string;
  centralDensityRho0: string;
  hubbleExpansionKmS: number;
  lensingMagnificationMuPeak: number;
}

export interface DarkMatterSilkRig {
  group: THREE.Group;
  silkMesh: THREE.Mesh | THREE.LineSegments;
  haloContours: THREE.LineSegments;
  expansionVectors: THREE.LineSegments;
  update: (delta: number) => void;
  dispose: () => void;
  setVisible: (visible: boolean) => void;
  getPhysicsMetrics: () => DarkMatterPhysicsMetrics;
}

/**
 * Calculates NFW Dark Matter Density profile
 * rho(r) = rho_0 / ( (r/r_s) * (1 + r/r_s)^2 )
 */
export function calculateNfwDensity(rKpc: number, rsKpc = 20, rho0MsunKpc3 = 1.2e7): number {
  if (rKpc <= 0.001) return rho0MsunKpc3;
  const x = rKpc / rsKpc;
  return rho0MsunKpc3 / (x * Math.pow(1 + x, 2));
}

/**
 * Calculates Hubble expansion velocity at distance d (Mpc)
 * v = H_0 * d
 */
export function calculateHubbleVelocity(distMpc: number, H0 = 67.4): number {
  return H0 * distMpc;
}

/**
 * Builds the clean, translucent white geodesic silk mesh and dark matter halo rig.
 * @param scale 'SPIRAL_GALAXY' | 'LOCAL_GROUP' | 'LANIAKEA_WEB'
 */
export function buildDarkMatterSilkRig(scale: string): DarkMatterSilkRig {
  const group = new THREE.Group();
  group.name = `DM_SILK_RIG_${scale}`;

  let silkMesh: THREE.Mesh | THREE.LineSegments;
  let haloContours: THREE.LineSegments;
  let expansionVectors: THREE.LineSegments;

  // 1. Geodesic Silk Caustic Surface (Clean translucent white, low opacity)
  if (scale === 'LANIAKEA_WEB') {
    // Large-scale cosmic sheet with gentle ripples
    const geom = new THREE.IcosahedronGeometry(280, 4);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Gentle NFW filament warp
      const ripple = 1.0 + 0.12 * Math.sin(x * 0.015) * Math.cos(z * 0.015);
      pos.setXYZ(i, x * ripple, y * 0.5 * ripple, z * ripple);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc, // Clean silk white
      wireframe: true,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
    });
    silkMesh = new THREE.Mesh(geom, mat);
    group.add(silkMesh);

    // Hubble outward expansion radial vectors
    const vectorPositions: number[] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rStart = 160 + Math.random() * 40;
      const rEnd = rStart + 55;

      const x1 = rStart * Math.sin(phi) * Math.cos(theta);
      const y1 = rStart * Math.cos(phi) * 0.4;
      const z1 = rStart * Math.sin(phi) * Math.sin(theta);

      const x2 = rEnd * Math.sin(phi) * Math.cos(theta);
      const y2 = rEnd * Math.cos(phi) * 0.4;
      const z2 = rEnd * Math.sin(phi) * Math.sin(theta);

      vectorPositions.push(x1, y1, z1, x2, y2, z2);
    }

    const vecGeom = new THREE.BufferGeometry();
    vecGeom.setAttribute('position', new THREE.Float32BufferAttribute(vectorPositions, 3));
    const vecMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
    });
    expansionVectors = new THREE.LineSegments(vecGeom, vecMat);
    group.add(expansionVectors);

    // Concentric caustic lensing contour loops
    const contourPositions: number[] = [];
    [90, 160, 240].forEach((r) => {
      const segs = 64;
      for (let s = 0; s < segs; s++) {
        const a1 = (s / segs) * Math.PI * 2;
        const a2 = ((s + 1) / segs) * Math.PI * 2;
        contourPositions.push(
          Math.cos(a1) * r, Math.sin(a1 * 3) * 6, Math.sin(a1) * r,
          Math.cos(a2) * r, Math.sin(a2 * 3) * 6, Math.sin(a2) * r
        );
      }
    });

    const contGeom = new THREE.BufferGeometry();
    contGeom.setAttribute('position', new THREE.Float32BufferAttribute(contourPositions, 3));
    const contMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    });
    haloContours = new THREE.LineSegments(contGeom, contMat);
    group.add(haloContours);

  } else if (scale === 'LOCAL_GROUP') {
    // Interlocking NFW halos for Milky Way and Andromeda
    const mwGeom = new THREE.IcosahedronGeometry(110, 3);
    const m31Geom = new THREE.IcosahedronGeometry(130, 3);
    m31Geom.translate(220, 45, -140);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });

    const mwMesh = new THREE.Mesh(mwGeom, mat);
    const m31Mesh = new THREE.Mesh(m31Geom, mat);
    const localGroupSilkGroup = new THREE.Group();
    localGroupSilkGroup.add(mwMesh);
    localGroupSilkGroup.add(m31Mesh);
    silkMesh = mwMesh; // primary ref
    group.add(localGroupSilkGroup);

    // Caustic bridge filaments connecting MW <-> M31 and M33
    const bridgePositions: number[] = [];
    const samples = 48;
    for (let s = 0; s < samples; s++) {
      const t1 = s / samples;
      const t2 = (s + 1) / samples;
      // Arc between MW (0,0,0) and M31 (220, 45, -140)
      const h1 = Math.sin(t1 * Math.PI) * 28;
      const h2 = Math.sin(t2 * Math.PI) * 28;
      bridgePositions.push(
        220 * t1, 45 * t1 + h1, -140 * t1,
        220 * t2, 45 * t2 + h2, -140 * t2
      );
      // Arc between MW (0,0,0) and M33 (-150, -35, 110)
      bridgePositions.push(
        -150 * t1, -35 * t1 + h1 * 0.7, 110 * t1,
        -150 * t2, -35 * t2 + h2 * 0.7, 110 * t2
      );
    }

    const bridgeGeom = new THREE.BufferGeometry();
    bridgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(bridgePositions, 3));
    const bridgeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
    });
    haloContours = new THREE.LineSegments(bridgeGeom, bridgeMat);
    group.add(haloContours);

    // Hubble flow vectors away from Local Group barycenter
    const flowPositions: number[] = [];
    for (let i = 0; i < 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      const r1 = 260;
      const r2 = 320;
      flowPositions.push(
        Math.cos(theta) * r1, (Math.random() - 0.5) * 40, Math.sin(theta) * r1,
        Math.cos(theta) * r2, (Math.random() - 0.5) * 55, Math.sin(theta) * r2
      );
    }
    const flowGeom = new THREE.BufferGeometry();
    flowGeom.setAttribute('position', new THREE.Float32BufferAttribute(flowPositions, 3));
    const flowMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });
    expansionVectors = new THREE.LineSegments(flowGeom, flowMat);
    group.add(expansionVectors);

  } else {
    // Default: SPIRAL_GALAXY (Milky Way NFW Virial Ellipsoid)
    const haloGeom = new THREE.IcosahedronGeometry(180, 4);
    // Flatten into oblate spheroid (c/a ~ 0.8) as modeled for Milky Way DM halo
    const pos = haloGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setY(i, y * 0.75);
    }
    haloGeom.computeVertexNormals();

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    silkMesh = new THREE.Mesh(haloGeom, haloMat);
    group.add(silkMesh);

    // Concentric gravitational lensing caustics (Einstein ring boundary at theta_E)
    const causticPositions: number[] = [];
    [50, 110, 175].forEach((r) => {
      const segs = 64;
      for (let s = 0; s < segs; s++) {
        const a1 = (s / segs) * Math.PI * 2;
        const a2 = ((s + 1) / segs) * Math.PI * 2;
        causticPositions.push(
          Math.cos(a1) * r, 0, Math.sin(a1) * r,
          Math.cos(a2) * r, 0, Math.sin(a2) * r
        );
      }
    });

    const causticGeom = new THREE.BufferGeometry();
    causticGeom.setAttribute('position', new THREE.Float32BufferAttribute(causticPositions, 3));
    const causticMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    haloContours = new THREE.LineSegments(causticGeom, causticMat);
    group.add(haloContours);

    // Radial gradient vectors
    const radPositions: number[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      radPositions.push(
        Math.cos(angle) * 40, 0, Math.sin(angle) * 40,
        Math.cos(angle) * 190, 0, Math.sin(angle) * 190
      );
    }
    const radGeom = new THREE.BufferGeometry();
    radGeom.setAttribute('position', new THREE.Float32BufferAttribute(radPositions, 3));
    const radMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    });
    expansionVectors = new THREE.LineSegments(radGeom, radMat);
    group.add(expansionVectors);
  }

  let time = 0;

  return {
    group,
    silkMesh,
    haloContours,
    expansionVectors,
    update: (delta: number) => {
      time += delta;
      // Gentle breathing pulse representing dark matter gravitational potential oscillation
      const pulse = 1.0 + Math.sin(time * 0.8) * 0.015;
      group.scale.set(pulse, pulse, pulse);
      group.rotation.y += delta * 0.003;
    },
    dispose: () => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    },
    setVisible: (visible: boolean) => {
      group.visible = visible;
    },
    getPhysicsMetrics: (): DarkMatterPhysicsMetrics => {
      return {
        scaleRadiusRsKpc: 20.0,
        concentrationParam: 12.4,
        virialMassM200Msun: '1.45 × 10¹² M☉',
        centralDensityRho0: '1.24 × 10⁷ M☉/kpc³',
        hubbleExpansionKmS: 67.4,
        lensingMagnificationMuPeak: 18.6,
      };
    },
  };
}
