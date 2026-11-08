import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { moveFacts, other, parseUci, VALUE, type PieceRef } from '@/lib/coach/facts';

export type Theme =
  | 'hanging'
  | 'mate'
  | 'double-attack'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered'
  | 'deflection'
  | 'back-rank'
  | 'sacrifice';

export type MatePattern = 'back-rank' | 'smothered' | 'arabian' | 'anastasia' | 'other';

export const THEME_INFO: Record<Theme, { ms: string; en: string; objective: string; hint: string; lesson: string }> = {
  hanging: {
    ms: 'Buah tergantung',
    en: 'Hanging piece',
    objective: 'Menangi bahan: ada buah lawan yang boleh ditangkap secara percuma.',
    hint: 'Semak setiap buah lawan: adakah ia dilindungi?',
    lesson: 'Sebelum setiap langkah, tanya: adakah lawan meninggalkan buah tanpa pertahanan?',
  },
  mate: {
    ms: 'Checkmate',
    en: 'Checkmate',
    objective: 'Beri checkmate.',
    hint: 'Lihat petak di sekeliling Raja lawan: petak mana yang masih bebas?',
    lesson: 'Checkmate = Raja diserang dan tiada petak selamat, tiada halangan, tiada tangkapan.',
  },
  'double-attack': {
    ms: 'Serangan dua buah',
    en: 'Double attack',
    objective: 'Menangi bahan dengan menyerang dua sasaran serentak.',
    hint: 'Cari langkah yang memberi check DAN menyerang buah lain.',
    lesson: 'Lawan hanya boleh membalas satu ancaman pada satu masa.',
  },
  fork: {
    ms: 'Fork Kuda',
    en: 'Knight fork',
    objective: 'Menangi bahan dengan fork: satu buah menyerang dua buah lawan.',
    hint: 'Kuda boleh menyerang dua buah yang tidak berada pada satu garisan.',
    lesson: 'Perhatikan Raja, Menteri dan Benteng lawan yang berada satu "lompatan L" dari petak yang sama.',
  },
  pin: {
    ms: 'Pin (semat)',
    en: 'Pin',
    objective: 'Menangi bahan dengan pin: buah lawan tidak boleh bergerak kerana buah yang lebih berharga di belakangnya.',
    hint: 'Cari buah lawan yang berdiri di hadapan Raja atau Menterinya pada satu garisan.',
    lesson: 'Buah yang dipin ke Raja tidak boleh bergerak langsung – serang ia lagi!',
  },
  skewer: {
    ms: 'Skewer (tusuk)',
    en: 'Skewer',
    objective: 'Menangi bahan dengan skewer: serang buah berharga supaya buah di belakangnya terdedah.',
    hint: 'Raja atau Menteri lawan berada pada satu garisan dengan buah lain di belakangnya.',
    lesson: 'Skewer ialah pin terbalik: buah yang lebih berharga di hadapan.',
  },
  discovered: {
    ms: 'Serangan terbuka',
    en: 'Discovered attack',
    objective: 'Menangi bahan dengan discovered attack: gerakkan satu buah untuk membuka serangan buah di belakangnya.',
    hint: 'Ada buah anda yang menghalang Benteng, Gajah atau Menteri anda sendiri.',
    lesson: 'Dua ancaman dalam satu langkah: buah yang bergerak DAN buah yang dibuka.',
  },
  deflection: {
    ms: 'Deflection / buang pertahanan',
    en: 'Deflection / removing the defender',
    objective: 'Tarik atau buang buah yang mempertahankan, kemudian menang.',
    hint: 'Satu buah lawan sedang melakukan dua tugas. Apakah tugasnya?',
    lesson: 'Jika satu buah melindungi dua perkara, ia sebenarnya tidak melindungi kedua-duanya.',
  },
  'back-rank': {
    ms: 'Back-rank mate',
    en: 'Back-rank mate',
    objective: 'Beri checkmate di baris belakang.',
    hint: 'Raja lawan terperangkap di belakang Pionnya sendiri.',
    lesson: 'Beri Raja anda "lubang" (luft) seperti h3/h6 supaya tidak terkena back-rank mate.',
  },
  sacrifice: {
    ms: 'Pengorbanan',
    en: 'Sacrifice',
    objective: 'Korbankan bahan untuk checkmate atau kemenangan yang lebih besar.',
    hint: 'Langkah terbaik mungkin memberi buah – kira semua jawapan lawan.',
    lesson: 'Pengorbanan yang baik dikira sampai habis, bukan diteka. Agresif ≠ melulu.',
  },
};

