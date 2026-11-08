import { Chess, type Square } from 'chess.js';
import { movesWhere, type Exercise } from './exercise';

export type LessonModule = 'fundamentals' | 'attack' | 'endgame';

export type ShowStep = { fen: string; caption: string; highlights?: Square[]; moves?: { san: string; note: string }[] };

export type Lesson = {
  id: string;
  module: LessonModule;
  title: string;
  titleEn: string;
  minutes: number;
  explain: string[];
  terms?: { en: string; ms: string; text: string }[];
  show: ShowStep[];
  practice: Exercise[];
  test: Exercise[];
  review: string[];
};

export const MODULE_INFO: Record<LessonModule, { name: string; text: string }> = {
  fundamentals: { name: 'Asas catur', text: 'Dari sifar: papan, buah, peraturan dan notasi.' },
  attack: { name: 'Serangan & pertahanan', text: 'Menyerang dengan bijak – keselamatan Raja, koordinasi, serangan balas dan pertahanan.' },
  endgame: { name: 'Permainan akhir', text: 'Mat asas, opposition, Pion lulus dan Raja yang aktif.' },
};

const START = new Chess().fen();
const after = (sans: string[]) => {
  const c = new Chess();
  for (const s of sans) c.move(s);
  return c.fen();
};
/** SAN of the legal move(s) from → to in a position (so check signs are always right). */
const mv = (fen: string, from: string, to: string) => movesWhere(fen, (m) => m.from === from && m.to === to);

