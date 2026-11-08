'use client';

import { Chess, type Move, type Square } from 'chess.js';
import { useEffect, useState } from 'react';
import { Chessboard, type BoardMove, type BoardTarget, type HighlightTone } from '@/components/board/Chessboard';
import { Icon } from '@/components/ui/Icon';
import { Badge, Button, Card, CardTitle } from '@/components/ui/primitives';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { OPENINGS, type Line, type Opening } from '@/lib/openings/data';

type Mode = 'learn' | 'practice';

function positionAt(line: Line, ply: number): { chess: Chess; last?: Move } {
  const chess = new Chess();
  let last: Move | undefined;
  for (const st of line.steps.slice(0, ply)) last = chess.move(st.san);
  return { chess, last };
}

function legalOf(chess: Chess) {
  const map = new Map<Square, BoardTarget[]>();
  for (const m of chess.moves({ verbose: true })) {
    const l = map.get(m.from) ?? [];
    l.push({ to: m.to, promotion: m.promotion });
    map.set(m.from, l);
  }
  return map;
}

const KIND_LABEL = { main: 'Garis utama', variation: 'Variasi', trap: 'Perangkap' } as const;

export function OpeningTrainer() {
  const [openingId, setOpeningId] = usePersistentState<Opening['id']>('openings:current', 'italian');
  const [done, setDone] = usePersistentState<string[]>('openings:done', []);
  const opening = OPENINGS.find((o) => o.id === openingId) ?? OPENINGS[0]!;
  const mainId = opening.lines.find((l) => l.kind === 'main')!.id;
  const [lineId, setLineId] = useState<string>(mainId);
  const line = opening.lines.find((l) => l.id === lineId) ?? opening.lines[0]!;
  const [mode, setMode] = useState<Mode>('learn');
  const [ply, setPly] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [wrong, setWrong] = useState(0);

  const mainDone = done.includes(mainId);
  const locked = (l: Line) => l.kind !== 'main' && !mainDone;
  const { chess, last } = positionAt(line, ply);
  const turn = chess.turn();
  const finished = ply >= line.steps.length;
  const practiceSide = opening.side;
  const learnerTurn = mode === 'practice' && !finished && chess.turn() === practiceSide;

  const choose = (o: Opening['id']) => {
    setOpeningId(o);
    const ml = OPENINGS.find((x) => x.id === o)!.lines.find((l) => l.kind === 'main')!;
    setLineId(ml.id);
    setMode('learn');
    setPly(0);
    setFeedback(null);
  };
  const chooseLine = (l: Line) => {
    if (locked(l)) return;
    setLineId(l.id);
    setPly(0);
    setWrong(0);
    setFeedback(null);
    if (l.kind === 'trap') setMode('learn');
  };
  const startPractice = () => {
    setMode('practice');
    setPly(0);
    setWrong(0);
    setFeedback({ tone: 'info', text: `Anda bermain ${opening.side === 'w' ? 'Putih' : 'Hitam'}. Mainkan langkah buku.` });
  };

  // Practice: the app plays the opponent's book moves.
  useEffect(() => {
    if (mode !== 'practice' || finished || turn === practiceSide) return;
    const t = setTimeout(() => setPly((p) => p + 1), 550);
    return () => clearTimeout(t);
  }, [mode, finished, turn, practiceSide, ply]);

  // Practice complete → remember it.
  useEffect(() => {
    if (mode === 'practice' && finished && !done.includes(line.id)) setDone((d) => [...d, line.id]);
  }, [mode, finished, done, line.id, setDone]);

  const onMove = (m: BoardMove) => {
    const expected = line.steps[ply]!;
    const probe = new Chess(chess.fen());
    let played: Move;
    try {
      played = probe.move(m);
    } catch {
      return;
    }
    if (played.san === expected.san) {
      setWrong(0);
      setFeedback({ tone: 'ok', text: `Betul! ${played.san} – ${expected.why}` });
      setPly((p) => p + 1);
    } else {
      const n = wrong + 1;
      setWrong(n);
      setFeedback({
        tone: 'error',
        text:
          n >= 3
            ? `Jawapannya ${expected.san}: ${expected.why}`
            : `${played.san} ialah langkah sah, tetapi dalam pelajaran ini kita belajar langkah lain. ${n === 2 ? 'Petunjuk: buah yang bertanda emas.' : 'Fikir tentang tujuan pembukaan ini dan cuba lagi.'}`,
      });
    }
  };

  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (learnerTurn && wrong >= 2) {
    const probe = new Chess(chess.fen());
    const m = probe.move(line.steps[ply]!.san);
    highlights[m.from] = 'gold';
    if (wrong >= 3) highlights[m.to] = 'gold';
  }

  const current = ply > 0 ? line.steps[ply - 1] : undefined;
  const moveNo = (i: number) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? '.' : '...'}`;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3" role="tablist" aria-label="Pilih pembukaan">
        {OPENINGS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={o.id === opening.id}
            onClick={() => choose(o.id)}
            className={`rounded-2xl border p-4 text-left ${o.id === opening.id ? 'border-gold-500/70 bg-emerald-900/30' : 'border-charcoal-700 bg-charcoal-900/70 hover:border-charcoal-500'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{o.sideLabel}</p>
            <p className="font-display text-xl text-gold-200">{o.name}</p>
            <p className="mt-1 text-sm text-charcoal-300">{o.tagline}</p>
            <p className="mt-2 text-xs text-charcoal-400">
              {o.lines.filter((l) => done.includes(l.id)).length}/{o.lines.filter((l) => l.kind !== 'trap').length} garis dilatih
            </p>
          </button>
        ))}
      </div>

      <Card>
        <CardTitle sub="Faham tujuan dahulu – langkah datang kemudian.">Idea utama {opening.name}</CardTitle>
        <ul className="grid gap-1 text-sm text-charcoal-100 md:grid-cols-2">
          {opening.ideas.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))] lg:max-w-none">
          <Chessboard
            fen={chess.fen()}
            orientation={opening.side}
            legalMoves={learnerTurn ? legalOf(chess) : undefined}
            onMove={learnerTurn ? onMove : undefined}
            lastMove={last ? { from: last.from, to: last.to } : undefined}
            checkSquare={chess.inCheck() ? chess.findPiece({ type: 'k', color: chess.turn() })[0] : undefined}
            highlights={highlights}
            label={`Papan pembukaan ${opening.name}`}
          />
          {mode === 'learn' && (
            <div className="mt-3 flex gap-2" role="toolbar" aria-label="Kawalan demonstrasi">
              <Button className="flex-1" onClick={() => setPly(0)} disabled={ply === 0} aria-label="Mula">
                <Icon name="first" />
              </Button>
              <Button className="flex-1" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} aria-label="Sebelum">
                <Icon name="undo" />
              </Button>
              <Button variant="secondary" className="flex-[2]" onClick={() => setPly((p) => Math.min(line.steps.length, p + 1))} disabled={finished} data-testid="opening-next">
                Langkah seterusnya <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={line.kind === 'trap' ? 'red' : line.kind === 'main' ? 'emerald' : 'gold'}>{KIND_LABEL[line.kind]}</Badge>
              {done.includes(line.id) && <Badge tone="emerald">✓ Dilatih</Badge>}
            </div>
            <h2 className="font-display text-lg text-gold-200">{line.name}</h2>
            <p className="text-sm text-charcoal-300">{line.summary}</p>
            {line.kind !== 'trap' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant={mode === 'learn' ? 'secondary' : 'ghost'} onClick={() => { setMode('learn'); setPly(0); setFeedback(null); }}>
                  Tunjuk (Show)
                </Button>
                <Button variant={mode === 'practice' ? 'secondary' : 'ghost'} onClick={startPractice} data-testid="opening-practice">
                  Latih (Practice)
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              {mode === 'learn' ? 'Kenapa langkah ini?' : 'Latihan'}
            </p>
            {mode === 'learn' ? (
              current ? (
                <p className="mt-1 text-sm text-charcoal-100" data-testid="opening-explain">
                  <span className="font-mono font-semibold text-gold-200">
                    {moveNo(ply - 1)} {current.san}
                  </span>{' '}
                  – {current.why}
                </p>
              ) : (
                <p className="mt-1 text-sm text-charcoal-300">Tekan “Langkah seterusnya”. Sebelum menekan, teka dahulu langkah apa yang masuk akal!</p>
              )
            ) : feedback ? (
              <p
                className={`mt-1 rounded-lg p-2 text-sm ${feedback.tone === 'ok' ? 'bg-emerald-500/10 text-emerald-200' : feedback.tone === 'error' ? 'bg-red-500/10 text-red-200' : 'text-charcoal-200'}`}
                data-testid="opening-feedback"
              >
                {feedback.text}
              </p>
            ) : null}
            {finished && (
              <p className="mt-2 rounded-lg border border-gold-500/40 bg-gold-500/10 p-2 text-sm text-gold-100" data-testid="opening-finished">
                {line.kind === 'trap' && line.lesson
                  ? `Pengajaran: ${line.lesson}`
                  : mode === 'practice'
                    ? 'Tahniah! Garis ini selesai dilatih. Variasi kini terbuka.'
                    : 'Akhir garis. Kini cuba mod Latih untuk bermain sendiri.'}
              </p>
            )}
            {mode === 'practice' && !finished && (
              <p className="mt-2 text-xs text-charcoal-400">
                {learnerTurn ? 'Giliran anda.' : 'Lawan sedang bergerak…'} Langkah {Math.min(ply + 1, line.steps.length)}/{line.steps.length}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle sub={mainDone ? 'Pilih garis untuk dipelajari.' : 'Variasi dan perangkap terbuka selepas anda melatih garis utama.'}>Garis dan perangkap</CardTitle>
            <ul className="space-y-1.5">
              {opening.lines.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => chooseLine(l)}
                    disabled={locked(l)}
                    data-testid={`line-${l.id}`}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm disabled:opacity-45 ${l.id === line.id ? 'bg-emerald-600/20 text-gold-100 ring-1 ring-emerald-500/40' : 'bg-charcoal-800/60 text-charcoal-100 hover:bg-charcoal-700'}`}
                  >
                    <span className="flex-1">{l.name}</span>
                    {locked(l) ? <span aria-label="Terkunci">🔒</span> : done.includes(l.id) ? <span className="text-emerald-300">✓</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Rancangan strategik</CardTitle>
            <ul className="space-y-2 text-sm">
              {opening.plans.map((p) => (
                <li key={p.title}>
                  <p className="font-semibold text-white">{p.title}</p>
                  <p className="text-charcoal-300">{p.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
