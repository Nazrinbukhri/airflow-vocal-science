import { Chess, type Color, type Move, type Square } from 'chess.js';
import { describeMove } from '@/lib/chess/describe';
import type { AnalysisResult, EngineLine } from '@/lib/engine/engine';
import { formatScore, numberedLine, scoreValue, type Score } from '@/lib/engine/uci';
import {
  aggression,
  checkingMoves,
  freeCaptures,
  hangingPieces,
  kingSafety,
  material,
  moveFacts,
  nullMoveFen,
  other,
  pieceName,
  undevelopedMinors,
  VALUE,
  type MoveFacts,
  type PieceRef,
} from './facts';

export type BookMove = { san: string; name: string; idea?: string };

export type CoachInput = {
  fen: string;
  /** MultiPV analysis of the position (3–5 lines). */
  main: AnalysisResult;
  /** Analysis of the null-move position (opponent to move), for threats. */
  threat?: AnalysisResult | null;
  /** Opponent replies after each candidate (keyed by candidate UCI). */
  replies?: Map<string, AnalysisResult>;
  /** Theory moves from the app's opening book for this position. */
  book?: BookMove[];
  lastMove?: Move;
};

export type Flag = 'ok' | 'warn' | 'chance' | 'info';
export type ChecklistItem = { question: string; answer: string; flag: Flag };
export type Threat = { text: string; severity: 'high' | 'medium' | 'low' };
export type Reply = { san: string; score: string; text: string };

export type Candidate = {
  rank: number;
  san: string;
  uci: string;
  score: Score;
  scoreWhite: Score;
  scoreText: string;
  evalWords: string;
  lossCp: number;
  line: string;
  why: string[];
  attacks: string[];
  protects: string[];
  threatens: string[];
  benefits: string[];
  risks: string[];
  replies: Reply[];
  aggressive: number;
  facts: MoveFacts;
};

export type Category = { key: 'A' | 'B' | 'C' | 'D'; title: string; san?: string; uci?: string; text: string };

export type CoachReport = {
  fen: string;
  turn: Color;
  depth: number;
  /** Engine score of the best line, from the side to move. */
  bestScore?: Score;
  gameOver: boolean;
  whatHappened?: string;
  whyItMatters: string[];
  situation: string[];
  threats: Threat[];
  checklist: ChecklistItem[];
  candidates: Candidate[];
  categories: Category[];
  recommendation?: { san: string; uci: string; text: string };
  bestLine?: string;
  nextText?: string;
  hints: { threat: string; attacked: string; squares: Square[]; solution: string };
};

const SIDE: Record<Color, string> = { w: 'Putih', b: 'Hitam' };
const AGGRESSIVE_MARGIN_CP = 100;
const DEFENSIVE_MARGIN_CP = 100;

const at = (p: PieceRef, withColor = true) => `${pieceName(p, withColor)} di ${p.square}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} dan ${xs[xs.length - 1]}`);

/** Plain-language evaluation from the point of view of `side` (score is from that side). */
export function evalWords(score: Score, side: Color): string {
  const who = SIDE[side];
  const opp = SIDE[other(side)];
  if (score.type === 'mate') {
    if (score.value > 0) return `${who} ada laluan checkmate dalam ${score.value} langkah`;
    if (score.value < 0) return `${opp} ada laluan checkmate dalam ${-score.value} langkah`;
    return `${who} sudah checkmate`;
  }
  const v = score.value;
  const a = Math.abs(v);
  const leader = v > 0 ? who : opp;
  if (a <= 30) return 'kedudukan seimbang';
  if (a <= 100) return `${leader} sedikit lebih baik`;
  if (a <= 300) return `${leader} lebih baik`;
  return `${leader} mempunyai kelebihan besar`;
}

function negate(s: Score): Score {
  return { type: s.type, value: -s.value };
}

function describeTargets(ps: PieceRef[]): string[] {
  return ps.map((p) => (p.type === 'k' ? `Raja ${p.color === 'w' ? 'putih' : 'hitam'} (check)` : at(p)));
}

type ThreatInfo = { uci: string; san: string; mate: boolean; captureValue: number };

