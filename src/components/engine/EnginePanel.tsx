'use client';

import type { AnalysisResult, EngineLine } from '@/lib/engine/engine';
import { formatScore, numberedLine, scoreToBar } from '@/lib/engine/uci';
import type { AnalysisStatus } from '@/lib/hooks/useEngine';
import { Badge, Card } from '@/components/ui/primitives';

const STATUS_TEXT: Record<AnalysisStatus, string> = {
  off: 'Analisis dimatikan',
  loading: 'Memuatkan Stockfish…',
  thinking: 'Sedang mengira…',
  done: 'Selesai',
  error: 'Ralat enjin',
};

export function EvalBar({ line }: { line?: EngineLine }) {
  const share = line ? scoreToBar(line.scoreWhite) : 0.5;
  return (
    <div className="flex items-center gap-2" aria-label={line ? `Penilaian ${formatScore(line.scoreWhite)}` : 'Tiada penilaian'}>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-charcoal-950 ring-1 ring-charcoal-600">
        <div className="absolute inset-y-0 left-0 bg-charcoal-50 transition-[width] duration-300" style={{ width: `${share * 100}%` }} />
      </div>
      <span className="w-16 text-right font-mono text-sm font-semibold text-gold-200" data-testid="eval-score">
        {line ? formatScore(line.scoreWhite) : '–'}
      </span>
    </div>
  );
}

/** Raw engine output: evaluation, depth, status and the MultiPV lines. */
export function EnginePanel({
  result,
  status,
  error,
  title = 'Analisis Stockfish',
  onPickLine,
  controls,
}: {
  result: AnalysisResult | null;
  status: AnalysisStatus;
  error?: string | null;
  title?: string;
  onPickLine?: (line: EngineLine) => void;
  controls?: React.ReactNode;
}) {
  const lines = result?.lines ?? [];
  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-gold-200">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-charcoal-300" data-testid="engine-status" data-status={status}>
          {status === 'thinking' || status === 'loading' ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          ) : null}
          {STATUS_TEXT[status]}
          {result && result.depth > 0 && <Badge tone="emerald">Kedalaman {result.depth}</Badge>}
        </div>
      </div>
      {controls}
      {status === 'error' ? (
        <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300" role="alert">
          {error ?? 'Enjin tidak dapat dijalankan pada pelayar ini.'}
        </p>
      ) : status === 'off' ? null : (
        <>
          <EvalBar line={lines[0]} />
          {result && lines.length === 0 && result.depth === 0 && status === 'done' ? (
            <p className="mt-2 text-sm text-charcoal-300">Tiada langkah sah – permainan sudah tamat.</p>
          ) : (
            <ol className="mt-3 space-y-1.5" data-testid="engine-lines">
              {lines.map((l, i) => {
                const text = numberedLine(result!.fen, l.pvSan.slice(0, 8));
                const content = (
                  <>
                    <span className="w-14 shrink-0 font-mono font-semibold text-gold-200">{formatScore(l.scoreWhite)}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-charcoal-100">{text}</span>
                  </>
                );
                return (
                  <li key={`${i}-${l.pv[0]}`}>
                    {onPickLine ? (
                      <button
                        type="button"
                        onClick={() => onPickLine(l)}
                        className="flex min-h-10 w-full items-center gap-2 rounded-lg bg-charcoal-800/70 px-2 text-left text-sm hover:bg-charcoal-700"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="flex min-h-10 items-center gap-2 rounded-lg bg-charcoal-800/70 px-2 text-sm">{content}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-2 text-[11px] leading-snug text-charcoal-400">
            Penilaian dari pihak Putih (+ baik untuk Putih, − baik untuk Hitam, #N = mat dalam N langkah). Ia anggaran enjin
            pada kedalaman ini – bukan jaminan kemenangan.
          </p>
        </>
      )}
    </Card>
  );
}
