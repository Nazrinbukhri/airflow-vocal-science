import { describe, expect, it } from 'vitest';
import { START_FEN } from './fen';
import { orderedSquares, squareColor, squareFromPoint } from './pieces';
import { parsePlacement, placementToFen } from './placement';
import { emptyBoardReach } from './reach';

describe('board geometry', () => {
  it('a1 is dark and h1 is light ("light on right")', () => {
    expect(squareColor('a1')).toBe('dark');
    expect(squareColor('h1')).toBe('light');
    expect(squareColor('e4')).toBe('light');
  });

  it('orders squares for both orientations', () => {
    const w = orderedSquares('w');
    expect(w[0]).toBe('a8');
    expect(w[63]).toBe('h1');
    const b = orderedSquares('b');
    expect(b[0]).toBe('h1');
    expect(b[63]).toBe('a8');
    expect(new Set(w).size).toBe(64);
  });

  it('maps a point to a square, respecting orientation', () => {
    const rect = { left: 100, top: 50, width: 800, height: 800 };
    expect(squareFromPoint(150, 100, rect, 'w')).toBe('a8');
    expect(squareFromPoint(850, 800, rect, 'w')).toBe('h1');
    expect(squareFromPoint(150, 100, rect, 'b')).toBe('h1');
    expect(squareFromPoint(99, 100, rect, 'w')).toBeNull();
  });
});

describe('placement', () => {
  it('parses the start position', () => {
    const p = parsePlacement(START_FEN);
    expect(p.size).toBe(32);
    expect(p.get('e1')).toEqual({ color: 'w', type: 'k' });
    expect(p.get('d8')).toEqual({ color: 'b', type: 'q' });
  });

  it('round-trips placement', () => {
    const fen = placementToFen(parsePlacement(START_FEN));
    expect(fen.split(' ')[0]).toBe(START_FEN.split(' ')[0]);
    expect(placementToFen(new Map([['d4', { color: 'w', type: 'n' }]]))).toBe('8/8/8/8/3N4/8/8/8 w - - 0 1');
  });
});

describe('emptyBoardReach', () => {
  it.each([
    ['n', 'd4', 8],
    ['n', 'a1', 2],
    ['b', 'd4', 13],
    ['r', 'd4', 14],
    ['q', 'd4', 27],
    ['k', 'e1', 5],
    ['p', 'e2', 2],
    ['p', 'e3', 1],
  ] as const)('%s on %s reaches %i squares', (type, sq, n) => {
    expect(emptyBoardReach(type, sq)).toHaveLength(n);
  });

  it('black pawns move down the board', () => {
    expect(emptyBoardReach('p', 'e7', 'b').sort()).toEqual(['e5', 'e6']);
  });
});
