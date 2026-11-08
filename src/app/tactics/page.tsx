import type { Metadata } from 'next';
import { ModulePlan } from '@/components/ui/ModulePlan';
import { Card, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Taktik Agresif' };

const LEVELS = [
  { n: 1, title: 'Asas', items: ['Buah tergantung (hanging pieces)', 'Tangkapan percuma', 'Check asas', 'Ancaman asas', 'Serangan dua buah'] },
  { n: 2, title: 'Senjata utama', items: ['Knight fork', 'Serangan Gajah', 'Pin', 'Skewer', 'Double attack', 'Discovered attack'] },
  { n: 3, title: 'Kombinasi', items: ['Deflection', 'Decoy', 'Removing the defender', 'Clearance sacrifice', 'Zwischenzug', 'Back-rank mate'] },
  { n: 4, title: 'Serangan Raja', items: ['Greek gift sacrifice', 'Smothered mate', 'Arabian mate', "Anastasia's mate", 'King hunt', 'Kombinasi serangan'] },
];

export default function TacticsPage() {
  return (
    <>
      <PageHeader
        title="Taktik Agresif"
        titleEn="Aggressive Tactics"
        intro="Taktik ialah senjata penyerang. Setiap teka-teki mengajar anda melihat ancaman, mengira, dan memaksa lawan bertindak balas."
      />
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LEVELS.map((l) => (
            <Card key={l.n}>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tahap {l.n}</p>
              <h2 className="mb-2 font-display text-xl text-gold-200">{l.title}</h2>
              <ul className="space-y-1 text-sm text-charcoal-200">
                {l.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </Card>
          ))}
        </div>
        <ModulePlan
          phase={7}
          planned={[
            'Sekurang-kurangnya 100 teka-teki pilihan, disusun mengikut kesukaran.',
            'Setiap taktik: penjelasan, demonstrasi papan, objektif, penyelesaian sah, pilihan salah, pertahanan terbaik lawan dan serangan susulan.',
            'Setiap penyelesaian disahkan secara automatik (FEN sah, semua langkah sah, keputusan disemak dengan Stockfish) – tiada teka-teki dengan jawapan salah.',
            'Petunjuk berperingkat sebelum jawapan didedahkan.',
          ]}
          meanwhile={[{ href: '/fundamentals', label: 'Kenali buah catur dahulu' }]}
        />
      </div>
    </>
  );
}
