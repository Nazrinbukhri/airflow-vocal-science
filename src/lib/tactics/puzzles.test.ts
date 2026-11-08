// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { checkFen } from '@/lib/chess/fen';
import { material, moveFacts, other, parseUci } from '@/lib/coach/facts';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { scoreValue } from '@/lib/engine/uci';
import { PUZZLES } from './puzzles';
import { isDeflection, isSacrifice, lineTactics, replay } from './themes';

describe('puzzle collection', () => {
  it('has at least 100 puzzles across 4 levels and the required themes', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PUZZLES.map((p) => p.level))).toEqual(new Set([1, 2, 3, 4]));
    const themes = new Set(PUZZLES.map((p) => p.theme));
    for (const t of ['fork', 'pin', 'skewer', 'discovered', 'double-attack', 'deflection', 'sacrifice', 'mate'] as const) expect(themes.has(t), t).toBe(true);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    expect(new Set(PUZZLES.map((p) => p.fen)).size).toBe(PUZZLES.length);
  });

  for (const p of PUZZLES) {
    it(`${p.id} (${p.theme}, L${p.level}) is legal and its solution works`, () => {
      expect(checkFen(p.fen).ok).toBe(true);
      const start = new Chess(p.fen);
      expect(start.inCheck()).toBe(false);
      // Every solution move and every accepted alternative is legal.
      const { final, fens } = replay(p.fen, p.solution);
      for (const [i, alts] of Object.entries(p.accept)) {
        for (const u of alts) expect(() => new Chess(fens[Number(i)]!).move(parseUci(u)), `${p.id} accept ${u}`).not.toThrow();
        expect(alts).toContain(p.solution[Number(i)]);
      }
      expect(p.solutionSan).toHaveLength(p.solution.length);
      expect(p.explanation.length).toBeGreaterThan(1);
      const me = start.turn();
      if (p.goal === 'mate') {
        expect(final.isCheckmate()).toBe(true);
        expect(p.solution.length).toBe(2 * p.mateIn! - 1);
      } else if (p.theme !== 'sacrifice') {
        const gain = material(final, me) - material(final, other(me)) - (material(start, me) - material(start, other(me)));
        expect(gain).toBeGreaterThanOrEqual(2);
      }
      // The theme is really on the board.
      const f = moveFacts(p.fen, p.solution[0]!)!;
      if (p.theme === 'fork') expect(f.move.piece === 'n' && f.forkTargets.length >= 2).toBe(true);
      if (p.theme === 'double-attack') expect(f.forkTargets.length).toBeGreaterThanOrEqual(2);
      if (p.theme === 'pin') expect(lineTactics(p.fen, p.solution[0]!).some((t) => t.kind === 'pin')).toBe(true);
      if (p.theme === 'skewer') expect(lineTactics(p.fen, p.solution[0]!).some((t) => t.kind === 'skewer')).toBe(true);
      if (p.theme === 'deflection') expect(isDeflection(p.fen, p.solution)).toBe(true);
      if (p.theme === 'sacrifice') expect(isSacrifice(p.fen, p.solution[0]!)).toBe(true);
      if (p.theme === 'hanging') expect(f.capture).toBeTruthy();
      if (p.theme === 'back-rank') expect(p.pattern).toBe('back-rank');
    });
  }
});

describe('puzzles re-checked with Stockfish', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  it('the first move of every puzzle is the engine\'s choice (or an equally fast mate)', async () => {
    const failures: string[] = [];
    for (const p of PUZZLES) {
      const r = await engine.analyse(p.fen, { depth: 12, multiPv: 2 });
      const best = r.lines[0]!;
      const accepted = p.accept[0] ?? [p.solution[0]!];
      if (p.goal === 'mate') {
        if (best.score.type !== 'mate' || best.score.value <= 0 || best.score.value > p.mateIn!) failures.push(`${p.id}: no mate in ${p.mateIn}`);
      } else if (!accepted.includes(best.pv[0]!)) {
        // Allow the engine to prefer something else only if our move is within 30 cp at this lower depth.
        const ours = await engine.analyse(p.fen, { depth: 12, searchMoves: accepted });
        if (scoreValue(best.score) - scoreValue(ours.lines[0]!.score) > 30) failures.push(`${p.id}: engine prefers ${best.pv[0]}`);
      }
    }
    expect(failures).toEqual([]);
  }, 300000);
});
