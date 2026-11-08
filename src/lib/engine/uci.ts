import { Chess, type Color } from 'chess.js';

/** Score as reported by the engine: centipawns or moves-to-mate, from the side to move. */
export type Score = { type: 'cp'; value: number } | { type: 'mate'; value: number };

export type InfoLine = {
  depth: number;
  seldepth?: number;
  multipv: number;
  score: Score;
  bound?: 'lower' | 'upper';
  nodes?: number;
  nps?: number;
  time?: number;
  pv: string[];
};

/** Parse one `info … pv …` line. Returns null for lines without a score and PV (currmove, string, …). */
export function parseInfo(line: string): InfoLine | null {
  if (!line.startsWith('info ') || line.startsWith('info string')) return null;
  const t = line.split(/\s+/);
  const out: Partial<InfoLine> = { multipv: 1 };
  for (let i = 1; i < t.length; i++) {
    const k = t[i];
    switch (k) {
      case 'depth': out.depth = Number(t[++i]); break;
      case 'seldepth': out.seldepth = Number(t[++i]); break;
      case 'multipv': out.multipv = Number(t[++i]); break;
      case 'nodes': out.nodes = Number(t[++i]); break;
      case 'nps': out.nps = Number(t[++i]); break;
      case 'time': out.time = Number(t[++i]); break;
      case 'lowerbound': out.bound = 'lower'; break;
      case 'upperbound': out.bound = 'upper'; break;
      case 'score': {
        const type = t[++i];
        const value = Number(t[++i]);
        if ((type === 'cp' || type === 'mate') && Number.isFinite(value)) out.score = { type, value };
        break;
      }
      case 'pv':
        out.pv = t.slice(i + 1).filter(Boolean);
        i = t.length;
        break;
      default:
        break;
    }
  }
  if (out.depth === undefined || !out.score || !out.pv?.length) return null;
  return out as InfoLine;
}

export function parseBestMove(line: string): { best: string | null; ponder?: string } | null {
  const m = /^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/.exec(line);
  if (!m) return null;
  return { best: m[1] === '(none)' ? null : m[1]!, ponder: m[2] };
}

/** Convert a side-to-move score into White's point of view (positive = good for White). */
export function toWhite(score: Score, turn: Color): Score {
  return turn === 'w' ? score : { type: score.type, value: -score.value };
}

/** "+1.35", "-0.40", "#3", "#-2" (White's point of view). */
export function formatScore(score: Score): string {
  if (score.type === 'mate') return score.value === 0 ? '#0' : `#${score.value}`;
  const p = score.value / 100;
  return `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toFixed(2)}`;
}

/** Map a score to 0..1 for an evaluation bar (White's share). Mate = full bar. */
export function scoreToBar(score: Score): number {
  if (score.type === 'mate') return score.value > 0 ? 1 : score.value < 0 ? 0 : 0.5;
  // Logistic curve: ±400 cp ≈ 90/10.
  return 1 / (1 + Math.exp(-score.value / 180));
}

/**
 * Comparable number for sorting/thresholds: mates are huge, faster mates larger.
 * "mate 0" means the side to move is already checkmated, so it is the worst score.
 */
export function scoreValue(score: Score): number {
  if (score.type === 'cp') return score.value;
  const sign = score.value > 0 ? 1 : -1;
  return sign * (100000 - Math.abs(score.value) * 100);
}

/** Convert a UCI move list into SAN from a position. Stops at the first illegal move. */
export function pvToSan(fen: string, pv: string[]): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const uci of pv) {
    try {
      const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

/** Format a SAN line with move numbers: "4. Qxf7#" or "12... Nf6 13. Bg5". */
export function numberedLine(fen: string, san: string[]): string {
  const parts = fen.split(' ');
  let turn = parts[1] as Color;
  let no = Number(parts[5]) || 1;
  return san
    .map((m, i) => {
      const prefix = turn === 'w' ? `${no}. ` : i === 0 ? `${no}... ` : '';
      if (turn === 'b') no++;
      turn = turn === 'w' ? 'b' : 'w';
      return prefix + m;
    })
    .join(' ');
}
