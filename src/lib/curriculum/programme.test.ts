import { describe, expect, it } from 'vitest';
import { ALL_SESSIONS, PROGRAMME, TOTAL_HOURS, nextSession } from './programme';
import { NAV } from '@/lib/nav';

describe('48-hour programme', () => {
  it('has exactly 48 one-hour sessions, numbered 1..48 without gaps', () => {
    expect(TOTAL_HOURS).toBe(48);
    expect(ALL_SESSIONS.map((s) => s.hour)).toEqual(Array.from({ length: 48 }, (_, i) => i + 1));
  });

  it('blocks match their hour ranges and the brief (Day 1 = 1–24, Day 2 = 25–48)', () => {
    for (const b of PROGRAMME) {
      expect(b.sessions.length, b.id).toBe(b.toHour - b.fromHour + 1);
      expect(b.sessions[0]!.hour).toBe(b.fromHour);
      expect(b.day).toBe(b.fromHour <= 24 ? 1 : 2);
    }
    expect(PROGRAMME.map((b) => `${b.fromHour}-${b.toHour}`)).toEqual([
      '1-3', '4-6', '7-9', '10-12', '13-15', '16-18', '19-21', '22-24',
      '25-28', '29-32', '33-35', '36-38', '39-41', '42-44', '45-46', '47-48',
    ]);
  });

  it('has unique ids and every session links to an existing page', () => {
    const ids = ALL_SESSIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const routes = new Set(NAV.map((n) => n.href));
    for (const s of ALL_SESSIONS) expect(routes.has(s.route), s.id).toBe(true);
  });

  it('every session has concrete activities that point to real lessons/pages', async () => {
    const { SESSION_LINKS } = await import('./programme');
    const { LESSONS } = await import('@/lib/lessons/data');
    const routes = new Set(NAV.map((n) => n.href));
    for (const s of ALL_SESSIONS) {
      const links = SESSION_LINKS[s.id];
      expect(links?.length, s.id).toBeGreaterThan(0);
      for (const l of links!) {
        const [path, hash] = l.href.split('#');
        expect(routes.has(path!.replace(/\/$/, '') || '/'), l.href).toBe(true);
        if (hash && path === '/fundamentals/') expect(LESSONS.some((x) => x.id === hash), hash).toBe(true);
      }
    }
  });

  it('nextSession returns the first incomplete session in order', () => {
    expect(nextSession(new Set())?.hour).toBe(1);
    expect(nextSession(new Set(['h01', 'h02']))?.hour).toBe(3);
    expect(nextSession(new Set(['h02']))?.hour).toBe(1);
    expect(nextSession(new Set(ALL_SESSIONS.map((s) => s.id)))).toBeUndefined();
  });
});
