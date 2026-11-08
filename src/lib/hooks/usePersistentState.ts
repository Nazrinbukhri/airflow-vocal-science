'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStore } from '@/lib/storage/db';

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
        if (v !== undefined) setValue((prev) => (typeof prev === 'object' && prev && typeof v === 'object' ? { ...prev, ...v } : v));
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
