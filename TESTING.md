# Testing

## Automated

```bash
npm test                              # Vitest: unit, component and real-engine tests
npm run lint && npm run typecheck
npm run build && npm run test:e2e     # Playwright + Chromium against the real static build
```

Several suites start the **real Stockfish 19 WASM engine in Node** (via the `stockfish` npm package) – nothing is mocked.

### Unit / component / engine (Vitest)

| Area | File | What is checked |
| --- | --- | --- |
| Rules | `lib/chess/*.test.ts` | FEN validation (incl. side-not-to-move in check), legality, pins, castling (incl. through check), en passant, promotion, checkmate, stalemate, insufficient material, threefold, 50-move rule, undo/redo/goTo, FEN/PGN round-trip, Malay move descriptions, board geometry |
| Board | `components/board/Chessboard.test.tsx` | 64 squares, tap-to-move, illegal taps ignored, promotion dialog, read-only mode, pointer taps |
| Engine | `lib/engine/engine.test.ts` | UCI parsing, score perspective, mate-in-1 with MultiPV, checkmated positions, abort mid-search then reuse, all playing levels return legal moves |
| Coach | `lib/coach/coach.test.ts` | hanging pieces, forks, discovered attacks, null-move, king safety; Scholar's-mate threat detected and every candidate parries it; fork recommended; category C "no data" honesty |
| Openings | `lib/openings/openings.test.ts` | every line legal and explained; mating traps end in mate; other trap claims checked with Stockfish; book lookup |
| Puzzles | `lib/tactics/puzzles.test.ts` | ≥100 puzzles, 4 levels, required themes; each: legal FEN, legal solution and accepted alternatives, theme really present, mate/material realised; Stockfish re-check of every first move |
| Formations | `lib/formations/formations.test.ts` | pawn-structure functions; 15 formations; computed answers; engine tolerance for judged answers |
| Lessons | `lib/lessons/lessons.test.ts` | 14 required beginner topics in order + notation; every FEN legal, accepted moves legal, mate exercises have a mate; engine tolerance |
| GM games | `lib/masterclass/games.test.ts` | legal moves, documented length, key moves at documented plies, final mate is mate, resignation positions decisive |
| Review | `lib/analysis/review.test.ts` | thresholds, centipawn loss, accuracy curve, phases, missed win; real engine finds …Nf6?? in Scholar's mate |
| Programme | `lib/curriculum/programme.test.ts` | 48 sessions, hour ranges match the brief, every session has activities pointing to real pages/lessons |
| Storage | `lib/storage/progress.test.ts` | IndexedDB and memory fallback; persistence across reopen |
| Report | `lib/assessment/report.test.ts` | assessments solvable; report scoring, strengths/weaknesses, recommendations |

### End-to-end (`scripts/e2e-smoke.mjs`)

Runs the production build through `scripts/serve.mjs` **with the production security headers (CSP)**.

Desktop 1366×768: all pages render without console errors; sidebar; click and mouse-drag moves; illegal drop rejected;
undo/redo; reload restores the game; play vs Stockfish (engine replies, undo pair); live analysis finds mate in one with 3 lines;
PGN import to checkmate; bad FEN error; coach (threat, candidates, A–D, recommendation); opening practice of the full Italian main line
unlocks variations; lesson flow with saved score; a puzzle solved by playing its solution; formation exercise; masterclass notes;
attack lesson; full game review finds the blunder; Day-1 assessment + performance report; progress resume; study timer;
PWA manifest + service worker; pages, board **and Stockfish work offline**.

iPhone 13 emulation (touch): every page without horizontal scroll; bottom nav; "Lagi" sheet; tap and finger-drag moves;
square finder and piece explorer.

Set `SCREENSHOTS=some/dir` to save screenshots.

## Manual device checklist (before each release)

Chromium emulation is not Safari – check real devices.

**iPhone (Safari, iOS 16+)**
- [ ] Share → Add to Home Screen; launch from the icon (standalone).
- [ ] Board: tap–tap, finger drag, promotion dialog; the page does not scroll while dragging a piece.
- [ ] Bottom nav and "Lagi" sheet clear the home indicator.
- [ ] Lawan AI: Stockfish answers within a few seconds at level 1–4.
- [ ] Aeroplane mode → relaunch: dashboard, lessons, puzzles, board and Stockfish still work.
- [ ] Progress is still there after closing and reopening the app.

**Windows 11 (Edge, Chrome, Firefox)**
- [ ] Mouse click and drag; keyboard: Tab to a square, Enter to select/move, Esc to cancel.
- [ ] Install from the address bar (Edge/Chrome); app opens in its own window.
- [ ] DevTools → Network → Offline, reload: works.

## Known gaps

- No automated run on real WebKit/Safari in this environment (only Chromium is installed); see the manual checklist.
- Puzzle verification uses Stockfish lite at moderate depth; it is strong enough for these tactics but is not a tablebase proof.
