import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { COLOR_MS, PIECES } from '@/lib/chess/pieces';

/**
 * Static board facts used by the coach. These are simple geometric checks
 * (they ignore pins and deeper tactics), so the coach always lets Stockfish
 * have the final word on whether a move is good.
 */

export const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

export type PieceRef = { square: Square; type: PieceSymbol; color: Color };

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export function pieceName(p: { type: PieceSymbol; color?: Color }, withColor = false): string {
  const base = PIECES[p.type].ms;
  return withColor && p.color ? `${base} ${COLOR_MS[p.color]}` : base;
}

export function piecesOf(chess: Chess, color: Color): PieceRef[] {
  const out: PieceRef[] = [];
  for (const row of chess.board()) for (const p of row) if (p && p.color === color) out.push({ square: p.square, type: p.type, color: p.color });
  return out;
}

export function material(chess: Chess, color: Color): number {
  return piecesOf(chess, color).reduce((n, p) => n + (p.type === 'k' ? 0 : VALUE[p.type]), 0);
}

export type Hanging = PieceRef & { attackers: Square[]; defenders: Square[]; reason: 'undefended' | 'cheaper-attacker' };

/** Pieces of `color` that the opponent attacks and that are undefended or attacked by a cheaper piece. */
export function hangingPieces(chess: Chess, color: Color): Hanging[] {
  const out: Hanging[] = [];
  for (const p of piecesOf(chess, color)) {
    if (p.type === 'k') continue;
    const attackers = chess.attackers(p.square, other(color));
    if (attackers.length === 0) continue;
    const defenders = chess.attackers(p.square, color);
    const cheapest = Math.min(...attackers.map((s) => VALUE[chess.get(s)!.type]));
    if (defenders.length === 0) out.push({ ...p, attackers, defenders, reason: 'undefended' });
    else if (cheapest < VALUE[p.type]) out.push({ ...p, attackers, defenders, reason: 'cheaper-attacker' });
  }
  return out.sort((a, b) => VALUE[b.type] - VALUE[a.type]);
}

export type KingSafety = {
  square: Square;
  inCheck: boolean;
  castled: boolean;
  canStillCastle: boolean;
  /** Squares next to the king that the opponent attacks. */
  attackedZone: number;
  /** Own pawns directly in front of the king (3 files, next two ranks). */
  pawnShield: number;
  /** Files next to/at the king with no own pawn. */
  openFiles: number;
};

export function kingSafety(chess: Chess, color: Color): KingSafety {
  const square = chess.findPiece({ type: 'k', color })[0]!;
  const f = square.charCodeAt(0) - 97;
  const r = Number(square[1]);
  const dir = color === 'w' ? 1 : -1;
  let attackedZone = 0;
  let pawnShield = 0;
  let openFiles = 0;
  for (let df = -1; df <= 1; df++) {
    const file = f + df;
    if (file < 0 || file > 7) continue;
    for (let dr = -1; dr <= 1; dr++) {
      const rank = r + dr;
      if ((df || dr) && rank >= 1 && rank <= 8) {
        const s = `${String.fromCharCode(97 + file)}${rank}` as Square;
        if (chess.isAttacked(s, other(color))) attackedZone++;
      }
    }
    for (const step of [1, 2]) {
      const rank = r + dir * step;
      if (rank < 1 || rank > 8) continue;
      const p = chess.get(`${String.fromCharCode(97 + file)}${rank}` as Square);
      if (p && p.type === 'p' && p.color === color) pawnShield++;
    }
    let hasPawn = false;
    for (let rank = 1; rank <= 8; rank++) {
      const p = chess.get(`${String.fromCharCode(97 + file)}${rank}` as Square);
      if (p && p.type === 'p' && p.color === color) hasPawn = true;
    }
    if (!hasPawn) openFiles++;
  }
  const homeRank = color === 'w' ? 1 : 8;
  const castled = r === homeRank && (f >= 6 || f <= 2);
  const rights = chess.fen().split(' ')[2] ?? '-';
  const canStillCastle = color === 'w' ? /[KQ]/.test(rights) : /[kq]/.test(rights);
  return { square, inCheck: chess.turn() === color && chess.inCheck(), castled, canStillCastle, attackedZone, pawnShield, openFiles };
}

/** Number of knights and bishops still on their starting squares. */
export function undevelopedMinors(chess: Chess, color: Color): number {
  const home = color === 'w' ? ['b1', 'g1', 'c1', 'f1'] : ['b8', 'g8', 'c8', 'f8'];
  return home.filter((s) => {
    const p = chess.get(s as Square);
    return p && p.color === color && (p.type === 'n' || p.type === 'b');
  }).length;
}

/** Position with the other side to move ("what if I pass?"), or null when that would be illegal. */
export function nullMoveFen(fen: string): string | null {
  const c = new Chess(fen);
  if (c.inCheck()) return null;
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  const flipped = parts.join(' ');
  try {
    new Chess(flipped);
    return flipped;
  } catch {
    return null;
  }
}

