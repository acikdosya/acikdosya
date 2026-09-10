import type {Metadata} from 'next';
import {Fragment} from 'react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ConfidenceLevels} from '@/components/confidence-levels/ConfidenceLevels';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {alternates} from '@/lib/urls';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import styles from '../prose.module.css';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Method'});

  return {
    title: t('title'),
    description: t('lead'),
    alternates: alternates(locale as Locale, '/yontem')
  };
}

const LIMITS = ['targets', 'classes', 'internals', 'imagery'] as const;
const TERMS = ['value', 'confidence', 'source', 'verified'] as const;

/**
 * Yontem sayfasi. Uc guven seviyesinin ne anlama geldigi, verinin nasil
 * tutuldugu, celiskinin neden gizlenmedigi ve neyi yayimlamadigimiz.
 * Her spec tablosu ve ana sayfa buraya baglanir.
 */
export default async function MethodPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Method');

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>

      <section className={styles.section} aria-labelledby="levels-heading">
        <SectionHeading index={1} title={t('levelsHeading')} id="levels-heading" />
        <div className={styles.body}>
          <p>{t('levelsIntro')}</p>
        </div>
        <ConfidenceLevels />
        <div className={styles.body}>
          <p>{t('levelsNote')}</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="record-heading">
        <SectionHeading index={2} title={t('recordHeading')} id="record-heading" />
        <div className={styles.body}>
          <p>{t('recordIntro')}</p>
        </div>
        <dl className={styles.terms}>
          {TERMS.map((term) => (
            <Fragment key={term}>
              <dt>{t(`term_${term}`)}</dt>
              <dd>{t(`termBody_${term}`)}</dd>
            </Fragment>
          ))}
        </dl>
        <div className={styles.body}>
          <p>{t('recordUnits')}</p>
          <p>{t('recordMissing')}</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="conflict-heading">
        <SectionHeading
          index={3}
          title={t('conflictHeading')}
          id="conflict-heading"
        />
        <div className={styles.body}>
          <p>{t('conflictIntro')}</p>
          <p>{t('conflictPick')}</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="limits-heading">
        <SectionHeading index={4} title={t('limitsHeading')} id="limits-heading" />
        <div className={styles.body}>
          <p>{t('limitsIntro')}</p>
        </div>
        <ul className={styles.limits}>
          {LIMITS.map((limit) => (
            <li key={limit}>{t(`limit_${limit}`)}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="corrections-heading">
        <SectionHeading
          index={5}
          title={t('correctionsHeading')}
          id="corrections-heading"
        />
        <div className={styles.body}>
          <p>
            {t.rich('correctionsBody', {
              link: (chunks) => (
                <Link href="/hakkinda" className={styles.inlineLink}>
                  {chunks}
                </Link>
              )
            })}
          </p>
        </div>
      </section>
    </article>
  );
}
