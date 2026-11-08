'use client';

import type { Move, Square } from 'chess.js';
import { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { CLASS_LABEL, centipawnLoss, classify } from '@/lib/analysis/classify';
import type { BookMove, Candidate, CoachReport, Flag } from '@/lib/coach/report';
import { cachedReport, useCoach } from '@/lib/hooks/useCoach';

const FLAG: Record<Flag, string> = {
  ok: 'text-emerald-300',
  warn: 'text-red-300',
  chance: 'text-gold-300',
  info: 'text-charcoal-200',
};
const FLAG_ICON: Record<Flag, string> = { ok: '✓', warn: '!', chance: '★', info: '•' };

const STAGE_TEXT = {
  position: 'Stockfish menganalisis kedudukan…',
  threats: 'Mencari ancaman lawan…',
  replies: 'Mengira jawapan lawan bagi setiap calon…',
  done: '',
  error: 'Ralat enjin',
  off: '',
};

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="border-t border-charcoal-700 pt-3" data-testid={testId}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">{title}</p>
      {children}
    </div>
  );
}

function CandidateCard({ c, onTry }: { c: Candidate; onTry?: (uci: string) => void }) {
  return (
    <li className="rounded-xl border border-charcoal-700 bg-charcoal-950/50 p-3" data-testid="coach-candidate">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-lg font-bold text-gold-200">{c.san}</span>
        <Badge tone={c.rank === 1 ? 'emerald' : 'neutral'}>#{c.rank}</Badge>
        <span className="font-mono text-sm text-charcoal-200">{c.scoreText}</span>
        <span className="text-xs text-charcoal-400">{c.evalWords}</span>
        {onTry && (
          <Button className="ml-auto !min-h-9 !px-3 text-xs" onClick={() => onTry(c.uci)}>
            Cuba langkah ini
          </Button>
        )}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-charcoal-100">
        {c.why.map((w) => (
          <li key={w}>• {w}</li>
        ))}
      </ul>
      <dl className="mt-2 grid gap-1 text-xs text-charcoal-300">
        {c.attacks.length > 0 && (
          <div>
            <dt className="inline font-semibold text-charcoal-200">Menyerang: </dt>
            <dd className="inline">{c.attacks.join(', ')}</dd>
          </div>
        )}
        {c.protects.length > 0 && (
          <div>
            <dt className="inline font-semibold text-charcoal-200">Melindungi: </dt>
            <dd className="inline">{c.protects.join(', ')}</dd>
          </div>
        )}
        {c.threatens.length > 0 && (
          <div>
            <dt className="inline font-semibold text-charcoal-200">Mengancam: </dt>
            <dd className="inline">{c.threatens.join(', ')}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold text-emerald-300">Kebaikan: </dt>
          <dd className="inline">{c.benefits.length ? c.benefits.join(' ') : '—'}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-red-300">Risiko: </dt>
          <dd className="inline">{c.risks.join(' ')}</dd>
        </div>
      </dl>
      {c.replies.length > 0 && (
        <div className="mt-2 rounded-lg bg-charcoal-800/70 p-2 text-xs">
          <p className="font-semibold text-charcoal-200">Dua jawapan terbaik lawan (menurut enjin):</p>
          <ol className="mt-1 space-y-0.5 text-charcoal-200">
            {c.replies.map((r) => (
              <li key={r.san}>
                <span className="font-mono text-gold-300">{r.san}</span> ({r.score}) – {r.text}
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="mt-2 truncate font-mono text-[11px] text-charcoal-400">{c.line}</p>
    </li>
  );
}

function MoveVerdict({ lastMove, report, depth }: { lastMove: Move; report: CoachReport; depth: number }) {
  const before = cachedReport(lastMove.before, depth);
  if (!before?.bestScore || !report.bestScore) return null;
  const loss = centipawnLoss(before.bestScore, report.bestScore);
  const cls = classify(loss);
  const label = CLASS_LABEL[cls];
  const bestBefore = before.candidates[0];
  const wasBest = bestBefore?.uci === lastMove.lan;
  return (
    <Section title="Langkah tadi" testId="coach-verdict">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono font-semibold text-gold-200">{lastMove.san}</span>
        <Badge tone={label.tone}>
          {label.ms} ({label.en})
        </Badge>
        <span className="text-xs text-charcoal-400">kehilangan ≈ {(loss / 100).toFixed(2)} Pion</span>
      </div>
      {!wasBest && bestBefore && (
        <p className="mt-1 text-sm text-charcoal-200">
          Pilihan enjin ialah <span className="font-mono text-gold-300">{bestBefore.san}</span>: {bestBefore.why[0]}
        </p>
      )}
    </Section>
  );
}

/**
 * The attacking coach. It follows: WHAT HAPPENED → THREAT → OPTIONS → BEST → NEXT,
 * and hides the answer behind progressive hints so the learner calculates first.
 */
export function CoachPanel({
  fen,
  lastMove,
  enabled = true,
  depth = 14,
  book,
  onHighlight,
  onTryMove,
  revealByDefault = false,
}: {
  fen: string;
  lastMove?: Move;
  enabled?: boolean;
  depth?: number;
  book?: BookMove[];
  onHighlight?: (squares: Square[]) => void;
  onTryMove?: (uci: string) => void;
  revealByDefault?: boolean;
}) {
  const { report, stage, error } = useCoach(fen, { enabled, depth, lastMove, book });
  const [revealed, setRevealed] = useState<{ fen: string; level: number }>({ fen: '', level: 0 });
  const level = revealed.fen === fen ? revealed.level : revealByDefault ? 4 : 0;
  const reveal = (n: number) => {
    setRevealed({ fen, level: Math.max(level, n) });
    if (n >= 3 && report) onHighlight?.(report.hints.squares);
  };

  if (!enabled) return null;

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-gold-200">Jurulatih Serangan</h2>
        {report ? <Badge tone="emerald">Kedalaman {report.depth}</Badge> : null}
      </div>

      {!report ? (
        stage === 'error' ? (
          <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300" role="alert">
            {error ?? 'Enjin tidak dapat dijalankan.'}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-charcoal-300" data-testid="coach-loading">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            {STAGE_TEXT[stage]}
          </p>
        )
      ) : (
        <div className="space-y-3 text-sm" data-testid="coach-report">
          {lastMove && <MoveVerdict lastMove={lastMove} report={report} depth={depth} />}

          {report.whatHappened && (
            <Section title="Apa yang berlaku?">
              <p className="text-charcoal-100">{report.whatHappened}</p>
              {report.whyItMatters.length > 0 && (
                <>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Kenapa ia penting?</p>
                  <ul className="mt-1 space-y-0.5 text-charcoal-200">
                    {report.whyItMatters.map((w) => (
                      <li key={w}>• {w}</li>
                    ))}
                  </ul>
                </>
              )}
            </Section>
          )}

          <Section title="Keadaan papan">
            <ul className="space-y-0.5 text-charcoal-200">
              {report.situation.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </Section>

          {!report.gameOver && (
            <>
              <Section title="Apakah ancamannya?" testId="coach-threats">
                <ul className="space-y-1">
                  {report.threats.map((t) => (
                    <li
                      key={t.text}
                      className={`rounded-lg px-2 py-1 ${t.severity === 'high' ? 'bg-red-500/10 text-red-200' : t.severity === 'medium' ? 'bg-gold-500/10 text-gold-100' : 'bg-charcoal-800/70 text-charcoal-200'}`}
                    >
                      {t.text}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Senarai semak sebelum bergerak">
                <ol className="space-y-1" data-testid="coach-checklist">
                  {report.checklist.map((c, i) => (
                    <li key={c.question} className="grid grid-cols-[1.25rem_1fr] gap-1">
                      <span className={`font-bold ${FLAG[c.flag]}`} aria-hidden>
                        {FLAG_ICON[c.flag]}
                      </span>
                      <span>
                        <span className="text-white">
                          {i + 1}. {c.question}
                        </span>{' '}
                        <span className={FLAG[c.flag]}>{level >= 4 || i < 2 ? c.answer : 'Fikir dahulu…'}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Section>

              {level < 4 && (
                <Section title="Petunjuk berperingkat">
                  <p className="mb-2 text-charcoal-300">Cuba cari langkah terbaik sendiri. Kira sekurang-kurangnya dua jawapan lawan sebelum memilih.</p>
                  <div className="space-y-2">
                    {level >= 1 && <p className="rounded-lg bg-charcoal-800/70 p-2">💡 Ancaman: {report.hints.threat}</p>}
                    {level >= 2 && <p className="rounded-lg bg-charcoal-800/70 p-2">💡 Buah diserang: {report.hints.attacked}</p>}
                    {level >= 3 && (
                      <p className="rounded-lg bg-charcoal-800/70 p-2">
                        💡 Petak calon (bertanda di papan): <span className="font-mono text-gold-300">{report.hints.squares.join(', ')}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {level < 3 && (
                        <Button onClick={() => reveal(level + 1)} data-testid="coach-hint">
                          Petunjuk {level + 1}
                        </Button>
                      )}
                      <Button variant="primary" onClick={() => reveal(4)} data-testid="coach-reveal">
                        Tunjuk penyelesaian
                      </Button>
                    </div>
                  </div>
                </Section>
              )}

              {level >= 4 && (
                <>
                  <Section title="Apakah pilihan saya? (3 langkah calon)">
                    <ul className="space-y-2">
                      {report.candidates.map((c) => (
                        <CandidateCard key={c.uci} c={c} onTry={onTryMove} />
                      ))}
                    </ul>
                  </Section>

                  <Section title="Langkah mana terbaik?" testId="coach-categories">
                    <ul className="space-y-1.5">
                      {report.categories.map((cat) => (
                        <li key={cat.key} className="rounded-lg bg-charcoal-800/70 p-2">
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/30 text-xs font-bold text-gold-200">
                            {cat.key}
                          </span>
                          <span className="font-semibold text-white">{cat.title}</span>
                          {cat.san && <span className="ml-2 font-mono text-gold-300">{cat.san}</span>}
                          <p className="mt-1 text-charcoal-200">{cat.text}</p>
                        </li>
                      ))}
                    </ul>
                    {report.recommendation && (
                      <p className="mt-2 rounded-lg border border-gold-500/40 bg-gold-500/10 p-2 text-gold-100" data-testid="coach-recommendation">
                        ⚔️ {report.recommendation.text}
                      </p>
                    )}
                  </Section>

                  {(report.nextText || report.bestLine) && (
                    <Section title="Apa seterusnya?">
                      {report.nextText && <p className="text-charcoal-100">{report.nextText}</p>}
                      {report.bestLine && <p className="mt-1 font-mono text-xs text-charcoal-300">Variasi utama: {report.bestLine}</p>}
                    </Section>
                  )}
                </>
              )}
            </>
          )}
          <p className="text-[11px] text-charcoal-400">
            Semua langkah dan penilaian datang daripada Stockfish dan chess.js. Enjin tidak boleh meramal keputusan manusia
            dengan pasti; ia menunjukkan langkah terkuat pada kedalaman yang dianalisis.
          </p>
        </div>
      )}
    </Card>
  );
}