/** Does the opponent's threat still work after our move? */
function parries(fen: string, uci: string, threat: ThreatInfo): boolean {
  const after = new Chess(fen);
  after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  try {
    const m = after.move({ from: threat.uci.slice(0, 2), to: threat.uci.slice(2, 4), promotion: threat.uci[4] });
    if (threat.mate) return !after.isCheckmate();
    return (m.captured ? VALUE[m.captured] : 0) < threat.captureValue;
  } catch {
    return true; // the threatening move is no longer legal
  }
}

function buildCandidate(
  fen: string,
  line: EngineLine,
  rank: number,
  best: EngineLine,
  turn: Color,
  replies?: AnalysisResult,
  threat?: ThreatInfo,
): Candidate | null {
  const uci = line.pv[0];
  if (!uci) return null;
  const f = moveFacts(fen, uci);
  if (!f) return null;
  const lossCp = Math.max(0, scoreValue(best.score) - scoreValue(line.score));
  const why: string[] = [];
  const benefits: string[] = [];
  const risks: string[] = [];

  if (f.mate) why.push('Ia CHECKMATE – permainan tamat serta-merta.');
  else if (line.score.type === 'mate' && line.score.value > 0) why.push(`Ia memulakan serangan mat yang dipaksa (mat dalam ${line.score.value}).`);
  if (f.capture) {
    const val = VALUE[f.capture.type];
    why.push(`Menangkap ${at(f.capture)} (nilai ${val}).`);
  }
  if (threat && parries(fen, uci, threat)) why.push(`Menangkis ancaman lawan ${threat.san}${threat.mate ? ' (checkmate)' : ''}.`);
  if (f.check && !f.mate) why.push('Memberi check – lawan wajib menyelamatkan Rajanya dahulu.');
  if (f.forkTargets.length >= 2) why.push(`Serangan berganda (fork / double attack): ${list(describeTargets(f.forkTargets))} diserang serentak.`);
  else if (f.forkTargets.length === 1 && f.forkTargets[0]!.type !== 'k' && !f.capture)
    why.push(`Menyerang ${at(f.forkTargets[0]!)} – lawan perlu membalas (langkah dengan tempo).`);
  if (f.discovered.length) why.push(`Serangan terbuka (discovered attack) pada ${list(f.discovered.map((p) => at(p)))}.`);
  if (f.promotion) why.push(`Promosi Pion menjadi ${pieceName({ type: f.promotion })}.`);
  if (f.castle) why.push('Castling – Raja ke tempat selamat dan Benteng masuk ke permainan.');
  if (f.developsPiece) why.push('Membangunkan buah kecil (development) dari petak asal.');
  if (f.centralPawn) why.push('Merebut atau mengawal petak tengah.');
  if (f.rescued.length) why.push(`Menyelamatkan ${list(f.rescued.map((p) => at(p, false)))} yang sedang diserang.`);
  if (f.kingZonePressure >= 2 && !f.check) why.push('Menambah tekanan di sekeliling Raja lawan.');
  if (why.length === 0) why.push('Langkah tenang yang memperbaiki kedudukan buah; enjin menilainya antara yang terbaik.');

  if (rank === 1) benefits.push('Pilihan pertama Stockfish pada kedalaman ini.');
  if (lossCp <= 20 && rank > 1) benefits.push('Hampir sama baik dengan langkah terbaik enjin.');
  if (f.capture && !f.movedPieceHangs) benefits.push('Memenangi bahan dengan selamat.');
  if (f.check || f.forkTargets.length >= 2) benefits.push('Memaksa – lawan mempunyai sedikit pilihan.');

  if (f.movedPieceHangs) {
    if (lossCp <= AGGRESSIVE_MARGIN_CP && scoreValue(line.score) > -100)
      risks.push(`${pieceName({ type: f.move.piece })} di ${f.move.to} boleh ditangkap, tetapi enjin menilai ia masih baik – ini pengorbanan/taktik yang dikira. Kira dengan teliti!`);
    else risks.push(`${pieceName({ type: f.move.piece })} di ${f.move.to} boleh ditangkap dengan mudah.`);
  }
  const others = f.leftHanging.filter((h) => h.square !== f.move.to);
  if (others.length) risks.push(`Masih tergantung: ${list(others.map((h) => at(h, false)))}.`);
  if (lossCp > 50) risks.push(`Lebih lemah daripada langkah terbaik sebanyak kira-kira ${(lossCp / 100).toFixed(1)} Pion.`);
  if (!f.castle && f.move.piece === 'k' && new Chess(fen).moveNumber() < 15 && !new Chess(fen).inCheck())
    risks.push('Menggerakkan Raja awal biasanya menghilangkan hak castling.');
  if (risks.length === 0) risks.push('Tiada risiko jelas pada kedalaman analisis ini – tetapi sentiasa semak jawapan lawan.');

  const replyLines: Reply[] = (replies?.lines ?? []).slice(0, 2).map((r) => {
    const rf = moveFacts(replies!.fen, r.pv[0]!);
    const bits: string[] = [];
    if (rf?.mate) bits.push('checkmate');
    else {
      if (rf?.capture) bits.push(`menangkap ${at(rf.capture, false)}`);
      if (rf?.check) bits.push('check');
      if (rf && rf.forkTargets.length >= 2) bits.push('serangan berganda');
      if (rf?.rescued.length) bits.push(`menyelamatkan ${list(rf.rescued.map((p) => at(p, false)))}`);
    }
    // Score of the reply is from the opponent's side; show it from White's side for consistency.
    return {
      san: r.pvSan[0] ?? r.pv[0]!,
      score: formatScore(r.scoreWhite),
      text: bits.length ? bits.join(', ') : 'langkah membina / bertahan',
    };
  });

  return {
    rank,
    san: line.pvSan[0] ?? uci,
    uci,
    score: line.score,
    scoreWhite: line.scoreWhite,
    scoreText: formatScore(line.scoreWhite),
    evalWords: evalWords(line.score, turn),
    lossCp,
    line: numberedLine(fen, line.pvSan.slice(0, 6)),
    why,
    attacks: describeTargets(f.targets),
    protects: f.rescued.map((p) => at(p)),
    threatens: describeTargets(f.forkTargets),
    benefits,
    risks,
    replies: replyLines,
    aggressive: aggression(f),
    facts: f,
  };
}

