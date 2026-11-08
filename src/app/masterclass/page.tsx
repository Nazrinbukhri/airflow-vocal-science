import type { Metadata } from 'next';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Kelas Grandmaster' };

export default function MasterclassPage() {
  return (
    <>
      <PageHeader
        title="Kelas Grandmaster"
        titleEn="Grandmaster Masterclass"
        intro="Belajar menyerang daripada yang terbaik: Mikhail Tal, Garry Kasparov, Bobby Fischer, Judit Polgár, Magnus Carlsen dan Hikaru Nakamura."
      />
      <ModulePlan
        phase={8}
        planned={[
          'Permainan serangan sebenar dengan rekod sejarah dan sumber yang dinyatakan. Tiada skor permainan rekaan.',
          'Setiap permainan diulang melalui chess.js dalam ujian automatik supaya setiap langkah disahkan sah.',
          'Fokus: kombinasi serangan, pengorbanan, memburu Raja, penglihatan taktik, inisiatif dan koordinasi.',
          'Mod “teka langkah seterusnya” sebelum langkah Grandmaster didedahkan.',
        ]}
      />
    </>
  );
}
