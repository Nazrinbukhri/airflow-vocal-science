'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Badge, Button, Card, ProgressBar, buttonClass } from '@/components/ui/primitives';
import {
  BREAK_MINUTES,
  PROGRAMME,
  SESSION_LINKS,
  STUDY_MINUTES,
  SUGGESTED_HOURS_PER_DAY,
} from '@/lib/curriculum/programme';
import { SessionTimer } from './SessionTimer';
import { useProgress } from '@/lib/hooks/useProgress';

export function ProgrammeView() {
  const { summary, start, complete, reset } = useProgress();
  const done = summary?.completedIds ?? new Set<string>();
  const started = summary?.inProgressIds ?? new Set<string>();
  const nextId = summary?.next?.id;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <Icon name="clock" className="h-6 w-6 shrink-0 text-emerald-400" />
            <p className="text-sm text-charcoal-200">
              <strong className="text-white">1 jam = 1 sesi:</strong> {STUDY_MINUTES} minit belajar, kemudian{' '}
              {BREAK_MINUTES} minit rehat. Bangun, minum air, rehatkan mata.
            </p>
          </div>
          <div className="flex gap-3">
            <Icon name="route" className="h-6 w-6 shrink-0 text-emerald-400" />
            <p className="text-sm text-charcoal-200">
              <strong className="text-white">Bukan 48 jam berturut-turut.</strong> Cadangan: paling banyak{' '}
              {SUGGESTED_HOURS_PER_DAY} sesi sehari. Otak belajar semasa tidur juga.
            </p>
          </div>
          <div className="flex gap-3">
            <Icon name="check" className="h-6 w-6 shrink-0 text-emerald-400" />
            <p className="text-sm text-charcoal-200">
              <strong className="text-white">Boleh disambung bila-bila masa.</strong> Kemajuan disimpan dalam peranti ini
              secara automatik.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-charcoal-300">Keseluruhan</span>
            <span className="font-semibold text-gold-300">{summary?.percent ?? 0}%</span>
          </div>
          <ProgressBar value={summary?.percent ?? 0} label="Kemajuan keseluruhan" />
        </div>
      </Card>

      {PROGRAMME.map((block) => {
        const n = block.sessions.filter((s) => done.has(s.id)).length;
        const containsNext = block.sessions.some((s) => s.id === nextId);
        return (
          <details
            key={block.id}
            open={containsNext || undefined}
            className="group rounded-2xl border border-charcoal-700/80 bg-charcoal-900/80 open:border-emerald-600/40"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5">
              <span className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-charcoal-800 text-[10px] text-charcoal-300">
                Hari {block.day}
                <span className="font-mono text-xs text-gold-300">
                  {block.fromHour}–{block.toHour}
                </span>
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-white">{block.title}</span>
                <span className="block text-xs text-charcoal-400">{block.titleEn}</span>
              </span>
              <span className="text-xs text-charcoal-300">
                {n}/{block.sessions.length}
              </span>
            </summary>
            <ol className="space-y-2 px-4 pb-4 sm:px-5">
              {block.sessions.map((s) => {
                const isDone = done.has(s.id);
                const isStarted = started.has(s.id);
                const isNext = s.id === nextId;
                return (
                  <li
                    key={s.id}
                    id={s.id}
                    className={`scroll-mt-24 rounded-xl border p-3 ${
                      isNext ? 'border-gold-500/60 bg-gold-500/5' : 'border-charcoal-700 bg-charcoal-950/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-charcoal-400">Jam {s.hour}</span>
                      {isDone && <Badge tone="emerald">Selesai</Badge>}
                      {!isDone && isStarted && <Badge tone="gold">Sedang dibuat</Badge>}
                      {isNext && !isStarted && <Badge tone="gold">Seterusnya</Badge>}
                    </div>
                    <p className="mt-1 font-medium text-white">{s.title}</p>
                    <p className="text-sm text-charcoal-300">Matlamat: {s.goal}</p>
                    {SESSION_LINKS[s.id] && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {SESSION_LINKS[s.id]!.map((l) => (
                          <li key={l.label}>
                            <Link href={l.href} onClick={() => void start(s.id)} className="inline-flex min-h-9 items-center rounded-full border border-emerald-600/40 bg-emerald-600/10 px-3 text-xs text-emerald-200 hover:bg-emerald-600/20">
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isDone && (
                      <div className="mt-2">
                        <SessionTimer sessionId={s.id} onFinish={(min) => void complete(s.id, min)} />
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={s.route}
                        onClick={() => void start(s.id)}
                        className={buttonClass(isNext ? 'primary' : 'ghost')}
                      >
                        {isDone ? 'Ulang kaji' : isStarted ? 'Sambung' : 'Mula'}
                      </Link>
                      {!isDone ? (
                        <Button variant="secondary" onClick={() => void complete(s.id)} data-testid={`complete-${s.id}`}>
                          <Icon name="check" className="h-4 w-4" /> Tandakan selesai
                        </Button>
                      ) : (
                        <Button onClick={() => void reset(s.id)}>Tandakan belum selesai</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
