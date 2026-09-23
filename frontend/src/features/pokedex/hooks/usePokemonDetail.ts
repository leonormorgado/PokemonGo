import { useQuery } from '@tanstack/react-query';
import { pokedexApi } from '../api/pokedex.api.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

export function usePokemonDetail(name: string | null) {
  return useQuery({
    queryKey: pokedexKeys.detail(name ?? ''),
    queryFn: () => pokedexApi.getByName(name as string),
    enabled: Boolean(name),
  });
}
