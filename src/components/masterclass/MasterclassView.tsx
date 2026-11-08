'use client';

import { Chess, type Move, type Square } from 'chess.js';
import { useMemo, useState } from 'react';
import { Chessboard, type BoardMove, type BoardTarget } from '@/components/board/Chessboard';
import { Icon } from '@/components/ui/Icon';
import { Badge, Button, Card, CardTitle } from '@/components/ui/primitives';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { GM_GAMES, PENDING_PLAYERS, type GmGame } from '@/lib/masterclass/games';

function legalOf(c: Chess) {
  const map = new Map<Square, BoardTarget[]>();
  for (const m of c.moves({ verbose: true })) {
    const l = map.get(m.from) ?? [];
    l.push({ to: m.to, promotion: m.promotion });
    map.set(m.from, l);
  }
  return map;
}

function GameStudy({ game, onBack, onGuess }: { game: GmGame; onBack: () => void; onGuess: (ok: boolean) => void }) {
  const moves = useMemo(() => {
    const c = new Chess();
    c.loadPgn(game.pgn);
    return c.history({ verbose: true }) as Move[];
  }, [game.pgn]);
  const [ply, setPly] = useState(0);
  const [guessState, setGuessState] = useState<{ ply: number; text: string; ok: boolean } | null>(null);
  const [skipGuess, setSkipGuess] = useState<number[]>([]);

  const c = new Chess();
  for (const m of moves.slice(0, ply)) c.move(m.san);
  const last = moves[ply - 1];
  const next = moves[ply];
  const isGuess = !!next && game.guess.includes(ply + 1) && !skipGuess.includes(ply + 1);
  const note = game.notes[ply];

  const onMove = (m: BoardMove) => {
    if (!next) return;
    const probe = new Chess(c.fen());
    const played = probe.move(m);
    const ok = played.san === next.san;
    onGuess(ok);
    setGuessState({ ply: ply + 1, ok, text: ok ? `Hebat! ${next.san} – sama seperti ${game.player}.` : `Anda bermain ${played.san}. ${game.player} bermain ${next.san}.` });
    setSkipGuess((s) => [...s, ply + 1]);
    setPly((p) => p + 1);
  };

  return (
    <div className="space-y-4">
      <Button onClick={onBack}>← Semua permainan</Button>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))] lg:max-w-none">
          <Chessboard
            fen={c.fen()}
            orientation={game.result === '0-1' ? 'b' : 'w'}
            legalMoves={isGuess ? legalOf(c) : undefined}
            onMove={isGuess ? onMove : undefined}
            lastMove={last ? { from: last.from, to: last.to } : undefined}
            checkSquare={c.inCheck() ? c.findPiece({ type: 'k', color: c.turn() })[0] : undefined}
            label={`${game.white} lawan ${game.black}`}
          />
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={() => setPly(0)} disabled={ply === 0} aria-label="Mula"><Icon name="first" /></Button>
            <Button className="flex-1" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} aria-label="Sebelum"><Icon name="undo" /></Button>
            <Button variant="secondary" className="flex-[2]" onClick={() => setPly((p) => Math.min(moves.length, p + 1))} disabled={ply >= moves.length || isGuess} data-testid="gm-next">
              Seterusnya <Icon name="arrow" className="h-4 w-4" />
            </Button>
            <Button className="flex-1" onClick={() => setPly(moves.length)} disabled={ply >= moves.length} aria-label="Akhir"><Icon name="last" /></Button>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{game.event}, {game.year}</p>
            <h2 className="font-display text-xl text-gold-200">{game.white} – {game.black} <span className="font-mono text-base text-charcoal-300">{game.result}</span></h2>
            <p className="mt-1 text-sm text-charcoal-200">{game.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1">{game.themes.map((t) => <Badge key={t}>{t}</Badge>)}</div>
          </Card>
          <Card>
            <p className="text-xs text-charcoal-400">Langkah {Math.ceil(ply / 2)} / {game.moves}{last ? ` · ${Math.ceil(ply / 2)}${ply % 2 === 1 ? '.' : '…'} ${last.san}` : ''}</p>
            {isGuess ? (
              <p className="mt-2 rounded-lg border border-gold-500/40 bg-gold-500/10 p-2 text-sm text-gold-100" data-testid="gm-guess">
                🤔 Teka langkah {c.turn() === 'w' ? 'Putih' : 'Hitam'} seterusnya! Gerakkan buah di papan.{' '}
                <button type="button" className="underline" onClick={() => setSkipGuess((s) => [...s, ply + 1])}>Langkau</button>
              </p>
            ) : null}
            {guessState && guessState.ply === ply && (
              <p className={`mt-2 rounded-lg p-2 text-sm ${guessState.ok ? 'bg-emerald-500/10 text-emerald-200' : 'bg-charcoal-800 text-charcoal-100'}`} role="status">{guessState.text}</p>
            )}
            {note && <p className="mt-2 text-sm text-charcoal-100" data-testid="gm-note">{note}</p>}
            {!note && !isGuess && ply > 0 && <p className="mt-2 text-sm text-charcoal-400">Tekan “Seterusnya”. Cuba teka langkah sebelum menekan.</p>}
          </Card>
          <Card>
            <p className="text-xs text-charcoal-400">
              Sumber: <a className="text-emerald-300 underline" href={game.source.url} target="_blank" rel="noreferrer">{game.source.name}</a>. Skor permainan disemak secara automatik: setiap langkah sah, bilangan langkah dan keputusan sepadan dengan rekod, dan langkah utama di nombor langkah yang betul.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MasterclassView() {
  const [id, setId] = useState<string | null>(null);
  const [stats, setStats] = usePersistentState('masterclass:guesses', { right: 0, total: 0 });
  const game = GM_GAMES.find((g) => g.id === id);
  if (game) return <GameStudy key={game.id} game={game} onBack={() => setId(null)} onGuess={(ok) => setStats((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))} />;

  return (
    <div className="space-y-5">
      {stats.total > 0 && <p className="text-sm text-charcoal-300">Tekaan betul: <strong className="text-gold-200">{stats.right}</strong> / {stats.total}</p>}
      <ul className="grid gap-3 md:grid-cols-2" data-testid="gm-list">
        {GM_GAMES.map((g) => (
          <li key={g.id}>
            <button type="button" onClick={() => setId(g.id)} className="flex h-full w-full flex-col items-start rounded-2xl border border-charcoal-700 bg-charcoal-900/70 p-4 text-left hover:border-gold-500/50" data-testid={`gm-${g.id}`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{g.player} · {g.year}</span>
              <span className="font-display text-lg text-gold-200">{g.title}</span>
              <span className="mt-1 text-sm text-charcoal-300">{g.white} – {g.black}, {g.result}</span>
              <span className="mt-2 flex flex-wrap gap-1">{g.themes.slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}</span>
            </button>
          </li>
        ))}
      </ul>
      <Card>
        <CardTitle sub="Dalam brief, tetapi skor permainan belum dimasukkan">Akan ditambah</CardTitle>
        <ul className="space-y-3 text-sm">
          {PENDING_PLAYERS.map((p) => (
            <li key={p.player}>
              <p className="font-semibold text-white">{p.player}</p>
              <p className="text-charcoal-200">{p.profile}</p>
              <p className="text-xs text-gold-300">{p.note}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
