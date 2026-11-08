import type { Metadata } from 'next';
import { GameWorkbench, NotationHelp } from '@/components/game/GameWorkbench';
import { Badge, PageHeader } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Lawan AI' };

export default function PlayPage() {
  return (
    <>
      <PageHeader
        title="Lawan AI"
        titleEn="Play Against AI"
        intro="Papan penuh dengan semua peraturan catur. Buat masa ini anda menggerakkan kedua-dua pihak (mod dua pemain). Lawan Stockfish ditambah dalam Fasa 3."
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="emerald">Mod dua pemain</Badge>
          <Badge tone="gold">Lawan Stockfish · Fasa 3</Badge>
        </div>
      </PageHeader>
      <GameWorkbench storageKey="game:play" aside={<NotationHelp />} />
    </>
  );
}
