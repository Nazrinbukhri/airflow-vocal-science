import type { Metadata } from 'next';
import { OpeningTrainer } from '@/components/openings/OpeningTrainer';
import { Card, CardTitle, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Akademi Pembukaan' };

export default function OpeningsPage() {
  return (
    <>
      <PageHeader
        title="Akademi Pembukaan"
        titleEn="Aggressive Opening Academy"
        intro="Prinsip dahulu, variasi kemudian. Setiap langkah diterangkan. Tonton dalam mod Tunjuk, kemudian mainkan sendiri dalam mod Latih."
      />
      <div className="space-y-5">
        <Card>
          <CardTitle sub="Opening principles – sebelum mana-mana pembukaan">Tiga prinsip pembukaan</CardTitle>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-charcoal-100">
            <li><strong className="text-white">Kawal tengah</strong> (centre control) – petak e4, d4, e5, d5.</li>
            <li><strong className="text-white">Bangunkan buah</strong> (development) – Kuda dan Gajah keluar sebelum Menteri. Jangan gerakkan buah yang sama dua kali tanpa sebab.</li>
            <li><strong className="text-white">Selamatkan Raja</strong> (king safety) – castle awal, biasanya sebelum langkah ke-10.</li>
          </ol>
          <p className="mt-2 text-sm text-charcoal-300">
            Gaya agresif yang sihat: bangun dengan ancaman (contoh Nf3 menyerang e5), tetapi jangan serang dengan Menteri sahaja
            sebelum buah lain keluar.
          </p>
        </Card>
        <OpeningTrainer />
      </div>
    </>
  );
}
