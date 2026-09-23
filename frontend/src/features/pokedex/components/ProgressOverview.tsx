import { useMemo } from 'react';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { computeProgressStats } from '../utils/progress-stats.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';

interface ProgressOverviewProps {
  entries: CatalogEntry[];
}

const INK = '#241F1A';

export function ProgressOverview({ entries }: ProgressOverviewProps) {
  const t = useTranslations('progress');
  const { caughtCount, totalCount, percentCaught, typeDistribution } = useMemo(
    () => computeProgressStats(entries),
    [entries],
  );

  return (
    <section className="font-mono text-[#241F1A]" aria-label="Pokédex progress overview">
      {/* Header Info */}
      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-[#241F1A] bg-[#C98A4D]" />
          {t('caughtCount', { caught: caughtCount, total: totalCount })}
        </span>
        <span className="rounded border border-[#241F1A] bg-white px-2 py-0.5 shadow-[1px_1px_0px_0px_#241F1A]">
          {percentCaught}%
        </span>
      </div>

      {/* Retro Arcade Gauge Bar */}
      <div className="relative h-5 w-full overflow-hidden rounded border-3 border-[#241F1A] bg-white p-0.5 shadow-[2px_2px_0px_0px_#241F1A]">
        {/* Background Grid Pattern inside bar */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
            backgroundSize: '8px 100%',
          }}
        />

        {/* Animated Progress Filler */}
        <div
          className="relative h-full rounded-sm bg-[#C98A4D] transition-all duration-500 ease-out"
          style={{ width: `${percentCaught}%` }}
        >
          {/* Subtle Retro Stripe Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(135deg, #FFF 25%, transparent 25%, transparent 50%, #FFF 50%, #FFF 75%, transparent 75%, transparent)`,
              backgroundSize: '12px 12px',
            }}
          />
        </div>
      </div>

      {/* Optional Type Breakdown Badges */}
      {typeDistribution.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {typeDistribution.map(({ type, caught, total }) => (
            <div
              key={type}
              className="flex items-center justify-between rounded border-2 border-[#241F1A] bg-white px-2 py-1 text-[11px] font-bold uppercase shadow-[2px_2px_0px_0px_#241F1A]"
            >
              <span className="truncate tracking-wide">{type}</span>
              <span className="font-black text-[#C98A4D]">
                {caught}/{total}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}