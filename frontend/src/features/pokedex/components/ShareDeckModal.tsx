import { useState, type FormEvent } from 'react';
import { Modal } from '../../../shared/components/Modal.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { deckShareApi } from '../api/deck-share.api.js';
import { shareDeck } from '../strategies/export/share.js';

type ShareDeckModalProps =
  | { variant?: 'deck'; pokemonIds: number[]; onClose: () => void }
  | { variant: 'pokemon'; pokemonId: number; pokemonName: string; onClose: () => void };

export function ShareDeckModal(props: ShareDeckModalProps) {
  const { onClose } = props;
  const isPokemonShare = props.variant === 'pokemon';
  const t = useTranslations(isPokemonShare ? 'pokemonShare' : 'deckShare');
  const common = useTranslations('common');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState(
    isPokemonShare
      ? `${window.location.origin}/share/pokemon/${String(props.pokemonId).padStart(3, '0')}`
      : '',
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (props.variant === 'pokemon') return;
    setBusy(true);
    setStatus('');
    try {
      const deck = await deckShareApi.create(title.trim(), props.pokemonIds);
      setUrl(`${window.location.origin}/deck/${deck.key}`);
    } catch {
      setStatus(t('createError'));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t('copied'));
    } catch {
      setStatus(t('copyError'));
    }
  };

  const share = async () => {
    try {
      const result = await shareDeck(url, props.variant === 'pokemon' ? props.pokemonName : title.trim());
      setStatus(result.method === 'share' ? t('shared') : t('copied'));
    } catch {
      setStatus(t('copyError'));
    }
  };

  return (
    <Modal
      titleId="share-deck-title"
      title={t('heading')}
      onClose={onClose}
      closeLabel={common('close')}
      contentClassName="w-full max-w-md rounded-lg border-4 border-[#241F1A] bg-[#F4EBE1] p-5 shadow-[4px_4px_0px_0px_#241F1A]"
    >
      {props.variant !== 'pokemon' && !url ? (
        <form onSubmit={(event) => void create(event)} className="space-y-4">
          <label className="block text-sm font-bold" htmlFor="deck-share-name">
            {t('titleLabel')}
          </label>
          <input
            id="deck-share-name"
            autoFocus
            required
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full rounded border-2 border-[#241F1A] bg-white p-2 text-sm"
          />
          <p className="text-xs">{t('count', { count: props.pokemonIds.length })}</p>
          <button
            type="submit"
            disabled={busy || !title.trim() || props.pokemonIds.length === 0}
            className="rounded border-2 border-[#241F1A] bg-[#DE623C] px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
          >
            {busy ? t('creating') : t('create')}
          </button>
        </form>
      ) : (
        <div className="space-y-3 text-center">
          <p className="text-xs font-bold">{t('ready')}</p>
          <input
            readOnly
            aria-label={t('linkLabel')}
            value={url}
            onFocus={(event) => event.target.select()}
            className="w-full rounded border-2 border-[#241F1A] bg-white p-2 text-center text-xs"
          />
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded border-2 border-[#241F1A] bg-white px-4 py-2 text-xs font-black uppercase"
            >
              {t('copy')}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="rounded border-2 border-[#241F1A] bg-[#DE623C] px-4 py-2 text-xs font-black uppercase text-white"
            >
              {t('share')}
            </button>
          </div>
        </div>
      )}
      {status && (
        <p role="status" className="mt-3 text-xs font-bold">
          {status}
        </p>
      )}
    </Modal>
  );
}
