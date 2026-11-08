import type { Color, PieceSymbol, Square } from 'chess.js';
import { FILES } from './pieces';

export type PlacedPiece = { color: Color; type: PieceSymbol };

/**
 * Read only the piece-placement field of a FEN. Used for drawing, so it also
 * works for teaching diagrams that are not full legal positions (e.g. a lone Knight).
 */
export function parsePlacement(fen: string): Map<Square, PlacedPiece> {
  const map = new Map<Square, PlacedPiece>();
  const rows = (fen.split(' ')[0] ?? '').split('/');
  rows.forEach((row, i) => {
    const rank = 8 - i;
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      if (file > 7 || rank < 1) break;
      const lower = ch.toLowerCase();
      if ('pnbrqk'.includes(lower)) {
        map.set(`${FILES[file]}${rank}` as Square, {
          color: ch === lower ? 'b' : 'w',
          type: lower as PieceSymbol,
        });
      }
      file++;
    }
  });
  return map;
}

/** Build a placement-only FEN (plus given side to move) from a map of pieces. */
export function placementToFen(pieces: Map<Square, PlacedPiece>, turn: Color = 'w'): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = '';
    let empty = 0;
    for (const f of FILES) {
      const p = pieces.get(`${f}${rank}` as Square);
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += p.color === 'w' ? p.type.toUpperCase() : p.type;
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}
