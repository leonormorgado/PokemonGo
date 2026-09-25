import { useState } from 'react';

type OfflineImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  onLoad?: () => void;
};

/** Image with a Game Boy style fallback for missing or offline sprites. */
export function OfflineImage({ src, alt, className = '', onLoad }: OfflineImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  if (showFallback) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt} image unavailable` : 'Image unavailable'}
        className={`mx-auto flex aspect-[3/4] max-h-full w-auto max-w-full flex-col items-center justify-center gap-1.5 rounded-[18%] border-[3px] border-dashed border-[#241F1A]/65 bg-[#B7C99B] p-[7%] text-[#34432D] shadow-[inset_2px_2px_0_rgba(255,250,207,0.65),2px_2px_0_rgba(36,31,26,0.2)] ${className}`}
      >
        <span className="w-full rounded-[3px] border-2 border-[#34432D]/80 bg-[#D8E3BE] p-[8%] shadow-[inset_1px_1px_0_rgba(52,67,45,0.16)]">
          <svg viewBox="0 0 32 24" shapeRendering="crispEdges" aria-hidden="true" className="block w-full">
            <path fill="#34432D" d="M2 6h4V3h4V1h4v4h4V3h4V1h4v2h4v3h2v14h-2v2H2v-2H0V8h2zm3 2v10h22V8h-4v3h-4V8h-6v3h-4V8z" />
            <path fill="#7C9466" d="M6 9h4v3h4V9h4v3h4V9h4v8H6z" />
            <path fill="#34432D" d="M9 12h2v2H9zm12 0h2v2h-2zM13 15h6v1h-6z" />
            <path fill="#B7C99B" d="M14 19h4v1h-4z" />
          </svg>
        </span>
        <span aria-hidden="true" className="flex gap-1">
          <i className="h-1 w-1 bg-[#34432D]/65" />
          <i className="h-1 w-1 bg-[#34432D]/35" />
          <i className="h-1 w-1 bg-[#34432D]/65" />
        </span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={onLoad}
      onError={() => {
        setFailedSrc(src);
        onLoad?.();
      }}
    />
  );
}
