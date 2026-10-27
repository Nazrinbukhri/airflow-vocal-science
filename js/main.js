// THE SCIENCE OF VOICE — How Air Becomes Sound
// Main entry: renderer, timeline playback, camera, controls and UI.
import * as THREE from '../vendor/three.module.min.js';
import { buildAnatomy } from './anatomy.js';
import { VocalFoldPair } from './vocalFolds.js';
import { particleMaterial } from './materials.js';
import { SCENES, TOTAL, DEFAULTS, LABELS, METERS, STAGE, sceneAt } from './scenes.js';
import { evalKeys, clamp, lerp, easeInOutCubic, formatTime, smoothstep, makeRng } from './utils.js';
import { LabelLayer, Meters, Scopes } from './ui.js';
import { VoiceSynth } from './audio.js';

const $ = (id) => document.getElementById(id);

function fail(msg) {
  const box = $('errorBox');
  box.innerHTML = msg;
  box.classList.remove('hidden');
  const s = $('loadStatus');
  if (s) s.innerHTML = msg;
}

// ---------------------------------------------------------------------
// Renderer & scene
// ---------------------------------------------------------------------
const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  fail('WebGL tidak tersedia pada peranti/pelayar ini. <span class="en">WebGL is not available on this device/browser.</span>');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x03060d, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);

