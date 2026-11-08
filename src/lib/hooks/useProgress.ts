'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  completeSession,
  loadProgress,
  resetAllProgress,
  resetSession,
  startSession,
  type ProgressSummary,
} from '@/lib/storage/progress';

const EVENT = 'cma:progress-changed';

/** Live view of the learner's progress, shared across components and tabs. */
export function useProgress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  const refresh = useCallback(async () => {
    setSummary(await loadProgress());
  }, []);

  useEffect(() => {
    let alive = true;
    loadProgress().then((s) => alive && setSummary(s));
    const onChange = () => void loadProgress().then((s) => alive && setSummary(s));
    window.addEventListener(EVENT, onChange);
    // Keep several open tabs/windows in sync.
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(EVENT) : null;
    channel?.addEventListener('message', onChange);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onChange);
      channel?.close();
    };
  }, []);

  const wrap = useCallback(
    <A extends unknown[]>(fn: (...a: A) => Promise<void>) =>
      async (...args: A) => {
        await fn(...args);
        window.dispatchEvent(new Event(EVENT));
        if (typeof BroadcastChannel !== 'undefined') {
          const c = new BroadcastChannel(EVENT);
          c.postMessage('changed');
          c.close();
        }
      },
    [],
  );

  return {
    summary,
    refresh,
    start: wrap((id: string) => startSession(id)),
    complete: wrap((id: string, minutes?: number) => completeSession(id, minutes)),
    reset: wrap((id: string) => resetSession(id)),
    resetAll: wrap(() => resetAllProgress()),
  };
}
