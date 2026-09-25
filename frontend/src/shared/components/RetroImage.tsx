import { useEffect, useState, type ImgHTMLAttributes } from 'react';

type RetroImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
};

// Drop-in <img> replacement that shows a retro "NO SIGNAL" placeholder instead of a broken
// image icon when the source is missing or fails to load (e.g. offline with no cached asset).
export function RetroImage({ src, alt, className = '', onError, ...props }: RetroImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt || 'Image offline'}
        title="Image offline"
        className={`relative flex items-center justify-center overflow-hidden border-2 border-[#241F1A] bg-[#241F1A] text-[#FFFACF] ${className}`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 2px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '3px 3px',
          }}
        />
        <span className="relative z-10 animate-pulse text-[10px] font-black uppercase tracking-widest">
          No Signal
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
