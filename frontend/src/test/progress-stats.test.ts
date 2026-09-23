import { describe, expect, it } from 'vitest';
import { computeProgressStats } from '../features/pokedex/utils/progress-stats.js';
import type { CatalogEntry } from '../features/pokedex/domain/pokemon.types.js';

const entries: CatalogEntry[] = [
  { id: 1, name: 'bulbasaur', sprite: null, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [], types: ['grass', 'poison'] },
  { id: 2, name: 'ivysaur', sprite: null, caught: false, caughtAt: null, notes: '', tags: [], types: ['grass', 'poison'] },
  { id: 3, name: 'charmander', sprite: null, caught: true, caughtAt: '2024-06-01T00:00:00.000Z', notes: '', tags: [], types: ['fire'] },
];

describe('computeProgressStats', () => {
  it('computes overall caught count and percentage', () => {
    const stats = computeProgressStats(entries);
    expect(stats.caughtCount).toBe(2);
    expect(stats.totalCount).toBe(3);
    expect(stats.percentCaught).toBe(67);
  });

  it('computes per-type distribution', () => {
    const stats = computeProgressStats(entries);
    expect(stats.typeDistribution).toEqual([
      { type: 'fire', caught: 1, total: 1 },
      { type: 'grass', caught: 1, total: 2 },
      { type: 'poison', caught: 1, total: 2 },
    ]);
  });

  it('handles empty entries', () => {
    const stats = computeProgressStats([]);
    expect(stats).toEqual({ caughtCount: 0, totalCount: 0, percentCaught: 0, typeDistribution: [] });
  });
});
