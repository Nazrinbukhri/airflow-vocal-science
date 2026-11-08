# ROADMAP – CHESS MASTER AI · Aggressive Chess Academy

> **Zero to Hero – Master the art of attacking chess.**

Learner profile: absolute beginner · aggressive (but sound) style · 48-hour resumable programme ·
Bahasa Melayu with English chess terms · Windows 11 and iPhone Safari (PWA).

Every phase ends with: tests → fixes → verification → docs → commit.

Status: ✅ done · ⚠️ done with a noted limitation

| # | Phase | Status | Highlights |
| --- | --- | --- | --- |
| 1 | Setup, responsive shell, PWA | ✅ | Next.js static export, Tailwind, emerald/charcoal/gold theme, sidebar + bottom nav, manifest/icons, offline service worker, IndexedDB progress |
| 2 | Chessboard and legal rules | ✅ | Pointer Events board (mouse/touch/pen/keyboard), legal highlights, promotion, undo/redo, FEN/PGN import-export |
| 3 | Stockfish WebAssembly | ✅ | Stockfish 19 lite in a Web Worker, typed UCI client, MultiPV, depth/status, cancellation, idle shutdown, 8 play levels, works offline |
| 4 | AI prediction and coach | ✅ | Threat search, 7-question checklist, 3 candidates with reasons/risks/two replies, categories A–D, aggressive recommendation, progressive hints, move verdicts |
| 5 | Beginner curriculum | ✅ | 15 fundamentals lessons (the 14 required + notation), Explain → Show → Practice → Test → Review |
| 6 | Opening Academy | ✅ | Italian, Sicilian, King's Indian: main lines, variations (unlocked after the main line), traps; Show + Practice |
| 7 | Tactics and formations | ✅ | ≥100 engine-verified puzzles (4 levels), 15 formations with exercises, 6 attack-and-defence lessons |
| 8 | Grandmaster study and game analysis | ⚠️ | 5 annotated games (Fischer ×2, Kasparov, Carlsen, Tal) with guess-the-move; Polgár and Nakamura listed with profiles only (scores could not be verified online from the build sandbox); full game review with configurable thresholds |
| 9 | 48-hour tracker | ✅ | Session → activity links, study timer with break reminders, Day-1 test, final challenge, performance report |
| 10 | Mobile, performance, security, deployment | ⚠️ | E2E on desktop + iPhone emulation incl. offline and CSP; host header files; real-device Safari check remains manual (see TESTING.md) |

## Acceptance criteria

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A complete beginner can understand the first lesson | ✅ | Lesson f01 in Malay, terms explained; E2E completes it |
| 2 | All chess moves are legally validated | ✅ | chess.js only; board offers only legal moves; tests |
| 3 | The board works on Windows and iPhone | ✅ / manual | E2E mouse, drag, keyboard, iPhone touch + drag; real Safari checklist |
| 4 | Stockfish returns real analysis | ✅ | Real-engine tests in Node; E2E in browser and offline |
| 5 | MultiPV displays alternative moves | ✅ | Analysis/prediction panels, 1–5 lines; E2E |
| 6 | The AI explains tactical threats | ✅ | Coach threat search; tests + E2E (Qxf7 threat) |
| 7 | Opening lessons work interactively | ✅ | Practice mode; E2E plays the full Italian main line |
| 8 | Tactical puzzles have valid solutions | ✅ | Generator + test re-verification with Stockfish |
| 9 | Progress is saved | ✅ | IndexedDB; E2E reload checks |
| 10 | The 48-hour curriculum can be resumed | ✅ | Resume card + timer + E2E |
| 11 | PGN and FEN import work | ✅ | Unit + E2E |
| 12 | The final assessment generates a meaningful report | ✅ | Assessment + report (tested), downloadable |

## Next steps

1. Add verified game scores for Judit Polgár and Hikaru Nakamura once a game database can be reached (allow `www.chessgames.com` in the environment, or supply PGNs).
2. Run the manual iPhone Safari / Windows checklist on real devices.
3. Optional: multi-threaded Stockfish on hosts that can send COOP/COEP headers (stronger, larger download).
4. Optional: more puzzles (`npx tsx scripts/puzzles/generate.ts --append --seed=<n> --extra=<k>`).
