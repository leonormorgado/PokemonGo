import { useEffect, useState } from 'react';

// Mirrors the Tailwind breakpoints used by PokemonGrid's responsive column classes
// (grid-cols-1 sm:grid-cols-2 md:grid-cols-3). Must stay in sync with COLUMN_CLASSES.
const BREAKPOINTS: Array<{ minWidth: number; columns: number }> = [
  { minWidth: 768, columns: 3 }, // md
  { minWidth: 640, columns: 2 }, // sm
  { minWidth: 0, columns: 1 },
];

function getColumnCount(width: number): number {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth)?.columns ?? 1;
}

/**
 * Mirrors the Tailwind breakpoints used by `PokemonGrid`'s responsive column classes
 * (grid-cols-1 sm:grid-cols-2 md:grid-cols-3). Must stay in sync with COLUMN_CLASSES.
 * Needed because the virtualizer computes row heights in JS and must know the exact
 * column count — it can't just read the CSS grid classes at runtime.
 */
export function useResponsiveColumns(): number {
  const [columns, setColumns] = useState(() =>
    getColumnCount(typeof window === 'undefined' ? 0 : window.innerWidth),
  );

  useEffect(() => {
    const handleResize = () => setColumns(getColumnCount(window.innerWidth));
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
}
