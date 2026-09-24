import { useSyncExternalStore } from 'react';

// Lets SharedDeckPage publish the trainer's deck title so TopBar can show a nav link to it.
let title: string | null = null;
const listeners = new Set<() => void>();

export function setSharedDeckTitle(next: string | null) {
  title = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedDeckTitle() {
  return useSyncExternalStore(subscribe, () => title);
}
