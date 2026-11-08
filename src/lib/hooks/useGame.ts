'use client';

import type { Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BoardMove, BoardTarget } from '@/components/board/Chessboard';
import { GameController, type LoadResult } from '@/lib/chess/game-controller';
import { getStore } from '@/lib/storage/db';

type Saved = { pgn: string; ply: number };

/**
 * React binding for GameController. The controller is mutable, so we keep one
 * instance for the component's lifetime and bump a version number after every change.
 * When `storageKey` is set, the game is saved to IndexedDB and restored on reload.
 */
export function useGame(storageKey?: string) {
  const [game] = useState(() => new GameController());
  const [version, setVersion] = useState(0);
  const [restored, setRestored] = useState(!storageKey);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Restore a saved game once.
  useEffect(() => {
    if (!storageKey) return;
    let alive = true;
    (async () => {
      const store = await getStore();
      const saved = await store.getSetting<Saved>(storageKey);
      if (alive && saved?.pgn) {
        if (game.loadPgn(saved.pgn).ok) game.goTo(saved.ply);
        bump();
      }
      if (alive) setRestored(true);
    })();
    return () => {
      alive = false;
    };
  }, [storageKey, game, bump]);

  // Save after every change (only once restore has finished, so we never overwrite it with an empty game).
  useEffect(() => {
    if (!storageKey || !restored) return;
    // Save the whole line (including redo moves) plus where the cursor is.
    const saved: Saved = { pgn: game.pgn({ full: true }), ply: game.ply() };
    void getStore().then((s) => s.setSetting<Saved>(storageKey, saved));
  }, [version, restored, storageKey, game]);

  const legalMoves = useMemo(() => {
    void version;
    const map = new Map<Square, BoardTarget[]>();
    for (const [from, list] of game.legalMovesByFrom()) {
      map.set(from, list.map((m) => ({ to: m.to, promotion: m.promotion })));
    }
    return map;
  }, [game, version]);

  const act = useCallback(
    <T,>(fn: () => T): T => {
      const r = fn();
      bump();
      return r;
    },
    [bump],
  );

  return {
    game,
    version,
    restored,
    fen: game.fen(),
    legalMoves,
    lastMove: game.lastMove(),
    checkSquare: game.checkedKingSquare(),
    status: game.status(),
    move: (m: BoardMove | string) => act(() => game.move(m)),
    undo: () => act(() => game.undo()),
    redo: () => act(() => game.redo()),
    goTo: (ply: number) => act(() => game.goTo(ply)),
    restart: () => act(() => game.restart()),
    loadFen: (fen: string): LoadResult => act(() => game.loadFen(fen)),
    loadPgn: (pgn: string): LoadResult => act(() => game.loadPgn(pgn)),
  };
}
