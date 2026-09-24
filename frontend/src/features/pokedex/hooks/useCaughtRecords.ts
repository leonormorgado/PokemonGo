import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { caughtRecordsStore } from '../../offline/services/caught-records.store.js';
import type { CaughtRecord } from '../domain/pokemon.types.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

/**
 * Reads all trainer-owned catch records from IndexedDB.
 * `staleTime: Infinity` because this data only changes via the mutations below, which
 * explicitly invalidate this query key — polling/refetching would just re-read the same store.
 */
export function useCaughtRecords() {
  return useQuery({
    queryKey: pokedexKeys.caughtRecords,
    queryFn: () => caughtRecordsStore.getAll(),
    staleTime: Infinity,
  });
}

/** Marks a Pokémon as caught with a timestamp; invalidates the cache so all views stay in sync. */
export function useCatchPokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pokemonId,
      name,
      sprite,
      notes = '',
      tags = [],
    }: {
      pokemonId: number;
      name?: string;
      sprite?: string | null;
      notes?: string;
      tags?: string[];
    }) => {
      const existing = await caughtRecordsStore.get(pokemonId);
      const record: CaughtRecord = {
        pokemonId,
        name: name ?? existing?.name,
        sprite: sprite ?? existing?.sprite,
        caught: true,
        caughtAt: new Date().toISOString(),
        notes: notes || existing?.notes || '',
        tags: tags.length ? tags : existing?.tags ?? [],
      };
      await caughtRecordsStore.put(record);
      return record;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pokedexKeys.caughtRecords });
    },
  });
}

/** Deletes a single caught record (release), rather than a soft `caught: false` flag, since notes/tags for a released Pokémon aren't a requirement worth persisting. */
export function useReleasePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pokemonId: number) => {
      await caughtRecordsStore.delete(pokemonId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pokedexKeys.caughtRecords });
    },
  });
}

/** Bulk-release: batches deletes in one IndexedDB transaction so the UI only invalidates/re-renders once instead of once per Pokémon. */
export function useReleaseManyPokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pokemonIds: number[]) => {
      await caughtRecordsStore.deleteMany(pokemonIds);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pokedexKeys.caughtRecords });
    },
  });
}

/**
 * Updates the notes on a caught record. Reads the existing record first (rather than assuming
 * `caught: true`) so notes can also be attached to a not-yet-caught entry without clobbering
 * its caught/tags state.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pokemonId, notes }: { pokemonId: number; notes: string }) => {
      const existing = await caughtRecordsStore.get(pokemonId);
      const record: CaughtRecord = {
        pokemonId,
        name: existing?.name,
        sprite: existing?.sprite,
        caught: existing?.caught ?? false,
        caughtAt: existing?.caughtAt ?? null,
        notes,
        tags: existing?.tags ?? [],
      };
      await caughtRecordsStore.put(record);
      return record;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pokedexKeys.caughtRecords });
    },
  });
}

/** Updates tags the same way as `useUpdateNote` — reads existing record first to avoid clobbering caught/notes state. */
export function useUpdateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pokemonId, tags }: { pokemonId: number; tags: string[] }) => {
      const existing = await caughtRecordsStore.get(pokemonId);
      const record: CaughtRecord = {
        pokemonId,
        name: existing?.name,
        sprite: existing?.sprite,
        caught: existing?.caught ?? false,
        caughtAt: existing?.caughtAt ?? null,
        notes: existing?.notes ?? '',
        tags,
      };
      await caughtRecordsStore.put(record);
      return record;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pokedexKeys.caughtRecords });
    },
  });
}
