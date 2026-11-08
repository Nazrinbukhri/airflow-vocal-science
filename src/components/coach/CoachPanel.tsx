'use client';

import type { Move, Square } from 'chess.js';
import { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { CLASS_LABEL, centipawnLoss, classify } from '@/lib/analysis/classify';
import type { BookMove, Candidate, CoachReport, Flag } from '@/lib/coach/report';
import { cachedReport, useCoach } from '@/lib/hooks/useCoach';

const FLAG: Record<Flag, string> = { ok: 'text-emerald-300', warn: 'text-red-300', chance: 'text-gold-300', info: 'text-charcoal-300' };
const FLAG_ICON: Record<Flag, string> = { ok: '✓', warn: '!', chance: '★', info: '•' };

const STAGE_TEXT = {
  position: 'Menganalisis kedudukan…',
  threats: 'Mencari ancaman lawan…',
  replies: 'Mengira jawapan lawan…',
  done: '',
  error: 'Ralat enjin',
  off: '',
};

type Tab = 'threats' | 'check' | 'hints' | 'moves' | 'best';
const TABS: { key: Tab; label: string }[] = [
  { key: 'threats', label: 'Ancaman' },
  { key: 'check', label: 'Semak' },
  { key: 'hints', label: 'Petunjuk' },
  { key: 'moves', label: 'Calon' },
  { key: 'best', label: 'Terbaik' },
];

/** Short checklist labels so each item fits on one line. */
const SHORT_Q = ['Raja selamat?', 'Buah saya diserang?', 'Tangkapan percuma?', 'Boleh check?', 'Cipta ancaman?', 'Serang dua buah?', 'Jawapan lawan?'];

function CandidateRow({ c, onTry }: { c: Candidate; onTry?: (uci: string) => void }) {
  const risk = c.risks.find((r) => !r.startsWith('Tiada risiko'));
  return (
    <li className="rounded-lg bg-charcoal-950/60 p-2" data-testid="coach-candidate">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-gold-200">{c.san}</span>
        <span className="font-mono text-xs text-charcoal-300">{c.scoreText}</span>
        {c.rank === 1 && <Badge tone="emerald">#1</Badge>}
        {onTry && (
          <button type="button" onClick={() => onTry(c.uci)} className="ml-auto min-h-8 rounded-md border border-charcoal-600 px-2 text-xs text-charcoal-100 hover:border-gold-500/60">
            Cuba
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-charcoal-100">{c.why[0]}</p>
      {risk && <p className="text-xs text-red-300">⚠ {risk}</p>}
      {c.replies.length > 0 && (
        <p className="text-xs text-charcoal-400">
          Lawan: {c.replies.map((r) => `${r.san} (${r.text})`).join(' · ')}
        </p>
      )}
    </li>
  );
}

function verdictOf(lastMove: Move | undefined, report: CoachReport, depth: number) {
  if (!lastMove) return null;
  const before = cachedReport(lastMove.before, depth);
  if (!before?.bestScore || !report.bestScore) return null;
  const loss = centipawnLoss(before.bestScore, report.bestScore);
  const label = CLASS_LABEL[classify(loss)];
  const best = before.candidates[0];
  return { san: lastMove.san, label, better: best && best.uci !== lastMove.lan ? best.san : undefined };
}

/**
 * Compact attacking coach that fits beside the board. Tabs keep each part short:
 * Threats · Checklist · Hints · Candidates · Best. Answers stay hidden until the learner asks.
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
  const [tab, setTab] = useState<Tab>('threats');
  const level = revealed.fen === fen ? revealed.level : revealByDefault ? 4 : 0;
  const solved = level >= 4;
  const reveal = (n: number) => {
    setRevealed({ fen, level: Math.max(level, n) });
    if (n >= 3 && report) onHighlight?.(report.hints.squares);
    if (n >= 4) setTab('moves');
  };

  if (!enabled) return null;
  const v = report ? verdictOf(lastMove, report, depth) : null;

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-display text-lg text-gold-200">Jurulatih</h2>
        {report?.candidates[0] && <span className="font-mono text-sm text-charcoal-200">{report.candidates[0].scoreText}</span>}
        {report && <span className="ml-auto text-[11px] text-charcoal-400">kedalaman {report.depth}</span>}
      </div>

      {!report ? (
        stage === 'error' ? (
          <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300" role="alert">{error ?? 'Enjin tidak dapat dijalankan.'}</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-charcoal-300" data-testid="coach-loading">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            {STAGE_TEXT[stage]}
          </p>
        )
      ) : report.gameOver ? (
        <p className="text-sm text-charcoal-100" data-testid="coach-report">{report.situation[0]}</p>
      ) : (
        <div className="text-sm" data-testid="coach-report">
          {v && (
            <p className="mb-2 flex flex-wrap items-center gap-1.5 text-xs" data-testid="coach-verdict">
              <span className="font-mono text-gold-200">{v.san}</span>
              <Badge tone={v.label.tone}>{v.label.ms}</Badge>
              {v.better && <span className="text-charcoal-400">lebih baik: <span className="font-mono text-gold-300">{v.better}</span></span>}
            </p>
          )}

          <div className="mb-2 grid grid-cols-5 gap-1" role="tablist" aria-label="Bahagian jurulatih">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => (t.key === 'moves' || t.key === 'best') && !solved ? reveal(4) : setTab(t.key)}
                className={`min-h-9 rounded-md px-1 text-[11px] font-medium ${tab === t.key ? 'bg-emerald-600/30 text-gold-200 ring-1 ring-emerald-500/50' : 'bg-charcoal-800/70 text-charcoal-300'}`}
              >
                {t.label}
                {(t.key === 'moves' || t.key === 'best') && !solved ? ' 🔒' : ''}
              </button>
            ))}
          </div>

          {tab === 'threats' && (
            <div className="space-y-1.5" data-testid="coach-threats">
              {report.whatHappened && <p className="text-xs text-charcoal-300">{report.whyItMatters[0] ?? report.whatHappened}</p>}
              {report.threats.slice(0, 3).map((t) => (
                <p
                  key={t.text}
                  className={`rounded-md px-2 py-1 text-xs ${t.severity === 'high' ? 'bg-red-500/15 text-red-200' : t.severity === 'medium' ? 'bg-gold-500/10 text-gold-100' : 'bg-charcoal-800/70 text-charcoal-200'}`}
                >
                  {t.text}
                </p>
              ))}
              <p className="text-[11px] text-charcoal-400">{report.situation[0]}</p>
            </div>
          )}

          {tab === 'check' && (
            <ol className="space-y-1" data-testid="coach-checklist">
              {report.checklist.map((c, i) => (
                <li key={c.question} className="flex gap-1.5 text-xs leading-snug">
                  <span className={`w-3 shrink-0 font-bold ${FLAG[c.flag]}`} aria-hidden>{FLAG_ICON[c.flag]}</span>
                  <span>
                    <span className="text-white">{SHORT_Q[i] ?? c.question}</span>{' '}
                    <span className={FLAG[c.flag]}>{solved || i < 2 ? c.answer : '…fikir dahulu'}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}

          {tab === 'hints' && (
            <div className="space-y-1.5">
              {level >= 1 && <p className="rounded-md bg-charcoal-800/70 p-2 text-xs">💡 {report.hints.threat}</p>}
              {level >= 2 && <p className="rounded-md bg-charcoal-800/70 p-2 text-xs">💡 {report.hints.attacked}</p>}
              {level >= 3 && <p className="rounded-md bg-charcoal-800/70 p-2 text-xs">💡 Petak calon bertanda emas di papan.</p>}
              {!solved && (
                <div className="flex gap-2">
                  {level < 3 && <Button className="!min-h-9 flex-1 text-xs" onClick={() => reveal(level + 1)} data-testid="coach-hint">Petunjuk {level + 1}</Button>}
                  <Button variant="primary" className="!min-h-9 flex-1 text-xs" onClick={() => reveal(4)} data-testid="coach-reveal">Penyelesaian</Button>
                </div>
              )}
              {level === 0 && <p className="text-[11px] text-charcoal-400">Cuba dahulu. Kira dua jawapan lawan sebelum bergerak.</p>}
            </div>
          )}

          {tab === 'moves' && solved && (
            <ul className="space-y-1.5">{report.candidates.map((c) => <CandidateRow key={c.uci} c={c} onTry={onTryMove} />)}</ul>
          )}

          {tab === 'best' && solved && (
            <div className="space-y-1" data-testid="coach-categories">
              {report.categories.map((cat) => (
                <p key={cat.key} className="text-xs" title={cat.text}>
                  <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/30 text-[10px] font-bold text-gold-200">{cat.key}</span>
                  <span className="text-white">{cat.title}</span>
                  {cat.san ? <span className="ml-1 font-mono text-gold-300">{cat.san}</span> : <span className="ml-1 text-charcoal-400">– tiada</span>}
                </p>
              ))}
              {report.recommendation && (
                <p className="mt-1 rounded-md border border-gold-500/40 bg-gold-500/10 p-2 text-xs text-gold-100" data-testid="coach-recommendation">
                  ⚔️ {report.recommendation.text}
                </p>
              )}
              {report.nextText && <p className="text-[11px] text-charcoal-400">{report.nextText}</p>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
