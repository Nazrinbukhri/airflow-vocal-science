'use client';

import type { Color } from 'chess.js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CoachPanel } from '@/components/coach/CoachPanel';
import { EnginePanel } from '@/components/engine/EnginePanel';
import type { HighlightTone } from '@/components/board/Chessboard';
import type { Square } from 'chess.js';
import { bookMovesFor } from '@/lib/openings/book';
import { GameWorkbench, NotationHelp } from '@/components/game/GameWorkbench';
import { Badge, Button, Card, CardTitle } from '@/components/ui/primitives';
import { LEVELS, chooseMove } from '@/lib/engine/strength';
import { useAnalysis, useEngineHandle } from '@/lib/hooks/useEngine';
import { useGame } from '@/lib/hooks/useGame';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { getStore } from '@/lib/storage/db';

type Settings = {
  mode: 'ai' | 'two';
  /** Colour the learner plays against the AI. */
  human: Color;
  level: number;
  showEngine: boolean;
  showCoach: boolean;
};

export type PlayResult = { key: string; at: number; result: 'win' | 'loss' | 'draw'; level: number; color: Color; moves: number };

const DEFAULTS: Settings = { mode: 'ai', human: 'w', level: 1, showEngine: false, showCoach: true };
const MIN_THINK_MS = 450;

