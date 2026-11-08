import type { Metadata } from 'next';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { Card, CardTitle, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Akademi Pembukaan' };

const REPERTOIRE = [
  { side: 'Putih (White)', name: 'Italian Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', idea: 'Kawal tengah, bangunkan buah dengan pantas, tekan petak f7 dan castle awal.' },
  { side: 'Hitam lawan 1.e4', name: 'Sicilian Defence', moves: '1.e4 c5', idea: 'Serangan balas tidak simetri: fail c separuh terbuka dan permainan sayap Menteri.' },
  { side: 'Hitam lawan 1.d4', name: "King's Indian Defence", moves: '1.d4 Nf6 2.c4 g6 … Bg7', idea: 'Biarkan Putih ambil tengah, kemudian pecahkan dengan …e5 / …f5 dan serang sayap Raja.' },
];

export default function OpeningsPage() {
  return (
    <>
      <PageHeader
        title="Akademi Pembukaan"
        titleEn="Aggressive Opening Academy"
        intro="Prinsip dahulu, variasi kemudian. Anda akan belajar tujuan setiap langkah sebelum menghafal apa-apa."
      />
      <div className="space-y-5">
        <Card>
          <CardTitle sub="Opening principles – sebelum mana-mana pembukaan">Tiga prinsip pembukaan</CardTitle>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-charcoal-100">
            <li><strong className="text-white">Kawal tengah</strong> (centre control) – petak e4, d4, e5, d5.</li>
            <li><strong className="text-white">Bangunkan buah</strong> (development) – Kuda dan Gajah keluar sebelum Menteri.</li>
            <li><strong className="text-white">Selamatkan Raja</strong> (king safety) – castle awal, biasanya sebelum langkah ke-10.</li>
          </ol>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {REPERTOIRE.map((r) => (
            <Card key={r.name}>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{r.side}</p>
              <h2 className="font-display text-xl text-gold-200">{r.name}</h2>
              <p className="my-1 font-mono text-sm text-gold-300">{r.moves}</p>
              <p className="text-sm text-charcoal-200">{r.idea}</p>
            </Card>
          ))}
        </div>
        <ModulePlan
          phase={6}
          planned={[
            'Jurulatih langkah demi langkah: setiap langkah diterangkan – kawalan tengah, pembangunan, tekanan pada f7, keselamatan Raja.',
            'Italian Game: rancangan c3 + d4, serangan sayap Raja, perangkap biasa dan cara mengelaknya.',
            'Sicilian Defence: struktur Pion tidak simetri, fail terbuka, serangan balas sayap Menteri.',
            "King's Indian Defence: fianchetto, ketegangan tengah, pecahan Pion …e5 dan …f5.",
            'Variasi dibuka hanya selepas anda memahami garis utama.',
          ]}
          meanwhile={[{ href: '/play', label: 'Main garis utama di papan' }]}
        />
      </div>
    </>
  );
}
