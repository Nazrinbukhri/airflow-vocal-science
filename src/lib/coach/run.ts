import { Chess, type Move } from 'chess.js';
import type { AnalysisResult, Engine } from '@/lib/engine/engine';
import { nullMoveFen } from './facts';
import { buildReport, type BookMove, type CoachReport } from './report';

export type CoachStage = 'position' | 'threats' | 'replies' | 'done';

export type CoachOptions = {
  depth?: number;
  signal?: AbortSignal;
  lastMove?: Move;
  book?: BookMove[];
  onStage?: (stage: CoachStage, partial?: AnalysisResult) => void;
};

/**
 * Collect everything the coach needs from Stockfish, then build the report:
 * 1. MultiPV 4 search of the position,
 * 2. a "null move" search to find what the opponent threatens,
 * 3. the opponent's two best replies after each of the top three candidates.
 * Returns null when cancelled.
 */
export async function runCoach(engine: Engine, fen: string, opts: CoachOptions = {}): Promise<CoachReport | null> {
  const depth = opts.depth ?? 14;
  const { signal } = opts;
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    return buildReport({ fen, main: { fen, turn: chess.turn(), depth: 0, lines: [], bestMove: null, stopped: false }, lastMove: opts.lastMove });
  }

  opts.onStage?.('position');
  const main = await engine.analyse(fen, { depth, multiPv: 4, signal, onUpdate: (p) => opts.onStage?.('position', p) });
  if (signal?.aborted) return null;

  opts.onStage?.('threats');
  const nf = nullMoveFen(fen);
  const threat = nf ? await engine.analyse(nf, { depth: Math.min(depth, 12), multiPv: 1, signal }) : null;
  if (signal?.aborted) return null;

  opts.onStage?.('replies');
  const replies = new Map<string, AnalysisResult>();
  for (const line of main.lines.slice(0, 3)) {
    const uci = line.pv[0];
    if (!uci) continue;
    const after = new Chess(fen);
    after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    if (after.isGameOver()) continue;
    replies.set(uci, await engine.analyse(after.fen(), { depth: Math.min(depth, 11), multiPv: 2, signal }));
    if (signal?.aborted) return null;
  }

  opts.onStage?.('done');
  return buildReport({ fen, main, threat, replies, book: opts.book, lastMove: opts.lastMove });
}
