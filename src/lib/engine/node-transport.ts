// Test-only transport: runs the real Stockfish WASM engine from the npm package in Node.
// Not imported by the app.
import { createRequire } from 'node:module';
import type { Transport } from './engine';

type NodeEngine = { processCommand(cmd: string): void; listener?: (line: string) => void; terminate?: () => void };

export function nodeTransport(): Transport {
  const require = createRequire(import.meta.url);
  const init = require('stockfish') as (flavor: string, onMessage?: (line: string) => void) => NodeEngine;
  let handler: (line: string) => void = () => undefined;
  const engine = init('lite-single', (line) => handler(line));
  return {
    send: (cmd) => engine.processCommand(cmd),
    listen(onLine) {
      handler = (raw) => {
        for (const l of String(raw).split('\n')) onLine(l);
      };
    },
    terminate: () => engine.terminate?.(),
  };
}
