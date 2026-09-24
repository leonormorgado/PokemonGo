import { useInfiniteQuery } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

/**
 * Offset-paginated catalog fetch via `useInfiniteQuery`, so the grid/table can lazily load
 * pages as the user scrolls/paginates instead of fetching the entire Pokédex up front.
 * @param limit Page size (see `PAGE_SIZE` in `PokedexDashboard` for why 42 was chosen).
 * @param type Optional single-type filter; @param search Optional name-substring filter. Both
 * are applied server-side (AND'd together) across the whole dex, and either changing resets
 * pagination to page 1 since they're part of the query key.
 */
export function usePokemonList(limit: number, type?: string, search?: string) {
  return useInfiniteQuery({
    queryKey: pokedexKeys.list(limit, type, search),
    queryFn: ({ pageParam }) => pokedexApi.list(limit, pageParam, type, search),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.offset + lastPage.limit < lastPage.total ? lastPage.offset + lastPage.limit : undefined,
  });
}
