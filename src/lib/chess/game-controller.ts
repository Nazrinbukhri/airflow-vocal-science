import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { checkFen, START_FEN } from './fen';

export type MoveInput = { from: Square; to: Square; promotion?: PieceSymbol };

export type GameStatus =
  | { kind: 'playing'; turn: Color; check: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'insufficient-material' }
  | { kind: 'threefold-repetition' }
  | { kind: 'fifty-move-rule' };

export type LoadResult = { ok: true } | { ok: false; error: string };

/**
 * Game state with a full, navigable move list.
 *
 * `moves` holds every move from `startFen`; `cursor` is how many of them are
 * currently applied. Undo moves the cursor back, redo forward. Playing a new
 * move while the cursor is not at the end discards the old continuation
 * (like any editor's redo stack).
 *
 * All legality comes from chess.js – nothing is applied unless chess.js accepts it.
 */
export class GameController {
  private chess: Chess;
  private startFen: string;
  private moves: Move[] = [];
  private cursor = 0;
  private headers: Record<string, string> = {};

  constructor(fen: string = START_FEN) {
    const check = checkFen(fen);
    if (!check.ok) throw new Error(check.error);
    this.startFen = check.fen;
    this.chess = new Chess(this.startFen);
  }

  // ---------- reading ----------

  fen(): string {
    return this.chess.fen();
  }

  initialFen(): string {
    return this.startFen;
  }

  turn(): Color {
    return this.chess.turn();
  }

  /** Moves currently applied on the board (up to the cursor). */
  history(): Move[] {
    return this.moves.slice(0, this.cursor);
  }

  /** Every move in the list, including ones that were undone and can be redone. */
  fullHistory(): Move[] {
    return [...this.moves];
  }

  ply(): number {
    return this.cursor;
  }

  length(): number {
    return this.moves.length;
  }

  lastMove(): Move | undefined {
    return this.cursor > 0 ? this.moves[this.cursor - 1] : undefined;
  }

  canUndo(): boolean {
    return this.cursor > 0;
  }

  canRedo(): boolean {
    return this.cursor < this.moves.length;
  }

  board() {
    return this.chess.board();
  }

  get(square: Square) {
    return this.chess.get(square);
  }

  /** Legal moves for the side to move, grouped by origin square. */
  legalMovesByFrom(): Map<Square, Move[]> {
    const map = new Map<Square, Move[]>();
    if (this.isGameOver()) return map;
    for (const m of this.chess.moves({ verbose: true })) {
      const list = map.get(m.from);
      if (list) list.push(m);
      else map.set(m.from, [m]);
    }
    return map;
  }

  isLegal(move: MoveInput): boolean {
    return this.chess
      .moves({ verbose: true, square: move.from })
      .some((m) => m.to === move.to && (m.promotion ?? undefined) === (move.promotion ?? m.promotion));
  }

