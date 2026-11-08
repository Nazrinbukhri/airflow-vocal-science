'use client';

import { useEffect, useState } from 'react';
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner';
import { PerformanceReportView } from '@/components/assessment/PerformanceReportView';
import { Badge, Button, Card, CardTitle, ProgressBar } from '@/components/ui/primitives';
import type { AssessmentResult } from '@/lib/assessment/assessments';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { PROGRAMME, TOTAL_HOURS } from '@/lib/curriculum/programme';
import { useProgress } from '@/lib/hooks/useProgress';

export function ProgressView() {
  const { summary, resetAll, complete } = useProgress();
  const [day1, setDay1] = usePersistentState<AssessmentResult | undefined>('assessment:day1', undefined);
  const [final, setFinal] = usePersistentState<AssessmentResult | undefined>('assessment:final', undefined);
  const [version, setVersion] = useState(0);
  const loaded = !!summary;
  // Links like /progress/#final: scroll once the content exists.
  useEffect(() => {
    if (!loaded || !window.location.hash) return;
    const t = setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }), 50);
    return () => clearTimeout(t);
  }, [loaded]);
  if (!summary) return <p className="text-charcoal-300">Memuatkan kemajuan…</p>;

  const hours = (summary.minutesStudied / 60).toFixed(1);
  const last = summary.lastActivity ? new Date(summary.lastActivity).toLocaleString('ms-MY') : 'Belum ada';

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-charcoal-400">Program selesai</p>
          <p className="font-display text-4xl font-bold text-gold-300">{summary.percent}%</p>
          <div className="mt-2">
            <ProgressBar value={summary.percent} label="Program selesai" />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-charcoal-400">Sesi selesai</p>
          <p className="font-display text-4xl font-bold text-white">
            {summary.completedCount}
            <span className="text-xl text-charcoal-400">/{TOTAL_HOURS}</span>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-charcoal-400">Masa belajar</p>
          <p className="font-display text-4xl font-bold text-white">
            {hours}
            <span className="text-xl text-charcoal-400"> jam</span>
          </p>
          <p className="text-xs text-charcoal-400">Aktiviti terakhir: {last}</p>
        </Card>
      </div>

      <Card>
        <CardTitle sub="Kemajuan setiap blok program">Mengikut blok</CardTitle>
        <ul className="space-y-3">
          {PROGRAMME.map((b) => {
            const n = b.sessions.filter((s) => summary.completedIds.has(s.id)).length;
            return (
              <li key={b.id}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="text-charcoal-100">
                    <span className="mr-2 font-mono text-xs text-charcoal-400">
                      H{b.day} · J{b.fromHour}–{b.toHour}
                    </span>
                    {b.title}
                  </span>
                  {n === b.sessions.length ? (
                    <Badge tone="emerald">Lengkap</Badge>
                  ) : (
                    <span className="text-xs text-charcoal-400">
                      {n}/{b.sessions.length}
                    </span>
                  )}
                </div>
                <ProgressBar value={(n / b.sessions.length) * 100} label={b.title} />
              </li>
            );
          })}
        </ul>
      </Card>

      <AssessmentRunner id="day1" result={day1} onSave={(r, sid) => { setDay1(r); void complete(sid); setVersion((v) => v + 1); }} />
      <AssessmentRunner id="final" result={final} onSave={(r, sid) => { setFinal(r); void complete(sid); setVersion((v) => v + 1); }} />
      <PerformanceReportView summary={summary} version={version + (day1?.at ?? 0) + (final?.at ?? 0)} onViewed={() => void complete('h48')} />

      <Card>
        <CardTitle sub="Data disimpan pada peranti ini sahaja.">Storan</CardTitle>
        <p className="text-sm text-charcoal-300">
          Kemajuan disimpan{' '}
          {summary.persistent ? 'dalam IndexedDB pada peranti ini' : 'dalam memori sahaja (storan pelayar tidak tersedia)'}.
        </p>
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('Padam semua kemajuan sesi? Tindakan ini tidak boleh dibatalkan.')) void resetAll();
            }}
          >
            Set semula kemajuan sesi
          </Button>
        </div>
      </Card>
    </div>
  );
}
