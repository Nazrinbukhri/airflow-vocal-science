import { Chess, type Color, type Square } from 'chess.js';
import { movesWhere, type Exercise } from '@/lib/lessons/exercise';
import {
  backwardPawns,
  chainBases,
  connectedPassedPawns,
  doubledPawns,
  fianchettos,
  halfOpenFiles,
  isolatedPawns,
  openFiles,
  outposts,
  passedPawns,
  weakSquares,
} from './structure';

export type Formation = {
  id: string;
  name: string;
  nameEn: string;
  fen: string;
  /** Side the lesson is told from (board orientation). */
  side: Color;
  /** Squares to highlight, computed from the position. */
  highlight: Square[];
  highlightLabel: string;
  what: string;
  attack: string;
  weakness: string;
  exploit: string;
  defend: string;
  exercise: Exercise;
};

/** Build a legal position from a move list. */
function after(sans: string[]): string {
  const c = new Chess();
  for (const s of sans) c.move(s);
  return c.fen();
}
const C = (fen: string) => new Chess(fen);
const fileSquares = (files: string[]) => files.flatMap((f) => [1, 2, 3, 4, 5, 6, 7, 8].map((r) => `${f}${r}` as Square));

const FRENCH = after(['e4', 'e6', 'd4', 'd5', 'e5', 'c5']);
const IQP = 'r1bq1rk1/pp2bppp/2n1pn2/8/2BP4/2N2N2/PP3PPP/R1BQR1K1 w - - 0 10';
const DOUBLED = 'r1bqk2r/pppp1ppp/2n2n2/4p3/4P3/2P2N2/P1PP1PPP/R1BQKB1R w KQkq - 0 6';
const NAJDORF = after(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6']);
const PASSED = '8/1p3kp1/p7/3P4/8/P5P1/6K1/8 w - - 0 1';
const CONNECTED = '8/5k2/8/3PP3/8/8/6K1/r7 w - - 0 1';
const OPEN = 'r4rk1/pp3ppp/2n1b3/8/8/2N1B3/PP3PPP/R4RK1 w - - 0 15';
const DRAGON = after(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3', 'O-O', 'Qd2', 'Nc6', 'Bc4', 'Bd7', 'O-O-O']);
const KID = after(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O']);
const KID_CLOSED = after(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7', 'Ne1', 'Nd7', 'Nd3', 'f5']);
const CARLSBAD = 'r2q1rk1/pp2bppp/2p2n2/3p4/3P4/2N1PN2/PP3PPP/R2Q1RK1 w - - 0 12';
const SCHEVENINGEN = after(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6', 'Be2', 'Be7', 'O-O', 'O-O']);
const WEAK = after(['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5', 'Ndb5', 'd6']);

export const FORMATIONS: Formation[] = [
  {
    id: 'pawn-chain',
    name: 'Rantai Pion',
    nameEn: 'Pawn chain',
    fen: FRENCH,
    side: 'w',
    highlight: chainBases(C(FRENCH), 'w'),
    highlightLabel: 'Pangkal rantai Putih',
    what: 'Pion-pion yang berderet secara serong dan melindungi satu sama lain (d4–e5). Pion paling belakang ialah pangkal (base).',
    attack: 'Rantai menunjuk ke arah serangan: rantai d4–e5 Putih menunjuk ke sayap Raja Hitam, jadi Putih menyerang di sana (f4–f5, Qg4).',
    weakness: 'Pangkal rantai tidak dilindungi oleh Pion lain – itulah titik lemahnya.',
    exploit: 'Serang PANGKAL, bukan kepala. Hitam bermain …c5 dan …Qb6 untuk menekan d4.',
    defend: 'Kukuhkan pangkal dengan c3 dan Nf3; jangan biarkan pangkal ditukar tanpa pampasan.',
    exercise: { kind: 'square', fen: FRENCH, prompt: 'Ketik pangkal (base) rantai Pion Putih.', answers: chainBases(C(FRENCH), 'w'), explain: 'd4 ialah pangkal: ia melindungi e5 tetapi tiada Pion yang melindunginya. Pion c5 Hitam menyerangnya.' },
  },
  {
    id: 'isolated-pawn',
    name: 'Pion Terpencil',
    nameEn: 'Isolated pawn (IQP)',
    fen: IQP,
    side: 'w',
    highlight: isolatedPawns(C(IQP), 'w'),
    highlightLabel: 'Pion terpencil',
    what: 'Pion tanpa Pion kawan di fail sebelah. Di sini Pion d4 Putih tiada Pion di fail c dan e.',
    attack: 'Pion terpencil memberi ruang dan fail separuh terbuka (c dan e). Buah Putih aktif: Kuda ke e5, Gajah ke b3/c2, serangan sayap Raja.',
    weakness: 'Ia tidak boleh dilindungi oleh Pion lain, dan petak di hadapannya (d5) menjadi petak sekatan yang baik untuk lawan.',
    exploit: 'Sekat Pion dengan buah di d5 (terutama Kuda), tukar buah-buah kecil, kemudian serang Pion dalam endgame.',
    defend: 'Pemilik Pion terpencil perlu bermain aktif dan menyerang sebelum endgame; pecahan d4–d5 sering membebaskan kedudukan.',
    exercise: { kind: 'square', fen: IQP, prompt: 'Ketik Pion terpencil.', answers: isolatedPawns(C(IQP), 'w'), explain: 'd4 tiada Pion kawan di fail c atau e.' },
  },
  {
    id: 'doubled-pawns',
    name: 'Pion Berganda',
    nameEn: 'Doubled pawns',
    fen: DOUBLED,
    side: 'w',
    highlight: doubledPawns(C(DOUBLED), 'w'),
    highlightLabel: 'Pion berganda',
    what: 'Dua Pion sewarna di fail yang sama (c2 dan c3), biasanya selepas Gajah ditukar dengan Kuda (…Bxc3 bxc3).',
    attack: 'Pion berganda selalunya memberi fail separuh terbuka (fail b) dan pasangan Gajah – pemiliknya boleh bermain aktif.',
    weakness: 'Mereka sukar bergerak dan mempertahankan satu sama lain; dalam endgame mereka sering menjadi sasaran.',
    exploit: 'Tutup kedudukan supaya pasangan Gajah kurang berkesan, kemudian serang Pion hadapan (c3/c4) dengan …Na5, …Ba6.',
    defend: 'Gunakan Pion berganda untuk mengawal petak tengah (c3 mengawal d4) dan bermain c4/d4 untuk ruang.',
    exercise: { kind: 'square', fen: DOUBLED, prompt: 'Ketik salah satu Pion berganda Putih.', answers: doubledPawns(C(DOUBLED), 'w'), explain: 'c2 dan c3 berada di fail yang sama.' },
  },
  {
    id: 'backward-pawn',
    name: 'Pion Mundur',
    nameEn: 'Backward pawn',
    fen: NAJDORF,
    side: 'w',
    highlight: backwardPawns(C(NAJDORF), 'b'),
    highlightLabel: 'Pion mundur Hitam',
    what: 'Pion yang ketinggalan di belakang Pion kawan di sebelahnya dan tidak boleh maju dengan selamat. Dalam Najdorf …e5, Pion d6 ialah Pion mundur.',
    attack: 'Pemilik Pion mundur mendapat ruang (…e5) dan aktiviti; jika berjaya bermain …d5, kelemahannya hilang.',
    weakness: 'Petak di hadapannya (d5) tidak boleh dikawal oleh Pion – lawan meletakkan buah di situ.',
    exploit: 'Kawal dan duduki petak d5 (Nd5, Bxd5 dengan Pion menangkap semula), kemudian tekan d6 di fail d.',
    defend: 'Kawal petak di hadapan Pion (…Be6, …Nbd7-f6) dan sediakan pecahan …d5.',
    exercise: { kind: 'square', fen: NAJDORF, prompt: 'Ketik Pion mundur Hitam.', answers: backwardPawns(C(NAJDORF), 'b'), explain: 'd6 tidak dilindungi oleh Pion lain dan petak d5 di hadapannya dikawal oleh Pion e4.' },
  },
  {
    id: 'passed-pawn',
    name: 'Pion Lulus',
    nameEn: 'Passed pawn',
    fen: PASSED,
    side: 'w',
    highlight: passedPawns(C(PASSED), 'w'),
    highlightLabel: 'Pion lulus',
    what: 'Pion yang tiada Pion lawan di hadapannya pada fail sama atau fail sebelah. Tiada Pion boleh menghalangnya menjadi Menteri.',
    attack: '"Pion lulus mesti ditolak!" Ia memaksa buah lawan bertahan dan sering menang endgame.',
    weakness: 'Jika disekat oleh buah lawan (terutama Kuda) dan tidak disokong, ia boleh hilang.',
    exploit: 'Sokong dengan Raja dan Benteng (Benteng DI BELAKANG Pion lulus), tolak ke hadapan.',
    defend: 'Sekat petak di hadapannya dengan buah, sebaik-baiknya Kuda, dan bawa Raja ke hadapannya.',
    exercise: { kind: 'square', fen: PASSED, prompt: 'Ketik Pion lulus Putih.', answers: passedPawns(C(PASSED), 'w'), explain: 'd5: tiada Pion Hitam di fail c, d atau e di hadapannya.' },
  },
  {
    id: 'connected-passers',
    name: 'Pion Lulus Berhubung',
    nameEn: 'Connected passed pawns',
    fen: CONNECTED,
    side: 'w',
    highlight: connectedPassedPawns(C(CONNECTED), 'w'),
    highlightLabel: 'Pion lulus berhubung',
    what: 'Dua Pion lulus bersebelahan. Mereka boleh melindungi satu sama lain semasa mara.',
    attack: 'Sangat kuat – dua Pion lulus berhubung di baris ke-6 selalunya lebih kuat daripada Benteng.',
    weakness: 'Hampir tiada; tetapi jika dipisahkan atau disekat di hadapan, kekuatannya berkurang.',
    exploit: 'Tolak secara berpasangan: satu Pion maju, satu lagi melindunginya. Raja menyokong dari belakang.',
    defend: 'Sekat dengan Raja di hadapan Pion dan serang dari tepi dengan Benteng.',
    exercise: { kind: 'square', fen: CONNECTED, prompt: 'Ketik salah satu Pion lulus berhubung.', answers: connectedPassedPawns(C(CONNECTED), 'w'), explain: 'd5 dan e5 bersebelahan dan kedua-duanya lulus.' },
  },
  {
    id: 'open-files',
    name: 'Fail Terbuka',
    nameEn: 'Open files',
    fen: OPEN,
    side: 'w',
    highlight: fileSquares(openFiles(C(OPEN))).filter((s) => !C(OPEN).get(s)),
    highlightLabel: 'Fail terbuka (tiada Pion)',
    what: 'Fail tanpa sebarang Pion. Benteng dan Menteri paling kuat di fail terbuka.',
    attack: 'Benteng di fail terbuka boleh masuk ke baris ke-7 lawan dan menyerang Pion serta Raja.',
    weakness: 'Pihak yang tidak mengawal fail terbuka sering dipaksa bertahan secara pasif.',
    exploit: 'Letak Benteng di fail terbuka, gandakan Benteng (dua Benteng di fail sama), kemudian masuk ke baris ke-7.',
    defend: 'Cabar fail dengan Benteng anda sendiri dan kawal petak masuk (entry squares).',
    exercise: {
      kind: 'move',
      fen: OPEN,
      prompt: 'Letakkan Benteng di fail terbuka.',
      accept: movesWhere(OPEN, (m) => m.piece === 'r' && openFiles(C(OPEN)).includes(m.to[0]!)),
      explain: 'Fail c, d dan e terbuka – Benteng di situ mengawal seluruh fail.',
    },
  },
  {
    id: 'half-open-files',
    name: 'Fail Separuh Terbuka',
    nameEn: 'Half-open files',
    fen: DRAGON,
    side: 'b',
    highlight: fileSquares(halfOpenFiles(C(DRAGON), 'b')).filter((s) => !C(DRAGON).get(s)),
    highlightLabel: 'Fail separuh terbuka untuk Hitam',
    what: 'Fail tanpa Pion anda sendiri tetapi masih ada Pion lawan. Dalam Sicilian, fail c separuh terbuka untuk Hitam.',
    attack: 'Benteng di fail separuh terbuka menekan Pion lawan dan Raja yang castle ke arah itu.',
    weakness: 'Fail separuh terbuka lawan juga menghala ke arah anda – kedua-dua pihak berlumba.',
    exploit: 'Letakkan Benteng di c8, tambah tekanan dengan …Ne5-c4, …Qa5, malah pengorbanan pertukaran …Rxc3.',
    defend: 'Kukuhkan Pion sasaran (c2/c3) dan cari serangan balas yang lebih cepat.',
    exercise: {
      kind: 'move',
      fen: DRAGON,
      prompt: 'Hitam bergerak: letakkan Benteng di fail separuh terbuka.',
      accept: movesWhere(DRAGON, (m) => m.piece === 'r' && halfOpenFiles(C(DRAGON), 'b').includes(m.to[0]!)),
      explain: '…Rc8 meletakkan Benteng di fail c, terus ke arah Raja Putih di c1.',
    },
  },
  {
    id: 'weak-squares',
    name: 'Petak Lemah',
    nameEn: 'Weak squares (holes)',
    fen: WEAK,
    side: 'w',
    highlight: weakSquares(C(WEAK), 'b').filter((s) => s === 'd5'),
    highlightLabel: 'Lubang d5',
    what: 'Petak yang tidak boleh lagi dikawal oleh Pion sendiri. Selepas …e5 dan …d6, petak d5 menjadi "lubang" untuk Hitam.',
    attack: 'Lawan meletakkan buah (terutama Kuda) di lubang itu – ia tidak boleh diusir oleh Pion.',
    weakness: 'Setiap langkah Pion mencipta petak lemah di belakangnya. Pion tidak boleh berundur!',
    exploit: 'Bawa Kuda ke lubang (Nd5), tukar buah yang mengawalnya (Bg5xf6).',
    defend: 'Kawal lubang dengan buah (…Be6, …Nf6) atau tukar buah lawan yang mahu masuk.',
    exercise: { kind: 'square', fen: WEAK, prompt: 'Ketik lubang (petak lemah) utama di kem Hitam.', answers: ['d5'], explain: 'd5 tidak boleh dikawal oleh Pion Hitam lagi: Pion c sudah tiada dan Pion e sudah di e5.' },
  },
  {
    id: 'outposts',
    name: 'Outpost',
    nameEn: 'Outpost',
    fen: NAJDORF,
    side: 'w',
    highlight: outposts(C(NAJDORF), 'w').filter((s) => s === 'd5'),
    highlightLabel: 'Outpost Putih',
    what: 'Petak di separuh papan lawan yang dilindungi oleh Pion anda dan tidak boleh diserang oleh Pion lawan.',
    attack: 'Kuda di outpost (contoh d5) sangat kuat: ia menyerang ke dalam kem lawan dan tidak boleh diusir.',
    weakness: 'Bagi lawan, outpost anda ialah petak lemahnya.',
    exploit: 'Laluan Kuda ke outpost: Nc3-d5 atau Nf3-d2-f1-e3-d5. Jika lawan menukar, tangkap semula dengan Pion untuk Pion lulus.',
    defend: 'Tukar buah yang mahu duduk di outpost, atau kawal petak itu dengan buah anda.',
    exercise: {
      kind: 'move',
      fen: NAJDORF,
      prompt: 'Putih bergerak: letakkan Kuda di outpost.',
      accept: movesWhere(NAJDORF, (m) => m.piece === 'n' && outposts(C(NAJDORF), 'w').includes(m.to)),
      explain: 'Nd5! Kuda di d5 dilindungi oleh Pion e4 dan tiada Pion Hitam boleh mengusirnya.',
    },
  },
  {
    id: 'fianchetto',
    name: 'Fianchetto',
    nameEn: 'Fianchetto',
    fen: KID,
    side: 'b',
    highlight: fianchettos(C(KID), 'b'),
    highlightLabel: 'Gajah fianchetto',
    what: 'Gajah di b2/g2 (atau b7/g7) selepas Pion b atau g maju satu petak. Gajah mengawal diagonal panjang.',
    attack: 'Gajah g7 menembak ke arah tengah dan sayap Menteri lawan; dalam Dragon dan King’s Indian ia senjata utama.',
    weakness: 'Jika Gajah fianchetto ditukar, petak di sekeliling Raja (f6, h6) menjadi lemah.',
    exploit: 'Tukar Gajah fianchetto lawan (Be3 + Qd2 + Bh6), kemudian serang dengan h4-h5.',
    defend: 'Jangan tukar Gajah fianchetto anda dengan mudah; jika perlu, berundur Bh8 atau tukar dengan buah yang menyerang.',
    exercise: { kind: 'square', fen: KID, prompt: 'Ketik Gajah fianchetto Hitam.', answers: fianchettos(C(KID), 'b'), explain: 'Gajah g7 berada di belakang Pion g6, di diagonal panjang a1–h8.' },
  },
  {
    id: 'kingside-attack',
    name: 'Serangan Sayap Raja',
    nameEn: 'King-side attack',
    fen: KID_CLOSED,
    side: 'b',
    highlight: ['f5', 'g7', 'e7'] as Square[],
    highlightLabel: 'Buah serangan Hitam',
    what: 'Apabila tengah tertutup, pihak yang Pionnya menunjuk ke sayap Raja menyerang di sana. Dalam King’s Indian, Hitam bermain …f5-f4, …g5-g4.',
    attack: 'Tolak Pion (pawn storm), bawa Kuda ke g6/f4 dan Menteri ke h4; buka fail f dan g ke arah Raja.',
    weakness: 'Pion yang maju meninggalkan Raja sendiri lebih terdedah – kira sebelum menolak Pion depan Raja.',
    exploit: 'Lebih banyak buah dalam serangan daripada pertahanan lawan = serangan berjaya. Jangan menyerang dengan satu buah sahaja.',
    defend: 'Serang balas di sayap bertentangan (c5 untuk Putih), tutup fail, dan tukar buah penyerang.',
    exercise: {
      kind: 'choice',
      fen: KID_CLOSED,
      prompt: 'Tengah tertutup (Pion d5 Putih, e5 Hitam). Di sayap mana Hitam patut menyerang?',
      options: ['Sayap Raja (f5–f4, g5–g4)', 'Sayap Menteri (b5, a5)', 'Tukar semua buah dan seri'],
      answer: 0,
      explain: 'Pion Hitam d6–e5 menunjuk ke sayap Raja. Hitam menyerang dengan …f4, …g5, …g4.',
    },
  },
  {
    id: 'queenside-attack',
    name: 'Serangan Sayap Menteri',
    nameEn: 'Queen-side attack',
    fen: DRAGON,
    side: 'b',
    highlight: ['c8', 'b7', 'a7', 'c6'] as Square[],
    highlightLabel: 'Laluan serangan Hitam',
    what: 'Dalam castle bertentangan (Putih O-O-O, Hitam O-O), Hitam menyerang Raja Putih di sayap Menteri.',
    attack: 'Fail c separuh terbuka, …Ne5-c4, …Qa5, …b5-b4 dan pengorbanan …Rxc3 ialah senjata Hitam.',
    weakness: 'Perlumbaan: jika serangan anda lebih perlahan, Raja anda yang jatuh dahulu.',
    exploit: 'Setiap langkah mesti mengancam sesuatu – check, tangkapan atau ancaman – supaya lawan tiada masa untuk menyerang.',
    defend: 'Pertahanan terbaik sering serangan balas yang lebih cepat; tukar buah penyerang lawan (Bxe5, Bxc4).',
    exercise: {
      kind: 'choice',
      fen: DRAGON,
      prompt: 'Putih castle ke c1, Hitam ke g8. Apakah rancangan Hitam?',
      options: ['Serang sayap Menteri: …Rc8, …Ne5, …Qa5, …b5', 'Tolak …h5 dan …g5 di depan Raja sendiri', 'Tunggu dan bergerak Raja bolak-balik'],
      answer: 0,
      explain: 'Dalam castle bertentangan, serang Raja lawan – di sini Raja Putih di sayap Menteri.',
    },
  },
  {
    id: 'minority-attack',
    name: 'Serangan Minoriti',
    nameEn: 'Minority attack',
    fen: CARLSBAD,
    side: 'w',
    highlight: ['a2', 'b2', 'c6'] as Square[],
    highlightLabel: 'Pion minoriti dan sasaran',
    what: 'Pihak dengan LEBIH SEDIKIT Pion di satu sayap menolak Pionnya untuk mencipta kelemahan. Struktur Carlsbad: Putih a+b lawan a+b+c Hitam.',
    attack: 'Putih bermain b4-b5 dan bxc6 untuk meninggalkan Hitam dengan Pion c terpencil atau mundur.',
    weakness: 'Serangan ini perlahan; Hitam boleh menyerang di sayap Raja atau menduduki e4 dengan Kuda.',
    exploit: 'Rb1, b4, a4, b5 – kemudian serang kelemahan di c6/d5 dengan Benteng dan Kuda.',
    defend: 'Jangan tangkap di b5 jika ia mencipta kelemahan; main …a6 atau …b5 untuk menyekat, dan cari serangan balas.',
    exercise: {
      kind: 'move',
      fen: CARLSBAD,
      prompt: 'Putih mahu bermain b4–b5. Tetapi b4 sekarang akan ditangkap oleh Gajah e7! Apakah langkah persediaan yang baik?',
      accept: ['a3', 'Rab1'],
      explain: 'a3 (atau Rab1) menyokong b4 terlebih dahulu. Selepas itu b4 dan b5 menyerang Pion c6. Serangan yang baik dikira dahulu – bukan ditolak terus.',
      engineTolerance: 60,
    },
  },
  {
    id: 'central-majority',
    name: 'Majoriti Pion Tengah',
    nameEn: 'Central pawn majority',
    fen: SCHEVENINGEN,
    side: 'b',
    highlight: ['d6', 'e6', 'e4'] as Square[],
    highlightLabel: 'Pion tengah',
    what: 'Lebih banyak Pion di tengah daripada lawan. Dalam Scheveningen, Hitam ada d6 + e6 lawan e4 Putih.',
    attack: 'Majoriti tengah boleh mara (…d5 atau …e5) untuk merebut ruang dan membuka garisan ke arah Raja lawan.',
    weakness: 'Jika Pion tengah maju terlalu awal tanpa sokongan buah, ia menjadi sasaran.',
    exploit: 'Sediakan pecahan …d5 dengan buah, kemudian tolak apabila taktik menyokongnya.',
    defend: 'Sekat Pion tengah lawan (kawal d5) dan serang di sayap tempat anda ada majoriti.',
    exercise: {
      kind: 'choice',
      fen: SCHEVENINGEN,
      prompt: 'Siapa yang mempunyai majoriti Pion di tengah (fail d dan e)?',
      options: ['Putih', 'Hitam', 'Sama banyak'],
      answer: 1,
      explain: 'Hitam: Pion d6 dan e6 (2) lawan Pion e4 Putih (1).',
    },
  },
];
