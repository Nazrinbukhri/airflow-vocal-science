import { Chess, type Color, type Square } from 'chess.js';

const FILES = 'abcdefgh';
const sq = (f: number, r: number) => `${FILES[f]}${r}` as Square;

export function pawns(c: Chess, color: Color): Square[] {
  return c.findPiece({ type: 'p', color });
}

const fileOf = (s: Square) => s.charCodeAt(0) - 97;
const rankOf = (s: Square) => Number(s[1]);
/** Ranks are counted from `color`'s side (1 = own back rank). */
const relRank = (s: Square, color: Color) => (color === 'w' ? rankOf(s) : 9 - rankOf(s));

export function isolatedPawns(c: Chess, color: Color): Square[] {
  const ps = pawns(c, color);
  const files = new Set(ps.map(fileOf));
  return ps.filter((p) => !files.has(fileOf(p) - 1) && !files.has(fileOf(p) + 1));
}

export function doubledPawns(c: Chess, color: Color): Square[] {
  const ps = pawns(c, color);
  return ps.filter((p) => ps.some((q) => q !== p && fileOf(q) === fileOf(p)));
}

export function passedPawns(c: Chess, color: Color): Square[] {
  const enemy = pawns(c, color === 'w' ? 'b' : 'w');
  return pawns(c, color).filter((p) =>
    !enemy.some((e) => Math.abs(fileOf(e) - fileOf(p)) <= 1 && relRank(e, color) > relRank(p, color)),
  );
}

/** Passed pawns standing next to (or diagonally supporting) another passed pawn of the same colour. */
export function connectedPassedPawns(c: Chess, color: Color): Square[] {
  const passed = passedPawns(c, color);
  return passed.filter((p) => passed.some((q) => q !== p && Math.abs(fileOf(q) - fileOf(p)) === 1 && Math.abs(rankOf(q) - rankOf(p)) <= 1));
}

/**
 * Backward pawn: no friendly pawn on an adjacent file is level with or behind it,
 * and the square in front of it is attacked by an enemy pawn.
 */
export function backwardPawns(c: Chess, color: Color): Square[] {
  const own = pawns(c, color);
  const enemy = color === 'w' ? 'b' : 'w';
  const dir = color === 'w' ? 1 : -1;
  return own.filter((p) => {
    const f = fileOf(p);
    const supporters = own.filter((q) => Math.abs(fileOf(q) - f) === 1);
    if (supporters.length === 0) return false; // that is an isolated pawn
    if (supporters.some((q) => relRank(q, color) <= relRank(p, color))) return false;
    const stop = sq(f, rankOf(p) + dir);
    return c.attackers(stop, enemy).some((s) => c.get(s)?.type === 'p');
  });
}

/** Pawn-chain bases: pawns that defend another own pawn but are not defended by one themselves. */
export function chainBases(c: Chess, color: Color): Square[] {
  const own = pawns(c, color);
  const dir = color === 'w' ? 1 : -1;
  const defends = (a: Square, b: Square) => Math.abs(fileOf(a) - fileOf(b)) === 1 && rankOf(b) - rankOf(a) === dir;
  return own.filter((p) => own.some((q) => defends(p, q)) && !own.some((q) => defends(q, p)));
}

export function openFiles(c: Chess): string[] {
  const all = [...pawns(c, 'w'), ...pawns(c, 'b')];
  return [...FILES].filter((_, f) => !all.some((p) => fileOf(p) === f));
}

/** Files with no pawn of `color` but at least one enemy pawn. */
export function halfOpenFiles(c: Chess, color: Color): string[] {
  const own = pawns(c, color);
  const enemy = pawns(c, color === 'w' ? 'b' : 'w');
  return [...FILES].filter((_, f) => !own.some((p) => fileOf(p) === f) && enemy.some((p) => fileOf(p) === f));
}

/** Can a pawn of `color` ever attack this square (now or after advancing)? */
function pawnCanCover(c: Chess, color: Color, target: Square): boolean {
  const f = fileOf(target);
  return pawns(c, color).some((p) => Math.abs(fileOf(p) - f) === 1 && relRank(p, color) < relRank(target, color));
}

/** Holes: squares in `color`'s half (ranks 3–6 from its side) that its pawns can no longer protect. */
export function weakSquares(c: Chess, color: Color): Square[] {
  const out: Square[] = [];
  for (let f = 0; f < 8; f++) {
    for (let rr = 3; rr <= 4; rr++) {
      const r = color === 'w' ? rr : 9 - rr;
      const s = sq(f, r);
      if (!pawnCanCover(c, color, s)) out.push(s);
    }
  }
  return out;
}

/** Outposts for `color`: squares in the enemy half, supported by an own pawn, that no enemy pawn can attack. */
export function outposts(c: Chess, color: Color): Square[] {
  const enemy = color === 'w' ? 'b' : 'w';
  const out: Square[] = [];
  for (let f = 0; f < 8; f++) {
    for (let rr = 4; rr <= 6; rr++) {
      const r = color === 'w' ? rr : 9 - rr;
      const s = sq(f, r);
      const supported = c.attackers(s, color).some((a) => c.get(a)?.type === 'p' && c.get(a)?.color === color);
      if (supported && !pawnCanCover(c, enemy, s) && c.get(s)?.type !== 'p') out.push(s);
    }
  }
  return out;
}

/** Pawn counts per wing: queen-side a–c, centre d–e, king-side f–h. */
export function majorities(c: Chess, color: Color) {
  const count = (col: Color, lo: number, hi: number) => pawns(c, col).filter((p) => fileOf(p) >= lo && fileOf(p) <= hi).length;
  const enemy = color === 'w' ? 'b' : 'w';
  return {
    queenside: count(color, 0, 2) - count(enemy, 0, 2),
    centre: count(color, 3, 4) - count(enemy, 3, 4),
    kingside: count(color, 5, 7) - count(enemy, 5, 7),
  };
}

/** Bishop on b2/g2 (b7/g7) with the knight-pawn advanced one square. */
export function fianchettos(c: Chess, color: Color): Square[] {
  const r = color === 'w' ? 2 : 7;
  const pr = color === 'w' ? 3 : 6;
  return (['b', 'g'] as const)
    .filter((f) => {
      const bishop = c.get(`${f}${r}` as Square);
      const pawn = c.get(`${f}${pr}` as Square);
      return bishop?.type === 'b' && bishop.color === color && pawn?.type === 'p' && pawn.color === color;
    })
    .map((f) => `${f}${r}` as Square);
}
