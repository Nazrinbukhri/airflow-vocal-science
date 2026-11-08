// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { freeCaptures, hangingPieces, kingSafety, moveFacts, nullMoveFen } from './facts';
import { evalWords } from './report';
import { runCoach } from './run';

describe('static facts', () => {
  it('finds hanging pieces and free captures', () => {
    const c = new Chess('4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1');
    expect(hangingPieces(c, 'b').map((h) => h.square)).toEqual(['d5']);
    expect(freeCaptures(c).map((m) => m.san)).toEqual(['exd5']);
  });

  it('detects a knight fork of king and rook', () => {
    const f = moveFacts('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'b5c7')!;
    expect(f.check).toBe(true);
    expect(f.forkTargets.map((p) => p.type).sort()).toEqual(['k', 'r']);
  });

  it('detects a discovered attack', () => {
    // Bishop b1 behind knight d3: moving the knight uncovers an attack on the h7 queen.
    const f = moveFacts('4k3/7q/8/8/8/3N4/8/1B2K3 w - - 0 1', 'd3c5')!;
    expect(f.discovered.map((p) => p.square)).toContain('h7');
  });

  it('builds a legal null-move position, but not when in check', () => {
    expect(nullMoveFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
    expect(nullMoveFen('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1')).toBeNull();
  });

  it('measures king safety', () => {
    const k = kingSafety(new Chess('r1bq1rk1/ppppbppp/2n2n2/4p3/4P3/2N2N2/PPPPBPPP/R1BQ1RK1 w - - 6 6'), 'w');
    expect(k.castled).toBe(true);
    expect(k.pawnShield).toBe(3);
  });

  it('describes evaluations in Malay without claiming certainty', () => {
    expect(evalWords({ type: 'cp', value: 10 }, 'w')).toBe('kedudukan seimbang');
    expect(evalWords({ type: 'cp', value: -250 }, 'w')).toBe('Hitam lebih baik');
    expect(evalWords({ type: 'mate', value: 2 }, 'b')).toContain('checkmate dalam 2');
  });
});

describe('coach report with the real engine', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());

  it('warns about the Scholar\'s mate threat on f7', async () => {
    const r = (await runCoach(engine, 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', { depth: 10 }))!;
    expect(r.threats[0]!.severity).toBe('high');
    expect(r.threats[0]!.text).toContain('Qxf7');
    expect(r.candidates).toHaveLength(3);
    // Every candidate defends against the mate: none of them may allow Qxf7#.
    for (const c of r.candidates) expect(c.replies[0]?.san).not.toBe('Qxf7#');
    // …and the explanation says so.
    for (const c of r.candidates) expect(c.why.join(' ')).toContain('Menangkis ancaman lawan Qxf7#');
    expect(r.checklist).toHaveLength(7);
    expect(r.categories.map((c) => c.key)).toEqual(['A', 'B', 'C', 'D']);
  }, 30000);

  it('recommends the knight fork and explains it', async () => {
    const r = (await runCoach(engine, 'r3k3/8/8/1N6/8/8/7P/4K3 w - - 0 1', { depth: 10 }))!;
    expect(r.candidates[0]!.san).toBe('Nc7+');
    expect(r.candidates[0]!.why.join(' ')).toContain('fork');
    expect(r.recommendation?.san).toBe('Nc7+');
    expect(r.checklist[5]!.answer).toContain('Nc7+');
  }, 30000);

  it('says "no data" for category C outside the opening book and shows book moves when given', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const without = (await runCoach(engine, fen, { depth: 8 }))!;
    expect(without.categories.find((c) => c.key === 'C')!.text).toContain('Tiada data');
    const withBook = (await runCoach(engine, fen, { depth: 8, book: [{ san: 'c5', name: 'Sicilian Defence' }] }))!;
    const c = withBook.categories.find((c) => c.key === 'C')!;
    expect(c.san).toBe('c5');
    expect(c.text).toContain('tiada peratusan');
  }, 30000);

  it('handles checkmate and cancellation', async () => {
    const mate = (await runCoach(engine, 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'))!;
    expect(mate.gameOver).toBe(true);
    expect(mate.situation[0]).toContain('Checkmate');
    const ctrl = new AbortController();
    ctrl.abort();
    expect(await runCoach(engine, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { signal: ctrl.signal })).toBeNull();
  }, 30000);
});
