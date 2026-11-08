'use client';

import { Chess, type Move, type Square } from 'chess.js';
import { useEffect, useState } from 'react';
import { Chessboard, type BoardMove, type BoardTarget, type HighlightTone } from '@/components/board/Chessboard';
import { Badge, Button, Card, CardTitle } from '@/components/ui/primitives';
import { parseUci } from '@/lib/coach/facts';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { LEVEL_INFO, PUZZLES, type PuzzleResults } from '@/lib/tactics/puzzles';
import { THEME_INFO, type Theme } from '@/lib/tactics/themes';
import type { Puzzle } from '@/lib/tactics/types';

function legalOf(c: Chess) {
  const map = new Map<Square, BoardTarget[]>();
  for (const m of c.moves({ verbose: true })) {
    const l = map.get(m.from) ?? [];
    l.push({ to: m.to, promotion: m.promotion });
    map.set(m.from, l);
  }
  return map;
}

function positionAfter(p: Puzzle, ply: number): { chess: Chess; last?: Move } {
  const c = new Chess(p.fen);
  let last: Move | undefined;
  for (const u of p.solution.slice(0, ply)) last = c.move(parseUci(u));
  return { chess: c, last };
}

const SIDE = { w: 'Putih', b: 'Hitam' } as const;

function PuzzleView({ puzzle, onDone, onNext }: { puzzle: Puzzle; onDone: (r: { solved: boolean; firstTry: boolean; attempts: number; hints: number }) => void; onNext: () => void }) {
  const [ply, setPly] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null);

  const { chess, last } = positionAfter(puzzle, ply);
  const solverTurn = ply % 2 === 0;
  const finished = ply >= puzzle.solution.length;
  const side = new Chess(puzzle.fen).turn();
  const info = THEME_INFO[puzzle.theme];

  // Opponent's reply is played automatically.
  useEffect(() => {
    if (finished || solverTurn) return;
    const t = setTimeout(() => setPly((p) => p + 1), 600);
    return () => clearTimeout(t);
  }, [finished, solverTurn, ply]);


  const onMove = (m: BoardMove) => {
    const probe = new Chess(chess.fen());
    let played: Move;
    try {
      played = probe.move(m);
    } catch {
      return;
    }
    const uci = played.from + played.to + (played.promotion ?? '');
    const ok = (puzzle.accept[ply] ?? [puzzle.solution[ply]]).includes(uci);
    if (ok) {
      // Continue along the stored line (an accepted alternative ends the puzzle only if it mates).
      if (uci !== puzzle.solution[ply] && !probe.isCheckmate()) {
        setFeedback({ tone: 'ok', text: `Langkah yang baik (${played.san})! Penyelesaian utama ialah ${puzzle.solutionSan[ply]} – kita teruskan dengannya.` });
      } else {
        setFeedback({ tone: 'ok', text: ply === 0 ? `Betul! ${played.san}` : `Bagus – ${played.san}` });
      }
      const nextPly = probe.isCheckmate() ? puzzle.solution.length : ply + 1;
      setPly(nextPly);
      if (nextPly >= puzzle.solution.length) onDone({ solved: true, firstTry: attempts === 0 && hints === 0, attempts, hints });
    } else {
      setAttempts((a) => a + 1);
      const w = puzzle.wrong.find((x) => x.uci === uci);
      setFeedback({
        tone: 'error',
        text: w
          ? `${w.san} nampak menarik, tetapi: ${w.reason} (enjin: ${w.eval})`
          : `${played.san} bukan penyelesaian. Kira jawapan lawan sebelum bergerak. Cuba lagi atau minta petunjuk.`,
      });
    }
  };

  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (hints >= 3 && solverTurn && !finished) for (const s of puzzle.hints.squares) highlights[s as Square] = 'gold';

  const reveal = () => {
    setRevealed(true);
    setFeedback({ tone: 'info', text: `Penyelesaian: ${puzzle.solutionSan.join(' ')}` });
    setPly(puzzle.solution.length);
    onDone({ solved: false, firstTry: false, attempts, hints });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
      <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))] lg:max-w-none">
        <Chessboard
          fen={chess.fen()}
          orientation={side}
          legalMoves={solverTurn && !finished ? legalOf(chess) : undefined}
          onMove={solverTurn && !finished ? onMove : undefined}
          lastMove={last ? { from: last.from, to: last.to } : undefined}
          checkSquare={chess.inCheck() ? chess.findPiece({ type: 'k', color: chess.turn() })[0] : undefined}
          highlights={highlights}
          label={`Teka-teki ${puzzle.id}`}
        />
      </div>
      <div className="space-y-4">
        <Card>
          <div className="mb-1 flex flex-wrap gap-2">
            <Badge tone="gold">{LEVEL_INFO[puzzle.level].name}</Badge>
            <Badge>{info.ms} · {info.en}</Badge>
          </div>
          <p className="font-display text-lg text-gold-200" data-testid="puzzle-objective">
            {SIDE[side]} bergerak. {puzzle.goal === 'mate' ? `Beri checkmate dalam ${puzzle.mateIn} langkah.` : info.objective}
          </p>
          <p className="mt-1 text-xs text-charcoal-400">Kira dahulu: apakah jawapan terbaik lawan selepas langkah anda?</p>
          {feedback && (
            <p
              role="status"
              data-testid="puzzle-feedback"
              className={`mt-2 rounded-lg p-2 text-sm ${feedback.tone === 'ok' ? 'bg-emerald-500/10 text-emerald-200' : feedback.tone === 'error' ? 'bg-red-500/10 text-red-200' : 'bg-charcoal-800 text-charcoal-100'}`}
            >
              {feedback.text}
            </p>
          )}
        </Card>

        {!finished ? (
          <Card>
            <CardTitle sub="Buka satu demi satu – cuba dahulu!">Petunjuk</CardTitle>
            <div className="space-y-2 text-sm">
              {hints >= 1 && <p className="rounded-lg bg-charcoal-800/70 p-2">💡 1. Ancaman / idea: {puzzle.hints.threat}</p>}
              {hints >= 2 && <p className="rounded-lg bg-charcoal-800/70 p-2">💡 2. {puzzle.hints.attacked}</p>}
              {hints >= 3 && <p className="rounded-lg bg-charcoal-800/70 p-2">💡 3. Buah yang perlu digerakkan bertanda emas.</p>}
              <div className="flex flex-wrap gap-2">
                {hints < 3 && (
                  <Button onClick={() => setHints((h) => h + 1)} data-testid="puzzle-hint">
                    Petunjuk {hints + 1}
                  </Button>
                )}
                <Button variant="danger" onClick={reveal} data-testid="puzzle-reveal">
                  Tunjuk penyelesaian
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-gold-500/40">
            <CardTitle>{revealed ? 'Penyelesaian' : 'Selesai! 🎉'}</CardTitle>
            <ol className="space-y-1 text-sm text-charcoal-100" data-testid="puzzle-explanation">
              {puzzle.explanation.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-charcoal-200">{puzzle.defence}</p>
            <p className="text-sm text-charcoal-200">{puzzle.followUp}</p>
            {puzzle.wrong.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Langkah yang menggoda tetapi salah</p>
                <ul className="mt-1 space-y-1 text-sm text-charcoal-200">
                  {puzzle.wrong.map((w) => (
                    <li key={w.uci}>
                      <span className="font-mono text-red-300">{w.san}</span> ({w.eval}) – {w.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-100">Pengajaran: {info.lesson}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={onNext} data-testid="puzzle-next">
                Teka-teki seterusnya
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-charcoal-400">
              Disahkan oleh {puzzle.verified.engine} (kedalaman {puzzle.verified.depth}) dan chess.js.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export function TacticsTrainer() {
  const [results, setResults] = usePersistentState<PuzzleResults>('tactics:results', {});
  const [level, setLevel] = useState<Puzzle['level']>(1);
  const [theme, setTheme] = useState<Theme | 'all'>('all');
  const [current, setCurrent] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  const list = PUZZLES.filter((p) => p.level === level && (theme === 'all' || p.theme === theme));
  const themesHere = [...new Set(PUZZLES.filter((p) => p.level === level).map((p) => p.theme))];
  const puzzle = PUZZLES.find((p) => p.id === current);
  const solvedTotal = Object.values(results).filter((r) => r.solved).length;

  const next = () => {
    const pool = PUZZLES.filter((p) => p.level >= level);
    const idx = puzzle ? pool.findIndex((p) => p.id === puzzle.id) : -1;
    const after = [...pool.slice(idx + 1), ...pool.slice(0, idx + 1)];
    const nextP = after.find((p) => !results[p.id]?.solved) ?? after[0];
    if (nextP) {
      setLevel(nextP.level);
      setCurrent(nextP.id);
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-charcoal-200">
            <strong className="text-gold-200">{solvedTotal}</strong> / {PUZZLES.length} teka-teki diselesaikan
          </p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tahap">
            {([1, 2, 3, 4] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={level === l}
                onClick={() => {
                  setLevel(l);
                  setTheme('all');
                  setCurrent(null);
                }}
                className={`min-h-11 rounded-lg px-3 text-sm ${level === l ? 'bg-emerald-600/25 text-gold-200 ring-1 ring-emerald-500/50' : 'border border-charcoal-700 text-charcoal-300'}`}
              >
                Tahap {l}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-charcoal-300">{LEVEL_INFO[level].text}</p>
      </Card>

      {puzzle ? (
        <>
          <Button onClick={() => setCurrent(null)}>← Senarai teka-teki</Button>
          <PuzzleView
            key={`${puzzle.id}-${round}`}
            puzzle={puzzle}
            onNext={next}
            onDone={(r) =>
              setResults((all) => {
                const prev = all[puzzle.id];
                return {
                  ...all,
                  [puzzle.id]: {
                    solved: r.solved || !!prev?.solved,
                    firstTry: r.firstTry || !!prev?.firstTry,
                    attempts: (prev?.attempts ?? 0) + r.attempts,
                    hints: (prev?.hints ?? 0) + r.hints,
                    at: Date.now(),
                  },
                };
              })
            }
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', ...themesHere] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`min-h-10 rounded-full px-3 text-xs ${theme === t ? 'bg-gold-500 text-charcoal-950' : 'border border-charcoal-700 text-charcoal-200'}`}
              >
                {t === 'all' ? 'Semua tema' : THEME_INFO[t].ms}
              </button>
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" data-testid="puzzle-list">
            {list.map((p) => {
              const r = results[p.id];
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent(p.id);
                      setRound((x) => x + 1);
                    }}
                    className="flex min-h-20 w-full flex-col items-start justify-center rounded-xl border border-charcoal-700 bg-charcoal-900/70 p-3 text-left hover:border-gold-500/50"
                  >
                    <span className="font-mono text-xs text-charcoal-400">{p.id}</span>
                    <span className="text-sm font-semibold text-white">{THEME_INFO[p.theme].ms}</span>
                    <span className="text-xs text-charcoal-400">
                      {p.goal === 'mate' ? `Mat dalam ${p.mateIn}` : 'Menang bahan'} · {new Chess(p.fen).turn() === 'w' ? 'Putih' : 'Hitam'}
                    </span>
                    {r?.solved && <span className="mt-1 text-xs text-emerald-300">{r.firstTry ? '★ Cubaan pertama' : '✓ Selesai'}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
