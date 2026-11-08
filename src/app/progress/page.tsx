import type { Metadata } from 'next';
import { ProgressView } from '@/components/progress/ProgressView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Kemajuan Saya' };

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Kemajuan Saya" titleEn="My Progress" intro="Semua kemajuan disimpan dalam peranti ini dan boleh disambung bila-bila masa." />
      <ProgressView />
    </>
  );
}
