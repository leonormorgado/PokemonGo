import { useEffect, useState } from 'react';

/**
 * Delays propagating `value` until it's been stable for `delayMs`, so callers (e.g. search
 * input filtering) don't re-run expensive work on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
