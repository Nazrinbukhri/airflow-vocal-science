import { describe, expect, it } from 'vitest';
import { GameController, describeStatus } from './game-controller';
import { START_FEN } from './fen';

const play = (g: GameController, sans: string[]) => sans.forEach((s) => expect(g.move(s), s).not.toBeNull());

describe('GameController – legality', () => {
  it('starts from the initial position with 20 legal moves', () => {
    const g = new GameController();
    expect(g.fen()).toBe(START_FEN);
    const total = [...g.legalMovesByFrom().values()].reduce((n, l) => n + l.length, 0);
    expect(total).toBe(20);
  });

  it('rejects illegal moves and leaves the position unchanged', () => {
    const g = new GameController();
    expect(g.move({ from: 'e2', to: 'e5' })).toBeNull();
    expect(g.move('Ke2')).toBeNull();
    expect(g.move({ from: 'e7', to: 'e5' })).toBeNull(); // not Black's turn
    expect(g.fen()).toBe(START_FEN);
    expect(g.ply()).toBe(0);
  });

  it('cannot leave its own king in check (pinned piece)', () => {
    // Black bishop b4 pins the white knight c3 to the king e1.
    const g = new GameController('4k3/8/8/8/1b6/2N5/8/4K3 w - - 0 1');
    expect(g.move({ from: 'c3', to: 'd5' })).toBeNull();
  });

  it('handles castling, en passant and promotion', () => {
    const castle = new GameController('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(castle.move('O-O')?.isKingsideCastle()).toBe(true);
    expect(castle.get('g1')).toEqual({ type: 'k', color: 'w' });
    expect(castle.get('f1')).toEqual({ type: 'r', color: 'w' });

    const ep = new GameController();
    play(ep, ['e4', 'a6', 'e5', 'd5']);
    const m = ep.move({ from: 'e5', to: 'd6' });
    expect(m?.isEnPassant()).toBe(true);
    expect(ep.get('d5')).toBeUndefined();

    const promo = new GameController('8/4P3/8/8/8/8/k7/4K3 w - - 0 1');
    const targets = promo.legalMovesByFrom().get('e7')!;
    expect(targets.map((t) => t.promotion).sort()).toEqual(['b', 'n', 'q', 'r']);
    expect(promo.move({ from: 'e7', to: 'e8', promotion: 'n' })?.san).toBe('e8=N');
    expect(promo.get('e8')).toEqual({ type: 'n', color: 'w' });
  });

  it('does not allow castling through check', () => {
    // Black rook f8 attacks f1, so White cannot castle kingside.
    const g = new GameController('4kr2/8/8/8/8/8/8/4K2R w K - 0 1');
    expect(g.move('O-O')).toBeNull();
  });
});

describe('GameController – game end', () => {
  it("detects Scholar's mate as checkmate for White", () => {
    const g = new GameController();
    play(g, ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#']);
    expect(g.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(g.isGameOver()).toBe(true);
    expect(g.legalMovesByFrom().size).toBe(0);
    expect(g.move('a6')).toBeNull();
    expect(describeStatus(g.status())).toContain('Checkmate');
  });

  it('detects stalemate', () => {
    const g = new GameController('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(g.status()).toEqual({ kind: 'stalemate' });
  });

  it('detects insufficient material', () => {
    const g = new GameController('8/8/4k3/8/8/4K3/8/8 w - - 0 1');
    expect(g.status()).toEqual({ kind: 'insufficient-material' });
  });

  it('detects threefold repetition', () => {
    const g = new GameController();
    play(g, ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']);
    expect(g.status()).toEqual({ kind: 'threefold-repetition' });
  });

  it('detects the fifty-move rule', () => {
    const g = new GameController('4k3/8/8/8/8/8/8/R3K3 w - - 99 80');
    play(g, ['Ra2']);
    expect(g.status()).toEqual({ kind: 'fifty-move-rule' });
  });

  it('reports check and the checked king square', () => {
    const g = new GameController();
    play(g, ['e4', 'e5', 'Bc4', 'd6', 'Bxf7+']);
    expect(g.status()).toEqual({ kind: 'playing', turn: 'b', check: true });
    expect(g.checkedKingSquare()).toBe('e8');
  });
});

describe('GameController – undo / redo / navigation', () => {
  it('undoes and redoes moves', () => {
    const g = new GameController();
    play(g, ['e4', 'e5', 'Nf3']);
    const afterNf3 = g.fen();
    expect(g.undo()).toBe(true);
    expect(g.ply()).toBe(2);
    expect(g.canRedo()).toBe(true);
    expect(g.redo()).toBe(true);
    expect(g.fen()).toBe(afterNf3);
    expect(g.redo()).toBe(false);
  });

  it('a new move after undo discards the old continuation', () => {
    const g = new GameController();
    play(g, ['e4', 'e5', 'Nf3']);
    g.undo();
    play(g, ['Bc4']);
    expect(g.fullHistory().map((m) => m.san)).toEqual(['e4', 'e5', 'Bc4']);
    expect(g.canRedo()).toBe(false);
  });

  it('jumps to any ply and restarts', () => {
    const g = new GameController();
    play(g, ['d4', 'Nf6', 'c4', 'g6']);
    g.goTo(0);
    expect(g.fen()).toBe(START_FEN);
    g.goTo(3);
    expect(g.history().map((m) => m.san)).toEqual(['d4', 'Nf6', 'c4']);
    g.goTo(99);
    expect(g.ply()).toBe(4);
    g.restart();
    expect(g.length()).toBe(0);
    expect(g.fen()).toBe(START_FEN);
  });

  it('threefold repetition still works after undo + redo', () => {
    const g = new GameController();
    play(g, ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']);
    g.goTo(0);
    g.goTo(8);
    expect(g.status().kind).toBe('threefold-repetition');
  });
});

describe('GameController – FEN and PGN', () => {
  it('loads a FEN and refuses an invalid one', () => {
    const g = new GameController();
    expect(g.loadFen('4k3/8/8/8/8/8/8/4K2R w K - 0 1')).toEqual({ ok: true });
    expect(g.turn()).toBe('w');
    const bad = g.loadFen('not a fen');
    expect(bad.ok).toBe(false);
    expect(g.fen()).toBe('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
  });

  it('imports a PGN with headers and comments', () => {
    const g = new GameController();
    const r = g.loadPgn(`[Event "Contoh"]
[White "A"]
[Black "B"]
[Result "*"]

1. e4 {Pion raja} e5 2. Nf3 Nc6 3. Bc4 Bc5 *`);
    expect(r).toEqual({ ok: true });
    expect(g.length()).toBe(6);
    expect(g.ply()).toBe(6);
    expect(g.getHeaders().White).toBe('A');
    expect(g.history().map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
  });

  it('rejects a PGN containing an illegal move and keeps the old game', () => {
    const g = new GameController();
    play(g, ['e4']);
    const r = g.loadPgn('1. e4 e5 2. Ke3 Ke6 3. Kxe5');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Ke3');
    expect(g.history().map((m) => m.san)).toEqual(['e4']);
  });

  it('round-trips PGN, including games from a custom FEN', () => {
    const g = new GameController();
    expect(g.loadFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1').ok).toBe(true);
    play(g, ['O-O-O', 'O-O']);
    const pgn = g.pgn();
    expect(pgn).toContain('[SetUp "1"]');
    expect(pgn).toContain('[FEN "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1"]');

    const h = new GameController();
    expect(h.loadPgn(pgn)).toEqual({ ok: true });
    expect(h.fen()).toBe(g.fen());
    expect(h.initialFen()).toBe('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
  });

  it('exports the result of a finished game', () => {
    const g = new GameController();
    play(g, ['f3', 'e5', 'g4', 'Qh4#']);
    expect(g.pgn()).toContain('[Result "0-1"]');
    expect(g.pgn().trim().endsWith('0-1')).toBe(true);
  });

  it('full PGN keeps redo moves; normal PGN stops at the cursor', () => {
    const g = new GameController();
    play(g, ['e4', 'e5', 'Nf3']);
    g.goTo(1);
    expect(g.pgn()).not.toContain('e5');
    expect(g.pgn({ full: true })).toContain('2. Nf3');
  });
});
