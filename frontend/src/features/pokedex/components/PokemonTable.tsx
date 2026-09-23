import { useMemo, useState } from 'react';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { usePokemonTableData, type TableEntry } from '../hooks/usePokemonTableData.js';
import { TypeBadge } from './TypeBadge.js';

type TableColumn =
  | 'status'
  | 'name'
  | 'types'
  | 'caughtAt'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'speed'
  | 'height'
  | 'weight';
type SortDirection = 'asc' | 'desc';

const COLUMN_KEYS: TableColumn[] = [
  'status',
  'name',
  'types',
  'caughtAt',
  'hp',
  'attack',
  'defense',
  'speed',
  'height',
  'weight',
];

// table-fixed requires explicit widths per column to keep the table within its container
const COLUMN_WIDTHS: Record<TableColumn, string> = {
  status: 'w-20',
  name: 'w-[15%]',
  types: 'w-[17%]',
  caughtAt: 'w-[12%]',
  hp: 'w-[7%]',
  attack: 'w-[8%]',
  defense: 'w-[8%]',
  speed: 'w-[7%]',
  height: 'w-[10%]',
  weight: 'w-[10%]',
};
const CHECKBOX_COLUMN_WIDTH = 'w-10';


interface PokemonTableProps {
  entries: CatalogEntry[];
  onSelect: (entry: CatalogEntry) => void;
  onToggleCaught: (entry: CatalogEntry) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (entry: CatalogEntry) => void;
  selectMode?: boolean;
}

function compareValues(a: TableEntry, b: TableEntry, column: TableColumn): number {
  if (column === 'status') return Number(b.caught) - Number(a.caught);
  if (column === 'name') return a.name.localeCompare(b.name);
  if (column === 'types') return (a.types[0] ?? '').localeCompare(b.types[0] ?? '');
  if (column === 'caughtAt') {
    const aTime = a.caughtAt ? new Date(a.caughtAt).getTime() : 0;
    const bTime = b.caughtAt ? new Date(b.caughtAt).getTime() : 0;
    return aTime - bTime;
  }
  const aValue = a[column] ?? -Infinity;
  const bValue = b[column] ?? -Infinity;
  return aValue - bValue;
}

export function PokemonTable({
  entries,
  onSelect,
  onToggleCaught,
  selectedIds,
  onToggleSelect,
  selectMode = false,
}: PokemonTableProps) {
  const t = useTranslations('table');
  const { rows, isLoading } = usePokemonTableData(entries);
  const [sortColumn, setSortColumn] = useState<TableColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
    return t(`columns.${col}`);
  };

  const formatCaughtAt = (value: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString();
  };

  return (
    /* overflow-hidden + rounded-xl ensures outer hard border corners remain curved */
    <div
      className="hidden max-h-[72vh] overflow-hidden rounded-xl border-4 border-[#241F1A] bg-[#FFFACF] font-mono text-[#241F1A] shadow-[5px_5px_0px_0px_#241F1A] md:block"
      data-testid="pokemon-table"
    >
      <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden [scrollbar-color:#241F1A_#FFFACF]">
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
                      className="flex items-center gap-1 whitespace-nowrap px-1 py-1 text-[#FFFACF] transition-colors hover:opacity-80"
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

                {/* Caught Date */}
                <td className="px-3 py-2">
                  {formatCaughtAt(row.caughtAt) ?? t('emptyCell')}
                </td>

                {/* Stats */}
                <td className="px-3 py-2">{row.hp ?? (isLoading ? t('loadingCell') : t('emptyCell'))}</td>
                <td className="px-3 py-2">{row.attack ?? (isLoading ? t('loadingCell') : t('emptyCell'))}</td>
                <td className="px-3 py-2">{row.defense ?? (isLoading ? t('loadingCell') : t('emptyCell'))}</td>
                <td className="px-3 py-2">{row.speed ?? (isLoading ? t('loadingCell') : t('emptyCell'))}</td>
                <td className="px-3 py-2">
                  {row.height ? `${row.height.toFixed(1)} m` : isLoading ? t('loadingCell') : t('emptyCell')}
                </td>
                <td className="px-3 py-2">
                  {row.weight ? `${row.weight.toFixed(1)} kg` : isLoading ? t('loadingCell') : t('emptyCell')}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}