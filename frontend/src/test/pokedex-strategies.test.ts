import { describe, expect, it, vi, afterEach } from 'vitest';
import { CSVExporterStrategy } from '../features/pokedex/strategies/export/csv-exporter.strategy.js';
import { sharePokedexExport } from '../features/pokedex/strategies/export/share.js';
import { applyFilters } from '../features/pokedex/strategies/filter/filter-strategy.js';
import { createSortStrategy } from '../features/pokedex/strategies/sort/sort-strategy.factory.js';
import type { CatalogEntry } from '../features/pokedex/domain/pokemon.types.js';

const entries: CatalogEntry[] = [
  { id: 1, name: 'bulbasaur', sprite: null, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: 'first', tags: ['starter'], types: ['grass', 'poison'] },
  { id: 2, name: 'ivysaur', sprite: null, caught: false, caughtAt: null, notes: '', tags: [], types: ['grass', 'poison'] },
  { id: 3, name: 'venusaur', sprite: null, caught: true, caughtAt: '2024-06-01T00:00:00.000Z', notes: 'note, with comma', tags: [], types: ['fire'] },
];

describe('applyFilters', () => {
  it('filters by search text', () => {
    const result = applyFilters(entries, { search: 'ivy', types: [], caughtOnly: false });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('ivysaur');
  });

  it('filters caught-only entries', () => {
    const result = applyFilters(entries, { search: '', types: [], caughtOnly: true });
    expect(result.map((entry) => entry.name)).toEqual(['bulbasaur', 'venusaur']);
  });

  it('filters by type', () => {
    const result = applyFilters(entries, { search: '', types: ['fire'], caughtOnly: false });
    expect(result.map((entry) => entry.name)).toEqual(['venusaur']);
  });
});

describe('createSortStrategy', () => {
  it('sorts by name ascending', () => {
    const strategy = createSortStrategy({ field: 'name', direction: 'asc' });
    const sorted = [...entries].sort((a, b) => strategy.compare(a, b));
    expect(sorted.map((e) => e.name)).toEqual(['bulbasaur', 'ivysaur', 'venusaur']);
  });

  it('sorts by caughtAt descending', () => {
    const strategy = createSortStrategy({ field: 'caughtAt', direction: 'desc' });
    const sorted = [...entries].sort((a, b) => strategy.compare(a, b));
    expect(sorted[0]?.name).toBe('venusaur');
  });

  it('sorts by types ascending', () => {
    const strategy = createSortStrategy({ field: 'types', direction: 'asc' });
    const sorted = [...entries].sort((a, b) => strategy.compare(a, b));
    expect(sorted[0]?.name).toBe('venusaur');
  });
});

describe('CSVExporterStrategy', () => {
  it('produces a CSV with header and escaped values', () => {
    const strategy = new CSVExporterStrategy();
    const csv = strategy.export(entries);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name,caught,caughtAt,notes,tags');
    expect(lines).toHaveLength(4);
    expect(csv).toContain('"note, with comma"');
  });
});

describe('sharePokedexExport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: () => true });

    const result = await sharePokedexExport(new CSVExporterStrategy(), entries, 'pokedex');

    expect(share).toHaveBeenCalledOnce();
    expect(result.method).toBe('share');
  });

  it('treats a cancelled share sheet (AbortError) as handled', async () => {
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal('navigator', { share, canShare: () => true });

    const result = await sharePokedexExport(new CSVExporterStrategy(), entries, 'pokedex');

    expect(result.method).toBe('share');
  });

  it('falls back to clipboard when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const result = await sharePokedexExport(new CSVExporterStrategy(), entries, 'pokedex');

    expect(writeText).toHaveBeenCalledOnce();
    expect(result.method).toBe('clipboard');
  });

  it('falls back to file download when neither share nor clipboard are available', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() });
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === 'a') element.click = clickSpy;
      return element;
    });

    const result = await sharePokedexExport(new CSVExporterStrategy(), entries, 'pokedex');

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(result.method).toBe('download');

    vi.restoreAllMocks();
  });
});
