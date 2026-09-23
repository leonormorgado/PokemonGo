import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { PokemonCard } from './PokemonCard.js';
import { useResponsiveColumns } from '../hooks/useResponsiveColumns.js';

// Must match PokemonCard height (240px) plus the grid gap (32px, gap-8)
const ROW_HEIGHT_PX = 272;
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
}

export function PokemonGrid({
  entries,
  onToggleCaught,
  onSelect,
  selectedIds,
  onToggleSelect,
  selectMode = false,
}: PokemonGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useResponsiveColumns();
  const rowCount = Math.ceil(entries.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 2,
  });

  return (
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
      {/* Real element, since overflow-auto containers ignore trailing padding after absolutely positioned content */}
      <div className="h-8" />
    </div>
  );
}