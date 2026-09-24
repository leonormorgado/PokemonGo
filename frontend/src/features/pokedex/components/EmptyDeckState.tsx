import { useTranslations } from '../../../shared/hooks/useTranslations.js';

// Small retro pixel-art pokéball built from divs to match the app's neubrutalist aesthetic.
// Sizes are computed from a single `size` prop so the band, hinge and button stay in
// proportion at every scale (fixed Tailwind sizing classes don't shrink together).
function PixelPokeball({ size, className = '' }: { size: number; className?: string }) {
  const border = Math.max(2, Math.round(size * 0.07));
  const buttonSize = Math.round(size * 0.32);
  return (
    <div
      className={`relative overflow-hidden rounded-full border-[#241F1A] bg-white shadow-[3px_3px_0px_0px_#241F1A] ${className}`}
      style={{ width: size, height: size, borderWidth: border }}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[#DE623C]" />
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#241F1A]"
        style={{ height: Math.max(2, Math.round(size * 0.06)) }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[#241F1A] bg-white"
        style={{ width: buttonSize, height: buttonSize, borderWidth: border }}
      />
    </div>
  );
}

export function EmptyDeckState({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  const t = useTranslations('emptyDeck');

  return (
    <div
      data-testid="empty-deck-state"
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-[#241F1A] bg-[#F4EBE1] p-10 text-center shadow-[4px_4px_0px_0px_#241F1A]"
    >
      <div className="flex items-end gap-3">
        <PixelPokeball size={44} className="translate-y-2 opacity-70" />
        <PixelPokeball size={64} className="animate-bounce" />
        <PixelPokeball size={44} className="translate-y-2 opacity-85" />
      </div>
      <p className="text-sm font-black uppercase tracking-wider text-[#241F1A]">{title ?? t('title')}</p>
      <p className="max-w-xs text-xs font-bold text-[#241F1A]/70">{subtitle ?? t('subtitle')}</p>
    </div>
  );

}
