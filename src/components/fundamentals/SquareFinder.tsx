'use client';

import type { Square } from 'chess.js';
import { useState } from 'react';
import { Chessboard, type HighlightTone } from '@/components/board/Chessboard';
import { Button, Card, CardTitle } from '@/components/ui/primitives';
import { FILES, RANKS } from '@/lib/chess/pieces';

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

function randomSquare(except?: Square): Square {
  for (;;) {
    const s = `${FILES[Math.floor(Math.random() * 8)]}${RANKS[Math.floor(Math.random() * 8)]}` as Square;
    if (s !== except) return s;
  }
}

/** "Find the square" drill: learn files (a–h) and ranks (1–8) by tapping. */
export function SquareFinder() {
  const [target, setTarget] = useState<Square>('e4');
  const [coords, setCoords] = useState(true);
  const [score, setScore] = useState({ right: 0, tries: 0 });
  const [feedback, setFeedback] = useState<{ square: Square; ok: boolean } | null>(null);

  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (feedback) highlights[feedback.square] = feedback.ok ? 'green' : 'red';
  if (feedback && !feedback.ok) highlights[target] = 'gold';

  const onTap = (sq: Square) => {
    const ok = sq === target;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), tries: s.tries + 1 }));
    setFeedback({ square: sq, ok });
    if (ok) setTarget(randomSquare(target));
  };

  return (
    <Card>
      <CardTitle sub="File = lajur menegak a–h (kiri ke kanan). Rank = baris mendatar 1–8 (dari pihak Putih). Nama petak = file + rank.">
        Latihan: cari petak
      </CardTitle>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="mx-auto w-full max-w-md">
          <Chessboard fen={EMPTY} onSquareTap={onTap} highlights={highlights} showCoordinates={coords} label="Papan latihan cari petak" />
        </div>
        <div className="space-y-3">
          <p className="text-sm text-charcoal-300">Ketik petak:</p>
          <p className="font-mono text-5xl font-bold text-gold-300" data-testid="square-target" aria-live="polite">
            {target}
          </p>
          {feedback && (
            <p className={`text-sm ${feedback.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">
              {feedback.ok
                ? `Betul! ${feedback.square}: file ${feedback.square[0]}, rank ${feedback.square[1]}.`
                : `Itu ${feedback.square}. Cari file "${target[0]}" dahulu (lajur), kemudian naik ke rank ${target[1]}. Petak emas ialah jawapannya.`}
            </p>
          )}
          <p className="text-sm text-charcoal-200">
            Markah: <strong className="text-white">{score.right}</strong> / {score.tries}
          </p>
          <Button onClick={() => setCoords((c) => !c)}>{coords ? 'Sembunyikan koordinat' : 'Tunjuk koordinat'}</Button>
          <p className="text-xs text-charcoal-400">
            Petua: petak di sudut kanan bawah papan (h1) sentiasa berwarna cerah – “light on right”.
          </p>
        </div>
      </div>
    </Card>
  );
}
