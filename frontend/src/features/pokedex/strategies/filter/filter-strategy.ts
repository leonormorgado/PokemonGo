import type { CatalogEntry, FilterOptions } from '../../domain/pokemon.types.js';

export interface FilterStrategy {
  apply(entries: CatalogEntry[]): CatalogEntry[];
}

export class SearchFilterStrategy implements FilterStrategy {
  constructor(private readonly search: string) {}

  apply(entries: CatalogEntry[]): CatalogEntry[] {
    const query = this.search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(query));
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

export function applyFilters(entries: CatalogEntry[], options: FilterOptions): CatalogEntry[] {
  const strategies: FilterStrategy[] = [
    new SearchFilterStrategy(options.search),
    new CaughtOnlyFilterStrategy(options.caughtOnly),
    new TypeFilterStrategy(options.types),
  ];

  return strategies.reduce((filtered, strategy) => strategy.apply(filtered), entries);
}
