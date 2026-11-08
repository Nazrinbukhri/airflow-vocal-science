/**
 * The 48-hour programme.
 *
 * "Hour" here means one study session: about 45 minutes of focused work
 * followed by a 15-minute break. Day 1 / Day 2 are the two halves of the
 * programme, not calendar days – the learner can spread them over as many
 * days as they like and resume at any session.
 */

export type ModuleRoute =
  | '/learn'
  | '/fundamentals'
  | '/openings'
  | '/tactics'
  | '/formations'
  | '/prediction'
  | '/play'
  | '/masterclass'
  | '/analysis'
  | '/progress';

export type Session = {
  id: string;
  hour: number;
  title: string;
  /** What the learner should be able to do after this session. */
  goal: string;
  route: ModuleRoute;
};

export type Block = {
  id: string;
  day: 1 | 2;
  fromHour: number;
  toHour: number;
  title: string;
  titleEn: string;
  sessions: Session[];
};

export const STUDY_MINUTES = 45;
export const BREAK_MINUTES = 15;
/** Suggested maximum per calendar day, to avoid fatigue. */
export const SUGGESTED_HOURS_PER_DAY = 3;

type RawBlock = Omit<Block, 'sessions'> & { sessions: [string, string, ModuleRoute][] };

const RAW: RawBlock[] = [
  {
    id: 'd1-board', day: 1, fromHour: 1, toHour: 3,
    title: 'Papan catur dan buah catur', titleEn: 'Chessboard and pieces',
    sessions: [
      ['Apa itu catur? Papan 64 petak', 'Kenal papan: 64 petak, petak cerah di kanan bawah.', '/fundamentals'],
      ['Files dan ranks', 'Namakan mana-mana petak, contoh e4 dan g7.', '/fundamentals'],
      ['Enam buah catur', 'Kenal Raja, Menteri, Benteng, Gajah, Kuda dan Pion serta nilainya.', '/fundamentals'],
    ],
  },
  {
    id: 'd1-rules', day: 1, fromHour: 4, toHour: 6,
    title: 'Peraturan, langkah sah dan notasi', titleEn: 'Rules, legal moves and notation',
    sessions: [
      ['Cara setiap buah bergerak dan menangkap', 'Gerakkan setiap buah dengan betul dan tangkap buah lawan.', '/fundamentals'],
      ['Castling, en passant, promosi Pion', 'Faham tiga langkah istimewa dan bila ia dibenarkan.', '/fundamentals'],
      ['Notasi SAN dan UCI', 'Baca dan tulis langkah seperti Nf3, exd5, O-O dan e2e4.', '/fundamentals'],
    ],
  },
  {
    id: 'd1-mate', day: 1, fromHour: 7, toHour: 9,
    title: 'Check, checkmate dan corak mat asas', titleEn: 'Check, checkmate and basic mating patterns',
    sessions: [
      ['Check dan cara keluar dari check', 'Tahu tiga cara: lari, halang, tangkap.', '/fundamentals'],
      ['Checkmate, stalemate dan seri', 'Beza checkmate, stalemate dan syarat seri.', '/fundamentals'],
      ['Corak mat asas: Menteri + Raja, back-rank', 'Beri checkmate dengan Menteri dan Raja.', '/tactics'],
    ],
  },
  {
    id: 'd1-centre', day: 1, fromHour: 10, toHour: 12,
    title: 'Kawalan tengah dan pembangunan', titleEn: 'Centre control and development',
    sessions: [
      ['Kenapa petak tengah penting', 'Terangkan kawalan e4, d4, e5, d5.', '/openings'],
      ['Bangunkan buah kecil dahulu', 'Kuda dan Gajah keluar sebelum Menteri.', '/openings'],
      ['Keselamatan Raja dan castling awal', 'Castle dalam 10 langkah pertama.', '/openings'],
    ],
  },
  {
    id: 'd1-italian', day: 1, fromHour: 13, toHour: 15,
    title: 'Italian Game', titleEn: 'Italian Game',
    sessions: [
      ['1.e4 e5 2.Nf3 Nc6 3.Bc4 – tujuan setiap langkah', 'Main 3 langkah pertama dan terangkan sebabnya.', '/openings'],
      ['Tekanan pada f7', 'Faham kenapa f7 titik lemah dan bahaya serangan terburu-buru.', '/openings'],
      ['Rancangan serangan selepas castling', 'Rancang c3 + d4 dan serangan sayap Raja.', '/openings'],
    ],
  },
  {
    id: 'd1-tactics', day: 1, fromHour: 16, toHour: 18,
    title: 'Taktik asas', titleEn: 'Basic tactics',
    sessions: [
      ['Buah tergantung dan tangkapan percuma', 'Cari buah lawan yang tidak dilindungi.', '/tactics'],
      ['Check dan ancaman asas', 'Cipta ancaman yang memaksa lawan bertindak.', '/tactics'],
      ['Serangan dua buah (double attack)', 'Serang dua sasaran dengan satu langkah.', '/tactics'],
    ],
  },
  {
    id: 'd1-structures', day: 1, fromHour: 19, toHour: 21,
    title: 'Struktur Pion dan formasi', titleEn: 'Pawn structures and formations',
    sessions: [
      ['Rantai Pion, Pion terpencil, Pion berganda', 'Kenal kelemahan dan kekuatan struktur Pion.', '/formations'],
      ['Fail terbuka, petak lemah dan outpost', 'Letakkan Benteng dan Kuda di petak terbaik.', '/formations'],
      ['Pion lulus (passed pawn) dan fianchetto', 'Faham bila Pion lulus menang permainan.', '/formations'],
    ],
  },
  {
    id: 'd1-assessment', day: 1, fromHour: 22, toHour: 24,
    title: 'Penilaian pertama dan permainan latihan', titleEn: 'First assessment and practice games',
    sessions: [
      ['Ujian Hari 1', 'Jawab soalan peraturan, notasi dan taktik asas.', '/progress'],
      ['Permainan latihan lawan AI (tahap mudah)', 'Main satu permainan penuh dengan senarai semak berfikir.', '/play'],
      ['Semak permainan sendiri', 'Cari satu kesilapan dan satu peluang taktik yang terlepas.', '/analysis'],
    ],
  },
  {
    id: 'd2-openings', day: 2, fromHour: 25, toHour: 28,
    title: 'Pembukaan agresif dan rancangan serangan', titleEn: 'Aggressive openings and attacking plans',
    sessions: [
      ['Sicilian Defence: 1.e4 c5', 'Faham imbangan tidak simetri dan serangan balas sayap Menteri.', '/openings'],
      ['Sicilian: fail terbuka dan peluang taktik', 'Gunakan fail c separuh terbuka.', '/openings'],
      ["King's Indian Defence: 1.d4 Nf6 2.c4 g6", 'Bina fianchetto dan faham ketegangan tengah.', '/openings'],
      ["King's Indian: pecahan Pion dan serangan sayap Raja", 'Rancang ...e5, ...f5 dan serangan Pion.', '/openings'],
    ],
  },
  {
    id: 'd2-tactics', day: 2, fromHour: 29, toHour: 32,
    title: 'Fork, pin, skewer dan discovered attack', titleEn: 'Fork, pin, skewer and discovered attack',
    sessions: [
      ['Knight fork', 'Cari petak fork Kuda.', '/tactics'],
      ['Pin dan skewer', 'Beza pin dan skewer serta cara mengeksploitasinya.', '/tactics'],
      ['Discovered attack dan discovered check', 'Gerakkan satu buah untuk membuka serangan buah lain.', '/tactics'],
      ['Deflection, decoy, buang pertahanan', 'Tarik atau alihkan buah yang mempertahankan.', '/tactics'],
    ],
  },
  {
    id: 'd2-kingside', day: 2, fromHour: 33, toHour: 35,
    title: 'Serangan sayap Raja dan pengorbanan', titleEn: 'King-side attacks and sacrifices',
    sessions: [
      ['Greek gift sacrifice (Bxh7+)', 'Kenal syarat sebelum korbankan Gajah di h7.', '/tactics'],
      ['Smothered, Arabian dan Anastasia mate', 'Kenal tiga corak mat serangan.', '/tactics'],
      ['King hunt – memburu Raja', 'Teruskan serangan dengan check dan ancaman.', '/tactics'],
    ],
  },
  {
    id: 'd2-defence', day: 2, fromHour: 36, toHour: 38,
    title: 'Kesedaran pertahanan dan serangan balas', titleEn: 'Defensive awareness and counterattacks',
    sessions: [
      ['Apa ancaman lawan?', 'Semak ancaman lawan sebelum setiap langkah.', '/prediction'],
      ['Mempertahankan dengan tepat', 'Pilih antara lari, lindung, halang atau serang balas.', '/tactics'],
      ['Zwischenzug dan serangan balas', 'Cari langkah perantaraan yang lebih kuat.', '/tactics'],
    ],
  },
  {
    id: 'd2-endgame', day: 2, fromHour: 39, toHour: 41,
    title: 'Asas permainan akhir', titleEn: 'Endgame fundamentals',
    sessions: [
      ['Raja aktif dan Pion lulus', 'Gunakan Raja sebagai buah penyerang dalam endgame.', '/fundamentals'],
      ['Opposition dan endgame Raja + Pion', 'Menang atau seri dengan opposition.', '/fundamentals'],
      ['Mat dengan Benteng', 'Beri checkmate dengan Raja + Benteng.', '/fundamentals'],
    ],
  },
  {
    id: 'd2-engine', day: 2, fromHour: 42, toHour: 44,
    title: 'Analisis Stockfish dan ramalan langkah', titleEn: 'Stockfish analysis and move prediction',
    sessions: [
      ['Membaca penilaian enjin dan variasi utama', 'Faham +1.5, #3, kedalaman dan PV.', '/prediction'],
      ['Langkah calon: terbaik, agresif, bertahan', 'Bandingkan tiga calon dan risiko masing-masing.', '/prediction'],
      ['Kira dua jawapan lawan', 'Biasakan diri mengira dua balasan lawan sebelum bergerak.', '/prediction'],
    ],
  },
  {
    id: 'd2-gm', day: 2, fromHour: 45, toHour: 46,
    title: 'Permainan serangan Grandmaster', titleEn: 'Grandmaster attacking games',
    sessions: [
      ['Tal dan Kasparov: inisiatif dan pengorbanan', 'Ikuti serangan langkah demi langkah dan teka langkah seterusnya.', '/masterclass'],
      ['Polgár, Fischer, Carlsen, Nakamura', 'Kenal koordinasi buah dalam serangan.', '/masterclass'],
    ],
  },
  {
    id: 'd2-final', day: 2, fromHour: 47, toHour: 48,
    title: 'Cabaran akhir dan laporan prestasi', titleEn: 'Final challenge and performance report',
    sessions: [
      ['Cabaran akhir: taktik + permainan penuh', 'Selesaikan cabaran taktik dan satu permainan lawan AI.', '/play'],
      ['Laporan prestasi', 'Lihat kekuatan, kelemahan dan rancangan latihan seterusnya.', '/progress'],
    ],
  },
];

