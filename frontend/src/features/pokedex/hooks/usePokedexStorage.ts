import {
  useCaughtRecords,
  useCatchPokemon,
  useReleasePokemon,
  useReleaseManyPokemon,
  useUpdateNote,
  useUpdateTags,
} from './useCaughtRecords.js';

// Single entry point for trainer-owned Pokédex state: catch/release, bulk release, notes, and tags.
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
