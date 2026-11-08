// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from './engine';
import { nodeTransport } from './node-transport';
import { LEVELS, chooseMove, pickWeakenedMove } from './strength';
import { formatScore, numberedLine, parseBestMove, parseInfo, pvToSan, scoreToBar, scoreValue, toWhite } from './uci';

describe('UCI parsing', () => {
  it('parses a MultiPV info line', () => {
    const l = parseInfo('info depth 12 seldepth 20 multipv 3 score cp -229 nodes 13242 nps 357891 hashfull 6 time 37 pv h5g5 f6e4 g5d8');
    expect(l).toEqual({ depth: 12, seldepth: 20, multipv: 3, score: { type: 'cp', value: -229 }, nodes: 13242, nps: 357891, time: 37, pv: ['h5g5', 'f6e4', 'g5d8'] });
  });
  it('parses mate scores and bounds, ignores lines without pv', () => {
    expect(parseInfo('info depth 8 multipv 1 score mate -2 pv a1a2')?.score).toEqual({ type: 'mate', value: -2 });
    expect(parseInfo('info depth 9 score cp 30 lowerbound nodes 5 pv e2e4')?.bound).toBe('lower');
    expect(parseInfo('info depth 9 currmove e2e4 currmovenumber 1')).toBeNull();
    expect(parseInfo('info string NNUE evaluation using nn.nnue')).toBeNull();
  });
  it('parses bestmove', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toEqual({ best: 'e2e4', ponder: 'e7e5' });
    expect(parseBestMove('bestmove (none)')).toEqual({ best: null, ponder: undefined });
  });
  it('formats and converts scores', () => {
    expect(toWhite({ type: 'cp', value: 50 }, 'b')).toEqual({ type: 'cp', value: -50 });
    expect(formatScore({ type: 'cp', value: 135 })).toBe('+1.35');
    expect(formatScore({ type: 'cp', value: -40 })).toBe('−0.40');
    expect(formatScore({ type: 'mate', value: 3 })).toBe('#3');
    expect(scoreToBar({ type: 'cp', value: 0 })).toBeCloseTo(0.5);
    expect(scoreValue({ type: 'mate', value: 1 })).toBeGreaterThan(scoreValue({ type: 'mate', value: 3 }));
    expect(scoreValue({ type: 'mate', value: -1 })).toBeLessThan(scoreValue({ type: 'cp', value: -2000 }));
  });
  it('converts PV to SAN with move numbers', () => {
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    expect(pvToSan(fen, ['h5f7'])).toEqual(['Qxf7#']);
    const start = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    expect(numberedLine(start, ['e5', 'Nf3', 'Nc6'])).toBe('1... e5 2. Nf3 Nc6');
    expect(pvToSan(start, ['e7e5', 'e1e5'])).toEqual(['e5']); // stops at illegal move
  });
  it('weakened move choice stays within the allowed loss', () => {
    const mk = (uci: string, cp: number) => ({ multipv: 1, depth: 4, score: { type: 'cp' as const, value: cp }, scoreWhite: { type: 'cp' as const, value: cp }, pv: [uci], pvSan: [] });
    const result = { fen: '', turn: 'w' as const, depth: 4, bestMove: 'a', stopped: false, lines: [mk('a', 100), mk('b', 0), mk('c', -500)] };
    const picks = new Set([0, 0.4, 0.99].map((r) => pickWeakenedMove(result, 150, () => r)));
    expect(picks).toEqual(new Set(['a', 'b']));
  });
});

describe('Stockfish WASM (real engine)', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());

  it('initialises and reports its name', async () => {
    await engine.init();
    expect(engine.state).toBe('ready');
    expect(engine.name).toMatch(/Stockfish/);
  });

  it('finds a mate in one with MultiPV alternatives', async () => {
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    const updates: number[] = [];
    const r = await engine.analyse(fen, { depth: 10, multiPv: 3, onUpdate: (p) => updates.push(p.depth) });
    expect(r.bestMove).toBe('h5f7');
    expect(r.lines).toHaveLength(3);
    expect(r.lines[0]!.score).toEqual({ type: 'mate', value: 1 });
    expect(r.lines[0]!.pvSan[0]).toBe('Qxf7#');
    expect(new Set(r.lines.map((l) => l.pv[0])).size).toBe(3);
    expect(r.depth).toBeGreaterThanOrEqual(1);
    expect(updates.length).toBeGreaterThan(0);
  });

  it('reports scores from White\'s side when Black is to move', async () => {
    // Black to move, White is a queen up.
    const r = await engine.analyse('4k3/8/8/8/8/8/3Q4/4K3 b - - 0 1', { depth: 8 });
    expect(r.lines[0]!.score.type === 'mate' || r.lines[0]!.score.value < -300).toBe(true);
    const w = r.lines[0]!.scoreWhite;
    expect(w.type === 'mate' ? w.value > 0 : w.value > 300).toBe(true);
  });

  it('returns no lines for a checkmated position', async () => {
    const r = await engine.analyse('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', { depth: 5 });
    expect(r.lines).toHaveLength(0);
    expect(r.bestMove).toBeNull();
  });

  it('stops a long search when aborted and stays usable', async () => {
    const ctrl = new AbortController();
    const long = engine.analyse('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', { depth: 60, signal: ctrl.signal });
    setTimeout(() => ctrl.abort(), 150);
    const r = await long;
    expect(r.stopped).toBe(true);
    expect(r.depth).toBeLessThan(60);
    const next = await engine.analyse('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', { depth: 8 });
    expect(next.bestMove).toBe('d1d8'); // back-rank mate, not confused with the stopped search
  });

  it('plays legal moves at every level', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    for (const lv of LEVELS.filter((l) => [1, 4, 8].includes(l.level))) {
      const mv = await chooseMove(engine, fen, lv.level);
      expect(mv, lv.name).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
      expect(pvToSan(fen, [mv!])).toHaveLength(1);
    }
  });
});
