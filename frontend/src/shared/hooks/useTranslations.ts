import { useTranslation } from 'react-i18next';

/**
 * next-intl-style API on top of react-i18next: `useTranslations('namespace')` returns a scoped
 * `t()`. Kept as a thin wrapper (rather than switching to next-intl) since next-intl requires
 * the Next.js App Router and this is a plain Vite SPA — see DECISIONS.md (ADR-005).
 */
export function useTranslations(namespace?: string) {
  const { t } = useTranslation();
  return (key: string, values?: Record<string, string | number>) =>
    t(namespace ? `${namespace}.${key}` : key, values);
}
