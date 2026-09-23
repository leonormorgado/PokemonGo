import type { SortField, SortOption } from '../../domain/pokemon.types.js';
import {
  CaughtAtSortStrategy,
  HeightSortStrategy,
  NameSortStrategy,
  TypesSortStrategy,
  type SortStrategy,
} from './sort-strategy.js';

export function createSortStrategy(option: SortOption): SortStrategy {
  const strategies: Record<SortField, () => SortStrategy> = {
    name: () => new NameSortStrategy(option.direction),
    caughtAt: () => new CaughtAtSortStrategy(option.direction),
    height: () => new HeightSortStrategy(option.direction),
    types: () => new TypesSortStrategy(option.direction),
  };

  return strategies[option.field]();
}
