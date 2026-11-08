import { Chess, type Color, type Move } from 'chess.js';
import { aggression, moveFacts } from '@/lib/coach/facts';
import type { Engine } from '@/lib/engine/engine';
import { formatScore, toWhite, type Score } from '@/lib/engine/uci';
import { accuracyFromAcpl, cappedCp, centipawnLoss, classify, DEFAULT_THRESHOLDS, type MoveClass, type Thresholds } from './classify';

export type Phase = 'opening' | 'middlegame' | 'endgame';

export type PositionEval = { fen: string; best?: string; bestSan?: string; score: Score; depth: number };

export type ReviewedMove = {
  ply: number;
  color: Color;
  san: string;
  uci: string;
  phase: Phase;
  loss: number;
  cls: MoveClass;
  bestSan?: string;
  evalBefore: string;
  evalAfter: string;
  missedWin: boolean;
  missedTactic: boolean;
  missedAttack: boolean;
};

export type SideSummary = {
  accuracy: number;
  acpl: number;
  counts: Record<MoveClass, number>;
  missedWins: number;
  missedTactics: number;
  phases: Record<Phase, { moves: number; acpl: number; accuracy: number } | null>;
};

export type GameReview = {
  moves: ReviewedMove[];
  white: SideSummary;
  black: SideSummary;
  depth: number;
  thresholds: Thresholds;
};

/** Non-pawn material of both sides, used to tell middlegame from endgame. */
function heavyMaterial(c: Chess): number {
  const v: Record<string, number> = { n: 3, b: 3, r: 5, q: 9 };
  let n = 0;
  for (const row of c.board()) for (const p of row) if (p && v[p.type]) n += v[p.type]!;
  return n;
}

export function phaseOf(fen: string, ply: number): Phase {
  const c = new Chess(fen);
  if (heavyMaterial(c) <= 26) return 'endgame'; // e.g. queens off and a few minor pieces gone
  if (ply <= 20) return 'opening';
  return 'middlegame';
}

/** Score of a finished position from the side to move. */
function terminalScore(c: Chess): Score {
  if (c.isCheckmate()) return { type: 'mate', value: 0 };
  return { type: 'cp', value: 0 };
}

/** Pure aggregation from per-position evaluations (index i = position before ply i+1). */
export function summarise(startFen: string, moves: Move[], evals: PositionEval[], thresholds: Thresholds = DEFAULT_THRESHOLDS, depth = 0): GameReview {
  const reviewed: ReviewedMove[] = moves.map((m, i) => {
    const before = evals[i]!;
    const after = evals[i + 1]!;
    const uci = m.from + m.to + (m.promotion ?? '');
    const loss = before.best === uci ? 0 : centipawnLoss(before.score, after.score);
    const bestCp = cappedCp(before.score);
    const afterCp = -cappedCp(after.score);
    const bestFacts = before.best && before.best !== uci ? moveFacts(before.fen, before.best) : null;
    const tacticalBest = !!bestFacts && (!!bestFacts.capture || bestFacts.check || bestFacts.forkTargets.length >= 2);
    return {
      ply: i + 1,
      color: m.color,
      san: m.san,
      uci,
      phase: phaseOf(before.fen, i + 1),
      loss,
      cls: classify(loss, thresholds),
      bestSan: before.bestSan,
      evalBefore: formatScore(toWhite(before.score, m.color)),
      evalAfter: formatScore(toWhite(after.score, m.color === 'w' ? 'b' : 'w')),
      missedWin: bestCp >= 300 && afterCp < 100,
      missedTactic: tacticalBest && loss >= thresholds.inaccuracy,
      missedAttack: !!bestFacts && aggression(bestFacts) >= 4 && loss >= thresholds.good,
    };
  });

  const side = (color: Color): SideSummary => {
    const mine = reviewed.filter((r) => r.color === color);
    const acplOf = (xs: ReviewedMove[]) => (xs.length ? xs.reduce((n, r) => n + r.loss, 0) / xs.length : 0);
    const acpl = acplOf(mine);
    const counts = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 } as Record<MoveClass, number>;
    for (const r of mine) counts[r.cls]++;
    const phases = {} as SideSummary['phases'];
    for (const ph of ['opening', 'middlegame', 'endgame'] as Phase[]) {
      const xs = mine.filter((r) => r.phase === ph);
      phases[ph] = xs.length ? { moves: xs.length, acpl: Math.round(acplOf(xs)), accuracy: accuracyFromAcpl(acplOf(xs)) } : null;
    }
    return {
      accuracy: accuracyFromAcpl(acpl),
      acpl: Math.round(acpl),
      counts,
      missedWins: mine.filter((r) => r.missedWin).length,
      missedTactics: mine.filter((r) => r.missedTactic).length,
      phases,
    };
  };
  void startFen;
  return { moves: reviewed, white: side('w'), black: side('b'), depth, thresholds };
}

/** Analyse every position of a game with the engine, then summarise. Returns null if cancelled. */
export async function reviewGame(
  engine: Engine,
  startFen: string,
  moves: Move[],
  opts: { depth?: number; thresholds?: Thresholds; signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<GameReview | null> {
  const depth = opts.depth ?? 12;
  const c = new Chess(startFen);
  const fens = [c.fen()];
  for (const m of moves) {
    c.move(m.san);
    fens.push(c.fen());
  }
  const evals: PositionEval[] = [];
  for (let i = 0; i < fens.length; i++) {
    if (opts.signal?.aborted) return null;
    const pos = new Chess(fens[i]!);
    if (pos.isGameOver()) {
      evals.push({ fen: fens[i]!, score: terminalScore(pos), depth: 0 });
    } else {
      const r = await engine.analyse(fens[i]!, { depth, signal: opts.signal });
      if (r.stopped) return null;
      const l = r.lines[0];
      evals.push({ fen: fens[i]!, best: l?.pv[0], bestSan: l?.pvSan[0], score: l?.score ?? { type: 'cp', value: 0 }, depth: r.depth });
    }
    opts.onProgress?.(i + 1, fens.length);
  }
  return summarise(startFen, moves, evals, opts.thresholds, depth);
}
