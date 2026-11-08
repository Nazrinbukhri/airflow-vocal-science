// Copy the Stockfish WASM engine (lite, single-threaded) from node_modules into public/engine.
// Runs automatically after `npm install` and before `npm run build` / `npm run dev`.
// Stockfish is GPL-3.0: the licence text is shipped next to the engine files.
import { copyFileSync, mkdirSync } from 'node:fs';

const SRC = 'node_modules/stockfish';
const DEST = 'public/engine';
mkdirSync(DEST, { recursive: true });
for (const [from, to] of [
  ['bin/stockfish-19-lite-single.js', 'stockfish.js'],
  ['bin/stockfish-19-lite-single.wasm', 'stockfish.wasm'],
  ['Copying.txt', 'COPYING.txt'],
]) {
  copyFileSync(`${SRC}/${from}`, `${DEST}/${to}`);
}
console.log('Stockfish 19 lite (single-threaded) copied to public/engine/');
