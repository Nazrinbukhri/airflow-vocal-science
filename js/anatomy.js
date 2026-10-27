// Illustrative 3D anatomy: torso, lungs, bronchial tree, trachea,
// larynx, vocal tract and head. Also the blue airflow particles that
// travel from the lungs to the mouth and the sound wavefronts that
// travel through the vocal tract.
//
// World units: roughly 1 unit ≈ 10 cm. +y up, +z = front of the body.
// The person's right side is at -x (we look at them from the front).
import * as THREE from '../vendor/three.module.min.js';
import { fresnelMaterial, particleMaterial, setOpacity } from './materials.js';
import { VocalFoldPair } from './vocalFolds.js';
import { clamp, makeRng } from './utils.js';

export const GLOTTIS = new THREE.Vector3(0, 1.78, 0.12);
export const LARYNX_SCALE = 0.16;
const CARINA = new THREE.Vector3(0, 0.55, 0.02);
const TRACHEA_TOP = new THREE.Vector3(0, 1.58, 0.11);

const TRACT_POINTS = [
  GLOTTIS.clone(),
  new THREE.Vector3(0, 1.98, 0.06),
  new THREE.Vector3(0, 2.2, -0.04),
  new THREE.Vector3(0, 2.44, -0.06),
  new THREE.Vector3(0, 2.6, 0.04),
  new THREE.Vector3(0, 2.65, 0.3),
  new THREE.Vector3(0, 2.6, 0.58),
  new THREE.Vector3(0, 2.56, 0.9),
];

// ---------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------
class Path {
  constructor() {
    this.pts = [];
    this.rad = [];
    this.cum = [];
  }
  push(p, r) {
    const n = this.pts.length;
    if (n && this.pts[n - 1].distanceToSquared(p) < 1e-8) return;
    this.cum.push(n ? this.cum[n - 1] + this.pts[n - 1].distanceTo(p) : 0);
    this.pts.push(p.clone());
    this.rad.push(r);
  }
  get length() {
    return this.cum[this.cum.length - 1];
  }
  mark(name) {
    this[name] = this.length;
  }
}

function lungShape(sign) {
  // sign: -1 = right lung (at -x), +1 = left lung.
  const geo = new THREE.SphereGeometry(1, 56, 40);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let { x, y, z } = v;
    // Taper towards the apex.
    const taper = 1 - 0.5 * Math.pow(clamp(y), 2);
    x *= taper;
    z *= taper;
    // Concave base resting on the diaphragm dome.
    if (y < -0.35) {
      const rr = x * x + z * z;
      y += 0.38 * (1 - rr) * clamp((-y - 0.35) / 0.65);
    }
    // Flatter medial surface (facing the heart).
    const medial = x * sign < 0;
    if (medial) x *= 0.62;
    // Cardiac notch on the left lung.
    if (sign > 0 && medial && z > 0 && y < 0.1) {
      const k = clamp(1 - Math.hypot(y + 0.35, z - 0.6) / 0.6);
      x *= 1 - 0.55 * k;
      z *= 1 - 0.3 * k;
    }
    p.setXYZ(i, x * 0.66, y * 1.2, z * 0.74);
  }
  geo.computeVertexNormals();
  return geo;
}

function insideLung(pt, center) {
  const d = pt.clone().sub(center);
  return (d.x / 0.52) ** 2 + (d.y / 1.0) ** 2 + (d.z / 0.6) ** 2;
}

