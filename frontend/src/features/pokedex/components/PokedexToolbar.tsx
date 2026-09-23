import { useEffect, useRef } from 'react';
import { Search, Download, Share2, LayoutGrid, Table as TableIcon, CheckSquare } from 'lucide-react';
import type { CatalogEntry, SortOption } from '../domain/pokemon.types.js';
import { downloadExport, CSVExporterStrategy } from '../strategies/export/csv-exporter.strategy.js';
import { TypeBadge } from './TypeBadge.js';

type ViewMode = 'grid' | 'table';

const SORT_PRESETS: { value: string; sort: SortOption; labelKey: string }[] = [
  { value: 'name-asc', sort: { field: 'name', direction: 'asc' }, labelKey: 'nameAsc' },
  { value: 'name-desc', sort: { field: 'name', direction: 'desc' }, labelKey: 'nameDesc' },
  { value: 'caughtAt-desc', sort: { field: 'caughtAt', direction: 'desc' }, labelKey: 'caughtAtDesc' },
  { value: 'caughtAt-asc', sort: { field: 'caughtAt', direction: 'asc' }, labelKey: 'caughtAtAsc' },
  { value: 'height-asc', sort: { field: 'height', direction: 'asc' }, labelKey: 'heightAsc' },
  { value: 'height-desc', sort: { field: 'height', direction: 'desc' }, labelKey: 'heightDesc' },
];

type PokedexToolbarProps = {
  t: (key: string, values?: Record<string, string | number>) => string;
  search: string;
  onSearchChange: (value: string) => void;
  caughtOnly: boolean;
  onCaughtOnlyChange: (value: boolean) => void;
  forceCaughtOnly: boolean;
  catalog: CatalogEntry[];
  onShare: () => void;
  shareStatus: string | null;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableTypes: string[];
  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
};

// Fixed width keeps the button stable when its label swaps (e.g. "Select Multiple" <-> "Done")
const SELECT_MODE_BUTTON_WIDTH = 'w-[9.5rem]';
const BUTTON_HEIGHT = 'h-9';

