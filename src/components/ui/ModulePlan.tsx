import Link from 'next/link';
import { Badge, Card, CardTitle, buttonClass } from './primitives';

/**
 * Shown on modules whose main feature belongs to a later phase.
 * It lists what will be built – it never pretends the feature exists yet.
 */
export function ModulePlan({
  phase,
  planned,
  meanwhile,
}: {
  phase: number;
  planned: string[];
  meanwhile?: { href: string; label: string }[];
}) {
  return (
    <Card className="border-dashed">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="gold">Akan datang · Fasa {phase}</Badge>
        <Badge>Dalam pembinaan</Badge>
      </div>
      <CardTitle sub="Modul ini belum aktif. Inilah yang akan dibina:">Rancangan modul</CardTitle>
      <ul className="space-y-2 text-sm text-charcoal-100">
        {planned.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      {meanwhile && meanwhile.length > 0 && (
        <div className="mt-4 border-t border-charcoal-700 pt-4">
          <p className="mb-2 text-sm text-charcoal-300">Sementara itu, anda boleh:</p>
          <div className="flex flex-wrap gap-2">
            {meanwhile.map((m) => (
              <Link key={m.href} href={m.href} className={buttonClass('ghost')}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
