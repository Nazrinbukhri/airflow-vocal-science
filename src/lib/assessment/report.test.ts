import { describe, expect, it } from 'vitest';
import { buildAssessment } from './assessments';
import { checkAnswer } from '@/lib/lessons/exercise';
import { buildPerformanceReport, type ReportInput } from './report';
import { PUZZLES } from '@/lib/tactics/puzzles';

const empty: ReportInput = { completedSessions: 0, minutesStudied: 0, lessons: {}, puzzles: {}, openingsDone: [], formationsDone: [], games: [], reviews: [], assessments: {} };

describe('assessments', () => {
  for (const id of ['day1', 'final'] as const) {
    it(`${id} has solvable items with the intended answers`, () => {
      const items = buildAssessment(id);
      expect(items.length).toBe(id === 'day1' ? 12 : 15);
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
      for (const it of items) {
        const ex = it.exercise;
        if (ex.kind === 'move') expect(checkAnswer(ex, ex.accept[0]!)).toBe(true);
        if (ex.kind === 'choice') expect(checkAnswer(ex, ex.answer)).toBe(true);
        if (ex.kind === 'square') expect(checkAnswer(ex, ex.answers[0]!)).toBe(true);
      }
    });
  }
});

describe('performance report', () => {
  it('starts low with useful recommendations (also when assessments are explicitly missing)', () => {
    expect(() => buildPerformanceReport({ ...empty, assessments: { day1: undefined, final: undefined } })).not.toThrow();
    const r = buildPerformanceReport(empty);
    expect(r.overall).toBe(0);
    expect(r.recommendations.join(' ')).toContain('Ujian Hari 1');
    expect(r.lines[0]).toContain('0/48');
  });

  it('rises with activity and names strengths and weaknesses', () => {
    const puzzles = Object.fromEntries(PUZZLES.filter((p) => p.theme === 'fork').map((p) => [p.id, { solved: true, firstTry: true, attempts: 0, hints: 0, at: 1 }]));
    const r = buildPerformanceReport({
      ...empty,
      completedSessions: 48,
      minutesStudied: 48 * 45,
      puzzles,
      games: [{ result: 'win', level: 2 }, { result: 'loss', level: 3 }, { result: 'draw', level: 3 }],
      reviews: [{ white: { accuracy: 81 }, black: { accuracy: 64 } }],
      assessments: {
        day1: { at: 1, score: 11, total: 12, byCategory: { taktik: { right: 3, total: 3 }, notasi: { right: 1, total: 2 } } },
        final: { at: 2, score: 9, total: 15, byCategory: { taktik: { right: 3, total: 5 }, endgame: { right: 0, total: 2 } } },
      },
    });
    expect(r.overall).toBeGreaterThan(30);
    expect(r.strengths.join(' ')).toContain('Fork');
    expect(r.weaknesses.join(' ')).toContain('Endgame');
    expect(r.lines.join(' ')).toContain('1 menang, 1 seri, 1 kalah');
  });
});
