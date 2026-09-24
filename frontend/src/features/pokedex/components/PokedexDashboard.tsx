import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePokemonList } from '../hooks/usePokemonList.js';
import { useTotalPokemonCount } from '../hooks/useTotalPokemonCount.js';
import { usePokedexStorage } from '../hooks/usePokedexStorage.js';
import { useFilterSort } from '../hooks/useFilterSort.js';
import { applyFilters } from '../strategies/filter/filter-strategy.js';
import { usePokemonTypes } from '../hooks/usePokemonTypes.js';
import { OfflineStatusBanner } from '../../offline/components/OfflineStatusBanner.js';
import { useDebounce } from '../../../shared/hooks/useDebounce.js';
import { RetroLoader } from '../../../shared/components/RetroLoader.js';
import { ProgressOverview } from './ProgressOverview.js';
import { PokemonGrid } from './PokemonGrid.js';
import { PokemonTable } from './PokemonTable.js';
import { PokemonDetailModal } from './PokemonDetailModal.js';
import { EmptyDeckState } from './EmptyDeckState.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { Trash2, X } from 'lucide-react';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { ShareDeckModal } from './ShareDeckModal.js';
import { PokedexToolbar } from './PokedexToolbar.js';
import { typeColors } from '../../../shared/styles/colors.js';

const PAGE_SIZE = 42;
type ViewMode = 'grid' | 'table';

type PokedexDashboardProps = {
  forceCaughtOnly?: boolean;
  // Read-only view of another trainer's shared deck (populated from ?ids= on /deck).
  sharedDeckIds?: number[] | null;
};

