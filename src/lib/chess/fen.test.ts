import { describe, expect, it } from 'vitest';
import { checkFen, START_FEN } from './fen';

describe('checkFen', () => {
  it('accepts the start position', () => {
    expect(checkFen(START_FEN)).toEqual({ ok: true, fen: START_FEN });
  });

  it('completes a short FEN with default fields', () => {
    const r = checkFen('4k3/8/8/8/8/8/8/4K3 b');
    expect(r).toEqual({ ok: true, fen: '4k3/8/8/8/8/8/8/4K3 b - - 0 1' });
  });

  it.each([
    ['', 'kosong'],
    ['8/8/8/8/8/8/8/8 w - - 0 1', 'Raja'],
    ['4k3/8/8/8/8/8/8/K3K3 w - - 0 1', 'Raja putih'],
    ['P3k3/8/8/8/8/8/8/4K3 w - - 0 1', 'Pion'],
    ['rnbqkbnr/pppppppp/8/8 w', 'Susunan'],
  ])('rejects %j with a Malay message', (fen, word) => {
    const r = checkFen(fen);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(word);
  });

  it('rejects a position where the side not to move is in check', () => {
    // White to move, but the black king on e8 is already attacked by the rook on e2.
    const r = checkFen('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(r.ok).toBe(false);
  });

  it('accepts the same position with Black to move (Black is in check, which is legal)', () => {
    expect(checkFen('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1').ok).toBe(true);
  });
});
