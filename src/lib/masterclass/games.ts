/**
 * Grandmaster attacking games.
 *
 * Game scores are standard published records of these famous games. They are
 * checked in tests: every move is legal (chess.js), the move count matches the
 * documented length, the documented result is reached (checkmate on the board,
 * or a decisive Stockfish evaluation at the moment of resignation), and the
 * famous key moves appear at the documented move numbers.
 * They could not be cross-checked against an online database from the build
 * environment, so each game links to its standard database entry for the reader.
 */
export type GmGame = {
  id: string;
  player: string;
  white: string;
  black: string;
  event: string;
  year: number;
  result: '1-0' | '0-1';
  ending: 'mate' | 'resign';
  /** Documented number of full moves. */
  moves: number;
  title: string;
  themes: string[];
  summary: string;
  /** Movetext, SAN, numbered. */
  pgn: string;
  /** Comments keyed by ply (1 = White's first move). */
  notes: Record<number, string>;
  /** Plies where the learner should guess the move first. */
  guess: number[];
  /** Key moves that must appear at these plies (verification). */
  keyMoves: Record<number, string>;
  source: { name: string; url: string };
};

export const GM_GAMES: GmGame[] = [
  {
    id: 'byrne-fischer-1956',
    player: 'Bobby Fischer',
    white: 'Donald Byrne',
    black: 'Robert James Fischer',
    event: 'Rosenwald Memorial, New York',
    year: 1956,
    result: '0-1',
    ending: 'mate',
    moves: 41,
    title: '"Game of the Century" – Fischer (13 tahun) mengorbankan Menteri',
    themes: ['Pengorbanan Menteri', 'Inisiatif', 'Windmill (kincir angin)', 'Koordinasi buah kecil'],
    summary: 'Fischer yang berumur 13 tahun membuka tengah, kemudian memberi Menterinya dengan 17…Be6!! untuk mendapat banyak bahan dan serangan yang tidak berhenti, berakhir dengan checkmate oleh buah-buah kecil.',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#',
    notes: {
      8: 'Fischer bermain fianchetto dan castle awal – Raja selamat dahulu.',
      22: '11…Na4!! – Kuda ditawarkan. Jika 12.Nxa4 Nxe4 dan Hitam membuka garisan terhadap Raja Putih yang belum castle.',
      26: '13…Nxe4! – Hitam memenangi Pion tengah dan mengancam lebih banyak.',
      34: '17…Be6!! – Fischer membiarkan Menterinya ditangkap. Sebagai ganti, Hitam akan mendapat Benteng, dua buah kecil dan serangan ke atas Raja Putih.',
      36: '18…Bxc4+ – mulakan "windmill": siri check Kuda yang menangkap bahan.',
      46: 'Selepas windmill, Hitam ada Benteng, dua Gajah dan Kuda untuk Menteri – terlalu banyak buah aktif.',
      82: '41…Rc2# – Checkmate oleh Benteng, disokong oleh Gajah dan Kuda. Koordinasi sempurna.',
    },
    guess: [34, 36],
    keyMoves: { 34: 'Be6', 82: 'Rc2#' },
    source: { name: 'chessgames.com (game 1008361)', url: 'https://www.chessgames.com/perl/chessgame?gid=1008361' },
  },
  {
    id: 'fischer-benko-1963',
    player: 'Bobby Fischer',
    white: 'Robert James Fischer',
    black: 'Pal Benko',
    event: 'US Championship 1963/64, New York',
    year: 1963,
    result: '1-0',
    ending: 'resign',
    moves: 21,
    title: '19.Rf6!! – Benteng masuk ke petak yang diserang dua kali',
    themes: ['Serangan sayap Raja', 'Pengorbanan Benteng', 'Pusat Pion e5', 'Ancaman mat'],
    summary: 'Fischer membuka fail f dan menyerang Raja Hitam. 19.Rf6!! meletakkan Benteng di petak yang dikawal oleh Gajah dan Kuda – tetapi menangkapnya membuka laluan untuk mat.',
    pgn: '1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. f4 Nf6 5. Nf3 O-O 6. Bd3 Bg4 7. h3 Bxf3 8. Qxf3 Nc6 9. Be3 e5 10. dxe5 dxe5 11. f5 gxf5 12. Qxf5 Nd4 13. Qf2 Ne8 14. O-O Nd6 15. Qg3 Kh8 16. Qg4 c6 17. Qh5 Qe8 18. Bxd4 exd4 19. Rf6 Kg8 20. e5 h6 21. Ne2',
    notes: {
      21: '11.f5! – Pion menyerang ke arah Raja Hitam dan membuka fail f.',
      27: '14.O-O – Raja Putih selamat; Benteng f1 kini di fail terbuka.',
      37: '19.Rf6!! – Benteng ke petak yang dikawal oleh Gajah g7. Ancaman: Qxh7#. Jika 19…Bxf6, 20.e5 membuka diagonal Gajah d3 ke h7 dan ancaman mat sangat kuat.',
      39: '20.e5 – Pion membuka garisan Gajah d3 ke h7.',
      41: '21.Ne2 – Kuda masuk ke serangan. Hitam menyerah: ancaman Qxh6 dan Qh7# terlalu kuat.',
    },
    guess: [37],
    keyMoves: { 37: 'Rf6' },
    source: { name: 'chessgames.com – Fischer vs Benko, 1963', url: 'https://www.chessgames.com/perl/ezsearch.pl?search=Fischer+Benko+1963' },
  },
  {
    id: 'kasparov-topalov-1999',
    player: 'Garry Kasparov',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    event: 'Hoogovens, Wijk aan Zee',
    year: 1999,
    result: '1-0',
    ending: 'resign',
    moves: 44,
    title: '"Kasparov\'s Immortal" – 24.Rxd4!! dan pemburuan Raja',
    themes: ['Pengorbanan Benteng', 'King hunt (memburu Raja)', 'Pengiraan jauh', 'Castle bertentangan'],
    summary: 'Kasparov mengorbankan Benteng dengan 24.Rxd4!! dan memburu Raja Hitam dari b8 hingga ke d1 – salah satu pengorbanan paling terkenal dalam sejarah.',
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7',
    notes: {
      21: '11.O-O-O – castle bertentangan dengan Hitam: perlumbaan serangan bermula.',
      47: '24.Rxd4!! – Benteng dikorbankan untuk membuka Raja Hitam. Kasparov perlu mengira sangat jauh.',
      49: '25.Re7+ – Raja Hitam terpaksa keluar: Kxa5, Ka4, Kxa3, Kxb4… ia dihalau ke seluruh papan.',
      53: '27.b4+ – Pion juga menyertai serangan.',
      65: '33.c3+ – Raja Hitam terus diburu ke kem Putih.',
      87: '44.Qa7 – Hitam menyerah. Pion Putih dan Menteri terlalu kuat; Raja Hitam terdedah.',
    },
    guess: [47],
    keyMoves: { 47: 'Rxd4', 49: 'Re7+' },
    source: { name: 'chessgames.com (game 1011478)', url: 'https://www.chessgames.com/perl/chessgame?gid=1011478' },
  },
  {
    id: 'carlsen-ernst-2004',
    player: 'Magnus Carlsen',
    white: 'Magnus Carlsen',
    black: 'Sipke Ernst',
    event: 'Corus C, Wijk aan Zee',
    year: 2004,
    result: '1-0',
    ending: 'mate',
    moves: 29,
    title: 'Carlsen (13 tahun): 18.Ng6! dan 21.Bxh6! menghancurkan perisai Raja',
    themes: ['Pengorbanan Kuda', 'Pengorbanan Gajah', 'Membuka fail h', 'Castle bertentangan'],
    summary: 'Carlsen membina tekanan dengan h4-h5, kemudian mengorbankan Kuda di g6 dan Gajah di h6 untuk membuka Raja Hitam. Permainan berakhir dengan checkmate.',
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Ngf6 12. O-O-O Be7 13. Ne4 Qa5 14. Kb1 O-O 15. Nxf6+ Nxf6 16. Ne5 Rad8 17. Qe2 c5 18. Ng6 fxg6 19. Qxe6+ Kh8 20. hxg6 Ng8 21. Bxh6 gxh6 22. Rxh6+ Nxh6 23. Qxe7 Nf7 24. gxf7 Kg7 25. Rd3 Rd6 26. Rg3+ Rg6 27. Qe5+ Kxf7 28. Qf5+ Rf6 29. Qd7#',
    notes: {
      11: '6.h4! – Pion h menyerang Gajah dan merebut ruang di sayap Raja.',
      23: '12.O-O-O – Raja Putih ke sayap Menteri; Pion h5 kini senjata serangan.',
      35: '18.Ng6!! – Pengorbanan Kuda. Jika 18…fxg6 19.Qxe6+ dan Gajah e7 juga lemah.',
      41: '21.Bxh6! – Pengorbanan kedua membuka fail h untuk Benteng.',
      43: '22.Rxh6+ – Benteng masuk; Raja Hitam terdedah.',
      57: '29.Qd7# – Checkmate.',
    },
    guess: [35, 41],
    keyMoves: { 35: 'Ng6', 41: 'Bxh6', 57: 'Qd7#' },
    source: { name: 'chessgames.com – Carlsen vs Ernst, Wijk aan Zee C 2004', url: 'https://www.chessgames.com/perl/ezsearch.pl?search=Carlsen+Ernst+2004' },
  },
  {
    id: 'tal-smyslov-1959',
    player: 'Mikhail Tal',
    white: 'Mikhail Tal',
    black: 'Vasily Smyslov',
    event: 'Candidates Tournament, Bled/Zagreb/Belgrade',
    year: 1959,
    result: '1-0',
    ending: 'resign',
    moves: 26,
    title: 'Tal: inisiatif, pengorbanan dan Menteri di h5',
    themes: ['Inisiatif', 'Castle bertentangan', 'Pengorbanan Gajah', 'Serangan pada h7/f7'],
    summary: 'Tal membawa Kuda ke d6 dan f5, memberi Gajah c4, dan menyerang Raja Hitam dengan Menteri dan Kuda – gaya "Penyihir dari Riga".',
    pgn: '1. e4 c6 2. d3 d5 3. Nd2 e5 4. Ngf3 Nd7 5. d4 dxe4 6. Nxe4 exd4 7. Qxd4 Ngf6 8. Bg5 Be7 9. O-O-O O-O 10. Nd6 Qa5 11. Bc4 b5 12. Bd2 Qa6 13. Nf5 Bd8 14. Qh4 bxc4 15. Qg5 Nh5 16. Nh6+ Kh8 17. Qxh5 Qxa2 18. Bc3 Nf6 19. Qxf7 Qa1+ 20. Kd2 Rxf7 21. Nxf7+ Kg8 22. Rxa1 Kxf7 23. Ne5+ Ke6 24. Nxc6 Ne4+ 25. Ke3 Bb6+ 26. Bd4',
    notes: {
      17: '9.O-O-O – castle bertentangan, Tal bersedia menyerang.',
      19: '10.Nd6! – Kuda masuk ke petak lemah di kem Hitam.',
      27: '14.Qh4! – Tal membiarkan Gajah c4 ditangkap dan terus menyerang Raja.',
      31: '16.Nh6+ – Kuda memberi check; Raja Hitam terperangkap di sudut.',
      37: '19.Qxf7! – Menteri menangkap dengan ancaman; selepas pertukaran, Tal muncul dengan kelebihan bahan.',
      51: '26.Bd4 – Hitam menyerah.',
    },
    guess: [19, 27],
    keyMoves: { 19: 'Nd6', 27: 'Qh4' },
    source: { name: 'chessgames.com – Tal vs Smyslov, Candidates 1959', url: 'https://www.chessgames.com/perl/ezsearch.pl?search=Tal+Smyslov+1959' },
  },
];

/** Players requested in the brief whose games are not yet included, and why. */
export const PENDING_PLAYERS: { player: string; profile: string; note: string }[] = [
  {
    player: 'Judit Polgár',
    profile: 'Pemain wanita terkuat dalam sejarah (pernah No. 8 dunia). Gaya sangat agresif: pengorbanan, inisiatif dan serangan Raja; terkenal mengalahkan Kasparov dalam permainan rapid pada 2002.',
    note: 'Skor permainan penuh belum dimasukkan kerana ia tidak dapat disahkan dengan pangkalan data dalam talian semasa pembinaan. Kami tidak mahu menulis skor permainan dari ingatan.',
  },
  {
    player: 'Hikaru Nakamura',
    profile: 'Juara dunia blitz berkali-kali dan pemain No. 2 dunia. Terkenal dengan pengiraan pantas, taktik tajam dan keberanian bermain pembukaan luar biasa.',
    note: 'Skor permainan penuh belum dimasukkan kerana ia tidak dapat disahkan dengan pangkalan data dalam talian semasa pembinaan.',
  },
];
