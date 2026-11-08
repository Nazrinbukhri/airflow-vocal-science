import type { Metadata } from 'next';
import { GameWorkbench } from '@/components/game/GameWorkbench';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { Badge, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Analisis Permainan' };

export default function AnalysisPage() {
  return (
    <>
      <PageHeader
        title="Analisis Permainan"
        titleEn="Game Analysis"
        intro="Tampal PGN untuk mengulang kaji permainan langkah demi langkah, atau FEN untuk menyediakan satu kedudukan. Setiap langkah disahkan mengikut peraturan."
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="emerald">Import PGN / FEN</Badge>
          <Badge tone="gold">Semakan enjin · Fasa 3 & 8</Badge>
        </div>
      </PageHeader>
      <GameWorkbench
        storageKey="game:analysis"
        importFirst
        aside={
          <ModulePlan
            phase={8}
            planned={[
              'Bandingkan langkah sebenar dengan langkah enjin.',
              'Ketepatan, langkah terbaik, inaccuracy, mistake, blunder dan kemenangan terlepas – ambang centipawn boleh dilaraskan.',
              'Prestasi pembukaan, pertengahan dan endgame. Penilaian enjin bukan jaminan kemenangan.',
            ]}
          />
        }
      />
    </>
  );
}
