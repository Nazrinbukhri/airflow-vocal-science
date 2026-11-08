// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { checkFen } from '@/lib/chess/fen';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { scoreValue } from '@/lib/engine/uci';
import { FORMATIONS } from './data';
import { backwardPawns, chainBases, doubledPawns, isolatedPawns, majorities, openFiles, outposts, passedPawns } from './structure';

describe('pawn structure functions', () => {
  it('find isolated, doubled, passed and backward pawns', () => {
    const c = new Chess('4k3/p5p1/8/8/4P3/2P5/1PP3PP/4K3 w - - 0 1');
    expect(isolatedPawns(c, 'w')).toEqual(['e4']);
    expect(doubledPawns(c, 'w').sort()).toEqual(['c2', 'c3']);
    expect(passedPawns(c, 'w')).toContain('e4');
    expect(passedPawns(c, 'w')).not.toContain('b2');
    expect(openFiles(c)).toEqual(['d', 'f']);
  });
  it('detects the Carlsbad minority and pawn-chain bases', () => {
    const carlsbad = new Chess('r2q1rk1/pp2bppp/2p2n2/3p4/3P4/2N1PN2/PP3PPP/R2Q1RK1 w - - 0 12');
    expect(majorities(carlsbad, 'w').queenside).toBe(-1);
    const french = new Chess('rnbqkbnr/pp3ppp/4p3/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq c6 0 4');
    expect(chainBases(french, 'w')).toEqual(['d4']);
  });
});

describe('formation library', () => {
  it('has the 15 required formations', () => {
    expect(FORMATIONS.map((f) => f.id)).toEqual([
      'pawn-chain', 'isolated-pawn', 'doubled-pawns', 'backward-pawn', 'passed-pawn', 'connected-passers', 'open-files',
      'half-open-files', 'weak-squares', 'outposts', 'fianchetto', 'kingside-attack', 'queenside-attack', 'minority-attack', 'central-majority',
    ]);
  });
  for (const f of FORMATIONS) {
    it(`${f.id}: legal position, highlights and a solvable exercise`, () => {
      expect(checkFen(f.fen).ok).toBe(true);
      expect(f.highlight.length).toBeGreaterThan(0);
      for (const text of [f.what, f.attack, f.weakness, f.exploit, f.defend]) expect(text.length).toBeGreaterThan(20);
      const ex = f.exercise;
      if (ex.kind === 'square') expect(ex.answers.length).toBeGreaterThan(0);
      if (ex.kind === 'move') {
        expect(ex.accept.length).toBeGreaterThan(0);
        for (const san of ex.accept) expect(() => new Chess(ex.fen).move(san)).not.toThrow();
      }
      if (ex.kind === 'choice') expect(ex.options[ex.answer]).toBeTruthy();
    });
  }
  it('specific answers are right', () => {
    const by = (id: string) => FORMATIONS.find((f) => f.id === id)!.exercise;
    expect(by('isolated-pawn')).toMatchObject({ answers: ['d4'] });
    expect(by('backward-pawn')).toMatchObject({ answers: ['d6'] });
    expect(by('passed-pawn')).toMatchObject({ answers: ['d5'] });
    expect(by('outposts')).toMatchObject({ accept: ['Nd5'] });
    expect(by('half-open-files')).toMatchObject({ accept: ['Rc8'] });
    const najdorf = FORMATIONS.find((f) => f.id === 'outposts')!.fen;
    expect(outposts(new Chess(najdorf), 'w')).toContain('d5');
    expect(backwardPawns(new Chess(najdorf), 'b')).toEqual(['d6']);
  });
});

describe('engine-judged formation exercises', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  for (const f of FORMATIONS.filter((x) => x.exercise.kind === 'move' && x.exercise.engineTolerance)) {
    it(`${f.id}: accepted move is within tolerance of the engine's best`, async () => {
      const ex = f.exercise as Extract<typeof f.exercise, { kind: 'move' }>;
      const c = new Chess(ex.fen);
      const best = await engine.analyse(c.fen(), { depth: 14 });
      for (const san of ex.accept) {
        const m = new Chess(ex.fen).move(san);
        const ours = await engine.analyse(c.fen(), { depth: 14, searchMoves: [m.from + m.to] });
        expect(scoreValue(best.lines[0]!.score) - scoreValue(ours.lines[0]!.score), san).toBeLessThanOrEqual(ex.engineTolerance!);
      }
    }, 30000);
  }
});
