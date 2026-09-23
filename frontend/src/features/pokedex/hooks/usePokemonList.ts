import { useQuery } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

export function usePokemonList(limit: number, offset: number) {
  return useQuery({
    queryKey: pokedexKeys.list(limit, offset),
    queryFn: () => pokedexApi.list(limit, offset),
  });
}
