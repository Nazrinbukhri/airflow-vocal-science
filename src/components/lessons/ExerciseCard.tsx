'use client';

import { Chess, type Square } from 'chess.js';
import { useState } from 'react';
import { Chessboard, type BoardTarget, type HighlightTone } from '@/components/board/Chessboard';
import { Button } from '@/components/ui/primitives';
import { checkAnswer, type Exercise } from '@/lib/lessons/exercise';

function legalOf(fen: string) {
  const map = new Map<Square, BoardTarget[]>();
  for (const m of new Chess(fen).moves({ verbose: true })) {
    const l = map.get(m.from) ?? [];
    l.push({ to: m.to, promotion: m.promotion });
    map.set(m.from, l);
  }
  return map;
}

/** One exercise. Calls onResult(true/false) on the FIRST answer only; the learner can keep trying afterwards. */
export function ExerciseCard({ exercise, onResult, testId }: { exercise: Exercise; onResult?: (correct: boolean) => void; testId?: string }) {
  const [state, setState] = useState<{ correct: boolean; text: string } | null>(null);
  const [answered, setAnswered] = useState(false);
  const [shown, setShown] = useState(false);
  const [fen, setFen] = useState('fen' in exercise ? exercise.fen : undefined);
  const turn = fen ? new Chess(fen).turn() : 'w';

  const submit = (answer: string | number, label: string, nextFen?: string) => {
    const ok = checkAnswer(exercise, answer);
    if (!answered) {
      setAnswered(true);
      onResult?.(ok);
    }
    setState({ correct: ok, text: ok ? `Betul! ${exercise.explain}` : `${label} belum tepat. Cuba lagi.` });
    if (ok && nextFen) setFen(nextFen);
  };

  const highlights: Partial<Record<Square, HighlightTone>> = {};
  if (shown && exercise.kind === 'square') for (const s of exercise.answers) highlights[s] = 'gold';

  return (
    <div className="space-y-3" data-testid={testId}>
      <p className="font-medium text-white">{exercise.prompt}</p>
      {fen && (
        <div className="mx-auto w-full max-w-sm">
          {exercise.kind === 'square' ? (
            <Chessboard fen={fen} orientation={turn} highlights={highlights} onSquareTap={(sq) => submit(sq, sq)} label="Papan latihan" />
          ) : (
            <Chessboard
              fen={fen}
              orientation={turn}
              legalMoves={state?.correct ? undefined : legalOf(fen)}
              onMove={(m) => {
                const c = new Chess(fen);
                const played = c.move(m);
                submit(played.san, played.san, c.fen());
              }}
              label="Papan latihan"
            />
          )}
        </div>
      )}
      {exercise.kind === 'choice' && (
        <div className="grid gap-2">
          {exercise.options.map((o, i) => (
            <button
              key={o}
              type="button"
              onClick={() => submit(i, `"${o}"`)}
              className="min-h-11 rounded-lg border border-charcoal-600 bg-charcoal-800/60 px-3 py-2 text-left text-sm text-charcoal-100 hover:border-gold-500/50"
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {state && (
        <p
          role="status"
          data-testid="exercise-feedback"
          data-correct={state.correct}
          className={`rounded-lg p-2 text-sm ${state.correct ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}
        >
          {state.text}
        </p>
      )}
      {!state?.correct && (
        <Button
          onClick={() => {
            setShown(true);
            if (!answered) {
              setAnswered(true);
              onResult?.(false);
            }
            setState({
              correct: false,
              text: `Jawapan: ${
                exercise.kind === 'square'
                  ? exercise.answers.join(', ')
                  : exercise.kind === 'move'
                    ? exercise.accept.join(' / ')
                    : exercise.kind === 'choice'
                      ? exercise.options[exercise.answer]
                      : 'cari langkah yang memberi checkmate'
              }. ${exercise.explain}`,
            });
          }}
        >
          Tunjuk jawapan
        </Button>
      )}
    </div>
  );
}
