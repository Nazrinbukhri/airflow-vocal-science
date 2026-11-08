# Architecture

## Overview

```
Next.js (App Router, output: 'export')  →  static HTML/JS/CSS in out/
        │
        ├── src/app/…            one folder per page (11 pages), server components + client islands
        ├── src/components/…     board, workbench, shell, page views
        ├── src/lib/chess/…      rules & helpers on top of chess.js (pure TypeScript, unit-tested)
        ├── src/lib/curriculum/  48-hour programme data
        ├── src/lib/storage/     IndexedDB (idb) with in-memory fallback
        └── public/sw.js         offline service worker (precache list injected at build)
```

Everything runs in the browser. There is no backend, so the build can be hosted on any static host
(GitHub Pages, Netlify, Vercel, Cloudflare Pages, an S3 bucket, or `npm start`).

## Key decisions

| Decision | Why |
| --- | --- |
| Static export | Works offline as a PWA, no server cost, simple hosting. |
| Custom chessboard | One Pointer Events code path for mouse, touch and pen; full control over iPhone behaviour (`touch-action: none` only on draggable boards, no long-press callout, piece lifted above the finger while dragging). |
| chess.js is the only source of legality | The board only offers moves from `legalMoves`; `GameController` refuses anything chess.js rejects. |
| Extra FEN check | chess.js accepts positions where the side *not* to move is in check; `checkFen` rejects them. |
| IndexedDB via `idb` | Durable on Safari/Chrome/Edge; `navigator.storage.persist()` requested; memory fallback for private mode. |
| Hand-written service worker | No build-plugin lock-in. `scripts/build-sw.mjs` lists every exported file so all pages, pieces and fonts are precached. Navigations are network-first (3.5 s timeout) with cache fallback; `/_next/static` is cache-first; everything else stale-while-revalidate. |
| Bundled fonts | Typography also works offline; only latin/latin-ext subsets are precached. |

## Chess core (`src/lib/chess`)

- `fen.ts` – `checkFen()` strict FEN validation with Malay error messages.
- `game-controller.ts` – `GameController`: move list + cursor (undo/redo/goTo/restart), status
  (checkmate, stalemate, insufficient material, threefold repetition, 50-move rule), FEN/PGN import and export
  (including `[SetUp]/[FEN]`).
- `describe.ts` – "Apa yang berlaku?" sentence for any move.
- `pieces.ts`, `placement.ts`, `reach.ts` – names (EN/BM), board geometry, placement parsing, empty-board reach.

## Board (`src/components/board/Chessboard.tsx`)

Props: `fen`, `orientation`, `legalMoves`, `onMove`, `lastMove`, `checkSquare`, `highlights`, `onSquareTap`.
Interaction: tap–tap, drag (threshold 6 px), keyboard (Tab + Enter/Space, Escape), promotion dialog.
Each square is a `<button>` with a Malay `aria-label`.

## Persistence

| Store | Key | Content |
| --- | --- | --- |
| `progress` | session id (`h01`…`h48`) | status, start/complete time, minutes |
| `settings` | e.g. `game:play`, `game:analysis` | saved game (full PGN line + cursor) and other preferences |
| `games` | auto id | saved games |

`useProgress()` broadcasts changes (window event + `BroadcastChannel`) so all open views and tabs update.
