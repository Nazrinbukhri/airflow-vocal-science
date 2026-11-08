import type { Color, PieceSymbol, Square } from 'chess.js';
import { FILES } from './pieces';

const DIRS: Record<'n' | 'b' | 'r' | 'k', [number, number][]> = {
  n: [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  k: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

function at(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return `${FILES[file]}${rank}` as Square;
}

/**
 * Squares a single piece can move to on an otherwise EMPTY board.
 * Used by the piece explorer for absolute beginners (no other pieces, so no
 * captures, checks or special moves are involved – those are taught separately).
 */
export function emptyBoardReach(type: PieceSymbol, square: Square, color: Color = 'w'): Square[] {
  const f = square.charCodeAt(0) - 97;
  const r = Number(square[1]);
  const out: Square[] = [];
  const push = (s: Square | null) => s && out.push(s);

  switch (type) {
    case 'n':
    case 'k':
      for (const [df, dr] of DIRS[type]) push(at(f + df, r + dr));
      break;
    case 'b':
    case 'r':
    case 'q': {
      const dirs = type === 'q' ? [...DIRS.b, ...DIRS.r] : DIRS[type];
      for (const [df, dr] of dirs) {
        for (let i = 1; i < 8; i++) {
          const s = at(f + df * i, r + dr * i);
          if (!s) break;
          out.push(s);
        }
      }
      break;
    }
    case 'p': {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 2 : 7;
      push(at(f, r + dir));
      if (r === startRank) push(at(f, r + 2 * dir));
      break;
    }
  }
  return out;
}
