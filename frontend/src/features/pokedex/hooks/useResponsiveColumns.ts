import { useEffect, useState } from 'react';

// Mirrors the Tailwind breakpoints used by PokemonGrid's responsive column classes.
const BREAKPOINTS: Array<{ minWidth: number; columns: number }> = [
  { minWidth: 768, columns: 4 }, // md
  { minWidth: 640, columns: 3 }, // sm
  { minWidth: 0, columns: 2 },
];

function getColumnCount(width: number): number {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth)?.columns ?? 2;
}

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
