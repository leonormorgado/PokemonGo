import type { CatalogEntry, FilterOptions, IdRange } from '../../domain/pokemon.types.js';

export interface FilterStrategy {
  apply(entries: CatalogEntry[]): CatalogEntry[];
}

export class SearchFilterStrategy implements FilterStrategy {
  constructor(private readonly search: string) {}

  apply(entries: CatalogEntry[]): CatalogEntry[] {
    const query = this.search.trim().toLowerCase();
    if (!query) return entries;
    // Allow searching by Dex # too (with or without a leading "#" / zero-padding), not just name.
    const idQuery = query.replace(/^#/, '');
    const isIdQuery = /^\d+$/.test(idQuery);
    return entries.filter((entry) => {
      if (entry.name.toLowerCase().includes(query)) return true;
      return isIdQuery && String(entry.id) === String(Number(idQuery));
    });
  }
}

export class CaughtOnlyFilterStrategy implements FilterStrategy {
  constructor(private readonly enabled: boolean) {}

  apply(entries: CatalogEntry[]): CatalogEntry[] {
    if (!this.enabled) return entries;
    return entries.filter((entry) => entry.caught);
  }
}

export class TypeFilterStrategy implements FilterStrategy {
  constructor(private readonly types: string[]) {}

  apply(entries: CatalogEntry[]): CatalogEntry[] {
    if (this.types.length === 0) return entries;
    return entries.filter((entry) => entry.types.some((type) => this.types.includes(type)));
  }
}

export class IdRangeFilterStrategy implements FilterStrategy {
  constructor(private readonly idRange: IdRange | null) {}

  apply(entries: CatalogEntry[]): CatalogEntry[] {
    if (!this.idRange) return entries;
    const { min, max } = this.idRange;
    return entries.filter((entry) => entry.id >= min && entry.id <= max);
  }
}

/**
 * Runs each active filter strategy in sequence over the catalog. New filter axes (e.g. a
 * generation filter) can be added as another `FilterStrategy` without touching the others.
 */
export function applyFilters(entries: CatalogEntry[], options: FilterOptions): CatalogEntry[] {
  const strategies: FilterStrategy[] = [
    new SearchFilterStrategy(options.search),
    new CaughtOnlyFilterStrategy(options.caughtOnly),
    new TypeFilterStrategy(options.types),
    new IdRangeFilterStrategy(options.idRange ?? null),
  ];

  return strategies.reduce((filtered, strategy) => strategy.apply(filtered), entries);
}
