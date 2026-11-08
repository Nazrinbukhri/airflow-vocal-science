'use client';

import type { Color, PieceSymbol, Square } from 'chess.js';
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { parsePlacement } from '@/lib/chess/placement';
import { orderedSquares, pieceImage, pieceLabel, squareColor, squareFromPoint, PIECES } from '@/lib/chess/pieces';

export type BoardMove = { from: Square; to: Square; promotion?: PieceSymbol };
export type BoardTarget = { to: Square; promotion?: PieceSymbol };
export type HighlightTone = 'gold' | 'green' | 'red' | 'blue';

export type ChessboardProps = {
  fen: string;
  orientation?: Color;
  /** Legal moves by origin square. Empty / missing = board is read-only. */
  legalMoves?: Map<Square, BoardTarget[]>;
  onMove?: (move: BoardMove) => void;
  lastMove?: { from: Square; to: Square };
  checkSquare?: Square;
  highlights?: Partial<Record<Square, HighlightTone>>;
  showCoordinates?: boolean;
  label?: string;
  /** For exercises such as "find the square": called on any tap when the board is not in move mode. */
  onSquareTap?: (square: Square) => void;
};

type Drag = {
  from: Square;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  wasSelected: boolean;
  touch: boolean;
};

const DRAG_THRESHOLD_PX = 6;

const TONE_CLASS: Record<HighlightTone, string> = {
  gold: 'bg-gold-400/55',
  green: 'bg-emerald-400/50',
  red: 'bg-red-500/50',
  blue: 'bg-sky-400/50',
};

function squareFromTarget(target: EventTarget | null): Square | null {
  const el = (target as HTMLElement | null)?.closest?.('[data-square]') as HTMLElement | null;
  return (el?.dataset.square as Square | undefined) ?? null;
}

/**
 * Interactive chessboard.
 * - Tap/click a piece, then tap/click a highlighted square.
 * - Or drag the piece (mouse, finger or pen – all through Pointer Events).
 * - Keyboard: Tab to a square, Enter/Space to select and to move.
 * The board never decides legality itself: it only offers moves listed in `legalMoves`.
 */
