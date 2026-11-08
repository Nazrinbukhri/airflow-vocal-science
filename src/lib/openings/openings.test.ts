// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { scoreValue } from '@/lib/engine/uci';
import { COACH_SAMPLES } from '@/lib/coach/samples';
import { checkFen } from '@/lib/chess/fen';
import { bookMovesFor } from './book';
import { OPENINGS } from './data';

const play = (sans: string[]) => {
  const c = new Chess();
  for (const san of sans) c.move(san); // throws on an illegal move
  return c;
};

describe('opening repertoire', () => {
  it('has the three repertoires with the required first moves', () => {
    const first = (id: string) => OPENINGS.find((o) => o.id === id)!.lines.find((l) => l.kind === 'main')!.steps.map((s) => s.san);
    expect(first('italian').slice(0, 5)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']);
    expect(first('sicilian').slice(0, 2)).toEqual(['e4', 'c5']);
    expect(first('kings-indian').slice(0, 4)).toEqual(['d4', 'Nf6', 'c4', 'g6']);
    expect(first('kings-indian')).toContain('Bg7');
  });

  for (const o of OPENINGS) {
    for (const line of o.lines) {
      it(`${line.id}: every move is legal and explained`, () => {
        expect(() => play(line.steps.map((s) => s.san))).not.toThrow();
        for (const st of line.steps) expect(st.why.length, st.san).toBeGreaterThan(5);
        expect(new Set(o.lines.map((l) => l.id)).size).toBe(o.lines.length);
      });
    }
  }

  it('mating traps really end in checkmate', () => {
    for (const line of OPENINGS.flatMap((o) => o.lines).filter((l) => l.result === 'mate')) {
      expect(play(line.steps.map((s) => s.san)).isCheckmate(), line.id).toBe(true);
    }
  });

  it('book lookup returns repertoire moves and ignores trap mistakes', () => {
    expect(bookMovesFor(new Chess().fen()).map((m) => m.san)).toEqual(['e4', 'd4']);
    const afterE4 = play(['e4']).fen();
    expect(bookMovesFor(afterE4).map((m) => m.san)).toEqual(['e5', 'c5']);
    const italian = play(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']).fen();
    expect(bookMovesFor(italian).map((m) => m.san)).not.toContain('Nd4');
    expect(bookMovesFor('8/8/8/8/8/8/k7/4K3 w - - 0 1')).toEqual([]);
  });

  it('coach sample positions are legal', () => {
    for (const s of COACH_SAMPLES) expect(checkFen(s.fen).ok, s.name).toBe(true);
  });
});

describe('trap claims checked with Stockfish', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  const traps = OPENINGS.flatMap((o) => o.lines).filter((l) => l.result && l.result !== 'mate');
  for (const line of traps) {
    it(`${line.id} → ${line.result}`, async () => {
      const r = await engine.analyse(play(line.steps.map((s) => s.san)).fen(), { depth: 14 });
      const v = scoreValue(r.lines[0]!.scoreWhite);
      if (line.result === 'white-better') expect(v).toBeGreaterThan(80);
      if (line.result === 'black-better') expect(v).toBeLessThan(-80);
      if (line.result === 'equal') expect(Math.abs(v)).toBeLessThan(80);
    }, 30000);
  }
});
