import type { Metadata } from 'next';
import { FormationLibrary } from '@/components/formations/FormationLibrary';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Perpustakaan Formasi' };

export default function FormationsPage() {
  return (
    <>
      <PageHeader
        title="Perpustakaan Formasi"
        titleEn="Chess Formation Library"
        intro="Struktur Pion menentukan rancangan. Penyerang yang baik tahu di mana lawan lemah – dan di mana dirinya sendiri lemah. Setiap formasi ada papan, penjelasan dan latihan."
      />
      <FormationLibrary />
    </>
  );
}
