import {useLocale, useTranslations} from 'next-intl';
import {BrandLockup} from '@/components/brand/BrandLockup';
import {LocaleSwitcher} from '@/components/locale-switcher/LocaleSwitcher';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import styles from './SiteHeader.module.css';

/*
 * Gezinme kisa tutuluyor: site az sayida derin dosyadan olusuyor, menunun
 * buyumesi urunun kendisiyle celisir. Yeni bolum eklenirse buraya girer.
 */
const LINKS = [
  {href: '/', key: 'files'},
  {href: '/yontem', key: 'method'},
  {href: '/hakkinda', key: 'about'}
] as const;

/** Kilit her sayfada ana sayfaya goturur. */
export function SiteHeader() {
  const t = useTranslations('Nav');
  const tLocale = useTranslations('LocaleSwitcher');
  const locale = useLocale() as Locale;

  return (
    <header className={styles.header}>
      <BrandLockup />
      <nav className={styles.nav} aria-label={t('primary')}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.link}>
            {t(link.key)}
          </Link>
        ))}
        <LocaleSwitcher
          locale={locale}
          labels={{tr: tLocale('tr'), en: tLocale('en')}}
        />
      </nav>
    </header>
  );
}
