import type { Metadata } from 'next';
import { PieceExplorer } from '@/components/fundamentals/PieceExplorer';
import { SquareFinder } from '@/components/fundamentals/SquareFinder';
import { Card, CardTitle, PageHeader } from '@/components/ui/primitives';
import { ModulePlan } from '@/components/ui/ModulePlan';

export const metadata: Metadata = { title: 'Asas Catur' };

export default function FundamentalsPage() {
  return (
    <>
      <PageHeader
        title="Asas Catur"
        titleEn="Chess Fundamentals"
        intro="Kita mula dari sifar. Tiada istilah yang dianggap sudah difahami – setiap istilah Inggeris diterangkan dalam Bahasa Melayu."
      />
      <div className="space-y-5">
        <Card>
          <CardTitle sub="What is chess?">Apa itu catur?</CardTitle>
          <div className="space-y-2 text-sm text-charcoal-100">
            <p>
              Catur ialah permainan strategi untuk <strong className="text-white">dua pemain</strong>: Putih (White) dan
              Hitam (Black). Putih sentiasa bergerak dahulu, kemudian pemain bergilir-gilir – satu langkah setiap giliran.
            </p>
            <p>
              Papan catur (chessboard) ada <strong className="text-white">64 petak</strong> (squares): 8 × 8, berselang-seli
              cerah dan gelap. Setiap pemain bermula dengan <strong className="text-white">16 buah</strong>: 1 Raja, 1 Menteri,
              2 Benteng, 2 Gajah, 2 Kuda dan 8 Pion.
            </p>
            <p>
              <strong className="text-gold-300">Matlamat:</strong> memberi <em>checkmate</em> kepada Raja lawan – Raja itu
              diserang dan tiada cara untuk menyelamatkannya. Kita tidak “makan” Raja; permainan tamat sebaik sahaja checkmate.
            </p>
          </div>
        </Card>
        <SquareFinder />
        <PieceExplorer />
        <ModulePlan
          phase={5}
          planned={[
            '14 pelajaran lengkap: papan, files & ranks, 64 petak, enam buah, pergerakan, tangkapan, check, checkmate, stalemate, castling, en passant, promosi Pion dan syarat seri.',
            'Setiap pelajaran: TERANG → TUNJUK → LATIH → UJI → ULANG KAJI (Explain → Show → Practice → Test → Review).',
            'Notasi diajar secara berperingkat: nama petak → SAN (Nf3, exd5, O-O) → UCI (g1f3).',
            'Petunjuk berperingkat: kenal ancaman → buah yang diserang → petak calon → penyelesaian dengan penjelasan.',
          ]}
          meanwhile={[{ href: '/play', label: 'Cuba gerakkan buah di papan penuh' }]}
        />
      </div>
    </>
  );
}
