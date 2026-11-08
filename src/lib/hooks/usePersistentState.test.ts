import { describe, expect, it } from 'vitest';
import { mergeStored } from './usePersistentState';

describe('mergeStored', () => {
  it('keeps arrays as arrays (regression: openings page crashed with "includes is not a function")', () => {
    const v = mergeStored<string[]>([], ['italian-main']);
    expect(Array.isArray(v)).toBe(true);
    expect(v.includes('italian-main')).toBe(true);
  });
  it('repairs an array that was saved as an object', () => {
    expect(mergeStored<string[]>([], { 0: 'a', 1: 'b' })).toEqual(['a', 'b']);
  });
  it('merges plain objects so new defaults survive', () => {
    expect(mergeStored({ mode: 'ai', level: 1, showCoach: true }, { mode: 'two', level: 3 })).toEqual({ mode: 'two', level: 3, showCoach: true });
  });
  it('ignores stored values of the wrong shape and passes primitives through', () => {
    expect(mergeStored<string[]>(['x'], 'oops')).toEqual(['x']);
    expect(mergeStored({ a: 1 }, ['bad'])).toEqual({ a: 1 });
    expect(mergeStored(5, 7)).toBe(7);
    expect(mergeStored<string | undefined>(undefined, 'kept')).toBe('kept');
  });
});
