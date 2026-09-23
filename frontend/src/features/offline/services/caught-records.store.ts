import { openDB, type IDBPDatabase } from 'idb';
import type { CaughtRecord } from '../../pokedex/domain/pokemon.types.js';

const DB_NAME = 'pokedex-db';
const DB_VERSION = 1;
export const CAUGHT_STORE = 'caughtRecords';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CAUGHT_STORE)) {
        db.createObjectStore(CAUGHT_STORE, { keyPath: 'pokemonId' });
      }
    },
  });
  return dbPromise;
}

export const caughtRecordsStore = {
  async getAll(): Promise<CaughtRecord[]> {
    const db = await getDb();
    return db.getAll(CAUGHT_STORE);
  },

  async get(pokemonId: number): Promise<CaughtRecord | undefined> {
    const db = await getDb();
    return db.get(CAUGHT_STORE, pokemonId);
  },

  async put(record: CaughtRecord): Promise<void> {
    const db = await getDb();
    await db.put(CAUGHT_STORE, record);
  },

  async delete(pokemonId: number): Promise<void> {
    const db = await getDb();
    await db.delete(CAUGHT_STORE, pokemonId);
  },

  async deleteMany(pokemonIds: number[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(CAUGHT_STORE, 'readwrite');
    await Promise.all(pokemonIds.map((id) => tx.store.delete(id)));
    await tx.done;
  },
};