export type MoveFacts = {
  san: string;
  uci: string;
  move: Move;
  capture?: PieceRef;
  check: boolean;
  mate: boolean;
  castle: boolean;
  promotion?: PieceSymbol;
  /** Opponent pieces the moved piece attacks after the move. */
  targets: PieceRef[];
  /** Valuable or undefended targets (a fork if 2 or more, counting a check). */
  forkTargets: PieceRef[];
  /** Opponent pieces newly attacked by OTHER pieces (discovered attack). */
  discovered: PieceRef[];
  /** Own pieces that were hanging before and are safe after the move. */
  rescued: PieceRef[];
  /** Own pieces left hanging after the move (including the moved piece). */
  leftHanging: Hanging[];
  /** The moved piece itself can be taken badly. */
  movedPieceHangs: boolean;
  /** Moves the opponent king zone gets attacked by. */
  kingZonePressure: number;
  developsPiece: boolean;
  centralPawn: boolean;
};

function uciOf(m: Move): string {
  return m.from + m.to + (m.promotion ?? '');
}

export function parseUci(uci: string): { from: Square; to: Square; promotion?: PieceSymbol } {
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: (uci[4] as PieceSymbol | undefined) || undefined };
}

/** What a move does, judged statically. */
export function moveFacts(fen: string, uci: string): MoveFacts | null {
  const before = new Chess(fen);
  const me = before.turn();
  const them = other(me);
  let move: Move;
  const after = new Chess(fen);
  try {
    move = after.move(parseUci(uci));
  } catch {
    return null;
  }

  const hangingBefore = hangingPieces(before, me);
  const hangingAfter = hangingPieces(after, me);
  const targets: PieceRef[] = [];
  const forkTargets: PieceRef[] = [];
  for (const p of piecesOf(after, them)) {
    const attackers = after.attackers(p.square, me);
    if (attackers.includes(move.to)) {
      targets.push(p);
      const defended = after.attackers(p.square, them).length > 0;
      if (p.type === 'k' || !defended || VALUE[p.type] > VALUE[move.promotion ?? move.piece]) forkTargets.push(p);
    }
  }
  // Discovered attacks: targets attacked by other pieces now but not before.
  const discovered: PieceRef[] = [];
  for (const p of piecesOf(after, them)) {
    if (p.type === 'p') continue;
    const nowOthers = after.attackers(p.square, me).filter((s) => s !== move.to);
    const beforeAtt = before.get(p.square)?.color === them ? before.attackers(p.square, me) : [];
    if (nowOthers.some((s) => !beforeAtt.includes(s))) discovered.push(p);
  }
  const kingSq = after.findPiece({ type: 'k', color: them })[0]!;
  const kf = kingSq.charCodeAt(0) - 97;
  const kr = Number(kingSq[1]);
  let kingZonePressure = 0;
  for (let df = -1; df <= 1; df++)
    for (let dr = -1; dr <= 1; dr++) {
      const f = kf + df;
      const r = kr + dr;
      if (f < 0 || f > 7 || r < 1 || r > 8) continue;
      if (after.attackers(`${String.fromCharCode(97 + f)}${r}` as Square, me).includes(move.to)) kingZonePressure++;
    }

  const homeRank = me === 'w' ? '1' : '8';
  return {
    san: move.san,
    uci: uciOf(move),
    move,
    capture: move.captured
      ? { square: move.isEnPassant() ? (`${move.to[0]}${move.from[1]}` as Square) : move.to, type: move.captured, color: them }
      : undefined,
    check: after.inCheck(),
    mate: after.isCheckmate(),
    castle: move.isKingsideCastle() || move.isQueensideCastle(),
    promotion: move.promotion,
    targets,
    forkTargets: forkTargets.filter((p) => p.square !== kingSq || after.inCheck()),
    discovered,
    rescued: hangingBefore.filter((h) =>
      h.square === move.from
        ? !hangingAfter.some((a) => a.square === move.to)
        : !hangingAfter.some((a) => a.square === h.square),
    ),
    leftHanging: hangingAfter,
    movedPieceHangs: hangingAfter.some((h) => h.square === move.to),
    kingZonePressure,
    developsPiece: (move.piece === 'n' || move.piece === 'b') && move.from[1] === homeRank,
    centralPawn: move.piece === 'p' && ['d4', 'e4', 'd5', 'e5', 'c4', 'c5', 'f4', 'f5'].includes(move.to),
  };
}

/** Is the move "aggressive"? Check, capture, threat on the king zone, or attack on valuable pieces. */
export function aggression(f: MoveFacts): number {
  let a = 0;
  if (f.mate) a += 100;
  if (f.check) a += 4;
  if (f.capture) a += 2 + VALUE[f.capture.type] / 3;
  if (f.forkTargets.length >= 2) a += 5;
  else if (f.forkTargets.length === 1) a += 2;
  if (f.discovered.length) a += 2;
  a += Math.min(3, f.kingZonePressure);
  if (f.promotion) a += 4;
  return a;
}

/** All legal moves that give check (SAN). */
export function checkingMoves(chess: Chess): string[] {
  return chess.moves({ verbose: true }).filter((m) => m.san.includes('+') || m.san.includes('#')).map((m) => m.san);
}

/** Captures that win material statically (target undefended, or worth more than the capturer). */
export function freeCaptures(chess: Chess): Move[] {
  const them = other(chess.turn());
  return chess
    .moves({ verbose: true })
    .filter((m) => {
      if (!m.captured) return false;
      // Is the landing square defended? (Geometric: x-rays and pins are ignored.)
      const defended = chess.attackers(m.to, them).length > 0;
      return !defended || VALUE[m.captured] > VALUE[m.piece];
    })
    .sort((a, b) => VALUE[b.captured!] - VALUE[a.captured!]);
}
