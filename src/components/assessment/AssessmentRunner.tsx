'use client';

import { useState } from 'react';
import { ExerciseCard } from '@/components/lessons/ExerciseCard';
import { Badge, Button, Card, CardTitle, ProgressBar } from '@/components/ui/primitives';
import { buildAssessment, CATEGORY_MS, type AssessmentId, type AssessmentResult, type Category } from '@/lib/assessment/assessments';

const INFO: Record<AssessmentId, { title: string; sub: string; session: string }> = {
  day1: { title: 'Ujian Hari 1', sub: 'Peraturan, notasi, checkmate, taktik asas dan pembukaan. 12 soalan.', session: 'h22' },
  final: { title: 'Cabaran Akhir', sub: 'Taktik tahap 2–4, pembukaan, pertahanan, endgame dan strategi. 15 soalan.', session: 'h47' },
};

export function AssessmentRunner({ id, result, onSave }: { id: AssessmentId; result?: AssessmentResult; onSave: (r: AssessmentResult, sessionId: string) => void }) {
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const items = buildAssessment(id);
  const item = items[i];
  const info = INFO[id];

  const finish = (all: Record<string, boolean>) => {
    const byCategory: Partial<Record<Category, { right: number; total: number }>> = {};
    for (const it of items) {
      const c = (byCategory[it.category] ??= { right: 0, total: 0 });
      c.total++;
      if (all[it.id]) c.right++;
    }
    onSave({ at: Date.now(), score: Object.values(all).filter(Boolean).length, total: items.length, byCategory }, info.session);
    setRunning(false);
  };

  return (
    <Card>
      <div id={id} className="scroll-mt-24" />
      <CardTitle sub={info.sub}>{info.title}</CardTitle>
      {!running ? (
        <div className="space-y-3">
          {result && (
            <div className="rounded-lg bg-charcoal-800/70 p-3" data-testid={`assessment-result-${id}`}>
              <p className="text-sm text-charcoal-200">
                Keputusan terakhir: <strong className="text-gold-200">{result.score}/{result.total}</strong> ({new Date(result.at).toLocaleDateString('ms-MY')})
              </p>
              <ul className="mt-2 flex flex-wrap gap-1">
                {(Object.entries(result.byCategory) as [Category, { right: number; total: number }][]).map(([k, v]) => (
                  <li key={k}><Badge tone={v.right === v.total ? 'emerald' : v.right === 0 ? 'red' : 'gold'}>{CATEGORY_MS[k]} {v.right}/{v.total}</Badge></li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="primary" onClick={() => { setRunning(true); setI(0); setAnswers({}); }} data-testid={`assessment-start-${id}`}>
            {result ? 'Ambil semula' : 'Mula'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-charcoal-300">
            <span>Soalan {i + 1}/{items.length} · {CATEGORY_MS[item!.category]}</span>
            <span>Betul: {Object.values(answers).filter(Boolean).length}</span>
          </div>
          <ProgressBar value={(i / items.length) * 100} label="Kemajuan ujian" />
          <ExerciseCard key={item!.id} exercise={item!.exercise} testId="assessment-item" onResult={(ok) => setAnswers((a) => (item!.id in a ? a : { ...a, [item!.id]: ok }))} />
          <div className="flex justify-end">
            {i < items.length - 1 ? (
              <Button variant="secondary" disabled={!(item!.id in answers)} onClick={() => setI(i + 1)} data-testid="assessment-next">Soalan seterusnya</Button>
            ) : (
              <Button variant="primary" disabled={!(item!.id in answers)} onClick={() => finish(answers)} data-testid="assessment-finish">Tamat & simpan</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
