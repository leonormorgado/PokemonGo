import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { caughtRecordsStore } from '../features/offline/services/caught-records.store.js';
import type { CaughtRecord } from '../features/pokedex/domain/pokemon.types.js';

describe('caughtRecordsStore', () => {
  beforeEach(async () => {
    const existing = await caughtRecordsStore.getAll();
    await caughtRecordsStore.deleteMany(existing.map((record) => record.pokemonId));
  });

  it('returns an empty array when nothing has been persisted', async () => {
    await expect(caughtRecordsStore.getAll()).resolves.toEqual([]);
  });

  it('persists a caught record and retrieves it', async () => {
    const record: CaughtRecord = { pokemonId: 1, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: 'first', tags: ['starter'] };

    await caughtRecordsStore.put(record);

    await expect(caughtRecordsStore.get(1)).resolves.toEqual(record);
    await expect(caughtRecordsStore.getAll()).resolves.toEqual([record]);
  });

  it('overwrites an existing record with the same pokemonId', async () => {
    await caughtRecordsStore.put({ pokemonId: 1, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });
    await caughtRecordsStore.put({ pokemonId: 1, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: 'updated', tags: ['fast'] });

    const record = await caughtRecordsStore.get(1);
    expect(record?.notes).toBe('updated');
    expect(record?.tags).toEqual(['fast']);
  });

  it('deletes a single record', async () => {
    await caughtRecordsStore.put({ pokemonId: 1, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });
    await caughtRecordsStore.put({ pokemonId: 2, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });

    await caughtRecordsStore.delete(1);

    await expect(caughtRecordsStore.get(1)).resolves.toBeUndefined();
    await expect(caughtRecordsStore.getAll()).resolves.toHaveLength(1);
  });

  it('deletes many records at once', async () => {
    await caughtRecordsStore.put({ pokemonId: 1, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });
    await caughtRecordsStore.put({ pokemonId: 2, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });
    await caughtRecordsStore.put({ pokemonId: 3, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [] });

    await caughtRecordsStore.deleteMany([1, 3]);

    const remaining = await caughtRecordsStore.getAll();
    expect(remaining.map((r) => r.pokemonId)).toEqual([2]);
  });

  it('persists data across calls (simulating reads after a reload)', async () => {
    await caughtRecordsStore.put({ pokemonId: 42, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: 'persisted', tags: [] });

    await expect(caughtRecordsStore.get(42)).resolves.toMatchObject({ notes: 'persisted' });
  });
});
