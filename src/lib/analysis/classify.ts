import { scoreValue, type Score } from '@/lib/engine/uci';

export type MoveClass = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/** Centipawn-loss thresholds (upper bounds). Configurable from the analysis page. */
export type Thresholds = { best: number; good: number; inaccuracy: number; mistake: number };
export const DEFAULT_THRESHOLDS: Thresholds = { best: 20, good: 50, inaccuracy: 100, mistake: 250 };

export const CLASS_LABEL: Record<MoveClass, { ms: string; en: string; tone: 'emerald' | 'gold' | 'neutral' | 'red' }> = {
  best: { ms: 'Terbaik', en: 'Best', tone: 'emerald' },
  good: { ms: 'Baik', en: 'Good', tone: 'emerald' },
  inaccuracy: { ms: 'Kurang tepat', en: 'Inaccuracy', tone: 'gold' },
  mistake: { ms: 'Kesilapan', en: 'Mistake', tone: 'red' },
  blunder: { ms: 'Blunder', en: 'Blunder', tone: 'red' },
};

const CAP = 1000;

/** Convert a score to a capped centipawn number (mate = ±1000) so one blunder does not dominate averages. */
export function cappedCp(s: Score): number {
  return Math.max(-CAP, Math.min(CAP, scoreValue(s)));
}

/**
 * Centipawn loss of a move: best score before the move (mover's view) minus the
 * score after it (still the mover's view). `after` is the engine score of the new
 * position, which is from the OPPONENT's view, so it is negated.
 */
export function centipawnLoss(bestBefore: Score, afterFromOpponent: Score): number {
  const before = cappedCp(bestBefore);
  const after = -cappedCp(afterFromOpponent);
  return Math.max(0, before - after);
}

export function classify(loss: number, t: Thresholds = DEFAULT_THRESHOLDS): MoveClass {
  if (loss <= t.best) return 'best';
  if (loss <= t.good) return 'good';
  if (loss <= t.inaccuracy) return 'inaccuracy';
  if (loss <= t.mistake) return 'mistake';
  return 'blunder';
}

/** Accuracy-style percentage from average centipawn loss (simple, documented curve – not a rating). */
export function accuracyFromAcpl(acpl: number): number {
  return Math.round(Math.max(0, Math.min(100, 103.17 * Math.exp(-0.0049 * acpl) - 3.17)));
}
