import type { Metadata } from 'next';
import { TacticsPageView } from '@/components/tactics/TacticsPageView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Taktik Agresif' };

export default function TacticsPage() {
  return (
    <>
      <PageHeader
        title="Taktik Agresif"
        titleEn="Aggressive Tactics"
        intro="Teka-teki taktik yang disahkan oleh Stockfish. Kira dahulu, gunakan petunjuk jika perlu, dan baca kenapa langkah lain tidak berkesan."
      />
      <TacticsPageView />
    </>
  );
}
