import type { CatalogEntry } from '../domain/pokemon.types.js';

export interface TypeDistributionEntry {
  type: string;
  caught: number;
  total: number;
}

export interface ProgressStats {
  caughtCount: number;
  totalCount: number;
  percentCaught: number;
  typeDistribution: TypeDistributionEntry[];
}

/**
 * Computes catch progress (count/percent) and per-type breakdown for `ProgressOverview`.
 * @param entries The currently loaded catalog entries (used to derive caught status per type).
 * @param totalOverride Real Pokédex-wide total, if resolved, to avoid understating progress
 * while only a subset of pages has loaded.
 * @param typeTotals Real per-type totals (from `useTypeTotals`), preferred over counting only
 * the loaded entries so "BUG - 0/6" reflects the whole Pokédex, not just what's on screen.
 */
export function computeProgressStats(
  entries: CatalogEntry[],
  totalOverride?: number,
  typeTotals?: Record<string, number>,
): ProgressStats {
  const totalCount = totalOverride && totalOverride > entries.length ? totalOverride : entries.length;
  const caughtCount = entries.filter((entry) => entry.caught).length;
  const percentCaught = totalCount === 0 ? 0 : Math.round((caughtCount / totalCount) * 100);

  const byType = new Map<string, { caught: number; total: number }>();
  for (const entry of entries) {
    for (const type of entry.types) {
      const current = byType.get(type) ?? { caught: 0, total: 0 };
      current.total += 1;
      if (entry.caught) current.caught += 1;
      byType.set(type, current);
    }
  }
  // Prefer the real Pokédex-wide total for each type over the loaded-entries count.
  for (const [type, counts] of byType) {
    const realTotal = typeTotals?.[type];
    if (realTotal !== undefined) counts.total = realTotal;
  }

  const typeDistribution = [...byType.entries()]
    .map(([type, counts]) => ({ type, ...counts }))
    .sort((a, b) => a.type.localeCompare(b.type));

  return { caughtCount, totalCount, percentCaught, typeDistribution };
}
