'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/primitives';
import { BREAK_MINUTES, STUDY_MINUTES } from '@/lib/curriculum/programme';
import { usePersistentState } from '@/lib/hooks/usePersistentState';

type Active = { sessionId: string; startedAt: number } | null;

/** 45-minute study timer with a break reminder. Survives reloads. */
export function SessionTimer({ sessionId, onFinish }: { sessionId: string; onFinish: (minutes: number) => void }) {
  const [active, setActive] = usePersistentState<Active>('timer:active', null);
  const [now, setNow] = useState(() => Date.now());
  const running = active?.sessionId === sessionId;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!running) {
    return (
      <Button onClick={() => { setNow(Date.now()); setActive({ sessionId, startedAt: Date.now() }); }} data-testid={`timer-start-${sessionId}`}>
        ⏱ Mula pemasa {STUDY_MINUTES} minit
      </Button>
    );
  }
  const elapsed = Math.max(0, Math.floor((now - active!.startedAt) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const breakTime = elapsed >= STUDY_MINUTES * 60;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-charcoal-800/70 px-3 py-2" role="timer" aria-live="off">
      <span className={`font-mono text-lg ${breakTime ? 'text-gold-300' : 'text-emerald-300'}`}>{mm}:{ss}</span>
      <span className="text-xs text-charcoal-300">
        {breakTime ? `Masa rehat ${BREAK_MINUTES} minit! Bangun, minum air, rehatkan mata.` : `daripada ${STUDY_MINUTES}:00`}
      </span>
      <Button
        variant="secondary"
        className="ml-auto"
        onClick={() => {
          setActive(null);
          onFinish(Math.max(1, Math.min(60, Math.round(elapsed / 60))));
        }}
      >
        Tamat sesi
      </Button>
      <Button onClick={() => setActive(null)}>Batal</Button>
    </div>
  );
}