export function PlayView() {
  const g = useGame('game:play');
  const [settings, setSettings, settingsLoaded] = usePersistentState<Settings>('play:settings', DEFAULTS);
  const router = useRouter();
  const vsAi = settings.mode === 'ai';
  const { engineRef, state: engineState } = useEngineHandle(vsAi);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  const atEnd = g.game.ply() === g.game.length();
  const playing = g.status.kind === 'playing';
  const engineToMove = vsAi && playing && atEnd && g.game.turn() !== settings.human;

  // The AI's move.
  const { move, game } = g;
  const fen = g.fen;
  const ready = g.restored && settingsLoaded;
  useEffect(() => {
    if (!engineToMove || !ready) return;
    const engine = engineRef.current;
    if (!engine) return;
    const ctrl = new AbortController();
    const started = Date.now();
    queueMicrotask(() => !ctrl.signal.aborted && setThinking(true));
    chooseMove(engine, fen, settings.level, ctrl.signal)
      .then(async (uci) => {
        const wait = MIN_THINK_MS - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        if (ctrl.signal.aborted || !uci || game.fen() !== fen) return;
        move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] } as Parameters<typeof move>[0]);
        setEngineError(null);
      })
      .catch((e: unknown) => !ctrl.signal.aborted && setEngineError(e instanceof Error ? e.message : String(e)))
      .finally(() => !ctrl.signal.aborted && setThinking(false));
    return () => {
      ctrl.abort();
      setThinking(false);
    };
  }, [engineToMove, ready, fen, settings.level, engineRef, move, game]);

  const analysis = useAnalysis(g.fen, { enabled: settings.showEngine && !engineToMove, multiPv: 3, depth: 14 });
  const coachOn = settings.showCoach && playing && !engineToMove && !thinking;
  const [hl, setHl] = useState<{ fen: string; squares: Square[] }>({ fen: '', squares: [] });
  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (hl.fen === g.fen) for (const sq of hl.squares) highlights[sq] = 'gold';

  const newGame = (human?: Color) => {
    const side = human ?? settings.human;
    setSettings((s) => ({ ...s, human: side }));
    g.restart();
    void engineRef.current?.newGame();
  };

  const undoVsAi = () => {
    // Take back the learner's last move together with the AI's reply.
    g.undo();
    if (g.game.turn() !== settings.human && g.game.canUndo()) g.undo();
    g.truncate();
  };

  const analyseThisGame = async () => {
    const store = await getStore();
    await store.setSetting('game:analysis', { pgn: g.game.pgn({ full: true }), ply: 0 });
    router.push('/analysis/');
  };

  const level = LEVELS.find((l) => l.level === settings.level) ?? LEVELS[0]!;
  const lock = vsAi && (engineToMove || thinking);

  const settingsCard = (
    <Card>
      <CardTitle>Tetapan permainan</CardTitle>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mod permainan">
        {(['ai', 'two'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={settings.mode === m}
            onClick={() => setSettings((s) => ({ ...s, mode: m }))}
            className={`min-h-11 rounded-lg text-sm ${settings.mode === m ? 'bg-emerald-600/25 text-gold-200 ring-1 ring-emerald-500/50' : 'border border-charcoal-700 text-charcoal-300'}`}
          >
            {m === 'ai' ? 'Lawan Stockfish' : 'Dua pemain'}
          </button>
        ))}
      </div>
      {vsAi && (
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-charcoal-200">
            Tahap lawan: <strong className="text-gold-200">{level.level}. {level.name}</strong>
            <input
              type="range"
              min={1}
              max={LEVELS.length}
              value={settings.level}
              onChange={(e) => setSettings((s) => ({ ...s, level: Number(e.target.value) }))}
              className="mt-1 w-full accent-emerald-500"
              aria-label="Tahap lawan"
            />
            <span className="block text-xs text-charcoal-400">{level.description}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => newGame('w')}>
              Baharu: saya Putih
            </Button>
            <Button onClick={() => newGame('b')}>Baharu: saya Hitam</Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-charcoal-300">
            <Badge tone={engineState === 'error' ? 'red' : engineState === 'ready' || engineState === 'thinking' ? 'emerald' : 'neutral'}>
              {engineState === 'loading' ? 'Memuatkan enjin…' : engineState === 'error' ? 'Ralat enjin' : 'Stockfish 19 Lite'}
            </Badge>
            {thinking && <span data-testid="ai-thinking">Stockfish sedang berfikir…</span>}
            {!thinking && playing && !engineToMove && <span>Giliran anda.</span>}
          </div>
        </div>
      )}
      {engineError && (
        <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-300" role="alert">
          {engineError}
        </p>
      )}
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-charcoal-200">
        <input
          type="checkbox"
          checked={settings.showEngine}
          onChange={(e) => setSettings((s) => ({ ...s, showEngine: e.target.checked }))}
          className="h-5 w-5 accent-emerald-500"
        />
        Tunjuk analisis enjin (cuba fikir sendiri dahulu!)
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-charcoal-200">
        <input
          type="checkbox"
          checked={settings.showCoach}
          onChange={(e) => setSettings((s) => ({ ...s, showCoach: e.target.checked }))}
          className="h-5 w-5 accent-emerald-500"
        />
        Jurulatih serangan (ancaman, petunjuk berperingkat)
      </label>
    </Card>
  );

  // Record finished games against the AI (once per game) for the progress report.
  const finishedKey = !playing && vsAi && g.game.length() > 0 ? `${g.game.initialFen()}|${g.game.fullHistory().map((m) => m.lan).join(' ')}` : null;
  useEffect(() => {
    if (!finishedKey || !g.restored) return;
    const status = g.status;
    const result: PlayResult['result'] = status.kind === 'checkmate' ? (status.winner === settings.human ? 'win' : 'loss') : 'draw';
    void getStore().then(async (store) => {
      const prev = (await store.getSetting<PlayResult[]>('play:results')) ?? [];
      if (prev.some((r) => r.key === finishedKey)) return;
      await store.setSetting('play:results', [{ key: finishedKey, at: Date.now(), result, level: settings.level, color: settings.human, moves: Math.ceil(g.game.length() / 2) }, ...prev].slice(0, 100));
    });
    // Only when a new game finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedKey, g.restored]);

  const resultCard =
    !playing && g.game.length() > 0 ? (
      <Card className="border-gold-500/40">
        <CardTitle>Permainan tamat</CardTitle>
        <p className="mb-3 text-sm text-charcoal-200">
          {g.status.kind === 'checkmate'
            ? vsAi
              ? g.status.winner === settings.human
                ? 'Tahniah – anda memberi checkmate kepada Stockfish!'
                : 'Stockfish menang kali ini. Semak permainan untuk mencari titik perubahan.'
              : 'Checkmate!'
            : 'Permainan seri.'}
        </p>
        <Button variant="primary" onClick={() => void analyseThisGame()}>
          Analisis permainan ini
        </Button>
      </Card>
    ) : null;

  return (
    <GameWorkbench
      game={g}
      id="play"
      orientation={vsAi ? settings.human : undefined}
      lockBoard={lock}
      onUndo={vsAi ? undoVsAi : undefined}
      onRestart={vsAi ? () => newGame() : undefined}
      allowImport={!vsAi}
      highlights={highlights}
      sideTop={
        <>
          {resultCard}
          {settingsCard}
          {coachOn && (
            <CoachPanel
              fen={g.fen}
              lastMove={g.lastMove}
              depth={12}
              book={bookMovesFor(g.fen)}
              onHighlight={(squares) => setHl({ fen: g.fen, squares })}
            />
          )}
          {settings.showEngine && <EnginePanel {...analysis} />}
        </>
      }
      aside={<NotationHelp />}
    />
  );
}
