'use client';

import type { Square } from 'chess.js';
import { useState } from 'react';
import { CoachPanel } from '@/components/coach/CoachPanel';
import { EnginePanel } from '@/components/engine/EnginePanel';
import { GameWorkbench } from '@/components/game/GameWorkbench';
import { Card, CardTitle } from '@/components/ui/primitives';
import type { HighlightTone } from '@/components/board/Chessboard';
import { COACH_SAMPLES } from '@/lib/coach/samples';
import { bookMovesFor } from '@/lib/openings/book';
import { useAnalysis } from '@/lib/hooks/useEngine';
import { useGame } from '@/lib/hooks/useGame';
import { usePersistentState } from '@/lib/hooks/usePersistentState';

export function CoachView() {
  const g = useGame('game:coach');
  const [hl, setHl] = useState<{ fen: string; squares: Square[] }>({ fen: '', squares: [] });
  const [multiPv, setMultiPv] = usePersistentState('coach:multipv', 5);
  const analysis = useAnalysis(g.fen, { multiPv, depth: 16 });
  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (hl.fen === g.fen) for (const s of hl.squares) highlights[s] = 'gold';

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle sub="Pilih kedudukan, atau gerakkan buah di papan. Jurulatih menganalisis setiap kedudukan baharu.">Kedudukan latihan</CardTitle>
        <div className="flex flex-wrap gap-2">
          {COACH_SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              title={s.note}
              onClick={() => g.loadFen(s.fen)}
              className="min-h-11 rounded-lg border border-charcoal-700 bg-charcoal-800/60 px-3 text-left text-sm text-charcoal-100 hover:border-gold-500/50"
            >
              {s.name}
            </button>
          ))}
        </div>
      </Card>
      <GameWorkbench
        game={g}
        id="game:coach"
        highlights={highlights}
        moveMap
        sideTop={
          <CoachPanel
            fen={g.fen}
            lastMove={g.lastMove}
            book={bookMovesFor(g.fen)}
            onHighlight={(squares) => setHl({ fen: g.fen, squares })}
            onTryMove={(uci) => g.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: (uci[4] as 'q') || undefined })}
          />
        }
        aside={
          <EnginePanel
            {...analysis}
            title="Ramalan enjin (MultiPV)"
            controls={
              <label className="mb-2 flex items-center gap-2 text-sm text-charcoal-200">
                Bilangan calon
                <select
                  value={multiPv}
                  onChange={(e) => setMultiPv(Number(e.target.value))}
                  className="min-h-10 rounded-lg border border-charcoal-600 bg-charcoal-950 px-2"
                >
                  {[3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            }
          />
        }
      />
    </div>
  );
}
