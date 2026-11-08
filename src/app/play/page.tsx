import type { Metadata } from 'next';
import { PlayView } from '@/components/play/PlayView';
import { PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Lawan AI' };

export default function PlayPage() {
  return (
    <>
      <PageHeader
        title="Lawan AI"
        titleEn="Play Against AI"
        intro="Main lawan Stockfish – enjin catur sebenar yang berjalan dalam pelayar anda, juga di luar talian. Mula pada tahap 1 dan naik perlahan-lahan. Sebelum setiap langkah: adakah Raja saya selamat? Apa ancaman lawan?"
      />
      <PlayView />
    </>
  );
}
