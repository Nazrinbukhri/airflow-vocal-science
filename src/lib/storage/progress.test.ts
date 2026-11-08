import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, memoryStore, resetStoreForTests } from './db';
import { completeSession, loadProgress, resetAllProgress, resetSession, startSession } from './progress';

describe.each([
  ['IndexedDB', async () => {
    resetStoreForTests();
    const s = await getStore();
    await s.clearProgress();
    return s;
  }],
  ['memory fallback', async () => memoryStore()],
])('progress with %s', (_name, makeStore) => {
  let store: Awaited<ReturnType<typeof makeStore>>;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('starts empty, pointing to hour 1', async () => {
    const p = await loadProgress(store);
    expect(p.completedCount).toBe(0);
    expect(p.percent).toBe(0);
    expect(p.next?.hour).toBe(1);
  });

  it('records start and completion, and resumes at the next session', async () => {
    await startSession('h01', store);
    let p = await loadProgress(store);
    expect(p.inProgressIds.has('h01')).toBe(true);
    expect(p.next?.id).toBe('h01');

    await completeSession('h01', 45, store);
    await completeSession('h02', 50, store);
    p = await loadProgress(store);
    expect(p.completedCount).toBe(2);
    expect(p.minutesStudied).toBe(95);
    expect(p.next?.id).toBe('h03');
    expect(p.percent).toBe(Math.round((2 / 48) * 100));
  });

  it('can undo one session or reset everything', async () => {
    await completeSession('h01', 45, store);
    await completeSession('h02', 45, store);
    await resetSession('h01', store);
    expect((await loadProgress(store)).next?.id).toBe('h01');
    await resetAllProgress(store);
    expect((await loadProgress(store)).completedCount).toBe(0);
  });

  it('ignores unknown session ids', async () => {
    await completeSession('h99', 45, store);
    expect((await loadProgress(store)).completedCount).toBe(0);
  });
});

describe('IndexedDB persistence', () => {
  it('survives reopening the database (like a page reload)', async () => {
    resetStoreForTests();
    const a = await getStore();
    await a.clearProgress();
    await completeSession('h05', 45, a);
    await a.setSetting('game:play', { pgn: '1. e4 *', ply: 1 });
    resetStoreForTests();
    const b = await getStore();
    expect(b.persistent).toBe(true);
    expect((await loadProgress(b)).completedIds.has('h05')).toBe(true);
    expect(await b.getSetting('game:play')).toEqual({ pgn: '1. e4 *', ply: 1 });
  });
});
