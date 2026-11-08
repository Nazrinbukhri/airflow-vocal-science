# CHESS MASTER AI – Aggressive Chess Academy

**ZERO TO HERO – MASTER THE ART OF ATTACKING CHESS.**

A complete chess school for absolute beginners, taught in **Bahasa Melayu** with English chess terms
alongside (Knight = Kuda, Bishop = Gajah, Rook = Benteng, Queen = Menteri, King = Raja, Pawn = Pion).
It runs in any modern browser on **Windows 11** and **iPhone Safari**, installs as a **PWA**, and works **offline** –
including the Stockfish engine.

No accounts, no paid services, no API keys, no server. Chess rules come from
[chess.js](https://github.com/jhlywa/chess.js); analysis comes from **Stockfish 19** (WebAssembly) running in your browser.

## What is inside

| Page | What it does |
| --- | --- |
| Papan Utama (Dashboard) | Progress, "continue" card, 48-hour overview, module status |
| Mula Belajar (Start Learning) | 48 sessions with activity links, 45-minute study timer with break reminders, resume anywhere |
| Asas Catur (Fundamentals) | 15 beginner lessons (14 from the brief + notation) and 5 endgame lessons, each **Explain → Show → Practice → Test → Review**; square-finder and piece-explorer drills |
| Akademi Pembukaan (Openings) | Italian Game, Sicilian Defence, King's Indian Defence – main lines, variations, traps; Show and Practice modes |
| Taktik Agresif (Tactics) | ≥100 engine-verified puzzles in 4 levels with progressive hints, wrong-move explanations; 6 attack-and-defence lessons |
| Perpustakaan Formasi (Formations) | 15 pawn structures/attacking formations with boards, plans and an exercise each |
| Ramalan AI (AI Prediction & Coach) | Stockfish MultiPV 3–5, eval bar, depth/status; coach with threats, 7-question checklist, 3 candidates, categories A–D, progressive hints |
| Lawan AI (Play) | Play Stockfish at 8 levels (1–3 deliberately weakened for beginners) or two-player; optional coach and engine panel |
| Kelas Grandmaster (Masterclass) | Annotated attacking games (Fischer, Kasparov, Carlsen, Tal) with guess-the-move |
| Analisis Permainan (Analysis) | PGN/FEN import, live engine, full game review (accuracy, inaccuracies/mistakes/blunders with configurable thresholds, missed wins/tactics, phase performance) |
| Kemajuan Saya (Progress) | Day-1 test, final challenge, performance report (downloadable) |

## Quick start (developers)

```bash
npm install          # also copies the Stockfish engine into public/engine
npm run dev          # http://localhost:3000 (service worker disabled in dev)
npm run build        # static export to ./out + offline service worker + host header files
npm start            # serve ./out on http://localhost:3000 (with security headers)
```

Requires Node.js 20+.

| Script | What it does |
| --- | --- |
| `npm test` | Unit, component and real-engine tests (Vitest) |
| `npm run test:e2e` | End-to-end test of the built site (desktop + iPhone emulation, offline) – run `npm run build` first |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npx tsx scripts/puzzles/generate.ts --out=a.json` then `node scripts/puzzles/merge.mjs src/lib/tactics/puzzles.json a.json …` | Generate engine-verified puzzles (slow; options `--only=fork/2,pin/2`, `--seed=N`, `--extra=K`) and merge files (dedupe, renumber, mate-aware wording) |
| `npm run icons` | Re-render PWA icons |

## Deployment

The build is a folder of static files (`out/`). Any static host works; HTTPS is required for the PWA and service worker.

- **Netlify / Cloudflare Pages:** build command `npm run build`, publish directory `out`. The build writes `out/_headers` (security headers, caching).
- **Vercel:** framework "Other", build `npm run build`, output `out`. `out/vercel.json` carries the headers.
- **GitHub Pages / S3 / any web server:** upload the contents of `out/`. Serve `.wasm` as `application/wasm` and `.webmanifest` as `application/manifest+json`. Do not cache `sw.js`.
- **Local network test:** `npm start -- --port 8080`, then open `http://<computer-ip>:8080` (note: browsers only enable the service worker/PWA over HTTPS or on `localhost`).

No environment variables or secrets are needed.

## Using it on your devices

**iPhone (Safari, iOS 16 or newer)**
1. Open the deployed HTTPS address in Safari.
2. Tap **Share → Add to Home Screen**. Launch "Chess Master" from the home screen – it opens full-screen.
3. Open each module once while online; after that lessons, puzzles, openings and Stockfish also work in Aeroplane mode.
4. Progress is stored on the phone (IndexedDB). It survives closing the app; deleting the home-screen app or clearing Safari website data removes it.

**Windows 11 (Edge or Chrome)**
1. Open the address. Click the **Install** icon in the address bar (or menu → Apps → Install this site as an app).
2. The app gets its own window and Start-menu entry, and works offline after the first visit.
3. Mouse: click–click or drag pieces. Keyboard: Tab to a square, Enter to pick up and to drop, Esc to cancel.

## Credits and licences

- Chess rules: chess.js (BSD-2-Clause).
- Engine: **Stockfish 19** via [stockfish.js](https://github.com/nmrugg/stockfish.js) (lite, single-threaded WASM). Stockfish is **GPL-3.0**; its licence text ships next to the engine as `engine/COPYING.txt`, and the engine's source is available from the Stockfish and stockfish.js projects. If you redistribute this app, you must comply with the GPL for the engine files (offer the corresponding source); the simplest route is to publish this project under a GPL-compatible licence.
- Piece artwork: Colin M.L. Burnett ("cburnett"), used under its BSD licence – see `public/pieces/LICENSE.txt`.
- Fonts: Inter and Playfair Display (SIL Open Font License), bundled via Fontsource.

## Documentation

- [ROADMAP.md](ROADMAP.md) – phases and acceptance criteria status
- [ARCHITECTURE.md](ARCHITECTURE.md) – how the app is built
- [TESTING.md](TESTING.md) – automated tests and the manual device checklist
- [TRAINING_CURRICULUM.md](TRAINING_CURRICULUM.md) – the 48-hour programme
