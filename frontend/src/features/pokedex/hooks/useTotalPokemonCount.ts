import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pokedex.totalPokemonCount';

function readPersisted(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : null;
    return parsed && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The API total reflects the full Pokédex size (not just loaded pages). Persist it so the
 * overview can show the real total immediately on future visits, even before the list refetches.
 * @param apiTotal The total from the latest list response, if any has resolved yet.
 * @returns The best known total: fresh API value, else the last persisted value, else 0.
 */
export function useTotalPokemonCount(apiTotal: number | undefined): number {
  const [persisted, setPersisted] = useState<number | null>(() => readPersisted());

  useEffect(() => {
    if (!apiTotal) return;
    setPersisted((current) => (current === apiTotal ? current : apiTotal));
    try {
      localStorage.setItem(STORAGE_KEY, String(apiTotal));
    } catch {
      // ignore persistence failures (e.g. private browsing)
    }
  }, [apiTotal]);

  return apiTotal ?? persisted ?? 0;
}
