import { useQueries } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';
import type { CatalogEntry, PokemonDetail } from '../domain/pokemon.types.js';

export interface TableEntry extends CatalogEntry {
  stats: number | null;
}

/**
 * Batches per-entry detail fetches (stats/height/weight) needed for the analytical table view.
 * Uses `useQueries` (not sequential fetches) so all rows on the current page resolve in parallel.
 */
export function usePokemonTableData(entries: CatalogEntry[]) {
  const detailQueries = useQueries({
    queries: entries.map((entry) => ({
      queryKey: pokedexKeys.detail(entry.name),
      queryFn: () => pokedexApi.getByName(entry.name),
    })),
  });

  const isLoading = detailQueries.some((query) => query.isLoading);

  const rows: TableEntry[] = entries.map((entry, index) => {
    const detail = detailQueries[index]?.data as PokemonDetail | undefined;
    const stats = detail?.stats;
    // Partial base stat total: sum of hp/attack/defense/speed only (excludes sp-attack/sp-defense).
    return {
      ...entry,
      stats: stats ? stats.hp + stats.attack + stats.defense + stats.speed : null,
    };
  });

  return { rows, isLoading };
}
