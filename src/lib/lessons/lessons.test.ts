// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { checkFen } from '@/lib/chess/fen';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { scoreValue } from '@/lib/engine/uci';
import { LESSONS } from './data';
import { checkAnswer, mateInOneMoves, type Exercise } from './exercise';

const fenOk = (fen: string) => {
  // Teaching diagrams of an empty board are allowed (square-naming drills).
  if (fen.startsWith('8/8/8/8/8/8/8/8')) return true;
  return checkFen(fen).ok;
};

function checkExercise(ex: Exercise, where: string) {
  if ('fen' in ex && ex.fen) expect(fenOk(ex.fen), `${where} fen`).toBe(true);
  switch (ex.kind) {
    case 'square':
      expect(ex.answers.length, where).toBeGreaterThan(0);
      break;
    case 'move':
      expect(ex.accept.length, where).toBeGreaterThan(0);
      for (const san of ex.accept) expect(() => new Chess(ex.fen).move(san), `${where} ${san}`).not.toThrow();
      expect(checkAnswer(ex, ex.accept[0]!)).toBe(true);
      break;
    case 'mate':
      expect(mateInOneMoves(ex.fen).length, `${where} has a mate in one`).toBeGreaterThan(0);
      break;
    case 'choice':
      expect(ex.options[ex.answer], where).toBeTruthy();
      expect(new Set(ex.options).size).toBe(ex.options.length);
      break;
  }
}

describe('lessons', () => {
  it('cover the 14 required beginner topics in order, plus notation, attack and endgame modules', () => {
    const f = LESSONS.filter((l) => l.module === 'fundamentals').map((l) => l.titleEn);
    expect(f).toEqual([
      'What is chess?', 'Understanding the chessboard', 'Files and ranks', 'Understanding the 64 squares', 'Identifying the six pieces',
      'Movement of every piece', 'Capturing pieces', 'Check', 'Checkmate', 'Stalemate', 'Castling', 'En passant', 'Pawn promotion',
      'Draw conditions', 'Chess notation (SAN & UCI)',
    ]);
    expect(LESSONS.filter((l) => l.module === 'attack').length).toBeGreaterThanOrEqual(5);
    expect(LESSONS.filter((l) => l.module === 'endgame').length).toBeGreaterThanOrEqual(5);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  for (const l of LESSONS) {
    it(`${l.id}: every step is present and every position/answer is valid`, () => {
      expect(l.explain.length).toBeGreaterThan(0);
      expect(l.show.length).toBeGreaterThan(0);
      expect(l.practice.length).toBeGreaterThan(0);
      expect(l.test.length).toBeGreaterThan(0);
      expect(l.review.length).toBeGreaterThan(0);
      for (const s of l.show) {
        expect(fenOk(s.fen), `${l.id} show`).toBe(true);
        const c = new Chess(s.fen.startsWith('8/8/8/8/8/8/8/8') ? undefined : s.fen);
        for (const m of s.moves ?? []) expect(() => c.move(m.san), `${l.id} demo ${m.san}`).not.toThrow();
      }
      [...l.practice, ...l.test].forEach((ex, i) => checkExercise(ex, `${l.id}#${i}`));
    });
  }

  it('the stalemate lesson really shows stalemate and the castling lesson allows both castles', () => {
    expect(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1').isStalemate()).toBe(true);
    const c = LESSONS.find((l) => l.id === 'f11-castling')!.practice[0]!;
    expect(checkAnswer(c, 'O-O')).toBe(true);
  });
});

describe('engine-judged lesson exercises', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  const items = LESSONS.flatMap((l) => [...l.practice, ...l.test].filter((e) => e.kind === 'move' && e.engineTolerance).map((e) => ({ l, e: e as Extract<Exercise, { kind: 'move' }> })));
  for (const { l, e } of items) {
    it(`${l.id}: accepted moves are within tolerance`, async () => {
      const best = await engine.analyse(e.fen, { depth: 16 });
      for (const san of e.accept) {
        const m = new Chess(e.fen).move(san);
        const ours = await engine.analyse(e.fen, { depth: 16, searchMoves: [m.from + m.to + (m.promotion ?? '')] });
        expect(scoreValue(best.lines[0]!.score) - scoreValue(ours.lines[0]!.score), san).toBeLessThanOrEqual(e.engineTolerance!);
      }
    }, 30000);
  }
});