scene.add(new THREE.HemisphereLight(0x9cc8ff, 0x1a0a12, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0x4fb6ff, 1.3);
rim.position.set(-4, 2, -3);
scene.add(rim);
scene.add(new THREE.AmbientLight(0x223044, 0.6));

// Floating dust for depth.
const dust = (() => {
  const n = 700;
  const rng = makeRng(5);
  const pos = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = 9 + rng() * 24;
    const a = rng() * Math.PI * 2;
    const b = Math.acos(rng() * 2 - 1);
    pos[i * 3] = Math.sin(b) * Math.cos(a) * r + 5;
    pos[i * 3 + 1] = Math.cos(b) * r * 0.6 + 1;
    pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    size[i] = 0.05 + rng() * 0.12;
    alpha[i] = 0.15 + rng() * 0.35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const mat = particleMaterial({ color: 0x2a5d99, opacity: 0.8 });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
})();

const anatomy = buildAnatomy(scene);

// Comparison stage: two vocal-fold models side by side.
const STAGE_SCALE = 0.17;
const stage = new THREE.Group();
stage.position.set(...STAGE);
scene.add(stage);
const pairL = new VocalFoldPair({ worldScale: STAGE_SCALE, seed: 21 });
const pairR = new VocalFoldPair({ worldScale: STAGE_SCALE, seed: 33 });
for (const p of [pairL, pairR]) {
  p.group.scale.setScalar(STAGE_SCALE);
  stage.add(p.group);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 80),
    new THREE.MeshBasicMaterial({ color: 0x4fb6ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.rotation.x = Math.PI / 2;
  halo.scale.set(0.72, 0.95, 1);
  halo.position.set(0, 0.7, -0.3);
  p.group.add(halo);
}
// Side by side in every orientation so "left" and "right" in the
// narration always match the screen. Screen-left is +x in these views
// (the camera looks forward from behind the larynx).
{
  const c = 0.4 * STAGE_SCALE; // centre each model (it extends backwards)
  pairL.group.position.set(0.17, 0, c);
  pairR.group.position.set(-0.17, 0, c);
}

// Extra label anchors for the stage.
// Model titles go above each model in portrait, below it in landscape
// (the top edge of a landscape phone is taken by the buttons).
const stageAnchor = (pair) => () =>
  pair.group.localToWorld(W > H ? new THREE.Vector3(0, 0.75, -1.45) : new THREE.Vector3(0, 0.75, 0.75));
const anchors = {
  ...anatomy.anchors,
  stageL: stageAnchor(pairL),
  stageR: stageAnchor(pairR),
  stageL2: stageAnchor(pairL),
  stageR2: stageAnchor(pairR),
  stageFF: () => pairR.anchorWorld('falseFold'),
};
const CENTER_LABELS = new Set(['stageL', 'stageR', 'stageL2', 'stageR2']);

// ---------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------
const labels = new LabelLayer($('labels'), $('leaders'));
const meters = new Meters($('meters'), METERS);
const scopes = new Scopes($('scopes'));
const synth = new VoiceSynth();

const ui = {
  timeline: $('timeline'),
  timeNow: $('timeNow'),
  timeTotal: $('timeTotal'),
  subs: $('subs'),
  subMs: $('subMs'),
  subEn: $('subEn'),
  card: $('sceneCard'),
  fade: $('fade'),
  health: $('healthCard'),
  top: $('top'),
  bottom: $('bottom'),
};
ui.timeline.max = TOTAL;
ui.timeTotal.textContent = formatTime(TOTAL);
$('sceneTotal').textContent = String(SCENES.length).padStart(2, '0');

// Chapter ticks + list.
const ticks = $('chapterTicks');
const list = $('chapterList');
SCENES.forEach((s, i) => {
  if (i > 0) {
    const t = document.createElement('i');
    t.style.left = `${(s.start / TOTAL) * 100}%`;
    ticks.appendChild(t);
  }
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span><span class="t"></span><span class="te"></span></span><span class="d">${formatTime(s.start)}</span>`;
  b.querySelector('.t').textContent = s.title.ms;
  b.querySelector('.te').textContent = s.title.en;
  b.addEventListener('click', () => {
    seek(s.start + 0.001);
    closeSheet('chaptersSheet');
    setPlaying(true);
  });
  li.appendChild(b);
  list.appendChild(li);
});

function scopeDefs(sc) {
  if (sc.scope === 'main') {
    return [{ ms: 'Bukaan glotis (ilustrasi)', en: 'Glottal opening', source: anatomy.folds, color: '#4fb6ff' }];
  }
  if (sc.id === 'effort') {
    return [
      { ms: 'Seimbang', en: 'Balanced', source: pairL, color: '#4fb6ff' },
      { ms: 'Usaha berlebihan', en: 'Excessive effort', source: pairR, color: '#ff9a7a' },
    ];
  }
  return [
    { ms: 'Stabil', en: 'Stable', source: pairL, color: '#4fb6ff' },
    { ms: 'Tidak teratur', en: 'Irregular', source: pairR, color: '#ff9a7a' },
  ];
}

// ---------------------------------------------------------------------
// Playback state
// ---------------------------------------------------------------------
const state = {
  time: 0,
  playing: false,
  speed: 1,
  scrubbing: false,
  sceneIndex: -1,
  subIndex: -1,
  healthDismissed: false,
};

function setPlaying(p) {
  if (p && state.time >= TOTAL - 0.01) state.time = 0;
  state.playing = p;
  document.body.classList.toggle('playing', p);
  $('playLabel').textContent = p ? 'Jeda' : 'Main';
  $('btnPlay').setAttribute('aria-label', p ? 'Jeda / Pause' : 'Main / Play');
}

function seek(t) {
  state.time = clamp(t, 0, TOTAL);
}

function nextScene(dir = 1) {
  const i = sceneAt(state.time);
  const sc = SCENES[i];
  if (dir < 0) {
    const lt = state.time - sc.start;
    seek(lt > 2 || i === 0 ? sc.start : SCENES[i - 1].start);
  } else if (i < SCENES.length - 1) {
    seek(SCENES[i + 1].start + 0.001);
  } else {
    seek(TOTAL);
    setPlaying(false);
  }
}

$('btnPlay').addEventListener('click', () => setPlaying(!state.playing));
$('btnRestart').addEventListener('click', () => {
  seek(0);
  resetView();
  setPlaying(true);
});
$('btnNext').addEventListener('click', () => nextScene(1));
$('speed').addEventListener('change', (e) => {
  state.speed = parseFloat(e.target.value) || 1;
});
ui.timeline.addEventListener('input', () => {
  state.scrubbing = true;
  seek(parseFloat(ui.timeline.value));
});
ui.timeline.addEventListener('change', () => {
  state.scrubbing = false;
});
['pointerup', 'touchend'].forEach((ev) => ui.timeline.addEventListener(ev, () => (state.scrubbing = false)));

$('btnLang').addEventListener('click', (e) => {
  const on = document.body.classList.toggle('no-en');
  e.currentTarget.setAttribute('aria-pressed', on ? 'false' : 'true');
  labels.items.forEach((it) => { it.w = 0; });
});
function setSound(on) {
  if (on) synth.unlock();
  synth.enabled = on;
  $('btnSound').setAttribute('aria-pressed', on ? 'true' : 'false');
}
$('btnSound').addEventListener('click', () => setSound(!synth.enabled));

function openSheet(id) {
  $(id).classList.remove('hidden');
}
function closeSheet(id) {
  $(id).classList.add('hidden');
}
$('btnInfo').addEventListener('click', () => openSheet('infoSheet'));
$('btnChapters').addEventListener('click', () => {
  const cur = sceneAt(state.time);
  list.querySelectorAll('button').forEach((b, i) => b.classList.toggle('current', i === cur));
  openSheet('chaptersSheet');
});
document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', () => {
    const id = b.getAttribute('data-close');
    if (id === 'healthCard') {
      state.healthDismissed = true;
      ui.health.classList.add('hidden');
    } else closeSheet(id);
  })
);
document.querySelectorAll('.sheet').forEach((s) =>
  s.addEventListener('click', (e) => {
    if (e.target === s) s.classList.add('hidden');
  })
);
// Scene card: in portrait the description folds away after a few
// seconds to free the screen; tapping the card toggles it.
let cardPinned = null; // null = automatic, true = open, false = closed
ui.card.addEventListener('click', () => {
  cardPinned = ui.card.classList.contains('collapsed');
  ui.card.classList.toggle('collapsed', !cardPinned);
  requestAnimationFrame(measureUI);
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    setPlaying(!state.playing);
  } else if (e.code === 'ArrowRight') nextScene(1);
  else if (e.code === 'ArrowLeft') nextScene(-1);
});

// ---------------------------------------------------------------------
// Touch / mouse camera controls (drag rotate, pinch zoom, double-tap reset)
// ---------------------------------------------------------------------
const view = { yaw: 0, pitch: 0, zoom: 1 };
const pointers = new Map();
let pinchDist = 0;
let lastTap = 0;
function resetView() {
  view.yaw = 0;
  view.pitch = 0;
  view.zoom = 1;
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture?.(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x;
  const dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (pointers.size === 1) {
    view.yaw -= dx * 0.006;
    view.pitch = clamp(view.pitch + dy * 0.005, -1.1, 1.1);
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) view.zoom = clamp(view.zoom * (pinchDist / d), 0.35, 2.5);
    pinchDist = d;
  }
});
function endPointer(e) {
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  pinchDist = 0;
  if (p && e.type === 'pointerup' && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10) {
    const now = performance.now();
    if (now - lastTap < 320) resetView();
    lastTap = now;
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.zoom = clamp(view.zoom * Math.exp(e.deltaY * 0.001), 0.35, 2.5);
}, { passive: false });
// Stop iOS page zoom gestures on the canvas.
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ---------------------------------------------------------------------
// Parameters and camera for a point in time
// ---------------------------------------------------------------------
const BLEND = 1.6; // seconds to blend scene settings into the next scene

function paramsAt(time) {
  const i = sceneAt(time);
  const sc = SCENES[i];
  const lt = time - sc.start;
  const P = evalKeys(sc.keys, lt, DEFAULTS);
  if (i > 0 && !sc.cut && lt < BLEND) {
    const prev = SCENES[i - 1];
    const Pp = evalKeys(prev.keys, prev.duration, DEFAULTS);
    const e = easeInOutCubic(lt / BLEND);
    for (const k in P) {
      if (typeof P[k] === 'number' && typeof Pp[k] === 'number') P[k] = lerp(Pp[k], P[k], e);
    }
  }
  return { P, i, sc, lt };
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
function poseFromKeys(keys, lt) {
  let k0 = keys[0];
  let k1 = keys[0];
  for (let j = 0; j < keys.length; j++) {
    if (keys[j].t <= lt) k0 = keys[j];
    if (keys[j].t >= lt) {
      k1 = keys[j];
      break;
    }
    k1 = keys[j];
  }
  const span = k1.t - k0.t;
  const e = span > 0 ? easeInOutCubic(clamp((lt - k0.t) / span)) : 0;
  return blendPose(toPose(k0), toPose(k1), e);
}
function toPose(k) {
  return { pos: new THREE.Vector3(...k.pos), target: new THREE.Vector3(...k.target) };
}
// Blend two camera poses: target moves linearly, distance in log space
// (smooth zooms over large scale changes), direction normalised-lerp.
function blendPose(a, b, e) {
  const target = a.target.clone().lerp(b.target, e);
  _a.copy(a.pos).sub(a.target);
  _b.copy(b.pos).sub(b.target);
  const la = _a.length();
  const lb = _b.length();
  const dist = Math.exp(lerp(Math.log(la), Math.log(lb), e));
  const dir = _a.normalize().lerp(_b.normalize(), e).normalize();
  return { pos: target.clone().addScaledVector(dir, dist), target };
}
function poseAt(time) {
  const i = sceneAt(time);
  const sc = SCENES[i];
  const lt = time - sc.start;
  let pose = poseFromKeys(sc.cam, lt);
  if (i > 0 && !sc.cut) {
    const T = Math.min(3.2, sc.duration * 0.35);
    if (lt < T) {
      const prev = SCENES[i - 1];
      pose = blendPose(poseFromKeys(prev.cam, prev.duration), pose, easeInOutCubic(lt / T));
    }
  }
  return pose;
}

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------
let W = 1;
let H = 1;
let bounds = { top: 0, bottom: 1 };
let viewShift = 0;
let viewShiftX = 0;
function measureUI() {
  const portrait = H >= W;
  const topR = ui.top.getBoundingClientRect();
  const botR = ui.bottom.getBoundingClientRect();
  bounds = {
    top: portrait ? topR.bottom + 4 : 56,
    bottom: Math.max(topR.bottom + 60, botR.top - 4),
  };
  const hud = $('hud');
  if (!portrait && H < 560) hud.style.top = `${Math.round(topR.bottom + 6)}px`;
  else hud.style.top = '';
  const visTop = portrait ? topR.bottom : 50;
  const visCenter = (visTop + botR.top) / 2;
  viewShift = (H / 2 - visCenter) * 0.85;
  // Landscape: the text column sits on the left, so centre the 3D
  // subject in the free space to its right.
  viewShiftX = portrait ? 0 : (W / 2 - (topR.right + W) / 2) * 0.75;
}
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  measureUI();
  const scale = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  for (const m of [anatomy.airflow.material, dust.material, anatomy.folds.pMat, pairL.pMat, pairR.pMat]) {
    if (m) m.uniforms.uScale.value = scale;
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

// ---------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function updateSceneCard(i, sc) {
  ui.card.classList.add('swap');
  setTimeout(() => {
    $('sceneNum').textContent = String(i + 1).padStart(2, '0');
    setText($('sceneTitle'), sc.title.ms);
    setText($('sceneTitleEn'), sc.title.en);
    setText($('sceneDesc'), sc.desc.ms);
    setText($('sceneDescEn'), sc.desc.en);
    ui.card.classList.remove('swap');
    requestAnimationFrame(measureUI);
  }, 220);
}

function updateSubs(sc, lt) {
  let idx = -1;
  for (let j = 0; j < sc.subs.length; j++) if (sc.subs[j].t <= lt) idx = j;
  const keyIdx = sc.id + ':' + idx;
  if (keyIdx === state.subIndex) return;
  state.subIndex = keyIdx;
  const line = sc.subs[idx];
  ui.subs.classList.add('swap');
  setTimeout(() => {
    setText(ui.subMs, line ? line.ms : '');
    setText(ui.subEn, line ? line.en : '');
    ui.subs.classList.remove('swap');
  }, 180);
}

function foldParams(P, prefix = '') {
  const g = (k) => P[prefix + k];
  return {
    open: g('open'), amp: g('amp'), freq: g('freq'), cq: g('cq'), irr: g('irr'),
    press: g('press'), ffs: g('ffs'), stretch: g('stretch'), flow: g('gflow'), rings: g('rings'),
    wall: prefix ? 1 : P.wall,
  };
}

let frameCount = 0;
function update(sdt) {
  const { P, i, sc, lt } = paramsAt(state.time);

  if (i !== state.sceneIndex) {
    state.sceneIndex = i;
    state.healthDismissed = false;
    cardPinned = null;
    updateSceneCard(i, sc);
    meters.set(sc.meters || []);
    scopes.set(sc.scope ? sc.id : '', sc.scope ? scopeDefs(sc) : []);
    requestAnimationFrame(measureUI);
  }
  if (++frameCount % 30 === 0) measureUI();
  const autoCollapse = ((H > W && W < 700) || (W > H && H < 560)) && lt > 7;
  const collapsed = cardPinned === null ? autoCollapse : !cardPinned;
  if (collapsed !== ui.card.classList.contains('collapsed')) {
    ui.card.classList.toggle('collapsed', collapsed);
    requestAnimationFrame(measureUI);
  }

  // Anatomy + folds.
  anatomy.update(sdt, P);
  if (P.detail > 0.01) anatomy.folds.update(sdt, foldParams(P));
  stage.visible = P.stage > 0.01;
  if (stage.visible) {
    pairL.update(sdt, foldParams(P, 'L_'));
    pairR.update(sdt, foldParams(P, 'R_'));
  }
  dust.rotation.y += sdt * 0.01;

  // Camera.
  const pose = poseAt(state.time);
  const off = pose.pos.clone().sub(pose.target);
  const aspect = W / H;
  // Narrow portrait screens see less horizontally, so pull back.
  // Short landscape phone screens lose height to the controls.
  const aspectFactor = aspect < 1 ? Math.pow(1 / aspect, 0.92) : H < 560 ? 1.55 : 1;
  const sceneZoom = aspect < 1 ? sc.portraitZoom || 1 : sc.landscapeZoom || 1;
  let dist = off.length() * aspectFactor * sceneZoom * view.zoom;
  const dir = off.normalize();
  if (state.playing && pointers.size === 0) {
    const k = Math.exp(-sdt * 0.25);
    view.yaw *= k;
    view.pitch *= k;
    view.zoom = 1 + (view.zoom - 1) * k;
  }
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), view.yaw);
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (right.lengthSq() > 1e-6) {
    const d2 = dir.clone().applyAxisAngle(right, view.pitch);
    if (Math.abs(d2.y) < 0.995) dir.copy(d2);
  }
  camera.position.copy(pose.target).addScaledVector(dir, dist);
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.target);
  camera.near = Math.max(0.002, dist * 0.03);
  camera.far = Math.max(60, dist * 40);
  camera.setViewOffset(W, H, viewShiftX, viewShift, W, H);
  camera.updateProjectionMatrix();

  // Fades for scene cuts.
  let fade = 0;
  if (sc.cut || i === 0) fade = 1 - smoothstep(0, 0.9, lt);
  const next = SCENES[i + 1];
  if (next && next.cut) fade = Math.max(fade, smoothstep(sc.duration - 0.6, sc.duration, lt));
  ui.fade.style.opacity = fade.toFixed(3);

  // Labels.
  const active = [];
  for (const l of sc.labels || []) {
    let a = smoothstep(l.at, l.at + 0.6, lt);
    if (l.until) a *= 1 - smoothstep(l.until - 0.5, l.until, lt);
    a *= 1 - smoothstep(sc.duration - 0.5, sc.duration, lt);
    a *= 1 - fade;
    if (a <= 0.01 || !anchors[l.k]) continue;
    active.push({ key: l.k, text: LABELS[l.k], anchor: anchors[l.k], alpha: a, center: CENTER_LABELS.has(l.k) ? (W > H ? 'below' : 'above') : false });
  }
  labels.update(active, camera, W, H, bounds);

  // Subtitles, meters, scopes.
  updateSubs(sc, lt);
  meters.update(P);
  scopes.update(synth.enabled ? Math.round(P.aSide) - 1 : -1);

  // Health card at the end.
  const showHealth = sc.card === 'health' && lt > 12.5 && !state.healthDismissed;
  ui.health.classList.toggle('hidden', !showHealth);

  // Timeline.
  if (!state.scrubbing) ui.timeline.value = state.time.toFixed(2);
  ui.timeline.style.setProperty('--p', `${(state.time / TOTAL) * 100}%`);
  setText(ui.timeNow, formatTime(state.time));

  // Sound.
  synth.update({
    on: state.playing && !document.hidden ? P.aOn : 0,
    f0: P.aF0,
    rough: P.aRough,
    bright: P.aBright,
  });
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  let sdt = 0;
  if (state.playing && !state.scrubbing) {
    sdt = dt * state.speed;
    state.time += sdt;
    if (state.time >= TOTAL) {
      state.time = TOTAL;
      setPlaying(false);
    }
  }
  update(sdt);
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------
resize();
// Warm up the simulations so particles are already flowing.
for (let k = 0; k < 90; k++) {
  const { P } = paramsAt(20);
  anatomy.update(1 / 30, { ...P, flowVis: 0 });
}
requestAnimationFrame(frame);
window.__voiceAppReady = true;

const startBtn = $('btnStart');
$('loadStatus').textContent = '';
startBtn.addEventListener('click', () => {
  if ($('startSound').checked) setSound(true);
  $('startScreen').classList.add('gone');
  setTimeout(() => $('startScreen').classList.add('hidden'), 900);
  seek(0);
  setPlaying(true);
});

// Deep link for previews/testing: index.html#t=62 opens paused at 62 s.
const m = location.hash.match(/t=([\d.]+)/);
if (m) {
  $('startScreen').classList.add('hidden');
  seek(parseFloat(m[1]));
  if (/play/.test(location.hash)) setPlaying(true);
}