type Ray = [number, number];
const DIAG: Ray[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTHO: Ray[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function sqAt(f: number, r: number): Square | null {
  return f < 0 || f > 7 || r < 1 || r > 8 ? null : (`${String.fromCharCode(97 + f)}${r}` as Square);
}

export type LineTactic = { kind: 'pin' | 'skewer'; front: PieceRef; back: PieceRef };

/** After the move, does the moved line piece pin or skewer two enemy pieces on one ray? */
export function lineTactics(fen: string, uci: string): LineTactic[] {
  const c = new Chess(fen);
  const me = c.turn();
  let to: Square;
  let type: PieceSymbol;
  try {
    const m = c.move(parseUci(uci));
    to = m.to;
    type = m.promotion ?? m.piece;
  } catch {
    return [];
  }
  const rays = type === 'b' ? DIAG : type === 'r' ? ORTHO : type === 'q' ? [...DIAG, ...ORTHO] : [];
  const f0 = to.charCodeAt(0) - 97;
  const r0 = Number(to[1]);
  const out: LineTactic[] = [];
  for (const [df, dr] of rays) {
    const found: PieceRef[] = [];
    for (let i = 1; i < 8 && found.length < 2; i++) {
      const s = sqAt(f0 + df * i, r0 + dr * i);
      if (!s) break;
      const p = c.get(s);
      if (!p) continue;
      if (p.color === me) break;
      found.push({ square: s, type: p.type, color: p.color });
    }
    if (found.length < 2) continue;
    const [front, back] = found as [PieceRef, PieceRef];
    if (back.type === 'k' || VALUE[back.type] > VALUE[front.type]) out.push({ kind: 'pin', front, back });
    else if (front.type === 'k' || VALUE[front.type] > VALUE[back.type]) out.push({ kind: 'skewer', front, back });
  }
  return out;
}

/** Play a list of UCI moves; returns the positions before each move. */
export function replay(fen: string, ucis: string[]): { fens: string[]; final: Chess } {
  const c = new Chess(fen);
  const fens: string[] = [];
  for (const u of ucis) {
    fens.push(c.fen());
    c.move(parseUci(u));
  }
  return { fens, final: c };
}

/**
 * Deflection / decoy / removing the defender:
 * our later move captures on (or mates at) a square X, and X's defender was
 * captured by our first move or pulled away by the forced reply.
 */
export function isDeflection(fen: string, solution: string[]): boolean {
  if (solution.length < 3) return false;
  const { fens } = replay(fen, solution);
  const me = new Chess(fen).turn();
  const them = other(me);
  const x = solution[2]!.slice(2, 4) as Square;
  const start = new Chess(fens[0]!);
  const defendersAtStart = start.attackers(x, them);
  if (defendersAtStart.length === 0) return false;
  // Removed: our first move captured a defender of X.
  if (defendersAtStart.includes(solution[0]!.slice(2, 4) as Square) && start.get(solution[0]!.slice(2, 4) as Square)) return true;
  // Deflected: the reply moved a defender away from X.
  const beforeReply = new Chess(fens[1]!);
  const replyFrom = solution[1]!.slice(0, 2) as Square;
  if (!beforeReply.attackers(x, them).includes(replyFrom)) return false;
  const afterReply = new Chess(fens[2]!);
  const movedTo = solution[1]!.slice(2, 4) as Square;
  return !afterReply.attackers(x, them).includes(movedTo) || movedTo === x;
}

/** The first move offers material (the moved piece can be taken, or it captures a cheaper defended piece). */
export function isSacrifice(fen: string, uci: string): boolean {
  const f = moveFacts(fen, uci);
  if (!f) return false;
  const moved = VALUE[f.move.promotion ?? f.move.piece];
  if (f.capture) {
    const after = new Chess(fen);
    after.move(parseUci(uci));
    const defended = after.attackers(f.move.to, other(f.move.color)).length > 0;
    return defended && VALUE[f.capture.type] < moved;
  }
  return f.movedPieceHangs || new Chess(fen).attackers(f.move.to, other(f.move.color)).length > 0;
}

/** Name the mating pattern of a checkmate position (mated side = side to move). */
export function matePattern(final: Chess, lastUci: string): MatePattern {
  if (!final.isCheckmate()) return 'other';
  const loser: Color = final.turn();
  const winner = other(loser);
  const k = final.findPiece({ type: 'k', color: loser })[0]!;
  const kf = k.charCodeAt(0) - 97;
  const kr = Number(k[1]);
  const to = lastUci.slice(2, 4) as Square;
  const mater = final.get(to)!;
  const neighbours: Square[] = [];
  for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) if (df || dr) { const s = sqAt(kf + df, kr + dr); if (s) neighbours.push(s); }
  const ownBlocked = neighbours.filter((s) => final.get(s)?.color === loser).length;

  if (mater.type === 'n' && ownBlocked === neighbours.length) return 'smothered';
  const homeRank = loser === 'w' ? 1 : 8;
  if ((mater.type === 'r' || mater.type === 'q') && kr === homeRank && Number(to[1]) === homeRank) {
    const forward = loser === 'w' ? 1 : -1;
    const front = [-1, 0, 1].map((df) => sqAt(kf + df, kr + forward)).filter(Boolean) as Square[];
    if (front.every((s) => final.get(s)?.color === loser || final.isAttacked(s, winner))) return 'back-rank';
  }
  const knights = final.findPiece({ type: 'n', color: winner });
  if (mater.type === 'r' && Math.max(Math.abs(to.charCodeAt(0) - 97 - kf), Math.abs(Number(to[1]) - kr)) === 1 && knights.some((n) => final.attackers(to, winner).includes(n)))
    return 'arabian';
  if ((mater.type === 'r' || mater.type === 'q') && (kf === 0 || kf === 7) && to.charCodeAt(0) - 97 === kf && knights.some((n) => neighbours.some((s) => final.attackers(s, winner).includes(n))))
    return 'anastasia';
  return 'other';
}
