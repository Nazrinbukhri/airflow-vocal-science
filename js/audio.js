// Optional synthesized voice-like sound (Web Audio API).
// A simple source–filter model: a buzzy glottal-like source (the
// "vocal folds") passed through vowel formant filters (the "vocal
// tract"). Roughness adds random cycle-to-cycle pitch and loudness
// changes (jitter / shimmer), a sub-harmonic and noise.
// It is an illustration only, not a recording of a real voice.

function harmonicWave(ctx, tilt) {
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = 1 / Math.pow(k, tilt);
  return ctx.createPeriodicWave(real, imag);
}

export class VoiceSynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.target = { on: 0, f0: 140, rough: 0, bright: 0 };
  }

  // Must be called from a user gesture (tap) on iPhone.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        // Lets sound play even when the iPhone ring/silent switch is on
        // (Safari 16.4+). Ignored elsewhere.
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch (e) { /* not supported */ }
      this.ctx = new AC();
      this.#build();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  #build() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    this.master.connect(comp).connect(lp).connect(ctx.destination);

    // Source.
    this.srcGain = ctx.createGain();
    this.oscDull = ctx.createOscillator();
    this.oscDull.setPeriodicWave(harmonicWave(ctx, 1.35));
    this.oscBright = ctx.createOscillator();
    this.oscBright.setPeriodicWave(harmonicWave(ctx, 0.85));
    this.gDull = ctx.createGain();
    this.gBright = ctx.createGain();
    this.gBright.gain.value = 0;
    this.oscDull.connect(this.gDull).connect(this.srcGain);
    this.oscBright.connect(this.gBright).connect(this.srcGain);
    this.sub = ctx.createOscillator();
    this.sub.setPeriodicWave(harmonicWave(ctx, 1.2));
    this.gSub = ctx.createGain();
    this.gSub.gain.value = 0;
    this.sub.connect(this.gSub).connect(this.srcGain);

    // Noise (breathiness / roughness).
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buf;
    this.noise.loop = true;
    const nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass';
    nbp.frequency.value = 2200;
    nbp.Q.value = 0.6;
    this.gNoise = ctx.createGain();
    this.gNoise.gain.value = 0;
    this.noise.connect(nbp).connect(this.gNoise).connect(this.srcGain);

    // Vocal tract: vowel /a/ formants.
    const formants = [[750, 1, 7], [1200, 0.5, 9], [2600, 0.28, 12], [3400, 0.12, 14]];
    for (const [f, gain, q] of formants) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = gain * 3.2;
      this.srcGain.connect(bp).connect(g).connect(this.master);
    }
    const direct = ctx.createGain();
    direct.gain.value = 0.06;
    this.srcGain.connect(direct).connect(this.master);

    const t = ctx.currentTime;
    this.oscDull.start(t);
    this.oscBright.start(t);
    this.sub.start(t);
    this.noise.start(t);

    // Cycle-to-cycle irregularity, updated every few milliseconds.
    this.timer = setInterval(() => this.#tick(), 30);
  }

  #tick() {
    if (!this.ctx) return;
    const { f0, rough, bright } = this.target;
    const t = this.ctx.currentTime;
    const jitter = 1 + (Math.random() - 0.5) * 0.14 * rough;
    const f = f0 * jitter;
    this.oscDull.frequency.setTargetAtTime(f, t, 0.006);
    this.oscBright.frequency.setTargetAtTime(f, t, 0.006);
    this.sub.frequency.setTargetAtTime(f / 2, t, 0.006);
    const shimmer = 1 - Math.random() * 0.55 * rough;
    this.srcGain.gain.setTargetAtTime(shimmer, t, 0.008);
    this.gDull.gain.setTargetAtTime(1 - 0.6 * bright, t, 0.05);
    this.gBright.gain.setTargetAtTime(0.8 * bright, t, 0.05);
    this.gSub.gain.setTargetAtTime(0.4 * rough, t, 0.05);
    this.gNoise.gain.setTargetAtTime(0.25 * rough, t, 0.05);
  }

  update({ on, f0, rough, bright }) {
    this.target = { on, f0, rough, bright };
    if (!this.ctx) return;
    const level = this.enabled && on > 0.5 ? 0.22 : 0;
    this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.08);
  }
}