// Build a branching bronchial tree inside one lung. Returns tube
// meshes and the list of leaf-to-hilum point chains.
function bronchialTree(hilum, dir, lungCenter, rng, material) {
  const group = new THREE.Group();
  const chains = [];
  const axis = new THREE.Vector3();
  const perp = new THREE.Vector3();
  const MAX_DEPTH = 4;
  function grow(start, d, len, radius, depth, chain) {
    const children = depth === 0 ? 3 : 2;
    const roll = rng() * Math.PI * 2;
    for (let c = 0; c < children; c++) {
      // Each child turns 22–40° away from its parent, spread around it.
      perp.set(0, 1, 0);
      if (Math.abs(d.y) > 0.9) perp.set(1, 0, 0);
      axis.crossVectors(d, perp).normalize();
      axis.applyAxisAngle(d, roll + (c / children) * Math.PI * 2);
      const nd = d.clone().applyAxisAngle(axis, (22 + rng() * 18) * (Math.PI / 180));
      // Gentle pull towards the lung body (down and outward).
      const toCenter = lungCenter.clone().add(new THREE.Vector3(0, -0.25, 0)).sub(start).normalize();
      nd.lerp(toCenter, 0.18 + depth * 0.04).normalize();
      const end = start.clone().addScaledVector(nd, len * (0.85 + rng() * 0.3));
      let tries = 0;
      while (insideLung(end, lungCenter) > 0.8 && tries++ < 14) end.lerp(lungCenter, 0.15);
      const mid = start.clone().lerp(end, 0.5).addScaledVector(nd, 0).add(
        new THREE.Vector3((rng() - 0.5) * 0.03, (rng() - 0.5) * 0.03, (rng() - 0.5) * 0.03)
      );
      const curve = new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 5, radius, 7, false), material);
      group.add(tube);
      const segChain = [...chain, { pts: curve.getPoints(5), radius }];
      if (depth < MAX_DEPTH) {
        grow(end, end.clone().sub(start).normalize(), len * 0.74, radius * 0.72, depth + 1, segChain);
      } else {
        chains.push(segChain);
      }
    }
  }
  grow(hilum, dir, 0.36, 0.036, 0, []);
  return { group, chains };
}

