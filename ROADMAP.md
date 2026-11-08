# ROADMAP – CHESS MASTER AI · Aggressive Chess Academy

> **Zero to Hero – Master the art of attacking chess.**

This roadmap turns the product brief into ten delivery phases. Each phase ends with the
same gate: **run tests → fix errors → verify functionality → update docs → commit.**

Learner profile the whole product is built around:

| Item | Value |
| --- | --- |
| Level | Absolute beginner (starts from zero) |
| Style | Aggressive – but sound: calculation, king safety, development first |
| Programme | 48 hours of structured study, resumable, split into short sessions |
| Language | Bahasa Melayu, with English chess terms introduced alongside |
| Platforms | Windows 11 (desktop browsers) and iPhone Safari (PWA) |

Status legend: ✅ done · 🚧 in progress · ⏳ planned

---

## Phase 1 – Project setup, responsive dashboard, PWA ✅

- Next.js (App Router, static export) + TypeScript + Tailwind CSS v4.
- Brand theme: emerald green, dark charcoal, gold accents; bundled fonts (Inter, Playfair Display) so typography also works offline.
- App shell: desktop sidebar, mobile bottom navigation with a "Lagi" (more) sheet, safe-area padding for iPhone.
- All 11 main pages routed: Dashboard, Mula Belajar, Asas Catur, Akademi Pembukaan, Taktik Agresif, Perpustakaan Formasi, Ramalan AI, Lawan AI, Kelas Grandmaster, Analisis Permainan, Kemajuan Saya. Pages for later phases say clearly what is coming – no fake content.
- 48-hour programme data model (16 blocks, 48 one-hour sessions, built-in breaks).
- IndexedDB persistence (with in-memory fallback) for progress and settings; "Sambung belajar" resume card.
- PWA: web manifest, PNG + maskable icons, apple-touch-icon, iOS meta tags, service worker that precaches every built page and asset for offline use.
- Unit tests (Vitest) for curriculum integrity and storage.

## Phase 2 – Chessboard and legal chess rules ✅

- Custom React chessboard (no paid or heavy dependency): click-to-move, drag-and-drop with Pointer Events (one code path for mouse, pen and touch), legal-move dots/rings, last-move and check highlights, coordinates, board flip, promotion picker, keyboard access.
- `GameController` on top of chess.js: legal validation, undo/redo with redo-stack truncation, restart, jump to any move, status (check, checkmate, stalemate, insufficient material, threefold repetition, 50-move rule).
- FEN import/export with extra validation (rejects "side not to move is in check"), PGN import/export (incl. `[FEN]`/`[SetUp]` headers).
- Free-play board on **Lawan AI** (two-player mode until Stockfish arrives) and PGN/FEN import on **Analisis Permainan**.
- Piece explorer on **Asas Catur** (each piece's legal moves on a real board).
- Unit + component tests; Playwright smoke test (desktop + iPhone viewport, click and drag moves, offline reload).

## Phase 3 – Stockfish WebAssembly ⏳

- Bundle the `stockfish` npm build (lite single-threaded WASM, works on iPhone Safari without SharedArrayBuffer/COOP headers). Multi-threaded build only where cross-origin isolation is available.
- Engine in a dedicated Web Worker; typed UCI wrapper (`uci`, `isready`, `ucinewgame`, `position fen … moves …`, `go depth|movetime`, `stop`, `setoption MultiPV`).
- Parse `info depth … multipv … score cp|mate … pv …` into typed lines; convert PV from UCI to SAN with chess.js.
- Analysis status (idle / thinking / depth N), cancellation when the position changes, engine-strength settings (Skill Level, UCI_LimitStrength/UCI_Elo).
- **Play vs Stockfish** with selectable level and colour.
- Tests: UCI parser unit tests with recorded engine output; integration test that runs the real WASM engine in Node and asserts a known mate-in-1 is found.

## Phase 4 – AI Prediction and candidate-move explanations ⏳

- MultiPV 3–5 lines with eval bar, depth, principal variations.
- Four categories: **A** best engine move, **B** aggressive alternative (best-scoring check/capture/threat within a configurable eval margin), **C** most common human move **only** from a bundled, cited opening book – otherwise shown as "tiada data", **D** defensive alternative.
- Rule-based explainer (no API key): what the move attacks, defends, threatens; hanging pieces; checks; forks; opponent's likely engine replies (shown as engine lines, never as certain human predictions).
- Coach flow: the 7-question thinking checklist and three candidate moves with reasons and risks; "pick a move → see consequences".

## Phase 5 – Beginner curriculum ⏳

- Lessons 1–14 (what is chess → draw conditions) with **EXPLAIN → SHOW → PRACTICE → TEST → REVIEW**.
- Gradual notation: square names → SAN → UCI.
- Glossary EN ↔ BM (Knight = Kuda, Bishop = Gajah, Rook = Benteng, Queen = Menteri, King = Raja, Pawn = Pion …).
- Progressive hints (threat → attacked pieces → candidate squares → solution with explanation).

## Phase 6 – Aggressive Opening Academy ⏳

- Opening principles first; then Italian Game (White), Sicilian Defence (Black vs 1.e4), King's Indian Defence (Black vs 1.d4).
- Move-by-move trainer that explains the purpose of every move; variations unlocked only after the main line is understood.

## Phase 7 – Tactics (100+ puzzles) and Formation Library ⏳

- ≥100 curated puzzles across Levels 1–4; each with objective, solution, wrong alternatives, best defence and follow-up.
- **Every puzzle is verified in CI**: FEN legal, every solution move legal, final position matches the claimed result (mate / material gain confirmed by Stockfish where relevant).
- 15 formations with interactive boards, attack/defence plans and an exercise each.

## Phase 8 – Grandmaster lessons and game analysis ⏳

- Curated attacking games by Kasparov, Fischer, Carlsen, Polgár, Tal, Nakamura. Game scores taken only from verifiable public records, with source citation, and replayed through chess.js in tests so every move is legal.
- Full game review: accuracy, best/inaccuracy/mistake/blunder with configurable centipawn-loss thresholds, missed wins, phase-by-phase performance.

## Phase 9 – 48-hour learning tracker ⏳

- Session timer with break reminders, resume from exact lesson step, per-block assessments, final challenge and performance report.

## Phase 10 – Mobile testing, performance, security, deployment ⏳

- Real-device checklist (iPhone Safari + home-screen PWA, Windows 11 Edge/Chrome/Firefox).
- Lighthouse PWA/performance pass; CSP; dependency audit; static deployment guide.

---

## Acceptance criteria tracker

| # | Criterion | Phase | Status |
| --- | --- | --- | --- |
| 1 | A complete beginner can understand the first lesson | 5 | ⏳ |
| 2 | All chess moves are legally validated | 2 | ✅ |
| 3 | Board works on Windows and iPhone | 2 / 10 | ✅ automated (Chromium desktop + iPhone emulation); real-device check in Phase 10 |
| 4 | Stockfish returns real analysis | 3 | ⏳ |
| 5 | MultiPV displays alternative moves | 4 | ⏳ |
| 6 | AI explains tactical threats | 4 | ⏳ |
| 7 | Opening lessons work interactively | 6 | ⏳ |
| 8 | Tactical puzzles have valid solutions | 7 | ⏳ |
| 9 | Progress is saved | 1 | ✅ |
| 10 | 48-hour curriculum can be resumed | 1 / 9 | ✅ resume card · full tracker in Phase 9 |
| 11 | PGN and FEN import work | 2 | ✅ |
| 12 | Final assessment generates a meaningful report | 9 | ⏳ |
