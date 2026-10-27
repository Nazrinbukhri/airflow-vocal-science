# THE SCIENCE OF VOICE
### How Air Becomes Sound · *Sains Suara: Bagaimana Udara Menjadi Bunyi*

An interactive, mobile-friendly 3D scientific animation that follows air from the lungs, up the trachea and through the vibrating vocal folds, and explains how that becomes voice. Narration, subtitles and anatomical labels are in **Malay**, with optional **English**.

> ⚠️ **Illustrative models only.** Every visual here is a simplified, anatomically inspired 3D model. It is **not** medical imaging (laryngoscopy, CT, MRI) and **not** a diagnostic tool. If hoarseness lasts more than 3–4 weeks, see a doctor (ENT specialist).

---

## What's inside

**10 scenes, about 3½ minutes:**

| # | Babak (Malay) | Scene (English) | What you see |
|---|---|---|---|
| 1 | Sistem Pernafasan | The Respiratory System | Semi-transparent torso, lungs, bronchi, trachea, larynx, vocal tract |
| 2 | Aliran Udara | Airflow | Blue particles travel from the lungs up the trachea |
| 3 | Menuju ke Laring | Into the Larynx | Camera zooms into the larynx: thyroid, cricoid, epiglottis, hyoid |
| 4 | Lipatan Vokal | The Vocal Folds | Laryngoscope-style top view; folds open for breathing |
| 5 | Getaran Lipatan Vokal | Vocal-Fold Vibration | Folds close, pressure builds, folds vibrate (mucosal wave), sound rings, glottal-opening graph |
| 6 | Pic Bukan Sekadar Tekanan Udara | Pitch Is Not Just Air Pressure | Folds stretch and vibrate faster while air pressure stays almost the same |
| 7 | Resonans | Resonance | Sound waves travel through the pharynx and mouth (source–filter idea) |
| 8 | Getaran Stabil vs Tidak Teratur | Stable vs Irregular Vibration | Side-by-side models and graphs (illustrative) |
| 9 | Usaha Berlebihan & Bacaan Al-Quran Bernada Tinggi | Excessive Effort & High-Pitched Quran Recitation | Balanced high pitch vs pressed folds and squeezing false folds |
| 10 | Ringkasan & Nasihat Kesihatan | Summary & Health Advice | Recap and medical warning |

**Controls (touch-friendly):** Play/Pause · Restart · Next Scene · timeline with chapter marks · speed (0.25×–2×) · chapter list · info panel · EN subtitle toggle · optional synthesized sound.
**Gestures:** drag to rotate · pinch to zoom · double-tap to reset the view.
**Keyboard:** Space = play/pause, → = next scene, ← = previous.

### Science notes built into the animation
- **Airflow** = the energy source. **Vocal-fold vibration** = turns steady airflow into sound pulses. **Pitch** = vibration rate, set mainly by fold length, tension and thickness. **Resonance** = the vocal tract shaping the sound.
- High pitch **does not always** require greater air pressure; pressure mainly affects loudness.
- Excessive effort *may contribute* to a rough voice during high-pitched recitation — but **not all** hoarseness at high pitch is caused by strain (infection, reflux, nodules, polyps, nerve problems, fatigue, etc.).
- The larynx is enlarged for visibility and vibration is shown in slow motion (real folds vibrate roughly 100–250 times per second in speech).

---

## 📱 Preview on iPhone

The site is a plain static website (no build step, no backend, no API keys). It needs a web address — opening `index.html` straight from the Files app will not work, because browsers block 3D modules loaded from local files.

**Option A — after GitHub Pages is on (recommended):** open
**https://nazrinbukhri.github.io/airflow-vocal-science/** in Safari.

Tips:
- Tap **Mula / Start**. Tick *Hidupkan bunyi sintetik* first if you want sound.
- Sound not playing? Check the volume, and on older iOS versions turn off the silent switch.
- Rotate the phone for the landscape layout.
- Add to Home Screen (Share → *Add to Home Screen*) for a full-screen, app-like view.
- Open a specific moment with `#t=` — e.g. `…/airflow-vocal-science/#t=56` opens scene 5 paused.

**Option B — on a computer (optional):** in the project folder run `python3 -m http.server 8000` and open `http://localhost:8000`.

## 🌐 Publish with GitHub Pages (from iPhone Safari)

1. Open **github.com/Nazrinbukhri/airflow-vocal-science** in Safari and sign in. (If you see the mobile layout, tap **⋯ → Desktop site**/**aA → Request Desktop Website** to see all settings.)
2. Make sure the app files (`index.html`, `css/`, `js/`, `vendor/`) are on the branch you want to publish — normally **main** (merge the pull request first if the files are on another branch).
3. Tap **Settings** (top of the repo) → **Pages** (left menu, under *Code and automation*).
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Under **Branch**, choose **main** and folder **/ (root)**, then tap **Save**.
6. Wait 1–2 minutes and refresh the Pages settings page. When it shows *"Your site is live at …"*, open **https://nazrinbukhri.github.io/airflow-vocal-science/**.

Each later push to that branch republishes the site automatically.

---

## Project structure

```
index.html          Page structure, overlays, info & chapter panels
css/style.css       Dark cinematic, responsive (portrait + landscape) styling
js/main.js          Renderer, timeline playback, camera, touch controls, UI wiring
js/scenes.js        Scene script: timing, camera moves, labels, Malay/English narration
js/anatomy.js       Torso, lungs, bronchial tree, trachea, larynx, vocal tract, airflow particles
js/vocalFolds.js    Vocal-fold model: vibration, mucosal wave, glottal airflow, sound rings
js/materials.js     Hologram (fresnel) and glowing-particle shaders
js/ui.js            3D-anchored labels, meters, waveform graphs
js/audio.js         Optional source–filter voice synthesizer (Web Audio)
js/utils.js         Easing, keyframes, seeded random
vendor/             Three.js r170 (MIT) bundled locally
assets/icon.svg     App icon
```

### Editing the narration
All text lives in **`js/scenes.js`**. Each scene has `title`, `desc`, timed `subs` (`ms` = Malay, `en` = English), `labels`, camera `cam` keys and animation `keys`. Label names are in `LABELS` at the top of the same file. Change the text, commit, and GitHub Pages updates automatically.

### Why Three.js is bundled instead of loaded from a CDN
Three.js (`vendor/three.module.min.js`, MIT licence, unmodified r170 build) is served from this repository so the site works without depending on a third-party CDN and without import maps, which improves compatibility with iPhone Safari. To use a CDN instead, replace `'../vendor/three.module.min.js'` in the `js/*.js` imports with `'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'`.

### Requirements
A browser with WebGL 2: iPhone/iPad with iOS 15 or newer (Safari or Chrome), or any current desktop browser.

---

## Disclaimer · Penafian
Untuk pendidikan sahaja; bukan pengganti nasihat perubatan. Model 3D ialah ilustrasi, bukan imej perubatan sebenar. Jika suara serak berterusan lebih daripada 3–4 minggu, atau disertai kesukaran bernafas, sakit menelan, batuk berdarah atau benjolan di leher, dapatkan pemeriksaan doktor (pakar ENT).

For education only; not a substitute for medical advice. The 3D models are illustrations, not actual medical imaging. If hoarseness persists for more than 3–4 weeks, or comes with breathing difficulty, painful swallowing, coughing blood or a neck lump, seek medical evaluation (ENT specialist).
