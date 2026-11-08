'use client';

import { GameReviewPanel } from '@/components/analysis/GameReviewPanel';
import { EnginePanel } from '@/components/engine/EnginePanel';
import { GameWorkbench } from '@/components/game/GameWorkbench';
import { useAnalysis } from '@/lib/hooks/useEngine';
import { useGame } from '@/lib/hooks/useGame';
import { usePersistentState } from '@/lib/hooks/usePersistentState';

type Settings = { engine: boolean; multiPv: number; depth: number };

export function AnalysisView({ aside }: { aside?: React.ReactNode }) {
  const g = useGame('game:analysis');
  const [s, setS] = usePersistentState<Settings>('analysis:settings', { engine: true, multiPv: 3, depth: 18 });
  const analysis = useAnalysis(g.fen, { enabled: s.engine, multiPv: s.multiPv, depth: s.depth });

  const controls = (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-charcoal-200">
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" checked={s.engine} onChange={(e) => setS((v) => ({ ...v, engine: e.target.checked }))} className="h-5 w-5 accent-emerald-500" />
        Enjin
      </label>
      <label className="flex items-center gap-1">
        Calon
        <select
          value={s.multiPv}
          onChange={(e) => setS((v) => ({ ...v, multiPv: Number(e.target.value) }))}
          className="min-h-10 rounded-lg border border-charcoal-600 bg-charcoal-950 px-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        Kedalaman
        <select
          value={s.depth}
          onChange={(e) => setS((v) => ({ ...v, depth: Number(e.target.value) }))}
          className="min-h-10 rounded-lg border border-charcoal-600 bg-charcoal-950 px-2"
        >
          {[12, 16, 18, 22, 26].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <GameWorkbench
      game={g}
      id="game:analysis"
      importFirst
      sideTop={<EnginePanel {...analysis} controls={controls} />}
      aside={<>
        <GameReviewPanel game={g} />
        {aside}
      </>}
    />
  );
}
