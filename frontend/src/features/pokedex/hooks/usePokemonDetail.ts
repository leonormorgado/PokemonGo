import { useQuery } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

/**
 * Fetches a single Pokémon's detail (stats/types/sprite) by name.
 * `enabled: Boolean(name)` defers the request until a name is actually selected, so mounting
 * this hook speculatively (e.g. for a not-yet-open modal) doesn't trigger a wasted fetch.
 */
export function usePokemonDetail(name: string | null) {
  return useQuery({
    queryKey: pokedexKeys.detail(name ?? ''),
    queryFn: () => pokedexApi.getByName(name as string),
    enabled: Boolean(name),
  });
}
