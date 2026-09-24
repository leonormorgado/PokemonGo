import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deckShareApi, type SharedDeck } from '../api/deck-share.api.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { setSharedDeckTitle } from '../../../shared/lib/shared-deck-title.store.js';
import { RetroLoader } from '../../../shared/components/RetroLoader.js';

const PAGE_SIZE = 24;

function SpriteLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 animate-bounce rounded-sm bg-[#241F1A]/30"
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </div>
  );
}

function SharedPokemonSprite({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative mx-auto h-32 w-32">
      {!loaded && <SpriteLoader />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`h-32 w-32 object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export function SharedDeckPage() {
  const { key = '' } = useParams<{ key: string }>();
  const t = useTranslations('deckShare');
  const [deck, setDeck] = useState<SharedDeck | null>(null);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    setDeck(null);
    setError('');
    setVisibleCount(PAGE_SIZE);
    void deckShareApi.get(key).then(
      (result) => {
        if (active) setDeck(result);
      },
      () => {
        if (active) setError('load');
      },
    );
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    setSharedDeckTitle(deck?.title ?? null);
    return () => setSharedDeckTitle(null);
  }, [deck]);

  if (error)
    return (
      <p role="alert" className="rounded border-4 border-[#241F1A] bg-[#F4EBE1] p-6 font-bold">
        {t('loadError')}
      </p>
    );
  if (!deck)
    return (
      <div className="relative min-h-[50vh]">
        <RetroLoader label={t('loading')} testId="shared-deck-loader" />
      </div>
    );

  const visiblePokemon = deck.pokemon.slice(0, visibleCount);
  const hasMore = visibleCount < deck.pokemon.length;

  return (
    <div className="mx-auto max-w-6xl p-4 font-mono text-[#241F1A]">
      <div className="mb-6 rounded-lg border-4 border-[#241F1A] bg-[#E8AEEC]/30 p-5 shadow-[4px_4px_0px_0px_#241F1A]">
        <h2 className="text-2xl font-black">{deck.title}</h2>
        <p className="mt-1 text-sm font-bold">{t('count', { count: deck.pokemon.length })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visiblePokemon.map((pokemon) => (
          <div
            key={pokemon.id}
            className="rounded-lg border-4 border-[#241F1A] bg-[#FFFACF] p-4 text-center shadow-[4px_4px_0px_0px_#241F1A]"
          >
            <span className="text-xs font-black">#{String(pokemon.id).padStart(3, '0')}</span>
            {pokemon.sprite && <SharedPokemonSprite src={pokemon.sprite} alt="" />}
            <h3 className="mt-2 text-sm font-black uppercase">{pokemon.name}</h3>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#241F1A]/70">
            {t('loadMoreCount', { count: visiblePokemon.length, total: deck.pokemon.length })}
          </span>
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-md border-2 border-[#241F1A] bg-[#DE623C] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#241F1A] transition-colors hover:bg-[#c9522e] active:translate-x-0.5 active:translate-y-0.5"
          >
            {t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
