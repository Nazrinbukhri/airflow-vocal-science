import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Square } from 'chess.js';
import { useState } from 'react';
import { Chessboard, type BoardTarget } from './Chessboard';
import { GameController } from '@/lib/chess/game-controller';

afterEach(cleanup);

const sq = (s: Square) => document.querySelector(`[data-square="${s}"]`) as HTMLElement;
// fireEvent.click has detail 0 = keyboard activation path of the board.
const tap = (s: Square) => fireEvent.click(sq(s));

function legalOf(g: GameController) {
  const map = new Map<Square, BoardTarget[]>();
  for (const [from, list] of g.legalMovesByFrom()) map.set(from, list.map((m) => ({ to: m.to, promotion: m.promotion })));
  return map;
}

/** Board wired to a real GameController, as the app does. */
function Harness({ fen }: { fen?: string }) {
  const [g] = useState(() => new GameController(fen));
  const [, setV] = useState(0);
  return (
    <>
      <Chessboard
        fen={g.fen()}
        legalMoves={legalOf(g)}
        onMove={(m) => {
          g.move(m);
          setV((v) => v + 1);
        }}
      />
      <output data-testid="fen">{g.fen()}</output>
    </>
  );
}

describe('Chessboard', () => {
  it('renders 64 squares and 32 pieces in the start position', () => {
    render(<Harness />);
    expect(document.querySelectorAll('[data-square]')).toHaveLength(64);
    expect(document.querySelectorAll('[data-piece]')).toHaveLength(32);
    expect(sq('e1').dataset.piece).toBe('wk');
    expect(sq('e1').getAttribute('aria-label')).toContain('Raja putih');
  });

  it('shows legal targets after selecting a piece and moves on tap', () => {
    render(<Harness />);
    tap('g1');
    expect(sq('g1').dataset.selected).toBe('true');
    const targets = [...document.querySelectorAll('[data-target]')].map((e) => (e as HTMLElement).dataset.square).sort();
    expect(targets).toEqual(['f3', 'h3']);
    tap('f3');
    expect(sq('f3').dataset.piece).toBe('wn');
    expect(sq('g1').dataset.piece).toBeUndefined();
    expect(screen.getByTestId('fen').textContent).toContain(' b ');
  });

  it('ignores taps on illegal squares and on the opponent\'s pieces', () => {
    render(<Harness />);
    tap('e2');
    tap('e5'); // not legal for a pawn on e2
    expect(sq('e2').dataset.piece).toBe('wp');
    tap('e7'); // black piece, white to move
    expect(document.querySelectorAll('[data-target]')).toHaveLength(0);
  });

  it('asks which piece to promote to', () => {
    render(<Harness fen="8/4P3/8/8/8/8/k7/4K3 w - - 0 1" />);
    tap('e7');
    tap('e8');
    expect(screen.getByRole('dialog', { name: /promosi/i })).toBeTruthy();
    fireEvent.click(document.querySelector('[data-promotion="n"]')!);
    expect(sq('e8').dataset.piece).toBe('wn');
  });

  it('is read-only without legal moves', () => {
    const onMove = vi.fn();
    render(<Chessboard fen="8/8/8/8/3N4/8/8/8 w - - 0 1" onMove={onMove} />);
    tap('d4');
    expect(document.querySelectorAll('[data-target]')).toHaveLength(0);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('reports square taps for exercises', () => {
    const onSquareTap = vi.fn();
    render(<Chessboard fen="8/8/8/8/8/8/8/8 w - - 0 1" onSquareTap={onSquareTap} />);
    tap('c6');
    expect(onSquareTap).toHaveBeenCalledWith('c6');
  });

  it('supports pointer taps (pointerdown + pointerup on the same square)', () => {
    render(<Harness />);
    const board = screen.getByTestId('chessboard');
    act(() => {
      fireEvent.pointerDown(sq('e2'), { pointerId: 1, button: 0, pointerType: 'touch', clientX: 0, clientY: 0 });
      fireEvent.pointerUp(sq('e2'), { pointerId: 1, pointerType: 'touch' });
    });
    expect(sq('e4').dataset.target).toBe('true');
    act(() => {
      fireEvent.pointerDown(sq('e4'), { pointerId: 2, button: 0, pointerType: 'touch' });
      fireEvent.pointerUp(sq('e4'), { pointerId: 2, pointerType: 'touch' });
    });
    expect(sq('e4').dataset.piece).toBe('wp');
    expect(board).toBeTruthy();
  });
});
