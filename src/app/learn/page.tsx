import type { Metadata } from 'next';
import { ProgrammeView } from '@/components/learn/ProgrammeView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Mula Belajar' };

export default function LearnPage() {
  return (
    <>
      <PageHeader
        title="Mula Belajar"
        titleEn="Start Learning · 48-hour programme"
        intro="Program anda dibahagi kepada 48 sesi pendek. Ikut susunan, satu sesi pada satu masa. Sesi seterusnya ditanda dengan warna emas."
      />
      <ProgrammeView />
    </>
  );
}
