// Merge verified puzzle files: node scripts/puzzles/merge.mjs out.json in1.json in2.json …
// Deduplicates by piece placement, sorts by level and theme, renumbers ids.
import { readFileSync, writeFileSync } from 'node:fs';

const [out, ...inputs] = process.argv.slice(2);
const seen = new Set();
const all = [];
for (const f of inputs) {
  for (const p of JSON.parse(readFileSync(f, 'utf8'))) {
    const key = p.fen.split(' ')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    all.push(p);
  }
}
for (const p of all) {
  // One-move material puzzles: the game goes on, so do not say it is over.
  if (p.goal === 'material' && p.solution.length === 1) {
    p.defence = `Lawan tidak dapat mendapatkan semula bahan dengan baik – enjin menilai kedudukan selepas tangkapan ${p.evalAfter} untuk anda.`;
    p.followUp = 'Teruskan dengan membangunkan buah dan menukar buah apabila anda lebih bahan.';
  }
}
// Mate puzzles: describe wrong moves in terms of mate, not pawns.
for (const p of all) {
  if (p.goal !== 'mate') continue;
  const solverIsWhite = p.fen.split(' ')[1] === 'w';
  for (const w of p.wrong) {
    const m = /^#(-?\d+)$/.exec(w.eval);
    const mateForSolver = m && (Number(m[1]) > 0) === solverIsWhite;
    const tail = w.refutation ? ` Lawan menjawab ${w.refutation}.` : '';
    if (mateForSolver) w.reason = `Masih menang, tetapi mat lebih perlahan (${w.eval.replace('-', '')}) daripada penyelesaian (mat dalam ${p.mateIn}).${tail}`;
    else if (m) w.reason = `Langkah ini membenarkan lawan memberi checkmate.${tail}`;
    else w.reason = `Tiada checkmate yang dipaksa selepas langkah ini (enjin: ${w.eval} dari pihak Putih).${tail}`;
  }
}

all.sort((a, b) => a.level - b.level || a.theme.localeCompare(b.theme) || a.fen.localeCompare(b.fen));
all.forEach((p, i) => (p.id = `p${String(i + 1).padStart(3, '0')}`));
writeFileSync(out, `${JSON.stringify(all, null, 1)}\n`);
const by = {};
for (const p of all) by[`L${p.level} ${p.theme}${p.pattern && p.pattern !== 'other' ? '/' + p.pattern : ''}`] = (by[`L${p.level} ${p.theme}${p.pattern && p.pattern !== 'other' ? '/' + p.pattern : ''}`] ?? 0) + 1;
console.log(`${all.length} puzzles`, by);
