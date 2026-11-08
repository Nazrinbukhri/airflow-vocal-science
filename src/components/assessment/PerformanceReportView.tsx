'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardTitle, ProgressBar } from '@/components/ui/primitives';
import type { AssessmentResult } from '@/lib/assessment/assessments';
import { buildPerformanceReport, type PerformanceReport, type ReportInput } from '@/lib/assessment/report';
import type { ProgressSummary } from '@/lib/storage/progress';
import { getStore } from '@/lib/storage/db';
import type { PuzzleResults } from '@/lib/tactics/puzzles';

async function gather(summary: ProgressSummary): Promise<ReportInput> {
  const s = await getStore();
  return {
    completedSessions: summary.completedCount,
    minutesStudied: summary.minutesStudied,
    lessons: (await s.getSetting('lessons:results')) ?? {},
    puzzles: (await s.getSetting<PuzzleResults>('tactics:results')) ?? {},
    openingsDone: (await s.getSetting<string[]>('openings:done')) ?? [],
    formationsDone: (await s.getSetting<string[]>('formations:done')) ?? [],
    games: (await s.getSetting('play:results')) ?? [],
    reviews: (await s.getSetting('review:history')) ?? [],
    assessments: {
      day1: await s.getSetting<AssessmentResult>('assessment:day1'),
      final: await s.getSetting<AssessmentResult>('assessment:final'),
    },
  };
}

export function PerformanceReportView({ summary, version, onViewed }: { summary: ProgressSummary; version: number; onViewed: () => void }) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  useEffect(() => {
    let alive = true;
    void gather(summary).then((input) => alive && setReport(buildPerformanceReport(input)));
    return () => { alive = false; };
  }, [summary, version]);

  if (!report) return null;

  const download = () => {
    const text = [
      'CHESS MASTER AI – Laporan Prestasi',
      new Date().toLocaleString('ms-MY'),
      '',
      `Skor keseluruhan: ${report.overall}/100`,
      report.level,
      '',
      ...report.lines,
      '',
      'Kemahiran:',
      ...report.skills.map((s) => `- ${s.name}: ${s.percent}% (${s.detail})`),
      '',
      'Kekuatan:', ...report.strengths.map((x) => `- ${x}`),
      '', 'Perlu diperbaiki:', ...report.weaknesses.map((x) => `- ${x}`),
      '', 'Cadangan:', ...report.recommendations.map((x) => `- ${x}`),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laporan-chess-master-ai.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div id="report" className="scroll-mt-24" />
      <CardTitle sub="Dikira daripada semua aktiviti anda dalam aplikasi ini (disimpan pada peranti ini).">Laporan prestasi</CardTitle>
      <div className="flex flex-wrap items-end gap-4" data-testid="performance-report">
        <p className="font-display text-5xl font-bold text-gold-300" data-testid="report-overall">{report.overall}<span className="text-xl text-charcoal-400">/100</span></p>
        <p className="max-w-md text-sm text-charcoal-100">{report.level}</p>
      </div>
      <ul className="mt-3 space-y-0.5 text-sm text-charcoal-200">{report.lines.map((l) => <li key={l}>• {l}</li>)}</ul>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Kekuatan</p>
          <ul className="mt-1 space-y-1 text-sm text-charcoal-100">{report.strengths.map((x) => <li key={x}>✓ {x}</li>)}</ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-300">Perlu diperbaiki</p>
          <ul className="mt-1 space-y-1 text-sm text-charcoal-100">{report.weaknesses.map((x) => <li key={x}>• {x}</li>)}</ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Cadangan seterusnya</p>
          <ul className="mt-1 space-y-1 text-sm text-charcoal-100">{report.recommendations.map((x) => <li key={x}>→ {x}</li>)}</ul>
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-charcoal-300">Semua kemahiran ({report.skills.length})</summary>
        <ul className="mt-2 space-y-2">
          {report.skills.map((s) => (
            <li key={s.name}>
              <div className="mb-0.5 flex justify-between text-xs"><span className="text-charcoal-100">{s.name}</span><span className="text-charcoal-400">{s.detail}</span></div>
              <ProgressBar value={s.percent} label={s.name} />
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={download}>Muat turun laporan (.txt)</Button>
        <Button variant="secondary" onClick={onViewed}>Tandakan Jam 48 selesai</Button>
      </div>
    </Card>
  );
}
