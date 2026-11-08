import type { Move } from 'chess.js';
import { COLOR_MS, PIECES } from './pieces';

const SIDE: Record<'w' | 'b', string> = { w: 'Putih', b: 'Hitam' };

/**
 * "WHAT HAPPENED?" – a plain Bahasa Melayu sentence describing a move,
 * with the English term in brackets the first time it matters.
 */
export function describeMove(m: Move): string {
  const who = SIDE[m.color];
  const enemy = COLOR_MS[m.color === 'w' ? 'b' : 'w'];
  const parts: string[] = [];

  if (m.isKingsideCastle() || m.isQueensideCastle()) {
    const short = m.isKingsideCastle();
    const rank = m.color === 'w' ? '1' : '8';
    parts.push(
      `${who} membuat castling ${short ? 'sebelah Raja (O-O, kingside)' : 'sebelah Menteri (O-O-O, queenside)'}: ` +
        `Raja ke ${short ? 'g' : 'c'}${rank} dan Benteng ke ${short ? 'f' : 'd'}${rank}. Raja kini lebih selamat.`,
    );
  } else {
    const piece = PIECES[m.piece];
    let s = `${who} menggerakkan ${piece.ms} (${piece.en}) dari ${m.from} ke ${m.to}`;
    if (m.isEnPassant()) {
      const capturedSq = `${m.to[0]}${m.from[1]}`;
      s += `, menangkap Pion ${enemy} secara en passant (Pion di ${capturedSq} dibuang dari papan)`;
    } else if (m.captured) {
      const cap = PIECES[m.captured];
      s += ` dan menangkap ${cap.ms} ${enemy} (${cap.en}${cap.value ? `, nilai ${cap.value}` : ''})`;
    }
    parts.push(`${s}.`);
    if (m.isBigPawn()) parts.push('Pion boleh maju dua petak pada langkah pertamanya.');
    if (m.promotion) {
      parts.push(`Pion sampai ke baris terakhir dan dinaikkan pangkat (promotion) menjadi ${PIECES[m.promotion].ms}.`);
    }
  }

  if (m.san.endsWith('#')) {
    parts.push(`CHECKMATE! Raja ${enemy} diserang dan tiada jalan keluar.`);
  } else if (m.san.endsWith('+')) {
    parts.push(`Ini CHECK: Raja ${enemy} diserang dan mesti diselamatkan pada langkah seterusnya.`);
  }
  return parts.join(' ');
}
