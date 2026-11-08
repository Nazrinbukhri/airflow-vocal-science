import { Chess } from 'chess.js';
import { parseUci } from '@/lib/coach/facts';
import { FORMATIONS } from '@/lib/formations/data';
import { LESSONS } from '@/lib/lessons/data';
import type { Exercise } from '@/lib/lessons/exercise';
import { PUZZLES } from '@/lib/tactics/puzzles';
import type { Theme } from '@/lib/tactics/themes';

export type Category = 'peraturan' | 'notasi' | 'checkmate' | 'taktik' | 'pembukaan' | 'strategi' | 'pertahanan' | 'endgame';
export type AssessmentItem = { id: string; category: Category; exercise: Exercise };
export type AssessmentId = 'day1' | 'final';
export type AssessmentResult = { at: number; score: number; total: number; byCategory: Partial<Record<Category, { right: number; total: number }>> };

const lessonEx = (lessonId: string, which: 'practice' | 'test', i: number): Exercise => {
  const l = LESSONS.find((x) => x.id === lessonId);
  const ex = l?.[which][i];
  if (!ex) throw new Error(`Missing exercise ${lessonId} ${which} ${i}`);
  return ex;
};

/** First move of a verified puzzle as a move exercise. */
function puzzleEx(theme: Theme, level: number, skip = 0): Exercise {
  // Prefer the theme at that level; fall back to the theme at any level, then to any puzzle of that level.
  const p =
    PUZZLES.filter((x) => x.theme === theme && x.level === level)[skip] ??
    PUZZLES.filter((x) => x.theme === theme)[skip] ??
    PUZZLES.filter((x) => x.level === level)[skip] ??
    PUZZLES[skip];
  if (!p) return { kind: 'choice', prompt: 'Apakah maksud fork?', options: ['Satu buah menyerang dua buah lawan serentak', 'Menukar Menteri'], answer: 0, explain: 'Fork = serangan berganda oleh satu buah.' };
  const accept = (p.accept[0] ?? [p.solution[0]!]).map((u) => new Chess(p.fen).move(parseUci(u)).san);
  const side = new Chess(p.fen).turn() === 'w' ? 'Putih' : 'Hitam';
  return {
    kind: 'move',
    fen: p.fen,
    prompt: `${side} bergerak. ${p.goal === 'mate' ? `Cari langkah pertama mat dalam ${p.mateIn}.` : 'Cari langkah yang memenangi bahan.'}`,
    accept,
    explain: p.explanation[0] ?? '',
  };
}

const formationEx = (id: string) => FORMATIONS.find((f) => f.id === id)!.exercise;

export function buildAssessment(id: AssessmentId): AssessmentItem[] {
  if (id === 'day1') {
    return [
      { id: 'd1-1', category: 'peraturan', exercise: lessonEx('f06-movement', 'test', 1) },
      { id: 'd1-2', category: 'peraturan', exercise: lessonEx('f11-castling', 'test', 0) },
      { id: 'd1-3', category: 'peraturan', exercise: lessonEx('f12-en-passant', 'practice', 0) },
      { id: 'd1-4', category: 'notasi', exercise: lessonEx('f15-notation', 'test', 0) },
      { id: 'd1-5', category: 'notasi', exercise: lessonEx('f15-notation', 'test', 2) },
      { id: 'd1-6', category: 'checkmate', exercise: lessonEx('f09-checkmate', 'test', 0) },
      { id: 'd1-7', category: 'checkmate', exercise: lessonEx('f10-stalemate', 'test', 0) },
      { id: 'd1-8', category: 'taktik', exercise: puzzleEx('hanging', 1) },
      { id: 'd1-9', category: 'taktik', exercise: puzzleEx('double-attack', 1) },
      { id: 'd1-10', category: 'taktik', exercise: puzzleEx('mate', 1, 1) },
      { id: 'd1-11', category: 'pembukaan', exercise: { kind: 'choice', prompt: 'Dalam Italian Game, kenapa Gajah ke c4?', options: ['Untuk menekan petak f7 yang lemah', 'Untuk melindungi Raja', 'Untuk menangkap Pion a7'], answer: 0, explain: 'Gajah c4 mensasarkan f7, yang hanya dilindungi oleh Raja Hitam.' } },
      { id: 'd1-12', category: 'strategi', exercise: formationEx('passed-pawn') },
    ];
  }
  return [
    { id: 'f-1', category: 'taktik', exercise: puzzleEx('fork', 2) },
    { id: 'f-2', category: 'taktik', exercise: puzzleEx('pin', 2) },
    { id: 'f-3', category: 'taktik', exercise: puzzleEx('skewer', 2) },
    { id: 'f-4', category: 'taktik', exercise: puzzleEx('discovered', 2) },
    { id: 'f-5', category: 'taktik', exercise: puzzleEx('deflection', 3) },
    { id: 'f-6', category: 'checkmate', exercise: puzzleEx('back-rank', 3) },
    { id: 'f-7', category: 'checkmate', exercise: puzzleEx('sacrifice', 4) },
    { id: 'f-8', category: 'pembukaan', exercise: { kind: 'choice', prompt: 'Selepas 1.e4 c5 2.Nf3 d6 3.d4 cxd4, apa yang Hitam dapat?', options: ['Lebih banyak Pion tengah dan fail c separuh terbuka', 'Kelebihan bahan', 'Raja yang lebih selamat serta-merta'], answer: 0, explain: 'Hitam menukar Pion c (tepi) dengan Pion d (tengah) dan membuka fail c.' } },
    { id: 'f-9', category: 'pembukaan', exercise: { kind: 'choice', prompt: "Dalam King's Indian, selepas Putih menutup tengah dengan d5, di mana Hitam biasanya menyerang?", options: ['Sayap Raja dengan …f5 dan …g5', 'Sayap Menteri dengan …b5', 'Tidak menyerang'], answer: 0, explain: 'Pion d6–e5 menunjuk ke sayap Raja.' } },
    { id: 'f-10', category: 'pertahanan', exercise: lessonEx('a04-defence', 'test', 1) },
    { id: 'f-11', category: 'pertahanan', exercise: lessonEx('a06-calculation', 'test', 1) },
    { id: 'f-12', category: 'endgame', exercise: lessonEx('e02-rook-mate', 'practice', 0) },
    { id: 'f-13', category: 'endgame', exercise: lessonEx('e04-passed-pawns', 'test', 0) },
    { id: 'f-14', category: 'strategi', exercise: formationEx('outposts') },
    { id: 'f-15', category: 'strategi', exercise: formationEx('open-files') },
  ];
}

export const CATEGORY_MS: Record<Category, string> = {
  peraturan: 'Peraturan',
  notasi: 'Notasi',
  checkmate: 'Checkmate',
  taktik: 'Taktik',
  pembukaan: 'Pembukaan',
  strategi: 'Strategi & formasi',
  pertahanan: 'Pertahanan',
  endgame: 'Endgame',
};
