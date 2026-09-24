import { useMemo, useState } from 'react';
import type { CatalogEntry, FilterOptions, SortOption } from '../domain/pokemon.types.js';
import { applyFilters } from '../strategies/filter/filter-strategy.js';
import { createSortStrategy } from '../strategies/sort/sort-strategy.factory.js';

const DEFAULT_FILTERS: FilterOptions = { search: '', types: [], caughtOnly: false, idRange: null };
const DEFAULT_SORT: SortOption = { field: 'id', direction: 'asc' };

/**
 * Combines the filter and sort strategy pattern with the search/sort UI state.
 * @param entries The full catalog to derive from; filtering/sorting happen client-side
 * since the whole catalog is already cached locally, avoiding a round trip per keystroke.
 * @returns The filtered+sorted result plus the filter/sort state setters for the toolbar UI.
 */
export function useFilterSort(entries: CatalogEntry[]) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);

  const result = useMemo(() => {
    const filtered = applyFilters(entries, filters);
    const sortStrategy = createSortStrategy(sort);
    return [...filtered].sort((a, b) => sortStrategy.compare(a, b));
  }, [entries, filters, sort]);

  return { result, filters, setFilters, sort, setSort };
}
