import type { Metadata } from 'next';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Perpustakaan Formasi' };

export default function FormationsPage() {
  return (
    <>
      <PageHeader
        title="Perpustakaan Formasi"
        titleEn="Chess Formation Library"
        intro="Struktur Pion menentukan rancangan. Penyerang yang baik tahu di mana lawan lemah – dan di mana dirinya sendiri lemah."
      />
      <ModulePlan
        phase={7}
        planned={[
          '15 formasi: rantai Pion, Pion terpencil, Pion berganda, Pion mundur, Pion lulus, Pion lulus berhubung, fail terbuka, fail separuh terbuka, petak lemah, outpost, fianchetto, serangan sayap Raja, serangan sayap Menteri, minority attack, majoriti Pion tengah.',
          'Setiap formasi: papan interaktif, penjelasan, peluang serangan, kelemahan, cara mengeksploitasi, cara mempertahankan, dan satu latihan praktikal.',
        ]}
        meanwhile={[{ href: '/play', label: 'Buka papan latihan' }]}
      />
    </>
  );
}
