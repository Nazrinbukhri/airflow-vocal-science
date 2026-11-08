'use client';

import { Chess, type Square } from 'chess.js';
import { useEffect, useRef, useState } from 'react';
import { Chessboard, type HighlightTone } from '@/components/board/Chessboard';
import { ExerciseCard } from '@/components/lessons/ExerciseCard';
import { Icon } from '@/components/ui/Icon';
import { Badge, Button, Card, ProgressBar } from '@/components/ui/primitives';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { LESSONS, MODULE_INFO, type Lesson, type LessonModule, type ShowStep } from '@/lib/lessons/data';

export type LessonResult = { score: number; total: number; completed: boolean; at: number };
export type LessonResults = Record<string, LessonResult>;

const STEPS = [
  ['explain', 'Terang', 'Explain'],
  ['show', 'Tunjuk', 'Show'],
  ['practice', 'Latih', 'Practice'],
  ['test', 'Uji', 'Test'],
  ['review', 'Ulang kaji', 'Review'],
] as const;
type Step = (typeof STEPS)[number][0];

function ShowBoard({ step }: { step: ShowStep }) {
  const [ply, setPly] = useState(0);
  const c = new Chess(step.fen.startsWith('8/8/8/8/8/8/8/8') ? undefined : step.fen);
  let last: { from: Square; to: Square } | undefined;
  const empty = step.fen.startsWith('8/8/8/8/8/8/8/8');
  for (const m of (step.moves ?? []).slice(0, ply)) {
    const mm = c.move(m.san);
    last = { from: mm.from, to: mm.to };
  }
  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (ply === 0) for (const s of step.highlights ?? []) highlights[s] = 'gold';
  const note = ply > 0 ? step.moves![ply - 1] : undefined;
  return (
    <div className="space-y-2">
      <div className="mx-auto w-full max-w-sm">
        <Chessboard fen={empty ? step.fen : c.fen()} highlights={highlights} lastMove={last} label="Papan demonstrasi" />
      </div>
      <p className="text-sm text-charcoal-200">{note ? <><span className="font-mono text-gold-300">{note.san}</span> – {note.note}</> : step.caption}</p>
      {step.moves && step.moves.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={() => setPly(0)} disabled={ply === 0}>Mula</Button>
          <Button variant="secondary" onClick={() => setPly((p) => Math.min(p + 1, step.moves!.length))} disabled={ply >= step.moves.length} data-testid="show-next">
            Langkah seterusnya <Icon name="arrow" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function LessonPlayer({ lesson, result, onSave, onBack }: { lesson: Lesson; result?: LessonResult; onSave: (r: LessonResult) => void; onBack: () => void }) {
  const [step, setStep] = useState<Step>('explain');
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const idx = STEPS.findIndex((s) => s[0] === step);
  const score = Object.values(answers).filter(Boolean).length;
  const testDone = Object.keys(answers).length === lesson.test.length;

  useEffect(() => {
    if (testDone) onSave({ score, total: lesson.test.length, completed: true, at: Date.now() });
    // onSave is stable enough for this purpose; save once when the test is finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testDone]);

  return (
    <div className="space-y-4">
      <Button onClick={onBack}>← Senarai pelajaran</Button>
      <Card>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge tone="emerald">{MODULE_INFO[lesson.module].name}</Badge>
          <Badge>{lesson.titleEn}</Badge>
          <Badge>≈ {lesson.minutes} min</Badge>
          {result?.completed && <Badge tone="gold">Ujian: {result.score}/{result.total}</Badge>}
        </div>
        <h2 className="font-display text-2xl text-gold-200">{lesson.title}</h2>
        <ol className="mt-3 grid grid-cols-5 gap-1" aria-label="Langkah pelajaran">
          {STEPS.map(([key, ms, en], i) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setStep(key)}
                aria-current={step === key ? 'step' : undefined}
                className={`flex min-h-12 w-full flex-col items-center justify-center rounded-lg px-1 text-[11px] ${step === key ? 'bg-emerald-600/30 text-gold-200 ring-1 ring-emerald-500/50' : i < idx ? 'bg-charcoal-800 text-emerald-300' : 'bg-charcoal-800/50 text-charcoal-300'}`}
              >
                <span className="font-semibold">{ms}</span>
                <span className="hidden text-[10px] text-charcoal-400 sm:block">{en}</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        {step === 'explain' && (
          <div className="space-y-3 text-charcoal-100" data-testid="lesson-explain">
            {lesson.explain.map((p) => <p key={p}>{p}</p>)}
            {lesson.terms && (
              <dl className="grid gap-2 sm:grid-cols-2">
                {lesson.terms.map((t) => (
                  <div key={t.en} className="rounded-lg bg-charcoal-800/70 p-2 text-sm">
                    <dt><span className="font-semibold text-gold-200">{t.en}</span> = <span className="text-white">{t.ms}</span></dt>
                    <dd className="text-charcoal-300">{t.text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
        {step === 'show' && <div className="space-y-6">{lesson.show.map((s, i) => <ShowBoard key={i} step={s} />)}</div>}
        {step === 'practice' && (
          <div className="space-y-6">
            {lesson.practice.map((ex, i) => <ExerciseCard key={`${lesson.id}-p${i}`} exercise={ex} testId="lesson-practice" />)}
          </div>
        )}
        {step === 'test' && (
          <div className="space-y-6">
            <p className="text-sm text-charcoal-300">Jawapan PERTAMA anda dikira. Markah: {score}/{lesson.test.length}</p>
            {lesson.test.map((ex, i) => (
              <ExerciseCard
                key={`${lesson.id}-t${i}`}
                exercise={ex}
                testId="lesson-test"
                onResult={(ok) => setAnswers((a) => (i in a ? a : { ...a, [i]: ok }))}
              />
            ))}
            {testDone && (
              <p className="rounded-lg border border-gold-500/40 bg-gold-500/10 p-2 text-sm text-gold-100" data-testid="lesson-score">
                Ujian selesai: {score}/{lesson.test.length}. {score === lesson.test.length ? 'Cemerlang!' : 'Ulang kaji dan cuba lagi bila-bila masa.'}
              </p>
            )}
          </div>
        )}
        {step === 'review' && (
          <ul className="space-y-2 text-charcoal-100">
            {lesson.review.map((r) => <li key={r} className="flex gap-2"><span className="text-emerald-400">✓</span>{r}</li>)}
          </ul>
        )}
        <div className="mt-5 flex justify-between gap-2">
          <Button onClick={() => setStep(STEPS[Math.max(0, idx - 1)]![0])} disabled={idx === 0}>Sebelum</Button>
          {idx < STEPS.length - 1 ? (
            <Button variant="secondary" onClick={() => setStep(STEPS[idx + 1]![0])} data-testid="lesson-next-step">
              {STEPS[idx + 1]![1]} <Icon name="arrow" className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={onBack}>Selesai</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export function LessonBrowser({ modules }: { modules: LessonModule[] }) {
  const [results, setResults] = usePersistentState<LessonResults>('lessons:results', {});
  const [open, setOpen] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // Bring the lesson (or the list) into view when it changes – important on phones.
  useEffect(() => {
    if (open) top.current?.scrollIntoView({ block: 'start' });
  }, [open]);

  // Allow deep links such as /fundamentals/#f08-check.
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (LESSONS.some((l) => l.id === id && modules.includes(l.module))) setOpen(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [modules]);

  const lesson = LESSONS.find((l) => l.id === open);
  if (lesson) {
    return (
      <div ref={top} className="scroll-mt-20">
      <LessonPlayer
        key={lesson.id}
        lesson={lesson}
        result={results[lesson.id]}
        onSave={(r) => setResults((all) => ({ ...all, [lesson.id]: r.score >= (all[lesson.id]?.score ?? -1) ? r : { ...all[lesson.id]!, at: r.at } }))}
        onBack={() => {
          setOpen(null);
          if (window.location.hash) history.replaceState(null, '', window.location.pathname);
        }}
      />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modules.map((m) => {
        const list = LESSONS.filter((l) => l.module === m);
        const done = list.filter((l) => results[l.id]?.completed).length;
        return (
          <section key={m}>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-gold-200">{MODULE_INFO[m].name}</h2>
                <p className="text-sm text-charcoal-300">{MODULE_INFO[m].text}</p>
              </div>
              <span className="text-xs text-charcoal-400">{done}/{list.length} selesai</span>
            </div>
            <ProgressBar value={(done / list.length) * 100} label={`Kemajuan ${MODULE_INFO[m].name}`} />
            <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" data-testid={`lessons-${m}`}>
              {list.map((l, i) => {
                const r = results[l.id];
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(l.id)}
                      data-testid={`lesson-${l.id}`}
                      className="flex min-h-20 w-full items-start gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/70 p-3 text-left hover:border-gold-500/50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal-800 font-mono text-xs text-gold-300">{i + 1}</span>
                      <span className="flex-1">
                        <span className="block font-semibold text-white">{l.title}</span>
                        <span className="block text-xs text-charcoal-400">{l.titleEn} · ≈ {l.minutes} min</span>
                        {r?.completed && <span className="mt-1 block text-xs text-emerald-300">✓ Ujian {r.score}/{r.total}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
