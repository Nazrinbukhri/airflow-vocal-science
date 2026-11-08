// @vitest-environment node
import { Chess } from 'chess.js';
import { afterAll, describe, expect, it } from 'vitest';
import { Engine } from '@/lib/engine/engine';
import { nodeTransport } from '@/lib/engine/node-transport';
import { scoreValue } from '@/lib/engine/uci';
import { GM_GAMES } from './games';

function replay(pgn: string) {
  const c = new Chess();
  c.loadPgn(pgn); // throws on any illegal move
  return c;
}

describe('grandmaster game records', () => {
  for (const g of GM_GAMES) {
    it(`${g.id}: legal, documented length, key moves and notes on real plies`, () => {
      const c = replay(g.pgn);
      const sans = c.history();
      expect(Math.ceil(sans.length / 2)).toBe(g.moves);
      for (const [ply, san] of Object.entries(g.keyMoves)) expect(sans[Number(ply) - 1], `ply ${ply}`).toBe(san);
      for (const ply of [...Object.keys(g.notes).map(Number), ...g.guess]) expect(ply).toBeLessThanOrEqual(sans.length);
      // The side that resigned / was mated is the one to move at the end.
      const loserToMove = g.result === '1-0' ? 'b' : 'w';
      expect(c.turn()).toBe(loserToMove);
      if (g.ending === 'mate') expect(c.isCheckmate()).toBe(true);
      expect(g.source.url).toMatch(/^https:\/\//);
    });
  }
});

describe('resignation positions are decisive according to Stockfish', () => {
  const engine = new Engine(nodeTransport());
  afterAll(() => engine.terminate());
  for (const g of GM_GAMES.filter((x) => x.ending === 'resign')) {
    it(`${g.id}: the winner is clearly better when the loser resigned`, async () => {
      const c = replay(g.pgn);
      const r = await engine.analyse(c.fen(), { depth: 16 });
      // Score is from the side to move (the loser): it must be clearly losing.
      expect(scoreValue(r.lines[0]!.score)).toBeLessThan(-250);
    }, 30000);
  }
});
