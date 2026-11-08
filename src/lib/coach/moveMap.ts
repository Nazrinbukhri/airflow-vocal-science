import { Chess, type Square } from 'chess.js';
import type { Engine } from '@/lib/engine/engine';
import { scoreValue, type Score } from '@/lib/engine/uci';
import { moveFacts, pieceName } from './facts';

export type MoveTone = 'best' | 'good' | 'ok' | 'bad';

export type MoveRating = {
  uci: string;
  san: string;
  to: Square;
  /** Engine score after this move, from the mover's side. */
  score: Score;
  /** Centipawns worse than the best move in the position (capped). */
  loss: number;
  tone: MoveTone;
  /** 0..1 colour strength: strongest for the best move (green) or the worst blunder (red). */
  intensity: number;
  /** Short Malay explanation (always given for red moves). */
  reason: string;
  /** Opponent's best answer (SAN), if any. */
  reply?: string;
};

export type PieceMoveMap = { fen: string; from: Square; moves: MoveRating[]; depth: number };

const CAP = 1000;
const capped = (s: Score) => Math.max(-CAP, Math.min(CAP, scoreValue(s)));
/** A move is red when it loses this much compared with the best move, or leaves the mover clearly worse. */
export const BAD_LOSS_CP = 200;
export const LOST_SCORE_CP = -200;

/** Why a move is bad, told through the opponent's best reply. */
function badReason(fen: string, uci: string, score: Score, pv: string[], pvSan: string[], loss: number): string {
  if (score.type === 'mate' && score.value < 0) {
    return `Bahaya! Lawan boleh memberi checkmate dalam ${-score.value}: ${pvSan.slice(1, 4).join(' ')}.`;
  }
  const after = new Chess(fen);
  after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  const reply = pv[1];
  if (reply) {
    const rf = moveFacts(after.fen(), reply);
    if (rf?.capture) {
      return `Lawan menjawab ${rf.san} dan menangkap ${pieceName(rf.capture)} anda di ${rf.capture.square}. Rugi ≈ ${(loss / 100).toFixed(1)} Pion.`;
    }
    if (rf && rf.forkTargets.length >= 2) {
      return `Lawan menjawab ${rf.san}: serangan berganda pada ${rf.forkTargets.map((t) => (t.type === 'k' ? 'Raja' : pieceName(t))).join(' dan ')}.`;
    }
    if (rf?.check) return `Lawan menjawab ${rf.san} dengan check dan serangan yang kuat. Rugi ≈ ${(loss / 100).toFixed(1)} Pion.`;
    return `Lawan menjawab ${pvSan[1] ?? reply}. Kedudukan anda menjadi jauh lebih lemah (≈ ${(loss / 100).toFixed(1)} Pion).`;
  }
  return `Langkah ini melemahkan kedudukan anda (≈ ${(loss / 100).toFixed(1)} Pion).`;
}

/** Rate every legal move of the piece on `from` (two engine searches; the second covers all its moves at once). */
export async function analysePieceMoves(
  engine: Engine,
  fen: string,
  from: Square,
  { depth = 10, signal }: { depth?: number; signal?: AbortSignal } = {},
): Promise<PieceMoveMap | null> {
  const chess = new Chess(fen);
  const legal = chess.moves({ square: from, verbose: true });
  if (legal.length === 0) return { fen, from, moves: [], depth: 0 };
  const ucis = legal.map((m) => m.from + m.to + (m.promotion ?? ''));

  const overall = await engine.analyse(fen, { depth, signal });
  if (signal?.aborted || overall.stopped || !overall.lines[0]) return null;
  const best = capped(overall.lines[0].score);

  const r = await engine.analyse(fen, { depth, signal, searchMoves: ucis, multiPv: ucis.length });
  if (signal?.aborted || r.stopped) return null;

  const moves: MoveRating[] = [];
  for (const l of r.lines) {
    const uci = l.pv[0];
    const m = legal.find((x) => x.from + x.to + (x.promotion ?? '') === uci);
    if (!uci || !m) continue;
    // Promotions: keep only the strongest one per destination square.
    if (moves.some((x) => x.to === m.to)) continue;
    const v = capped(l.score);
    const loss = Math.max(0, best - v);
    const bad = loss >= BAD_LOSS_CP || v <= LOST_SCORE_CP || (l.score.type === 'mate' && l.score.value < 0);
    const tone: MoveTone = bad ? 'bad' : loss <= 20 ? 'best' : loss <= 80 ? 'good' : 'ok';
    const intensity = bad ? Math.min(1, 0.45 + loss / 800) : Math.max(0.2, 1 - loss / BAD_LOSS_CP);
    moves.push({
      uci,
      san: m.san,
      to: m.to,
      score: l.score,
      loss,
      tone,
      intensity,
      reply: l.pvSan[1],
      reason: bad
        ? badReason(fen, uci, l.score, l.pv, l.pvSan, loss)
        : tone === 'best'
          ? l.score.type === 'mate' && l.score.value > 0
            ? `Terbaik – membawa kepada checkmate dalam ${l.score.value}.`
            : 'Antara langkah terbaik untuk buah ini.'
          : `Boleh, tetapi ≈ ${(loss / 100).toFixed(1)} Pion lebih lemah daripada langkah terbaik${l.pvSan[1] ? `; lawan mungkin menjawab ${l.pvSan[1]}` : ''}.`,
    });
  }
  return { fen, from, moves, depth: r.depth };
}
