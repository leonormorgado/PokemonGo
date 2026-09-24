import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePokedexStorage } from '../features/pokedex/hooks/usePokedexStorage.js';
import { caughtRecordsStore } from '../features/offline/services/caught-records.store.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('usePokedexStorage (offline persistence integration)', () => {
  beforeEach(async () => {
    const existing = await caughtRecordsStore.getAll();
    await caughtRecordsStore.deleteMany(existing.map((record) => record.pokemonId));
  });

  it('starts with no caught records', async () => {
    const { result } = renderHook(() => usePokedexStorage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.caughtRecords).toEqual([]);
  });

  it('catches a Pokémon and persists it to storage', async () => {
    const { result } = renderHook(() => usePokedexStorage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.catch(1, 'great starter', ['favorite']);
    });

    await waitFor(() => expect(result.current.caughtRecords).toHaveLength(1));
    expect(result.current.caughtRecords[0]).toMatchObject({
      pokemonId: 1,
      notes: 'great starter',
      tags: ['favorite'],
    });
  });

  it('releases a caught Pokémon', async () => {
    const { result } = renderHook(() => usePokedexStorage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.catch(1);
    });
    await waitFor(() => expect(result.current.caughtRecords).toHaveLength(1));

    await act(async () => {
      await result.current.release(1);
    });
    await waitFor(() => expect(result.current.caughtRecords).toHaveLength(0));
  });

  it('updates notes for an already-caught Pokémon without losing its tags', async () => {
    const { result } = renderHook(() => usePokedexStorage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.catch(7, 'initial note', ['water']);
    });
    await act(async () => {
      await result.current.updateNote(7, 'revised note');
    });

    await waitFor(() =>
      expect(result.current.caughtRecords.find((r) => r.pokemonId === 7)?.notes).toBe('revised note'),
    );
    expect(result.current.caughtRecords.find((r) => r.pokemonId === 7)?.tags).toEqual(['water']);
  });

  it('releases many Pokémon at once', async () => {
    const { result } = renderHook(() => usePokedexStorage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.catch(1);
      await result.current.catch(2);
      await result.current.catch(3);
    });
    await waitFor(() => expect(result.current.caughtRecords).toHaveLength(3));

    await act(async () => {
      await result.current.releaseMany([1, 3]);
    });

    await waitFor(() => expect(result.current.caughtRecords).toHaveLength(1));
    expect(result.current.caughtRecords[0]?.pokemonId).toBe(2);
  });
});
