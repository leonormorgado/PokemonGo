import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { caughtRecordsStore } from '../../offline/services/caught-records.store.js';
import type { CaughtRecord } from '../domain/pokemon.types.js';
import { pokedexKeys } from '../api/pokedex.keys.js';

export function useCaughtRecords() {
  return useQuery({
    queryKey: pokedexKeys.caughtRecords,
    queryFn: () => caughtRecordsStore.getAll(),
    staleTime: Infinity,
  });
}

export function useCatchPokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pokemonId,
      notes = '',
      tags = [],
    }: {
      pokemonId: number;
      notes?: string;
      tags?: string[];
    }) => {
      const record: CaughtRecord = {
        pokemonId,
        caught: true,
        caughtAt: new Date().toISOString(),
        notes,
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

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pokemonId, notes }: { pokemonId: number; notes: string }) => {
      const existing = await caughtRecordsStore.get(pokemonId);
      const record: CaughtRecord = {
        pokemonId,
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

export function useUpdateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pokemonId, tags }: { pokemonId: number; tags: string[] }) => {
      const existing = await caughtRecordsStore.get(pokemonId);
      const record: CaughtRecord = {
        pokemonId,
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
