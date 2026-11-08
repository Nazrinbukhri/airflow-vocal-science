# Architecture

## Overview

```
Next.js 16 (App Router, output: 'export')  →  static HTML/JS/CSS/WASM in out/
 ├─ src/app/<page>/page.tsx         11 pages (server components wrapping client views)
 ├─ src/components/                  board, workbench, coach, engine panel, lessons, tactics, …
 ├─ src/lib/chess/                   chess.js wrappers: GameController, FEN checks, move descriptions
 ├─ src/lib/engine/                  Stockfish UCI client, Web Worker transport, strength levels
 ├─ src/lib/coach/                   static board facts + engine pipeline → Malay coaching report
 ├─ src/lib/openings/                repertoire data + opening book lookup
 ├─ src/lib/tactics/                 puzzle types, theme detectors, puzzles.json (generated + verified)
 ├─ src/lib/formations/              pawn-structure analysis + 15 formation lessons
 ├─ src/lib/lessons/                 lesson content (fundamentals, attack, endgame) + exercise model
 ├─ src/lib/analysis/                move classification + full game review
 ├─ src/lib/assessment/              Day-1 test, final challenge, performance report
 ├─ src/lib/masterclass/             annotated grandmaster games
 ├─ src/lib/curriculum/              48-hour programme and session → activity links
 ├─ src/lib/storage/                 IndexedDB (idb) with in-memory fallback
 ├─ public/engine/                   Stockfish 19 lite single-threaded (.js + .wasm + GPL licence), copied from npm
 ├─ public/sw.js                     service worker template (precache list injected at build)
 └─ scripts/                         build-sw, serve, security headers, icon renderer, puzzle generator, E2E test
```

Everything runs in the browser; there is no backend.

## Key decisions

| Decision | Why |
| --- | --- |
| Static export | Works offline as a PWA, no server cost, any static host. |
| Custom chessboard | One Pointer Events code path for mouse, touch and pen; iPhone specifics (`touch-action: none` only on draggable boards, no long-press callout, piece lifted above the finger). |
| chess.js is the only source of legality | The board only offers moves from `legalMoves`; nothing else changes the position. |
| Stockfish **lite single-threaded** WASM | ~1.8 MB, needs no `SharedArrayBuffer`/cross-origin isolation, so it runs on iPhone Safari and any static host. |
| One shared engine worker | Ref-counted; terminated after 60 s idle. Searches are serialised; a new request stops the previous one (`stop`) and waits for its `bestmove`, so output is never attributed to the wrong position. |
| Rule-based coach (no LLM) | Explanations are generated from chess.js facts + Stockfish lines. No API key; every move named comes from the engine or the rules. |
| Puzzles generated offline and verified | `scripts/puzzles/generate.ts` builds candidates from tactical templates and keeps only those Stockfish confirms; tests re-verify all of them. |
| IndexedDB | Durable on Safari/Chrome/Edge; `navigator.storage.persist()` requested; memory fallback. |
| Hand-written service worker | Precaches every exported file (pages, RSC payloads, pieces, fonts, engine). Navigations network-first (3.5 s) with cache fallback; `/_next/static` cache-first; others stale-while-revalidate. |

## Engine layer (`src/lib/engine`)

- `uci.ts` – parse `info … multipv … score … pv`, `bestmove`; score conversion (side-to-move ↔ White), formatting, PV → SAN.
- `engine.ts` – `Engine` class over a `Transport` (Worker in the browser, npm engine in Node tests). `analyse(fen, {depth|movetime, multiPv, skill, searchMoves, signal, onUpdate})`. Lines for a depth are published only when all MultiPV lines of that depth arrived. Waiters are registered **before** sending a command because the engine can answer synchronously.
- `strength.ts` – 8 playing levels. Levels 1–3 pick randomly among moves within a centipawn margin of the best (deliberately weak for beginners); 4–8 use UCI `Skill Level`. No Elo is claimed.
- `browser.ts` – Worker transport (`/engine/stockfish.js`), shared instance, idle shutdown.

## Coach (`src/lib/coach`)

1. `facts.ts`: hanging pieces, free captures, forks/double attacks, discovered attacks, king safety, null-move FEN.
2. `run.ts`: Stockfish MultiPV 4 on the position → null-move search (what the opponent threatens) → MultiPV 2 replies after each of the top 3 candidates.
3. `report.ts`: builds WHAT HAPPENED / situation / threats / 7-question checklist / 3 candidates (why, attacks, protects, threatens, benefits, risks, two replies) / categories A–D / aggressive recommendation / progressive hints.
   - **A** best engine move; **B** most aggressive move within 100 cp of the best and not losing; **C** only from the app's own opening book – otherwise "no data" (no invented statistics); **D** most defensive move within 100 cp.

## Verification strategy for content

| Content | Verified by |
| --- | --- |
| Opening lines | Replayed with chess.js; trap outcomes checked (mate on board / Stockfish eval). |
| Puzzles | Generator: legal FEN, side to move not in check, Stockfish best by ≥150 cp (or forced mate), theme detector, outcome realised. Tests: replay + theme + mate/material + Stockfish re-check of the first move. |
| Formations | Highlights and answers computed by pawn-structure functions; engine-judged answers within tolerance. |
| Lessons | Every FEN legal, every accepted move legal, every mate exercise has a mate in one; engine tolerance where judged. |
| GM games | Legal, documented move count, key moves at documented plies, checkmate positions are mate, resignation positions decisive for Stockfish. |

## Persistence keys

| Store / key | Content |
| --- | --- |
| `progress` | per-session status, timestamps, minutes |
| `settings` → `game:play`, `game:analysis`, `game:coach` | saved games (full line + cursor) |
| `settings` → `play:settings`, `play:results` | AI game settings and results |
| `settings` → `lessons:results`, `tactics:results`, `openings:done`, `formations:done` | learning results |
| `settings` → `assessment:day1`, `assessment:final`, `review:history`, `review:thresholds` | assessments and reviews |
| `settings` → `timer:active` | running study timer |

## Security

Static site, no third-party requests, no secrets. `out/_headers` / `out/vercel.json` and the local server send
CSP (`default-src 'self'`, `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`, `frame-ancestors 'none'`, …),
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options`. `'unsafe-inline'` scripts are
required by Next.js static export (inline RSC payloads; nonces need a server).
