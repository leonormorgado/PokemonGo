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

export function computeProgressStats(entries: CatalogEntry[]): ProgressStats {
  const totalCount = entries.length;
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

  const typeDistribution = [...byType.entries()]
    .map(([type, counts]) => ({ type, ...counts }))
    .sort((a, b) => a.type.localeCompare(b.type));

  return { caughtCount, totalCount, percentCaught, typeDistribution };
}