// ---------------------------------------------------------------------
// Airflow particles that follow the airway paths.
// ---------------------------------------------------------------------
class AirflowParticles {
  constructor(paths, count = 1500, seed = 3) {
    this.paths = paths;
    this.n = count;
    const rng = (this.rng = makeRng(seed));
    this.pathId = new Uint16Array(count);
    this.s = new Float32Array(count);
    this.cursor = new Uint16Array(count);
    this.speed = new Float32Array(count);
    this.off = new Float32Array(count * 3);
    this.pos = new Float32Array(count * 3);
    this.alpha = new Float32Array(count);
    this.size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.#spawn(i, true);
      const a = rng() * Math.PI * 2;
      const b = Math.acos(rng() * 2 - 1);
      const r = Math.cbrt(rng());
      this.off[i * 3] = Math.sin(b) * Math.cos(a) * r;
      this.off[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r;
      this.off[i * 3 + 2] = Math.cos(b) * r;
      this.size[i] = 0.018 + rng() * 0.022;
      this.speed[i] = 0.75 + rng() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    this.material = particleMaterial({ color: 0x3b9dff });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  #spawn(i, anywhere) {
    const id = Math.floor(this.rng() * this.paths.length);
    this.pathId[i] = id;
    const path = this.paths[id];
    this.s[i] = anywhere ? this.rng() * path.glottis : this.rng() * 0.05;
    this.cursor[i] = 0;
  }

  update(dt, P) {
    const flow = P.flow;
    const reach = P.flowReach;
    const vis = P.flowVis;
    for (let i = 0; i < this.n; i++) {
      const path = this.paths[this.pathId[i]];
      const end = path.glottis + (path.exit - path.glottis) * reach;
      this.s[i] += dt * this.speed[i] * 0.55 * flow;
      let s = this.s[i];
      if (s > end) {
        if (flow > 0.01) this.#spawn(i, false);
        s = this.s[i];
      }
      // Advance the cursor along the polyline.
      let c = this.cursor[i];
      const cum = path.cum;
      while (c < cum.length - 2 && cum[c + 1] < s) c++;
      if (cum[c] > s) c = 0;
      this.cursor[i] = c;
      const a = path.pts[c];
      const b = path.pts[c + 1] || a;
      const seg = Math.max(1e-6, cum[c + 1] - cum[c]);
      const t = clamp((s - cum[c]) / seg);
      let r = path.rad[c] + (path.rad[c + 1] - path.rad[c]) * t || 0.05;
      if (s > path.lips) r += (s - path.lips) * 0.6;
      const k = i * 3;
      this.pos[k] = a.x + (b.x - a.x) * t + this.off[k] * r;
      this.pos[k + 1] = a.y + (b.y - a.y) * t + this.off[k + 1] * r;
      this.pos[k + 2] = a.z + (b.z - a.z) * t + this.off[k + 2] * r;
      const fadeIn = clamp(s / 0.12);
      const fadeOut = clamp((end - s) / 0.15);
      this.alpha[i] = fadeIn * fadeOut * vis * (s > path.lips ? 0.7 : 1);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------
// Sound wavefronts travelling up the vocal tract and out of the mouth.
// ---------------------------------------------------------------------
class TractWaves {
  constructor(curve) {
    this.curve = curve;
    this.group = new THREE.Group();
    this.items = [];
    const geo = new THREE.TorusGeometry(1, 0.08, 6, 48);
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8fe6ff, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      m.userData.t = 0;
      this.group.add(m);
      this.items.push(m);
    }
    this.cursor = 0;
    this.timer = 0;
    this.tmp = new THREE.Vector3();
    this.exitDir = curve.getTangent(1).clone();
    this.exitPt = curve.getPoint(1).clone();
  }

  update(dt, P) {
    if (P.tractWaves > 0.01 && P.waveRate > 0) {
      this.timer += dt;
      const interval = 1 / P.waveRate;
      while (this.timer > interval) {
        this.timer -= interval;
        const m = this.items[this.cursor];
        this.cursor = (this.cursor + 1) % this.items.length;
        m.userData.t = 0;
        m.visible = true;
      }
    }
    for (const m of this.items) {
      if (!m.visible) continue;
      m.userData.t += dt * 0.55;
      const t = m.userData.t;
      if (t < 1) {
        const p = this.curve.getPoint(t);
        m.position.copy(p);
        this.tmp.copy(p).add(this.curve.getTangent(t));
        m.lookAt(this.tmp);
        const s = 0.055 + 0.02 * Math.sin(t * Math.PI);
        m.scale.setScalar(s);
        m.material.opacity = 0.85 * P.tractWaves;
      } else if (t < 2.2) {
        const e = t - 1;
        m.position.copy(this.exitPt).addScaledVector(this.exitDir, e * 0.9);
        this.tmp.copy(m.position).add(this.exitDir);
        m.lookAt(this.tmp);
        m.scale.setScalar(0.07 + e * 0.6);
        m.material.opacity = 0.75 * (1 - e / 1.2) * P.tractWaves;
      } else {
        m.visible = false;
      }
    }
  }
}

// ---------------------------------------------------------------------
// Build everything.
// ---------------------------------------------------------------------
export function buildAnatomy(scene) {
  const rng = makeRng(42);
  const root = new THREE.Group();
  scene.add(root);
  const fade = {}; // groups of materials faded together

  // Torso + neck silhouette.
  const torsoProfile = [
    [0.0, -1.95], [0.85, -1.9], [1.12, -1.3], [1.18, -0.4], [1.28, 0.55],
    [1.42, 1.05], [1.22, 1.32], [0.7, 1.45], [0.44, 1.52], [0.4, 1.9],
    [0.42, 2.28],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyMat = fresnelMaterial({ color: 0x2f6fb8, rimColor: 0x7fc4ff, opacity: 0.55, base: 0.015, power: 2.6 });
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 64), bodyMat);
  torso.scale.z = 0.62;
  root.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), bodyMat);
  head.scale.set(0.7, 0.92, 0.85);
  head.position.set(0, 2.85, 0.12);
  root.add(head);
  // Nose hint.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 16), bodyMat);
  nose.position.set(0, 2.9, 0.96);
  nose.rotation.x = Math.PI / 2 + 0.35;
  root.add(nose);
  fade.body = [bodyMat];

