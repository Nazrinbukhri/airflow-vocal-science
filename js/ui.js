// DOM overlay helpers: 3D-anchored labels, meters and waveform scopes.
import * as THREE from '../vendor/three.module.min.js';
import { clamp } from './utils.js';

const SVGNS = 'http://www.w3.org/2000/svg';

export class LabelLayer {
  constructor(container, svg) {
    this.container = container;
    this.svg = svg;
    this.items = new Map(); // key -> {el, line, dot, w, h}
    this.v = new THREE.Vector3();
  }

  #make(key, text, center) {
    const el = document.createElement('div');
    el.className = 'label' + (center ? ' center' : '');
    el.innerHTML = `<span class="ms"></span><span class="en"></span>`;
    el.querySelector('.ms').textContent = text.ms;
    el.querySelector('.en').textContent = text.en;
    el.style.opacity = '0';
    this.container.appendChild(el);
    const line = document.createElementNS(SVGNS, 'line');
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('r', '3.5');
    this.svg.appendChild(line);
    this.svg.appendChild(dot);
    const item = { el, line, dot, w: 0, h: 0, center };
    this.items.set(key, item);
    return item;
  }

  // active: [{key, text, anchor: () => Vector3, alpha, center}]
  update(active, camera, w, h, bounds) {
    const seen = new Set();
    const placed = { left: [], right: [], center: [] };
    for (const a of active) {
      seen.add(a.key);
      let item = this.items.get(a.key) || this.#make(a.key, a.text, a.center);
      if (!item.w) {
        item.w = item.el.offsetWidth;
        item.h = item.el.offsetHeight;
      }
      const p = this.v.copy(a.anchor()).project(camera);
      const behind = p.z > 1 || p.z < -1;
      const ax = (p.x * 0.5 + 0.5) * w;
      const ay = (-p.y * 0.5 + 0.5) * h;
      // Hide labels whose anchor point is off screen or under the UI.
      const offscreen = ax < 4 || ax > w - 4 || ay < bounds.top || ay > bounds.bottom;
      item.visible = !behind && !offscreen && a.alpha > 0.01;
      item.alpha = a.alpha;
      item.ax = ax;
      item.ay = ay;
      if (!item.visible) continue;
      if (a.center) {
        item.x = ax - item.w / 2;
        item.y = a.center === 'below' ? ay + 6 : ay - item.h - 8;
        placed.center.push(item);
      } else {
        const side = ax < w / 2 ? 'left' : 'right';
        const dx = clamp(w * 0.07, 22, 60);
        item.side = side;
        item.x = side === 'left' ? ax - dx - item.w : ax + dx;
        item.y = ay - item.h / 2 - 10;
        placed[side].push(item);
      }
    }
    // Resolve overlaps on each side by pushing labels down.
    for (const side of ['left', 'right']) {
      const list = placed[side].sort((a, b) => a.y - b.y);
      let minY = bounds.top + 4;
      for (const it of list) {
        it.y = Math.max(it.y, minY);
        minY = it.y + it.h + 6;
      }
      // If pushed past the bottom, shift the group up.
      const over = minY - (bounds.bottom - 4);
      if (over > 0) for (const it of list) it.y = Math.max(bounds.top + 4, it.y - over);
    }
    for (const [key, item] of this.items) {
      const show = seen.has(key) && item.visible;
      if (!show) {
        item.el.style.opacity = '0';
        item.line.style.display = 'none';
        item.dot.style.display = 'none';
        continue;
      }
      const x = clamp(item.x, 6, w - item.w - 6);
      const y = clamp(item.y, bounds.top + 2, Math.max(bounds.top + 2, bounds.bottom - item.h - 2));
      item.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      item.el.style.opacity = String(item.alpha);
      if (item.center) {
        item.line.style.display = 'none';
        item.dot.style.display = 'none';
        continue;
      }
      const ex = item.side === 'left' ? x + item.w : x;
      const ey = y + item.h / 2;
      item.line.setAttribute('x1', item.ax.toFixed(1));
      item.line.setAttribute('y1', item.ay.toFixed(1));
      item.line.setAttribute('x2', ex.toFixed(1));
      item.line.setAttribute('y2', ey.toFixed(1));
      item.line.style.display = '';
      item.line.style.opacity = String(item.alpha);
      item.dot.setAttribute('cx', item.ax.toFixed(1));
      item.dot.setAttribute('cy', item.ay.toFixed(1));
      item.dot.style.display = '';
      item.dot.style.opacity = String(item.alpha);
    }
  }
}

export class Meters {
  constructor(container, defs) {
    this.container = container;
    this.defs = defs;
    this.keys = '';
    this.fills = {};
  }
  set(keys = []) {
    const sig = keys.join(',');
    if (sig === this.keys) return;
    this.keys = sig;
    this.container.innerHTML = '';
    this.fills = {};
    for (const k of keys) {
      const d = this.defs[k];
      const el = document.createElement('div');
      el.className = 'meter' + (k === 'mEffort' ? ' hot' : '');
      el.innerHTML = `<div class="m-ms"></div><div class="m-en"></div><div class="bar"><div class="fill"></div></div>`;
      el.querySelector('.m-ms').textContent = d.ms;
      el.querySelector('.m-en').textContent = d.en;
      this.container.appendChild(el);
      this.fills[k] = { fill: el.querySelector('.fill'), el };
    }
  }
  update(P) {
    for (const k in this.fills) {
      const v = clamp(P[k]);
      this.fills[k].fill.style.width = `${(v * 100).toFixed(1)}%`;
      if (k === 'mPressure') this.fills[k].el.classList.toggle('hot', v > 0.8);
    }
  }
}

// Scrolling waveform of the glottal opening (illustrative).
export class Scopes {
  constructor(container) {
    this.container = container;
    this.mode = '';
    this.items = [];
    this.buf = new Float32Array(240);
  }
  set(mode, defs) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.container.innerHTML = '';
    this.items = [];
    for (const d of defs) {
      const el = document.createElement('div');
      el.className = 'scope';
      el.innerHTML = `<div class="s-title"><b></b><span class="en"></span></div><canvas></canvas>`;
      el.querySelector('b').textContent = d.ms;
      el.querySelector('.en').textContent = d.en;
      this.container.appendChild(el);
      this.items.push({ el, canvas: el.querySelector('canvas'), source: d.source, color: d.color });
    }
  }
  update(activeIndex = -1) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.items.forEach((it, idx) => {
      it.el.classList.toggle('active', idx === activeIndex);
      const c = it.canvas;
      const w = Math.round(c.clientWidth * dpr);
      const h = Math.round(c.clientHeight * dpr);
      if (!w || !h) return;
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      const g = c.getContext('2d');
      g.clearRect(0, 0, w, h);
      // Baseline grid.
      g.strokeStyle = 'rgba(143,200,255,0.12)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, h - 4 * dpr);
      g.lineTo(w, h - 4 * dpr);
      g.stroke();
      const data = it.source.getHistory(this.buf);
      g.strokeStyle = it.color;
      g.lineWidth = 1.8 * dpr;
      g.shadowColor = it.color;
      g.shadowBlur = 8 * dpr;
      g.beginPath();
      const n = data.length;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w;
        const y = h - 4 * dpr - clamp(data[i] / 1.1) * (h - 10 * dpr);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
    });
  }
}
