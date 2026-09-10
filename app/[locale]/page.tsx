import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ConfidenceLevels} from '@/components/confidence-levels/ConfidenceLevels';
import {ConflictHighlight} from '@/components/conflict-highlight/ConflictHighlight';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {SystemCard} from '@/components/system-card/SystemCard';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {findConflict} from '@/lib/stats';
import {alternates, ogImage} from '@/lib/urls';
import styles from './page.module.css';

type Props = {params: Promise<{locale: string}>};

const FILES_ID = 'dosyalar';

/*
 * Baslik ve aciklama yerlesimden geliyor (Site.name / Site.tagline);
 * burada yalnizca kanonik adres ve dil karsiliklari veriliyor. Kok adres
 * iki dilde iki ayri sayfa: /  ve  /en — arama motorunun bunu kendiliginden
 * bilmesi beklenmez.
 */
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;

  /*
   * Gorsel adresi burada da veriliyor: opengraph-image.tsx bu sayfayla ayni
   * segmentte durdugu icin dosya sozlesmesi yerlesimdeki degeri eziyor ve
   * yonlendirmeye dusen /tr/... adresini yaziyordu — lib/urls.ts.
   */
  return {
    alternates: alternates(locale as Locale, '/'),
    openGraph: {images: ogImage(locale as Locale)}
  };
}

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const lang = locale as Locale;
  const t = await getTranslations('Home');

  const systems = getSystemSlugs()
    .map((slug) => getSystem(slug))
    .filter((system) => system !== undefined);

  /*
   * Hero'daki celiski gercek dosyadan geliyor. Hicbir sistemde celisen alan
   * yoksa panel cizilmez — uydurma bir ornek satir konmaz (CLAUDE.md §5.7).
   */
  const conflict = systems
    .map((system) => findConflict(system))
    .find((item) => item !== undefined);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <h1 className={styles.title}>
            {conflict
              ? t('heading', {
                  sources: conflict.sources,
                  values: conflict.distinct
                })
              : t('headingPlain')}
          </h1>
          <p className={styles.lead}>{t('lead')}</p>
          <p className={styles.leadSecondary}>{t('leadSecondary')}</p>
          <a className={styles.button} href={`#${FILES_ID}`}>
            {t('cta')}
          </a>
        </div>

        {conflict ? (
          <div className={styles.heroPanel}>
            <ConflictHighlight conflict={conflict} locale={lang} />
          </div>
        ) : null}
      </section>

      {/*
        Tek sistem varken izgara bos hucre veya "yakinda" karti ile
        doldurulmuyor: az sayida oge durustce gorunuyor.
      */}
      <section className={styles.files} id={FILES_ID}>
        <SectionHeading
          title={t('filesHeading')}
          meta={t('filesCount', {count: systems.length})}
        />
        {systems.map((system) => (
          <SystemCard key={system.slug} system={system} locale={lang} />
        ))}
      </section>

      <section className={styles.method}>
        <SectionHeading title={t('methodHeading')} meta={t('methodMeta')} />
        <p className={styles.methodIntro}>{t('methodIntro')}</p>

        <ConfidenceLevels />

        <div className={styles.conflictNote}>
          <span className={styles.conflictLabel}>{t('conflictLabel')}</span>
          <p className={styles.conflictBody}>{t('conflictBody')}</p>
        </div>

        <p className={styles.methodLink}>
          <Link href="/yontem">{t('methodLink')}</Link>
        </p>
      </section>
    </div>
  );
}
