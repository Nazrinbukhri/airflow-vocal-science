'use client';

import type { Color } from 'chess.js';
import { useState, type ReactNode } from 'react';
import { Chessboard, type HighlightTone } from '@/components/board/Chessboard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Badge, Button, Card, CardTitle } from '@/components/ui/primitives';
import { describeMove } from '@/lib/chess/describe';
import { describeStatus } from '@/lib/chess/game-controller';
import type { Square } from 'chess.js';
import type { GameHandle } from '@/lib/hooks/useGame';

type Props = {
  /** Game state owned by the page (see useGame). */
  game: GameHandle;
  /** Unique id for form fields. */
  id: string;
  /** Open the import panel by default (analysis page). */
  importFirst?: boolean;
  /** Controlled orientation (otherwise the flip button manages it). */
  orientation?: Color;
  onFlip?: () => void;
  /** Board does not accept moves (e.g. while the AI is thinking). */
  lockBoard?: boolean;
  /** Custom undo / restart (AI games undo two half-moves). */
  onUndo?: () => void;
  onRestart?: () => void;
  /** Allow FEN/PGN import (off while playing the AI). */
  allowImport?: boolean;
  highlights?: Partial<Record<Square, HighlightTone>>;
  /** Shown above the status card, e.g. game settings or the engine panel. */
  sideTop?: ReactNode;
  /** Shown under the board controls. */
  belowBoard?: ReactNode;
  aside?: ReactNode;
};

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-charcoal-700 bg-charcoal-800/70 px-1 text-[10px] text-charcoal-200 hover:border-gold-500/50 hover:text-gold-200 disabled:opacity-35"
    >
      <Icon name={icon} className="h-5 w-5" />
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}

