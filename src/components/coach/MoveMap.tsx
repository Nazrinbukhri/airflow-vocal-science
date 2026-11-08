'use client';

import { Chess, type Color, type Square } from 'chess.js';
import { useState } from 'react';
import type { MoveRating } from '@/lib/coach/moveMap';
import { PIECES } from '@/lib/chess/pieces';
import { useMoveMap } from '@/lib/hooks/useMoveMap';

const TONE_TEXT: Record<MoveRating['tone'], string> = { best: 'Terbaik', good: 'Baik', ok: 'Boleh', bad: 'Bahaya' };

function colour(m: MoveRating): string {
  return m.tone === 'bad'
    ? `rgba(239, 68, 68, ${(0.35 + 0.45 * m.intensity).toFixed(2)})`
    : `rgba(16, 185, 129, ${(0.2 + 0.6 * m.intensity).toFixed(2)})`;
}

/**
 * Move map: point at (or tap) one of your pieces and every square it can go to is
 * coloured by engine quality – deep green = best, pale = weaker, red = losing – with the reason.
 */
export function useMoveMapOverlay(fen: string, enabled: boolean, side?: Color) {
  const [focus, setFocus] = useState<{ fen: string; piece: Square | null; target: Square | null }>({ fen, piece: null, target: null });
  const current = focus.fen === fen ? focus : { fen, piece: null, target: null };
  const { map, loading } = useMoveMap(fen, current.piece, enabled);

  const chess = new Chess(fen);
  const turn = chess.turn();
  const active = enabled && (!side || side === turn);

  const onFocusSquare = (sq: Square | null) => {
    if (!active) return;
    if (!sq) {
      setFocus({ fen, piece: current.piece, target: null });
      return;
    }
    const p = chess.get(sq);
    if (p && p.color === turn && chess.moves({ square: sq }).length > 0) setFocus({ fen, piece: sq, target: null });
    else if (map?.moves.some((m) => m.to === sq)) setFocus({ fen, piece: current.piece, target: sq });
    else setFocus({ fen, piece: current.piece, target: null });
  };

  const heat: Partial<Record<Square, { color: string; kind: string; label: string }>> = {};
  if (active && map && map.from === current.piece) {
    for (const m of map.moves) heat[m.to] = { color: colour(m), kind: m.tone, label: `${m.san}: ${TONE_TEXT[m.tone]}. ${m.reason}` };
  }

  const piece = current.piece ? chess.get(current.piece) : undefined;
  const hovered = map?.moves.find((m) => m.to === current.target);
  const bad = map?.moves.filter((m) => m.tone === 'bad') ?? [];
  const best = map?.moves.filter((m) => m.tone === 'best') ?? [];

  const info = !active ? null : (
    <div className="mt-2 min-h-12 rounded-lg bg-charcoal-900/80 px-3 py-2 text-sm" data-testid="move-map-info" aria-live="polite">
      {!current.piece ? (
        <p className="text-charcoal-400">
          🎯 Tuding (atau ketik) buah anda: <span className="text-emerald-300">hijau pekat = terbaik</span>,{' '}
          <span className="text-red-300">merah = berbahaya</span>.
        </p>
      ) : loading ? (
        <p className="text-charcoal-300">Menilai langkah {piece ? PIECES[piece.type].ms : ''} di {current.piece}…</p>
      ) : hovered ? (
        <p className={hovered.tone === 'bad' ? 'text-red-200' : 'text-emerald-200'}>
          <span className="font-mono font-semibold">{hovered.san}</span> · {TONE_TEXT[hovered.tone]} – {hovered.reason}
        </p>
      ) : map && map.moves.length > 0 ? (
        <p className="text-charcoal-200">
          {best.length > 0 && (
            <>
              Terbaik: <span className="font-mono text-emerald-300">{best.map((m) => m.san).join(', ')}</span>.{' '}
            </>
          )}
          {bad.length > 0 ? (
            <>
              Elakkan: <span className="font-mono text-red-300">{bad.map((m) => m.san).join(', ')}</span>{' '}
              <span className="text-charcoal-400">(tuding petak merah untuk sebabnya)</span>
            </>
          ) : (
            <span className="text-charcoal-400">Tiada langkah berbahaya untuk buah ini.</span>
          )}
        </p>
      ) : (
        <p className="text-charcoal-400">Buah ini tiada langkah sah.</p>
      )}
    </div>
  );

  return { onFocusSquare, heat, info };
}
