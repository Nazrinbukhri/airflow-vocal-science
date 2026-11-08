import type { Metadata } from 'next';
import { AnalysisView } from '@/components/analysis/AnalysisView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Analisis Permainan' };

export default function AnalysisPage() {
  return (
    <>
      <PageHeader
        title="Analisis Permainan"
        titleEn="Game Analysis"
        intro="Tampal PGN untuk mengulang kaji permainan langkah demi langkah, atau FEN untuk menyediakan satu kedudukan. Stockfish menilai setiap kedudukan secara langsung."
      />
      <AnalysisView />
    </>
  );
}
