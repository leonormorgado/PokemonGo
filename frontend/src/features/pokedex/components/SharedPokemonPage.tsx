import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shuffle, Ruler, Weight, BadgeCheck, Sparkles } from 'lucide-react';
import { usePokemonDetail } from '../hooks/usePokemonDetail.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { RetroLoader } from '../../../shared/components/RetroLoader.js';
import { setSharedDeckTitle } from '../../../shared/lib/shared-deck-title.store.js';
import { colors, typeColors, DEFAULT_TYPE_COLOR } from '../../../shared/styles/colors.js';
import type { PokemonStats } from '../domain/pokemon.types.js';

interface ColorScheme {
  name: string;
  background: string;
  frame: string;
  ink: string;
  accent: string;
  gauge: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'cherryBlossom',
    background: colors.dustyCherryPink,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.rustRedAccent,
    gauge: typeColors.fighting?.bg || colors.inkBlack,
  },
  {
    name: 'suicuneTeal',
    background: colors.verdigrisTeal,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.fadedJadeGreen,
    gauge: colors.fadedJadeGreen,
  },
  {
    name: 'mimikyuSepia',
    background: colors.mutedLilacSepia,
    frame: colors.inkBlack,
    ink: colors.inkBlack,
    accent: colors.rustRedAccent,
    gauge: typeColors.fighting?.bg || colors.inkBlack,
  },
  {
    name: 'nightfallSlate',
    background: colors.nightfallSlate,
    frame: colors.inkBlack,
    ink: colors.goldenMimikyuCream,
    accent: colors.dustyCherryPink,
    gauge: colors.dustyCherryPink,
  },
];

const STAT_MAX = 180;

