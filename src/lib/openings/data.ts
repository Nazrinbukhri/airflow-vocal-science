import type { Color } from 'chess.js';

/** One half-move with its explanation. `san` must be legal (checked in tests). */
export type Step = { san: string; why: string };

export type Line = {
  id: string;
  name: string;
  kind: 'main' | 'variation' | 'trap';
  summary: string;
  /** Full move list from the start position. */
  steps: Step[];
  /** For traps: what the learner should remember. */
  lesson?: string;
  /** For traps: the result claimed (verified in tests). */
  result?: 'mate' | 'white-better' | 'black-better' | 'equal';
};

export type Opening = {
  id: 'italian' | 'sicilian' | 'kings-indian';
  name: string;
  side: Color;
  sideLabel: string;
  tagline: string;
  /** Learn these before any moves. */
  ideas: string[];
  plans: { title: string; text: string }[];
  lines: Line[];
};

const s = (san: string, why: string): Step => ({ san, why });

// ---------------------------------------------------------------- Italian
const ITALIAN_START: Step[] = [
  s('e4', 'Pion Raja ke tengah: mengawal d5 dan f5, dan membuka laluan untuk Menteri dan Gajah f1.'),
  s('e5', 'Hitam juga merebut petak tengah dengan cara yang sama.'),
  s('Nf3', 'Bangunkan Kuda dengan ANCAMAN: Kuda menyerang Pion e5. Membangun sambil menyerang = gaya agresif yang sihat.'),
  s('Nc6', 'Hitam melindungi e5 sambil membangunkan Kuda.'),
  s('Bc4', 'Gajah ke diagonal a2–g8 dan mensasarkan f7 – petak paling lemah Hitam kerana hanya dilindungi oleh Raja.'),
];

