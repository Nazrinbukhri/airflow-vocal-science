// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { analysePieceMoves } from './moveMap';

describe('move map (real engine)', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());

  it('colours …Nf6?? red because it allows Qxf7#, and explains why', async () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3';
    const map = (await analysePieceMoves(engine, fen, 'g8'))!;
    const nf6 = map.moves.find((m) => m.to === 'f6')!;
    expect(nf6.tone).toBe('bad');
    expect(nf6.reason).toContain('checkmate');
    expect(nf6.reason).toContain('Qxf7#');
    // Every legal knight move is rated exactly once.
    expect(map.moves.map((m) => m.to).sort()).toEqual(['e7', 'f6', 'h6']);
  }, 30000);

  it('marks the winning capture as best and a hanging move as bad with the capture named', async () => {
    // White queen d1 can take an undefended rook on d8 with mate-free win; Qd5?? would be taken by the rook? Use a clear case:
    const fen = '3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1';
    const map = (await analysePieceMoves(engine, fen, 'd1'))!;
    const qxd8 = map.moves.find((m) => m.to === 'd8')!;
    expect(qxd8.tone).toBe('best');
    const qd5 = map.moves.find((m) => m.to === 'd5')!;
    expect(qd5.tone).toBe('bad');
    expect(qd5.reason).toMatch(/menangkap Menteri/);
    expect(qxd8.intensity).toBeGreaterThan(0.9);
  }, 30000);

  it('returns an empty list for a piece with no legal moves', async () => {
    const map = (await analysePieceMoves(engine, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'a1'))!;
    expect(map.moves).toEqual([]);
  });
});
