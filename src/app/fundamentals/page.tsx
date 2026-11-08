import type { Metadata } from 'next';
import { PieceExplorer } from '@/components/fundamentals/PieceExplorer';
import { SquareFinder } from '@/components/fundamentals/SquareFinder';
import { LessonBrowser } from '@/components/lessons/LessonBrowser';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Asas Catur' };

export default function FundamentalsPage() {
  return (
    <>
      <PageHeader
        title="Asas Catur"
        titleEn="Chess Fundamentals"
        intro="Kita mula dari sifar. Setiap pelajaran: Terang → Tunjuk → Latih → Uji → Ulang kaji. Setiap istilah Inggeris diterangkan dalam Bahasa Melayu."
      />
      <div className="space-y-5">
        <LessonBrowser modules={['fundamentals', 'endgame']} />
        <h2 className="pt-2 font-display text-xl text-gold-200">Alat latihan tambahan</h2>
        <SquareFinder />
        <PieceExplorer />

      </div>
    </>
  );
}
