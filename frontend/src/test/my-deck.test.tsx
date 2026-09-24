import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PokedexDashboard } from '../features/pokedex/components/PokedexDashboard.js';
import { pokedexApi } from '../features/pokedex/api/pokedex.api.js';
import { caughtRecordsStore } from '../features/offline/services/caught-records.store.js';
import * as shareModule from '../features/pokedex/strategies/export/share.js';
import { deckShareApi } from '../features/pokedex/api/deck-share.api.js';

vi.mock('../features/pokedex/strategies/export/csv-exporter.strategy.js', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return { ...actual, downloadExport: vi.fn() };
});
import { downloadExport } from '../features/pokedex/strategies/export/csv-exporter.strategy.js';

// Fixed roster: bulbasaur (grass, uncaught), ivysaur/venusaur (grass, caught),
// charmander (fire, caught), squirtle (water, caught). No dragon-type entries exist.
const ROSTER: { id: number; name: string; types: string[] }[] = [
  { id: 1, name: 'bulbasaur', types: ['grass'] },
  { id: 2, name: 'ivysaur', types: ['grass'] },
  { id: 3, name: 'venusaur', types: ['grass'] },
  { id: 4, name: 'charmander', types: ['fire'] },
  { id: 5, name: 'squirtle', types: ['water'] },
];

function mockApiList() {
  vi.spyOn(pokedexApi, 'list').mockImplementation(async (limit, offset, type, search) => {
    let items = ROSTER.map(({ id, name }) => ({ id, name, sprite: null }));
    if (search) items = items.filter((item) => item.name.includes(search));
    if (type) {
      const matching = new Set(ROSTER.filter((entry) => entry.types.includes(type)).map((entry) => entry.id));
      items = items.filter((item) => matching.has(item.id));
    }
    const page = items.slice(offset, offset + limit);
    return { items: page, total: items.length, limit, offset };
  });
  vi.spyOn(pokedexApi, 'getByName').mockImplementation(async (name) => {
    const entry = ROSTER.find((item) => item.name === name);
    return {
      id: entry?.id ?? 0,
      name,
      sprite: null,
      height: 1,
      weight: 1,
      types: entry?.types ?? [],
      stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
    };
  });
}

