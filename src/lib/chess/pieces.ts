import type { Color, PieceSymbol, Square } from 'chess.js';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export type PieceInfo = {
  symbol: PieceSymbol;
  en: string;
  ms: string;
  /** Usual teaching value in pawns. The King is priceless, so it has none. */
  value: number | null;
  sanLetter: string;
};

/** English chess terms with their Bahasa Melayu names. */
export const PIECES: Record<PieceSymbol, PieceInfo> = {
  k: { symbol: 'k', en: 'King', ms: 'Raja', value: null, sanLetter: 'K' },
  q: { symbol: 'q', en: 'Queen', ms: 'Menteri', value: 9, sanLetter: 'Q' },
  r: { symbol: 'r', en: 'Rook', ms: 'Benteng', value: 5, sanLetter: 'R' },
  b: { symbol: 'b', en: 'Bishop', ms: 'Gajah', value: 3, sanLetter: 'B' },
  n: { symbol: 'n', en: 'Knight', ms: 'Kuda', value: 3, sanLetter: 'N' },
  p: { symbol: 'p', en: 'Pawn', ms: 'Pion', value: 1, sanLetter: '' },
};

export const COLOR_MS: Record<Color, string> = { w: 'putih', b: 'hitam' };

export function pieceImage(color: Color, type: PieceSymbol): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

export function pieceLabel(color: Color, type: PieceSymbol): string {
  const p = PIECES[type];
  return `${p.ms} ${COLOR_MS[color]} (${p.en})`;
}

export function squareColor(square: Square): 'light' | 'dark' {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

/** Squares in display order (top-left first) for the given orientation. */
export function orderedSquares(orientation: Color): Square[] {
  const out: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const file = orientation === 'w' ? FILES[col]! : FILES[7 - col]!;
      const rank = orientation === 'w' ? RANKS[7 - row]! : RANKS[row]!;
      out.push(`${file}${rank}` as Square);
    }
  }
  return out;
}

/** Which square is under a point, given the board's rectangle. */
export function squareFromPoint(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number },
  orientation: Color,
): Square | null {
  const col = Math.floor(((x - rect.left) / rect.width) * 8);
  const row = Math.floor(((y - rect.top) / rect.height) * 8);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return orderedSquares(orientation)[row * 8 + col]!;
}
