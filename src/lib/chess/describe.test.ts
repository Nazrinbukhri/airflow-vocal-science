import { describe, expect, it } from 'vitest';
import { GameController } from './game-controller';
import { describeMove } from './describe';

const last = (fen: string | undefined, moves: string[]) => {
  const g = new GameController(fen);
  for (const m of moves) expect(g.move(m), m).not.toBeNull();
  return describeMove(g.lastMove()!);
};

describe('describeMove (Bahasa Melayu)', () => {
  it('describes a simple developing move', () => {
    expect(last(undefined, ['Nf3'])).toBe('Putih menggerakkan Kuda (Knight) dari g1 ke f3.');
  });

  it('mentions the two-square pawn move', () => {
    expect(last(undefined, ['e4'])).toContain('dua petak');
  });

  it('describes captures with the value of the captured piece', () => {
    expect(last(undefined, ['e4', 'd5', 'exd5'])).toContain('menangkap Pion hitam (Pawn, nilai 1)');
  });

  it('describes castling', () => {
    expect(last('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', ['O-O'])).toContain('castling sebelah Raja');
  });

  it('describes en passant and the removed pawn square', () => {
    expect(last(undefined, ['e4', 'a6', 'e5', 'd5', 'exd6'])).toContain('en passant (Pion di d5');
  });

  it('describes promotion, check and checkmate', () => {
    expect(last('8/4P3/8/8/8/8/k7/4K3 w - - 0 1', ['e8=Q'])).toContain('menjadi Menteri');
    expect(last(undefined, ['e4', 'f6', 'd4', 'g5', 'Qh5#'])).toContain('CHECKMATE');
    expect(last(undefined, ['e4', 'e5', 'Bc4', 'd6', 'Bxf7+'])).toContain('Ini CHECK');
  });
});