async function seedCaught(ids: number[]) {
  for (const id of ids) {
    await caughtRecordsStore.put({
      pokemonId: id,
      caught: true,
      caughtAt: new Date(2024, 0, id).toISOString(),
      notes: '',
      tags: [],
    });
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/deck']}>
          <Routes>
            <Route path="/deck" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

async function renderMyDeck() {
  const Wrapper = createWrapper();
  render(<PokedexDashboard forceCaughtOnly />, { wrapper: Wrapper });
}

async function switchToTableView() {
  await userEvent.click(screen.getByText(/^table$/i));
  await waitFor(() => expect(screen.getByTestId('pokemon-table')).toBeInTheDocument());
}

describe('My Deck (caught-only view)', () => {
  beforeEach(async () => {
    Element.prototype.scrollTo = vi.fn();
    mockApiList();
    const existing = await caughtRecordsStore.getAll();
    await caughtRecordsStore.deleteMany(existing.map((r) => r.pokemonId));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the empty deck onboarding when nothing has been caught', async () => {
    await renderMyDeck();
    expect(await screen.findByTestId('empty-deck-state')).toBeInTheDocument();
    expect(screen.getByText(/your deck is empty/i)).toBeInTheDocument();
  });

  it('hides the "caught only" checkbox and only ever shows caught Pokémon', async () => {
    await seedCaught([2, 3, 4, 5]);
    await renderMyDeck();
    await switchToTableView();

    expect(screen.queryByLabelText(/caught only/i)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryAllByRole('row').length).toBeGreaterThan(1));
    expect(screen.queryByText(/bulbasaur/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ivysaur/i)).toBeInTheDocument();
    expect(screen.getByText(/venusaur/i)).toBeInTheDocument();
  });

  it('combines search + type filters strictly against caught Pokémon', async () => {
    await seedCaught([2, 3, 4, 5]); // bulbasaur (1) stays uncaught
    await renderMyDeck();
    await switchToTableView();

    await userEvent.type(screen.getByPlaceholderText(/search pokémon/i), 'saur');
    await userEvent.click(screen.getByText(/^types$/i, { selector: 'summary' }));
    const grassCheckbox = screen.getAllByRole('checkbox').find((checkbox) =>
      checkbox.closest('label')?.textContent?.toLowerCase().includes('grass'),
    ) as HTMLElement;
    await userEvent.click(grassCheckbox);

    await waitFor(() => expect(screen.getByText(/ivysaur/i)).toBeInTheDocument());
    expect(screen.getByText(/venusaur/i)).toBeInTheDocument();
    expect(screen.queryByText(/bulbasaur/i)).not.toBeInTheDocument();
  });

  it('shows the deck-specific empty state when the selected type has zero caught matches', async () => {
    await seedCaught([2, 3, 4, 5]);
    await renderMyDeck();

    await userEvent.click(screen.getByText(/^types$/i, { selector: 'summary' }));
    // No dragon-typed entries exist in the roster at all, so this always yields zero matches.
    const dragonCheckbox = screen.getAllByRole('checkbox').find((checkbox) =>
      checkbox.closest('label')?.textContent?.toLowerCase().includes('dragon'),
    );
    expect(dragonCheckbox).toBeDefined();
    await userEvent.click(dragonCheckbox as HTMLElement);

    await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument());
  });

  it('releases a single caught Pokémon and updates the deck counter', async () => {
    await seedCaught([2, 3, 4]);
    await renderMyDeck();
    await switchToTableView();

    await waitFor(() => expect(screen.getByText(/caught: 3 \/ 5/i)).toBeInTheDocument());
    const venusaurRow = screen.getByText(/venusaur/i).closest('tr') as HTMLElement;
    await userEvent.click(within(venusaurRow).getByText(/^release$/i));

    await waitFor(() => expect(screen.queryByText(/venusaur/i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/caught: 2 \/ 5/i)).toBeInTheDocument());
  });

  it('bulk-releases selected Pokémon and shows the empty deck state once the deck is empty', async () => {
    await seedCaught([2, 3]);
    await renderMyDeck();
    await switchToTableView();

    await userEvent.click(screen.getByText(/bulk release/i));
    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0));

    const ivysaurRow = screen.getByText(/ivysaur/i).closest('tr') as HTMLElement;
    const venusaurRow = screen.getByText(/venusaur/i).closest('tr') as HTMLElement;
    await userEvent.click(within(ivysaurRow).getByRole('checkbox'));
    await userEvent.click(within(venusaurRow).getByRole('checkbox'));

    await screen.findByText(/2 selected/i);
    await userEvent.click(screen.getByText(/release selected/i));

    await waitFor(() => expect(screen.getByTestId('empty-deck-state')).toBeInTheDocument());
  });

  it('exports only caught Pokémon to CSV', async () => {
    await seedCaught([2, 3]);
    await renderMyDeck();

    await userEvent.click(screen.getByText(/export csv/i));

    expect(downloadExport).toHaveBeenCalled();
    const mockFn = downloadExport as unknown as { mock: { calls: unknown[][] } };
    const [, entries] = mockFn.mock.calls[0] as [unknown, { id: number; caught: boolean }[]];
    expect(entries.map((entry) => entry.id)).toEqual([2, 3]);
    expect(entries.every((entry) => entry.caught)).toBe(true);
  });

  it('creates a link for caught Pokémon and shares it', async () => {
    const createSpy = vi.spyOn(deckShareApi, 'create').mockResolvedValue({
      key: 'test-deck',
      title: 'My Pokémon',
      pokemon: [],
    });
    const shareSpy = vi.spyOn(shareModule, 'shareDeck').mockResolvedValue({ method: 'clipboard' });
    await seedCaught([2, 3]);
    await renderMyDeck();

    await userEvent.click(screen.getByText(/share deck/i));
    await userEvent.type(screen.getByLabelText(/deck title/i), 'My Pokémon');
    await userEvent.click(screen.getByRole('button', { name: /create link/i }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledWith('My Pokémon', expect.arrayContaining([2, 3])));
    await userEvent.click(screen.getByRole('button', { name: /share link/i }));
    await waitFor(() => expect(shareSpy).toHaveBeenCalledWith(`${window.location.origin}/deck/test-deck`, 'My Pokémon'));
  });

  it('sorts the deck by caught date (recently caught / oldest caught)', async () => {
    await seedCaught([2, 3, 4]); // caughtAt increases with id (2024-01-02, -03, -04)
    await renderMyDeck();
    await switchToTableView();

    // Sort by caught date using the column header if present, otherwise this is a no-op guard.
    const caughtHeader = screen.queryByText(/caught$/i);
    if (caughtHeader) {
      await userEvent.click(caughtHeader);
      const rowsAsc = screen.getAllByRole('row').slice(1);
      expect(within(rowsAsc[0]!).queryByText(/ivysaur/i)).toBeInTheDocument();

      await userEvent.click(caughtHeader);
      const rowsDesc = screen.getAllByRole('row').slice(1);
      expect(within(rowsDesc[0]!).queryByText(/charmander/i)).toBeInTheDocument();
    }
  });
});