/** Build the full Bahasa Melayu coaching report for a position. Every move named comes from Stockfish or chess.js. */
export function buildReport(input: CoachInput): CoachReport {
  const { fen, main } = input;
  const chess = new Chess(fen);
  const me = chess.turn();
  const them = other(me);
  const lines = main.lines.filter((l) => l.pv.length > 0);
  const best = lines[0];

  const report: CoachReport = {
    fen,
    turn: me,
    depth: main.depth,
    bestScore: best?.score ?? (chess.isCheckmate() ? { type: 'mate', value: 0 } : chess.isGameOver() ? { type: 'cp', value: 0 } : undefined),
    gameOver: chess.isGameOver(),
    whyItMatters: [],
    situation: [],
    threats: [],
    checklist: [],
    candidates: [],
    categories: [],
    hints: { threat: '', attacked: '', squares: [], solution: '' },
  };

  // ---- WHAT HAPPENED? ----
  if (input.lastMove) {
    report.whatHappened = describeMove(input.lastMove);
    const lf = moveFacts(input.lastMove.before, input.lastMove.lan);
    if (lf) {
      if (lf.forkTargets.length >= 2) report.whyItMatters.push(`Langkah itu menyerang dua sasaran serentak: ${list(describeTargets(lf.forkTargets))}.`);
      else if (lf.targets.length) report.whyItMatters.push(`Kini ${pieceName({ type: lf.move.piece })} di ${lf.move.to} menyerang ${list(describeTargets(lf.targets))}.`);
      if (lf.discovered.length) report.whyItMatters.push(`Ia juga membuka serangan buah lain pada ${list(lf.discovered.map((p) => at(p)))}.`);
      if (lf.movedPieceHangs) report.whyItMatters.push(`${pieceName({ type: lf.move.piece })} yang baru bergerak nampak tidak dilindungi dengan cukup – semak sama ada boleh ditangkap.`);
      if (lf.castle) report.whyItMatters.push('Lawan menyelamatkan Raja dengan castling.');
    }
  }

  if (chess.isCheckmate()) {
    report.situation.push(`Checkmate. ${SIDE[them]} menang.`);
    return report;
  }
  if (chess.isGameOver()) {
    report.situation.push('Permainan sudah tamat dengan keputusan seri.');
    return report;
  }

  // ---- SITUATION ----
  if (best) report.situation.push(`Stockfish (kedalaman ${main.depth}): ${evalWords(best.score, me)} (${formatScore(best.scoreWhite)}).`);
  const mw = material(chess, 'w');
  const mb = material(chess, 'b');
  report.situation.push(
    mw === mb
      ? `Bahan sama: setiap pihak ${mw} mata.`
      : `Bahan: Putih ${mw}, Hitam ${mb} – ${mw > mb ? 'Putih' : 'Hitam'} lebih ${Math.abs(mw - mb)} mata.`,
  );
  const ks = kingSafety(chess, me);
  const ko = kingSafety(chess, them);
  const kingText = (k: typeof ks, who: string) =>
    k.castled
      ? `Raja ${who} sudah castle${k.pawnShield <= 1 ? ' tetapi perisai Pionnya lemah' : ' dengan perisai Pion'}.`
      : k.canStillCastle
        ? `Raja ${who} belum castle (masih boleh).`
        : `Raja ${who} di ${k.square} dan tidak boleh castle lagi.`;
  report.situation.push(kingText(ks, 'anda'), kingText(ko, 'lawan'));
  const undeveloped = undevelopedMinors(chess, me);
  if (chess.moveNumber() <= 12 && undeveloped >= 2) report.situation.push(`Anda masih ada ${undeveloped} buah kecil (Kuda/Gajah) di petak asal – bangunkannya sebelum menyerang.`);

  // ---- THREATS ----
  if (chess.inCheck()) {
    report.threats.push({ text: 'Raja anda dalam CHECK! Pilih: lari, halang, atau tangkap buah yang menyerang.', severity: 'high' });
  }
  const myHanging = hangingPieces(chess, me);
  for (const h of myHanging.slice(0, 3)) {
    report.threats.push({
      text:
        h.reason === 'undefended'
          ? `${at(h, false)} diserang dan tidak dilindungi.`
          : `${at(h, false)} diserang oleh buah yang lebih murah (${list(h.attackers.map((s) => pieceName(chess.get(s)!)))}).`,
      severity: VALUE[h.type] >= 3 ? 'high' : 'medium',
    });
  }
  const t = input.threat?.lines[0];
  const nullFen = nullMoveFen(fen);
  let threatInfo: ThreatInfo | undefined;
  if (t && nullFen && best) {
    const tf = moveFacts(nullFen, t.pv[0]!);
    const swing = scoreValue(t.score) - scoreValue(negate(best.score));
    if (tf) {
      const serious = (t.score.type === 'mate' && t.score.value > 0) || swing >= 150;
      if (serious) threatInfo = { uci: tf.uci, san: tf.san, mate: tf.mate, captureValue: tf.capture ? VALUE[tf.capture.type] : 0 };
      if (t.score.type === 'mate' && t.score.value > 0) {
        report.threats.unshift({ text: `Bahaya! Jika anda tidak berhati-hati, lawan ada ${tf.san} dengan serangan mat (mat dalam ${t.score.value}).`, severity: 'high' });
      } else if (swing >= 150 && tf.capture) {
        report.threats.push({ text: `Lawan mengancam ${tf.san}, menangkap ${at(tf.capture, false)}.`, severity: 'high' });
      } else if (swing >= 150) {
        report.threats.push({ text: `Lawan mengancam ${tf.san}${tf.check ? ' dengan check' : ''}${tf.forkTargets.length >= 2 ? `, menyerang ${list(describeTargets(tf.forkTargets))}` : ''}.`, severity: 'medium' });
      }
    }
  }
  if (report.threats.length === 0) report.threats.push({ text: 'Tiada ancaman segera yang jelas. Masa yang baik untuk membangunkan buah atau memulakan serangan.', severity: 'low' });

  // ---- CANDIDATES ----
  const cands: Candidate[] = [];
  if (best) {
    lines.slice(0, 5).forEach((l, i) => {
      const c = buildCandidate(fen, l, i + 1, best, me, input.replies?.get(l.pv[0]!), threatInfo);
      if (c) cands.push(c);
    });
  }
  report.candidates = cands.slice(0, 3);
  const engineSet = new Set(lines.map((l) => l.pv[0]));
  const goodSet = new Set(cands.filter((c) => c.lossCp <= AGGRESSIVE_MARGIN_CP).map((c) => c.uci));

  // ---- CHECKLIST (the 7 questions) ----
  report.checklist.push({
    question: 'Adakah Raja saya selamat?',
    answer: chess.inCheck()
      ? 'TIDAK – anda dalam check. Itu keutamaan pertama.'
      : ks.attackedZone >= 3
        ? `Berhati-hati: ${ks.attackedZone} petak di sekeliling Raja anda diserang.`
        : !ks.castled && chess.moveNumber() > 10 && ks.canStillCastle
          ? 'Agak selamat, tetapi pertimbangkan castling.'
          : 'Ya, buat masa ini.',
    flag: chess.inCheck() || ks.attackedZone >= 3 ? 'warn' : 'ok',
  });
  report.checklist.push({
    question: 'Adakah mana-mana buah saya diserang?',
    answer: myHanging.length ? `Ya: ${list(myHanging.map((h) => at(h, false)))}.` : 'Tiada buah yang tergantung.',
    flag: myHanging.length ? 'warn' : 'ok',
  });
  const free = freeCaptures(chess);
  report.checklist.push({
    question: 'Bolehkah saya tangkap buah percuma?',
    answer: free.length
      ? free
          .slice(0, 3)
          .map((m) => `${m.san}${goodSet.has(m.from + m.to + (m.promotion ?? '')) ? ' (disahkan enjin)' : engineSet.size ? ' (enjin tidak mencadangkannya – mungkin perangkap)' : ''}`)
          .join(', ')
      : 'Tiada tangkapan percuma.',
    flag: free.some((m) => goodSet.has(m.from + m.to + (m.promotion ?? ''))) ? 'chance' : 'info',
  });
  const checks = checkingMoves(chess);
  report.checklist.push({
    question: 'Bolehkah saya beri check?',
    answer: checks.length ? `Ya: ${checks.slice(0, 4).join(', ')}${checks.length > 4 ? ' …' : ''}. Ingat: check tidak semestinya langkah terbaik.` : 'Tiada check yang sah.',
    flag: checks.length ? 'info' : 'ok',
  });
  // Threat-creating and double-attack moves among ALL legal moves (static), marked if the engine agrees.
  const all = chess.moves({ verbose: true }).map((m) => moveFacts(fen, m.from + m.to + (m.promotion ?? ''))!).filter(Boolean);
  const threatening = all.filter((f) => !f.capture && f.forkTargets.length === 1 && f.forkTargets[0]!.type !== 'k');
  const doubles = all.filter((f) => f.forkTargets.length >= 2);
  const mark = (f: MoveFacts) => `${f.san}${goodSet.has(f.uci) ? ' ✓' : ''}`;
  report.checklist.push({
    question: 'Bolehkah saya cipta ancaman?',
    answer: threatening.length ? `Contoh: ${threatening.slice(0, 4).map(mark).join(', ')} (✓ = disokong enjin).` : 'Tiada ancaman langsung yang mudah – perbaiki kedudukan buah.',
    flag: threatening.some((f) => goodSet.has(f.uci)) ? 'chance' : 'info',
  });
  report.checklist.push({
    question: 'Bolehkah saya serang dua buah serentak?',
    answer: doubles.length ? `Ya: ${doubles.slice(0, 4).map(mark).join(', ')} (✓ = disokong enjin).` : 'Tiada serangan berganda dalam kedudukan ini.',
    flag: doubles.some((f) => goodSet.has(f.uci)) ? 'chance' : 'info',
  });
  report.checklist.push({
    question: 'Apakah jawapan terkuat lawan?',
    answer:
      best && best.pvSan.length >= 2
        ? `Selepas ${best.pvSan[0]}, jawapan terbaik lawan menurut enjin ialah ${best.pvSan[1]}.`
        : 'Belum cukup data enjin.',
    flag: 'info',
  });

  // ---- CATEGORIES A–D ----
  const A = cands[0];
  if (A) {
    report.categories.push({ key: 'A', title: 'Langkah terbaik enjin', san: A.san, uci: A.uci, text: `${A.why[0]} Penilaian ${A.scoreText}.` });
    const pool = cands.filter((c) => c.lossCp <= AGGRESSIVE_MARGIN_CP && scoreValue(c.score) > -150 && c.aggressive > 0);
    const B = pool.sort((a, b) => b.aggressive - a.aggressive || a.lossCp - b.lossCp)[0];
    report.categories.push(
      B
        ? {
            key: 'B',
            title: 'Alternatif agresif',
            san: B.san,
            uci: B.uci,
            text:
              B.uci === A.uci
                ? `Langkah terbaik juga yang paling agresif. ${B.why[0]}`
                : `${B.why[0]} Hanya ${(B.lossCp / 100).toFixed(2)} Pion kurang daripada langkah terbaik.`,
          }
        : { key: 'B', title: 'Alternatif agresif', text: 'Tiada alternatif agresif yang selamat di sini. Kadang-kadang langkah tenang ialah persediaan serangan terbaik.' },
    );
    const book = input.book ?? [];
    report.categories.push(
      book.length
        ? {
            key: 'C',
            title: 'Langkah teori (buku pembukaan)',
            san: book[0]!.san,
            text: `Langkah utama dalam buku pembukaan aplikasi ini – ${book[0]!.name}.${book[0]!.idea ? ` ${book[0]!.idea}` : ''} Aplikasi ini tidak menyimpan statistik permainan manusia, jadi tiada peratusan ditunjukkan.`,
          }
        : { key: 'C', title: 'Langkah manusia paling biasa', text: 'Tiada data: kedudukan ini di luar buku pembukaan aplikasi. Kami tidak meneka apa yang manusia biasanya main.' },
    );
    const defensiveScore = (c: Candidate) =>
      c.facts.rescued.length * 3 + (c.facts.castle ? 3 : 0) + (!c.facts.capture && !c.facts.check ? 1 : 0) - c.aggressive / 4;
    const D = cands
      .filter((c) => c.lossCp <= DEFENSIVE_MARGIN_CP)
      .filter((c) => c.uci !== B?.uci || cands.length === 1)
      .sort((a, b) => defensiveScore(b) - defensiveScore(a))[0];
    report.categories.push(
      D
        ? {
            key: 'D',
            title: 'Alternatif bertahan',
            san: D.san,
            uci: D.uci,
            text: D.facts.rescued.length
              ? `Menyelamatkan ${list(D.facts.rescued.map((p) => at(p, false)))}. Penilaian ${D.scoreText}.`
              : D.facts.castle
                ? `Castling menguatkan keselamatan Raja. Penilaian ${D.scoreText}.`
                : `Langkah yang lebih tenang dan kukuh. Penilaian ${D.scoreText}.`,
          }
        : { key: 'D', title: 'Alternatif bertahan', text: 'Tiada langkah bertahan yang setara – hanya langkah terbaik mengekalkan kedudukan.' },
    );
    const rec = B ?? A;
    report.recommendation = {
      san: rec.san,
      uci: rec.uci,
      text:
        rec === A
          ? `Cadangan: ${A.san}. ${A.why[0]}`
          : `Cadangan gaya agresif: ${rec.san}. ${rec.why[0]} Jika mahu bermain paling tepat, pilih ${A.san}.`,
    };
    report.bestLine = A.line;
    report.nextText = A.replies[0]
      ? `Selepas ${A.san}, lawan mungkin menjawab ${A.replies[0].san}${A.replies[1] ? ` atau ${A.replies[1].san}` : ''} (pilihan teratas enjin – manusia mungkin bermain lain).`
      : best && best.pvSan.length > 1
        ? `Variasi utama: ${A.line}.`
        : undefined;

    // ---- PROGRESSIVE HINTS ----
    const theirHanging = hangingPieces(chess, them);
    report.hints = {
      threat: report.threats[0]!.text,
      attacked: [
        myHanging.length ? `Buah anda yang diserang: ${list(myHanging.map((h) => at(h, false)))}.` : 'Tiada buah anda yang tergantung.',
        theirHanging.length ? `Buah lawan yang lemah: ${list(theirHanging.map((h) => at(h)))}.` : 'Lihat buah lawan yang tidak dilindungi dan Raja lawan.',
      ].join(' '),
      squares: [...new Set(cands.map((c) => c.facts.move.to))].sort(),
      solution: `${A.san} – ${A.why.join(' ')}`,
    };
  }
  return report;
}
