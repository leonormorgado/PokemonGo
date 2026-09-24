import type { SortField, SortOption } from '../../domain/pokemon.types.js';
import {
  CaughtAtSortStrategy,
  HeightSortStrategy,
  IdSortStrategy,
  NameSortStrategy,
  TypesSortStrategy,
  type SortStrategy,
} from './sort-strategy.js';

/**
 * Maps a `SortField` to its `SortStrategy` implementation. Centralizing this lookup means
 * `useFilterSort` never needs to know about individual strategy classes, only the factory.
 */
export function createSortStrategy(option: SortOption): SortStrategy {
  const strategies: Record<SortField, () => SortStrategy> = {
    name: () => new NameSortStrategy(option.direction),
    id: () => new IdSortStrategy(option.direction),
    caughtAt: () => new CaughtAtSortStrategy(option.direction),
    height: () => new HeightSortStrategy(option.direction),
    types: () => new TypesSortStrategy(option.direction),
  };

  return strategies[option.field]();
}
