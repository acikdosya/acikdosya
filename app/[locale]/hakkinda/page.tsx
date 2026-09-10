import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {Link} from '@/i18n/navigation';
import {CONTACT_EMAIL} from '@/lib/config';
import styles from '../prose.module.css';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'About'});

  /*
   * Sekme basligi bolumun adini tasir. Sayfa basligi marka adiyla ayni
   * oldugu icin sablon "Açık Dosya — Açık Dosya" uretiyordu.
   */
  return {title: t('eyebrow'), description: t('lead')};
}

/**
 * Hakkinda sayfasi. Bagimsizlik beyani, kapsam ve duzeltme talebinin nasil
 * iletilecegi.
 *
 * Iletisim adresi yapilandirmadan gelir. Tanimli degilse kanalin henuz
 * yayimlanmadigi yazilir; calismayan bir adres uydurulmaz (CLAUDE.md §5.7).
 */
export default async function AboutPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('About');

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>

      <section
        className={styles.section}
        aria-labelledby="independence-heading"
      >
        <SectionHeading
          index={1}
          title={t('independenceHeading')}
          id="independence-heading"
        />
        <div className={styles.body}>
          <p>{t('independenceBody')}</p>
          <p>{t('independenceBrands')}</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="scope-heading">
        <SectionHeading index={2} title={t('scopeHeading')} id="scope-heading" />
        <div className={styles.body}>
          <p>{t('scopeBody')}</p>
          <p>
            {t.rich('scopeMethod', {
              link: (chunks) => (
                <Link href="/yontem" className={styles.inlineLink}>
                  {chunks}
                </Link>
              )
            })}
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contact-heading">
        <SectionHeading
          index={3}
          title={t('contactHeading')}
          id="contact-heading"
        />
        <div className={styles.body}>
          <p>{t('contactBody')}</p>
          <p className={styles.contact}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.inlineLink}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>{t('contactWhat')}</p>
        </div>
      </section>
    </article>
  );
}
