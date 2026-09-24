import { Link, useLocation } from 'react-router-dom';
import i18n from '../i18n/i18n.js';
import { useTranslations } from '../hooks/useTranslations.js';
import { useSharedDeckTitle } from '../lib/shared-deck-title.store.js';

const LANGUAGES = ['en', 'pt'] as const;

export function TopBar() {
  const t = useTranslations('topBar');
  const tApp = useTranslations('app');
  const location = useLocation();
  const isDeckPage = location.pathname === '/deck';
  const currentLanguage = i18n.language.slice(0, 2);
  const sharedDeckTitle = useSharedDeckTitle();

  const toggleLanguage = () => {
    const next = LANGUAGES.find((lang) => lang !== currentLanguage) ?? LANGUAGES[0];
    void i18n.changeLanguage(next);
  };

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[#241F1A]">
      {/* App Title */}
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="flex h-8 w-8 items-center justify-center rounded border-2 border-[#241F1A] bg-[#C98A4D] font-black text-[#241F1A] shadow-[2px_2px_0px_0px_#241F1A]"
        >
          ★
        </Link>
        <h1 className="text-xl font-black uppercase tracking-wider text-[#241F1A] sm:text-2xl">
          {tApp('title')}
        </h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <nav
          aria-label={t('primaryNav')}
          className="flex items-center rounded border-2 border-[#241F1A] bg-white p-1 shadow-[3px_3px_0px_0px_#241F1A]"
        >
          <Link
            to="/"
            aria-current={!isDeckPage && !sharedDeckTitle ? 'page' : undefined}
            className={`rounded px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
              !isDeckPage && !sharedDeckTitle
                ? 'bg-[#241F1A] text-white'
                : 'text-[#241F1A] hover:bg-gray-100'
            }`}
          >
            {t('allPokemon')}
          </Link>
          <Link
            to="/deck"
            aria-current={isDeckPage && !sharedDeckTitle ? 'page' : undefined}
            className={`rounded px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
              isDeckPage && !sharedDeckTitle
                ? 'bg-[#241F1A] text-white'
                : 'text-[#241F1A] hover:bg-gray-100'
            }`}
          >
            {t('myDeck')}
          </Link>
          {sharedDeckTitle && (
            <Link
              to={location.pathname}
              aria-current="page"
              className="rounded bg-[#241F1A] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white transition-colors"
            >
              {sharedDeckTitle}
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center rounded border-2 border-[#241F1A] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#241F1A] shadow-[3px_3px_0px_0px_#241F1A] transition-all hover:bg-[#F4EBE1] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
        >
          {t('switchLanguage', { language: currentLanguage.toUpperCase() })}
        </button>
      </div>
    </header>
  );
}