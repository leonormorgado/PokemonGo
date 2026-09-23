import { useMemo, useState } from 'react';
import type { CatalogEntry, FilterOptions, SortOption } from '../domain/pokemon.types.js';
import { applyFilters } from '../strategies/filter/filter-strategy.js';
import { createSortStrategy } from '../strategies/sort/sort-strategy.factory.js';

const DEFAULT_FILTERS: FilterOptions = { search: '', types: [], caughtOnly: false };
const DEFAULT_SORT: SortOption = { field: 'name', direction: 'asc' };

// Combines the filter and sort strategy pattern with the search/sort UI state.
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
