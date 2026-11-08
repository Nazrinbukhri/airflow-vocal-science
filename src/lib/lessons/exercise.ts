import { Chess, type Square } from 'chess.js';

export type Exercise =
  | { kind: 'square'; fen: string; prompt: string; answers: Square[]; explain: string }
  | { kind: 'move'; fen: string; prompt: string; accept: string[]; explain: string; engineTolerance?: number }
  | { kind: 'mate'; fen: string; prompt: string; explain: string }
  | { kind: 'choice'; prompt: string; options: string[]; answer: number; explain: string; fen?: string };

/** All mate-in-one moves (SAN) in a position. */
export function mateInOneMoves(fen: string): string[] {
  const c = new Chess(fen);
  return c.moves({ verbose: true }).filter((m) => {
    const x = new Chess(fen);
    x.move(m.san);
    return x.isCheckmate();
  }).map((m) => m.san);
}

/** Moves (SAN) whose piece type and destination satisfy a predicate – for rule-based exercises. */
export function movesWhere(fen: string, pred: (m: { piece: string; to: Square; san: string; from: Square }) => boolean): string[] {
  return new Chess(fen).moves({ verbose: true }).filter((m) => pred(m)).map((m) => m.san);
}

/** Is the learner's answer correct? */
export function checkAnswer(ex: Exercise, answer: string | number): boolean {
  switch (ex.kind) {
    case 'square':
      return ex.answers.includes(answer as Square);
    case 'move':
      return ex.accept.includes(String(answer));
    case 'mate':
      return mateInOneMoves(ex.fen).includes(String(answer));
    case 'choice':
      return answer === ex.answer;
  }
}
