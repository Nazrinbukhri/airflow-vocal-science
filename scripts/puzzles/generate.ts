/*
 * Puzzle generator + verifier.  Usage:  npx tsx scripts/puzzles/generate.ts
 *
 * Candidate positions are built from tactical templates (random but seeded, so the
 * output is reproducible). A candidate becomes a puzzle ONLY if:
 *   - the FEN is legal (checkFen) and the side to move is not in check;
 *   - Stockfish (depth 18, MultiPV 3) finds the intended theme as the clearly best move
 *     (mate, or >= 1.5 pawns better than the second-best move);
 *   - the theme is really on the board (fork/pin/skewer/discovered/deflection/sacrifice/mate pattern);
 *   - the solution line realises the result (checkmate on the board, or material gained).
 * Output: src/lib/tactics/puzzles.json
 */
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { checkFen } from '../../src/lib/chess/fen';
import { describeMove } from '../../src/lib/chess/describe';
import { freeCaptures, material, moveFacts, other, parseUci, pieceName, VALUE, type PieceRef } from '../../src/lib/coach/facts';
import { Engine, type AnalysisResult } from '../../src/lib/engine/engine';
import { nodeTransport } from '../../src/lib/engine/node-transport';
import { formatScore, scoreValue, toWhite } from '../../src/lib/engine/uci';
import { isDeflection, isSacrifice, lineTactics, matePattern, replay, THEME_INFO, type MatePattern, type Theme } from '../../src/lib/tactics/themes';
import type { Puzzle } from '../../src/lib/tactics/types';

const DEPTH = 16;
const UNIQUE_MARGIN = 150;

