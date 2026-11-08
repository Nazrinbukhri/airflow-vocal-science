'use client';

import type { Square } from 'chess.js';
import { useEffect, useState } from 'react';
import { analysePieceMoves, type PieceMoveMap } from '@/lib/coach/moveMap';
import { acquireEngine } from '@/lib/engine/browser';

const cache = new Map<string, PieceMoveMap>();
const DEBOUNCE_MS = 150;

/** Engine ratings for every move of the piece on `square` (cached per position + square). */
export function useMoveMap(fen: string, square: Square | null, enabled: boolean) {
  const key = square ? `${fen}|${square}` : '';
  const [state, setState] = useState<{ key: string; map: PieceMoveMap | null; error?: string }>({ key: '', map: null });

  useEffect(() => {
    if (!enabled || !square || cache.has(key)) return;
    const ctrl = new AbortController();
    let release: (() => void) | null = null;
    const t = setTimeout(() => {
      const h = acquireEngine();
      release = h.release;
      analysePieceMoves(h.engine, fen, square, { depth: 10, signal: ctrl.signal })
        .then((map) => {
          if (!map || ctrl.signal.aborted) return;
          cache.set(key, map);
          if (cache.size > 200) cache.delete(cache.keys().next().value!);
          setState({ key, map });
        })
        .catch((e: unknown) => !ctrl.signal.aborted && setState({ key, map: null, error: e instanceof Error ? e.message : String(e) }));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
      release?.();
    };
  }, [key, fen, square, enabled]);

  if (!enabled || !square) return { map: null, loading: false };
  const map = cache.get(key) ?? (state.key === key ? state.map : null);
  return { map, loading: !map && !(state.key === key && state.error), error: state.key === key ? state.error : undefined };
}