  // Lungs.
  const lungMat = fresnelMaterial({ color: 0xff7a9a, rimColor: 0xffb3c6, opacity: 0.75, base: 0.05, power: 1.8 });
  const lungs = new THREE.Group();
  const lungCenters = [new THREE.Vector3(-0.72, 0.1, 0), new THREE.Vector3(0.72, 0.1, 0)];
  const lungMeshes = [];
  [-1, 1].forEach((sign, i) => {
    const m = new THREE.Mesh(lungShape(sign), lungMat);
    m.position.copy(lungCenters[i]);
    if (sign < 0) m.scale.set(1.05, 0.95, 1.02); // right lung: wider, shorter
    lungs.add(m);
    lungMeshes.push(m);
  });
  root.add(lungs);
  fade.lungs = [lungMat];

  // Diaphragm dome.
  const diaMat = fresnelMaterial({ color: 0xff9a55, rimColor: 0xffc58a, opacity: 0.5, base: 0.04, power: 1.6 });
  const diaphragm = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 16, 0, Math.PI * 2, 0, Math.PI / 3.2), diaMat);
  diaphragm.scale.set(1, 0.55, 0.66);
  diaphragm.position.y = -1.62;
  root.add(diaphragm);
  fade.diaphragm = [diaMat];

  // Airways: bronchial tree + trachea.
  const airwayMat = fresnelMaterial({ color: 0x8fd0ff, rimColor: 0xdff3ff, opacity: 0.9, base: 0.12, power: 1.4 });
  const airway = new THREE.Group();
  root.add(airway);
  const hila = [new THREE.Vector3(-0.42, 0.3, 0.0), new THREE.Vector3(0.5, 0.34, 0.0)];
  const mainBronchi = hila.map((h) => new THREE.LineCurve3(CARINA.clone(), h.clone()));
  mainBronchi.forEach((c) => airway.add(new THREE.Mesh(new THREE.TubeGeometry(c, 4, 0.055, 10, false), airwayMat)));
  const chainsAll = [];
  hila.forEach((h, i) => {
    const dir = h.clone().sub(CARINA).normalize().add(new THREE.Vector3(0, -0.6, 0)).normalize();
    const { group, chains } = bronchialTree(h, dir, lungCenters[i], rng, airwayMat);
    airway.add(group);
    chains.forEach((ch) => chainsAll.push({ ch, side: i }));
  });
  const tracheaCurve = new THREE.CatmullRomCurve3([
    CARINA.clone(), new THREE.Vector3(0, 1.0, 0.06), TRACHEA_TOP.clone(),
  ]);
  airway.add(new THREE.Mesh(new THREE.TubeGeometry(tracheaCurve, 24, 0.085, 16, false), airwayMat));
  // C-shaped cartilage rings, open at the back.
  const cartMat = fresnelMaterial({ color: 0xbfe6ff, rimColor: 0xffffff, opacity: 0.85, base: 0.18, power: 1.2 });
  const ringGeo = new THREE.TorusGeometry(0.093, 0.012, 6, 28, Math.PI * 1.6);
  ringGeo.rotateX(Math.PI / 2);
  ringGeo.rotateY(Math.PI * 0.3);
  for (let t = 0.04; t < 0.97; t += 0.075) {
    const r = new THREE.Mesh(ringGeo, cartMat);
    r.position.copy(tracheaCurve.getPoint(t));
    airway.add(r);
  }
  fade.airway = [airwayMat];

  // Larynx (cartilage framework + detailed vocal folds), scaled up
  // slightly for visibility.
  const larynx = new THREE.Group();
  larynx.position.copy(GLOTTIS);
  larynx.scale.setScalar(LARYNX_SCALE);
  root.add(larynx);
  const laryMat = fresnelMaterial({ color: 0x9fd8ff, rimColor: 0xe8f7ff, opacity: 0.8, base: 0.06, power: 1.5, side: THREE.DoubleSide });
  // Thyroid cartilage: two shield-like plates meeting at the front.
  const plate = new THREE.Shape();
  plate.moveTo(0, 0.42);
  plate.lineTo(0.18, 0.62);
  plate.lineTo(0.95, 0.55);
  plate.lineTo(1.1, 0.95);
  plate.lineTo(1.2, 0.5);
  plate.lineTo(1.2, -0.4);
  plate.lineTo(1.28, -0.78);
  plate.lineTo(1.06, -0.48);
  plate.lineTo(0.3, -0.52);
  plate.lineTo(0, -0.45);
  plate.lineTo(0, 0.42);
  const plateGeo = new THREE.ExtrudeGeometry(plate, { depth: 0.05, bevelEnabled: false });
  for (const sign of [-1, 1]) {
    // The plates meet at the thyroid angle, just in front of the
    // anterior commissure, and spread backwards at ~35° from midline.
    const m = new THREE.Mesh(plateGeo, laryMat);
    m.position.set(0, 0, 0.64);
    m.scale.x = 1.55;
    m.rotation.y = sign > 0 ? 0.96 : Math.PI - 0.96;
    larynx.add(m);
  }
  // Cricoid cartilage: a "signet ring", taller at the back.
  const cricoid = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.74, 0.32, 40, 1, true), laryMat);
  cricoid.position.y = -0.95;
  cricoid.scale.z = 1.12;
  larynx.add(cricoid);
  const lamina = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.74, 0.75, 24, 1, true, Math.PI * 0.72, Math.PI * 0.56), laryMat);
  lamina.position.y = -0.75;
  lamina.scale.z = 1.12;
  larynx.add(lamina);
  // Epiglottis: a curved leaf above the larynx.
  const epi = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.12, Math.PI * 0.6), laryMat);
  epi.scale.set(0.55, 1.15, 0.42);
  epi.position.set(0, 1.25, 0.2);
  epi.rotation.x = -0.35;
  larynx.add(epi);
  // Hyoid bone.
  const hyoid = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 8, 40, Math.PI * 1.1), laryMat);
  hyoid.rotation.x = Math.PI / 2;
  hyoid.rotation.z = -Math.PI * 0.05;
  hyoid.position.set(0, 1.45, 0.05);
  larynx.add(hyoid);
  fade.larynx = [laryMat, cartMat];

  const folds = new VocalFoldPair({ worldScale: LARYNX_SCALE, seed: 9 });
  larynx.add(folds.group);

  // Vocal tract (pharynx, mouth) and nasal cavity.
  const tractCurve = new THREE.CatmullRomCurve3(TRACT_POINTS, false, 'centripetal');
  const tractMat = fresnelMaterial({ color: 0xffb36b, rimColor: 0xffe0b0, opacity: 0.5, base: 0.05, power: 1.5 });
  const tract = new THREE.Mesh(new THREE.TubeGeometry(tractCurve, 64, 0.075, 16, false), tractMat);
  root.add(tract);
  const nasalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.44, -0.06), new THREE.Vector3(0, 2.8, -0.05),
    new THREE.Vector3(0, 2.92, 0.3), new THREE.Vector3(0, 2.86, 0.86),
  ]);
  const nasal = new THREE.Mesh(new THREE.TubeGeometry(nasalCurve, 40, 0.06, 12, false), tractMat);
  root.add(nasal);
  const tongueMat = fresnelMaterial({ color: 0xff6f8f, rimColor: 0xffb0c0, opacity: 0.55, base: 0.05, power: 1.6 });
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), tongueMat);
  tongue.scale.set(0.2, 0.11, 0.34);
  tongue.position.set(0, 2.5, 0.38);
  tongue.rotation.x = 0.3;
  root.add(tongue);
  fade.tract = [tractMat, tongueMat];

  // Airflow paths: leaf → bronchi → trachea → glottis → mouth → out.
  const paths = [];
  const tractPts = tractCurve.getPoints(40);
  for (const { ch, side } of chainsAll) {
    const path = new Path();
    for (let k = ch.length - 1; k >= 0; k--) {
      const seg = ch[k];
      for (let j = seg.pts.length - 1; j >= 0; j--) path.push(seg.pts[j], seg.radius * 0.8);
    }
    path.push(hila[side], 0.045);
    path.push(CARINA, 0.05);
    for (const p of tracheaCurve.getPoints(16)) path.push(p, 0.065);
    path.push(GLOTTIS, 0.02);
    path.mark('glottis');
    for (const p of tractPts) path.push(p, 0.055);
    path.mark('lips');
    path.push(TRACT_POINTS[TRACT_POINTS.length - 1].clone().add(new THREE.Vector3(0, -0.05, 0.6)), 0.08);
    path.mark('exit');
    paths.push(path);
  }
  const airflow = new AirflowParticles(paths, 1500);
  root.add(airflow.points);

  const waves = new TractWaves(tractCurve);
  root.add(waves.group);

  // Label anchor points (world space).
  const tmp = (x, y, z) => new THREE.Vector3(x, y, z);
  const larynxLocal = (x, y, z) => () => larynx.localToWorld(new THREE.Vector3(x, y, z));
  const anchors = {
    lungR: () => lungMeshes[0].localToWorld(tmp(-0.35, 0.3, 0.4)),
    lungL: () => lungMeshes[1].localToWorld(tmp(0.35, 0.3, 0.4)),
    trachea: () => tmp(0, 1.15, 0.12),
    bronchus: () => tmp(-0.3, 0.4, 0.04),
    diaphragm: () => diaphragm.localToWorld(tmp(0.55, 1.05, 0.4)),
    larynx: () => tmp(0.02, 1.78, 0.28),
    pharynx: () => tmp(0, 2.3, -0.05),
    oral: () => tmp(0, 2.64, 0.45),
    nasal: () => tmp(0, 2.9, 0.5),
    lips: () => tmp(0, 2.56, 0.92),
    thyroid: larynxLocal(0.6, 0.2, 0.25),
    cricoid: larynxLocal(0.55, -0.95, 0.55),
    epiglottis: larynxLocal(0, 1.5, 0.15),
    hyoid: larynxLocal(-0.8, 1.45, 0.5),
    glottis: () => folds.anchorWorld('glottis'),
    fold: () => folds.anchorWorld('fold'),
    foldL: () => folds.anchorWorld('foldL'),
    falseFold: () => folds.anchorWorld('falseFold'),
    arytenoid: () => folds.anchorWorld('arytenoid'),
    subglottis: () => folds.anchorWorld('subglottis'),
  };

  let breathPhase = 0;
  function update(dt, P) {
    // Gentle breathing: lungs expand while the diaphragm descends.
    breathPhase += dt * (P.breathRate ?? 0.25) * Math.PI * 2;
    const b = Math.sin(breathPhase) * P.breath;
    lungMeshes.forEach((m, i) => {
      const base = i === 0 ? [1.05, 0.95, 1.02] : [1, 1, 1];
      m.scale.set(base[0] * (1 + 0.035 * b), base[1] * (1 + 0.05 * b), base[2] * (1 + 0.035 * b));
    });
    diaphragm.position.y = -1.62 - 0.08 * b;

    setOpacity(bodyMat, 0.55 * P.body);
    setOpacity(lungMat, 0.75 * P.lungs);
    setOpacity(diaMat, 0.5 * P.lungs);
    setOpacity(airwayMat, 0.9 * P.airway);
    setOpacity(cartMat, 0.85 * P.airway);
    setOpacity(laryMat, 0.8 * P.cartilage);
    tractMat.uniforms.uOpacity.value = P.tract * (0.6 + 0.4 * Math.sin(performance.now() * 0.004) * P.tractPulse);
    setOpacity(tongueMat, 0.55 * P.tract);
    torso.visible = head.visible = nose.visible = P.body > 0.01;
    lungs.visible = diaphragm.visible = P.lungs > 0.01;
    airway.visible = P.airway > 0.01;
    tract.visible = nasal.visible = tongue.visible = P.tract > 0.01;
    folds.group.visible = P.detail > 0.01;

    airflow.update(dt, P);
    airflow.points.visible = P.flowVis > 0.01;
    waves.update(dt, P);
  }

  return { root, folds, airflow, waves, anchors, update, larynx };
}
