import { useEffect, useMemo, useRef, useState } from 'react';
import { RetroLoader } from '../../../shared/components/RetroLoader.js';
import { RetroSelect } from '../../../shared/components/RetroSelect.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { usePokemonTableData, type TableEntry } from '../hooks/usePokemonTableData.js';
import { TypeBadge } from './TypeBadge.js';

// 'dex' is the default sort order and is also rendered as the first column
type TableColumn = 'dex' | 'status' | 'name' | 'types' | 'caughtAt' | 'stats';
type SortDirection = 'asc' | 'desc';

const COLUMN_KEYS: TableColumn[] = ['dex', 'status', 'name', 'types', 'caughtAt', 'stats'];

// table-fixed requires explicit widths per column to keep the table within its container;
// dex is narrower (short fixed-width content), remaining columns share the rest evenly.
const COLUMN_WIDTHS: Record<TableColumn, string> = {
  dex: 'w-16',
  status: 'w-1/5',
  name: 'w-1/5',
  types: 'w-1/5',
  caughtAt: 'w-1/5',
  stats: 'w-1/5',
};
const CHECKBOX_COLUMN_WIDTH = 'w-10';


const PAGE_SIZE_OPTIONS = [20, 42, 100] as const;

interface TablePagination {
  page: number;
  pageCount: number;
  onGoToPage: (page: number) => void;
  isLoadingNext?: boolean;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => start + index);
}

// Builds `1 2 3 4 ... N` / `1 ... 11 12 13 ... N` / `1 ... N-3 N-2 N-1 N` page lists.
function getPageNumbers(currentPage: number, pageCount: number): Array<number | 'ellipsis'> {
  const siblingCount = 1;
  const edgeCount = siblingCount * 2 + 2;

  if (pageCount <= edgeCount * 2 + 1) return range(1, pageCount);

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, pageCount);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < pageCount - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, edgeCount), 'ellipsis', pageCount];
  }
  if (showLeftDots && !showRightDots) {
    return [1, 'ellipsis', ...range(pageCount - edgeCount + 1, pageCount)];
  }
  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', pageCount];
}

interface PokemonTableProps {
  entries: CatalogEntry[];
  onSelect: (entry: CatalogEntry) => void;
  onToggleCaught: (entry: CatalogEntry) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (entry: CatalogEntry) => void;
  selectMode?: boolean;
  pagination?: TablePagination;
}

function compareValues(a: TableEntry, b: TableEntry, column: TableColumn): number {
  if (column === 'status') return Number(b.caught) - Number(a.caught);
  if (column === 'name') return a.name.localeCompare(b.name);
  if (column === 'dex') return a.id - b.id;
  if (column === 'types') return (a.types[0] ?? '').localeCompare(b.types[0] ?? '');
  if (column === 'caughtAt') {
    const aTime = a.caughtAt ? new Date(a.caughtAt).getTime() : 0;
    const bTime = b.caughtAt ? new Date(b.caughtAt).getTime() : 0;
    return aTime - bTime;
  }
  const aValue = a.stats ?? -Infinity;
  const bValue = b.stats ?? -Infinity;
  return aValue - bValue;
}

