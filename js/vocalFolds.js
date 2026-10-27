// Anatomically inspired (illustrative) model of the glottis:
// two true vocal folds, two false (ventricular) folds, arytenoid
// cartilages, the laryngeal wall, local airflow particles and sound
// wavefront rings.
//
// Local units: the vibrating fold length is 1.0. +y = up (towards the
// mouth), +z = anterior (front of the neck), x = left/right.
import * as THREE from '../vendor/three.module.min.js';
import { particleMaterial } from './materials.js';
import { clamp, lerp, makeRng } from './utils.js';

const FOLD_PROFILE = [
  [0.5, 0.07], [0.3, 0.078], [0.15, 0.064], [0.055, 0.038], [0.0, 0.0],
  [0.012, -0.05], [0.05, -0.11], [0.14, -0.18], [0.3, -0.235], [0.5, -0.27],
  [0.56, -0.1],
];
const FALSE_FOLD_PROFILE = [
  [0.4, 0.09], [0.2, 0.075], [0.06, 0.04], [0.0, -0.01], [0.03, -0.05],
  [0.16, -0.065], [0.4, -0.055], [0.44, 0.02],
];

// Procedural mucosa texture with faint blood vessels.
function mucosaTexture(base, vessel, seed, vesselCount = 26) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rng = makeRng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(255,255,255,${rng() * 0.05})`;
    g.fillRect(rng() * 256, rng() * 256, 2, 2);
  }
  g.strokeStyle = vessel;
  g.lineCap = 'round';
  for (let i = 0; i < vesselCount; i++) {
    let x = rng() * 256;
    let y = rng() * 256;
    let a = rng() * Math.PI * 2;
    g.lineWidth = 0.6 + rng() * 1.4;
    g.globalAlpha = 0.25 + rng() * 0.35;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      a += (rng() - 0.5) * 0.9;
      x += Math.cos(a) * 8;
      y += Math.sin(a) * 8;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let sharedTextures = null;
function textures() {
  if (!sharedTextures) {
    sharedTextures = {
      fold: mucosaTexture('#f3d6d2', '#c9545f', 11, 10),
      wall: mucosaTexture('#b34a5a', '#6e1424', 12, 40),
      falseFold: mucosaTexture('#c9606e', '#7a1a2a', 13, 30),
    };
  }
  return sharedTextures;
}

// Build a fold-like tube: a closed cross-section profile swept along
// z from 0 (anterior) to -1 (posterior). Ends are pinched closed.
function buildFoldGeometry(profile, nu = 44, np = 52) {
  const pts = profile.map(([x, y]) => new THREE.Vector3(x, y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const ring = curve.getSpacedPoints(np).slice(0, np);
  let cx = 0;
  let cy = 0;
  for (const p of ring) { cx += p.x; cy += p.y; }
  cx /= np; cy /= np;
  cx = Math.max(cx, 0.22);

  const count = (nu + 1) * np;
  const pos = new Float32Array(count * 3);
  const base = new Float32Array(count * 3); // x0, y0, u
  const uv = new Float32Array(count * 2);
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const s = Math.min(1, Math.sqrt(u / 0.07), Math.sqrt((1 - u) / 0.07));
    const lateral = Math.min(1, 0.72 + 1.2 * u);
    for (let j = 0; j < np; j++) {
      const p = ring[j];
      const x = (cx + (p.x - cx) * s) * lateral;
      const y = cy + (p.y - cy) * s;
      const k = i * np + j;
      base[k * 3] = x;
      base[k * 3 + 1] = y;
      base[k * 3 + 2] = u;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = -u;
      uv[k * 2] = u * 2;
      uv[k * 2 + 1] = j / np;
    }
  }
  const idx = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < np; j++) {
      const a = i * np + j;
      const b = i * np + ((j + 1) % np);
      const c = (i + 1) * np + j;
      const d = (i + 1) * np + ((j + 1) % np);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.userData.base = base;
  geo.computeVertexNormals();
  return geo;
}

// Glottal opening for one point of the cycle (0..1 phase).
// Opens gradually, closes faster, then stays closed (closed phase).
function openingAt(phase, closedQuotient) {
  const f = phase - Math.floor(phase);
  const oq = clamp(1 - closedQuotient, 0.15, 1);
  if (f >= oq) return 0;
  const g = f / oq;
  return Math.sin(Math.PI * Math.pow(g, 1.35));
}

export const DEFAULT_FOLD_PARAMS = {
  open: 1, // 1 = apart (breathing), 0 = together (voicing)
  amp: 0, // vibration amplitude 0..1
  freq: 1.6, // visual cycles per second (slow motion)
  cq: 0.4, // closed quotient (fraction of cycle closed)
  irr: 0, // irregularity 0..1 (illustrative)
  press: 0, // pressed / hyperadducted 0..1
  ffs: 0, // false-fold squeeze 0..1
  stretch: 0, // lengthening for higher pitch 0..1
  flow: 0.6, // airflow through the larynx 0..1
  wall: 1, // laryngeal wall opacity
  rings: 1, // sound wave visibility 0..1
};

export class VocalFoldPair {
  constructor({ worldScale = 1, seed = 7, withParticles = true } = {}) {
    this.group = new THREE.Group();
    this.worldScale = worldScale;
    this.rng = makeRng(seed);
    this.params = { ...DEFAULT_FOLD_PARAMS };
    this.time = 0;
    this.area = 0;
    this.history = new Float32Array(240);
    this.histIndex = 0;
    this.histTimer = 0;
    this.onPulse = null;

    const tex = textures();
    // Laryngeal wall: rendered from the inside only (BackSide), which
    // gives a natural cut-away look when viewed from outside.
    const wallGeo = new THREE.CylinderGeometry(1, 1, 1.9, 48, 1, true);
    const wallMat = new THREE.MeshStandardMaterial({
      map: tex.wall, color: 0xffffff, roughness: 0.55, metalness: 0,
      side: THREE.BackSide, emissive: 0x2a0710, emissiveIntensity: 0.4,
      transparent: true,
    });
    this.wall = new THREE.Mesh(wallGeo, wallMat);
    this.wall.scale.set(0.76, 1, 0.82);
    this.wall.position.set(0, -0.25, -0.1);
    this.group.add(this.wall);

    // Dark disc deep below so the open glottis reads as a dark airway.
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: 0x050208 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(0.74, 0.8, 1);
    shadow.position.set(0, -1.15, -0.1);
    this.group.add(shadow);

    const foldMat = new THREE.MeshPhysicalMaterial({
      map: tex.fold, color: 0xffffff, roughness: 0.32, clearcoat: 1,
      clearcoatRoughness: 0.18, side: THREE.DoubleSide,
      emissive: 0x3a1418, emissiveIntensity: 0.35,
    });
    const falseMat = new THREE.MeshPhysicalMaterial({
      map: tex.falseFold, color: 0xffffff, roughness: 0.45, clearcoat: 0.6,
      clearcoatRoughness: 0.3, side: THREE.DoubleSide,
      emissive: 0x2a0710, emissiveIntensity: 0.3,
    });
    const aryMat = new THREE.MeshStandardMaterial({
      color: 0xcf7a84, roughness: 0.5, emissive: 0x2a0a10, emissiveIntensity: 0.3,
    });

    this.sides = [];
    for (const sign of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0, 0, 0.5); // anterior commissure
      const geo = buildFoldGeometry(FOLD_PROFILE);
      const mesh = new THREE.Mesh(geo, foldMat);
      pivot.add(mesh);
      const ary = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 14), aryMat);
      ary.position.set(sign * 0.16, 0.08, -1.08);
      ary.rotation.z = -sign * 0.25;
      pivot.add(ary);
      this.group.add(pivot);

      const fgeo = buildFoldGeometry(FALSE_FOLD_PROFILE, 30, 36);
      const fmesh = new THREE.Mesh(fgeo, falseMat);
      fmesh.position.set(0, 0.24, 0.52);
      fmesh.scale.set(1, 1, 1.08);
      this.group.add(fmesh);

      this.sides.push({
        sign, pivot, mesh, geo, ary, fmesh, fgeo,
        phase: 0, jit: 0, ampF: 1, lastFrac: 0,
      });
    }

    // Local light, like the lamp of an endoscope.
    const lamp = new THREE.PointLight(0xfff1e6, 2.2, 0, 0);
    lamp.position.set(0.1, 1.6, 0.6);
    this.group.add(lamp);

    if (withParticles) this.#initParticles();
    this.#initRings();

    // Points of interest for labels (local coordinates).
    this.anchors = {
      glottis: new THREE.Vector3(0, 0.02, 0),
      fold: new THREE.Vector3(0.12, 0.06, 0.05),
      foldL: new THREE.Vector3(-0.12, 0.06, 0.05),
      falseFold: new THREE.Vector3(-0.22, 0.32, 0.1),
      arytenoid: new THREE.Vector3(0.2, 0.2, -0.62),
      subglottis: new THREE.Vector3(0, -0.6, 0),
      above: new THREE.Vector3(0, 0.8, 0),
    };
  }

  anchorWorld(name, target = new THREE.Vector3()) {
    return this.group.localToWorld(target.copy(this.anchors[name]));
  }

  #initParticles() {
    const n = 460;
    this.pN = n;
    const geo = new THREE.BufferGeometry();
    this.pPos = new Float32Array(n * 3);
    this.pSize = new Float32Array(n);
    this.pAlpha = new Float32Array(n);
    this.pVel = new Float32Array(n);
    this.pState = new Uint8Array(n); // 0 below glottis, 1 jet above
    for (let i = 0; i < n; i++) this.#respawn(i, true);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1));
    this.pMat = particleMaterial({ color: 0x3da5ff });
    this.points = new THREE.Points(geo, this.pMat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  #respawn(i, anywhere = false) {
    const r = this.rng;
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    this.pPos[i * 3] = Math.cos(a) * rad * 0.42;
    this.pPos[i * 3 + 1] = anywhere ? -1.1 + r() * 2.2 : -1.15 - r() * 0.2;
    this.pPos[i * 3 + 2] = Math.sin(a) * rad * 0.55 - 0.1;
    this.pSize[i] = (0.035 + r() * 0.035) * this.worldScale;
    this.pAlpha[i] = 0;
    this.pVel[i] = 0.8 + r() * 0.5;
    this.pState[i] = this.pPos[i * 3 + 1] > 0 ? 1 : 0;
  }

  #initRings() {
    this.rings = [];
    const geo = new THREE.TorusGeometry(1, 0.014, 6, 72);
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x9fe8ff, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2;
      m.visible = false;
      m.userData.life = 1;
      m.userData.strength = 1;
      this.group.add(m);
      this.rings.push(m);
    }
    this.ringCursor = 0;
  }

  #emitRing(strength) {
    if (this.params.rings <= 0.01) return;
    const m = this.rings[this.ringCursor];
    this.ringCursor = (this.ringCursor + 1) % this.rings.length;
    m.userData.life = 0;
    m.userData.strength = strength;
    m.visible = true;
  }

  // Half-width of the glottal gap at fraction u along the fold (0 =
  // anterior, 1 = posterior), measured at the free edge.
  gapAt(u) {
    const p = this.params;
    let hw = 0;
    for (const s of this.sides) {
      const theta = s.theta || 0;
      const L = 1 + 0.16 * p.stretch;
      const env = Math.pow(Math.sin(Math.PI * clamp(u)), 0.8);
      const o = openingAt(s.phase + (s.sign > 0 ? s.asym || 0 : 0), s.cq ?? p.cq);
      hw += Math.sin(theta) * u + p.amp * s.ampF * 0.11 * o * env + (s.chink || 0) * u;
    }
    return hw * 0.5 + 0.004;
  }

  update(dt, params) {
    Object.assign(this.params, params);
    const p = this.params;
    this.time += dt;
    const r = this.rng;

    // --- Fold posture and cycle timing ---
    const cq = clamp(p.cq + p.press * 0.3, 0, 0.85);
    let pulse = false;
    for (const s of this.sides) {
      const theta = p.open * 0.34 + 0.012;
      s.theta = theta;
      s.cq = cq;
      s.pivot.scale.set(1, 1 - 0.22 * p.stretch, 1 + 0.16 * p.stretch);
      // Arytenoid cartilages swing outwards to open the glottis.
      s.ary.position.x = s.sign * (0.16 + Math.sin(theta) * 1.02);
      s.ary.rotation.y = -s.sign * theta * 1.5;
      s.asym = p.irr * 0.22;
      s.chink = p.irr * 0.03;

      const prev = s.phase;
      s.phase += p.freq * dt * (1 + s.jit);
      if (Math.floor(s.phase) !== Math.floor(prev)) {
        // New cycle: irregular folds pick a new period and amplitude.
        s.jit = (r() - 0.5) * 2 * p.irr * 0.5;
        s.ampF = 1 - p.irr * r() * 0.65 + (s.sign > 0 ? -p.irr * 0.2 : 0);
      }
      // Keep stable folds perfectly in sync.
      if (p.irr < 0.001 && s.sign > 0) {
        s.phase = this.sides[0].phase;
        s.jit = 0;
        s.ampF = 1;
      }
      const oq = 1 - cq;
      const frac = s.phase - Math.floor(s.phase);
      if (s.sign < 0 && s.lastFrac < oq && frac >= oq && p.amp > 0.05) pulse = true;
      s.lastFrac = frac;

      this.#deformFold(s, p, cq);
      this.#deformFalseFold(s, p);
    }
    if (pulse) {
      const strength = this.sides[0].ampF * p.amp * (1 - 0.4 * p.press);
      this.#emitRing(strength);
      if (this.onPulse) this.onPulse(strength);
    }

    // Glottal opening at mid-fold (used for the waveform scope).
    this.area = clamp(this.gapAt(0.5) * 2 / 0.3, 0, 2);
    this.histTimer += dt;
    const step = 1 / 60;
    while (this.histTimer >= step) {
      this.histTimer -= step;
      this.history[this.histIndex] = this.area;
      this.histIndex = (this.histIndex + 1) % this.history.length;
    }

    this.wall.material.opacity = p.wall;
    this.wall.visible = p.wall > 0.01;
    if (this.points) this.#updateParticles(dt, p);
    this.#updateRings(dt, p);
  }

  #deformFold(s, p, cq) {
    const geo = s.geo;
    const pos = geo.attributes.position.array;
    const base = geo.userData.base;
    const amp = p.amp * s.ampF * 0.11;
    const phaseOff = s.sign > 0 ? s.asym : 0;
    const n = base.length / 3;
    for (let k = 0; k < n; k++) {
      const x0 = base[k * 3];
      const y0 = base[k * 3 + 1];
      const u = base[k * 3 + 2];
      const wm = Math.exp(-x0 / 0.11);
      const env = Math.pow(Math.sin(Math.PI * u), 0.8);
      // Lower lip leads the upper lip: the "mucosal wave".
      const o = openingAt(s.phase + phaseOff + (-y0) * 1.1, cq);
      const disp = amp * o * env * wm + s.chink * u * wm;
      // Abduction: medial tissue moves out most, lateral edge stays put.
      const abd = Math.sin(s.theta) * u * clamp(1 - x0 / 0.62);
      pos[k * 3] = s.sign * (0.004 + x0 + disp + abd);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  #deformFalseFold(s, p) {
    const geo = s.fgeo;
    const pos = geo.attributes.position.array;
    const base = geo.userData.base;
    const gap = lerp(0.3, 0.05, p.ffs);
    const tremor = p.ffs * p.amp * 0.012 * Math.sin(this.time * 37 + s.sign);
    const n = base.length / 3;
    for (let k = 0; k < n; k++) {
      const x0 = base[k * 3];
      const u = base[k * 3 + 2];
      const env = Math.pow(Math.sin(Math.PI * u), 0.6);
      const lateral = Math.min(1, 0.72 + 1.2 * u);
      const g = (gap + tremor) * env + 0.03 * u;
      pos[k * 3] = s.sign * lateral * (g + x0 * (0.64 - g) / 0.44);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  #updateParticles(dt, p) {
    const pos = this.pPos;
    const flow = p.flow;
    const L = 1 + 0.16 * p.stretch;
    for (let i = 0; i < this.pN; i++) {
      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];
      let a = this.pAlpha[i];
      if (this.pState[i] === 0) {
        // Below the glottis: drift up and funnel towards the midline.
        const vy = 0.32 * this.pVel[i] * flow;
        let ny = y + vy * dt;
        const funnel = clamp((ny + 0.9) / 0.85);
        x = lerp(x, x * 0.6, funnel * dt * 2.2);
        const zc = 0.5 - 0.5 * L;
        z = lerp(z, lerp(z, zc, 0.25), funnel * dt * 2.2);
        if (ny > -0.07) {
          const u = clamp((0.5 - z) / L, 0.03, 0.97);
          const hw = this.gapAt(u);
          if (hw < 0.014) {
            // Glottis closed: air waits below, building pressure.
            ny = -0.07 - this.rng() * 0.12;
          } else {
            this.pState[i] = 1;
            x = clamp(x, -hw * 0.85, hw * 0.85);
            z = 0.5 - u * L;
            this.pVel[i] = 1.4 + this.rng() * 1.2;
          }
        }
        y = ny;
        a = Math.min(1, a + dt * 1.5);
      } else {
        // Above the glottis: a fast jet that slows and spreads.
        const vy = 0.45 * this.pVel[i] * Math.max(flow, 0.15);
        y += vy * dt;
        const spread = 1 + dt * 0.9;
        x *= spread;
        z = lerp(z, z * spread, 0.5);
        this.pVel[i] = Math.max(0.6, this.pVel[i] - dt * 0.8);
        a = clamp(1 - (y - 0.4) / 0.8);
        if (y > 1.25) this.#respawn(i);
      }
      if (flow < 0.01) a = Math.max(0, a - dt * 2);
      if (this.pState[i] === 0 && y < -1.1) a = 0;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      this.pAlpha[i] = a;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
  }

  #updateRings(dt, p) {
    for (const m of this.rings) {
      if (!m.visible) continue;
      m.userData.life += dt / 1.6;
      const l = m.userData.life;
      if (l >= 1) {
        m.visible = false;
        continue;
      }
      m.position.set(0, 0.12 + l * 1.15, 0);
      const s = 0.22 + l * 0.42;
      m.scale.set(s * 0.8, s, s);
      m.material.opacity = (1 - l) * 0.6 * m.userData.strength * p.rings;
    }
  }

  setParticleScale(uScale) {
    if (this.pMat) this.pMat.uniforms.uScale.value = uScale;
  }

  // Recent glottal-opening history, oldest first.
  getHistory(out) {
    const n = this.history.length;
    for (let i = 0; i < n; i++) out[i] = this.history[(this.histIndex + i) % n];
    return out;
  }
}
