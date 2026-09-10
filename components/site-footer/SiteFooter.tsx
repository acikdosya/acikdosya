import {useTranslations} from 'next-intl';
import {LocaleSwitcher} from '@/components/locale-switcher/LocaleSwitcher';

/**
 * Bagimsizlik ibaresi her sayfada bulunur — CLAUDE.md §5.5.
 */
export function SiteFooter() {
  const t = useTranslations('Footer');

  return (
    <footer className="mt-4 border-t border-rule pt-9 pb-16 text-ink-2">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <strong className="mb-1.5 block text-xs font-semibold text-ink">
            {t('heading')}
          </strong>
          <p className="max-w-[62ch] text-sm">{t('body')}</p>
        </div>
        <div className="text-sm">
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
