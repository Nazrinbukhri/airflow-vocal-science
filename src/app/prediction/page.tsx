import type { Metadata } from 'next';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { Card, CardTitle, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Ramalan AI' };

const CHECKLIST = [
  'Adakah Raja saya selamat?',
  'Adakah mana-mana buah saya sedang diserang?',
  'Bolehkah saya tangkap buah percuma?',
  'Bolehkah saya beri check?',
  'Bolehkah saya cipta ancaman?',
  'Bolehkah saya serang dua buah serentak?',
  'Apakah jawapan terkuat lawan?',
];

export default function PredictionPage() {
  return (
    <>
      <PageHeader
        title="Ramalan AI"
        titleEn="AI Opponent Prediction Engine"
        intro="Stockfish mengira langkah terbaik. Kami terangkan kenapa – dan apa yang lawan mungkin balas. Enjin tidak boleh meramal keputusan manusia dengan pasti."
      />
      <div className="space-y-5">
        <Card>
          <CardTitle sub="Tanya diri anda sebelum setiap langkah">Senarai semak berfikir</CardTitle>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-charcoal-100">
            {CHECKLIST.map((c) => <li key={c}>{c}</li>)}
          </ol>
        </Card>
        <ModulePlan
          phase={4}
          planned={[
            'Analisis Stockfish WebAssembly sebenar dalam Web Worker (Fasa 3), berfungsi luar talian.',
            '3–5 langkah calon (MultiPV) dengan penilaian, kedalaman, status analisis dan variasi utama.',
            'Empat kategori: A. langkah terbaik enjin, B. alternatif agresif, C. langkah manusia paling biasa (hanya jika ada data pangkalan pembukaan bersumber), D. alternatif bertahan.',
            'Bagi setiap langkah: kenapa ia berkesan, apa yang diserang, dilindungi dan diancam, jawapan lawan, dan apa seterusnya.',
            'Tiada kebarangkalian atau statistik rekaan.',
          ]}
          meanwhile={[{ href: '/analysis', label: 'Import kedudukan FEN' }]}
        />
      </div>
    </>
  );
}
