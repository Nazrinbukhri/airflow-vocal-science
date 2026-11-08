// @vitest-environment node
import { Chess, type Move } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { accuracyFromAcpl, centipawnLoss, classify } from './classify';
import { phaseOf, reviewGame, summarise, type PositionEval } from './review';

const movesOf = (pgn: string): Move[] => {
  const c = new Chess();
  c.loadPgn(pgn);
  return c.history({ verbose: true });
};

describe('classification', () => {
  it('uses configurable centipawn thresholds', () => {
    expect(classify(10)).toBe('best');
    expect(classify(40)).toBe('good');
    expect(classify(90)).toBe('inaccuracy');
    expect(classify(200)).toBe('mistake');
    expect(classify(600)).toBe('blunder');
    expect(classify(90, { best: 20, good: 100, inaccuracy: 150, mistake: 300 })).toBe('good');
  });
  it('computes centipawn loss from both points of view', () => {
    // Best was +1.00 for the mover; after the move the opponent is +2.00 → mover is −2.00: loss 300.
    expect(centipawnLoss({ type: 'cp', value: 100 }, { type: 'cp', value: 200 })).toBe(300);
    // Never negative.
    expect(centipawnLoss({ type: 'cp', value: 0 }, { type: 'cp', value: -50 })).toBe(0);
    // Mate scores are capped.
    expect(centipawnLoss({ type: 'mate', value: 2 }, { type: 'cp', value: 0 })).toBe(1000);
  });
  it('maps ACPL to accuracy monotonically', () => {
    expect(accuracyFromAcpl(0)).toBe(100);
    expect(accuracyFromAcpl(50)).toBeGreaterThan(accuracyFromAcpl(150));
  });
  it('detects game phases', () => {
    expect(phaseOf(new Chess().fen(), 1)).toBe('opening');
    expect(phaseOf('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 60)).toBe('endgame');
  });
});

describe('summary from evaluations', () => {
  it('marks a missed win and counts per side', () => {
    const moves = movesOf('1. e4 e5');
    const start = new Chess().fen();
    const c = new Chess();
    const f0 = c.fen(); c.move('e4'); const f1 = c.fen(); c.move('e5'); const f2 = c.fen();
    const evals: PositionEval[] = [
      { fen: f0, best: 'e2e4', score: { type: 'cp', value: 30 }, depth: 10 },
      { fen: f1, best: 'd7d5', score: { type: 'cp', value: 400 }, depth: 10 },
      { fen: f2, best: 'g1f3', score: { type: 'cp', value: -20 }, depth: 10 },
    ];
    const r = summarise(start, moves, evals);
    expect(r.moves[0]!.cls).toBe('best');
    // Black was +4.00 and played a move after which White is −0.20 → Black still +0.20: missed win.
    expect(r.moves[1]!.missedWin).toBe(true);
    expect(r.black.counts.blunder).toBe(1);
    expect(r.white.accuracy).toBe(100);
  });
});

describe('review with the real engine', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  it('finds the blunder that allowed Scholar\'s mate', async () => {
    const moves = movesOf('1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#');
    const progress: number[] = [];
    const r = (await reviewGame(engine, new Chess().fen(), moves, { depth: 10, onProgress: (d) => progress.push(d) }))!;
    const nf6 = r.moves.find((m) => m.san === 'Nf6')!;
    expect(nf6.cls).toBe('blunder');
    expect(['g6', 'Qe7', 'Qf6']).toContain(nf6.bestSan);
    expect(r.moves.at(-1)!.cls).toBe('best');
    expect(r.black.counts.blunder).toBeGreaterThanOrEqual(1);
    expect(progress.at(-1)).toBe(moves.length + 1);
  }, 60000);
});
