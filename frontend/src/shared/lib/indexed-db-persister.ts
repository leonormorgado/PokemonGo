import { openDB, type IDBPDatabase } from 'idb';
import type { Persister } from '@tanstack/react-query-persist-client';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

const DB_NAME = 'pokedex-query-cache';
const STORE_NAME = 'reactQuery';
const CACHE_KEY = 'client';

async function getCacheDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Persists the entire React Query cache to IndexedDB for offline-first hydration.
export function createIndexedDbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      const db = await getCacheDb();
      await db.put(STORE_NAME, client, CACHE_KEY);
    },
    restoreClient: async () => {
      const db = await getCacheDb();
      return db.get(STORE_NAME, CACHE_KEY);
    },
    removeClient: async () => {
      const db = await getCacheDb();
      await db.delete(STORE_NAME, CACHE_KEY);
    },
  };
}
