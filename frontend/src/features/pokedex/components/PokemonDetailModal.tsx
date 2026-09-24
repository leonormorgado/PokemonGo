import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/components/Modal.js';
import { usePokemonDetail } from '../hooks/usePokemonDetail.js';
import { RetroPokemonCard } from './RetroPokemonCard.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { ShareDeckModal } from './ShareDeckModal.js';
import type { CatalogEntry } from '../domain/pokemon.types.js';

interface PokemonDetailModalProps {
  entry: CatalogEntry;
  onClose: () => void;
  onSaveNote: (pokemonId: number, notes: string) => void;
  onToggleCaught?: (entry: CatalogEntry) => void;
}

export function PokemonDetailModal({ entry, onClose, onSaveNote, onToggleCaught }: PokemonDetailModalProps) {
  const t = useTranslations('detail');
  const tNote = useTranslations('note');
  const tCommon = useTranslations('common');
  const { data: detail, isLoading } = usePokemonDetail(entry.name);
  const [notes, setNotes] = useState(entry.notes);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    setNotes(entry.notes);
  }, [entry.notes]);

  const handleBlur = () => {
    if (notes !== entry.notes) {
      onSaveNote(entry.id, notes);
    }
  };

  return (
    <>
      <Modal
        titleId="pokemon-detail-title"
        title={entry.name}
        onClose={onClose}
        contentClassName="hide-scrollbar max-h-[92vh] w-full max-w-sm overflow-x-hidden overflow-y-auto border-none bg-transparent pb-2 pr-2 shadow-none"
        headerClassName="sr-only"
        titleClassName="sr-only"
        closeLabel={tCommon('close')}
      >
        {isLoading || !detail ? (
          <div className="rounded border-4 border-black bg-[#f4ebe1] p-6 text-center font-mono font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {t('loading')}
          </div>
        ) : (
          <div className="space-y-2.5 font-mono">
            {/* Top Integrated Control Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label={tCommon('close')}
                className="rounded border-2 border-[#2d221e] bg-[#2d221e] px-3 py-1 text-xs font-black uppercase text-white hover:opacity-90 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-0.5 active:translate-y-0.5"
              >
                ✕ {tCommon('close')}
              </button>
            </div>

            {/* Retro Card Component */}
            <RetroPokemonCard
              pokemon={{
                id: entry.id,
                name: detail.name,
                types: detail.types,
                height: detail.height / 10,
                weight: detail.weight / 10,
                stats: detail.stats,
                caught: entry.caught,
                caughtDate: entry.caughtAt,
                imageUrl: detail.sprite ?? '',
              }}
              notes={notes}
              notesLabel={t('notes')}
              notesPlaceholder={tNote('placeholder')}
              onNotesChange={setNotes}
              onNotesBlur={handleBlur}
              onToggleCaught={onToggleCaught ? () => onToggleCaught(entry) : undefined}
              onShare={() => setShowShare(true)}
              shareLabel={t('share')}
            />
          </div>
        )}
      </Modal>
      {showShare && (
        <ShareDeckModal
          variant="pokemon"
          pokemonId={entry.id}
          pokemonName={entry.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
