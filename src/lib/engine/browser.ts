'use client';

import { Engine, type Transport } from './engine';

export const ENGINE_URL = '/engine/stockfish.js';
const IDLE_SHUTDOWN_MS = 60_000;

function workerTransport(url: string): Transport {
  const worker = new Worker(url);
  return {
    send: (cmd) => worker.postMessage(cmd),
    listen(onLine, onError) {
      worker.onmessage = (e: MessageEvent) => {
        // The engine also posts download-progress objects; only strings are UCI output.
        if (typeof e.data === 'string') for (const l of e.data.split('\n')) onLine(l);
      };
      worker.onerror = (e) => {
        e.preventDefault?.();
        onError(
          'Enjin Stockfish gagal dimuatkan. Pastikan pelayar anda menyokong WebAssembly (iOS 16+, Windows 10+), kemudian muat semula halaman.',
        );
      };
    },
    terminate: () => worker.terminate(),
  };
}

let shared: Engine | null = null;
let users = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the shared engine (one Web Worker for the whole app).
 * Call the returned release() when done; the worker is terminated after a
 * minute without users so it does not use memory or battery in the background.
 */
export function acquireEngine(): { engine: Engine; release: () => void } {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (!shared || shared.state === 'terminated' || shared.state === 'error') {
    shared?.terminate();
    shared = new Engine(workerTransport(ENGINE_URL));
  }
  users++;
  const engine = shared;
  let released = false;
  return {
    engine,
    release() {
      if (released) return;
      released = true;
      users = Math.max(0, users - 1);
      if (users === 0) {
        idleTimer = setTimeout(() => {
          if (users === 0 && shared) {
            shared.terminate();
            shared = null;
          }
        }, IDLE_SHUTDOWN_MS);
      }
    },
  };
}
