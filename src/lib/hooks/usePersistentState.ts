'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStore } from '@/lib/storage/db';

const isPlainObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Combine a stored value with the current one, keeping its shape.
 * - Arrays stay arrays (an array merged with object spread becomes {0: …} and breaks .includes).
 * - Plain objects are merged so newly added settings keep their defaults.
 * - A stored value of the wrong shape is repaired or ignored.
 */
export function mergeStored<T>(current: T, stored: unknown): T {
  if (Array.isArray(current)) {
    if (Array.isArray(stored)) return stored as T;
    if (isPlainObject(stored)) return Object.values(stored) as T; // repair data saved by the old bug
    return current;
  }
  if (isPlainObject(current)) return (isPlainObject(stored) ? { ...current, ...stored } : current) as T;
  return stored as T;
}

/** useState that is loaded from and saved to the IndexedDB settings store. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getStore()
      .then((s) => s.getSetting<T>(key))
      .then((v) => {
        if (!alive) return;
        if (v !== undefined) setValue((prev) => mergeStored(prev, v));
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        void getStore().then((s) => s.setSetting(key, v));
        return v;
      });
    },
    [key],
  );

  return [value, update, loaded] as const;
}