export function Chessboard({
  fen,
  orientation = 'w',
  legalMoves,
  onMove,
  lastMove,
  checkSquare,
  highlights,
  showCoordinates = true,
  label = 'Papan catur',
  onSquareTap,
}: ChessboardProps) {
  const pieces = useMemo(() => parsePlacement(fen), [fen]);
  const squares = useMemo(() => orderedSquares(orientation), [orientation]);
  const interactive = !!onMove && !!legalMoves && legalMoves.size > 0;

  // Selection is tied to the position it was made in, so it clears itself when the position changes.
  const [selection, setSelection] = useState<{ fen: string; square: Square } | null>(null);
  const selected = selection?.fen === fen ? selection.square : null;
  const select = (sq: Square | null) => setSelection(sq ? { fen, square: sq } : null);

  const [promotion, setPromotion] = useState<{ fen: string; from: Square; to: Square } | null>(null);
  const pendingPromotion = promotion?.fen === fen ? promotion : null;

  const [dragFrom, setDragFrom] = useState<Square | null>(null);
  const [hover, setHover] = useState<Square | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLImageElement>(null);
  const drag = useRef<Drag | null>(null);
  const pendingTarget = useRef<Square | null>(null);

  const targetsOf = (from: Square | null): Map<Square, BoardTarget[]> => {
    const map = new Map<Square, BoardTarget[]>();
    if (!from || !legalMoves) return map;
    for (const t of legalMoves.get(from) ?? []) {
      const list = map.get(t.to);
      if (list) list.push(t);
      else map.set(t.to, [t]);
    }
    return map;
  };
  const activeFrom = dragFrom ?? selected;
  const targets = targetsOf(activeFrom);

  const canMoveFrom = (sq: Square) => interactive && (legalMoves?.get(sq)?.length ?? 0) > 0;

  const attempt = (from: Square, to: Square) => {
    const options = targetsOf(from).get(to);
    if (!options?.length) return false;
    select(null);
    if (options.some((o) => o.promotion)) {
      setPromotion({ fen, from, to });
      return true;
    }
    onMove?.({ from, to });
    return true;
  };

  // ----- tap / keyboard -----
  const tap = (sq: Square) => {
    if (!interactive && onSquareTap) {
      onSquareTap(sq);
      return;
    }
    if (!interactive || pendingPromotion) return;
    if (selected && targets.has(sq)) {
      attempt(selected, sq);
    } else if (selected === sq) {
      select(null);
    } else if (canMoveFrom(sq)) {
      select(sq);
    } else {
      select(null);
    }
  };

  const onSquareClick = (e: MouseEvent, sq: Square) => {
    // Pointer taps are handled in the pointer handlers; detail === 0 means keyboard activation.
    if (e.detail === 0) tap(sq);
  };

  const onSquareKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') select(null);
  };

  // ----- pointer (mouse, touch, pen) -----
  const placeGhost = (x: number, y: number) => {
    const board = boardRef.current;
    const ghost = ghostRef.current;
    const d = drag.current;
    if (!board || !ghost || !d) return;
    const rect = board.getBoundingClientRect();
    const size = rect.width / 8;
    // On touch, lift the piece above the finger so the learner can see it.
    const lift = d.touch ? size * 0.9 : 0;
    ghost.style.transform = `translate(${x - rect.left - size / 2}px, ${y - rect.top - size / 2 - lift}px) scale(${d.touch ? 1.35 : 1.1})`;
    const over = squareFromPoint(x, y - lift, rect, orientation);
    setHover((h) => (h === over ? h : over));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const sq = squareFromTarget(e.target);
    if (!sq) return;
    if (!interactive && onSquareTap) {
      pendingTarget.current = sq;
      return;
    }
    if (!interactive || pendingPromotion) return;

    if (selected && targets.has(sq)) {
      pendingTarget.current = sq;
      return;
    }
    if (canMoveFrom(sq)) {
      drag.current = {
        from: sq,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        wasSelected: selected === sq,
        touch: e.pointerType !== 'mouse',
      };
      select(sq);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else {
      select(null);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
      d.active = true;
      const p = pieces.get(d.from);
      if (ghostRef.current && p) {
        ghostRef.current.src = pieceImage(p.color, p.type);
        ghostRef.current.style.display = 'block';
      }
      setDragFrom(d.from);
    }
    placeGhost(e.clientX, e.clientY);
  };

  const endDrag = () => {
    drag.current = null;
    if (ghostRef.current) ghostRef.current.style.display = 'none';
    setDragFrom(null);
    setHover(null);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d && d.pointerId === e.pointerId) {
      if (d.active) {
        const rect = boardRef.current!.getBoundingClientRect();
        const lift = d.touch ? rect.width / 8 * 0.9 : 0;
        const to = squareFromPoint(e.clientX, e.clientY - lift, rect, orientation);
        endDrag();
        if (!(to && to !== d.from && attempt(d.from, to))) select(d.from);
      } else {
        drag.current = null;
        // A plain tap on an already selected piece deselects it.
        if (d.wasSelected) select(null);
      }
      return;
    }
    const pending = pendingTarget.current;
    pendingTarget.current = null;
    if (pending && !interactive && onSquareTap) {
      if (squareFromTarget(e.target) === pending) onSquareTap(pending);
      return;
    }
    if (pending && selected && squareFromTarget(e.target) === pending) attempt(selected, pending);
  };

  const onPointerCancel = () => {
    pendingTarget.current = null;
    if (drag.current) endDrag();
  };

  const turnColor = pendingPromotion ? pieces.get(pendingPromotion.from)?.color ?? 'w' : 'w';

  return (
    <div className="w-full">
      <div
        ref={boardRef}
        role="grid"
        aria-label={label}
        data-testid="chessboard"
        data-orientation={orientation}
        className={`board relative grid aspect-square w-full select-none grid-cols-8 grid-rows-8 overflow-hidden rounded-lg shadow-2xl shadow-black/50 ring-1 ring-gold-500/30 ${
          interactive ? 'touch-none' : 'touch-manipulation'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {squares.map((sq, i) => {
          const piece = pieces.get(sq);
          const isTarget = targets.has(sq);
          const tone = highlights?.[sq];
          const light = squareColor(sq) === 'light';
          const row = Math.floor(i / 8);
          const col = i % 8;
          const name = [
            sq,
            piece ? pieceLabel(piece.color, piece.type) : 'kosong',
            selected === sq ? 'dipilih' : '',
            isTarget ? (piece ? 'boleh tangkap di sini' : 'boleh bergerak ke sini') : '',
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={sq}
              type="button"
              data-square={sq}
              data-piece={piece ? `${piece.color}${piece.type}` : undefined}
              data-target={isTarget || undefined}
              data-selected={selected === sq || undefined}
              aria-label={name}
              tabIndex={interactive || onSquareTap ? 0 : -1}
              onClick={(e) => onSquareClick(e, sq)}
              onKeyDown={onSquareKey}
              className={`relative flex items-center justify-center outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-300 ${
                light ? 'bg-board-light' : 'bg-board-dark'
              } ${interactive || onSquareTap ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {(lastMove?.from === sq || lastMove?.to === sq) && (
                <span className="absolute inset-0 bg-gold-300/40" aria-hidden />
              )}
              {tone && <span className={`absolute inset-0 ${TONE_CLASS[tone]}`} aria-hidden />}
              {selected === sq && <span className="absolute inset-0 bg-gold-400/60" aria-hidden />}
              {hover === sq && dragFrom && <span className="absolute inset-0 ring-4 ring-inset ring-white/70" aria-hidden />}
              {checkSquare === sq && (
                <span
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.95) 0%, rgba(239,68,68,0.55) 45%, rgba(239,68,68,0) 75%)' }}
                  aria-hidden
                />
              )}
              {piece && dragFrom !== sq && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pieceImage(piece.color, piece.type)}
                  alt=""
                  draggable={false}
                  className="pointer-events-none relative h-[90%] w-[90%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]"
                />
              )}
              {isTarget &&
                (piece ? (
                  <span className="pointer-events-none absolute inset-[4%] rounded-full border-[5px] border-black/30 sm:border-[6px]" aria-hidden />
                ) : (
                  <span className="pointer-events-none absolute h-[30%] w-[30%] rounded-full bg-black/25" aria-hidden />
                ))}
              {showCoordinates && col === 0 && (
                <span
                  className={`pointer-events-none absolute left-[3%] top-[1%] text-[9px] font-semibold sm:text-xs ${light ? 'text-board-dark' : 'text-board-light'}`}
                  aria-hidden
                >
                  {sq[1]}
                </span>
              )}
              {showCoordinates && row === 7 && (
                <span
                  className={`pointer-events-none absolute bottom-[1%] right-[4%] text-[9px] font-semibold sm:text-xs ${light ? 'text-board-dark' : 'text-board-light'}`}
                  aria-hidden
                >
                  {sq[0]}
                </span>
              )}
            </button>
          );
        })}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ghostRef}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 z-20 hidden h-[12.5%] w-[12.5%] drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
        />

        {pendingPromotion && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-charcoal-950/75 p-4"
            role="dialog"
            aria-label="Pilih buah untuk promosi Pion"
          >
            <div className="w-full max-w-xs rounded-xl border border-gold-500/40 bg-charcoal-900 p-4 text-center">
              <p className="mb-1 font-display text-lg text-gold-300">Promosi Pion (Pawn promotion)</p>
              <p className="mb-3 text-sm text-charcoal-200">Pion anda sampai ke baris terakhir. Pilih buah baharu:</p>
              <div className="grid grid-cols-4 gap-2">
                {(['q', 'r', 'b', 'n'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-promotion={t}
                    onClick={() => {
                      const { from, to } = pendingPromotion;
                      setPromotion(null);
                      onMove?.({ from, to, promotion: t });
                    }}
                    className="flex min-h-16 flex-col items-center justify-center rounded-lg bg-board-light p-1 text-[11px] font-semibold text-charcoal-900 hover:ring-2 hover:ring-gold-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pieceImage(turnColor, t)} alt="" className="h-10 w-10" draggable={false} />
                    {PIECES[t].ms}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPromotion(null)}
                className="mt-3 min-h-11 w-full rounded-lg border border-charcoal-600 text-sm text-charcoal-200"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
