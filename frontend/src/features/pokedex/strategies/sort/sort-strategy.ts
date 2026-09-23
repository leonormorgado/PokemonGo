import type { CatalogEntry, SortDirection } from '../../domain/pokemon.types.js';

export interface SortStrategy {
  compare(a: CatalogEntry, b: CatalogEntry): number;
}

function applyDirection(result: number, direction: SortDirection): number {
  return direction === 'asc' ? result : -result;
}

export class NameSortStrategy implements SortStrategy {
  constructor(private readonly direction: SortDirection = 'asc') {}

  compare(a: CatalogEntry, b: CatalogEntry): number {
    return applyDirection(a.name.localeCompare(b.name), this.direction);
  }
}

export class CaughtAtSortStrategy implements SortStrategy {
  constructor(private readonly direction: SortDirection = 'desc') {}

  compare(a: CatalogEntry, b: CatalogEntry): number {
    // Uncaught entries have no caughtAt date; always push them to the end, not just when descending.
    if (!a.caughtAt && !b.caughtAt) return 0;
    if (!a.caughtAt) return 1;
    if (!b.caughtAt) return -1;
    const aTime = new Date(a.caughtAt).getTime();
    const bTime = new Date(b.caughtAt).getTime();
    return applyDirection(aTime - bTime, this.direction);
  }
}

export class IdSortStrategy implements SortStrategy {
  constructor(private readonly direction: SortDirection = 'asc') {}

  compare(a: CatalogEntry, b: CatalogEntry): number {
    return applyDirection(a.id - b.id, this.direction);
  }
}

export class HeightSortStrategy implements SortStrategy {
  constructor(private readonly direction: SortDirection = 'asc') {}

  compare(a: CatalogEntry, b: CatalogEntry): number {
    // Entries without fetched height data yet are pushed to the end regardless of direction.
    if (a.height == null && b.height == null) return 0;
    if (a.height == null) return 1;
    if (b.height == null) return -1;
    return applyDirection(a.height - b.height, this.direction);
  }
}

export class TypesSortStrategy implements SortStrategy {
  constructor(private readonly direction: SortDirection = 'asc') {}

  compare(a: CatalogEntry, b: CatalogEntry): number {
    const aType = a.types[0] ?? '';
    const bType = b.types[0] ?? '';
    return applyDirection(aType.localeCompare(bType), this.direction);
  }
}
