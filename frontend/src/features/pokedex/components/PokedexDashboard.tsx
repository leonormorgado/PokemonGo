import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePokemonList } from '../hooks/usePokemonList.js';
import { usePokedexStorage } from '../hooks/usePokedexStorage.js';
import { useFilterSort } from '../hooks/useFilterSort.js';
import { usePokemonTypes } from '../hooks/usePokemonTypes.js';
import { OfflineStatusBanner } from '../../offline/components/OfflineStatusBanner.js';
import { useDebounce } from '../../../shared/hooks/useDebounce.js';
import { CSVExporterStrategy } from '../strategies/export/csv-exporter.strategy.js';
import { sharePokedexExport } from '../strategies/export/share.js';
import { ProgressOverview } from './ProgressOverview.js';
import { PokemonGrid } from './PokemonGrid.js';
import { PokemonTable } from './PokemonTable.js';
import { PokemonDetailModal } from './PokemonDetailModal.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { Trash2, X } from 'lucide-react';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { PokedexToolbar } from './PokedexToolbar.js';

const PAGE_SIZE = 40;
type ViewMode = 'grid' | 'table';

type PokedexDashboardProps = {
  forceCaughtOnly?: boolean;
};


export function PokedexDashboard({ forceCaughtOnly = false }: PokedexDashboardProps = {}) {
  const t = useTranslations('dashboard');
  const { id: deepLinkId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [caughtOnly, setCaughtOnly] = useState(forceCaughtOnly);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data: page, isLoading } = usePokemonList(PAGE_SIZE, 0);
  const { caughtRecords, catch: catchPokemon, release, releaseMany, updateNote } = usePokedexStorage();

  const baseCatalog: CatalogEntry[] = useMemo(() => {
    const caughtById = new Map(caughtRecords.map((record) => [record.pokemonId, record]));
    return (page?.items ?? []).map((item) => {
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
  }, [page, caughtRecords]);

  const catalog = usePokemonTypes(baseCatalog);
  const availableTypes = useMemo(
    () => Array.from(new Set(catalog.flatMap((entry) => entry.types))).sort(),
    [catalog],
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { result: visibleCatalog, setFilters, sort, setSort } = useFilterSort(catalog);

  useEffect(() => {
    setFilters({ search: debouncedSearch, types: selectedTypes, caughtOnly });
  }, [debouncedSearch, caughtOnly, selectedTypes, setFilters]);

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

  const handleShare = async () => {
    const { method } = await sharePokedexExport(new CSVExporterStrategy(), catalog, 'pokedex');
    setShareStatus(
      method === 'share'
        ? t('shareStatus.shared')
        : method === 'clipboard'
          ? t('shareStatus.copied')
          : t('shareStatus.downloaded'),
    );
  };

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = setTimeout(() => setShareStatus(null), 3000);
    return () => clearTimeout(timeout);
  }, [shareStatus]);

  return (
    <div className="mx-auto max-w-6xl p-4 font-mono text-[#241F1A]">
      {/* Top Banner & Progress Section */}
      <div className="mb-6 space-y-3">
        <OfflineStatusBanner />
        {forceCaughtOnly && (
          <div className="rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-4 shadow-[4px_4px_0px_0px_#241F1A]">
            <ProgressOverview entries={catalog} />
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
        catalog={catalog}
        onShare={() => void handleShare()}
        shareStatus={shareStatus}
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
      ) : viewMode === 'table' ? (
        <PokemonTable
          entries={visibleCatalog}
          onSelect={setSelectedEntry}
          onToggleCaught={(entry) => void (entry.caught ? release(entry.id) : catchPokemon(entry.id))}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelected}
          selectMode={selectMode}
        />
      ) : (
        <PokemonGrid
          entries={visibleCatalog}
          onToggleCaught={(entry) => void (entry.caught ? release(entry.id) : catchPokemon(entry.id))}
          onSelect={setSelectedEntry}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelected}
          selectMode={selectMode}
        />
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <PokemonDetailModal
          entry={selectedEntry}
          onClose={handleCloseDetail}
          onSaveNote={(pokemonId, notes) => void updateNote(pokemonId, notes)}
          onToggleCaught={(entry) => void (entry.caught ? release(entry.id) : catchPokemon(entry.id))}
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
          <div className="flex w-full items-center gap-3 sm:w-auto sm:contents">
            <button
              type="button"
              onClick={() => void handleReleaseSelected()}
              className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] bg-[#DE623C] px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] hover:opacity-90 active:translate-x-0.5 active:translate-y-0.5 transition-all sm:flex-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('releaseSelected')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-[#241F1A] shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 transition-all sm:flex-none"
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