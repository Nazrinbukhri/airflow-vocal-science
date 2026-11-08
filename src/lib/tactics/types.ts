import type { MatePattern, Theme } from './themes';

export type Puzzle = {
  id: string;
  level: 1 | 2 | 3 | 4;
  theme: Theme;
  pattern?: MatePattern;
  fen: string;
  goal: 'mate' | 'material';
  mateIn?: number;
  /** Full solution in UCI, alternating learner / opponent, starting with the learner. */
  solution: string[];
  solutionSan: string[];
  /** For each learner move (by index in `solution`), every UCI move that is also accepted. */
  accept: Record<number, string[]>;
  /** Engine evaluation after the first move, from the solver's side ("+5.20", "#2"). */
  evalAfter: string;
  /** Tempting moves that do not work, with the engine's answer. */
  wrong: { san: string; uci: string; eval: string; refutation?: string; reason: string }[];
  explanation: string[];
  defence: string;
  followUp: string;
  hints: { threat: string; attacked: string; squares: string[] };
  /** How it was verified. */
  verified: { engine: string; depth: number };
};
