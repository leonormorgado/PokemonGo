import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { usePwaStatus } from '../hooks/usePwaStatus.js';
import { useTranslations } from '../../../shared/hooks/useTranslations.js';

// Surfaces network state and service-worker status so users know when they're viewing cached data.
export function OfflineStatusBanner() {
  const t = useTranslations('offline');
  const isOnline = useOnlineStatus();
  const { offlineReady, needRefresh, updateServiceWorker, dismiss } = usePwaStatus();

  return (
    <div className="space-y-2">
      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-2 rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-800"
        >
          <WifiOff size={16} /> {t('offlineMode')}
        </div>
      )}

      {isOnline && offlineReady && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {t('readyOffline')}
          </span>
          <button type="button" onClick={dismiss} className="text-xs underline">
            {t('dismiss')}
          </button>
        </div>
      )}

      {needRefresh && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800"
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={16} /> {t('newVersion')}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void updateServiceWorker()}
              className="rounded bg-blue-700 px-2 py-1 text-xs text-white"
            >
              {t('reload')}
            </button>
            <button type="button" onClick={dismiss} className="text-xs underline">
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
