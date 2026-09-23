import { useMemo, useState } from 'react';
import { CalendarDays, Ruler, Shuffle, Weight, FileText } from 'lucide-react';
import { colors, typeColors, DEFAULT_TYPE_COLOR } from '../../../shared/styles/colors.js';
import { useTranslations } from '@/shared/hooks/useTranslations.js';

export interface RetroPokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface RetroPokemon {
  id: number;
  name: string;
  japaneseName?: string;
  types: string[];
  height: number;
  weight: number;
  stats: RetroPokemonStats;
  caught: boolean;
  caughtDate: string | null;
  imageUrl: string;
}

interface RetroPokemonCardProps {
  pokemon: RetroPokemon;
  notes?: string;
  notesLabel?: string;
  notesPlaceholder?: string;
  onNotesChange?: (notes: string) => void;
  onNotesBlur?: () => void;
  onToggleCaught?: () => void;
}

interface ColorScheme {
  name: string;
  background: string;
  frame: string;
  ink: string;
  accent: string;
  gauge: string;
  badge: string;
}

// Retro themes based on the updated colors.ts palette
const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'cherryBlossom',
    background: colors.dustyCherryPink,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.rustRedAccent,
    gauge: typeColors.fighting?.bg || colors.inkBlack,
    badge: colors.goldenMimikyuCream,
  },
  {
    name: 'suicuneTeal',
    background: colors.verdigrisTeal,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.fadedJadeGreen,
    gauge: colors.fadedJadeGreen,
    badge: colors.goldenMimikyuCream,
  },
  {
    name: 'mimikyuSepia',
    background: colors.mutedLilacSepia,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.rustRedAccent,
    gauge: typeColors.fighting?.bg || colors.inkBlack,
    badge: colors.goldenMimikyuCream,
  },
  {
    name: 'nightfallSlate',
    background: colors.nightfallSlate,
    frame: colors.inkBlack,
    ink: colors.goldenMimikyuCream,
    accent: colors.dustyCherryPink,
    gauge: colors.dustyCherryPink,
    badge: colors.inkBlack,
    }
];

const STAT_MAX = 180;
const STAT_SEGMENTS = 10;

const STAT_LABEL_KEYS: Array<{ key: keyof RetroPokemonStats; labelKey: string }> = [
  { key: 'hp', labelKey: 'hp' },
  { key: 'attack', labelKey: 'attack' },
  { key: 'defense', labelKey: 'defense' },
  { key: 'specialAttack', labelKey: 'specialAttack' },
  { key: 'specialDefense', labelKey: 'specialDefense' },
  { key: 'speed', labelKey: 'speed' },
];