  /** Square of the king that is in check, if any. */
  checkedKingSquare(): Square | undefined {
    if (!this.chess.inCheck()) return undefined;
    return this.chess.findPiece({ type: 'k', color: this.chess.turn() })[0];
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  status(): GameStatus {
    const c = this.chess;
    if (c.isCheckmate()) return { kind: 'checkmate', winner: c.turn() === 'w' ? 'b' : 'w' };
    if (c.isStalemate()) return { kind: 'stalemate' };
    if (c.isInsufficientMaterial()) return { kind: 'insufficient-material' };
    if (c.isThreefoldRepetition()) return { kind: 'threefold-repetition' };
    if (c.isDrawByFiftyMoves()) return { kind: 'fifty-move-rule' };
    return { kind: 'playing', turn: c.turn(), check: c.inCheck() };
  }

  // ---------- changing ----------

  /** Play a move. Returns the move, or null if it is illegal (nothing changes). */
  move(input: MoveInput | string): Move | null {
    if (this.isGameOver()) return null;
    let played: Move;
    try {
      played = this.chess.move(input);
    } catch {
      return null;
    }
    this.moves = this.moves.slice(0, this.cursor);
    this.moves.push(played);
    this.cursor++;
    return played;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    this.chess.undo();
    this.cursor--;
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    this.chess.move(this.moves[this.cursor]!.san);
    this.cursor++;
    return true;
  }

  /** Jump to a ply (0 = start position, length() = latest move). */
  goTo(ply: number): void {
    const target = Math.max(0, Math.min(ply, this.moves.length));
    while (this.cursor > target) this.undo();
    while (this.cursor < target) this.redo();
  }

  /** Back to the starting position of this game, clearing all moves. */
  restart(): void {
    this.chess = new Chess(this.startFen);
    this.moves = [];
    this.cursor = 0;
  }

  loadFen(fen: string): LoadResult {
    const check = checkFen(fen);
    if (!check.ok) return check;
    this.startFen = check.fen;
    this.headers = {};
    this.restart();
    return { ok: true };
  }

  loadPgn(pgn: string): LoadResult {
    const text = pgn.trim();
    if (!text) return { ok: false, error: 'PGN kosong. Tampal teks PGN permainan.' };
    const probe = new Chess();
    try {
      probe.loadPgn(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const bad = /Invalid move in PGN: (\S+)/.exec(msg);
      return {
        ok: false,
        error: bad
          ? `PGN tidak sah: langkah "${bad[1]}" tidak dibenarkan dalam kedudukan itu.`
          : `PGN tidak dapat dibaca (${msg}).`,
      };
    }
    const verbose = probe.history({ verbose: true });
    const headers = probe.getHeaders();
    const start = verbose[0]?.before ?? headers.FEN ?? START_FEN;

    // Rebuild on a fresh instance so repetition counting starts from the real start.
    const chess = new Chess(start);
    const moves: Move[] = [];
    for (const m of verbose) moves.push(chess.move(m.san));

    this.chess = chess;
    this.startFen = start;
    this.moves = moves;
    this.cursor = moves.length;
    this.headers = Object.fromEntries(Object.entries(headers).filter(([, v]) => v != null)) as Record<
      string,
      string
    >;
    return { ok: true };
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * PGN of the moves up to the cursor, or of the whole line (including moves
   * that were undone and can still be redone) when `full` is true.
   */
  pgn({ full = false }: { full?: boolean } = {}): string {
    const c = new Chess(this.startFen);
    const tags: Record<string, string> = {
      Event: 'Latihan CHESS MASTER AI',
      Site: 'CHESS MASTER AI',
      Date: todayPgnDate(),
      White: '?',
      Black: '?',
      ...this.headers,
    };
    if (this.startFen !== START_FEN) {
      tags.SetUp = '1';
      tags.FEN = this.startFen;
    }
    for (const [k, v] of Object.entries(tags)) c.setHeader(k, v);
    for (const m of full ? this.moves : this.history()) c.move(m.san);
    const atEnd = !full || this.cursor === this.moves.length;
    const status: GameStatus = atEnd ? this.status() : { kind: 'playing', turn: c.turn(), check: false };
    const result =
      status.kind === 'checkmate'
        ? status.winner === 'w'
          ? '1-0'
          : '0-1'
        : status.kind === 'playing'
          ? '*'
          : '1/2-1/2';
    c.setHeader('Result', result);
    return c.pgn();
  }
}

function todayPgnDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** Malay description of a game status, for the coach panel. */
export function describeStatus(s: GameStatus): string {
  const side = (c: Color) => (c === 'w' ? 'Putih (White)' : 'Hitam (Black)');
  switch (s.kind) {
    case 'checkmate':
      return `Checkmate! ${side(s.winner)} menang. Raja lawan diserang dan tiada langkah untuk selamat.`;
    case 'stalemate':
      return 'Stalemate – seri. Pihak yang bergilir tiada langkah sah, tetapi Rajanya tidak dalam check.';
    case 'insufficient-material':
      return 'Seri – bahan tidak mencukupi. Tiada pihak yang boleh memberi checkmate.';
    case 'threefold-repetition':
      return 'Seri – kedudukan yang sama berulang tiga kali (threefold repetition).';
    case 'fifty-move-rule':
      return 'Seri – peraturan 50 langkah: 50 langkah setiap pihak tanpa tangkapan atau langkah Pion.';
    case 'playing':
      return `Giliran ${side(s.turn)}${s.check ? ' – Raja sedang dalam CHECK! Selamatkan Raja dahulu.' : '.'}`;
  }
}
