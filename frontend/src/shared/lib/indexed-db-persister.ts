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

interface InfiniteQueryData {
  pages: unknown[];
  pageParams: unknown[];
}

function isInfiniteQueryData(data: unknown): data is InfiniteQueryData {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as InfiniteQueryData).pages) &&
    Array.isArray((data as InfiniteQueryData).pageParams)
  );
}

// Reset the pokemon list to its first page on reload so we don't restart the app with every
// previously infinite-scrolled page still in memory.
function trimPokemonListPages(client: PersistedClient): PersistedClient {
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries.map((query) => {
        const isPokemonList = Array.isArray(query.queryKey) && query.queryKey[1] === 'list';
        if (!isPokemonList || !isInfiniteQueryData(query.state.data)) return query;
        return {
          ...query,
          state: {
            ...query.state,
            data: {
              pages: query.state.data.pages.slice(0, 1),
              pageParams: query.state.data.pageParams.slice(0, 1),
            },
          },
        };
      }),
    },
  };
}

// Persists the entire React Query cache to IndexedDB for offline-first hydration.
export function createIndexedDbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      const db = await getCacheDb();
      await db.put(STORE_NAME, trimPokemonListPages(client), CACHE_KEY);
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