const ITALIAN = after(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
const CASTLE = 'r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 6 8';
const EP = after(['e4', 'a6', 'e5', 'd5']);
const PROMO = '8/4P1k1/8/8/8/8/8/4K3 w - - 0 1';
const CHECKED = '4k3/8/8/8/1b6/8/8/4K2R w K - 0 1';

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------ FUNDAMENTALS
  {
    id: 'f01-what', module: 'fundamentals', title: 'Apa itu catur?', titleEn: 'What is chess?', minutes: 10,
    explain: [
      'Catur ialah permainan strategi untuk dua pemain: Putih (White) dan Hitam (Black).',
      'Setiap pemain bermula dengan 16 buah. Putih SENTIASA bergerak dahulu, kemudian pemain bergilir-gilir – satu langkah setiap giliran. Anda tidak boleh "lepas" giliran.',
      'Matlamat permainan ialah checkmate: menyerang Raja (King) lawan sehingga ia tidak boleh diselamatkan. Raja tidak pernah "dimakan" – permainan tamat sebaik sahaja checkmate.',
      'Permainan juga boleh berakhir seri (draw) – contohnya stalemate atau persetujuan kedua-dua pemain.',
    ],
    terms: [
      { en: 'White / Black', ms: 'Putih / Hitam', text: 'Dua pihak dalam permainan.' },
      { en: 'Move', ms: 'Langkah', text: 'Satu pergerakan buah oleh seorang pemain.' },
      { en: 'Checkmate', ms: 'Checkmate (mat)', text: 'Raja diserang dan tiada jalan keluar – permainan tamat.' },
    ],
    show: [{ fen: START, caption: 'Kedudukan permulaan. Putih di bawah, Hitam di atas. Putih bergerak dahulu.' }],
    practice: [
      { kind: 'choice', prompt: 'Siapa bergerak dahulu dalam catur?', options: ['Putih', 'Hitam', 'Sesiapa sahaja'], answer: 0, explain: 'Putih sentiasa memulakan permainan.' },
      { kind: 'choice', prompt: 'Berapa buah setiap pemain pada permulaan?', options: ['8', '16', '32'], answer: 1, explain: '16 buah: 8 Pion dan 8 buah lain.' },
    ],
    test: [
      { kind: 'choice', prompt: 'Apakah matlamat permainan catur?', options: ['Menangkap semua buah lawan', 'Memberi checkmate kepada Raja lawan', 'Membawa Pion ke hujung papan'], answer: 1, explain: 'Checkmate menamatkan permainan, walaupun lawan masih ada banyak buah.' },
      { kind: 'choice', prompt: 'Bolehkah anda melepaskan giliran anda?', options: ['Ya, bila-bila masa', 'Tidak – anda mesti bergerak setiap giliran'], answer: 1, explain: 'Setiap giliran anda wajib membuat satu langkah sah.' },
    ],
    review: ['Dua pemain, 16 buah setiap seorang.', 'Putih bergerak dahulu, kemudian bergilir-gilir.', 'Matlamat: checkmate Raja lawan.'],
  },
  {
    id: 'f02-board', module: 'fundamentals', title: 'Memahami papan catur', titleEn: 'Understanding the chessboard', minutes: 10,
    explain: [
      'Papan catur (chessboard) mempunyai 64 petak (squares): 8 baris × 8 lajur, berselang-seli cerah dan gelap.',
      'Peraturan emas memasang papan: petak di SUDUT KANAN BAWAH setiap pemain mesti petak CERAH. Ingat: "light on right".',
      'Buah Putih bermula di dua baris bawah (baris 1 dan 2); buah Hitam di dua baris atas (baris 7 dan 8).',
    ],
    show: [{ fen: START, caption: 'Petak h1 (sudut kanan bawah Putih) berwarna cerah.', highlights: ['h1', 'a8'] }],
    practice: [{ kind: 'square', fen: START, prompt: 'Ketik petak di sudut kanan bawah dari pihak Putih.', answers: ['h1'], explain: 'h1 – petak cerah. "Light on right".' }],
    test: [
      { kind: 'choice', prompt: 'Berapa petak ada pada papan catur?', options: ['48', '64', '100'], answer: 1, explain: '8 × 8 = 64.' },
      { kind: 'choice', prompt: 'Apakah warna petak di sudut kanan bawah setiap pemain?', options: ['Gelap', 'Cerah'], answer: 1, explain: 'Sentiasa cerah – jika gelap, papan dipasang salah.' },
    ],
    review: ['64 petak, berselang-seli cerah dan gelap.', '"Light on right": petak kanan bawah mesti cerah.'],
  },
  {
    id: 'f03-files-ranks', module: 'fundamentals', title: 'Files dan ranks', titleEn: 'Files and ranks', minutes: 15,
    explain: [
      'File (fail) ialah lajur MENEGAK. Ada 8 fail, dinamakan a hingga h dari kiri ke kanan (dari pihak Putih).',
      'Rank ialah baris MENDATAR. Ada 8 rank, dinombor 1 hingga 8 dari pihak Putih ke pihak Hitam.',
      'Nama setiap petak = huruf fail + nombor rank. Contoh: e4 = fail e, rank 4.',
      'Diagonal ialah garisan serong petak yang sama warna, contohnya a1–h8.',
    ],
    terms: [
      { en: 'File', ms: 'Fail (lajur)', text: 'Garisan menegak a–h.' },
      { en: 'Rank', ms: 'Baris', text: 'Garisan mendatar 1–8.' },
      { en: 'Diagonal', ms: 'Diagonal (serong)', text: 'Garisan serong petak sama warna.' },
    ],
    show: [{ fen: '8/8/8/8/8/8/8/8 w - - 0 1', caption: 'e4: cari fail e, kemudian naik ke rank 4.', highlights: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4'] }],
    practice: [
      { kind: 'square', fen: '8/8/8/8/8/8/8/8 w - - 0 1', prompt: 'Ketik petak e4.', answers: ['e4'], explain: 'Fail e, rank 4.' },
      { kind: 'square', fen: '8/8/8/8/8/8/8/8 w - - 0 1', prompt: 'Ketik petak a8.', answers: ['a8'], explain: 'Sudut kiri atas dari pihak Putih.' },
    ],
    test: [
      { kind: 'square', fen: '8/8/8/8/8/8/8/8 w - - 0 1', prompt: 'Ketik petak d5.', answers: ['d5'], explain: 'Fail d, rank 5.' },
      { kind: 'choice', prompt: 'File ialah…', options: ['Lajur menegak (a–h)', 'Baris mendatar (1–8)'], answer: 0, explain: 'File = menegak, rank = mendatar.' },
    ],
    review: ['File = lajur a–h.', 'Rank = baris 1–8.', 'Petak = file + rank, contoh g7.'],
  },
  {
    id: 'f04-squares', module: 'fundamentals', title: '64 petak dan petak tengah', titleEn: 'Understanding the 64 squares', minutes: 10,
    explain: [
      'Setiap petak ada nama unik. Petak yang paling penting ialah empat petak TENGAH: d4, e4, d5 dan e5.',
      'Buah di tengah mengawal lebih banyak petak dan boleh bergerak ke kedua-dua sayap dengan cepat. Sebab itu pemain menyerang bermula dengan merebut tengah.',
      'Sayap Raja (king-side) = fail e–h. Sayap Menteri (queen-side) = fail a–d.',
    ],
    show: [{ fen: '8/8/8/8/8/8/8/8 w - - 0 1', caption: 'Empat petak tengah.', highlights: ['d4', 'e4', 'd5', 'e5'] }],
    practice: [{ kind: 'square', fen: '8/8/8/8/8/8/8/8 w - - 0 1', prompt: 'Ketik mana-mana petak tengah.', answers: ['d4', 'e4', 'd5', 'e5'], explain: 'd4, e4, d5, e5 ialah petak tengah.' }],
    test: [
      { kind: 'square', fen: '8/8/8/8/8/8/8/8 w - - 0 1', prompt: 'Ketik petak g7.', answers: ['g7'], explain: 'Fail g, rank 7.' },
      { kind: 'choice', prompt: 'Kenapa petak tengah penting?', options: ['Buah di tengah mengawal lebih banyak petak', 'Petak tengah lebih besar', 'Raja mesti duduk di tengah'], answer: 0, explain: 'Kuda di d4 mengawal 8 petak; Kuda di a1 hanya 2.' },
    ],
    review: ['Petak tengah: d4, e4, d5, e5.', 'Sayap Raja: e–h; sayap Menteri: a–d.'],
  },
  {
    id: 'f05-pieces', module: 'fundamentals', title: 'Mengenal enam buah catur', titleEn: 'Identifying the six pieces', minutes: 15,
    explain: [
      'Raja (King) – buah paling penting. Nilai: tidak ternilai.',
      'Menteri (Queen) – paling kuat, nilai 9. Ia bermula di petak warnanya sendiri: Menteri Putih di d1 (cerah), Menteri Hitam di d8 (gelap).',
      'Benteng (Rook) – nilai 5, di sudut. Gajah (Bishop) – nilai 3, sebelah Raja dan Menteri. Kuda (Knight) – nilai 3, sebelah Benteng.',
      'Pion (Pawn) – nilai 1, lapan di baris kedua. Nilai membantu anda menilai pertukaran: jangan beri Benteng (5) untuk Kuda (3).',
    ],
    terms: [
      { en: 'King', ms: 'Raja', text: 'Tidak ternilai.' },
      { en: 'Queen', ms: 'Menteri', text: 'Nilai 9.' },
      { en: 'Rook', ms: 'Benteng', text: 'Nilai 5.' },
      { en: 'Bishop', ms: 'Gajah', text: 'Nilai 3.' },
      { en: 'Knight', ms: 'Kuda', text: 'Nilai 3.' },
      { en: 'Pawn', ms: 'Pion', text: 'Nilai 1.' },
    ],
    show: [{ fen: START, caption: 'Susunan permulaan: Benteng, Kuda, Gajah, Menteri, Raja, Gajah, Kuda, Benteng.', highlights: ['d1', 'e1'] }],
    practice: [
      { kind: 'square', fen: START, prompt: 'Ketik Menteri Putih.', answers: ['d1'], explain: 'd1 – Menteri Putih di petak cerah.' },
      { kind: 'square', fen: START, prompt: 'Ketik salah satu Kuda Hitam.', answers: ['b8', 'g8'], explain: 'Kuda di sebelah Benteng: b8 dan g8.' },
    ],
    test: [
      { kind: 'square', fen: START, prompt: 'Ketik Raja Hitam.', answers: ['e8'], explain: 'e8.' },
      { kind: 'choice', prompt: '"Bishop" dalam Bahasa Melayu ialah…', options: ['Kuda', 'Gajah', 'Benteng'], answer: 1, explain: 'Bishop = Gajah.' },
      { kind: 'choice', prompt: 'Berapakah nilai Benteng?', options: ['3', '5', '9'], answer: 1, explain: 'Benteng = 5.' },
    ],
    review: ['Raja, Menteri (9), Benteng (5), Gajah (3), Kuda (3), Pion (1).', 'Menteri bermula di petak warnanya sendiri.'],
  },
  {
    id: 'f06-movement', module: 'fundamentals', title: 'Cara setiap buah bergerak', titleEn: 'Movement of every piece', minutes: 20,
    explain: [
      'Raja: satu petak ke mana-mana arah. Menteri: berapa petak pun, lurus atau serong.',
      'Benteng: berapa petak pun, lurus (menegak atau mendatar). Gajah: berapa petak pun, serong.',
      'Kuda: bentuk "L" – dua petak satu arah, satu petak ke tepi. Hanya Kuda boleh melompat melepasi buah lain.',
      'Pion: maju satu petak (dua petak pada langkah pertama). Menangkap serong ke hadapan. Tidak boleh berundur.',
      'Tiada buah (kecuali Kuda) boleh melompat. Anda tidak boleh berhenti di petak buah anda sendiri.',
    ],
    show: [
      { fen: START, caption: 'Langkah pembukaan biasa.', moves: [{ san: 'e4', note: 'Pion maju dua petak.' }, { san: 'e5', note: 'Hitam juga.' }, { san: 'Nf3', note: 'Kuda melompat dalam bentuk L.' }, { san: 'Nc6', note: 'Kuda Hitam.' }, { san: 'Bc4', note: 'Gajah bergerak serong.' }] },
      { fen: '4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1', caption: 'Menteri di d4 mengawal 27 petak di papan kosong – lurus dan serong.' },
    ],
    practice: [
      { kind: 'move', fen: START, prompt: 'Gerakkan Kuda dari g1 ke f3.', accept: mv(START, 'g1', 'f3'), explain: 'Nf3 – dua petak ke atas, satu ke kiri.' },
      { kind: 'move', fen: after(['e4', 'e5']), prompt: 'Gerakkan Gajah f1 ke c4.', accept: mv(after(['e4', 'e5']), 'f1', 'c4'), explain: 'Bc4 – Gajah bergerak serong.' },
    ],
    test: [
      { kind: 'move', fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', prompt: 'Gerakkan Benteng ke a8.', accept: mv('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1', 'a8'), explain: 'Benteng bergerak lurus; ia juga memberi check di a8!' },
      { kind: 'choice', prompt: 'Buah manakah boleh melompat melepasi buah lain?', options: ['Gajah', 'Kuda', 'Menteri'], answer: 1, explain: 'Hanya Kuda.' },
      { kind: 'choice', prompt: 'Bagaimana Pion menangkap?', options: ['Lurus ke hadapan', 'Serong ke hadapan', 'Ke belakang'], answer: 1, explain: 'Pion bergerak lurus tetapi menangkap serong.' },
    ],
    review: ['Raja 1 petak; Menteri lurus+serong; Benteng lurus; Gajah serong; Kuda L; Pion maju, tangkap serong.'],
  },
  {
    id: 'f07-capture', module: 'fundamentals', title: 'Menangkap buah', titleEn: 'Capturing pieces', minutes: 15,
    explain: [
      'Menangkap (capture) = bergerak ke petak buah lawan. Buah lawan dikeluarkan dari papan.',
      'Semua buah menangkap dengan cara mereka bergerak – kecuali Pion yang menangkap serong.',
      'Sebelum menangkap, tanya: adakah buah itu dilindungi? Jika ya, buah saya mungkin ditangkap semula. Bandingkan nilai!',
      'Buah lawan yang tidak dilindungi dipanggil "buah tergantung" (hanging piece) – ambil secara percuma.',
    ],
    show: [{ fen: '4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1', caption: 'Pion e4 boleh menangkap Menteri di d5 secara serong.', highlights: ['e4', 'd5'] }],
    practice: [{ kind: 'move', fen: '4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1', prompt: 'Tangkap Menteri Hitam.', accept: mv('4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1', 'e4', 'd5'), explain: 'exd5 – Pion (1) menangkap Menteri (9). Pertukaran yang hebat!' }],
    test: [
      { kind: 'move', fen: '4k3/8/5n2/8/8/2B5/8/4K3 w - - 0 1', prompt: 'Tangkap buah tergantung.', accept: mv('4k3/8/5n2/8/8/2B5/8/4K3 w - - 0 1', 'c3', 'f6'), explain: 'Bxf6 – Kuda di f6 tiada pelindung.' },
      { kind: 'choice', prompt: 'Benteng (5) menangkap Kuda (3) yang dilindungi oleh Pion. Selepas Pion menangkap semula, siapa untung?', options: ['Pemain Benteng untung 2', 'Pemain Benteng rugi 2', 'Sama'], answer: 1, explain: 'Beri 5, dapat 3 = rugi 2.' },
    ],
    review: ['Tangkap = bergerak ke petak buah lawan.', 'Semak pertahanan dan bandingkan nilai sebelum menangkap.'],
  },
  {
    id: 'f08-check', module: 'fundamentals', title: 'Check', titleEn: 'Check', minutes: 15,
    explain: [
      'Check = Raja sedang diserang. Raja yang dalam check MESTI diselamatkan dengan segera.',
      'Tiga cara keluar dari check: (1) LARI – gerakkan Raja ke petak selamat, (2) HALANG – letak buah di antara, (3) TANGKAP buah yang menyerang.',
      'Anda tidak boleh membuat langkah yang meninggalkan Raja sendiri dalam check.',
      'Dalam notasi, check ditulis dengan tanda "+", contoh Bb5+.',
    ],
    show: [{ fen: CHECKED, caption: 'Gajah b4 memberi check kepada Raja e1 melalui c3 dan d2. Tiada buah boleh menghalang di sini, jadi Raja mesti LARI (contoh Kf1 atau Ke2). Castling juga tidak dibenarkan semasa dalam check.', highlights: ['b4', 'c3', 'd2', 'e1'] }],
    practice: [
      { kind: 'move', fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', prompt: 'Beri check kepada Raja Hitam.', accept: movesWhere('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', (m) => m.san.includes('+')), explain: 'Ra8+ – Benteng menyerang Raja di baris 8.' },
      { kind: 'choice', prompt: 'Apakah TIGA cara keluar dari check?', options: ['Lari, halang, tangkap', 'Castle, tukar Menteri, lepas giliran', 'Hanya lari'], answer: 0, explain: 'Lari, halang, tangkap.' },
    ],
    test: [
      { kind: 'move', fen: '4k3/8/8/8/8/8/3r4/4K3 w - - 0 1', prompt: 'Raja Putih dalam check oleh Benteng d2. Tangkap buah yang menyerang!', accept: mv('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1', 'e1', 'd2'), explain: 'Kxd2 – Benteng tidak dilindungi, jadi Raja boleh menangkapnya.' },
    ],
    review: ['Check = Raja diserang (+).', 'Lari, halang, tangkap.'],
  },
  {
    id: 'f09-checkmate', module: 'fundamentals', title: 'Checkmate', titleEn: 'Checkmate', minutes: 20,
    explain: [
      'Checkmate = Raja dalam check DAN tiada cara untuk keluar (tidak boleh lari, halang atau tangkap). Permainan tamat – pemain yang memberi checkmate menang.',
      'Notasi: "#", contoh Qh7#.',
      'Corak paling biasa untuk pemula: back-rank mate (Raja terperangkap di belakang Pionnya sendiri) dan mat dengan Menteri yang dilindungi.',
    ],
    show: [{ fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', caption: 'Back-rank mate: Ra8# – Pion f7, g7, h7 menghalang Raja Hitam lari.', moves: [{ san: 'Ra8#', note: 'Checkmate!' }] }],
    practice: [
      { kind: 'mate', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', prompt: 'Beri checkmate dalam satu langkah.', explain: 'Ra8# – back-rank mate.' },
      { kind: 'mate', fen: '7k/8/6K1/8/8/8/Q7/8 w - - 0 1', prompt: 'Beri checkmate dengan Menteri.', explain: 'Qa8# – Raja Putih mengawal g7 dan h7.' },
    ],
    test: [
      { kind: 'mate', fen: '5rk1/5pp1/8/6NQ/8/8/5PPP/6K1 w - - 0 1', prompt: 'Beri checkmate dalam satu langkah.', explain: 'Qh7# – Menteri dilindungi oleh Kuda g5.' },
      { kind: 'choice', prompt: 'Raja dalam check tetapi boleh lari ke satu petak selamat. Adakah ini checkmate?', options: ['Ya', 'Tidak'], answer: 1, explain: 'Selagi ada jalan keluar, ia hanya check.' },
    ],
    review: ['Checkmate = check tanpa jalan keluar (#).', 'Back-rank mate: periksa baris belakang lawan!'],
  },
  {
    id: 'f10-stalemate', module: 'fundamentals', title: 'Stalemate', titleEn: 'Stalemate', minutes: 15,
    explain: [
      'Stalemate = pemain yang bergilir TIDAK dalam check, tetapi tiada langkah sah. Keputusannya SERI.',
      'Ini perangkap untuk pemain yang sedang menang: jika anda mengepung Raja lawan tanpa memberi check, anda mungkin hanya mendapat seri!',
      'Apabila lawan hanya ada Raja, pastikan Raja itu sentiasa ada sekurang-kurangnya satu langkah – sehingga anda memberi checkmate.',
    ],
    show: [{ fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', caption: 'Stalemate: Hitam bergilir, tidak dalam check, tetapi tiada petak selamat. Seri!' }],
    practice: [{ kind: 'choice', fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', prompt: 'Hitam bergilir. Apakah keputusannya?', options: ['Checkmate – Putih menang', 'Stalemate – seri', 'Permainan diteruskan'], answer: 1, explain: 'Raja Hitam tidak dalam check dan tiada langkah sah.' }],
    test: [{ kind: 'mate', fen: '7k/4Q3/6K1/8/8/8/8/8 w - - 0 1', prompt: 'Putih bergerak. Beri checkmate – JANGAN buat stalemate!', explain: 'Qe8#, Qf8#, Qg7# atau Qh7# memberi checkmate. Qf7?? ialah stalemate.' }],
    review: ['Stalemate = tiada langkah sah tanpa check = seri.', 'Semasa menang, beri ruang kepada Raja lawan sehingga mat.'],
  },
  {
    id: 'f11-castling', module: 'fundamentals', title: 'Castling', titleEn: 'Castling', minutes: 15,
    explain: [
      'Castling = satu langkah istimewa yang menggerakkan Raja dua petak ke arah Benteng, dan Benteng melompat ke sebelah lain Raja.',
      'O-O = castling sebelah Raja (kingside). O-O-O = castling sebelah Menteri (queenside).',
      'Syarat: Raja dan Benteng belum pernah bergerak; tiada buah di antara mereka; Raja TIDAK dalam check, tidak melalui petak yang diserang, dan tidak berakhir dalam check.',
      'Castling awal = Raja selamat + Benteng masuk ke permainan. Penting sebelum menyerang!',
    ],
    show: [{ fen: CASTLE, caption: 'Kedua-dua pihak boleh castle.', moves: [{ san: 'O-O', note: 'Raja e1→g1, Benteng h1→f1.' }, { san: 'O-O-O', note: 'Raja e8→c8, Benteng a8→d8.' }] }],
    practice: [{ kind: 'move', fen: CASTLE, prompt: 'Castle sebelah Raja (kingside). Gerakkan Raja dua petak ke kanan.', accept: ['O-O'], explain: 'O-O – Raja ke g1 dan Benteng ke f1.' }],
    test: [
      { kind: 'move', fen: CASTLE, prompt: 'Castle sebelah Menteri (queenside).', accept: ['O-O-O'], explain: 'O-O-O – Raja ke c1, Benteng ke d1.' },
      { kind: 'choice', prompt: 'Bilakah castling TIDAK dibenarkan?', options: ['Apabila Raja sedang dalam check', 'Apabila Menteri masih di papan', 'Selepas langkah ke-10'], answer: 0, explain: 'Tidak boleh castle untuk keluar dari check.' },
    ],
    review: ['O-O / O-O-O.', 'Raja & Benteng belum bergerak, laluan kosong, tiada check di sepanjang laluan Raja.'],
  },
  {
    id: 'f12-en-passant', module: 'fundamentals', title: 'En passant', titleEn: 'En passant', minutes: 15,
    explain: [
      'En passant ("semasa lalu") ialah tangkapan istimewa Pion.',
      'Jika Pion lawan maju DUA petak dari kedudukan asal dan berhenti betul-betul di sebelah Pion anda, Pion anda boleh menangkapnya seolah-olah ia hanya maju satu petak.',
      'Ia mesti dibuat SERTA-MERTA pada langkah seterusnya – jika tidak, peluang itu hilang.',
    ],
    show: [{ fen: after(['e4', 'a6', 'e5']), caption: 'Pion Putih di e5. Hitam bermain …d5 (dua petak).', moves: [{ san: 'd5', note: 'Pion Hitam melepasi d6.' }, { san: 'exd6', note: 'En passant! Pion d5 dikeluarkan, Pion Putih ke d6.' }] }],
    practice: [{ kind: 'move', fen: EP, prompt: 'Hitam baru bermain …d7-d5. Tangkap secara en passant.', accept: mv(EP, 'e5', 'd6'), explain: 'exd6 e.p. – Pion e5 menangkap ke d6.' }],
    test: [{ kind: 'choice', prompt: 'Bila en passant mesti dibuat?', options: ['Bila-bila masa', 'Serta-merta selepas Pion lawan maju dua petak', 'Hanya dalam endgame'], answer: 1, explain: 'Hanya pada langkah berikutnya.' }],
    review: ['En passant: Pion lawan maju dua petak ke sebelah Pion anda → tangkap serong ke petak yang dilepasinya, serta-merta.'],
  },
  {
    id: 'f13-promotion', module: 'fundamentals', title: 'Promosi Pion', titleEn: 'Pawn promotion', minutes: 10,
    explain: [
      'Apabila Pion sampai ke baris terakhir (rank 8 untuk Putih, rank 1 untuk Hitam), ia MESTI dinaikkan pangkat (promotion).',
      'Anda memilih Menteri, Benteng, Gajah atau Kuda – biasanya Menteri kerana paling kuat. Anda boleh ada dua Menteri!',
      'Kadang-kadang Kuda lebih baik (underpromotion) – contohnya jika ia memberi check atau fork.',
    ],
    show: [{ fen: PROMO, caption: 'Pion e7 satu langkah dari promosi.', moves: [{ san: 'e8=Q', note: 'Pion menjadi Menteri.' }] }],
    practice: [{ kind: 'move', fen: PROMO, prompt: 'Naikkan pangkat Pion menjadi Menteri.', accept: movesWhere(PROMO, (m) => m.to === 'e8' && m.san.includes('=Q')), explain: 'e8=Q.' }],
    test: [{ kind: 'choice', prompt: 'Pion Putih sampai ke rank 8. Buah apa yang TIDAK boleh dipilih?', options: ['Menteri', 'Kuda', 'Raja'], answer: 2, explain: 'Tidak boleh menjadi Raja (atau kekal Pion).' }],
    review: ['Pion di baris terakhir → Menteri, Benteng, Gajah atau Kuda.'],
  },
  {
    id: 'f14-draws', module: 'fundamentals', title: 'Syarat seri', titleEn: 'Draw conditions', minutes: 15,
    explain: [
      'Seri (draw) berlaku apabila: (1) stalemate; (2) bahan tidak mencukupi untuk checkmate (contoh Raja lawan Raja, atau Raja + Gajah lawan Raja); (3) kedudukan yang sama berulang tiga kali (threefold repetition); (4) 50 langkah setiap pihak tanpa tangkapan atau langkah Pion (peraturan 50 langkah); (5) persetujuan kedua-dua pemain.',
      'Dalam aplikasi ini, pengulangan tiga kali terus diisytiharkan seri (dalam pertandingan rasmi, pemain perlu menuntutnya).',
      'Pemain agresif: jika anda menang, elakkan pengulangan dan stalemate. Jika anda kalah, cari seri!',
    ],
    show: [{ fen: '8/8/4k3/8/8/3BK3/8/8 w - - 0 1', caption: 'Raja + Gajah lawan Raja: bahan tidak mencukupi – seri.' }],
    practice: [{ kind: 'choice', prompt: 'Raja + Kuda lawan Raja sahaja. Apakah keputusannya?', options: ['Putih menang', 'Seri – bahan tidak mencukupi'], answer: 1, explain: 'Satu Kuda atau satu Gajah tidak boleh memberi checkmate.' }],
    test: [
      { kind: 'choice', prompt: 'Kedudukan yang sama berlaku tiga kali. Apakah ini?', options: ['Threefold repetition – seri', 'Stalemate', 'Checkmate'], answer: 0, explain: 'Pengulangan tiga kali.' },
      { kind: 'choice', prompt: 'Raja + Benteng lawan Raja. Adakah bahan mencukupi untuk menang?', options: ['Ya', 'Tidak'], answer: 0, explain: 'Raja + Benteng boleh memberi checkmate (lihat pelajaran endgame).' },
    ],
    review: ['Stalemate, bahan tidak cukup, ulang 3 kali, 50 langkah, persetujuan.'],
  },
  {
    id: 'f15-notation', module: 'fundamentals', title: 'Notasi catur: SAN dan UCI', titleEn: 'Chess notation (SAN & UCI)', minutes: 20,
    explain: [
      'SAN (Standard Algebraic Notation): huruf buah + petak tujuan. K = Raja, Q = Menteri, R = Benteng, B = Gajah, N = Kuda (Knight). Pion tiada huruf: "e4".',
      'x = tangkap (Bxc6), + = check, # = checkmate, O-O / O-O-O = castling, =Q = promosi.',
      'Jika dua buah sama boleh ke petak yang sama, tambah fail atau rank asal: Nbd2, R1e2.',
      'UCI (yang digunakan enjin): petak asal + petak tujuan, contoh e2e4, g1f3, e7e8q.',
    ],
    show: [{ fen: START, caption: 'Contoh SAN.', moves: [{ san: 'e4', note: 'Pion ke e4 (UCI: e2e4).' }, { san: 'e5', note: 'e7e5.' }, { san: 'Nf3', note: 'Kuda ke f3 (g1f3).' }, { san: 'Nc6', note: 'b8c6.' }, { san: 'Bb5', note: 'Gajah ke b5 (f1b5).' }] }],
    practice: [
      { kind: 'choice', prompt: 'Apakah maksud "Nf3"?', options: ['Pion ke f3', 'Kuda ke f3', 'Raja ke f3'], answer: 1, explain: 'N = Knight = Kuda.' },
      { kind: 'move', fen: START, prompt: 'Mainkan langkah UCI "e2e4".', accept: ['e4'], explain: 'e2e4 dalam SAN ialah e4.' },
    ],
    test: [
      { kind: 'choice', prompt: 'Apakah format UCI untuk Kuda g1 ke f3?', options: ['Nf3', 'g1f3', 'N-f3'], answer: 1, explain: 'UCI = petak asal + petak tujuan.' },
      { kind: 'choice', prompt: 'Apakah maksud "#"?', options: ['Check', 'Checkmate', 'Tangkap'], answer: 1, explain: '# = checkmate.' },
      { kind: 'choice', prompt: 'Apakah maksud "Bxe5+"?', options: ['Gajah menangkap di e5 dengan check', 'Benteng ke e5', 'Gajah ke e5 tanpa tangkapan'], answer: 0, explain: 'B = Gajah, x = tangkap, + = check.' },
    ],
    review: ['SAN: huruf buah + petak, x, +, #, O-O, =Q.', 'UCI: petak asal + petak tujuan.'],
  },

  // ------------------------------------------------------------------ ATTACK & DEFENCE
  {
    id: 'a01-king-safety', module: 'attack', title: 'Keselamatan Raja dahulu', titleEn: 'King safety', minutes: 20,
    explain: [
      'Sebelum menyerang Raja lawan, pastikan Raja anda selamat. Penyerang yang Rajanya terdedah selalunya kalah dahulu.',
      'Castle awal. Jangan gerakkan Pion di depan Raja (f, g, h) tanpa sebab – setiap langkah Pion membuka lubang.',
      'Luft: langkah Pion h3/h6 memberi Raja petak lari dan mengelakkan back-rank mate. Buat apabila tiada perkara mendesak.',
    ],
    show: [{ fen: ITALIAN, caption: 'Italian Game: Putih perlu castle sebelum menyerang.', moves: [{ san: 'O-O', note: 'Raja selamat; Benteng f1 bersedia.' }] }],
    practice: [{ kind: 'move', fen: ITALIAN, prompt: 'Selamatkan Raja Putih.', accept: ['O-O'], explain: 'O-O – castle sebelum menyerang.' }],
    test: [
      { kind: 'choice', prompt: 'Raja anda belum castle dan lawan membuka fail e. Apa keutamaan?', options: ['Castle secepat mungkin', 'Tolak Pion g dan h untuk menyerang', 'Gerakkan Menteri ke sayap lawan'], answer: 0, explain: 'Raja di fail terbuka sangat berbahaya.' },
      { kind: 'choice', prompt: 'Kenapa langkah h3 (luft) berguna?', options: ['Memberi Raja petak lari dari back-rank mate', 'Menyerang Raja lawan', 'Membangunkan Gajah'], answer: 0, explain: 'Luft = "udara" untuk Raja.' },
    ],
    review: ['Raja selamat dahulu, kemudian serang.', 'Jangan lemahkan perisai Pion tanpa sebab.'],
  },
  {
    id: 'a02-coordination', module: 'attack', title: 'Koordinasi buah', titleEn: 'Piece coordination', minutes: 20,
    explain: [
      'Serangan berjaya apabila LEBIH banyak buah menyerang daripada yang bertahan. Kira: penyerang lawan pembela.',
      'Satu Menteri seorang diri jarang memberi checkmate. Menteri + Kuda, Menteri + Gajah, atau dua Benteng – buah yang bekerjasama.',
      'Bawa buah yang paling pasif ke dalam serangan dahulu ("perbaiki buah terburuk").',
    ],
    show: [{ fen: '5rk1/5pp1/8/6NQ/8/8/5PPP/6K1 w - - 0 1', caption: 'Menteri + Kuda bekerjasama pada h7.', moves: [{ san: 'Qh7#', note: 'Kuda g5 melindungi Menteri – checkmate.' }] }],
    practice: [{ kind: 'mate', fen: '5rk1/5pp1/8/6NQ/8/8/5PPP/6K1 w - - 0 1', prompt: 'Beri checkmate dengan kerjasama buah.', explain: 'Qh7# – dilindungi oleh Kuda g5.' }],
    test: [
      { kind: 'mate', fen: '6k1/5ppp/8/8/8/8/1Q6/1R4K1 w - - 0 1', prompt: 'Dua buah berat bekerjasama: beri checkmate.', explain: 'Qb8# atau Rb8# – back-rank mate, buah satu lagi melindungi.' },
      { kind: 'choice', prompt: 'Lawan mempertahankan Raja dengan 2 buah. Anda menyerang dengan 1. Apa patut dibuat?', options: ['Korbankan buah segera', 'Bawa lebih banyak buah ke dalam serangan dahulu', 'Berhenti menyerang selamanya'], answer: 1, explain: 'Penyerang mesti melebihi pembela.' },
    ],
    review: ['Kira penyerang lawan pembela.', 'Buah bekerjasama memberi checkmate.'],
  },
  {
    id: 'a03-castled-king', module: 'attack', title: 'Menyerang Raja yang sudah castle', titleEn: 'Attacking the castled king', minutes: 25,
    explain: [
      'Sasaran klasik: petak h7/h2 dan f7/f2, serta fail terbuka di depan Raja.',
      'Castle bertentangan (Raja di sayap berbeza): tolak Pion ke arah Raja lawan (pawn storm) – Pion anda tidak melindungi Raja anda sendiri.',
      'Castle sama sayap: lebih banyak guna buah (Kuda ke g5, Menteri ke h5, Benteng ke fail ketiga).',
      'Greek gift (Bxh7+) berkesan HANYA jika: Gajah di d3, Kuda boleh ke g5, Menteri boleh ke h5, dan Kuda f6 lawan sudah tiada. Kira dahulu!',
    ],
    show: [{ fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', caption: 'Pion lawan di f7, g7, h7 menjadi penjara untuk Raja sendiri.', highlights: ['f7', 'g7', 'h7'] }],
    practice: [
      { kind: 'mate', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', prompt: 'Raja Hitam terperangkap di belakang Pionnya. Beri checkmate.', explain: 'Rd8# – Pion f7, g7, h7 menghalang Raja lari.' },
      { kind: 'choice', prompt: 'Putih castle ke c1, Hitam ke g8. Rancangan yang baik untuk Putih?', options: ['Pawn storm g4-g5, h4-h5', 'Tolak Pion a, b dan c', 'Tukar semua buah'], answer: 0, explain: 'Pion sayap Raja Putih tidak melindungi Raja Putih (di c1), jadi ia boleh menyerang.' },
    ],
    test: [
      { kind: 'choice', prompt: 'Bilakah Greek gift (Bxh7+) berkemungkinan berkesan?', options: ['Bila-bila masa Raja lawan di g8', 'Bila Kuda boleh ke g5, Menteri ke h5, dan tiada Kuda f6 lawan', 'Hanya jika anda kalah bahan'], answer: 1, explain: 'Syarat mesti ada – jika tidak, ia hanya kehilangan Gajah.' },
      { kind: 'mate', fen: '6k1/5ppp/8/8/8/8/5PPP/1Q4K1 w - - 0 1', prompt: 'Beri checkmate di baris belakang.', explain: 'Qb8# – back-rank mate.' },
    ],
    review: ['Sasaran: h7/h2, f7/f2, fail terbuka.', 'Castle bertentangan → pawn storm.', 'Pengorbanan perlu syarat dan pengiraan.'],
  },
  {
    id: 'a04-defence', module: 'attack', title: 'Teknik pertahanan', titleEn: 'Defensive techniques', minutes: 20,
    explain: [
      'Apabila buah anda diserang, ada lima pilihan: (1) LARI, (2) LINDUNG dengan buah lain, (3) HALANG garisan serangan, (4) TANGKAP penyerang, (5) SERANG BALAS yang lebih besar.',
      'Pilih jawapan yang paling aktif yang masih selamat. Pertahanan pasif terlalu lama biasanya gagal.',
      'Selalu tanya selepas setiap langkah lawan: "Apa yang diancam?" – ini senjata pertahanan terbaik.',
    ],
    show: [{ fen: '4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', caption: 'Kuda e4 diserang oleh Pion d5 dan tidak boleh dilindungi dengan baik – ia perlu lari.', highlights: ['d5', 'e4'] }],
    practice: [{
      kind: 'move', fen: '4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', prompt: 'Selamatkan Kuda ke petak yang tidak diserang.',
      accept: movesWhere('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', (m) => m.piece === 'n' && !new Chess('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1').isAttacked(m.to, 'b')),
      explain: 'Kuda lari ke petak yang tidak dikawal oleh Pion atau Raja Hitam.',
    }],
    test: [
      { kind: 'move', fen: '4k3/8/8/8/8/2b5/8/R3K3 w - - 0 1', prompt: 'Raja Putih dalam check oleh Gajah c3. Pilih langkah yang selamat.', accept: movesWhere('4k3/8/8/8/8/2b5/8/R3K3 w - - 0 1', () => true), explain: 'Semua langkah sah di sini keluar dari check: lari atau halang.' },
      { kind: 'choice', prompt: 'Lawan mengancam Menteri anda. Anda pula boleh memberi checkmate sekarang. Apa patut dibuat?', options: ['Selamatkan Menteri', 'Beri checkmate!'], answer: 1, explain: 'Serangan balas yang lebih besar menang – checkmate menamatkan permainan.' },
    ],
    review: ['Lari, lindung, halang, tangkap, serang balas.', 'Selepas setiap langkah lawan: apa ancamannya?'],
  },
  {
    id: 'a05-counterattack', module: 'attack', title: 'Serangan balas dan zwischenzug', titleEn: 'Counterattacks and zwischenzug', minutes: 20,
    explain: [
      'Serangan balas (counterattack): daripada bertahan, cipta ancaman yang lebih besar supaya lawan perlu menjawab anda.',
      'Zwischenzug (langkah perantaraan): sebelum membuat langkah "wajib" (contohnya menangkap semula), mainkan dahulu langkah memaksa – check atau ancaman besar – kemudian baru tangkap semula.',
      'Ia hanya berkesan jika langkah perantaraan itu benar-benar memaksa. Kira!',
    ],
    show: [{ fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', caption: 'Check ialah langkah perantaraan yang paling biasa – lawan wajib menjawab.' }],
    practice: [{ kind: 'choice', prompt: 'Lawan menangkap Kuda anda. Anda boleh tangkap semula, ATAU beri check yang juga menyerang Menteri lawan dahulu. Apa namanya?', options: ['Zwischenzug', 'En passant', 'Stalemate'], answer: 0, explain: 'Langkah perantaraan yang memaksa sebelum menangkap semula.' }],
    test: [{ kind: 'choice', prompt: 'Bilakah zwischenzug berbahaya untuk diri sendiri?', options: ['Apabila ia tidak memaksa – lawan boleh mengabaikannya', 'Apabila ia memberi check', 'Tidak pernah'], answer: 0, explain: 'Jika lawan tidak perlu menjawab, anda hanya kehilangan masa (dan bahan).' }],
    review: ['Serangan balas > pertahanan pasif, jika ancamannya lebih besar.', 'Zwischenzug mesti memaksa.'],
  },
  {
    id: 'a06-calculation', module: 'attack', title: 'Agresif, bukan melulu', titleEn: 'Aggressive, not reckless', minutes: 20,
    explain: [
      'Sebelum setiap langkah serangan, semak CCT: Checks (check), Captures (tangkapan), Threats (ancaman) – untuk anda DAN lawan.',
      'Kira sekurang-kurangnya dua jawapan terbaik lawan. Jika satu jawapan mematahkan serangan anda, jangan main.',
      'Pengorbanan yang baik: anda nampak hasilnya (mat atau bahan kembali). Pengorbanan "harap-harap": hanya berjudi.',
      'Gunakan jurulatih dan enjin selepas permainan untuk menyemak sama ada pengorbanan anda betul.',
    ],
    show: [{ fen: ITALIAN, caption: 'Serangan terburu-buru seperti Bxf7+?? di sini hanya kehilangan Gajah: Raja menangkap dan tiada susulan.' }],
    practice: [{ kind: 'choice', fen: ITALIAN, prompt: 'Putih mempertimbangkan Bxf7+. Raja Hitam menangkap dan tiada buah Putih lain boleh menyerang. Keputusan?', options: ['Langkah hebat', 'Pengorbanan melulu – kehilangan Gajah', 'Checkmate'], answer: 1, explain: 'Tiada susulan = kehilangan 3 mata bahan.' }],
    test: [
      { kind: 'choice', prompt: 'Apakah maksud CCT?', options: ['Checks, Captures, Threats', 'Castle, Centre, Tempo', 'Check, Checkmate, Tie'], answer: 0, explain: 'Semak check, tangkapan dan ancaman bagi kedua-dua pihak.' },
      { kind: 'choice', prompt: 'Berapa banyak jawapan lawan yang patut anda kira sebelum langkah penting?', options: ['Sifar – ikut naluri', 'Sekurang-kurangnya dua yang terkuat', 'Hanya yang paling lemah'], answer: 1, explain: 'Kira jawapan terkuat lawan, bukan yang anda harapkan.' },
    ],
    review: ['CCT untuk kedua-dua pihak.', 'Kira dua jawapan lawan.', 'Korban hanya jika anda nampak hasilnya.'],
  },

  // ------------------------------------------------------------------ ENDGAME
  {
    id: 'e01-queen-mate', module: 'endgame', title: 'Mat dengan Menteri dan Raja', titleEn: 'King and queen mate', minutes: 25,
    explain: [
      'Raja + Menteri lawan Raja sentiasa menang. Langkah: (1) Menteri mengecilkan "kotak" Raja lawan dengan langkah Kuda dari Raja lawan, (2) bawa Raja anda mendekat, (3) beri mat di tepi papan.',
      'AWAS stalemate: apabila Raja lawan hanya ada sedikit petak, sentiasa pastikan ia ada sekurang-kurangnya satu langkah sehingga anda memberi mat.',
    ],
    show: [{ fen: '7k/8/6K1/8/8/8/Q7/8 w - - 0 1', caption: 'Raja Putih mengawal g7 dan h7. Menteri memberi mat di baris 8.', moves: [{ san: 'Qa8#', note: 'Checkmate!' }] }],
    practice: [{ kind: 'mate', fen: '7k/8/6K1/8/8/8/Q7/8 w - - 0 1', prompt: 'Beri checkmate.', explain: 'Qa8#.' }],
    test: [
      { kind: 'mate', fen: 'k7/8/1K6/8/8/8/7Q/8 w - - 0 1', prompt: 'Beri checkmate.', explain: 'Qh8# – Raja b6 mengawal a7 dan b7, Menteri menutup baris 8.' },
      { kind: 'choice', prompt: 'Raja lawan di h8, Menteri anda di f7, Raja anda di g6, giliran Hitam. Hitam tiada langkah dan tidak dalam check. Ini…', options: ['Checkmate', 'Stalemate – seri'], answer: 1, explain: 'Inilah sebab kita mesti berhati-hati!' },
    ],
    review: ['Kecilkan kotak, bawa Raja, mat di tepi.', 'Elakkan stalemate.'],
  },
  {
    id: 'e02-rook-mate', module: 'endgame', title: 'Mat dengan Benteng dan Raja', titleEn: 'King and rook mate', minutes: 25,
    explain: [
      'Raja + Benteng juga sentiasa menang, tetapi lebih perlahan. Benteng memotong Raja lawan ke satu bahagian papan; Raja anda mendekat untuk menyokong.',
      'Corak akhir: Raja anda berdepan dengan Raja lawan (opposition), Benteng memberi check di tepi papan.',
    ],
    show: [{ fen: '6k1/8/6K1/8/8/8/8/R7 w - - 0 1', caption: 'Raja-raja berdepan; Benteng memberi mat di baris 8.', moves: [{ san: 'Ra8#', note: 'Checkmate.' }] }],
    practice: [{ kind: 'mate', fen: '6k1/8/6K1/8/8/8/8/R7 w - - 0 1', prompt: 'Beri checkmate dengan Benteng.', explain: 'Ra8#.' }],
    test: [{ kind: 'mate', fen: '8/8/8/8/8/1K6/7R/k7 w - - 0 1', prompt: 'Beri checkmate.', explain: 'Rh1# – Raja b3 mengawal a2 dan b2, Benteng menutup baris 1.' }],
    review: ['Benteng memotong, Raja mendekat, mat di tepi.'],
  },
  {
    id: 'e03-opposition', module: 'endgame', title: 'Opposition', titleEn: 'Opposition', minutes: 25,
    explain: [
      'Opposition: dua Raja berdepan dengan SATU petak di antara, dan pihak LAWAN yang perlu bergerak. Pihak yang "memegang opposition" memaksa Raja lawan berundur.',
      'Dalam endgame Raja + Pion lawan Raja, Raja yang memegang opposition di hadapan Pion biasanya menentukan menang atau seri.',
      'Peraturan berguna: bawa Raja ke HADAPAN Pion anda, bukan di belakangnya.',
    ],
    show: [{ fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 0 1', caption: 'Raja e6 dan e8 berdepan; Hitam perlu bergerak – Putih memegang opposition.', highlights: ['e6', 'e8'] }],
    practice: [{ kind: 'choice', fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 0 1', prompt: 'Hitam perlu bergerak. Siapa memegang opposition?', options: ['Putih', 'Hitam'], answer: 0, explain: 'Raja berdepan, satu petak di antara, dan Hitam perlu bergerak.' }],
    test: [{ kind: 'choice', prompt: 'Dalam endgame Raja + Pion, di mana Raja anda patut berada?', options: ['Di hadapan Pion', 'Di belakang Pion', 'Jauh di sayap lain'], answer: 0, explain: 'Raja di hadapan Pion membuka jalan.' }],
    review: ['Opposition: Raja berdepan, satu petak, lawan perlu bergerak.', 'Raja di hadapan Pion.'],
  },
  {
    id: 'e04-passed-pawns', module: 'endgame', title: 'Pion lulus dan peraturan segi empat', titleEn: 'Passed pawns and the square rule', minutes: 20,
    explain: [
      'Pion lulus (passed pawn) tiada Pion lawan yang boleh menghalangnya. Dalam endgame, ia senjata paling kuat.',
      'Peraturan segi empat (rule of the square): lukis segi empat dari Pion ke baris promosi. Jika Raja lawan boleh masuk ke dalam segi empat itu pada gilirannya, ia boleh menangkap Pion. Jika tidak, Pion menjadi Menteri.',
      'Benteng diletakkan DI BELAKANG Pion lulus – sama ada Pion anda atau Pion lawan (peraturan Tarrasch).',
    ],
    show: [{ fen: '8/8/8/1P6/8/8/6k1/4K3 w - - 0 1', caption: 'Pion b5 – Raja Hitam di g2 terlalu jauh dari segi empat b5–b8–e8–e5.', highlights: ['b5', 'b8', 'e8', 'e5'] }],
    practice: [{ kind: 'move', fen: '8/8/8/1P6/8/8/6k1/4K3 w - - 0 1', prompt: 'Raja Hitam di luar segi empat. Tolak Pion!', accept: ['b6'], explain: 'b6, b7, b8=Q – Raja Hitam tidak sempat.', engineTolerance: 100 }],
    test: [{ kind: 'choice', prompt: 'Di mana Benteng patut diletakkan dalam endgame Pion lulus?', options: ['Di belakang Pion lulus', 'Di hadapan Pion lulus anda', 'Di sudut'], answer: 0, explain: 'Peraturan Tarrasch: Benteng di belakang Pion lulus.' }],
    review: ['Peraturan segi empat.', '"Pion lulus mesti ditolak".', 'Benteng di belakang Pion lulus.'],
  },
  {
    id: 'e05-active-king', module: 'endgame', title: 'Raja yang aktif', titleEn: 'The active king', minutes: 15,
    explain: [
      'Dalam pembukaan dan pertengahan, Raja bersembunyi. Dalam endgame (sedikit buah tinggal), Raja menjadi buah PENYERANG yang kuat – nilainya kira-kira 4 mata.',
      'Bawa Raja ke tengah papan seawal endgame bermula. Raja aktif menyerang Pion lawan dan menyokong Pion sendiri.',
    ],
    show: [{ fen: '8/5k2/8/8/8/8/5K2/8 w - - 0 1', caption: 'Endgame: kedua-dua Raja patut bergerak ke tengah.', highlights: ['e4', 'd4', 'e5', 'd5'] }],
    practice: [{ kind: 'choice', prompt: 'Hanya Raja dan Pion tinggal. Apa yang patut Raja lakukan?', options: ['Kekal di sudut dengan selamat', 'Bergerak ke tengah dan menjadi aktif'], answer: 1, explain: 'Dalam endgame, Raja ialah buah penyerang.' }],
    test: [{ kind: 'choice', prompt: 'Kenapa Raja boleh aktif dalam endgame tetapi tidak dalam pertengahan?', options: ['Kerana tiada lagi Menteri dan buah berat untuk mengancam mat', 'Kerana Raja menjadi lebih kuat selepas langkah 40'], answer: 0, explain: 'Bahaya mat berkurang apabila buah berat sudah ditukar.' }],
    review: ['Endgame: Raja ke tengah.', 'Raja aktif = buah penyerang.'],
  },
];
