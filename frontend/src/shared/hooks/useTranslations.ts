import { useTranslation } from 'react-i18next';

// next-intl-style API on top of react-i18next: useTranslations('namespace') returns a scoped t().
export function useTranslations(namespace?: string) {
  const { t } = useTranslation();
  return (key: string, values?: Record<string, string | number>) =>
    t(namespace ? `${namespace}.${key}` : key, values);
}
