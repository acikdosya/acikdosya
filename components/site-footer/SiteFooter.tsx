import {useTranslations} from 'next-intl';
import {BrandMark} from '@/components/brand/BrandMark';
import {Link} from '@/i18n/navigation';
import {BRAND_NAME} from '@/lib/brand';
import {MAP_SOURCES} from '@/lib/config';
import styles from './SiteFooter.module.css';

/**
 * Bagimsizlik ibaresi her sayfada bulunur — CLAUDE.md §5.5.
 * Harita kaynaklari lib/config.ts'teki MAP_SOURCES'tan geliyor; ayni dizi
 * haritanin kendi atif kontrolunu de besliyor, ikisi ayrisamaz.
 */
export function SiteFooter() {
  const t = useTranslations('Footer');
  const tNav = useTranslations('Nav');

  return (
    <footer className={styles.footer}>
      <div className={styles.mark}>
        <BrandMark size={32} label={BRAND_NAME} />
      </div>

      <div className={styles.body}>
        <strong className={styles.heading}>{t('heading')}</strong>
        <p className={styles.text}>{t('body')}</p>

        <p className={styles.attribution}>
          {t('mapData')}:{' '}
          {MAP_SOURCES.map((source, index) => (
            <span key={source.label}>
              {index > 0 ? ' · ' : null}
              {source.url ? (
                <a href={source.url} rel="nofollow noopener">
                  {source.label}
                </a>
              ) : (
                source.label
              )}
            </span>
          ))}
        </p>
      </div>

      <nav className={styles.links} aria-label={t('links')}>
        <Link href="/yontem" className={styles.link}>
          {tNav('method')}
        </Link>
        <Link href="/hakkinda" className={styles.link}>
          {tNav('about')}
        </Link>
      </nav>
    </footer>
  );
}
