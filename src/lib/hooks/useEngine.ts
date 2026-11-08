'use client';

import { useEffect, useRef, useState } from 'react';
import { acquireEngine } from '@/lib/engine/browser';
import type { AnalysisResult, Engine, EngineState } from '@/lib/engine/engine';

export type AnalysisStatus = 'off' | 'loading' | 'thinking' | 'done' | 'error';

/**
 * Live Stockfish analysis of `fen`. Restarts when the position changes; the old
 * search is stopped first. Results always carry the FEN they belong to.
 */
export function useAnalysis(
  fen: string,
  { enabled = true, multiPv = 3, depth = 16 }: { enabled?: boolean; multiPv?: number; depth?: number } = {},
) {
  const [result, setResult] = useState<(AnalysisResult & { done: boolean }) | null>(null);
  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const { engine, release } = acquireEngine();
    const off = engine.onStateChange(setEngineState);
    const ctrl = new AbortController();
    engine
      .analyse(fen, {
        multiPv,
        depth,
        signal: ctrl.signal,
        onUpdate: (r) => !ctrl.signal.aborted && setResult({ ...r, done: false }),
      })
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setResult({ ...r, done: true });
        setError(null);
      })
      .catch((e: unknown) => !ctrl.signal.aborted && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      ctrl.abort();
      off();
      release();
    };
  }, [fen, enabled, multiPv, depth]);

  const current = result && result.fen === fen ? result : null;
  const status: AnalysisStatus = !enabled
    ? 'off'
    : error || engineState === 'error'
      ? 'error'
      : current?.done
        ? 'done'
        : engineState === 'loading' || engineState === 'idle'
          ? 'loading'
          : 'thinking';
  return { result: current, status, error };
}

/** A handle to the shared engine for one component (e.g. the AI opponent). */
export function useEngineHandle(enabled = true) {
  const ref = useRef<Engine | null>(null);
  const [state, setState] = useState<EngineState>('idle');
  useEffect(() => {
    if (!enabled) return;
    const { engine, release } = acquireEngine();
    ref.current = engine;
    const off = engine.onStateChange(setState);
    return () => {
      off();
      ref.current = null;
      release();
    };
  }, [enabled]);
  return { engineRef: ref, state };
}
