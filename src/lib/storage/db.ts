import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type SessionProgress = {
  sessionId: string;
  status: 'in-progress' | 'completed';
  startedAt: number;
  completedAt?: number;
  /** Minutes the learner reported (or the timer measured) for this session. */
  minutes: number;
};

export type SavedGame = {
  id?: number;
  createdAt: number;
  title: string;
  pgn: string;
};

interface ChessMasterDB extends DBSchema {
  progress: { key: string; value: SessionProgress };
  settings: { key: string; value: unknown };
  games: { key: number; value: SavedGame; indexes: { byCreated: number } };
}

export const DB_NAME = 'chess-master-ai';
export const DB_VERSION = 1;

/**
 * Minimal key-value API used by the rest of the app. Backed by IndexedDB, or by
 * memory when IndexedDB is unavailable (e.g. some private-browsing modes) so the
 * app still works – progress just is not kept after the tab closes.
 */
export interface Store {
  readonly persistent: boolean;
  getAllProgress(): Promise<SessionProgress[]>;
  putProgress(p: SessionProgress): Promise<void>;
  deleteProgress(sessionId: string): Promise<void>;
  clearProgress(): Promise<void>;
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting<T>(key: string, value: T): Promise<void>;
  addGame(g: SavedGame): Promise<number>;
  listGames(): Promise<SavedGame[]>;
}

function idbStore(db: IDBPDatabase<ChessMasterDB>): Store {
  return {
    persistent: true,
    getAllProgress: () => db.getAll('progress'),
    putProgress: async (p) => {
      await db.put('progress', p, p.sessionId);
    },
    deleteProgress: (id) => db.delete('progress', id),
    clearProgress: () => db.clear('progress'),
    getSetting: async <T,>(key: string) => (await db.get('settings', key)) as T | undefined,
    setSetting: async (key, value) => {
      await db.put('settings', value, key);
    },
    addGame: (g) => db.add('games', g),
    listGames: async () => (await db.getAllFromIndex('games', 'byCreated')).reverse(),
  };
}

export function memoryStore(): Store {
  const progress = new Map<string, SessionProgress>();
  const settings = new Map<string, unknown>();
  const games: SavedGame[] = [];
  return {
    persistent: false,
    getAllProgress: async () => [...progress.values()],
    putProgress: async (p) => void progress.set(p.sessionId, { ...p }),
    deleteProgress: async (id) => void progress.delete(id),
    clearProgress: async () => progress.clear(),
    getSetting: async <T,>(key: string) => settings.get(key) as T | undefined,
    setSetting: async (key, value) => void settings.set(key, value),
    addGame: async (g) => {
      const id = games.length + 1;
      games.push({ ...g, id });
      return id;
    },
    listGames: async () => [...games].reverse(),
  };
}

let storePromise: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!storePromise) storePromise = openStore();
  return storePromise;
}

/** Test hook: forget the cached connection. */
export function resetStoreForTests(): void {
  storePromise = null;
}

async function openStore(): Promise<Store> {
  if (typeof indexedDB === 'undefined') return memoryStore();
  try {
    const db = await openDB<ChessMasterDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('progress');
        database.createObjectStore('settings');
        const games = database.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
        games.createIndex('byCreated', 'createdAt');
      },
    });
    // Ask the browser not to evict our data (Safari can clear storage of unused sites).
    void navigator.storage?.persist?.().catch(() => undefined);
    return idbStore(db);
  } catch {
    return memoryStore();
  }
}