export function PokedexToolbar({
  t,
  search,
  onSearchChange,
  caughtOnly,
  onCaughtOnlyChange,
  forceCaughtOnly,
  catalog,
  onShare,
  shareStatus,
  selectMode,
  onToggleSelectMode,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  availableTypes,
  selectedTypes,
  onSelectedTypesChange,
}: PokedexToolbarProps) {
  const toggleType = (type: string) => {
    onSelectedTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((entry) => entry !== type)
        : [...selectedTypes, type],
    );
  };

  const sortDetailsRef = useRef<HTMLDetailsElement>(null);
  const typeDetailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortDetailsRef.current?.open && !sortDetailsRef.current.contains(target)) {
        sortDetailsRef.current.removeAttribute('open');
      }
      if (typeDetailsRef.current?.open && !typeDetailsRef.current.contains(target)) {
        typeDetailsRef.current.removeAttribute('open');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-6 rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-4 shadow-[4px_4px_0px_0px_#241F1A]">
      {/* Row 1: Search & Mode Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className={`w-full rounded border-2 border-[#241F1A] bg-white pl-9 pr-3 text-xs font-bold text-[#241F1A] shadow-[2px_2px_0px_0px_rgba(36,31,26,0.2)] focus:outline-none focus:ring-2 focus:ring-[#C98A4D] ${BUTTON_HEIGHT}`}
          />
        </div>

        {/* Select Multiple Toggle */}
        <button
          type="button"
          onClick={onToggleSelectMode}
          aria-pressed={selectMode}
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] px-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${SELECT_MODE_BUTTON_WIDTH} ${BUTTON_HEIGHT} ${
            selectMode
              ? 'bg-[#DE623C] text-white hover:opacity-90'
              : 'bg-white text-[#241F1A] hover:bg-gray-50'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {selectMode ? t('exitSelectMode') : t('selectMultiple')}
        </button>

        {/* View Mode Toggles */}
        <div className={`ml-auto flex shrink-0 items-center gap-1 rounded border-2 border-[#241F1A] bg-white p-1 shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] ${BUTTON_HEIGHT}`}>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title={t('viewGrid')}
            className={`flex h-full items-center justify-center gap-1 whitespace-nowrap rounded px-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#241F1A] text-white shadow-[1px_1px_0px_0px_rgba(36,31,26,1)]'
                : 'text-[#241F1A] hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('viewGrid')}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title={t('viewTable')}
            className={`flex h-full items-center justify-center gap-1 whitespace-nowrap rounded px-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
              viewMode === 'table'
                ? 'bg-[#241F1A] text-white shadow-[1px_1px_0px_0px_rgba(36,31,26,1)]'
                : 'text-[#241F1A] hover:bg-gray-100'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('viewTable')}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Filters & Utilities */}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-[#241F1A]/20 pt-3">
        {/* Sort By (Grid view only — Table view sorts via column headers) */}
        {viewMode === 'grid' && (
          <details ref={sortDetailsRef} className="relative">
            <summary
              aria-label={t('sortBy')}
              className={`flex list-none items-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] bg-white px-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(36,31,26,0.2)] cursor-pointer select-none [&::-webkit-details-marker]:hidden ${BUTTON_HEIGHT}`}
            >
              {t('sortBy')}
            </summary>
            <div className="absolute left-0 top-full z-20 mt-1 flex w-56 flex-col overflow-hidden rounded border-2 border-[#241F1A] bg-white shadow-[2px_2px_0px_0px_rgba(36,31,26,1)]">
              {SORT_PRESETS.map((option) => {
                const isActive = option.sort.field === sort.field && option.sort.direction === sort.direction;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(event) => {
                      onSortChange(option.sort);
                      event.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-left text-xs font-black uppercase tracking-wider transition-colors ${
                      isActive ? 'bg-[#E8AEEC] text-[#241F1A]' : 'text-[#241F1A] hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-3">{isActive ? '✓' : ''}</span>
                    {t(`sortOptions.${option.labelKey}`)}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <details ref={typeDetailsRef} className="relative">
            <summary
              className={`flex list-none items-center gap-1.5 whitespace-nowrap rounded border-2 border-[#241F1A] px-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(36,31,26,0.2)] cursor-pointer select-none [&::-webkit-details-marker]:hidden ${BUTTON_HEIGHT} ${
                selectedTypes.length > 0 ? 'bg-[#DE623C] text-white' : 'bg-white text-[#241F1A]'
              }`}
            >
              {t('typeFilter')}
              {selectedTypes.length > 0 && ` (${selectedTypes.length})`}
            </summary>
            <div className="absolute left-0 top-full z-20 mt-1 flex max-h-56 w-48 flex-col gap-1 overflow-auto rounded border-2 border-[#241F1A] bg-white p-2 shadow-[2px_2px_0px_0px_rgba(36,31,26,1)]">
              {selectedTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectedTypesChange([])}
                  className="mb-1 self-start text-[10px] font-black uppercase tracking-wider text-[#DE623C] hover:underline"
                >
                  {t('clearTypeFilter')}
                </button>
              )}
              {availableTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="h-3.5 w-3.5 rounded border-2 border-[#241F1A] accent-[#DE623C]"
                  />
                  <TypeBadge type={type} />
                </label>
              ))}
            </div>
          </details>
        )}

        {/* Caught Only Checkbox */}
        {!forceCaughtOnly && (
          <label className={`flex items-center gap-2 whitespace-nowrap rounded border-2 border-[#241F1A] bg-white px-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(36,31,26,0.2)] cursor-pointer select-none transition-colors hover:bg-gray-50 ${BUTTON_HEIGHT}`}>
            <input
              type="checkbox"
              checked={caughtOnly}
              onChange={(event) => onCaughtOnlyChange(event.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#241F1A] accent-[#DE623C]"
            />
            {t('caughtOnly')}
          </label>
        )}

        {shareStatus && (
          <span className="rounded border-2 border-dashed border-[#241F1A] bg-[#C98A4D]/20 px-2 py-1 text-xs font-bold text-[#241F1A]">
            {shareStatus}
          </span>
        )}

        {/* Secondary Actions: Export / Share grouped to save horizontal space */}
        <div className={`ml-auto flex shrink-0 items-center gap-1 rounded border-2 border-[#241F1A] bg-white p-1 shadow-[2px_2px_0px_0px_rgba(36,31,26,1)] ${BUTTON_HEIGHT}`}>
          <button
            type="button"
            onClick={() => downloadExport(new CSVExporterStrategy(), catalog, 'pokedex')}
            title={t('exportCsv')}
            className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded px-2.5 text-xs font-black uppercase tracking-wider text-[#241F1A] transition-colors hover:bg-gray-100"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('exportCsv')}</span>
          </button>
          <button
            type="button"
            onClick={onShare}
            title={t('share')}
            className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded px-2.5 text-xs font-black uppercase tracking-wider text-[#241F1A] transition-colors hover:bg-gray-100"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('share')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