const STAT_KEYS: Array<keyof PokemonStats> = [
  'hp',
  'attack',
  'defense',
  'specialAttack',
  'specialDefense',
  'speed',
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

// Public, read-only "Trading Card + Stats Showcase" display for the /share/pokemon/:id link.
export function SharedPokemonPage() {
  const { id = '' } = useParams<{ id: string }>();
  const t = useTranslations('sharedPokemon');
  const tCard = useTranslations('card');
  const tDetail = useTranslations('detail');
  const numericId = Number(id);
  const lookupId = Number.isFinite(numericId) && numericId > 0 ? String(numericId) : null;
  const { data: detail, isLoading, isError } = usePokemonDetail(lookupId);

  const initialScheme = useMemo(() => pickRandomScheme(), []);
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);
  const [animateStats, setAnimateStats] = useState(false);

  // Temporary: show the shared Pokémon's name as a nav badge in the top bar.
  useEffect(() => {
    setSharedDeckTitle(detail?.name ?? null);
    return () => setSharedDeckTitle(null);
  }, [detail]);

  useEffect(() => {
    setAnimateStats(false);
    const frame = requestAnimationFrame(() => setAnimateStats(true));
    return () => cancelAnimationFrame(frame);
  }, [detail]);

  if (isError || !lookupId)
    return (
      <p role="alert" className="rounded border-4 border-[#241F1A] bg-[#F4EBE1] p-6 font-bold">
        {t('notFound')}
      </p>
    );

  if (isLoading || !detail)
    return (
      <div className="relative min-h-[50vh]">
        <RetroLoader label={t('loading')} testId="shared-pokemon-loader" />
      </div>
    );

  const paddedId = String(detail.id).padStart(3, '0');
  const height = detail.height / 10;
  const weight = detail.weight / 10;
  const totalStats = STAT_KEYS.reduce((sum, key) => sum + detail.stats[key], 0);

  return (
    <div className="relative mx-auto w-full max-w-5xl font-mono">
        {/* Unified outer canvas: one shadow + frame tying the card and stats together */}
        <div
          className="absolute inset-0 translate-x-3 translate-y-3 rounded"
          style={{ backgroundColor: colors.inkBlack }}
          aria-hidden
        />
        <div
          className="relative overflow-hidden rounded border-4 p-5 shadow-[4px_4px_0_rgba(0,0,0,0.3)] sm:p-8"
          style={{ backgroundColor: colors.goldenMimikyuCream, borderColor: colors.inkBlack }}
        >
          <div className="pointer-events-none absolute inset-0" style={halftoneStyle(colors.inkBlack, 10, 0.08)} />

          <div className="relative grid gap-5 md:grid-cols-12 md:gap-8">
            {/* Left Column: Card Showcase */}
            <div className="md:col-span-5">
              <div
                className="overflow-hidden rounded border-4 transition-colors duration-300"
                style={{ borderColor: colors.inkBlack, backgroundColor: scheme.background }}
              >
                <div className="flex items-start justify-between gap-2 border-b-4 px-5 pb-4 pt-4" style={{ borderColor: colors.inkBlack }}>
                  <div>
                    <span
                      className="rounded border-2 px-2 py-0.5 text-xs font-black tracking-widest shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                      style={{
                        borderColor: colors.inkBlack,
                        backgroundColor: colors.inkBlack,
                        color: colors.goldenMimikyuCream,
                      }}
                    >
                      NO.{paddedId}
                    </span>
                    <h1
                      className="mt-1.5 text-3xl font-black uppercase leading-none tracking-tight"
                      style={{ color: scheme.ink }}
                    >
                      {detail.name}
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScheme((prev) => pickRandomScheme(prev.name))}
                    title={tCard('shuffleColorScheme')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                    style={{
                      borderColor: colors.inkBlack,
                      backgroundColor: colors.goldenMimikyuCream,
                      color: colors.inkBlack,
                    }}
                  >
                    <Shuffle size={16} />
                  </button>
                </div>

                <div className="px-5 pt-4">
                  <div
                    className="relative flex h-64 items-center justify-center overflow-hidden rounded border-4 shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
                    style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={gridStyle(`${colors.inkBlack}22`)} />
                    <div className="absolute inset-0 pointer-events-none" style={halftoneStyle(colors.inkBlack, 8, 0.1)} />
                    {detail.sprite && (
                      <img
                        src={detail.sprite}
                        alt={detail.name}
                        className="relative z-10 h-52 w-52 object-contain drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {detail.types.map((type) => {
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

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span
                      className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                      style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream, color: colors.inkBlack }}
                    >
                      <Ruler size={12} />
                      {height.toFixed(1)} m
                    </span>
                    <span
                      className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                      style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream, color: colors.inkBlack }}
                    >
                      <Weight size={12} />
                      {weight.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Data Showcase */}
            <div className="flex flex-col gap-4 md:col-span-7">
              {/* Read-only status stamp, in place of a personal caught date */}
              <div
                className="flex items-center gap-2 rounded border-4 px-5 py-3.5 shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
                style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
              >
                <BadgeCheck size={18} style={{ color: colors.inkBlack }} />
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: colors.inkBlack }}>
                  {t('publicCardBadge')}
                </span>
              </div>

              {/* Base Stats */}
              <div
                className="rounded border-4 px-5 py-4"
                style={{ borderColor: colors.inkBlack, backgroundColor: colors.goldenMimikyuCream }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: colors.inkBlack }}>
                    {tDetail('baseStats')}
                  </h3>
                  <span className="text-sm font-black uppercase tracking-widest" style={{ color: colors.inkBlack }}>
                    {t('total')} {totalStats}
                  </span>
                </div>
                <div className="space-y-3">
                  {STAT_KEYS.map((key) => {
                    const value = detail.stats[key];
                    const percent = Math.min(100, (value / STAT_MAX) * 100);
                    return (
                      <div key={key} className="flex items-center gap-3 text-xs font-bold" style={{ color: colors.inkBlack }}>
                        <span className="w-20 shrink-0 font-black">{tDetail(`stats.${key}`)}</span>
                        <div className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-[#241F1A] bg-white">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: animateStats ? `${percent}%` : '0%',
                              backgroundColor: scheme.gauge,
                            }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right font-black">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decorative filler: a retro collector's stamp, taking the place of the (now removed) notes box */}
              <div
                className="relative flex flex-1 min-h-[7rem] items-center justify-center overflow-hidden rounded border-4 border-dashed"
                style={{
                  borderColor: colors.inkBlack,
                  backgroundColor: colors.goldenMimikyuCream,
                }}
              >
                <div className="pointer-events-none absolute inset-0" style={halftoneStyle(colors.inkBlack, 10, 0.12)} />
                <div
                  className="relative flex -rotate-6 items-center gap-2 rounded-full border-4 px-5 py-2 shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
                  style={{ borderColor: scheme.accent, color: scheme.accent }}
                >
                  <Sparkles size={16} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{t('collectorsCard')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

