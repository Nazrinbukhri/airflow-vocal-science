import { Chess } from 'chess.js';
import type { BookMove } from '@/lib/coach/report';
import { OPENINGS } from './data';

/** Position key without move counters, so transpositions match. */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

let book: Map<string, BookMove[]> | null = null;

function build(): Map<string, BookMove[]> {
  const map = new Map<string, BookMove[]>();
  for (const opening of OPENINGS) {
    // Trap lines contain deliberate mistakes, so they are not book moves.
    for (const line of opening.lines.filter((l) => l.kind !== 'trap')) {
      const c = new Chess();
      for (const step of line.steps) {
        const key = positionKey(c.fen());
        const list = map.get(key) ?? [];
        if (!list.some((m) => m.san === step.san)) list.push({ san: step.san, name: `${opening.name} – ${line.name}`, idea: step.why });
        map.set(key, list);
        c.move(step.san);
      }
    }
  }
  return map;
}

/** Theory moves from the app's own repertoire for this position (no statistics). */
export function bookMovesFor(fen: string): BookMove[] {
  book ??= build();
  return book.get(positionKey(fen)) ?? [];
}
