import { useRegisterSW } from 'virtual:pwa-register/react';

export interface PwaStatus {
  offlineReady: boolean;
  needRefresh: boolean;
  updateServiceWorker: () => Promise<void>;
  dismiss: () => void;
}

// Wraps vite-plugin-pwa's registration hook: tracks offline-ready caching and available updates.
export function usePwaStatus(): PwaStatus {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.error('Service worker registration failed', error),
  });

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker: () => updateServiceWorker(true),
    dismiss: () => {
      setOfflineReady(false);
      setNeedRefresh(false);
    },
  };
}
