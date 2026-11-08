'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardTitle, ProgressBar } from '@/components/ui/primitives';
import { CLASS_LABEL, DEFAULT_THRESHOLDS, type MoveClass, type Thresholds } from '@/lib/analysis/classify';
import { reviewGame, type GameReview, type Phase } from '@/lib/analysis/review';
import { acquireEngine } from '@/lib/engine/browser';
import type { GameHandle } from '@/lib/hooks/useGame';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { getStore } from '@/lib/storage/db';

const PHASE_MS: Record<Phase, string> = { opening: 'Pembukaan', middlegame: 'Pertengahan', endgame: 'Endgame' };
const CLASSES: MoveClass[] = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'];

export type ReviewSummary = { at: number; moves: number; white: { accuracy: number; acpl: number }; black: { accuracy: number; acpl: number }; blunders: number; missedTactics: number };

export function GameReviewPanel({ game }: { game: GameHandle }) {
  const [thresholds, setThresholds] = usePersistentState<Thresholds>('review:thresholds', DEFAULT_THRESHOLDS);
  const [depth, setDepth] = usePersistentState('review:depth', 12);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [review, setReview] = useState<{ key: string; data: GameReview } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const moves = game.game.fullHistory();
  const key = `${game.game.initialFen()}|${moves.map((m) => m.lan).join(' ')}|${depth}|${JSON.stringify(thresholds)}`;
  const current = review?.key === key ? review.data : null;

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setError(null);
    setProgress({ done: 0, total: moves.length + 1 });
    const { engine, release } = acquireEngine();
    try {
      const r = await reviewGame(engine, game.game.initialFen(), moves, { depth, thresholds, signal: c.signal, onProgress: (done, total) => setProgress({ done, total }) });
      if (r && !c.signal.aborted) {
        setReview({ key, data: r });
        const summary: ReviewSummary = {
          at: Date.now(),
          moves: moves.length,
          white: { accuracy: r.white.accuracy, acpl: r.white.acpl },
          black: { accuracy: r.black.accuracy, acpl: r.black.acpl },
          blunders: r.white.counts.blunder + r.black.counts.blunder,
          missedTactics: r.white.missedTactics + r.black.missedTactics,
        };
        const store = await getStore();
        const prev = (await store.getSetting<ReviewSummary[]>('review:history')) ?? [];
        await store.setSetting('review:history', [summary, ...prev].slice(0, 20));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      release();
      if (ctrl.current === c) setProgress(null);
    }
  };

  const moments = current?.moves.filter((m) => m.cls === 'blunder' || m.cls === 'mistake' || m.missedWin || m.missedTactic) ?? [];

  return (
    <Card>
      <CardTitle sub="Bandingkan setiap langkah dengan langkah enjin. Penilaian enjin bukan jaminan peluang menang.">Semakan penuh permainan</CardTitle>
      {moves.length === 0 ? (
        <p className="text-sm text-charcoal-300">Muat PGN atau mainkan beberapa langkah dahulu.</p>
      ) : (
        <>
          <details className="mb-3 text-sm text-charcoal-200">
            <summary className="cursor-pointer text-charcoal-300">Tetapan (ambang centipawn dan kedalaman)</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['best', 'good', 'inaccuracy', 'mistake'] as const).map((k) => (
                <label key={k} className="flex flex-col text-xs">
                  {CLASS_LABEL[k].ms} ≤ (cp)
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={thresholds[k]}
                    onChange={(e) => setThresholds((t) => ({ ...t, [k]: Number(e.target.value) || 0 }))}
                    className="mt-1 min-h-10 rounded-lg border border-charcoal-600 bg-charcoal-950 px-2"
                  />
                </label>
              ))}
              <label className="flex flex-col text-xs">
                Kedalaman
                <select value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="mt-1 min-h-10 rounded-lg border border-charcoal-600 bg-charcoal-950 px-2">
                  {[8, 10, 12, 14, 16].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            </div>
          </details>
          {progress ? (
            <div className="space-y-2" data-testid="review-progress">
              <ProgressBar value={(progress.done / progress.total) * 100} label="Kemajuan semakan" />
              <p className="text-xs text-charcoal-300">Menganalisis kedudukan {progress.done}/{progress.total}…</p>
              <Button onClick={() => ctrl.current?.abort()}>Batal</Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => void run()} data-testid="review-run">
              {current ? 'Analisis semula' : `Analisis ${moves.length} langkah`}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
          {current && (
            <div className="mt-4 space-y-4 text-sm" data-testid="review-report">
              <div className="grid grid-cols-2 gap-2">
                {(['white', 'black'] as const).map((side) => (
                  <div key={side} className="rounded-lg bg-charcoal-800/70 p-2">
                    <p className="text-xs text-charcoal-400">{side === 'white' ? 'Putih' : 'Hitam'}</p>
                    <p className="font-display text-2xl text-gold-200" data-testid={`review-acc-${side}`}>{current[side].accuracy}%</p>
                    <p className="text-[11px] text-charcoal-400">ketepatan · ACPL {current[side].acpl}</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {CLASSES.map((c) => (
                        <li key={c} className="flex justify-between"><span>{CLASS_LABEL[c].ms}</span><span>{current[side].counts[c]}</span></li>
                      ))}
                      <li className="flex justify-between text-gold-300"><span>Kemenangan terlepas</span><span>{current[side].missedWins}</span></li>
                      <li className="flex justify-between text-gold-300"><span>Taktik terlepas</span><span>{current[side].missedTactics}</span></li>
                    </ul>
                  </div>
                ))}
              </div>
              <table className="w-full text-xs">
                <thead><tr className="text-charcoal-400"><th className="text-left">Fasa</th><th>Putih</th><th>Hitam</th></tr></thead>
                <tbody>
                  {(['opening', 'middlegame', 'endgame'] as Phase[]).map((p) => (
                    <tr key={p} className="border-t border-charcoal-700">
                      <td className="py-1">{PHASE_MS[p]}</td>
                      <td className="text-center">{current.white.phases[p] ? `${current.white.phases[p]!.accuracy}%` : '–'}</td>
                      <td className="text-center">{current.black.phases[p] ? `${current.black.phases[p]!.accuracy}%` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Detik penting</p>
                {moments.length === 0 ? (
                  <p className="text-charcoal-300">Tiada kesilapan besar pada kedalaman ini. 👏</p>
                ) : (
                  <ul className="space-y-1" data-testid="review-moments">
                    {moments.map((m) => (
                      <li key={m.ply}>
                        <button type="button" onClick={() => game.goTo(m.ply - 1)} className="w-full rounded-lg bg-charcoal-800/70 p-2 text-left hover:bg-charcoal-700">
                          <span className="font-mono text-gold-200">{Math.ceil(m.ply / 2)}{m.color === 'w' ? '.' : '…'} {m.san}</span>{' '}
                          <Badge tone={CLASS_LABEL[m.cls].tone}>{CLASS_LABEL[m.cls].ms}</Badge>{' '}
                          {m.missedWin && <Badge tone="gold">Kemenangan terlepas</Badge>} {m.missedTactic && <Badge tone="gold">Taktik terlepas</Badge>} {m.missedAttack && <Badge>Peluang serangan</Badge>}
                          <span className="mt-1 block text-xs text-charcoal-300">
                            {m.evalBefore} → {m.evalAfter}. Lebih baik: <span className="font-mono text-gold-300">{m.bestSan ?? '–'}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-[11px] text-charcoal-400">
                Ketepatan = anggaran daripada purata centipawn loss (ACPL) pada kedalaman {current.depth}. Ia bukan rating dan bukan jaminan keputusan.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
