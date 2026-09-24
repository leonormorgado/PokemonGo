import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';
import type { CatalogEntry, PokemonDetail } from '../domain/pokemon.types.js';

/**
 * Batches per-entry detail fetches to hydrate elemental types and height (list endpoint omits them).
 * `staleTime: Infinity` because a Pokémon's types/height never change, so there's no reason to refetch.
 */
export function usePokemonTypes(entries: CatalogEntry[]): CatalogEntry[] {
  const detailQueries = useQueries({
    queries: entries.map((entry) => ({
      queryKey: pokedexKeys.detail(entry.name),
      queryFn: () => pokedexApi.getByName(entry.name),
      staleTime: Infinity,
    })),
  });

  return useMemo(
    () =>
      entries.map((entry, index) => {
        const detail = detailQueries[index]?.data as PokemonDetail | undefined;
        return detail ? {
          ...entry,
          name: entry.name === String(entry.id) ? detail.name : entry.name,
          sprite: entry.sprite ?? detail.sprite,
          types: detail.types,
          height: detail.height,
        } : entry;
      }),
    [entries, detailQueries],
  );
}
