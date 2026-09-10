import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import styles from './prose.module.css';

/**
 * Yerellestirilmis 404. Kabuk (ust bilgi, ray, alt bilgi) yerinde kalir:
 * okuyucu siteden atilmis hissetmesin, gidebilecegi yerler gorunsun.
 */
export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{t('code')}</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('body')}</p>
      </header>

      <div className={styles.body}>
        <p>
          <Link href="/" className={styles.standaloneLink}>
            {t('home')}
          </Link>
        </p>
      </div>
    </article>
  );
}
