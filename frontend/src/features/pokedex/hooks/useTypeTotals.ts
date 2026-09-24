import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

/**
 * Type breakdown totals must reflect the full Pokédex (e.g. "all Bug-type Pokémon"), not just
 * the entries loaded so far, so each type's real total is fetched from the PokéAPI /type endpoint.
 * `staleTime: Infinity` since a type's total Pokémon count effectively never changes at runtime.
 */
export function useTypeTotals(types: string[]): Record<string, number> {
  const totalQueries = useQueries({
    queries: types.map((type) => ({
      queryKey: pokedexKeys.typeCount(type),
      queryFn: () => pokedexApi.getTypeCount(type),
      staleTime: Infinity,
    })),
  });

  return useMemo(
    () =>
      types.reduce<Record<string, number>>((acc, type, index) => {
        const total = totalQueries[index]?.data;
        if (total !== undefined) acc[type] = total;
        return acc;
      }, {}),
    [types, totalQueries],
  );
}
