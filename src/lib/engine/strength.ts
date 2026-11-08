import type { AnalysisResult, Engine } from './engine';
import { scoreValue } from './uci';

export type Level = {
  level: number;
  name: string;
  description: string;
  /** Search limit for this level. */
  depth?: number;
  movetime?: number;
  /** Weakened levels: pick randomly among moves that lose at most this many centipawns. */
  maxLossCp?: number;
  multiPv?: number;
  /** UCI Skill Level for the stronger levels. */
  skill?: number;
};

/**
 * Playing levels. Levels 1–3 are deliberately weakened for absolute beginners
 * (the engine sometimes chooses a clearly worse move, so tactics can be practised).
 * Levels 4–8 use Stockfish's own "Skill Level" option.
 * No Elo numbers are claimed: strength depends on the device and is not calibrated.
 */
export const LEVELS: Level[] = [
  { level: 1, name: 'Pemula 1', description: 'Sangat lemah – kerap membuat kesilapan besar.', depth: 2, multiPv: 5, maxLossCp: 400 },
  { level: 2, name: 'Pemula 2', description: 'Lemah – kadang-kadang meninggalkan buah tergantung.', depth: 4, multiPv: 4, maxLossCp: 200 },
  { level: 3, name: 'Pemula 3', description: 'Masih membuat kesilapan kecil.', depth: 6, multiPv: 3, maxLossCp: 90 },
  { level: 4, name: 'Sederhana', description: 'Stockfish Skill Level 3.', depth: 8, skill: 3 },
  { level: 5, name: 'Kelab', description: 'Stockfish Skill Level 7.', movetime: 400, skill: 7 },
  { level: 6, name: 'Kuat', description: 'Stockfish Skill Level 12.', movetime: 700, skill: 12 },
  { level: 7, name: 'Pakar', description: 'Stockfish Skill Level 17.', movetime: 1000, skill: 17 },
  { level: 8, name: 'Maksimum', description: 'Kekuatan penuh Stockfish (lite).', movetime: 1500, skill: 20 },
];

/** Choose among analysed lines: any move within `maxLossCp` of the best. `random` is injectable for tests. */
export function pickWeakenedMove(result: AnalysisResult, maxLossCp: number, random: () => number = Math.random): string | null {
  const lines = result.lines.filter((l) => l.pv.length > 0);
  if (lines.length === 0) return result.bestMove;
  const best = scoreValue(lines[0]!.score);
  // Never throw away a forced mate the engine has found, and never walk into a mate if avoidable.
  const ok = lines.filter((l) => best - scoreValue(l.score) <= maxLossCp && scoreValue(l.score) > -50000);
  const pool = ok.length ? ok : [lines[0]!];
  return pool[Math.floor(random() * pool.length)]!.pv[0]!;
}

/** Ask the engine for its move at a given level. */
export async function chooseMove(engine: Engine, fen: string, levelNo: number, signal?: AbortSignal): Promise<string | null> {
  const lv = LEVELS.find((l) => l.level === levelNo) ?? LEVELS[0]!;
  const result = await engine.analyse(fen, {
    depth: lv.depth,
    movetime: lv.movetime,
    multiPv: lv.multiPv ?? 1,
    skill: lv.skill ?? 20,
    signal,
  });
  if (lv.maxLossCp !== undefined) return pickWeakenedMove(result, lv.maxLossCp);
  return result.bestMove;
}
