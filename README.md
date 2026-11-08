# CHESS MASTER AI – Aggressive Chess Academy

**ZERO TO HERO – MASTER THE ART OF ATTACKING CHESS.**

A chess school for absolute beginners, taught in Bahasa Melayu with English chess terms
alongside (Knight = Kuda, Bishop = Gajah, Rook = Benteng, Queen = Menteri, King = Raja, Pawn = Pion).
It runs in any modern browser on Windows 11 and on iPhone Safari, installs as a PWA, and works offline.

No accounts, no paid services, no API keys. All chess rules come from
[chess.js](https://github.com/jhlywa/chess.js); all engine analysis comes from Stockfish running in your browser.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 (service worker disabled in dev)
npm run build        # static export to ./out + offline service worker
npm start            # serve ./out on http://localhost:3000
```

Requires Node.js 20+.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production static export (`out/`) and service-worker precache list |
| `npm start` | Serve `out/` locally (`-- --port 8080` to change port) |
| `npm test` | Unit + component tests (Vitest) |
| `npm run test:e2e` | End-to-end smoke test on the built site (desktop + iPhone emulation) – run `npm run build` first |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run icons` | Re-render PWA PNG icons from `scripts/icons/*.svg` |

## Documentation

- [ROADMAP.md](ROADMAP.md) – phases and acceptance criteria status
- [ARCHITECTURE.md](ARCHITECTURE.md) – how the app is built
- [TESTING.md](TESTING.md) – automated tests and the manual device checklist
- [TRAINING_CURRICULUM.md](TRAINING_CURRICULUM.md) – the 48-hour programme

## Credits and licences

- Chess rules: chess.js (BSD-2-Clause).
- Piece artwork: Colin M.L. Burnett ("cburnett"), used under its BSD licence – see `public/pieces/LICENSE.txt`.
- Fonts: Inter and Playfair Display (SIL Open Font License), bundled via Fontsource.