const ITALIAN: Opening = {
  id: 'italian',
  name: 'Italian Game',
  side: 'w',
  sideLabel: 'Putih (White)',
  tagline: '1.e4 e5 2.Nf3 Nc6 3.Bc4 – pembukaan serangan klasik untuk Putih.',
  ideas: [
    'Kawal tengah dengan e4 dan kemudian d4.',
    'Bangunkan Kuda dan Gajah dengan cepat – setiap langkah ada tujuan.',
    'Gajah c4 menekan f7, titik lemah Hitam.',
    'Castle awal (O-O) supaya Raja selamat sebelum menyerang.',
    'Jangan serang terlalu awal dengan satu atau dua buah sahaja – bawa semua buah ke dalam serangan.',
  ],
  plans: [
    { title: 'Pusat c3 + d4', text: 'Selepas c3, Putih bermain d4 untuk membina pusat Pion e4+d4. Pion tengah yang kuat menolak buah Hitam ke belakang.' },
    { title: 'Tekanan pada f7', text: 'Gajah c4 dan Kuda f3 (kadang-kadang Ng5) menekan f7. Jika Hitam cuai, taktik seperti Bxf7+ atau Ng5 boleh menang bahan.' },
    { title: 'Serangan sayap Raja', text: 'Selepas castle, Putih boleh membawa Benteng ke e1, Kuda ke g3/f5, dan Pion ke h3/g4 untuk menyerang Raja Hitam.' },
  ],
  lines: [
    {
      id: 'italian-main',
      name: 'Garis utama: Giuoco Piano dengan c3 dan d4',
      kind: 'main',
      summary: 'Putih membina pusat Pion yang ideal dan membangunkan semua buah.',
      steps: [
        ...ITALIAN_START,
        s('Bc5', 'Giuoco Piano ("permainan tenang"): Gajah Hitam juga ke diagonal yang aktif dan mensasarkan f2.'),
        s('c3', 'Menyediakan d4. Tanpa c3, d4 hanya akan ditukar dan Putih tidak mendapat pusat.'),
        s('Nf6', 'Hitam membangunkan Kuda dan menyerang Pion e4.'),
        s('d4', 'Pukulan di tengah! Putih menyerang e5 dan Gajah c5 sekali gus.'),
        s('exd4', 'Hitam menangkap; jika tidak, Putih akan bermain dxe5.'),
        s('cxd4', 'Putih menangkap semula dan kini memiliki pusat Pion e4 + d4 yang kuat.'),
        s('Bb4+', 'Check! Gajah Hitam keluar dari serangan dengan tempo.'),
        s('Bd2', 'Halang check sambil membangunkan buah. (Nc3 lebih tajam, tetapi Bd2 lebih mudah untuk pemula.)'),
        s('Bxd2+', 'Hitam menukar Gajah.'),
        s('Nbxd2', 'Kuda menangkap semula dan masih menyokong e4.'),
        s('d5', 'Hitam memecahkan pusat Putih – langkah penting supaya Hitam tidak dihimpit.'),
        s('exd5', 'Putih menukar Pion.'),
        s('Nxd5', 'Kuda Hitam ke tengah.'),
        s('Qb3', 'Menteri menekan d5 dan b7. Ancaman sebenar: Bxd5 dan Qxb7.'),
        s('Nce7', 'Hitam memperkukuh d5.'),
        s('O-O', 'Raja selamat. Kini Putih bersedia untuk Rfe1 dan Ne4/Ne5 – kedudukan aktif untuk menyerang.'),
        s('O-O', 'Hitam juga castle. Kedudukan seimbang, tetapi buah Putih lebih aktif.'),
      ],
    },
    {
      id: 'italian-pianissimo',
      name: 'Giuoco Pianissimo: 4.d3',
      kind: 'variation',
      summary: 'Versi perlahan dan kukuh: Putih membina dahulu, menyerang kemudian.',
      steps: [
        ...ITALIAN_START,
        s('Bc5', 'Hitam membangunkan Gajah.'),
        s('d3', 'Melindungi e4 dengan Pion dan membuka Gajah c1. Lebih perlahan daripada d4, tetapi sangat kukuh.'),
        s('Nf6', 'Hitam membangunkan Kuda.'),
        s('c3', 'Menyediakan d4 kelak dan memberi petak mundur c2/b3 kepada Gajah.'),
        s('d6', 'Hitam mengukuhkan e5.'),
        s('O-O', 'Raja selamat dahulu.'),
        s('O-O', 'Hitam juga castle.'),
        s('Re1', 'Benteng menyokong e4 dan bersedia untuk d4 dan Nbd2-f1-g3 – rancangan serangan sayap Raja yang klasik.'),
      ],
    },
    {
      id: 'italian-two-knights',
      name: 'Two Knights Defence: 4.Ng5',
      kind: 'variation',
      summary: 'Putih menyerang f7 dengan dua buah. Hitam mengorbankan Pion untuk permainan aktif.',
      steps: [
        ...ITALIAN_START,
        s('Nf6', 'Two Knights Defence: Hitam menyerang e4 dan tidak takut serangan.'),
        s('Ng5', 'Agresif! Kuda dan Gajah kedua-duanya menyerang f7.'),
        s('d5', 'Satu-satunya cara baik: halang diagonal Gajah.'),
        s('exd5', 'Putih menangkap.'),
        s('Na5', 'BUKAN Nxd5 (lihat perangkap Fried Liver). Na5 menyerang Gajah c4.'),
        s('Bb5+', 'Gajah lari dengan check.'),
        s('c6', 'Hitam menghalang check dengan tempo.'),
        s('dxc6', 'Putih menang satu Pion.'),
        s('bxc6', 'Hitam membuka garisan untuk buahnya.'),
        s('Be2', 'Gajah berundur ke tempat selamat.'),
        s('h6', 'Mengusir Kuda g5.'),
        s('Nf3', 'Kuda berundur.'),
        s('e4', 'Hitam menyerang Kuda lagi. Hitam kurang satu Pion, tetapi buahnya lebih aktif – enjin menilai pampasan ini mencukupi.'),
        s('Ne5', 'Kuda ke petak tengah yang aktif.'),
      ],
    },
    {
      id: 'italian-evans',
      name: 'Evans Gambit: 4.b4',
      kind: 'variation',
      summary: 'Gambit paling agresif: Putih memberi Pion untuk masa dan pusat.',
      steps: [
        ...ITALIAN_START,
        s('Bc5', 'Hitam membangunkan Gajah.'),
        s('b4', 'Gambit! Putih menawarkan Pion b untuk menarik Gajah dan kemudian bermain c3 dan d4 dengan tempo.'),
        s('Bxb4', 'Hitam menerima gambit.'),
        s('c3', 'Menyerang Gajah dan menyediakan d4.'),
        s('Ba5', 'Gajah berundur tetapi kekal di diagonal yang menekan c3.'),
        s('d4', 'Putih membuka tengah – buahnya lebih cepat dibangunkan.'),
        s('exd4', 'Hitam menangkap.'),
        s('O-O', 'Putih castle dahulu dan bersedia menyerang. Enjin moden menilai Hitam sedikit lebih baik, tetapi dalam praktik inisiatif Putih sangat berbahaya untuk pemain manusia.'),
      ],
    },
    {
      id: 'italian-fried-liver',
      name: 'Perangkap: Fried Liver Attack',
      kind: 'trap',
      summary: 'Jika Hitam bermain 5...Nxd5?, Putih mengorbankan Kuda di f7 dan memburu Raja.',
      result: 'white-better',
      lesson: 'Dalam Two Knights, Hitam mesti bermain 5...Na5, bukan 5...Nxd5. Untuk Putih: pengorbanan Nxf7 berkesan kerana Raja Hitam terdedah dan Kuda d5 tersemat (pinned).',
      steps: [
        ...ITALIAN_START,
        s('Nf6', 'Two Knights Defence.'),
        s('Ng5', 'Dua buah menyerang f7.'),
        s('d5', 'Hitam menghalang.'),
        s('exd5', 'Putih menangkap.'),
        s('Nxd5', 'KESILAPAN. Nampak semula jadi, tetapi kini Kuda d5 dan Raja e8 terdedah.'),
        s('Nxf7', 'Pengorbanan! Kuda menangkap f7 dan menyerang Menteri d8 dan Benteng h8.'),
        s('Kxf7', 'Hitam menangkap Kuda – Raja ditarik keluar.'),
        s('Qf3+', 'Check, dan Menteri menyerang Kuda d5 yang tersemat ke Raja.'),
        s('Ke6', 'Raja terpaksa ke hadapan untuk melindungi Kuda d5.'),
        s('Nc3', 'Satu lagi buah menyerang d5. Raja Hitam di tengah papan – Putih ada serangan yang sangat kuat (pemburuan Raja).'),
      ],
    },
    {
      id: 'italian-blackburne',
      name: 'Perangkap untuk Putih: Blackburne Shilling Gambit',
      kind: 'trap',
      summary: 'Jika Putih tamak dengan 4.Nxe5?, Hitam memberi checkmate dalam beberapa langkah.',
      result: 'mate',
      lesson: 'Agresif bukan bermaksud tamak. Selepas 3...Nd4, mainkan 4.Nxd4 atau 4.O-O, bukan 4.Nxe5?. Sentiasa tanya: apakah jawapan terkuat lawan?',
      steps: [
        ...ITALIAN_START.slice(0, 5),
        s('Nd4', 'Langkah pelik yang memasang perangkap. Ia meninggalkan e5.'),
        s('Nxe5', 'TAMAK! Putih menangkap e5 dan menyerang f7 – tetapi lupa memeriksa jawapan Hitam.'),
        s('Qg5', 'Menteri menyerang Kuda e5 dan Pion g2 sekali gus.'),
        s('Nxf7', 'Putih terus tamak dan menyerang Menteri dan Benteng.'),
        s('Qxg2', 'Menteri menyerang Benteng h1.'),
        s('Rf1', 'Benteng lari.'),
        s('Qxe4+', 'Check!'),
        s('Be2', 'Satu-satunya cara menghalang.'),
        s('Nf3#', 'Smothered-style checkmate! Raja Putih dikepung oleh buahnya sendiri.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------- Sicilian
const SICILIAN: Opening = {
  id: 'sicilian',
  name: 'Sicilian Defence',
  side: 'b',
  sideLabel: 'Hitam lawan 1.e4',
  tagline: '1.e4 c5 – pertahanan yang menyerang balas. Kedudukan tidak simetri dan penuh taktik.',
  ideas: [
    'c5 mengawal d4 dari tepi tanpa meniru Putih – kedudukan menjadi tidak simetri.',
    'Selepas d4 cxd4, Hitam menukar Pion tepi dengan Pion tengah: Hitam dapat lebih banyak Pion tengah.',
    'Fail c separuh terbuka (half-open file) – Benteng Hitam menyerang di sayap Menteri.',
    'Selalunya kedua-dua pihak castle bertentangan: siapa yang menyerang Raja lawan dahulu, dia menang.',
    'Pemula: pelajari idea dahulu, jangan hafal 20 langkah.',
  ],
  plans: [
    { title: 'Serangan balas sayap Menteri', text: 'Hitam bermain ...Rc8, ...b5-b4 dan ...Qa5 untuk menyerang Raja Putih jika ia castle ke c1.' },
    { title: 'Fail c', text: 'Benteng di c8 menekan c3/c2. Pengorbanan pertukaran ...Rxc3 ialah tema klasik Sicilian.' },
    { title: 'Pecahan d5', text: 'Pion ...d5 membebaskan kedudukan Hitam apabila disediakan dengan baik.' },
  ],
  lines: [
    {
      id: 'sicilian-dragon',
      name: 'Garis utama: Dragon Variation',
      kind: 'main',
      summary: 'Hitam fianchetto Gajah ke g7 – "nafas naga" di diagonal panjang. Tajam dan agresif.',
      steps: [
        s('e4', 'Putih merebut tengah.'),
        s('c5', 'Sicilian! Hitam mengawal d4 tanpa meniru Putih.'),
        s('Nf3', 'Putih membangunkan Kuda dan menyediakan d4.'),
        s('d6', 'Mengawal e5 dan membuka Gajah c8.'),
        s('d4', 'Putih membuka tengah (Open Sicilian).'),
        s('cxd4', 'Hitam menukar Pion c dengan Pion d – kini Hitam ada dua Pion tengah (d dan e), Putih hanya satu.'),
        s('Nxd4', 'Kuda Putih di tengah.'),
        s('Nf6', 'Membangunkan Kuda dengan tempo – menyerang e4.'),
        s('Nc3', 'Melindungi e4.'),
        s('g6', 'Dragon! Bersedia meletakkan Gajah di g7.'),
        s('Be3', 'Putih memulakan Yugoslav Attack: Be3, f3, Qd2, O-O-O.'),
        s('Bg7', 'Gajah di diagonal panjang a1–h8 – senjata utama Hitam.'),
        s('f3', 'Menghalang ...Ng4 dan menyokong serangan Pion g4-g5.'),
        s('O-O', 'Hitam castle – Raja selamat dan Benteng f8 sedia.'),
        s('Qd2', 'Menteri bersedia untuk Bh6, menukar Gajah g7 yang berbahaya.'),
        s('Nc6', 'Hitam membangunkan Kuda dan menekan d4.'),
        s('Bc4', 'Gajah mensasarkan f7 dan mengawal d5.'),
        s('Bd7', 'Membangunkan Gajah dan menghubungkan Benteng.'),
        s('O-O-O', 'Castle bertentangan! Kini perlumbaan serangan bermula: Putih menyerang sayap Raja, Hitam sayap Menteri.'),
        s('Rc8', 'Benteng ke fail c separuh terbuka – mensasarkan Raja Putih di c1.'),
      ],
    },
    {
      id: 'sicilian-najdorf',
      name: 'Najdorf: 5...a6',
      kind: 'variation',
      summary: 'Pilihan Fischer dan Kasparov. ...a6 mengawal b5 dan menyediakan ...e5 atau ...b5.',
      steps: [
        s('e4', 'Putih merebut tengah.'),
        s('c5', 'Sicilian.'),
        s('Nf3', 'Membangunkan Kuda.'),
        s('d6', 'Mengawal e5.'),
        s('d4', 'Open Sicilian.'),
        s('cxd4', 'Tukar Pion tepi dengan Pion tengah.'),
        s('Nxd4', 'Kuda Putih menangkap semula.'),
        s('Nf6', 'Menyerang e4.'),
        s('Nc3', 'Melindungi e4.'),
        s('a6', 'Najdorf: menghalang Nb5/Bb5 dan menyediakan ...b5 untuk menyerang sayap Menteri.'),
        s('Be3', 'English Attack: Be3, f3, Qd2, O-O-O.'),
        s('e5', 'Hitam mengusir Kuda d4 dan merebut ruang di tengah. Petak d5 menjadi lemah – itulah harganya.'),
        s('Nb3', 'Kuda berundur.'),
        s('Be6', 'Gajah mengawal d5 – petak penting.'),
        s('f3', 'Menyokong g4.'),
        s('Be7', 'Membangun dan bersedia castle.'),
        s('Qd2', 'Menteri bersedia untuk O-O-O.'),
        s('O-O', 'Hitam castle.'),
        s('O-O-O', 'Castle bertentangan.'),
        s('Nbd7', 'Kuda menyokong ...b5 dan ...Rc8. Perlumbaan serangan bermula.'),
      ],
    },
    {
      id: 'sicilian-alapin',
      name: 'Anti-Sicilian: Alapin 2.c3',
      kind: 'variation',
      summary: 'Putih mahu membina pusat c3+d4. Hitam menjawab terus di tengah dengan ...d5.',
      steps: [
        s('e4', 'Putih merebut tengah.'),
        s('c5', 'Sicilian.'),
        s('c3', 'Alapin: menyediakan d4 supaya selepas pertukaran Putih dapat menangkap semula dengan Pion.'),
        s('d5', 'Hitam menyerang e4 serta-merta.'),
        s('exd5', 'Putih menukar.'),
        s('Qxd5', 'Menteri menangkap semula. c3 menghalang Nc3 menyerang Menteri dengan tempo.'),
        s('d4', 'Putih membina pusat.'),
        s('Nf6', 'Membangunkan Kuda.'),
        s('Nf3', 'Membangunkan Kuda.'),
        s('e6', 'Membuka Gajah f8 – kedudukan Hitam kukuh dan aktif.'),
      ],
    },
    {
      id: 'sicilian-morra',
      name: 'Anti-Sicilian: Smith-Morra Gambit',
      kind: 'variation',
      summary: 'Putih mengorbankan Pion untuk pembangunan pantas. Hitam mesti bertahan dengan teliti.',
      steps: [
        s('e4', 'Putih merebut tengah.'),
        s('c5', 'Sicilian.'),
        s('d4', 'Morra: Putih menawarkan Pion.'),
        s('cxd4', 'Hitam menerima.'),
        s('c3', 'Pion kedua ditawarkan.'),
        s('dxc3', 'Hitam menerima lagi.'),
        s('Nxc3', 'Putih ada dua buah dibangunkan dan fail c dan d terbuka sebagai pampasan Pion.'),
        s('Nc6', 'Hitam membangun.'),
        s('Nf3', 'Putih membangun.'),
        s('d6', 'Mengawal e5.'),
        s('Bc4', 'Gajah menekan f7.'),
        s('e6', 'Menutup diagonal Gajah c4.'),
        s('O-O', 'Putih castle.'),
        s('Nf6', 'Hitam membangun dan bersedia castle. Hitam lebih satu Pion; Putih ada inisiatif.'),
      ],
    },
    {
      id: 'sicilian-siberian',
      name: 'Perangkap: Siberian Trap (Smith-Morra)',
      kind: 'trap',
      summary: 'Jika Putih bermain 9.h3??, Hitam memberi checkmate dengan ...Nd4 dan ...Qh2#.',
      result: 'mate',
      lesson: 'Untuk Hitam: Menteri di c7 + Kuda g4 mensasarkan h2. Untuk Putih: sebelum h3, semak ancaman di h2 dan d4.',
      steps: [
        s('e4', 'Putih merebut tengah.'),
        s('c5', 'Sicilian.'),
        s('d4', 'Smith-Morra Gambit.'),
        s('cxd4', 'Hitam menerima.'),
        s('c3', 'Pion kedua.'),
        s('dxc3', 'Hitam menerima.'),
        s('Nxc3', 'Putih membangun dengan pantas.'),
        s('Nc6', 'Hitam membangun.'),
        s('Nf3', 'Putih membangun.'),
        s('e6', 'Membuka Gajah f8.'),
        s('Bc4', 'Gajah aktif.'),
        s('Qc7', 'Menteri di diagonal b8–h2 – perhatikan petak h2!'),
        s('O-O', 'Putih castle.'),
        s('Nf6', 'Hitam membangun.'),
        s('Qe2', 'Putih bersedia untuk Rd1.'),
        s('Ng4', 'Kuda dan Menteri kini sama-sama mensasarkan h2.'),
        s('h3', 'KESILAPAN BESAR! Putih mengusir Kuda tanpa melihat ancaman.'),
        s('Nd4', 'Menyerang Menteri e2. Jika Kuda f3 menangkap d4, ia tidak lagi melindungi h2.'),
        s('Nxd4', 'Putih menangkap Kuda.'),
        s('Qh2#', 'Checkmate! Kuda g4 melindungi Menteri di h2.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------- King's Indian
const KID_START: Step[] = [
  s('d4', 'Putih merebut tengah dengan Pion Menteri.'),
  s('Nf6', 'Hitam mengawal e4 dengan Kuda – fleksibel.'),
  s('c4', 'Putih mengambil lebih banyak ruang di tengah.'),
  s('g6', "King's Indian: Hitam bersedia fianchetto Gajah ke g7."),
];

const KINGS_INDIAN: Opening = {
  id: 'kings-indian',
  name: "King's Indian Defence",
  side: 'b',
  sideLabel: 'Hitam lawan 1.d4',
  tagline: "1.d4 Nf6 2.c4 g6 – biar Putih ambil tengah, kemudian serang balas dengan ...e5 dan ...f5.",
  ideas: [
    'Fianchetto: Gajah di g7 mengawal diagonal panjang dan melindungi Raja.',
    'Hitam membenarkan Putih membina pusat besar – kemudian menyerangnya dengan pecahan Pion ...e5 atau ...c5.',
    'Ketegangan tengah (central tension): jangan tukar Pion tengah tanpa sebab.',
    'Apabila tengah tertutup (Putih bermain d5), Hitam menyerang sayap Raja dengan ...f5-f4 dan ...g5-g4.',
    'Castle awal – Raja Hitam selamat di belakang Gajah g7.',
  ],
  plans: [
    { title: 'Pecahan ...e5', text: 'Pecahan Pion utama. Ia mencabar d4 dan membuka diagonal Gajah g7.' },
    { title: 'Serangan ...f5-f4 dan ...g5-g4', text: 'Selepas d5 menutup tengah, Kuda Hitam berundur (…Ne8/…Nd7) supaya Pion f boleh maju. Pion g dan h menyertai serangan ke atas Raja Putih.' },
    { title: 'Kuda ke f4/d4', text: 'Kuda Hitam mencari petak lompatan yang kuat di f4 atau d4 untuk menyerang.' },
  ],
  lines: [
    {
      id: 'kid-classical',
      name: 'Garis utama: Classical (Mar del Plata)',
      kind: 'main',
      summary: 'Tengah tertutup – Putih menyerang sayap Menteri, Hitam menyerang sayap Raja.',
      steps: [
        ...KID_START,
        s('Nc3', 'Membangunkan Kuda dan menyokong e4.'),
        s('Bg7', 'Fianchetto selesai: Gajah di diagonal panjang.'),
        s('e4', 'Putih membina pusat besar: c4, d4, e4.'),
        s('d6', 'Mengawal e5 dan menyediakan ...e5.'),
        s('Nf3', 'Membangun.'),
        s('O-O', 'Castle awal – Raja selamat sebelum pertempuran.'),
        s('Be2', 'Membangun dan bersedia castle.'),
        s('e5', 'Pecahan Pion! Hitam mencabar d4.'),
        s('O-O', 'Putih castle.'),
        s('Nc6', 'Menambah tekanan pada d4.'),
        s('d5', 'Putih menutup tengah dan mengusir Kuda.'),
        s('Ne7', 'Kuda berundur ke e7 – dari sini ia boleh ke g6 atau f5 untuk menyerang sayap Raja.'),
        s('Ne1', 'Kuda Putih menuju d3 untuk menyokong c5 (serangan sayap Menteri).'),
        s('Nd7', 'Kuda berundur supaya Pion f boleh maju.'),
        s('Nd3', 'Kuda menyokong c5 dan menghalang ...f4 sedikit.'),
        s('f5', 'Serangan sayap Raja bermula! Seterusnya ...Nf6, ...f4 dan ...g5.'),
      ],
    },
    {
      id: 'kid-samisch',
      name: 'Sämisch: 5.f3',
      kind: 'variation',
      summary: 'Putih mengukuhkan e4 dengan f3 dan sering castle ke sayap Menteri.',
      steps: [
        ...KID_START,
        s('Nc3', 'Membangun.'),
        s('Bg7', 'Fianchetto.'),
        s('e4', 'Pusat besar.'),
        s('d6', 'Mengawal e5.'),
        s('f3', 'Sämisch: mengukuhkan e4 dan menyediakan Be3, Qd2 dan g4.'),
        s('O-O', 'Hitam castle.'),
        s('Be3', 'Membangun.'),
        s('e5', 'Pecahan klasik.'),
        s('Nge2', 'Kuda ke e2 supaya f3 tidak terhalang.'),
        s('c6', 'Menyediakan ...cxd5 untuk membuka fail c, atau ...b5.'),
        s('Qd2', 'Menghubungkan buah dan bersedia castle panjang.'),
        s('Nbd7', 'Membangun dan menyokong e5.'),
      ],
    },
    {
      id: 'kid-four-pawns',
      name: 'Four Pawns Attack: 5.f4',
      kind: 'variation',
      summary: 'Putih membina empat Pion di tengah. Hitam mesti menyerangnya segera dengan ...c5.',
      steps: [
        ...KID_START,
        s('Nc3', 'Membangun.'),
        s('Bg7', 'Fianchetto.'),
        s('e4', 'Pusat besar.'),
        s('d6', 'Mengawal e5.'),
        s('f4', 'Empat Pion di tengah – kuat, tetapi buah Putih belum dibangunkan.'),
        s('O-O', 'Castle dahulu.'),
        s('Nf3', 'Membangun.'),
        s('c5', 'Serang pusat sebelum ia bergerak ke hadapan!'),
        s('d5', 'Putih maju.'),
        s('e6', 'Hitam membuka garisan di tengah.'),
        s('Be2', 'Membangun.'),
        s('exd5', 'Tukar Pion.'),
        s('cxd5', 'Putih menangkap semula. Hitam akan bermain ...Re8 dan ...b5 menyerang pusat dari tepi.'),
      ],
    },
    {
      id: 'kid-fianchetto',
      name: 'Fianchetto Variation: 3.Nf3 dan g3',
      kind: 'variation',
      summary: 'Putih juga fianchetto. Permainan lebih perlahan dan posisional.',
      steps: [
        s('d4', 'Putih merebut tengah.'),
        s('Nf6', 'Kuda mengawal e4.'),
        s('c4', 'Ruang di tengah.'),
        s('g6', "King's Indian."),
        s('Nf3', 'Membangun.'),
        s('Bg7', 'Fianchetto.'),
        s('g3', 'Putih juga fianchetto.'),
        s('O-O', 'Castle.'),
        s('Bg2', 'Gajah di diagonal panjang.'),
        s('d6', 'Mengawal e5.'),
        s('O-O', 'Putih castle.'),
        s('Nbd7', 'Kuda menyokong ...e5.'),
        s('Nc3', 'Membangun.'),
        s('e5', 'Pecahan klasik.'),
        s('e4', 'Putih merebut lebih banyak ruang.'),
      ],
    },
    {
      id: 'kid-exchange-trap',
      name: 'Kesilapan biasa: Putih tamak di e5',
      kind: 'trap',
      summary: 'Selepas pertukaran Menteri, 9.Nxe5? tidak memenangi Pion: ...Nxe4 mendapat semula bahan dan buah Hitam aktif.',
      result: 'equal',
      lesson: 'Pion e4 juga lemah. Sebelum menangkap, semak buah apa yang anda tinggalkan tanpa pertahanan.',
      steps: [
        ...KID_START,
        s('Nc3', 'Membangun.'),
        s('Bg7', 'Fianchetto.'),
        s('e4', 'Pusat besar.'),
        s('d6', 'Mengawal e5.'),
        s('Nf3', 'Membangun.'),
        s('O-O', 'Castle.'),
        s('Be2', 'Membangun.'),
        s('e5', 'Pecahan.'),
        s('dxe5', 'Exchange Variation: Putih menukar di tengah.'),
        s('dxe5', 'Hitam menangkap semula.'),
        s('Qxd8', 'Tukar Menteri.'),
        s('Rxd8', 'Benteng menangkap semula dan kini menguasai fail d.'),
        s('Nxe5', 'TAMAK: Pion e5 nampak percuma…'),
        s('Nxe4', '…tetapi e4 juga tidak dilindungi! Kuda menangkap dan menyerang Kuda c3.'),
        s('Nxe4', 'Putih menangkap Kuda.'),
        s('Bxe5', 'Gajah menangkap semula. Bahan sama dan enjin menilai kedudukan seimbang – "Pion percuma" Putih tidak membawa apa-apa. Gajah Hitam aktif di tengah dan Benteng menguasai fail d.'),
      ],
    },
  ],
};

export const OPENINGS: Opening[] = [ITALIAN, SICILIAN, KINGS_INDIAN];

export function findLine(lineId: string): { opening: Opening; line: Line } | undefined {
  for (const opening of OPENINGS) {
    const line = opening.lines.find((l) => l.id === lineId);
    if (line) return { opening, line };
  }
  return undefined;
}