export function PokedexDashboard({
  forceCaughtOnly = false,
  sharedDeckIds = null,
}: PokedexDashboardProps = {}) {
  const t = useTranslations('dashboard');
  const tEmptyDeck = useTranslations('emptyDeck');
  const { id: deepLinkId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const readOnly = sharedDeckIds !== null;
  const sharedIdSet = useMemo(() => new Set(sharedDeckIds ?? []), [sharedDeckIds]);
  const [search, setSearch] = useState('');
  const [caughtOnly, setCaughtOnly] = useState(forceCaughtOnly);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showShareDeck, setShowShareDeck] = useState(false);
  const debouncedSearch = useDebounce(search);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(PAGE_SIZE);
  const [isJumpingPage, setIsJumpingPage] = useState(false);
  const [isSortLoading, setIsSortLoading] = useState(false);
  // Gates how many *already-loaded/sorted* entries the grid renders, independent of caughtOnly:
  // without this, a fully-loaded (non-default sort) catalog would render all 1,351 entries at
  // once instead of paginating 42 at a time.
  const [gridVisibleCount, setGridVisibleCount] = useState(PAGE_SIZE);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // My Deck is scoped to caught Pokémon: the real total is the caught count, not the dex size,
  // and there's nothing left to load once every caught Pokémon has been found in loaded pages.
  const isDeckView = forceCaughtOnly && !readOnly;
  // Search and a single selected type are fetched paginated straight from the backend
  // (`/pokemon?search=&type=`), AND'd together server-side across the whole dex, so "Load More"
  // pages through just the matching roster instead of the whole dex. "Caught only" can't be
  // applied server-side (it's local-only data), so it's layered on top client-side via the
  // `gridVisibleCount` pagination below, whether from the checkbox or from My Deck.
  const serverSearch = debouncedSearch || undefined;
  const useServerTypeFilter = selectedTypes.length === 1;
  const serverType = useServerTypeFilter ? selectedTypes[0] : undefined;

  const {
    data: listData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePokemonList(PAGE_SIZE, serverType, serverSearch);
  // Only the true, unfiltered dex size should be persisted as the overview's "total", never a
  // server-filtered subset (search/type), which would otherwise corrupt the cached total.
  const totalPokemonCount = useTotalPokemonCount(
    serverSearch || serverType ? undefined : listData?.pages.at(-1)?.total,
  );
  const {
    caughtRecords,
    catch: catchPokemon,
    release,
    releaseMany,
    updateNote,
  } = usePokedexStorage();
  // Tracked outside React state so the sort-driven fetch loop below always reads the latest
  // value instead of a stale one captured when the effect was created.
  const hasNextPageRef = useRef(hasNextPage);
  hasNextPageRef.current = hasNextPage;

  const baseCatalog: CatalogEntry[] = useMemo(() => {
    const caughtById = new Map(caughtRecords.map((record) => [record.pokemonId, record]));
    const items = listData?.pages.flatMap((page) => page.items) ?? [];
    return items.map((item) => {
      if (readOnly) {
        return {
          ...item,
          caught: sharedIdSet.has(item.id),
          caughtAt: null,
          notes: '',
          tags: [],
          types: [],
          height: null,
        };
      }
      const record = caughtById.get(item.id);
      return {
        ...item,
        caught: record?.caught ?? false,
        caughtAt: record?.caughtAt ?? null,
        notes: record?.notes ?? '',
        tags: record?.tags ?? [],
        types: [],
        height: null,
      };
    });
  }, [listData, caughtRecords, readOnly, sharedIdSet]);

  const catalog = usePokemonTypes(baseCatalog);
  // Static list of every Pokémon type, so the filter isn't limited to types seen in loaded pages.
  const availableTypes = useMemo(() => Object.keys(typeColors).sort(), []);

  const { result: visibleCatalog, setFilters, sort, setSort } = useFilterSort(catalog);

  useEffect(() => {
    // Skip the client-side search/type filters when the backend already applied them, avoiding a
    // flash of empty results while per-entry type details are still hydrating.
    setFilters({
      search: serverSearch ? '' : debouncedSearch,
      types: useServerTypeFilter ? [] : selectedTypes,
      caughtOnly,
    });
    // Pagination always restarts at page 1 whenever any filter or the sort order changes.
    setTablePage(0);
    setGridVisibleCount(PAGE_SIZE);

    // A non-default sort must be applied across the entire filtered dataset, not just the
    // pages loaded so far (only 42 items are fetched at a time), otherwise "page 1" of a sort
    // like Name A-Z or Highest Attack would just re-order whatever happened to already be
    // loaded. Default id-asc already matches the backend's natural load order, so no extra
    // fetching is needed there.
    const isDefaultSort = sort.field === 'id' && sort.direction === 'asc';
    if (isDefaultSort || !hasNextPageRef.current) return;

    let cancelled = false;
    setIsSortLoading(true);
    void (async () => {
      while (hasNextPageRef.current && !cancelled) {
        const result = await fetchNextPage();
        hasNextPageRef.current = result.hasNextPage ?? false;
      }
      if (!cancelled) setIsSortLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    caughtOnly,
    selectedTypes,
    sort,
    useServerTypeFilter,
    setFilters,
    fetchNextPage,
  ]);

  useEffect(() => {
    setSelectedEntry((current) =>
      current ? (catalog.find((item) => item.id === current.id) ?? current) : current,
    );
  }, [catalog]);

  // Deep link (/pokemon/:id): open the matching card, or a placeholder while its detail loads.
  useEffect(() => {
    if (!deepLinkId) return;
    const numericId = Number(deepLinkId);
    const found = catalog.find((item) => item.id === numericId);
    if (found) {
      setSelectedEntry(found);
      return;
    }
    const record = caughtRecords.find((entry) => entry.pokemonId === numericId);
    setSelectedEntry({
      id: Number.isNaN(numericId) ? 0 : numericId,
      name: deepLinkId,
      sprite: null,
      caught: record?.caught ?? false,
      caughtAt: record?.caughtAt ?? null,
      notes: record?.notes ?? '',
      tags: record?.tags ?? [],
      types: [],
      height: null,
    });
  }, [deepLinkId, catalog, caughtRecords]);

  const handleCloseDetail = () => {
    setSelectedEntry(null);
    if (deepLinkId) navigate('/');
  };

  useEffect(() => {
    const caughtIds = new Set(catalog.filter((item) => item.caught).map((item) => item.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => caughtIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [catalog]);

  const toggleSelected = (entry: CatalogEntry) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(entry.id)) {
        next.delete(entry.id);
      } else {
        next.add(entry.id);
      }
      return next;
    });
  };

  const handleReleaseSelected = async () => {
    await releaseMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const toggleSelectMode = () => {
    setSelectMode((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
  };

  const handleToggleCaught = readOnly
    ? () => {}
    : (entry: CatalogEntry) => void (entry.caught ? release(entry.id) : catchPokemon(entry.id));

  // Caught-scoped pagination (My Deck, or the "Caught only" checkbox elsewhere): the real total
  // is the caught count matching the active search/type filters, not the dex/filtered-dex size,
  // and there's nothing left to load once every matching caught Pokémon has been found.
  const loadedCaughtCount = catalog.filter((entry) => entry.caught).length;
  // Only fetch underlying pages up to the currently requested 42-sized "page", instead of pulling
  // in every matching page until all caught Pokémon happen to be loaded. `caughtRecords.length`
  // is an upper bound (it ignores search/type), tightened down to the real count once
  // `hasNextPage` goes false (see `totalCount` below).
  const caughtFetchTarget = Math.min(gridVisibleCount, caughtRecords.length);
  // Whether the grid's next `gridVisibleCount` slice needs more backend pages loaded first —
  // applies just as much outside "caught only" (e.g. paging through a fully-loaded sorted list)
  // as it does within it.
  const gridNeedsFetch =
    hasNextPage &&
    (caughtOnly ? loadedCaughtCount < caughtFetchTarget : visibleCatalog.length < gridVisibleCount);
  const caughtHasMore = hasNextPage
    ? gridVisibleCount < caughtRecords.length
    : gridVisibleCount < loadedCaughtCount;

  useEffect(() => {
    if (gridNeedsFetch && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [gridNeedsFetch, isFetchingNextPage, fetchNextPage]);

  // Without active filters the API total gives the real page count. Search and/or a single type
  // filter are also fetched paginated from the backend, so that combined total is exact too. Once
  // "caught only" is layered on top, the exact total is only known after every matching page has
  // been fetched (`!hasNextPage`); until then, `caughtRecords.length` is used as an upper-bound
  // estimate. Multiple types selected fall back to the loaded-so-far estimate (no server support).
  const serverFilteredTotal = listData?.pages.at(-1)?.total ?? 0;
  const totalCount = caughtOnly
    ? hasNextPage
      ? caughtRecords.length
      : loadedCaughtCount
    : selectedTypes.length > 1
      ? visibleCatalog.length
      : serverFilteredTotal;
  const nonCaughtHasMore = hasNextPage
    ? gridVisibleCount < totalCount
    : gridVisibleCount < visibleCatalog.length;
  const gridHasMore = totalCount === 0 ? false : caughtOnly ? caughtHasMore : nonCaughtHasMore;
  const tablePageCount = caughtOnly
    ? Math.max(1, Math.ceil(totalCount / tablePageSize))
    : selectedTypes.length > 1
      ? Math.max(1, Math.ceil(visibleCatalog.length / tablePageSize) + (hasNextPage ? 1 : 0))
      : Math.max(1, Math.ceil(totalCount / tablePageSize));
  const tableEntries = visibleCatalog.slice(
    tablePage * tablePageSize,
    (tablePage + 1) * tablePageSize,
  );
  const showEmptyDeck = isDeckView && !isLoading && caughtRecords.length === 0;
  // Distinct from `showEmptyDeck`: this is a search/filter yielding zero matches, not an empty deck.
  const showNoResults = !isLoading && !showEmptyDeck && totalCount === 0 && !gridHasMore;

  const handleTablePageSizeChange = (pageSize: number) => {
    setTablePageSize(pageSize);
    setTablePage(0);
  };

  const handleGoToTablePage = async (target: number) => {
    const safeTarget = Math.max(0, target);
    const caughtById = new Map(caughtRecords.map((record) => [record.pokemonId, record]));
    let more = hasNextPage;
    let filteredCount = visibleCatalog.length;
    const needsFetch = (safeTarget + 1) * tablePageSize > filteredCount && more;
    // Force the retro loader to stay visible for a minimum stretch so it's actually perceivable
    // even when the fetch itself resolves quickly.
    const minLoaderDuration = 2500;
    const loaderStartedAt = Date.now();
    if (needsFetch) setIsJumpingPage(true);
    // Recompute the filtered count from freshly fetched pages (not the stale visibleCatalog
    // closure) so jumping across filtered/searched results still fetches enough items.
    while ((safeTarget + 1) * tablePageSize > filteredCount && more) {
      const result = await fetchNextPage();
      const items = result.data?.pages.flatMap((page) => page.items) ?? [];
      const entries: CatalogEntry[] = items.map((item) => {
        const record = caughtById.get(item.id);
        return {
          ...item,
          caught: record?.caught ?? false,
          caughtAt: record?.caughtAt ?? null,
          notes: record?.notes ?? '',
          tags: record?.tags ?? [],
          types: [],
          height: null,
        };
      });
      filteredCount = applyFilters(entries, {
        search: debouncedSearch,
        types: useServerTypeFilter ? [] : selectedTypes,
        caughtOnly,
        idRange: null,
      }).length;
      more = result.hasNextPage ?? false;
    }
    if (needsFetch) {
      const remaining = minLoaderDuration - (Date.now() - loaderStartedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      setIsJumpingPage(false);
    }
    setTablePage(safeTarget);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 font-mono text-[#241F1A]">
      {/* Top Banner & Progress Section */}
      <div className="mb-6 space-y-3">
        <OfflineStatusBanner />
        {readOnly && (
          <div className="rounded-lg border-4 border-[#241F1A] bg-[#E8AEEC]/30 p-4 text-center text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#241F1A]">
            {t('sharedDeckBanner', {
              count: sharedIdSet.size,
              total: listData?.pages.at(-1)?.total ?? 0,
            })}
          </div>
        )}
        {forceCaughtOnly && (
          <div className="rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-4 shadow-[4px_4px_0px_0px_#241F1A]">
            <ProgressOverview entries={catalog} totalOverride={totalPokemonCount} />
          </div>
        )}
      </div>

      {/* Control & Filter Toolbar */}
      <PokedexToolbar
        t={t}
        search={search}
        onSearchChange={setSearch}
        caughtOnly={caughtOnly}
        onCaughtOnlyChange={setCaughtOnly}
        forceCaughtOnly={forceCaughtOnly}
        catalog={forceCaughtOnly ? catalog.filter((entry) => entry.caught) : catalog}
        onShareDeck={forceCaughtOnly && !readOnly ? () => setShowShareDeck(true) : undefined}
        readOnly={readOnly}
        selectMode={selectMode}
        onToggleSelectMode={toggleSelectMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        onSortChange={setSort}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-8 text-center text-sm font-bold shadow-[4px_4px_0px_0px_#241F1A]">
          {t('loading')}
        </div>
      ) : showEmptyDeck ? (
        <EmptyDeckState />
      ) : showNoResults ? (
        <EmptyDeckState
          title={tEmptyDeck('noResultsTitle')}
          subtitle={tEmptyDeck('noResultsSubtitle')}
        />
      ) : (
        <div className="relative">
          {isSortLoading && <RetroLoader label={t('sorting')} testId="pokedex-sort-loader" />}
          {viewMode === 'table' ? (
            <PokemonTable
              entries={tableEntries}
              onSelect={setSelectedEntry}
              onToggleCaught={handleToggleCaught}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              selectMode={selectMode}
              pagination={{
                page: tablePage,
                pageCount: tablePageCount,
                onGoToPage: (target) => void handleGoToTablePage(target),
                isLoadingNext: isFetchingNextPage || isJumpingPage,
                pageSize: tablePageSize,
                onPageSizeChange: handleTablePageSizeChange,
              }}
            />
          ) : (
            <PokemonGrid
              entries={visibleCatalog.slice(0, gridVisibleCount)}
              onToggleCaught={handleToggleCaught}
              onSelect={setSelectedEntry}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              selectMode={selectMode}
              hasMore={gridHasMore}
              isLoadingMore={gridNeedsFetch || isFetchingNextPage}
              onLoadMore={() => setGridVisibleCount((count) => count + PAGE_SIZE)}
              loadedCount={Math.min(
                gridVisibleCount,
                caughtOnly ? loadedCaughtCount : visibleCatalog.length,
              )}
              totalCount={totalCount}
            />
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showShareDeck && (
        <ShareDeckModal
          pokemonIds={caughtRecords
            .filter((record) => record.caught)
            .map((record) => record.pokemonId)}
          onClose={() => setShowShareDeck(false)}
        />
      )}
      {selectedEntry && (
        <PokemonDetailModal
          entry={selectedEntry}
          onClose={handleCloseDetail}
          onSaveNote={readOnly ? () => {} : (pokemonId, notes) => void updateNote(pokemonId, notes)}
          onToggleCaught={readOnly ? undefined : handleToggleCaught}
        />
      )}

      {/* Floating Bottom Dock: appears only while selecting, avoids layout shift */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 transition-transform duration-200 ease-out ${
          selectMode && selectedIds.size > 0 ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex max-w-full flex-col items-center gap-2 rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-3 shadow-[4px_4px_0px_0px_#241F1A] sm:flex-row sm:gap-3">
          <span className="whitespace-nowrap text-xs font-black uppercase tracking-wider">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
          <div className="flex w-full items-center gap-3 sm:contents sm:w-auto">
            <button
              type="button"
              onClick={() => void handleReleaseSelected()}
              className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] bg-[#DE623C] px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] transition-all hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 sm:flex-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('releaseSelected')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-[#241F1A] shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] transition-all hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 sm:flex-none"
            >
              <X className="h-3.5 w-3.5" />
              {t('clearSelection')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
