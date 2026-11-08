import { ALL_SESSIONS, STUDY_MINUTES, TOTAL_HOURS, nextSession, type Session } from '@/lib/curriculum/programme';
import { getStore, type SessionProgress, type Store } from './db';

export type ProgressSummary = {
  completedIds: Set<string>;
  inProgressIds: Set<string>;
  completedCount: number;
  totalSessions: number;
  percent: number;
  minutesStudied: number;
  next: Session | undefined;
  lastActivity: number | undefined;
  persistent: boolean;
};

export function summarise(records: SessionProgress[], persistent: boolean): ProgressSummary {
  const valid = new Set(ALL_SESSIONS.map((s) => s.id));
  const own = records.filter((r) => valid.has(r.sessionId));
  const completedIds = new Set(own.filter((r) => r.status === 'completed').map((r) => r.sessionId));
  const inProgressIds = new Set(own.filter((r) => r.status === 'in-progress').map((r) => r.sessionId));
  const lastActivity = own.reduce<number | undefined>(
    (max, r) => Math.max(max ?? 0, r.completedAt ?? r.startedAt),
    undefined,
  );
  return {
    completedIds,
    inProgressIds,
    completedCount: completedIds.size,
    totalSessions: TOTAL_HOURS,
    percent: Math.round((completedIds.size / TOTAL_HOURS) * 100),
    minutesStudied: own.reduce((sum, r) => sum + (r.minutes || 0), 0),
    next: nextSession(completedIds),
    lastActivity,
    persistent,
  };
}

export async function loadProgress(store?: Store): Promise<ProgressSummary> {
  const s = store ?? (await getStore());
  return summarise(await s.getAllProgress(), s.persistent);
}

export async function startSession(sessionId: string, store?: Store): Promise<void> {
  const s = store ?? (await getStore());
  const existing = (await s.getAllProgress()).find((r) => r.sessionId === sessionId);
  if (existing) return;
  await s.putProgress({ sessionId, status: 'in-progress', startedAt: Date.now(), minutes: 0 });
}

export async function completeSession(
  sessionId: string,
  minutes: number = STUDY_MINUTES,
  store?: Store,
): Promise<void> {
  const s = store ?? (await getStore());
  const existing = (await s.getAllProgress()).find((r) => r.sessionId === sessionId);
  const now = Date.now();
  await s.putProgress({
    sessionId,
    status: 'completed',
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
    minutes: Math.max(existing?.minutes ?? 0, minutes),
  });
}

export async function resetSession(sessionId: string, store?: Store): Promise<void> {
  const s = store ?? (await getStore());
  await s.deleteProgress(sessionId);
}

export async function resetAllProgress(store?: Store): Promise<void> {
  const s = store ?? (await getStore());
  await s.clearProgress();
}
