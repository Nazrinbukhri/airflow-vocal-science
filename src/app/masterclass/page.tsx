import type { Metadata } from 'next';
import { MasterclassView } from '@/components/masterclass/MasterclassView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Kelas Grandmaster' };

export default function MasterclassPage() {
  return (
    <>
      <PageHeader
        title="Kelas Grandmaster"
        titleEn="Grandmaster Masterclass"
        intro="Belajar menyerang daripada yang terbaik. Ikuti permainan langkah demi langkah, baca penjelasan pada saat penting, dan teka langkah Grandmaster sebelum ia didedahkan."
      />
      <MasterclassView />
    </>
  );
}
