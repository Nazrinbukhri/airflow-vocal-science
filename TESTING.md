# Testing

## Automated

```bash
npm test             # Vitest: unit + component tests (jsdom, fake-indexeddb)
npm run lint
npm run typecheck
npm run build && npm run test:e2e   # Playwright + Chromium against the real static build
```

### Unit / component (Vitest)

| File | Covers |
| --- | --- |
| `src/lib/chess/fen.test.ts` | FEN validation incl. "side not to move in check" |
| `src/lib/chess/game-controller.test.ts` | legality, pins, castling (and through check), en passant, promotion, checkmate, stalemate, insufficient material, threefold, 50-move, undo/redo/goTo, FEN + PGN import/export round-trip |
| `src/lib/chess/describe.test.ts` | Malay move explanations |
| `src/lib/chess/board-helpers.test.ts` | square colours, orientation, point→square, placement, piece reach |
| `src/lib/curriculum/programme.test.ts` | 48 sessions, hour ranges match the brief, valid links, resume logic |
| `src/lib/storage/progress.test.ts` | progress in IndexedDB and memory fallback, persistence across reopen |
| `src/components/board/Chessboard.test.tsx` | rendering, tap-to-move, illegal taps, promotion dialog, read-only board, pointer taps |

### End-to-end (`scripts/e2e-smoke.mjs`)

Desktop 1366×768 and iPhone 13 emulation (Chromium with touch):
all 11 pages render without console errors; sidebar vs bottom nav; click, mouse-drag and finger-drag moves;
illegal drops rejected; undo/redo; game restored after reload; PGN import to checkmate; bad FEN error;
progress persists; manifest + service worker; pages and board work **offline**; no horizontal scroll on iPhone.

Set `SCREENSHOTS=some/dir` to save screenshots.

## Manual device checklist

Chromium emulation is not Safari. Before each release, check on real devices:

**iPhone (Safari)**
- [ ] Open the site, Share → *Add to Home Screen*; launch from the icon (standalone, no Safari bars).
- [ ] Board: tap–tap move, drag with a finger, promotion dialog, page does not scroll while dragging a piece.
- [ ] Bottom nav and "Lagi" sheet clear the home indicator (safe area).
- [ ] Turn on Aeroplane mode, relaunch: dashboard, lessons and board still open.
- [ ] Progress is still there after closing and reopening the app.

**Windows 11 (Edge, Chrome, Firefox)**
- [ ] Mouse click and drag moves; keyboard: Tab to a square, Enter to select/move.
- [ ] Install from the address-bar install icon (Edge/Chrome); app opens in its own window.
- [ ] Offline (DevTools → Network → Offline) reload works.