export function GameWorkbench({
  game: g,
  id,
  importFirst = false,
  orientation: controlledOrientation,
  onFlip,
  lockBoard = false,
  onUndo,
  onRestart,
  allowImport = true,
  highlights,
  sideTop,
  belowBoard,
  aside,
}: Props) {
  const storageKey = id;
  const [ownOrientation, setOrientation] = useState<Color>('w');
  const orientation = controlledOrientation ?? ownOrientation;
  const [panel, setPanel] = useState<'moves' | 'import'>(importFirst ? 'import' : 'moves');
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const history = g.game.fullHistory();
  const ply = g.game.ply();
  const last = g.lastMove;
  const statusText = describeStatus(g.status);
  const over = g.status.kind !== 'playing';

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ tone: 'ok', text: `${what} disalin.` });
    } catch {
      setMessage({ tone: 'error', text: `Tidak dapat menyalin ${what}. Pilih teks dan salin secara manual.` });
    }
  };

  const downloadPgn = () => {
    const blob = new Blob([g.game.pgn()], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess-master-ai.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group moves into numbered rows: "1. e4 e5". A game may start with Black to move.
  const pairs: { no: number; white?: number; black?: number }[] = [];
  let moveNo = Number(g.game.initialFen().split(' ')[5]) || 1;
  history.forEach((m, i) => {
    if (m.color === 'w' || pairs.length === 0) pairs.push({ no: moveNo });
    const row = pairs[pairs.length - 1]!;
    if (m.color === 'w') row.white = i;
    else {
      row.black = i;
      moveNo++;
    }
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))] lg:max-w-none">
        <Chessboard
          fen={g.fen}
          orientation={orientation}
          legalMoves={lockBoard ? undefined : g.legalMoves}
          highlights={highlights}
          onMove={(m) => {
            setMessage(null);
            g.move(m);
          }}
          lastMove={last ? { from: last.from, to: last.to } : undefined}
          checkSquare={g.checkSquare}
        />
        <div className="mt-3 flex gap-2" role="toolbar" aria-label="Kawalan papan">
          <ToolButton icon="first" label="Mula" onClick={() => g.goTo(0)} disabled={ply === 0} />
          <ToolButton icon="undo" label="Undur" onClick={onUndo ?? g.undo} disabled={!g.game.canUndo()} />
          <ToolButton icon="redo" label="Ulang" onClick={g.redo} disabled={!g.game.canRedo()} />
          <ToolButton icon="last" label="Akhir" onClick={() => g.goTo(history.length)} disabled={!g.game.canRedo()} />
          <ToolButton icon="flip" label="Pusing" onClick={onFlip ?? (() => setOrientation((o) => (o === 'w' ? 'b' : 'w')))} />
          <ToolButton
            icon="restart"
            label="Mula semula"
            onClick={() => {
              if (history.length === 0 || window.confirm('Mula semula permainan? Semua langkah akan dipadam.')) {
                if (onRestart) onRestart();
                else g.restart();
              }
            }}
          />
        </div>
        {belowBoard}
      </div>

      <div className="space-y-4">
        {sideTop}
        <Card>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg text-gold-200">Status</h2>
            <Badge tone={over ? 'gold' : g.status.kind === 'playing' && g.status.check ? 'red' : 'emerald'}>
              {over ? 'Tamat' : g.game.turn() === 'w' ? 'Giliran Putih' : 'Giliran Hitam'}
            </Badge>
          </div>
          <p className="text-sm text-charcoal-100" aria-live="polite" data-testid="status">
            {statusText}
          </p>
          {last && (
            <div className="mt-3 rounded-lg bg-charcoal-800/80 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Apa yang berlaku?</p>
              <p className="mt-1 text-sm text-charcoal-100" data-testid="last-move-explainer">
                {describeMove(last)}
              </p>
              <p className="mt-1 text-xs text-charcoal-400">
                SAN: <span className="font-mono text-gold-300">{last.san}</span> · UCI:{' '}
                <span className="font-mono text-gold-300">{last.lan}</span>
              </p>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex gap-2" role="tablist">
            {(allowImport ? (['moves', 'import'] as const) : (['moves'] as const)).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={panel === p}
                onClick={() => setPanel(p)}
                className={`min-h-11 flex-1 rounded-lg text-sm ${
                  panel === p ? 'bg-emerald-600/25 text-gold-200 ring-1 ring-emerald-500/50' : 'text-charcoal-300 hover:bg-charcoal-800'
                }`}
              >
                {p === 'moves' ? 'Senarai langkah' : 'FEN / PGN'}
              </button>
            ))}
          </div>

          {panel === 'moves' || !allowImport ? (
            <div>
              {history.length === 0 ? (
                <p className="text-sm text-charcoal-300">
                  Belum ada langkah. Ketik satu buah, kemudian ketik petak bertitik – atau seret buah itu.
                </p>
              ) : (
                <ol className="max-h-72 overflow-y-auto font-mono text-sm" data-testid="move-list">
                  {pairs.map((row) => (
                    <li key={row.no} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-1 py-0.5">
                      <span className="text-charcoal-400">{row.no}.</span>
                      {[row.white, row.black].map((idx, k) =>
                        idx === undefined ? (
                          <span key={k} className="text-charcoal-500">{k === 0 ? '…' : ''}</span>
                        ) : (
                          <button
                            key={k}
                            type="button"
                            onClick={() => g.goTo(idx + 1)}
                            className={`min-h-9 rounded px-2 text-left ${
                              idx + 1 === ply ? 'bg-gold-500/25 text-gold-100' : idx < ply ? 'text-charcoal-100 hover:bg-charcoal-800' : 'text-charcoal-500 hover:bg-charcoal-800'
                            }`}
                          >
                            {history[idx]!.san}
                          </button>
                        ),
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor={`${storageKey}-fen`} className="mb-1 block text-sm font-medium text-charcoal-100">
                  FEN <span className="text-charcoal-400">(Forsyth–Edwards Notation: satu kedudukan)</span>
                </label>
                <textarea
                  id={`${storageKey}-fen`}
                  rows={2}
                  value={fenInput}
                  onChange={(e) => setFenInput(e.target.value)}
                  placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
                  className="w-full rounded-lg border border-charcoal-600 bg-charcoal-950 p-2 font-mono text-sm text-charcoal-100"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const r = g.loadFen(fenInput);
                      setMessage(r.ok ? { tone: 'ok', text: 'Kedudukan FEN dimuatkan.' } : { tone: 'error', text: r.error });
                    }}
                  >
                    Muat FEN
                  </Button>
                  <Button onClick={() => copy(g.fen, 'FEN')}>
                    <Icon name="copy" className="h-4 w-4" /> Salin FEN semasa
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor={`${storageKey}-pgn`} className="mb-1 block text-sm font-medium text-charcoal-100">
                  PGN <span className="text-charcoal-400">(Portable Game Notation: satu permainan)</span>
                </label>
                <textarea
                  id={`${storageKey}-pgn`}
                  rows={5}
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  placeholder={'[Event "Contoh"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'}
                  className="w-full rounded-lg border border-charcoal-600 bg-charcoal-950 p-2 font-mono text-sm text-charcoal-100"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const r = g.loadPgn(pgnInput);
                      if (r.ok) setPanel('moves');
                      setMessage(
                        r.ok
                          ? { tone: 'ok', text: `PGN dimuatkan: ${g.game.length()} langkah. Guna anak panah untuk mengulang kaji.` }
                          : { tone: 'error', text: r.error },
                      );
                    }}
                  >
                    Muat PGN
                  </Button>
                  <Button onClick={() => copy(g.game.pgn(), 'PGN')}>
                    <Icon name="copy" className="h-4 w-4" /> Salin PGN
                  </Button>
                  <Button onClick={downloadPgn}>
                    <Icon name="download" className="h-4 w-4" /> Muat turun
                  </Button>
                </div>
              </div>
            </div>
          )}
          {message && (
            <p
              role={message.tone === 'error' ? 'alert' : 'status'}
              data-testid="workbench-message"
              className={`mt-3 rounded-lg p-2 text-sm ${message.tone === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}
            >
              {message.text}
            </p>
          )}
        </Card>

        {aside}
      </div>
    </div>
  );
}

export function NotationHelp() {
  return (
    <Card>
      <CardTitle sub="Cara membaca langkah dalam senarai">Notasi ringkas</CardTitle>
      <ul className="space-y-1 text-sm text-charcoal-200">
        <li><span className="font-mono text-gold-300">e4</span> – Pion ke petak e4</li>
        <li><span className="font-mono text-gold-300">Nf3</span> – Kuda (N = Knight) ke f3</li>
        <li><span className="font-mono text-gold-300">Bxc6</span> – Gajah (B) menangkap (x) di c6</li>
        <li><span className="font-mono text-gold-300">O-O</span> – castling sebelah Raja</li>
        <li><span className="font-mono text-gold-300">Qh5+</span> – Menteri ke h5, check (+)</li>
        <li><span className="font-mono text-gold-300">e8=Q#</span> – promosi ke Menteri, checkmate (#)</li>
        <li><span className="font-mono text-gold-300">e2e4</span> – format UCI: petak asal + petak tujuan</li>
      </ul>
    </Card>
  );
}