function pickRandomScheme(excludeName?: string): ColorScheme {
  const candidates = COLOR_SCHEMES.filter((scheme) => scheme.name !== excludeName);
  const pool = candidates.length > 0 ? candidates : COLOR_SCHEMES;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function halftoneStyle(dotColor: string, size = 10, opacity = 0.25) {
  return {
    backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };
}

function gridStyle(lineColor: string) {
  return {
    backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
    backgroundSize: '14px 14px',
  };
}

export function RetroPokemonCard({
  pokemon,
  notes,
  notesLabel,
  notesPlaceholder,
  onNotesChange,
  onNotesBlur,
  onToggleCaught,
}: RetroPokemonCardProps) {
  const initialScheme = useMemo(() => pickRandomScheme(), []);
  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(initialScheme);
  const t = useTranslations('card');
  const tNote = useTranslations('note');

  const handleShuffleScheme = () => {
    setCurrentScheme((prev) => pickRandomScheme(prev.name));
  };

  const paddedId = String(pokemon.id).padStart(3, '0');

  return (
    <div className="relative w-full max-w-sm font-mono">
      {/* Offset drop shadow layer */}
      <div
        className="absolute inset-0 translate-x-2 translate-y-2 rounded"
        style={{ backgroundColor: colors.inkBlack }}
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded border-4 transition-colors duration-300"
        style={{ backgroundColor: currentScheme.background, borderColor: currentScheme.frame }}
      >
        <div className="pointer-events-none absolute inset-0" style={halftoneStyle(currentScheme.ink)} />

        {/* Top Header Section */}
        <div className="relative border-b-4 px-4 pb-3 pt-3" style={{ borderColor: currentScheme.frame }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded border-2 px-1.5 py-0.5 text-[10px] font-black tracking-widest shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                  style={{
                    borderColor: colors.inkBlack,
                    backgroundColor: colors.inkBlack,
                    color: colors.goldenMimikyuCream,
                  }}
                >
                  NO.{paddedId}
                </span>

                {pokemon.japaneseName && (
                  <span
                    className="text-[10px] font-bold tracking-widest opacity-80"
                    style={{ color: currentScheme.ink }}
                  >
                    {pokemon.japaneseName}
                  </span>
                )}
              </div>

              <h2
                className="mt-1 text-2xl font-black uppercase leading-none tracking-tight"
                style={{ color: currentScheme.ink }}
              >
                {pokemon.name}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShuffleScheme}
                title={t('shuffleColorScheme')}
                className="flex h-7 w-7 items-center justify-center rounded border-2 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  borderColor: colors.inkBlack,
                  backgroundColor: colors.goldenMimikyuCream,
                  color: colors.inkBlack,
                }}
              >
                <Shuffle size={12} />
              </button>

              {onToggleCaught && (
                <button
                  type="button"
                  onClick={onToggleCaught}
                  className="shrink-0 rounded border-2 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    borderColor: colors.inkBlack,
                    backgroundColor: pokemon.caught ? colors.inkBlack : colors.rustRedAccent,
                  }}
                >
                  {pokemon.caught ? t('release') : t('catch')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Artwork Area & Side Pokeball Accents */}
        <div className="relative flex gap-2 px-4 pt-3">
          <div
            className="relative flex h-40 flex-1 items-center justify-center overflow-hidden rounded border-4 shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
            style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
          >
            <div className="absolute inset-0 pointer-events-none" style={gridStyle(`${colors.inkBlack}22`)} />
            <div className="absolute inset-0 pointer-events-none" style={halftoneStyle(colors.inkBlack, 8, 0.1)} />
            <img
              src={pokemon.imageUrl}
              alt={pokemon.name}
              loading="lazy"
              className="relative z-10 h-32 w-32 object-contain drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
            />
          </div>

          {/* Vertical Pokéball Accents */}
          <div className="flex w-7 shrink-0 flex-col justify-between gap-1 py-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="relative aspect-square w-full overflow-hidden rounded-full border-2 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
              >
                <div className="h-1/2 w-full" style={{ backgroundColor: currentScheme.accent }} />
                <div className="h-1/2 w-full" style={{ backgroundColor: colors.goldenMimikyuCream }} />
                <div
                  className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                  style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Details & Base Stats Section */}
        <div className="relative space-y-3 px-4 py-4">
          {/* Dynamic Type Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {pokemon.types.map((type) => {
              const typeStyle = typeColors[type.toLowerCase()] ?? DEFAULT_TYPE_COLOR;
              return (
                <span
                  key={type}
                  className="rounded-full border-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                  style={{
                    borderColor: colors.inkBlack,
                    backgroundColor: typeStyle.bg,
                    color: typeStyle.text,
                  }}
                >
                  {type}
                </span>
              );
            })}
          </div>

          {/* Physical Specifications */}
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-1 rounded border-2 p-2 text-xs font-bold shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
            style={{
              borderColor: colors.inkBlack,
              color: colors.inkBlack,
              backgroundColor: colors.goldenMimikyuCream,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Ruler size={12} />
              <span>{pokemon.height.toFixed(1)} m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Weight size={12} />
              <span>{pokemon.weight.toFixed(1)} kg</span>
            </div>
            <div
              className="col-span-2 flex items-center gap-1.5 border-t pt-1"
              style={{ borderColor: `${colors.inkBlack}33` }}
            >
              <CalendarDays size={12} />
              <span style={pokemon.caught ? undefined : { color: `${colors.inkBlack}80` }}>
                {pokemon.caught && pokemon.caughtDate
                  ? `First added ${new Date(pokemon.caughtDate).toLocaleDateString()}`
                  : t('notAddedToPokedex')}
              </span>
            </div>
          </div>

          {/* Base Statistics Box */}
          <div
            className="rounded border-2 p-2.5 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
            style={{
              borderColor: colors.inkBlack,
              backgroundColor: colors.goldenMimikyuCream,
            }}
          >
            <div className="space-y-1.5">
              {STAT_LABEL_KEYS.map(({ key, labelKey }) => {
                const value = pokemon.stats[key];
                const filledSegments = Math.round(
                  (Math.min(STAT_MAX, value) / STAT_MAX) * STAT_SEGMENTS,
                );
                return (
                  <div key={key} className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="w-14 shrink-0 font-black" style={{ color: colors.inkBlack }}>
                      {t(`statAbbr.${labelKey}`)}
                    </span>
                    <div className="flex flex-1 gap-0.5">
                      {Array.from({ length: STAT_SEGMENTS }, (_, index) => (
                        <div
                          key={index}
                          className="h-3 flex-1 rounded-[1px] border"
                          style={{
                            borderColor: colors.inkBlack,
                            backgroundColor: index < filledSegments ? currentScheme.gauge : '#FFFFFF',
                          }}
                        />
                      ))}
                    </div>
                    <span className="w-7 shrink-0 text-right font-black" style={{ color: colors.inkBlack }}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solid Cream Trainer Notes Box */}
          {onNotesChange && (
            <div
              className="rounded border-2 border-dashed p-2.5 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
              style={{
                borderColor: colors.inkBlack,
                backgroundColor: colors.goldenMimikyuCream,
              }}
            >
              <div className="mb-1 flex items-center gap-1">
                <FileText size={12} style={{ color: colors.inkBlack }} />
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: colors.inkBlack }}
                >
                  {notesLabel ?? tNote('label')}
                </span>
              </div>
              <textarea
                aria-label={notesLabel ?? tNote('label')}
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                onBlur={onNotesBlur}
                rows={2}
                placeholder={notesPlaceholder ?? tNote('placeholder')}
                className="w-full resize-none bg-transparent text-xs font-bold leading-relaxed text-[#241F1A] placeholder-[#241F1A]/50 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}