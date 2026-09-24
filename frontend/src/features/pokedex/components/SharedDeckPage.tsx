import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deckShareApi, type SharedDeck } from '../api/deck-share.api.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';

export function SharedDeckPage() {
  const { key = '' } = useParams<{ key: string }>();
  const t = useTranslations('deckShare');
  const [deck, setDeck] = useState<SharedDeck | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setDeck(null);
    setError('');
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

  if (error)
    return (
      <p role="alert" className="rounded border-4 border-[#241F1A] bg-[#F4EBE1] p-6 font-bold">
        {t('loadError')}
      </p>
    );
  if (!deck) return <p className="p-6 font-bold">{t('loading')}</p>;

  return (
    <div className="mx-auto max-w-6xl p-4 font-mono text-[#241F1A]">
      <div className="mb-6 rounded-lg border-4 border-[#241F1A] bg-[#E8AEEC]/30 p-5 shadow-[4px_4px_0px_0px_#241F1A]">
        <h2 className="text-2xl font-black">{deck.title}</h2>
        <p className="mt-1 text-sm font-bold">{t('count', { count: deck.pokemon.length })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {deck.pokemon.map((pokemon) => (
          <div
            key={pokemon.id}
            className="rounded-lg border-4 border-[#241F1A] bg-[#FFFACF] p-4 text-center shadow-[4px_4px_0px_0px_#241F1A]"
          >
            <span className="text-xs font-black">#{String(pokemon.id).padStart(3, '0')}</span>
            {pokemon.sprite && (
              <img
                src={pokemon.sprite}
                alt=""
                loading="lazy"
                className="mx-auto h-32 w-32 object-contain"
              />
            )}
            <h3 className="mt-2 text-sm font-black uppercase">{pokemon.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
