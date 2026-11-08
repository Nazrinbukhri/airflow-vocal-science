'use client';

import type { PieceSymbol, Square } from 'chess.js';
import { useState } from 'react';
import { Chessboard, type BoardTarget, type HighlightTone } from '@/components/board/Chessboard';
import { Badge, Card, CardTitle } from '@/components/ui/primitives';
import { placementToFen } from '@/lib/chess/placement';
import { PIECES, pieceImage } from '@/lib/chess/pieces';
import { emptyBoardReach } from '@/lib/chess/reach';

const START: Record<PieceSymbol, Square> = { k: 'e1', q: 'd4', r: 'd4', b: 'c1', n: 'g1', p: 'e2' };

const HOW: Record<PieceSymbol, { moves: string; note: string }> = {
  k: {
    moves: 'Satu petak ke mana-mana arah: depan, belakang, tepi atau serong.',
    note: 'Raja tidak boleh bergerak ke petak yang diserang lawan. Jika Raja diserang dan tiada jalan keluar, itu checkmate – permainan tamat. Langkah istimewa: castling.',
  },
  q: {
    moves: 'Berapa petak pun dalam garis lurus atau serong – gabungan Benteng dan Gajah.',
    note: 'Buah paling kuat (nilai 9). Jangan keluarkan Menteri terlalu awal – ia mudah diserang oleh buah kecil lawan.',
  },
  r: {
    moves: 'Berapa petak pun dalam garis lurus: menegak (file) atau mendatar (rank).',
    note: 'Nilai 5. Benteng paling kuat di fail terbuka (lajur tanpa Pion) dan di baris ke-7 lawan.',
  },
  b: {
    moves: 'Berapa petak pun secara serong (diagonal).',
    note: 'Nilai 3. Gajah sentiasa kekal di warna petak asalnya – setiap pemain ada Gajah petak cerah dan Gajah petak gelap.',
  },
  n: {
    moves: 'Bentuk huruf "L": dua petak satu arah, kemudian satu petak ke tepi.',
    note: 'Nilai 3. Satu-satunya buah yang boleh melompat melepasi buah lain. Kuda di tengah papan mengawal sehingga 8 petak – senjata utama untuk fork.',
  },
  p: {
    moves: 'Maju satu petak ke hadapan. Pada langkah pertama, boleh maju dua petak.',
    note: 'Nilai 1. Pion menangkap secara SERONG ke hadapan, tidak boleh berundur. Jika sampai ke baris terakhir, ia dinaikkan pangkat (promotion) – biasanya menjadi Menteri.',
  },
};

/**
 * Piece explorer: one piece on an empty board. The learner sees every square
 * it can reach and can move it (tap or drag) to explore further.
 */
export function PieceExplorer() {
  const [type, setType] = useState<PieceSymbol>('n');
  const [square, setSquare] = useState<Square>(START.n);
  const [moves, setMoves] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const fen = placementToFen(new Map([[square, { color: 'w' as const, type }]]));
  const reach = emptyBoardReach(type, square, 'w');
  const legal = new Map<Square, BoardTarget[]>([[square, reach.map((to) => ({ to }))]]);
  const info = PIECES[type];
  const highlights = Object.fromEntries(reach.map((s) => [s, 'green' as HighlightTone]));

  const choose = (t: PieceSymbol) => {
    setType(t);
    setSquare(START[t]);
    setMoves(0);
    setNote(null);
  };

  return (
    <Card>
      <CardTitle sub="Pilih buah. Petak hijau ialah semua petak yang boleh dicapai di papan kosong. Ketik atau seret buah untuk menggerakkannya.">
        Penjelajah buah catur
      </CardTitle>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Pilih buah catur">
        {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => choose(t)}
            className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-1 ${
              type === t ? 'border-gold-500 bg-gold-500/10' : 'border-charcoal-700 bg-charcoal-800/60 hover:border-charcoal-500'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pieceImage('w', t)} alt="" className="h-10 w-10" />
            <span className="text-sm font-semibold text-gold-200">{PIECES[t].ms}</span>
            <span className="text-[11px] text-charcoal-400">{PIECES[t].en}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="mx-auto w-full max-w-md">
          <Chessboard
            fen={fen}
            legalMoves={legal}
            highlights={highlights}
            label={`Papan penjelajah: ${info.ms} di ${square}`}
            onMove={({ to }) => {
              setMoves((m) => m + 1);
              if (type === 'p' && to[1] === '8') {
                setNote('Pion sampai ke baris 8! Dalam permainan sebenar ia dinaikkan pangkat (promotion). Pion dikembalikan ke e2.');
                setSquare('e2');
                return;
              }
              setNote(null);
              setSquare(to);
            }}
          />
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl text-gold-200">{info.ms}</h3>
            <Badge>{info.en}</Badge>
            <Badge tone="gold">{info.value === null ? 'Tidak ternilai' : `Nilai ${info.value}`}</Badge>
          </div>
          <p className="text-charcoal-100">
            <strong className="text-white">Cara bergerak:</strong> {HOW[type].moves}
          </p>
          <p className="text-charcoal-200">{HOW[type].note}</p>
          <p className="text-charcoal-300">
            Huruf notasi: <span className="font-mono text-gold-300">{info.sanLetter || '(tiada – Pion ditulis dengan petak sahaja, cth. e4)'}</span>
          </p>
          <p className="rounded-lg bg-charcoal-800/80 p-2 text-charcoal-200" data-testid="explorer-count">
            Dari <span className="font-mono text-gold-300">{square}</span>, {info.ms} boleh ke{' '}
            <strong className="text-white">{reach.length}</strong> petak. Langkah dicuba: {moves}.
          </p>
          {note && <p className="rounded-lg bg-gold-500/10 p-2 text-gold-200">{note}</p>}
          <p className="text-xs text-charcoal-400">
            Papan ini kosong supaya anda fokus pada cara buah bergerak. Halangan, tangkapan dan check diajar dalam pelajaran seterusnya.
          </p>
        </div>
      </div>
    </Card>
  );
}
