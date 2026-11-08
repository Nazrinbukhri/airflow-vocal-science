'use client';

import type { Square } from 'chess.js';
import { useState } from 'react';
import { Chessboard, type HighlightTone } from '@/components/board/Chessboard';
import { ExerciseCard } from '@/components/lessons/ExerciseCard';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { FORMATIONS } from '@/lib/formations/data';
import { usePersistentState } from '@/lib/hooks/usePersistentState';

const SECTIONS = [
  ['what', 'Apa itu?'],
  ['attack', 'Peluang serangan'],
  ['weakness', 'Kelemahan'],
  ['exploit', 'Cara mengeksploitasi'],
  ['defend', 'Cara bertahan'],
] as const;

export function FormationLibrary() {
  const [done, setDone] = usePersistentState<string[]>('formations:done', []);
  const [id, setId] = useState<string | null>(null);
  const f = FORMATIONS.find((x) => x.id === id);

  if (!f) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="formation-list">
        {FORMATIONS.map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              onClick={() => setId(x.id)}
              className="flex h-full min-h-24 w-full flex-col items-start rounded-2xl border border-charcoal-700 bg-charcoal-900/70 p-4 text-left hover:border-gold-500/50"
            >
              <span className="font-mono text-xs text-charcoal-400">{i + 1}</span>
              <span className="font-semibold text-white">{x.name}</span>
              <span className="text-xs text-charcoal-400">{x.nameEn}</span>
              {done.includes(x.id) && <span className="mt-1 text-xs text-emerald-300">✓ Latihan selesai</span>}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const highlights: Partial<Record<Square, HighlightTone>> = {};
  for (const s of f.highlight) highlights[s] = 'gold';

  return (
    <div className="space-y-4">
      <Button onClick={() => setId(null)}>← Semua formasi</Button>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))] lg:max-w-none">
          <Chessboard fen={f.fen} orientation={f.side} highlights={highlights} label={`Formasi: ${f.name}`} />
          <p className="mt-2 text-sm text-charcoal-300">
            <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-gold-400/70 align-middle" aria-hidden />
            {f.highlightLabel}
          </p>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl text-gold-200">{f.name}</h2>
              <Badge>{f.nameEn}</Badge>
            </div>
            <dl className="space-y-3 text-sm">
              {SECTIONS.map(([key, label]) => (
                <div key={key}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">{label}</dt>
                  <dd className="text-charcoal-100">{f[key]}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Latihan praktikal</p>
            <ExerciseCard
              key={f.id}
              exercise={f.exercise}
              testId="formation-exercise"
              onResult={(ok) => ok && !done.includes(f.id) && setDone((d) => [...d, f.id])}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
