import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { PokemonCard } from './PokemonCard.js';
import { useResponsiveColumns } from '../hooks/useResponsiveColumns.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';

// Must match PokemonCard height (240px) plus the grid gap (32px, gap-8)
const ROW_HEIGHT_PX = 272;
const FOOTER_HEIGHT_PX = 96;
const GRID_GAP_CLASSES = 'gap-8';
// Adjusted column counts to give cards room to expand horizontally
const COLUMN_CLASSES = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';

interface PokemonGridProps {
  entries: CatalogEntry[];
  onToggleCaught: (entry: CatalogEntry) => void;
  onSelect: (entry: CatalogEntry) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (entry: CatalogEntry) => void;
  selectMode?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  loadedCount?: number;
  totalCount?: number;
}

export function PokemonGrid({
  entries,
  onToggleCaught,
  onSelect,
  selectedIds,
  onToggleSelect,
  selectMode = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadedCount,
  totalCount,
}: PokemonGridProps) {
  const t = useTranslations('dashboard');
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useResponsiveColumns();
  const rowCount = Math.ceil(entries.length / columns);

  // Render the load-more control as the final virtual row, so it's always
  // positioned immediately after the last card row instead of relying on a
  // separately computed offset.
  const footerIndex = hasMore ? rowCount : null;
  const virtualCount = rowCount + (hasMore ? 1 : 0);

  const rowVirtualizer = useVirtualizer({
    count: virtualCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (index === footerIndex ? FOOTER_HEIGHT_PX : ROW_HEIGHT_PX),
    overscan: 2,
  });

  return (
    <div>
      <div
        ref={parentRef}
        className="h-[72vh] overflow-auto rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-5 shadow-[4px_4px_0px_0px_#241F1A] [scrollbar-color:#241F1A_#F4EBE1]"
        data-testid="pokemon-grid"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            if (virtualRow.index === footerIndex) {
              return (
                <div
                  key={virtualRow.key}
                  className="flex flex-col items-center justify-center gap-2"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {typeof loadedCount === 'number' && typeof totalCount === 'number' && (
                    <span className="text-xs font-black uppercase tracking-wider text-[#241F1A]/70">
                      {t('loadMoreCount', { count: loadedCount, total: totalCount })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 rounded-md border-2 border-[#241F1A] bg-[#DE623C] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#241F1A] transition-colors hover:bg-[#c9522e] active:translate-x-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoadingMore && (
                      <span className="h-3 w-3 animate-pulse rounded-full bg-white" aria-hidden="true" />
                    )}
                    {isLoadingMore ? t('loadingMore') : t('loadMore')}
                  </button>
                </div>
              );
            }

            const rowEntries = entries.slice(
              virtualRow.index * columns,
              virtualRow.index * columns + columns,
            );

            return (
              <div
                key={virtualRow.key}
                className={`grid ${COLUMN_CLASSES} ${GRID_GAP_CLASSES}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowEntries.map((entry) => (
                  <PokemonCard
                    key={entry.id}
                    entry={entry}
                    onToggleCaught={onToggleCaught}
                    onSelect={onSelect}
                    selected={selectedIds?.has(entry.id) ?? false}
                    onToggleSelect={onToggleSelect}
                    selectMode={selectMode}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}