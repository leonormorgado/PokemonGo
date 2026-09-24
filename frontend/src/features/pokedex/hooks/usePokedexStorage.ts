import {
  useCaughtRecords,
  useCatchPokemon,
  useReleasePokemon,
  useReleaseManyPokemon,
  useUpdateNote,
  useUpdateTags,
} from './useCaughtRecords.js';

/**
 * Single entry point composing all trainer-owned Pokédex mutations (catch/release, bulk
 * release, notes, tags) so components depend on one hook instead of six, and any future
 * cross-cutting logic (e.g. optimistic updates) only needs to change in one place.
 */
export function usePokedexStorage() {
  const { data: caughtRecords = [], isLoading } = useCaughtRecords();
  const catchMutation = useCatchPokemon();
  const releaseMutation = useReleasePokemon();
  const releaseManyMutation = useReleaseManyPokemon();
  const updateNoteMutation = useUpdateNote();
  const updateTagsMutation = useUpdateTags();

  return {
    caughtRecords,
    isLoading,
    catch: (pokemonId: number, notes?: string, tags?: string[]) =>
      catchMutation.mutateAsync({ pokemonId, notes, tags }),
    release: (pokemonId: number) => releaseMutation.mutateAsync(pokemonId),
    releaseMany: (pokemonIds: number[]) => releaseManyMutation.mutateAsync(pokemonIds),
    updateNote: (pokemonId: number, notes: string) => updateNoteMutation.mutateAsync({ pokemonId, notes }),
    updateTags: (pokemonId: number, tags: string[]) => updateTagsMutation.mutateAsync({ pokemonId, tags }),
  };
}
