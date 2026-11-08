import data from './puzzles.json';
import type { Puzzle } from './types';
import type { Theme } from './themes';

export const PUZZLES = data as Puzzle[];

export const LEVEL_INFO: Record<Puzzle['level'], { name: string; text: string }> = {
  1: { name: 'Tahap 1 – Asas', text: 'Buah tergantung, tangkapan percuma, check dan mat asas, serangan dua buah.' },
  2: { name: 'Tahap 2 – Senjata utama', text: 'Fork Kuda, pin, skewer, discovered attack dan mat dalam 2.' },
  3: { name: 'Tahap 3 – Kombinasi', text: 'Deflection, buang pertahanan dan back-rank mate.' },
  4: { name: 'Tahap 4 – Serangan Raja', text: 'Pengorbanan, Greek gift, smothered, Arabian dan Anastasia mate.' },
};

export type PuzzleResult = { solved: boolean; firstTry: boolean; attempts: number; hints: number; at: number };
export type PuzzleResults = Record<string, PuzzleResult>;

export function themeStats(results: PuzzleResults): { theme: Theme; total: number; solved: number; firstTry: number }[] {
  const map = new Map<Theme, { theme: Theme; total: number; solved: number; firstTry: number }>();
  for (const p of PUZZLES) {
    const s = map.get(p.theme) ?? { theme: p.theme, total: 0, solved: 0, firstTry: 0 };
    s.total++;
    const r = results[p.id];
    if (r?.solved) s.solved++;
    if (r?.firstTry) s.firstTry++;
    map.set(p.theme, s);
  }
  return [...map.values()];
}
