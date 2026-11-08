import { Chess, DEFAULT_POSITION, validateFen } from 'chess.js';

export const START_FEN = DEFAULT_POSITION;

export type FenCheck = { ok: true; fen: string } | { ok: false; error: string };

/**
 * Validate a FEN string strictly enough for teaching:
 * - chess.js structural checks (6 fields, one king each, no pawns on rank 1/8, …)
 * - the side NOT to move must not be in check (chess.js accepts that, but it is illegal)
 * Error messages are in Bahasa Melayu for the learner.
 */
export function checkFen(input: string): FenCheck {
  const fen = input.trim().replace(/\s+/g, ' ');
  if (!fen) return { ok: false, error: 'FEN kosong. Tampal satu baris FEN.' };

  const parts = fen.split(' ');
  // Accept the common short form with only placement + side (+ castling + ep).
  const defaults = ['w', '-', '-', '0', '1'];
  while (parts.length < 6 && parts.length >= 1) parts.push(defaults[parts.length - 1]!);
  const full = parts.join(' ');

  const basic = validateFen(full);
  if (!basic.ok) return { ok: false, error: translateFenError(basic.error ?? 'Invalid FEN') };

  // The side that just moved cannot still be in check.
  const flipped = [...parts];
  flipped[1] = parts[1] === 'w' ? 'b' : 'w';
  flipped[3] = '-'; // en-passant square is only valid for the real side to move
  try {
    const other = new Chess(flipped.join(' '));
    if (other.inCheck()) {
      return {
        ok: false,
        error: 'Kedudukan tidak sah: Raja pihak yang baru bergerak masih dalam check.',
      };
    }
  } catch {
    // If the flipped position cannot even be built, the structural check above is enough.
  }

  return { ok: true, fen: full };
}

function translateFenError(err: string): string {
  const e = err.toLowerCase();
  if (e.includes('six space')) return 'FEN mesti ada 6 bahagian (contoh: "… w KQkq - 0 1").';
  if (e.includes('missing white king')) return 'Tiada Raja (King) putih di papan.';
  if (e.includes('missing black king')) return 'Tiada Raja (King) hitam di papan.';
  if (e.includes('too many white kings')) return 'Terlalu banyak Raja putih.';
  if (e.includes('too many black kings')) return 'Terlalu banyak Raja hitam.';
  if (e.includes('edge rows')) return 'Pion (Pawn) tidak boleh berada di baris 1 atau 8.';
  if (e.includes('8 rows') || e.includes('row')) return 'Susunan papan salah: mesti ada 8 baris, setiap satu 8 petak.';
  if (e.includes('side to move')) return 'Giliran mesti "w" (putih) atau "b" (hitam).';
  if (e.includes('castling')) return 'Hak castling tidak sah.';
  if (e.includes('en-passant') || e.includes('en passant')) return 'Petak en passant tidak sah.';
  if (e.includes('half move') || e.includes('move number')) return 'Nombor langkah dalam FEN tidak sah.';
  return `FEN tidak sah (${err}).`;
}
