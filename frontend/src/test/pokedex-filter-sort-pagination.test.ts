import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { applyFilters } from '../features/pokedex/strategies/filter/filter-strategy.js';
import { createSortStrategy } from '../features/pokedex/strategies/sort/sort-strategy.factory.js';
import { useFilterSort } from '../features/pokedex/hooks/useFilterSort.js';
import type { CatalogEntry } from '../features/pokedex/domain/pokemon.types.js';

function entry(overrides: Partial<CatalogEntry> & { id: number; name: string }): CatalogEntry {
  return {
    sprite: null,
    caught: false,
    caughtAt: null,
    notes: '',
    tags: [],
    types: [],
    height: null,
    ...overrides,
  };
}

const dataset: CatalogEntry[] = [
  entry({ id: 4, name: 'charmander', types: ['fire'], caught: false }),
  entry({ id: 5, name: 'charmeleon', types: ['fire'], caught: false }),
  entry({ id: 6, name: 'charizard', types: ['fire', 'flying'], caught: true, caughtAt: '2024-03-01T00:00:00.000Z' }),
  entry({ id: 25, name: 'pikachu', types: ['electric'], caught: false }),
  entry({ id: 26, name: 'raichu', types: ['electric'], caught: true, caughtAt: '2024-01-01T00:00:00.000Z' }),
  entry({ id: 83, name: "farfetch'd", types: ['flying'], caught: false }),
  entry({ id: 122, name: 'mr. mime', types: ['psychic'], caught: false }),
];

describe('applyFilters — combined AND logic', () => {
  it('combines search + types (OR within types) + caughtOnly with AND across the dataset', () => {
    const result = applyFilters(dataset, { search: 'char', types: ['fire', 'flying'], caughtOnly: true });
    expect(result.map((e) => e.name)).toEqual(['charizard']);
  });

  it('returns zero matches when filters exclude everything', () => {
    const result = applyFilters(dataset, { search: 'pikachu', types: ['fire'], caughtOnly: false });
    expect(result).toHaveLength(0);
  });
});

describe('applyFilters — search edge cases', () => {
  it('strips leading/trailing whitespace', () => {
    const result = applyFilters(dataset, { search: '  pikachu  ', types: [], caughtOnly: false });
    expect(result.map((e) => e.name)).toEqual(['pikachu']);
  });

  it('is case-insensitive', () => {
    const result = applyFilters(dataset, { search: 'PIKACHU', types: [], caughtOnly: false });
    expect(result.map((e) => e.name)).toEqual(['pikachu']);
  });

  it('matches by Dex ID with a leading #', () => {
    const result = applyFilters(dataset, { search: '#025', types: [], caughtOnly: false });
    expect(result.map((e) => e.name)).toEqual(['pikachu']);
  });

  it('matches by plain Dex ID string', () => {
    const result = applyFilters(dataset, { search: '25', types: [], caughtOnly: false });
    expect(result.map((e) => e.name)).toEqual(['pikachu']);
  });

  it('handles apostrophes and punctuation in names safely', () => {
    expect(applyFilters(dataset, { search: "farfetch'd", types: [], caughtOnly: false }).map((e) => e.name)).toEqual([
      "farfetch'd",
    ]);
    expect(applyFilters(dataset, { search: 'mr. mime', types: [], caughtOnly: false }).map((e) => e.name)).toEqual([
      'mr. mime',
    ]);
  });

  it('treats regex-special characters as literal text, not a pattern', () => {
    const result = applyFilters(dataset, { search: '.*', types: [], caughtOnly: false });
    expect(result).toHaveLength(0);
  });
});

describe('createSortStrategy — data-level tie-breaking', () => {
  it('breaks height ties using Dex ID ascending regardless of direction', () => {
    const entries: CatalogEntry[] = [
      entry({ id: 10, name: 'b', height: 7 }),
      entry({ id: 2, name: 'a', height: 7 }),
      entry({ id: 5, name: 'c', height: 3 }),
    ];
    const asc = createSortStrategy({ field: 'height', direction: 'asc' });
    expect([...entries].sort((a, b) => asc.compare(a, b)).map((e) => e.id)).toEqual([5, 2, 10]);

    const desc = createSortStrategy({ field: 'height', direction: 'desc' });
    expect([...entries].sort((a, b) => desc.compare(a, b)).map((e) => e.id)).toEqual([2, 10, 5]);
  });

  it('pushes entries without a fetched height to the end regardless of direction', () => {
    const entries: CatalogEntry[] = [
      entry({ id: 1, name: 'a', height: null }),
      entry({ id: 2, name: 'b', height: 5 }),
    ];
    const strategy = createSortStrategy({ field: 'height', direction: 'desc' });
    expect([...entries].sort((a, b) => strategy.compare(a, b)).map((e) => e.id)).toEqual([2, 1]);
  });

  it('"recently caught" sort appends uncaught entries (no caughtAt) at the end', () => {
    const entries: CatalogEntry[] = [
      entry({ id: 1, name: 'a', caught: false, caughtAt: null }),
      entry({ id: 2, name: 'b', caught: true, caughtAt: '2024-05-01T00:00:00.000Z' }),
      entry({ id: 3, name: 'c', caught: true, caughtAt: '2024-06-01T00:00:00.000Z' }),
    ];
    const strategy = createSortStrategy({ field: 'caughtAt', direction: 'desc' });
    const sorted = [...entries].sort((a, b) => strategy.compare(a, b));
    expect(sorted.map((e) => e.id)).toEqual([3, 2, 1]);
  });
});

describe('useFilterSort — pagination-relevant state', () => {
  it('sorts the FULL dataset, not just a rendered slice', () => {
    const { result } = renderHook(() => useFilterSort(dataset));
    act(() => result.current.setSort({ field: 'height', direction: 'asc' }));
    // All 7 entries should still be present (nothing dropped by sorting alone).
    expect(result.current.result).toHaveLength(dataset.length);
  });

  it('re-derives the filtered+sorted result whenever filters or sort change', () => {
    const { result } = renderHook(() => useFilterSort(dataset));
    act(() => result.current.setFilters({ search: '', types: ['fire'], caughtOnly: false }));
    expect(result.current.result.map((e) => e.name)).toEqual(['charmander', 'charmeleon', 'charizard']);

    act(() => result.current.setSort({ field: 'name', direction: 'desc' }));
    expect(result.current.result.map((e) => e.name)).toEqual(['charmeleon', 'charmander', 'charizard']);
  });
});