export function PokemonTable({
  entries,
  onSelect,
  onToggleCaught,
  selectedIds,
  onToggleSelect,
  selectMode = false,
  pagination,
}: PokemonTableProps) {
  const t = useTranslations('table');
  const { rows, isLoading } = usePokemonTableData(entries);
  const [sortColumn, setSortColumn] = useState<TableColumn>('dex');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [pagination?.page]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => compareValues(a, b, sortColumn));
    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [rows, sortColumn, sortDirection]);

  const handleSort = (column: TableColumn) => {
    if (column === sortColumn) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getColumnLabel = (col: TableColumn) => {
    if (col === 'status') return t('columns.status');
    if (col === 'dex') return t('columns.dex');
    return t(`columns.${col}`);
  };

  const formatCaughtAt = (value: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString();
  };

  const openPageInput = () => {
    if (!pagination) return;
    setPageInputValue(String(pagination.page + 1));
    setIsEditingPage(true);
  };

  const submitPageInput = () => {
    if (!pagination) return;
    const target = Number(pageInputValue);
    if (Number.isInteger(target) && target >= 1 && target <= pagination.pageCount) {
      pagination.onGoToPage(target - 1);
    }
    setIsEditingPage(false);
  };

  return (
    /* overflow-hidden + rounded-xl ensures outer hard border corners remain curved */
    <div
      className="relative hidden max-h-[72vh] flex-col overflow-hidden rounded-xl border-4 border-[#241F1A] bg-[#FFFACF] font-mono text-[#241F1A] shadow-[5px_5px_0px_0px_#241F1A] md:flex"
      data-testid="pokemon-table"
    >
      {pagination?.isLoadingNext && (
        <RetroLoader label={t('jumpingToPage')} testId="pokemon-table-loader" />
      )}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-color:#241F1A_#FFFACF]"
      >
        <table className="w-full table-fixed border-collapse text-xs font-bold">
          <thead className="sticky top-0 z-10 bg-[#241F1A] text-white">
            <tr>
              {selectMode && (
                <th
                  className={`border-b-4 border-[#241F1A] px-3 py-2.5 text-left font-black uppercase tracking-wider ${CHECKBOX_COLUMN_WIDTH}`}
                />
              )}
              {COLUMN_KEYS.map((column) => {
                const isActive = sortColumn === column;
                return (
                  <th
                    key={column}
                    className={`border-b-4 border-[#241F1A] px-3 py-2.5 text-left font-black uppercase tracking-wider ${COLUMN_WIDTHS[column]}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="flex items-center gap-1 px-1 py-1 text-[#FFFACF] transition-colors hover:opacity-80"
                    >
                      <span>{getColumnLabel(column)}</span>
                      <span className="text-[9px] leading-none">
                        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="opacity-40">▲▼</span>}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row, index) => {
              const canSelect = row.caught && Boolean(onToggleSelect) && selectMode;
              const isSelected = selectedIds?.has(row.id) ?? false;
              const handleRowClick = () => {
                if (selectMode) {
                  if (canSelect) onToggleSelect?.(row);
                  return;
                }
                onSelect(row);
              };
              return (
              <tr
                key={row.id}
                onClick={handleRowClick}
                role={canSelect ? 'checkbox' : undefined}
                aria-checked={canSelect ? isSelected : undefined}
                className={`cursor-pointer border-b-2 border-[#241F1A]/15 transition-colors hover:bg-[#E8AEEC]/30 ${
                  selectMode && !row.caught ? 'opacity-50' : ''
                } ${
                  isSelected && canSelect
                    ? 'bg-[#E8AEEC]/50 ring-2 ring-inset ring-[#DE623C]'
                    : index % 2 === 0
                      ? 'bg-[#FFFACF]'
                      : 'bg-[#E8B6BC]/20'
                }`}
              >
                {selectMode && (
                  <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={() => onToggleSelect?.(row)}
                      className="h-4 w-4 accent-[#DE623C] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                )}
                {/* Dex Number */}
                <td className="px-3 py-2 font-black tracking-wide text-[#241F1A]">
                  #{String(row.id).padStart(3, '0')}
                </td>

                {/* Status / Catch-Release Column */}
                <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                  {row.caught ? (
                    <button
                      type="button"
                      onClick={() => onToggleCaught(row)}
                      disabled={canSelect}
                      className={`rounded-md border-2 border-[#241F1A] bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#241F1A] shadow-[1px_1px_0px_0px_#241F1A] transition-colors hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 ${
                        canSelect ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                    >
                      {t('release')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleCaught(row)}
                      disabled={canSelect}
                      className={`rounded-md border-2 border-[#241F1A] bg-[#DE623C] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-[1px_1px_0px_0px_#241F1A] transition-colors hover:bg-[#c9522e] active:translate-x-0.5 active:translate-y-0.5 ${
                        canSelect ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                    >
                      {t('catch')}
                    </button>
                  )}
                </td>

                {/* Name */}
                <td className="truncate px-3 py-2 font-black uppercase tracking-wide text-[#241F1A]">
                  {row.name}
                </td>

                {/* Types */}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.types.length > 0
                      ? row.types.map((type) => <TypeBadge key={type} type={type} />)
                      : (isLoading ? t('loadingCell') : t('emptyCell'))}
                  </div>
                </td>

                {/* Caught Status */}
                <td className="px-3 py-2 text-center" title={formatCaughtAt(row.caughtAt) ?? undefined}>
                  {row.caughtAt ? <span className="text-[#2E7D32]">✓</span> : t('emptyCell')}
                </td>

                {/* Base Stat Total (hp + attack + defense + speed only; see usePokemonTableData) */}
                <td className="px-3 py-2">{row.stats ?? (isLoading ? t('loadingCell') : t('emptyCell'))}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t-4 border-[#241F1A] bg-[#241F1A] px-3 py-2 text-white">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            {t('rowsPerPage')}
            <RetroSelect
              value={pagination.pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={pagination.onPageSizeChange}
              label={t('rowsPerPage')}
            />
          </div>
          {pagination.pageCount > 1 && (
            <div className="flex items-center gap-2">
              {isEditingPage ? (
                <span className="mr-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/70">
                  <input
                    ref={pageInputRef}
                    type="number"
                    min={1}
                    max={pagination.pageCount}
                    value={pageInputValue}
                    autoFocus
                    onChange={(event) => setPageInputValue(event.target.value)}
                    onBlur={submitPageInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') submitPageInput();
                      if (event.key === 'Escape') setIsEditingPage(false);
                    }}
                    className="w-10 rounded-md border-2 border-[#241F1A] bg-[#FFFACF] px-1 py-0.5 text-center text-[10px] font-black text-[#241F1A]"
                  />
                  / {pagination.pageCount}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openPageInput}
                  className="mr-1 rounded-md px-1 text-[10px] font-black uppercase tracking-wider text-white/70 transition-colors hover:text-white hover:underline"
                >
                  {t('pageIndicator', { page: pagination.page + 1, pageCount: pagination.pageCount })}
                </button>
              )}
              <button
                type="button"
                aria-label={t('firstPage')}
                onClick={() => pagination.onGoToPage(0)}
                disabled={pagination.page === 0}
                className="rounded-md border-2 border-white px-2 py-1 text-[10px] font-black transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt;&lt;
              </button>
              <button
                type="button"
                aria-label={t('prevPage')}
                onClick={() => pagination.onGoToPage(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="rounded-md border-2 border-white px-2 py-1 text-[10px] font-black transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt;
              </button>
              {getPageNumbers(pagination.page + 1, pagination.pageCount).map((entry, index) =>
                entry === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-[10px] font-black">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => pagination.onGoToPage(entry - 1)}
                    aria-current={pagination.page === entry - 1 ? 'page' : undefined}
                    className={`rounded-md border-2 px-2 py-1 text-[10px] font-black transition-colors ${
                      pagination.page === entry - 1
                        ? 'border-[#241F1A] bg-[#DE623C] text-white shadow-[1px_1px_0px_0px_#241F1A]'
                        : 'border-white hover:bg-white/10'
                    }`}
                  >
                    {entry}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label={t('nextPage')}
                onClick={() => pagination.onGoToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pageCount - 1 || pagination.isLoadingNext}
                className="rounded-md border-2 border-white px-2 py-1 text-[10px] font-black transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;
              </button>
              <button
                type="button"
                aria-label={t('lastPage')}
                onClick={() => pagination.onGoToPage(pagination.pageCount - 1)}
                disabled={pagination.page >= pagination.pageCount - 1 || pagination.isLoadingNext}
                className="rounded-md border-2 border-white px-2 py-1 text-[10px] font-black transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}