// ------------------------------------------------------------------ random helpers
let seed = 20261108;
function rnd(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const sq = (f: number, r: number) => (f < 0 || f > 7 || r < 1 || r > 8 ? null : (`${'abcdefgh'[f]}${r}` as Square));
const fr = (s: Square) => [s.charCodeAt(0) - 97, Number(s[1])] as const;

type Board = Map<Square, { color: Color; type: PieceSymbol }>;

function fenOf(b: Board, turn: Color = 'w'): string {
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = '';
    let e = 0;
    for (let f = 0; f < 8; f++) {
      const p = b.get(sq(f, r)!);
      if (!p) { e++; continue; }
      if (e) row += e;
      e = 0;
      row += p.color === 'w' ? p.type.toUpperCase() : p.type;
    }
    if (e) row += e;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

function put(b: Board, s: Square | null, color: Color, type: PieceSymbol): boolean {
  if (!s || b.has(s)) return false;
  if (type === 'p' && (s[1] === '1' || s[1] === '8')) return false;
  b.set(s, { color, type });
  return true;
}

function randomFree(b: Board, ranks: [number, number] = [1, 8], files: [number, number] = [0, 7]): Square {
  for (;;) {
    const s = sq(int(files[0], files[1]), int(ranks[0], ranks[1]))!;
    if (!b.has(s)) return s;
  }
}

function addPawns(b: Board, color: Color, n: number) {
  for (let i = 0; i < n; i++) put(b, randomFree(b, color === 'w' ? [2, 5] : [4, 7]), color, 'p');
}

/** Add pieces/pawns to the poorer side (in its own half) until material is roughly equal. */
function balance(b: Board) {
  const VAL: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const mat = (c: Color) => [...b.values()].filter((p) => p.color === c).reduce((n, p) => n + VAL[p.type], 0);
  for (let guard = 0; guard < 12; guard++) {
    const diff = mat('w') - mat('b');
    if (Math.abs(diff) <= 1) return;
    const poor: Color = diff > 0 ? 'b' : 'w';
    const need = Math.abs(diff);
    const options = (['q', 'r', 'b', 'n', 'p'] as PieceSymbol[]).filter((t) => VAL[t] <= need);
    const type = pick(options.slice(0, 2));
    put(b, randomFree(b, poor === 'w' ? [1, 3] : [6, 8]), poor, type);
  }
}

/** Mirror ranks and swap colours: a White-to-move puzzle becomes a Black-to-move one. */
function colourFlip(fen: string): string {
  const c = new Chess(fen);
  const b: Board = new Map();
  for (const row of c.board()) for (const p of row) if (p) b.set(`${p.square[0]}${9 - Number(p.square[1])}` as Square, { color: other(p.color), type: p.type });
  return fenOf(b, other(c.turn()));
}
/** Mirror files a↔h. */
function fileFlip(fen: string): string {
  const c = new Chess(fen);
  const b: Board = new Map();
  for (const row of c.board()) for (const p of row) if (p) b.set(`${'hgfedcba'['abcdefgh'.indexOf(p.square[0]!)]}${p.square[1]}` as Square, { color: p.color, type: p.type });
  return fenOf(b, c.turn());
}

function legalStart(fen: string): Chess | null {
  const ok = checkFen(fen);
  if (!ok.ok) return null;
  const c = new Chess(fen);
  if (c.inCheck() || c.isGameOver()) return null;
  return c;
}

// ------------------------------------------------------------------ templates (White to move)
type Template = { theme: Theme; level: Puzzle['level']; goal: Puzzle['goal']; maxMate?: number; pattern?: MatePattern; build: () => string | null; quota: number };

function kings(b: Board, wRanks: [number, number] = [1, 2], bRanks: [number, number] = [7, 8]) {
  for (;;) {
    const w = randomFree(b, wRanks);
    const k = randomFree(b, bRanks);
    const [wf, wr] = fr(w);
    const [kf, kr] = fr(k);
    if (Math.max(Math.abs(wf - kf), Math.abs(wr - kr)) > 1) { put(b, w, 'w', 'k'); put(b, k, 'b', 'k'); return { w, k }; }
  }
}

const TEMPLATES: Template[] = [
  {
    theme: 'hanging', level: 1, goal: 'material', quota: 10,
    build() {
      const b: Board = new Map();
      kings(b);
      const target = randomFree(b, [3, 6]);
      put(b, target, 'b', pick(['n', 'b', 'r', 'q'] as const));
      put(b, randomFree(b, [2, 6]), 'w', pick(['n', 'b', 'r', 'q'] as const));
      put(b, randomFree(b, [4, 7]), 'b', pick(['n', 'b', 'r'] as const));
      addPawns(b, 'w', int(1, 3));
      addPawns(b, 'b', int(1, 3));
      return fenOf(b);
    },
  },
  {
    theme: 'mate', level: 1, goal: 'mate', maxMate: 1, quota: 10,
    build() {
      const b: Board = new Map();
      const k = sq(int(0, 7), 8)!;
      put(b, k, 'b', 'k');
      const [kf] = fr(k);
      put(b, sq(Math.max(0, Math.min(7, kf + int(-1, 1))), 6), 'w', 'k');
      put(b, randomFree(b, [1, 7]), 'w', pick(['q', 'r', 'q'] as const));
      if (rnd() < 0.4) put(b, randomFree(b, [7, 8]), 'b', pick(['p', 'n', 'b'] as const));
      return fenOf(b);
    },
  },
  {
    theme: 'double-attack', level: 1, goal: 'material', quota: 8,
    build() {
      const b: Board = new Map();
      kings(b, [1, 2], [6, 8]);
      put(b, randomFree(b, [2, 6]), 'w', 'q');
      put(b, randomFree(b, [3, 8]), 'b', pick(['r', 'b', 'n'] as const));
      addPawns(b, 'w', int(1, 3));
      addPawns(b, 'b', int(1, 3));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'fork', level: 2, goal: 'material', quota: 14,
    build() {
      const b: Board = new Map();
      const F = sq(int(1, 6), int(4, 7))!;
      const [ff, fr0] = fr(F);
      const jumps = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].map(([a, c]) => sq(ff + a!, fr0 + c!)).filter(Boolean) as Square[];
      const t = [...jumps].sort(() => rnd() - 0.5);
      const types = pick([['k', 'q'], ['k', 'r'], ['q', 'r'], ['k', 'q']] as const);
      if (!put(b, t[0]!, 'b', types[0]) || !put(b, t[1]!, 'b', types[1])) return null;
      if (types[0] !== 'k') put(b, randomFree(b, [7, 8]), 'b', 'k');
      const from = (jumps.length ? [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]] : []).map(([a, c]) => sq(ff + a!, fr0 + c!)).filter((s) => s && !b.has(s)) as Square[];
      if (!from.length) return null;
      put(b, pick(from), 'w', 'n');
      put(b, randomFree(b, [1, 2]), 'w', 'k');
      addPawns(b, 'w', int(1, 3));
      addPawns(b, 'b', int(1, 3));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'pin', level: 2, goal: 'material', quota: 10,
    build() {
      const b: Board = new Map();
      const diag = rnd() < 0.6;
      const dirs = diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const back = rnd() < 0.7 ? 'k' : 'q';
      const kSq = sq(int(1, 6), int(5, 8))!;
      put(b, kSq, 'b', back);
      if (back !== 'k') put(b, randomFree(b, [7, 8]), 'b', 'k');
      const [d0, d1] = pick(dirs)!;
      const [kf, kr] = fr(kSq);
      const gap = int(1, 2);
      const front = sq(kf + d0! * gap, kr + d1! * gap);
      if (!put(b, front, 'b', diag ? pick(['n', 'r'] as const) : pick(['n', 'b'] as const))) return null;
      const T = sq(kf + d0! * (gap + int(1, 3)), kr + d1! * (gap + int(1, 3)));
      if (!T || b.has(T)) return null;
      // Pinning piece placed somewhere it can reach T.
      const pinner = diag ? pick(['b', 'q'] as const) : pick(['r', 'q'] as const);
      const [tf, tr] = fr(T);
      const reach = (diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]]).flatMap(([a, c]) => [1, 2, 3, 4].map((i) => sq(tf + a! * i, tr + c! * i))).filter((s) => s && !b.has(s)) as Square[];
      if (!reach.length) return null;
      put(b, pick(reach), 'w', pinner);
      if (rnd() < 0.6) put(b, randomFree(b, [2, 5]), 'w', pick(['n', 'p'] as const));
      put(b, randomFree(b, [1, 2]), 'w', 'k');
      addPawns(b, 'w', int(1, 2));
      addPawns(b, 'b', int(1, 3));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'skewer', level: 2, goal: 'material', quota: 10,
    build() {
      const b: Board = new Map();
      const diag = rnd() < 0.5;
      const dirs = diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const kSq = sq(int(1, 6), int(3, 7))!;
      put(b, kSq, 'b', 'k');
      const [d0, d1] = pick(dirs)!;
      const [kf, kr] = fr(kSq);
      const gap = int(1, 3);
      if (!put(b, sq(kf + d0! * gap, kr + d1! * gap), 'b', pick(['q', 'r'] as const))) return null;
      const T = sq(kf - d0! * int(1, 3), kr - d1! * int(1, 3));
      if (!T || b.has(T)) return null;
      const piece = diag ? pick(['b', 'q'] as const) : pick(['r', 'q'] as const);
      const [tf, tr] = fr(T);
      const reach = (diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]]).flatMap(([a, c]) => [1, 2, 3, 4].map((i) => sq(tf + a! * i, tr + c! * i))).filter((s) => s && !b.has(s)) as Square[];
      if (!reach.length) return null;
      put(b, pick(reach), 'w', piece);
      put(b, randomFree(b, [1, 2]), 'w', 'k');
      addPawns(b, 'w', int(1, 3));
      addPawns(b, 'b', int(0, 2));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'discovered', level: 2, goal: 'material', quota: 10,
    build() {
      const b: Board = new Map();
      const diag = rnd() < 0.5;
      const dirs = diag ? [[1, 1], [-1, 1]] : [[0, 1], [1, 0], [-1, 0]];
      const [d0, d1] = pick(dirs)!;
      const L = sq(int(0, 7), int(1, 3))!;
      const [lf, lr] = fr(L);
      put(b, L, 'w', diag ? pick(['b', 'q'] as const) : pick(['r', 'q'] as const));
      const n = int(1, 2);
      if (!put(b, sq(lf + d0! * n, lr + d1! * n), 'w', pick(['n', 'b', 'n', 'p'] as const))) return null;
      const target = sq(lf + d0! * (n + int(1, 4)), lr + d1! * (n + int(1, 4)));
      if (!put(b, target, 'b', pick(['q', 'k', 'q'] as const))) return null;
      if (![...b.values()].some((p) => p.color === 'b' && p.type === 'k')) put(b, randomFree(b, [6, 8]), 'b', 'k');
      put(b, randomFree(b, [3, 7]), 'b', pick(['r', 'q', 'b', 'n'] as const));
      if (![...b.values()].some((p) => p.color === 'w' && p.type === 'k')) put(b, randomFree(b, [1, 2]), 'w', 'k');
      addPawns(b, 'w', int(0, 2));
      addPawns(b, 'b', int(1, 3));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'back-rank', level: 3, goal: 'mate', maxMate: 2, pattern: 'back-rank', quota: 8,
    build() {
      const b: Board = new Map();
      const kf = pick([6, 7, 6]);
      put(b, sq(kf, 8), 'b', 'k');
      for (const f of [kf - 1, kf, kf + 1]) if (f >= 0 && f <= 7) put(b, sq(f, 7), 'b', 'p');
      if (rnd() < 0.5) put(b, sq(int(0, 4), 8), 'b', 'r');
      if (rnd() < 0.4) put(b, randomFree(b, [4, 7], [0, 4]), 'b', pick(['q', 'n', 'b'] as const));
      const file = int(0, 4);
      put(b, sq(file, int(1, 3)), 'w', pick(['r', 'q', 'r'] as const));
      if (rnd() < 0.6) put(b, sq(file, int(1, 4)), 'w', pick(['r', 'q'] as const));
      put(b, sq(int(5, 7), 1), 'w', 'k');
      for (const f of [5, 6, 7]) if (rnd() < 0.8) put(b, sq(f, 2), 'w', 'p');
      return fenOf(b);
    },
  },
  {
    theme: 'deflection', level: 3, goal: 'material', quota: 8,
    build() {
      // A black piece guards two things, or a single defender can be removed.
      const b: Board = new Map();
      kings(b, [1, 2], [7, 8]);
      const target = randomFree(b, [4, 7]);
      put(b, target, 'b', pick(['r', 'q', 'b'] as const));
      const defender = randomFree(b, [4, 8]);
      put(b, defender, 'b', pick(['n', 'b', 'r'] as const));
      put(b, randomFree(b, [2, 6]), 'w', pick(['r', 'q', 'b'] as const));
      put(b, randomFree(b, [2, 6]), 'w', pick(['r', 'b', 'n'] as const));
      addPawns(b, 'w', int(1, 3));
      addPawns(b, 'b', int(1, 3));
      balance(b);
      return fenOf(b);
    },
  },
  {
    theme: 'mate', level: 2, goal: 'mate', maxMate: 2, quota: 6,
    build() {
      const b: Board = new Map();
      const k = sq(int(0, 7), pick([7, 8, 8]))!;
      put(b, k, 'b', 'k');
      put(b, randomFree(b, [1, 3]), 'w', 'k');
      put(b, randomFree(b, [3, 7]), 'w', pick(['q', 'r'] as const));
      put(b, randomFree(b, [3, 7]), 'w', pick(['r', 'b', 'n', 'q'] as const));
      addPawns(b, 'b', int(1, 3));
      addPawns(b, 'w', int(0, 2));
      return fenOf(b);
    },
  },
  {
    theme: 'sacrifice', level: 4, goal: 'mate', maxMate: 4, pattern: 'smothered', quota: 4,
    build() {
      const b: Board = new Map();
      put(b, sq(7, 8), 'b', 'k');
      put(b, sq(6, 7), 'b', 'p');
      put(b, sq(7, 7), 'b', 'p');
      put(b, sq(int(2, 5), 8), 'b', 'r');
      if (rnd() < 0.5) put(b, randomFree(b, [5, 7], [0, 3]), 'b', pick(['q', 'b'] as const));
      // Queen on the a2–g8 diagonal, knight that can reach f7.
      put(b, pick(['c4', 'b3', 'd5', 'a2'] as Square[]), 'w', 'q');
      put(b, pick(['e5', 'g5', 'd6', 'h6', 'd8'] as Square[]), 'w', 'n');
      put(b, sq(6, 1), 'w', 'k');
      put(b, sq(6, 2), 'w', 'p');
      put(b, sq(7, 2), 'w', 'p');
      return fenOf(b);
    },
  },
  {
    theme: 'mate', level: 4, goal: 'mate', maxMate: 1, pattern: 'smothered', quota: 2,
    build() {
      const b: Board = new Map();
      put(b, sq(7, 8), 'b', 'k');
      put(b, sq(6, 8), 'b', 'r');
      put(b, sq(6, 7), 'b', 'p');
      put(b, sq(7, 7), 'b', 'p');
      put(b, pick(['e5', 'g5', 'd6', 'h6', 'd8', 'e5'] as Square[]), 'w', 'n');
      put(b, randomFree(b, [1, 2], [4, 7]), 'w', 'k');
      put(b, randomFree(b, [1, 5], [0, 3]), 'w', pick(['q', 'r'] as const));
      addPawns(b, 'w', int(1, 2));
      addPawns(b, 'b', int(0, 2));
      return fenOf(b);
    },
  },
  {
    theme: 'sacrifice', level: 4, goal: 'mate', maxMate: 3, pattern: 'anastasia', quota: 3,
    build() {
      const b: Board = new Map();
      put(b, sq(7, 8), 'b', 'k');
      put(b, sq(6, 7), 'b', 'p');
      put(b, sq(7, 7), 'b', 'p');
      put(b, sq(int(2, 5), 8), 'b', 'r');
      put(b, sq(4, 7), 'w', 'n');
      put(b, pick(['h5', 'h3', 'h4', 'd3', 'e4'] as Square[]), 'w', 'q');
      put(b, sq(int(0, 4), int(3, 5)), 'w', 'r');
      put(b, sq(6, 1), 'w', 'k');
      put(b, sq(5, 2), 'w', 'p');
      put(b, sq(6, 2), 'w', 'p');
      addPawns(b, 'b', int(1, 2));
      return fenOf(b);
    },
  },
  {
    theme: 'mate', level: 4, goal: 'mate', maxMate: 2, pattern: 'arabian', quota: 3,
    build() {
      const b: Board = new Map();
      put(b, sq(7, 8), 'b', 'k');
      put(b, sq(7, 7), 'b', 'p');
      if (rnd() < 0.5) put(b, sq(6, 6), 'b', 'p');
      put(b, pick(['f6', 'g5', 'e4', 'd5'] as Square[]), 'w', 'n');
      put(b, sq(int(0, 6), int(1, 7)), 'w', 'r');
      put(b, randomFree(b, [1, 2]), 'w', 'k');
      put(b, randomFree(b, [5, 8], [0, 4]), 'b', pick(['r', 'q', 'b'] as const));
      addPawns(b, 'w', int(1, 2));
      addPawns(b, 'b', int(0, 2));
      return fenOf(b);
    },
  },
];

/** Hand-made classic positions (still fully engine-verified). */
const SEEDS: { fen: string; theme: Theme; level: Puzzle['level']; goal: Puzzle['goal']; maxMate?: number }[] = [
  // Greek gift sacrifice Bxh7+ (French/Classical structure).
  { fen: 'rnbq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQ - 1 7', theme: 'sacrifice', level: 4, goal: 'material' },
  { fen: 'r1bq1rk1/pppnbppp/4p3/3pP3/3P4/3B1N2/PPP2PPP/RNBQK2R w KQ - 1 7', theme: 'sacrifice', level: 4, goal: 'material' },
  { fen: 'r1b2rk1/pp1nqppp/2p1p3/3pP3/3P4/3B1N2/PPPQ1PPP/R3K2R w KQ - 0 11', theme: 'sacrifice', level: 4, goal: 'material' },
  // Legal-style queen sacrifice ideas and back-rank deflections.
  { fen: '2r3k1/5ppp/8/8/8/8/1Q3PPP/2R3K1 w - - 0 1', theme: 'deflection', level: 3, goal: 'material' },
  { fen: '3r2k1/5ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1', theme: 'back-rank', level: 3, goal: 'mate', maxMate: 3 },
  { fen: '6k1/3q1ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1', theme: 'pin', level: 2, goal: 'material' },
];

// ------------------------------------------------------------------ verification
const engine = new Engine(nodeTransport());

function mover(score: { type: 'cp' | 'mate'; value: number }) {
  return scoreValue(score);
}

async function solveMaterial(fen: string, main: AnalysisResult): Promise<{ solution: string[]; accept: Record<number, string[]> } | null> {
  const c0 = new Chess(fen);
  const me = c0.turn();
  const start = material(c0, me) - material(c0, other(me));
  const best = main.lines[0]!;
  const pv = best.pv.slice(0, 5);
  const accept: Record<number, string[]> = { 0: [pv[0]!] };
  for (let len = 1; len <= pv.length; len += 2) {
    const { final } = replay(fen, pv.slice(0, len));
    const gain = material(final, me) - material(final, other(me)) - start;
    // The line must end after OUR move with a real material gain that survives the opponent's best reply.
    if (gain >= 2) {
      const after = await engine.analyse(final.fen(), { depth: 12 });
      const v = after.lines[0] ? -mover(after.lines[0].score) : 0;
      if (v < 150) return null;
      // Each later learner move: accept any move within 50 cp of the best.
      for (let i = 2; i < len; i += 2) {
        const { final: pos } = replay(fen, pv.slice(0, i));
        const r = await engine.analyse(pos.fen(), { depth: 14, multiPv: 3 });
        const top = mover(r.lines[0]!.score);
        accept[i] = r.lines.filter((l) => top - mover(l.score) <= 50).map((l) => l.pv[0]!);
        if (!accept[i]!.includes(pv[i]!)) accept[i]!.unshift(pv[i]!);
      }
      return { solution: pv.slice(0, len), accept };
    }
  }
  return null;
}

async function solveAttack(fen: string, main: AnalysisResult): Promise<{ solution: string[]; accept: Record<number, string[]> } | null> {
  const pv = main.lines[0]!.pv.slice(0, 3);
  if (pv.length < 3) return null;
  const { final } = replay(fen, pv);
  const r = await engine.analyse(final.fen(), { depth: 14 });
  if (!r.lines[0] || -mover(r.lines[0].score) < 150) return null;
  const { final: pos } = replay(fen, pv.slice(0, 2));
  const r2 = await engine.analyse(pos.fen(), { depth: 14, multiPv: 3 });
  const top = mover(r2.lines[0]!.score);
  const accept2 = r2.lines.filter((l) => top - mover(l.score) <= 60).map((l) => l.pv[0]!);
  if (!accept2.includes(pv[2]!)) accept2.unshift(pv[2]!);
  return { solution: pv, accept: { 0: [pv[0]!], 2: accept2 } };
}

/** Cheap check before spending engine time: does any first move show the theme? */
function prefilter(t: { theme: Theme; maxMate?: number; goal: Puzzle['goal'] }, fen: string): boolean {
  const c = new Chess(fen);
  const moves = c.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
  if (t.goal === 'mate' && (t.maxMate ?? 1) === 1)
    return c.moves({ verbose: true }).some((m) => { const x = new Chess(fen); x.move(m.san); return x.isCheckmate(); });
  switch (t.theme) {
    case 'hanging':
    case 'double-attack':
    case 'fork':
    case 'pin':
    case 'skewer':
    case 'discovered':
      return moves.some((u) => themeOk(t.theme, fen, [u]));
    case 'deflection':
      return c.moves({ verbose: true }).some((m) => m.captured || m.san.includes('+'));
    default:
      return true;
  }
}

async function solveMate(fen: string, main: AnalysisResult, mateIn: number): Promise<{ solution: string[]; accept: Record<number, string[]> } | null> {
  const pv = main.lines[0]!.pv.slice(0, 2 * mateIn - 1);
  if (pv.length !== 2 * mateIn - 1) return null;
  const { final } = replay(fen, pv);
  if (!final.isCheckmate()) return null;
  const accept: Record<number, string[]> = {};
  for (let i = 0; i < pv.length; i += 2) {
    const { final: pos } = replay(fen, pv.slice(0, i));
    const remaining = mateIn - i / 2;
    if (remaining === 1) {
      accept[i] = pos.moves({ verbose: true }).filter((m) => { const t = new Chess(pos.fen()); t.move(m.san); return t.isCheckmate(); }).map((m) => m.from + m.to + (m.promotion ?? ''));
    } else {
      const r = await engine.analyse(pos.fen(), { depth: DEPTH, multiPv: 3 });
      accept[i] = r.lines.filter((l) => l.score.type === 'mate' && l.score.value > 0 && l.score.value <= remaining).map((l) => l.pv[0]!);
      if (!accept[i]!.includes(pv[i]!)) accept[i]!.unshift(pv[i]!);
    }
  }
  return { solution: pv, accept };
}

function themeOk(theme: Theme, fen: string, solution: string[], pattern?: MatePattern): boolean {
  const first = solution[0]!;
  const f = moveFacts(fen, first);
  if (!f) return false;
  const { final } = replay(fen, solution);
  switch (theme) {
    case 'hanging':
      return !!f.capture && new Chess(fen).attackers(f.move.to, other(f.move.color)).length === 0 && VALUE[f.capture.type] >= 3;
    case 'double-attack':
      return !f.capture && f.forkTargets.length >= 2 && f.move.piece !== 'n';
    case 'fork':
      return f.move.piece === 'n' && f.forkTargets.length >= 2 && f.forkTargets.some((t) => t.type === 'k' || t.type === 'q');
    case 'pin':
      return lineTactics(fen, first).some((t) => t.kind === 'pin');
    case 'skewer':
      return lineTactics(fen, first).some((t) => t.kind === 'skewer' && (t.front.type === 'k' || t.front.type === 'q'));
    case 'discovered': {
      const c = new Chess(fen);
      c.move(parseUci(first));
      const discCheck = c.inCheck() && !c.attackers(c.findPiece({ type: 'k', color: c.turn() })[0]!, other(c.turn())).includes(f.move.to);
      return discCheck || f.discovered.some((p) => p.type === 'q' || p.type === 'r' || p.type === 'k');
    }
    case 'deflection':
      return isDeflection(fen, solution);
    case 'sacrifice':
      return isSacrifice(fen, first) && (solution.length < 2 || solution[1]!.slice(2, 4) === first.slice(2, 4));
    case 'back-rank':
      return final.isCheckmate() && matePattern(final, solution[solution.length - 1]!) === 'back-rank';
    case 'mate':
      return final.isCheckmate() && (!pattern || matePattern(final, solution[solution.length - 1]!) === pattern);
  }
}

const sanList = (fen: string, ucis: string[]) => {
  const c = new Chess(fen);
  return ucis.map((u) => c.move(parseUci(u)).san);
};

function targetsText(ps: PieceRef[]) {
  return ps.map((p) => (p.type === 'k' ? `Raja di ${p.square}` : `${pieceName(p)} di ${p.square}`)).join(' dan ');
}

export async function buildPuzzle(fen: string, t: { theme: Theme; level: Puzzle['level']; goal: Puzzle['goal']; maxMate?: number; pattern?: MatePattern }, id: string): Promise<Puzzle | null> {
  const c = legalStart(fen);
  if (!c) return null;
  // Fast screen: a shallow search must already like the position for the solver.
  const quick = await engine.analyse(fen, { depth: 8 });
  const q = quick.lines[0];
  if (!q) return null;
  if (t.goal === 'mate' ? !(q.score.type === 'mate' && q.score.value > 0) : mover(q.score) < 150) return null;
  const main = await engine.analyse(fen, { depth: DEPTH, multiPv: 3 });
  const best = main.lines[0];
  if (!best) return null;
  const second = main.lines[1];
  let sol: { solution: string[]; accept: Record<number, string[]> } | null = null;
  let mateIn: number | undefined;

  if (t.goal === 'mate') {
    if (best.score.type !== 'mate' || best.score.value <= 0 || best.score.value > (t.maxMate ?? 1)) return null;
    mateIn = best.score.value;
    if (mateIn > 1 && second && second.score.type === 'mate' && second.score.value > 0 && second.score.value <= mateIn) return null;
    if (mateIn === 1) {
      const mates = c.moves({ verbose: true }).filter((m) => { const x = new Chess(fen); x.move(m.san); return x.isCheckmate(); });
      if (mates.length > 2) return null;
    }
    sol = await solveMate(fen, main, mateIn);
  } else if (t.theme === 'sacrifice') {
    // Attacking sacrifice (e.g. Greek gift): the reward is a winning attack, judged by the engine.
    const bv = mover(best.score);
    if (bv < 150 || (second && bv - mover(second.score) < 100)) return null;
    sol = await solveAttack(fen, main);
  } else {
    const bv = mover(best.score);
    if (best.score.type === 'mate') return null; // mates belong to mate themes
    if (bv < 200) return null;
    if (second && bv - mover(second.score) < UNIQUE_MARGIN) return null;
    if (second && mover(second.score) > 150) return null; // position must not be winning without the tactic
    sol = await solveMaterial(fen, main);
  }
  if (!sol) return null;
  if (!themeOk(t.theme, fen, sol.solution, t.pattern)) return null;

  const san = sanList(fen, sol.solution);
  const facts = moveFacts(fen, sol.solution[0]!)!;
  const me = c.turn();

  // Tempting wrong moves: engine alternatives + obvious captures/checks, each evaluated with searchmoves.
  const wrongCandidates = new Set<string>(main.lines.slice(1, 3).map((l) => l.pv[0]!));
  for (const m of freeCaptures(c).slice(0, 2)) wrongCandidates.add(m.from + m.to + (m.promotion ?? ''));
  for (const m of c.moves({ verbose: true }).filter((m) => m.san.includes('+')).slice(0, 2)) wrongCandidates.add(m.from + m.to + (m.promotion ?? ''));
  const accepted0 = new Set(sol.accept[0] ?? [sol.solution[0]!]);
  const wrong: Puzzle['wrong'] = [];
  for (const u of [...wrongCandidates].filter((u) => !accepted0.has(u)).slice(0, 3)) {
    const r = await engine.analyse(fen, { depth: 14, searchMoves: [u] });
    const l = r.lines[0];
    if (!l) continue;
    const loss = (mover(best.score) - mover(l.score)) / 100;
    const refut = l.pvSan[1];
    wrong.push({
      san: l.pvSan[0]!,
      uci: u,
      eval: formatScore(l.scoreWhite),
      refutation: refut,
      reason:
        l.score.type === 'mate' && l.score.value < 0
          ? `Langkah ini membenarkan lawan memberi checkmate${refut ? ` bermula dengan ${refut}` : ''}.`
          : `Lebih lemah${Number.isFinite(loss) && loss < 50 ? ` kira-kira ${loss.toFixed(1)} Pion` : ''} daripada penyelesaian${refut ? `; lawan menjawab ${refut}` : ''}.`,
    });
  }

  const startC = new Chess(fen);
  const explanation: string[] = [];
  const m0 = startC.move(parseUci(sol.solution[0]!));
  explanation.push(describeMove(m0));
  if (facts.forkTargets.length >= 2) explanation.push(`Satu langkah menyerang ${targetsText(facts.forkTargets)} serentak.`);
  const lt = lineTactics(fen, sol.solution[0]!);
  for (const x of lt) explanation.push(x.kind === 'pin'
    ? `Pin: ${pieceName(x.front)} di ${x.front.square} tidak boleh lari kerana ${x.back.type === 'k' ? 'Raja' : pieceName(x.back)} di ${x.back.square} berada di belakangnya.`
    : `Skewer: ${x.front.type === 'k' ? 'Raja' : pieceName(x.front)} di ${x.front.square} mesti bergerak, dan ${pieceName(x.back)} di ${x.back.square} di belakangnya akan ditangkap.`);
  if (t.theme === 'discovered') explanation.push('Buah yang bergerak membuka garisan buah di belakangnya – dua ancaman serentak.');
  if (t.theme === 'deflection') explanation.push('Buah lawan yang mempertahankan sasaran ditarik atau ditangkap, jadi sasaran tidak lagi dilindungi.');
  if (t.theme === 'sacrifice') explanation.push('Ini pengorbanan: kita memberi bahan kerana semua jawapan lawan sudah dikira.');
  for (let i = 1; i < sol.solution.length; i++) {
    const m = startC.move(parseUci(sol.solution[i]!));
    explanation.push(`${i % 2 === 1 ? 'Lawan' : 'Kita'}: ${m.san} – ${describeMove(m)}`);
  }
  const { final } = replay(fen, sol.solution);
  const pattern = final.isCheckmate() ? matePattern(final, sol.solution[sol.solution.length - 1]!) : undefined;
  if (final.isCheckmate()) explanation.push(`Checkmate${pattern && pattern !== 'other' ? ` (corak ${pattern})` : ''}!`);
  else {
    const gain = material(final, me) - material(final, other(me)) - (material(c, me) - material(c, other(me)));
    explanation.push(`Hasil: menang kira-kira ${gain} mata bahan. Penilaian enjin selepas langkah pertama: ${formatScore(toWhite(best.score, me))} (dari pihak Putih).`);
  }

  const afterFirst = new Chess(fen);
  afterFirst.move(parseUci(sol.solution[0]!));
  return {
    id,
    level: t.level,
    theme: t.theme,
    pattern,
    fen,
    goal: t.goal,
    mateIn,
    solution: sol.solution,
    solutionSan: san,
    accept: sol.accept,
    evalAfter: best.score.type === 'mate' ? `#${best.score.value}` : formatScore(best.score),
    wrong,
    explanation,
    defence: san[1] ? `Pertahanan terbaik lawan menurut enjin: ${san[1]}.` : 'Lawan tiada pertahanan – permainan tamat.',
    followUp: san[2] ? `Susulan: ${san.slice(2).join(' ')}.` : 'Tiada susulan diperlukan.',
    hints: {
      threat: THEME_INFO[t.theme].hint,
      attacked:
        facts.forkTargets.length || facts.targets.length
          ? `Sasaran: ${targetsText(facts.forkTargets.length ? facts.forkTargets : facts.targets)}.`
          : facts.capture
            ? `Sasaran: ${pieceName(facts.capture)} di ${facts.capture.square}.`
            : 'Lihat petak di sekeliling Raja lawan.',
      squares: [m0.from],
    },
    verified: { engine: engine.name, depth: main.depth },
  };
}

async function main() {
  await engine.init();
  // --append: keep the verified puzzles already in puzzles.json and top up the quotas with a new seed.
  const append = process.argv.includes('--append');
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  if (seedArg) seed = Number(seedArg.slice(7));
  const extra = Number(process.argv.find((a) => a.startsWith('--extra='))?.slice(8) ?? 0);
  const out: Puzzle[] = append && existsSync('src/lib/tactics/puzzles.json') ? JSON.parse(readFileSync('src/lib/tactics/puzzles.json', 'utf8')) : [];
  const seen = new Set<string>(out.map((p) => p.fen.split(' ')[0]!));
  let n = out.length;
  const add = (p: Puzzle | null) => {
    if (!p || seen.has(p.fen.split(' ')[0]!)) return false;
    seen.add(p.fen.split(' ')[0]!);
    out.push(p);
    return true;
  };

  for (const s of append ? [] : SEEDS) {
    const p = await buildPuzzle(s.fen, s, `p${String(++n).padStart(3, '0')}`);
    console.log(`seed ${s.theme} ${s.fen} → ${p ? 'OK' : 'rejected'}`);
    if (!add(p)) n--;
  }

  for (const t of TEMPLATES) {
    let got = out.filter((p) => p.theme === t.theme && p.level === t.level && (!t.pattern || p.pattern === t.pattern)).length;
    const quota = t.quota + extra;
    let tries = 0;
    while (got < quota && tries < 2500) {
      tries++;
      const raw = t.build();
      if (!raw) continue;
      let fen = rnd() < 0.5 ? fileFlip(raw) : raw;
      if (rnd() < 0.4) fen = colourFlip(fen);
      if (!legalStart(fen) || !prefilter(t, fen)) continue;
      const p = await buildPuzzle(fen, t, `p${String(n + 1).padStart(3, '0')}`);
      if (add(p)) {
        n++;
        got++;
        process.stdout.write(`${t.theme}/${t.level}${t.pattern ? '/' + t.pattern : ''}: ${got}/${quota} (tries ${tries})\n`);
      }
    }
    if (got < quota) console.log(`!! ${t.theme} L${t.level} ${t.pattern ?? ''}: only ${got}/${quota}`);
    writeFileSync('scripts/puzzles/partial.json', JSON.stringify(out));
  }

  out.sort((a, b) => a.level - b.level || a.theme.localeCompare(b.theme));
  out.forEach((p, i) => (p.id = `p${String(i + 1).padStart(3, '0')}`));
  writeFileSync('src/lib/tactics/puzzles.json', `${JSON.stringify(out, null, 1)}\n`);
  console.log(`\nWrote ${out.length} puzzles`);
  const by: Record<string, number> = {};
  for (const p of out) by[`L${p.level} ${p.theme}`] = (by[`L${p.level} ${p.theme}`] ?? 0) + 1;
  console.log(by);
  engine.terminate();
}

if (process.argv[1]?.endsWith('generate.ts')) void main();
export { engine, prefilter, themeOk };
