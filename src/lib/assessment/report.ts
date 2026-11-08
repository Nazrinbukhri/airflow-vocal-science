import type { PuzzleResults } from '@/lib/tactics/puzzles';
import { PUZZLES, themeStats } from '@/lib/tactics/puzzles';
import { THEME_INFO } from '@/lib/tactics/themes';
import { LESSONS, MODULE_INFO, type LessonModule } from '@/lib/lessons/data';
import { OPENINGS } from '@/lib/openings/data';
import { FORMATIONS } from '@/lib/formations/data';
import { TOTAL_HOURS } from '@/lib/curriculum/programme';
import { CATEGORY_MS, type AssessmentResult, type Category } from './assessments';

export type ReportInput = {
  completedSessions: number;
  minutesStudied: number;
  lessons: Record<string, { score: number; total: number; completed: boolean }>;
  puzzles: PuzzleResults;
  openingsDone: string[];
  formationsDone: string[];
  games: { result: 'win' | 'loss' | 'draw'; level: number }[];
  reviews: { white: { accuracy: number }; black: { accuracy: number } }[];
  assessments: Partial<Record<'day1' | 'final', AssessmentResult>>;
};

export type Skill = { name: string; percent: number; detail: string };
export type PerformanceReport = {
  overall: number;
  level: string;
  skills: Skill[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lines: string[];
};

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Turn everything the learner has done into a readable report. Pure function (tested). */
export function buildPerformanceReport(i: ReportInput): PerformanceReport {
  const skills: Skill[] = [];

  for (const m of ['fundamentals', 'attack', 'endgame'] as LessonModule[]) {
    const list = LESSONS.filter((l) => l.module === m);
    const done = list.filter((l) => i.lessons[l.id]?.completed);
    const right = done.reduce((n, l) => n + i.lessons[l.id]!.score, 0);
    const total = done.reduce((n, l) => n + i.lessons[l.id]!.total, 0);
    skills.push({ name: `Pelajaran: ${MODULE_INFO[m].name}`, percent: Math.round(pct(done.length, list.length) * 0.5 + pct(right, total) * 0.5), detail: `${done.length}/${list.length} pelajaran, ujian ${right}/${total}` });
  }

  const ts = themeStats(i.puzzles);
  for (const t of ts) {
    skills.push({ name: `Taktik: ${THEME_INFO[t.theme].ms}`, percent: pct(t.solved, t.total), detail: `${t.solved}/${t.total} diselesaikan, ${t.firstTry} pada cubaan pertama` });
  }

  const lines = OPENINGS.flatMap((o) => o.lines.filter((l) => l.kind !== 'trap'));
  skills.push({ name: 'Pembukaan', percent: pct(i.openingsDone.filter((id) => lines.some((l) => l.id === id)).length, lines.length), detail: `${i.openingsDone.length}/${lines.length} garis dilatih` });
  skills.push({ name: 'Formasi', percent: pct(i.formationsDone.length, FORMATIONS.length), detail: `${i.formationsDone.length}/${FORMATIONS.length} latihan formasi` });

  const cat: Partial<Record<Category, { right: number; total: number }>> = {};
  for (const a of Object.values(i.assessments).filter(Boolean)) {
    for (const [k, v] of Object.entries(a!.byCategory) as [Category, { right: number; total: number }][]) {
      const c = (cat[k] ??= { right: 0, total: 0 });
      c.right += v.right;
      c.total += v.total;
    }
  }
  for (const [k, v] of Object.entries(cat) as [Category, { right: number; total: number }][]) {
    skills.push({ name: `Penilaian: ${CATEGORY_MS[k]}`, percent: pct(v.right, v.total), detail: `${v.right}/${v.total} betul` });
  }

  const solved = Object.values(i.puzzles).filter((r) => r.solved).length;
  const wins = i.games.filter((g) => g.result === 'win').length;
  const draws = i.games.filter((g) => g.result === 'draw').length;
  const losses = i.games.filter((g) => g.result === 'loss').length;
  const programme = pct(i.completedSessions, TOTAL_HOURS);
  const assessmentPct = (['day1', 'final'] as const).map((k) => i.assessments[k]).filter(Boolean).map((a) => pct(a!.score, a!.total));
  const assess = assessmentPct.length ? Math.round(assessmentPct.reduce((a, b) => a + b, 0) / assessmentPct.length) : 0;
  const lessonPct = Math.round(skills.filter((s) => s.name.startsWith('Pelajaran')).reduce((n, s) => n + s.percent, 0) / 3);
  const overall = Math.round(programme * 0.2 + lessonPct * 0.25 + pct(solved, PUZZLES.length) * 0.25 + assess * 0.3);

  const level =
    overall >= 80 ? 'Penyerang yang yakin – sedia untuk permainan kelab dan pertandingan pertama.' :
    overall >= 55 ? 'Pemain yang berkembang – asas kukuh, taktik semakin tajam.' :
    overall >= 30 ? 'Pemula yang maju – peraturan difahami, teruskan latihan taktik.' :
    'Permulaan perjalanan – teruskan program sesi demi sesi.';

  const measured = skills.filter((s) => !s.detail.startsWith('0/'));
  const sorted = [...measured].sort((a, b) => b.percent - a.percent);
  const strengths = sorted.filter((s) => s.percent >= 70).slice(0, 4).map((s) => `${s.name} (${s.percent}%)`);
  const weaknesses = [...sorted].reverse().filter((s) => s.percent < 60).slice(0, 4).map((s) => `${s.name} (${s.percent}%)`);

  const recommendations: string[] = [];
  const weakTactic = ts.filter((t) => t.total > 0).sort((a, b) => a.solved / a.total - b.solved / b.total)[0];
  if (weakTactic && weakTactic.solved < weakTactic.total) recommendations.push(`Ulang teka-teki tema "${THEME_INFO[weakTactic.theme].ms}" – sasarkan 80% pada cubaan pertama.`);
  if (!i.assessments.day1) recommendations.push('Ambil Ujian Hari 1 untuk mengukur asas anda.');
  if (!i.assessments.final && i.completedSessions >= 40) recommendations.push('Anda hampir tamat – ambil Cabaran Akhir.');
  if (i.games.length < 3) recommendations.push('Main sekurang-kurangnya 3 permainan penuh lawan Stockfish (tahap 1–3) dan semak setiap permainan.');
  else if (wins === 0) recommendations.push('Turunkan tahap Stockfish dan gunakan jurulatih sehingga anda menang – kemudian naikkan satu tahap.');
  else recommendations.push('Naikkan tahap Stockfish satu langkah dan teruskan menyemak setiap permainan.');
  if (i.reviews.length === 0) recommendations.push('Gunakan "Semakan penuh permainan" untuk mencari blunder dan taktik terlepas.');
  recommendations.push('Teruskan kebiasaan: sebelum setiap langkah, semak Check–Tangkapan–Ancaman dan kira dua jawapan lawan.');

  const lastReview = i.reviews[0];
  return {
    overall,
    level,
    skills,
    strengths: strengths.length ? strengths : ['Belum cukup data – teruskan latihan untuk melihat kekuatan anda.'],
    weaknesses: weaknesses.length ? weaknesses : ['Tiada kelemahan ketara dalam data setakat ini.'],
    recommendations,
    lines: [
      `Program: ${i.completedSessions}/${TOTAL_HOURS} sesi (${programme}%), ${(i.minutesStudied / 60).toFixed(1)} jam belajar.`,
      `Teka-teki: ${solved}/${PUZZLES.length} diselesaikan.`,
      `Permainan lawan Stockfish: ${wins} menang, ${draws} seri, ${losses} kalah.`,
      lastReview ? `Semakan terakhir: ketepatan Putih ${lastReview.white.accuracy}%, Hitam ${lastReview.black.accuracy}%.` : 'Belum ada semakan permainan.',
      ...(['day1', 'final'] as const).filter((k) => i.assessments[k]).map((k) => `${k === 'day1' ? 'Ujian Hari 1' : 'Cabaran akhir'}: ${i.assessments[k]!.score}/${i.assessments[k]!.total}.`),
    ],
  };
}
