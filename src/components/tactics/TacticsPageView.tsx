'use client';

import { useState } from 'react';
import { LessonBrowser } from '@/components/lessons/LessonBrowser';
import { TacticsTrainer } from '@/components/tactics/TacticsTrainer';

export function TacticsPageView() {
  const [tab, setTab] = useState<'puzzles' | 'lessons'>('puzzles');
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {([['puzzles', 'Teka-teki taktik'], ['lessons', 'Pelajaran serangan & pertahanan']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-12 rounded-xl text-sm ${tab === k ? 'bg-emerald-600/25 text-gold-200 ring-1 ring-emerald-500/50' : 'border border-charcoal-700 text-charcoal-300'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'puzzles' ? <TacticsTrainer /> : <LessonBrowser modules={['attack']} />}
    </div>
  );
}
