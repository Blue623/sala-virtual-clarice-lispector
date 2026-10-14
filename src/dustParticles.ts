/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface DustMotesSystem {
  group: THREE.Group;
  points: THREE.Points;
  sunbeam: THREE.Mesh;
  update: (time: number) => void;
  setTimeOfDay: (mode: 'golden' | 'night' | 'day') => void;
  dispose: () => void;
}

/**
 * Creates a soft radial circular sprite texture for poetic dust motes.
 */
function createDustParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 245, 215, 0.85)');
  gradient.addColorStop(0.55, 'rgba(255, 225, 170, 0.3)');
  gradient.addColorStop(0.85, 'rgba(255, 210, 140, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 210, 140, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates the poetic dust particles and window sunbeam system for Clarice's study.
 */
export function createDustMotesSystem(particleCount: number = 420): DustMotesSystem {
  const group = new THREE.Group();
  group.name = 'poetic_dust_system';

  // 1. DUST PARTICLES (POINTS)
  const texture = createDustParticleTexture();

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const baseColors = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);
  const speeds = new Float32Array(particleCount);
  const scales = new Float32Array(particleCount);

  // Bounds of the study room where light shines through the window
  const minX = -2.2, maxX = 2.2;
  const minY = 0.5, maxY = 2.8;
  const minZ = -2.4, maxZ = 1.4;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Distribute with natural concentration in the central sunlit cone (from window to desk)
    const inBeam = Math.random() < 0.65;
    if (inBeam) {
      // Interpolate along beam path from window (0, 1.9, -2.5) to desk/sofa (0, 0.95, 0)
      const t = Math.random();
      const beamX = (Math.random() - 0.5) * (1.2 + t * 1.5);
      const beamY = 1.9 - t * 0.9 + (Math.random() - 0.5) * 0.6;
      const beamZ = -2.4 + t * 2.6 + (Math.random() - 0.5) * 0.6;

      positions[i3] = beamX;
      positions[i3 + 1] = beamY;
      positions[i3 + 2] = beamZ;
    } else {
      // General room ambient motes
      positions[i3] = minX + Math.random() * (maxX - minX);
      positions[i3 + 1] = minY + Math.random() * (maxY - minY);
      positions[i3 + 2] = minZ + Math.random() * (maxZ - minZ);
    }

    // Warm golden morning/afternoon dust color
    const brightness = 0.65 + Math.random() * 0.35;
    baseColors[i3] = 1.0 * brightness;      // R
    baseColors[i3 + 1] = 0.90 * brightness;  // G
    baseColors[i3 + 2] = 0.70 * brightness;  // B

    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.4 + Math.random() * 0.8;
    scales[i] = 0.6 + Math.random() * 0.9;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.048,
    map: texture,
    transparent: true,
    opacity: 0.82,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geometry, material);
  group.add(points);

  // 2. VOLUMETRIC SUNBEAM FROM WINDOW
  // A subtle translucent angled volumetric light cone coming from window panes down onto the desk
  const beamHeight = 3.2;
  const beamTopRadius = 0.45;
  const beamBottomRadius = 1.45;
  const beamGeo = new THREE.CylinderGeometry(beamTopRadius, beamBottomRadius, beamHeight, 32, 1, true);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe6a3,
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const sunbeam = new THREE.Mesh(beamGeo, beamMat);
  // Position beam from window top-center angling down towards desk
  sunbeam.position.set(0, 1.45, -1.1);
  sunbeam.rotation.x = Math.PI / 4.2; // ~42 degrees downward pitch
  group.add(sunbeam);

  // 3. SECONDARY COMPLEMENTARY SUNBEAM SLICE (Adds volumetric depth)
  const beamSliceGeo = new THREE.PlaneGeometry(2.4, 3.4);
  const beamSliceMat = new THREE.MeshBasicMaterial({
    color: 0xffd580,
    transparent: true,
    opacity: 0.038,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beamSlice = new THREE.Mesh(beamSliceGeo, beamSliceMat);
  beamSlice.position.set(0, 1.45, -1.1);
  beamSlice.rotation.x = Math.PI / 4.2;
  group.add(beamSlice);

  // Initial velocities stored for continuous gentle Brownian motion
  const initialPositions = new Float32Array(positions);

  // 4. ANIMATION UPDATE LOOP
  const update = (time: number) => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const phase = phases[i];
      const speed = speeds[i];

      // Gentle Brownian floating motion:
      // Vertical gentle buoyancy oscillation
      const dy = Math.sin(time * 0.45 * speed + phase) * 0.0016 + Math.cos(time * 0.2 + phase * 2.0) * 0.0008;
      // Gentle horizontal cross-breeze from window
      const dx = Math.cos(time * 0.35 * speed + phase * 1.3) * 0.0012;
      // Longitudinal swirl towards and away from desk
      const dz = Math.sin(time * 0.3 * speed + phase * 0.7) * 0.0014;

      posArr[i3] += dx;
      posArr[i3 + 1] += dy;
      posArr[i3 + 2] += dz;

      // Wrap boundaries gently so particles continuously float in the room
      if (posArr[i3] < minX) posArr[i3] = maxX;
      if (posArr[i3] > maxX) posArr[i3] = minX;
      if (posArr[i3 + 1] < minY) posArr[i3 + 1] = maxY;
      if (posArr[i3 + 1] > maxY) posArr[i3 + 1] = minY;
      if (posArr[i3 + 2] < minZ) posArr[i3 + 2] = maxZ;
      if (posArr[i3 + 2] > maxZ) posArr[i3 + 2] = minZ;
    }

    posAttr.needsUpdate = true;

    // Subtle breathing pulse on the sunbeam
    const beamPulse = 1.0 + Math.sin(time * 0.8) * 0.08;
    beamMat.opacity = 0.055 * beamPulse;
    beamSliceMat.opacity = 0.038 * beamPulse;
  };

  // 5. RESPOND TO ATMOSPHERIC LIGHTING (Hora Dourada / Madrugada / Dia)
  const setTimeOfDay = (mode: 'golden' | 'night' | 'day') => {
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const colArr = colorAttr.array as Float32Array;

    if (mode === 'golden') {
      // Warm amber / honey golden hour particles
      material.size = 0.048;
      material.opacity = 0.88;
      beamMat.color.setHex(0xffdfa8);
      beamMat.opacity = 0.058;
      beamSliceMat.color.setHex(0xffc570);
      beamSliceMat.opacity = 0.042;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const b = 0.7 + Math.random() * 0.3;
        colArr[i3] = 1.0 * b;     // warm gold
        colArr[i3 + 1] = 0.88 * b;
        colArr[i3 + 2] = 0.58 * b;
      }
    } else if (mode === 'night') {
      // Subtle silver-blue moonlight motes
      material.size = 0.036;
      material.opacity = 0.42;
      beamMat.color.setHex(0x38bdf8);
      beamMat.opacity = 0.018; // soft ethereal lunar shaft
      beamSliceMat.color.setHex(0x818cf8);
      beamSliceMat.opacity = 0.012;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const b = 0.5 + Math.random() * 0.3;
        colArr[i3] = 0.65 * b;    // silver-indigo
        colArr[i3 + 1] = 0.78 * b;
        colArr[i3 + 2] = 1.0 * b;
      }
    } else {
      // Radiant daylight white/azure particles
      material.size = 0.042;
      material.opacity = 0.75;
      beamMat.color.setHex(0xffffff);
      beamMat.opacity = 0.045;
      beamSliceMat.color.setHex(0xe0f2fe);
      beamSliceMat.opacity = 0.030;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const b = 0.75 + Math.random() * 0.25;
        colArr[i3] = 0.96 * b;    // bright daylight
        colArr[i3 + 1] = 0.98 * b;
        colArr[i3 + 2] = 1.0 * b;
      }
    }

    colorAttr.needsUpdate = true;
  };

  // 6. CLEANUP
  const dispose = () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
    beamGeo.dispose();
    beamMat.dispose();
    beamSliceGeo.dispose();
    beamSliceMat.dispose();
  };

  return {
    group,
    points,
    sunbeam,
    update,
    setTimeOfDay,
    dispose
  };
}
