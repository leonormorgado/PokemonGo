import { useQueries } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';
import type { CatalogEntry, PokemonDetail } from '../domain/pokemon.types.js';

export interface TableEntry extends CatalogEntry {
  hp: number | null;
  attack: number | null;
  defense: number | null;
  speed: number | null;
  height: number | null;
  weight: number | null;
}

// Batches per-entry detail fetches (stats/height/weight) needed for the analytical table view.
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
    return {
      ...entry,
      hp: detail?.stats.hp ?? null,
      attack: detail?.stats.attack ?? null,
      defense: detail?.stats.defense ?? null,
      speed: detail?.stats.speed ?? null,
      height: detail?.height ?? null,
      weight: detail?.weight ?? null,
    };
  });

  return { rows, isLoading };
}
