import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/components/Modal.js';
import { usePokemonDetail } from '../hooks/usePokemonDetail.js';
import { RetroPokemonCard } from './RetroPokemonCard.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';
import { sharePokemonCard } from '../strategies/export/share.js';
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
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    setNotes(entry.notes);
  }, [entry.notes]);

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = setTimeout(() => setShareStatus(null), 2000);
    return () => clearTimeout(timeout);
  }, [shareStatus]);

  const handleShare = async () => {
    const { method } = await sharePokemonCard(entry);
    setShareStatus(method === 'share' ? t('shareStatus.shared') : t('shareStatus.copied'));
  };

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
        contentClassName="max-h-[92vh] w-full max-w-sm overflow-auto bg-transparent p-0 shadow-none border-none"
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
              onShare={() => void handleShare()}
              shareLabel={shareStatus ?? t('share')}
            />
          </div>
        )}
      </Modal>
    </>
  );
}