export const PROGRAMME: Block[] = RAW.map((b) => ({
  ...b,
  sessions: b.sessions.map(([title, goal, route], i) => ({
    id: `h${String(b.fromHour + i).padStart(2, '0')}`,
    hour: b.fromHour + i,
    title,
    goal,
    route,
  })),
}));

export const ALL_SESSIONS: Session[] = PROGRAMME.flatMap((b) => b.sessions);
export const TOTAL_HOURS = ALL_SESSIONS.length;

export function blockOfSession(sessionId: string): Block | undefined {
  return PROGRAMME.find((b) => b.sessions.some((s) => s.id === sessionId));
}

/** The first session not yet completed, in programme order. */
export function nextSession(completed: ReadonlySet<string>): Session | undefined {
  return ALL_SESSIONS.find((s) => !completed.has(s.id));
}

export type SessionLink = { label: string; href: string };

const L = (id: string, label: string): SessionLink => ({ label, href: `/fundamentals/#${id}` });
const A = (label: string): SessionLink => ({ label, href: '/tactics/' });

/** Concrete activities for each session (lessons, drills, trainers). */
export const SESSION_LINKS: Record<string, SessionLink[]> = {
  h01: [L('f01-what', 'Pelajaran: Apa itu catur?'), L('f02-board', 'Pelajaran: Papan catur')],
  h02: [L('f03-files-ranks', 'Pelajaran: Files dan ranks'), L('f04-squares', 'Pelajaran: 64 petak'), { label: 'Latihan cari petak', href: '/fundamentals/' }],
  h03: [L('f05-pieces', 'Pelajaran: Enam buah catur'), { label: 'Penjelajah buah catur', href: '/fundamentals/' }],
  h04: [L('f06-movement', 'Pelajaran: Pergerakan buah'), L('f07-capture', 'Pelajaran: Menangkap')],
  h05: [L('f11-castling', 'Pelajaran: Castling'), L('f12-en-passant', 'Pelajaran: En passant'), L('f13-promotion', 'Pelajaran: Promosi Pion')],
  h06: [L('f15-notation', 'Pelajaran: Notasi SAN dan UCI')],
  h07: [L('f08-check', 'Pelajaran: Check')],
  h08: [L('f09-checkmate', 'Pelajaran: Checkmate'), L('f10-stalemate', 'Pelajaran: Stalemate'), L('f14-draws', 'Pelajaran: Syarat seri')],
  h09: [L('e01-queen-mate', 'Pelajaran: Mat dengan Menteri'), A('Teka-teki Tahap 1: checkmate')],
  h10: [{ label: 'Akademi Pembukaan: tiga prinsip', href: '/openings/' }],
  h11: [{ label: 'Akademi Pembukaan: Italian Game (Tunjuk)', href: '/openings/' }],
  h12: [{ label: 'Pelajaran: Keselamatan Raja', href: '/tactics/' }, { label: 'Akademi Pembukaan', href: '/openings/' }],
  h13: [{ label: 'Italian Game – mod Tunjuk', href: '/openings/' }],
  h14: [{ label: 'Italian Game – mod Latih', href: '/openings/' }, { label: 'Perangkap Fried Liver', href: '/openings/' }],
  h15: [{ label: 'Variasi Italian: Two Knights, Evans', href: '/openings/' }],
  h16: [A('Teka-teki Tahap 1: buah tergantung')],
  h17: [A('Teka-teki Tahap 1: check dan mat')],
  h18: [A('Teka-teki: serangan dua buah')],
  h19: [{ label: 'Formasi: rantai, terpencil, berganda', href: '/formations/' }],
  h20: [{ label: 'Formasi: fail terbuka, petak lemah, outpost', href: '/formations/' }],
  h21: [{ label: 'Formasi: Pion lulus, fianchetto', href: '/formations/' }],
  h22: [{ label: 'Ujian Hari 1', href: '/progress/#day1' }],
  h23: [{ label: 'Lawan Stockfish (tahap 1–2)', href: '/play/' }],
  h24: [{ label: 'Analisis permainan anda', href: '/analysis/' }],
  h25: [{ label: 'Sicilian Defence – Tunjuk', href: '/openings/' }],
  h26: [{ label: 'Sicilian Defence – Latih', href: '/openings/' }, { label: 'Perangkap Siberian', href: '/openings/' }],
  h27: [{ label: "King's Indian – Tunjuk", href: '/openings/' }],
  h28: [{ label: "King's Indian – Latih", href: '/openings/' }, { label: 'Formasi: serangan sayap Raja', href: '/formations/' }],
  h29: [A('Teka-teki Tahap 2: fork Kuda')],
  h30: [A('Teka-teki Tahap 2: pin dan skewer')],
  h31: [A('Teka-teki Tahap 2: discovered attack')],
  h32: [A('Teka-teki Tahap 3: deflection')],
  h33: [{ label: 'Pelajaran: Menyerang Raja yang sudah castle', href: '/tactics/' }, A('Teka-teki Tahap 4: pengorbanan')],
  h34: [A('Teka-teki Tahap 4: smothered, Arabian, Anastasia')],
  h35: [{ label: 'Pelajaran: Koordinasi buah', href: '/tactics/' }, A('Teka-teki Tahap 3: back-rank')],
  h36: [{ label: 'Jurulatih: apa ancaman lawan?', href: '/prediction/' }],
  h37: [{ label: 'Pelajaran: Teknik pertahanan', href: '/tactics/' }],
  h38: [{ label: 'Pelajaran: Serangan balas dan zwischenzug', href: '/tactics/' }, { label: 'Pelajaran: Agresif, bukan melulu', href: '/tactics/' }],
  h39: [L('e05-active-king', 'Pelajaran: Raja aktif'), L('e04-passed-pawns', 'Pelajaran: Pion lulus')],
  h40: [L('e03-opposition', 'Pelajaran: Opposition')],
  h41: [L('e02-rook-mate', 'Pelajaran: Mat dengan Benteng')],
  h42: [{ label: 'Ramalan AI: membaca penilaian', href: '/prediction/' }],
  h43: [{ label: 'Jurulatih: tiga langkah calon', href: '/prediction/' }],
  h44: [{ label: 'Lawan Stockfish dengan jurulatih', href: '/play/' }],
  h45: [{ label: 'Kelas Grandmaster: Tal, Kasparov, Fischer', href: '/masterclass/' }],
  h46: [{ label: 'Kelas Grandmaster: Carlsen', href: '/masterclass/' }],
  h47: [{ label: 'Cabaran akhir', href: '/progress/#final' }, { label: 'Lawan Stockfish', href: '/play/' }],
  h48: [{ label: 'Laporan prestasi', href: '/progress/#report' }],
};
