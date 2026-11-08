/** Positions to explore with the coach. Each FEN is checked for legality in tests. */
export const COACH_SAMPLES: { name: string; fen: string; note: string }[] = [
  { name: 'Kedudukan permulaan', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', note: 'Bagaimana memulakan permainan?' },
  { name: 'Ancaman pada f7 (Hitam bergerak)', fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', note: 'Menteri dan Gajah Putih mengancam f7.' },
  { name: 'Italian Game', fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', note: 'Apa rancangan Putih: castle, c3 dan d4?' },
  { name: 'Kuda menyerang f7 (Hitam bergerak)', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4', note: 'Kuda di g5 dan Gajah di c4 menyerang f7.' },
  { name: 'Sicilian Defence', fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', note: 'Hitam melawan di tengah dari tepi.' },
  { name: 'Back-rank mate', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', note: 'Raja Hitam terperangkap di belakang Pionnya.' },
  { name: 'Fork Kuda', fen: 'r3k3/8/8/1N6/8/8/7P/4K3 w - - 0 1', note: 'Satu langkah, dua sasaran.' },
];
