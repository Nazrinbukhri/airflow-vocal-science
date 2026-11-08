'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Badge, Card, CardTitle, ProgressBar, buttonClass } from '@/components/ui/primitives';
import { PIECES, pieceImage } from '@/lib/chess/pieces';
import { PROGRAMME, TOTAL_HOURS, blockOfSession } from '@/lib/curriculum/programme';
import { useProgress } from '@/lib/hooks/useProgress';
import { CURRENT_PHASE, NAV } from '@/lib/nav';

export function DashboardView() {
  const { summary } = useProgress();
  const next = summary?.next;
  const block = next ? blockOfSession(next.id) : undefined;
  const done = summary?.completedIds ?? new Set<string>();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/25 bg-gradient-to-br from-emerald-900/60 via-charcoal-900 to-charcoal-950 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Aggressive Chess Academy</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-gold-200 sm:text-5xl">CHESS MASTER AI</h1>
        <p className="mt-2 font-display text-lg italic text-gold-300 sm:text-xl">
          Zero to Hero – Master the art of attacking chess.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-charcoal-200 sm:text-base">
          Program 48 jam untuk pemula mutlak. Kita mula dari sifar – apa itu papan catur – hingga anda boleh merancang
          serangan, mengira kombinasi taktik dan memberi checkmate.
        </p>
        <p className="mt-3 max-w-2xl rounded-lg border-l-4 border-gold-500 bg-charcoal-950/50 px-3 py-2 text-sm text-charcoal-100">
          <strong className="text-gold-300">Agresif bukan bermaksud melulu.</strong> Penyerang yang baik mengira dahulu,
          menjaga keselamatan Raja dan membangunkan buah sebelum menyerang.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardTitle sub={block ? `${block.title} · Hari ${block.day}` : undefined}>
            {summary === null ? 'Memuatkan kemajuan…' : next ? 'Sambung belajar' : 'Program selesai!'}
          </CardTitle>
          {next ? (
            <>
              <p className="text-sm text-charcoal-300">
                Jam {next.hour} daripada {TOTAL_HOURS}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{next.title}</p>
              <p className="mt-1 text-sm text-charcoal-200">Matlamat: {next.goal}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/learn/#${next.id}`} className={buttonClass('primary')}>
                  {done.size === 0 ? 'Mula Jam 1' : `Sambung Jam ${next.hour}`} <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link href={next.route} className={buttonClass('ghost')}>
                  Buka modul
                </Link>
              </div>
            </>
          ) : summary ? (
            <p className="text-sm text-charcoal-200">Tahniah! Semua 48 sesi telah selesai. Lihat laporan di Kemajuan Saya.</p>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Kemajuan</CardTitle>
          <p className="font-display text-4xl font-bold text-gold-300" data-testid="progress-percent">
            {summary ? `${summary.percent}%` : '–'}
          </p>
          <div className="mt-2">
            <ProgressBar value={summary?.percent ?? 0} label="Kemajuan program 48 jam" />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-charcoal-400">Sesi selesai</dt>
              <dd className="font-semibold text-white">
                {summary?.completedCount ?? 0}/{TOTAL_HOURS}
              </dd>
            </div>
            <div>
              <dt className="text-charcoal-400">Minit belajar</dt>
              <dd className="font-semibold text-white">{summary?.minutesStudied ?? 0}</dd>
            </div>
          </dl>
          {summary && !summary.persistent && (
            <p className="mt-3 text-xs text-gold-300">
              Storan pelayar tidak tersedia (mod peribadi?). Kemajuan tidak akan disimpan selepas tab ditutup.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle sub="Setiap 'jam' = 45 minit belajar + 15 minit rehat. Hari 1 dan Hari 2 ialah dua separuh program – bukan mesti dalam dua hari.">
          Program 48 jam
        </CardTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {([1, 2] as const).map((day) => (
            <div key={day}>
              <p className="mb-2 text-sm font-semibold text-emerald-300">
                Hari {day} – {day === 1 ? 'Asas dan prinsip serangan' : 'Penguasaan serangan'}
              </p>
              <ul className="space-y-2">
                {PROGRAMME.filter((b) => b.day === day).map((b) => {
                  const n = b.sessions.filter((s) => done.has(s.id)).length;
                  return (
                    <li key={b.id}>
                      <Link
                        href={`/learn/#${b.sessions[0]!.id}`}
                        className="block rounded-lg px-2 py-1.5 hover:bg-charcoal-800"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-charcoal-100">
                            <span className="mr-2 font-mono text-xs text-charcoal-400">
                              J{b.fromHour}–{b.toHour}
                            </span>
                            {b.title}
                          </span>
                          <span className="shrink-0 text-xs text-charcoal-400">
                            {n}/{b.sessions.length}
                          </span>
                        </div>
                        <div className="mt-1">
                          <ProgressBar value={(n / b.sessions.length) * 100} label={`Kemajuan ${b.title}`} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle sub="English term = istilah Bahasa Melayu">Kenali enam buah catur</CardTitle>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map((t) => (
            <li key={t} className="flex flex-col items-center rounded-xl bg-charcoal-800/70 p-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pieceImage('w', t)} alt="" className="h-12 w-12" />
              <span className="text-sm font-semibold text-gold-200">{PIECES[t].ms}</span>
              <span className="text-xs text-charcoal-400">{PIECES[t].en}</span>
            </li>
          ))}
        </ul>
        <Link href="/fundamentals" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200">
          Lihat cara setiap buah bergerak <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-xl text-gold-200">Modul</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {NAV.filter((n) => n.href !== '/').map((n) => {
            const ready = n.phase <= CURRENT_PHASE;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="flex h-full min-h-24 gap-3 rounded-2xl border border-charcoal-700 bg-charcoal-900/70 p-4 hover:border-gold-500/50"
                >
                  <Icon name={n.icon} className="h-6 w-6 shrink-0 text-emerald-400" />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{n.label}</span>
                      {ready ? (
                        <Badge tone="emerald">Sedia</Badge>
                      ) : n.availableNow ? (
                        <Badge tone="gold">Sebahagian · Fasa {n.phase}</Badge>
                      ) : (
                        <Badge>Fasa {n.phase}</Badge>
                      )}
                    </span>
                    <span className="block text-xs text-charcoal-400">{n.labelEn}</span>
                    <span className="mt-1 block text-sm text-charcoal-300">
                      {!ready && n.availableNow ? `Kini: ${n.availableNow}. ` : ''}
                      {n.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
