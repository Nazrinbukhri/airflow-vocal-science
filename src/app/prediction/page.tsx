import type { Metadata } from 'next';
import { CoachView } from '@/components/coach/CoachView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Ramalan AI' };

export default function PredictionPage() {
  return (
    <>
      <PageHeader
        title="Ramalan AI & Jurulatih"
        titleEn="AI Opponent Prediction Engine · Attacking Coach"
        intro="Stockfish mengira langkah terbaik; jurulatih menerangkan kenapa, apa ancaman lawan, dan apa jawapan lawan yang mungkin. Fikir dahulu – kemudian buka petunjuk satu demi satu. Enjin tidak boleh meramal keputusan manusia dengan pasti."
      />
      <CoachView />
    </>
  );
}
