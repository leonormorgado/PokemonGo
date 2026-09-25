import { memo, useState, type MouseEvent } from 'react';
import { Share2 } from 'lucide-react';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { RetroImage } from '../../../shared/components/RetroImage.js';
import type { CatalogEntry } from '../domain/pokemon.types.js';
import { ShareDeckModal } from './ShareDeckModal.js';
import { TypeBadge } from './TypeBadge.js';

interface PokemonCardProps {
  entry: CatalogEntry;
  onToggleCaught: (entry: CatalogEntry) => void;
  onSelect: (entry: CatalogEntry) => void;
  selected?: boolean;
  onToggleSelect?: (entry: CatalogEntry) => void;
  selectMode?: boolean;
}

const INK = '#241F1A';

function PokemonCardComponent({
  entry,
  onToggleCaught,
  onSelect,
  selected = false,
  onToggleSelect,
  selectMode = false,
}: PokemonCardProps) {
  const t = useTranslations('card');
  const paddedId = String(entry.id).padStart(3, '0');
  const canSelect = entry.caught && Boolean(onToggleSelect) && selectMode;
  const ineligibleForSelection = selectMode && !entry.caught;
  const [showShare, setShowShare] = useState(false);

  const handleShare = (event: MouseEvent) => {
    event.stopPropagation();
    setShowShare(true);
  };

  const handleCardClick = () => {
    if (selectMode) {
      if (canSelect) onToggleSelect?.(entry);
      return;
    }
    onSelect(entry);
  };

  return (
    <div
      onClick={selectMode ? handleCardClick : undefined}
      role={canSelect ? 'checkbox' : undefined}
      aria-checked={canSelect ? selected : undefined}
      className={`group relative flex h-[240px] flex-col justify-between rounded-xl border-3 border-[#241F1A] p-3 font-mono text-[#241F1A] shadow-[4px_4px_0px_0px_#241F1A] transition-all hover:-translate-y-0.5 ${
        canSelect ? 'cursor-pointer' : ''
      } ${ineligibleForSelection ? 'pointer-events-none' : ''} ${
        selected ? 'bg-[#E8AEEC]/30 ring-4 ring-[#DE623C]' : 'bg-[#FFFACF]'
      }`}
    >
      {ineligibleForSelection && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 rounded-xl bg-[#241F1A]/35"
        />
      )}
      {ineligibleForSelection && (
        <span
          aria-hidden="true"
          className="absolute left-3 top-3 z-30 flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#241F1A] bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
        >
          🔒
        </span>
      )}
      {canSelect && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect?.(entry);
          }}
          aria-label={t('selectAria', { name: entry.name })}
          aria-pressed={selected}
          className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#241F1A] text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-colors ${
            selected ? 'bg-[#DE623C] text-white' : 'bg-white text-[#241F1A]'
          }`}
        >
          {selected ? '✓' : ''}
        </button>
      )}
      {/* Halftone Pattern Accent */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-15"
        style={{
          backgroundImage: `radial-gradient(${INK} 1.5px, transparent 1.5px)`,
          backgroundSize: '8px 8px',
        }}
      />

      {/* Header Badges */}
      <div className={`relative z-10 flex items-center justify-between gap-2 ${canSelect ? 'pl-7' : ''}`}>
        <span className="rounded-md border-2 border-[#241F1A] bg-[#241F1A] px-2 py-0.5 text-xs font-black tracking-wider text-[#FFFACF] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]">
          #{paddedId}
        </span>

        <div className="flex items-center gap-1.5">
          {entry.caught && (
            <span className="rounded-md border-2 border-[#241F1A] bg-[#E8AEEC] px-2 py-0.5 text-xs font-black uppercase tracking-wider text-[#241F1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {t('caught')}
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            title={t('share')}
            aria-label={t('shareAria', { name: entry.name })}
            className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#241F1A] bg-white text-[#241F1A] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] transition-colors hover:bg-gray-50"
          >
            <Share2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <button
        type="button"
        onClick={selectMode ? undefined : handleCardClick}
        disabled={selectMode}
        className="relative z-10 my-1 block w-full text-center focus:outline-none"
        aria-label={canSelect ? t('selectAria', { name: entry.name }) : t('viewDetails', { name: entry.name })}
      >
        <div className="relative mx-auto flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#241F1A] bg-[#E8B6BC]/20 p-2 shadow-[2px_2px_0px_0px_rgba(36,31,26,0.2)] group-hover:bg-[#E8B6BC]/40">
          <RetroImage
            src={entry.sprite}
            alt={entry.name}
            className="relative z-10 h-20 w-20 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)] transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <p className="mt-2 truncate text-sm font-black uppercase tracking-wider text-[#241F1A]">
          {entry.name}
        </p>
        {entry.types.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        )}
      </button>

      {/* Catch/Release Action */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleCaught(entry);
        }}
        disabled={canSelect}
        className={`relative z-10 w-full rounded-md border-2 border-[#241F1A] py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#241F1A] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
          canSelect ? 'cursor-not-allowed opacity-40' : ''
        } ${
          entry.caught
            ? 'bg-[#241F1A] hover:bg-[#38312a]'
            : 'bg-[#DE623C] hover:bg-[#c9522e]'
        }`}
      >
        {entry.caught ? t('release') : t('catch')}
      </button>
      {showShare && (
        <ShareDeckModal
          variant="pokemon"
          pokemonId={entry.id}
          pokemonName={entry.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

export const PokemonCard = memo(PokemonCardComponent);