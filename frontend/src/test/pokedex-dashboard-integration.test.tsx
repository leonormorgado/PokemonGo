import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PokedexDashboard } from '../features/pokedex/components/PokedexDashboard.js';
import { pokedexApi } from '../features/pokedex/api/pokedex.api.js';
import { caughtRecordsStore } from '../features/offline/services/caught-records.store.js';

const PAGE_SIZE = 42;
const TOTAL = 50;

function makeSummary(id: number) {
  return { id, name: `pokemon${id}`, sprite: null };
}

const allSummaries = Array.from({ length: TOTAL }, (_, i) => makeSummary(i + 1));

vi.mock('../features/offline/components/OfflineStatusBanner.js', () => ({
  OfflineStatusBanner: () => null,
}));

vi.mock('../features/pokedex/components/PokemonGrid.js', () => ({
  PokemonGrid: (props: {
    entries: { id: number; name: string }[];
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
    loadedCount?: number;
    totalCount?: number;
  }) => (
    <div data-testid="mock-grid">
      <span data-testid="grid-rendered-count">{props.entries.length}</span>
      <span data-testid="grid-loaded-count">{props.loadedCount}</span>
      <span data-testid="grid-total-count">{props.totalCount}</span>
      <span data-testid="grid-has-more">{String(Boolean(props.hasMore))}</span>
      {props.hasMore && (
        <button type="button" onClick={props.onLoadMore} disabled={props.isLoadingMore}>
          load-more
        </button>
      )}
    </div>
  ),
}));

vi.mock('../features/pokedex/components/PokemonTable.js', () => ({
  PokemonTable: (props: {
    entries: { id: number; name: string }[];
    pagination: { page: number; pageCount: number };
  }) => (
    <div data-testid="mock-table">
      <span data-testid="table-rendered-count">{props.entries.length}</span>
      <span data-testid="table-page">{props.pagination.page}</span>
      <span data-testid="table-page-count">{props.pagination.pageCount}</span>
    </div>
  ),
}));

function mockApiList() {
  vi.spyOn(pokedexApi, 'list').mockImplementation(async (limit, offset, type, search) => {
    let items = allSummaries;
    if (search) items = items.filter((item) => item.name.includes(search));
    if (type) items = []; // no per-type server data needed for these tests
    const page = items.slice(offset, offset + limit);
    return { items: page, total: items.length, limit, offset };
  });
  vi.spyOn(pokedexApi, 'getByName').mockImplementation(async (name) => {
    const id = Number(name.replace('pokemon', ''));
    return {
      id,
      name,
      sprite: null,
      height: id, // distinct height per id, useful for sort assertions
      weight: 1,
      types: [id % 2 === 0 ? 'fire' : 'water'],
      stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
    };
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function renderDashboard() {
  const Wrapper = createWrapper();
  render(<PokedexDashboard />, { wrapper: Wrapper });
  await waitFor(() => expect(screen.getByTestId('mock-grid')).toBeInTheDocument());
  await waitFor(() => expect(screen.getByTestId('grid-total-count')).toHaveTextContent(String(TOTAL)));
}

describe('PokedexDashboard — filtering, sorting, pagination integration', () => {
  beforeEach(async () => {
    mockApiList();
    const existing = await caughtRecordsStore.getAll();
    await caughtRecordsStore.deleteMany(existing.map((r) => r.pokemonId));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the exact batch counter and hides Load More once every item is loaded', async () => {
    await renderDashboard();
    expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent(String(PAGE_SIZE));
    expect(screen.getByTestId('grid-has-more')).toHaveTextContent('true');

    await userEvent.click(screen.getByText('load-more'));

    await waitFor(() => expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent(String(TOTAL)));
    expect(screen.getByTestId('grid-has-more')).toHaveTextContent('false');
    expect(screen.queryByText('load-more')).not.toBeInTheDocument();
  });

  it('renders zero-match empty state and hides Load More when search yields no results', async () => {
    await renderDashboard();
    const searchInput = screen.getByPlaceholderText(/search pokémon/i);
    await userEvent.type(searchInput, 'nonexistent-name');

    await waitFor(() => expect(screen.getByTestId('empty-deck-state')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.queryByTestId('mock-grid')).not.toBeInTheDocument();
  });

  it('resets pagination back to page 1 when the sort option changes', async () => {
    await renderDashboard();
    await userEvent.click(screen.getByText('load-more'));
    await waitFor(() => expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent(String(TOTAL)));

    // Switch sort via the toolbar's "Sort by" dropdown.
    await userEvent.click(screen.getByText(/sort by/i));
    await userEvent.click(screen.getByText(/name \(a-z\)/i));

    await waitFor(() => expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent(String(PAGE_SIZE)));
  });

  it('resets pagination back to page 1 when a filter (caught only) changes', async () => {
    await caughtRecordsStore.put({ pokemonId: 1, caught: true, caughtAt: new Date().toISOString(), notes: '', tags: [] });
    await renderDashboard();
    await userEvent.click(screen.getByText('load-more'));
    await waitFor(() => expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent(String(TOTAL)));

    await userEvent.click(screen.getByLabelText(/caught only/i));

    await waitFor(() => expect(screen.getByTestId('grid-loaded-count')).toHaveTextContent('1'));
  });

  it('preserves search/filter/page state when switching between grid and table views', async () => {
    await renderDashboard();
    const searchInput = screen.getByPlaceholderText(/search pokémon/i);
    await userEvent.type(searchInput, 'pokemon1');
    await waitFor(() => expect(screen.getByTestId('grid-total-count')).not.toHaveTextContent(String(TOTAL)));

    await userEvent.click(screen.getByText(/^table$/i));
    expect(await screen.findByTestId('mock-table')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search pokémon/i)).toHaveValue('pokemon1');
  });
});
