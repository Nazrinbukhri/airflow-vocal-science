'use client';

import type { Move } from 'chess.js';
import { useEffect, useState } from 'react';
import type { BookMove, CoachReport } from '@/lib/coach/report';
import { runCoach, type CoachStage } from '@/lib/coach/run';
import { acquireEngine } from '@/lib/engine/browser';

const cache = new Map<string, CoachReport>();
/** Latest report per position, whatever move led there (used to judge the learner's move). */
const byFen = new Map<string, CoachReport>();
const MAX_CACHE = 60;

export function cachedReport(fen: string, depth: number): CoachReport | undefined {
  return byFen.get(`${depth}|${fen}`);
}

/** Run the coach for a position (cached per FEN + depth). */
export function useCoach(
  fen: string,
  { enabled = true, depth = 14, lastMove, book }: { enabled?: boolean; depth?: number; lastMove?: Move; book?: BookMove[] } = {},
) {
  const key = `${depth}|${lastMove?.lan ?? '-'}|${fen}`;
  const [state, setState] = useState<{ key: string; report: CoachReport | null; stage: CoachStage | 'error'; error?: string }>({
    key: '',
    report: null,
    stage: 'position',
  });
  const lastSan = lastMove?.san;
  const bookKey = book?.map((b) => b.san).join(',') ?? '';

  useEffect(() => {
    if (!enabled || cache.has(key)) return;
    const { engine, release } = acquireEngine();
    const ctrl = new AbortController();
    runCoach(engine, fen, {
      depth,
      signal: ctrl.signal,
      lastMove,
      book,
      onStage: (stage) => !ctrl.signal.aborted && setState((s) => (s.key === key && s.stage === stage ? s : { key, report: null, stage })),
    })
      .then((report) => {
        if (!report || ctrl.signal.aborted) return;
        cache.set(key, report);
        byFen.set(`${depth}|${fen}`, report);
        if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
        if (byFen.size > MAX_CACHE) byFen.delete(byFen.keys().next().value!);
        setState({ key, report, stage: 'done' });
      })
      .catch((e: unknown) => !ctrl.signal.aborted && setState({ key, report: null, stage: 'error', error: e instanceof Error ? e.message : String(e) }));
    return () => {
      ctrl.abort();
      release();
    };
    // lastMove/book are identified by lastSan/bookKey; the cache key covers the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, lastSan, bookKey]);

  const report = cache.get(key) ?? (state.key === key ? state.report : null);
  const stage: CoachStage | 'error' | 'off' = !enabled ? 'off' : report ? 'done' : state.key === key ? state.stage : 'position';
  return { report, stage, error: state.key === key ? state.error : undefined };
}
