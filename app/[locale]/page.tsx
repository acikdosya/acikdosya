import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ConfidenceLevels} from '@/components/confidence-levels/ConfidenceLevels';
import {DivergenceHighlight} from '@/components/divergence-highlight/DivergenceHighlight';
import {HeroProvenance} from '@/components/hero-provenance/HeroProvenance';
import {HeroRevision} from '@/components/hero-revision/HeroRevision';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {SystemCard} from '@/components/system-card/SystemCard';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {heroFocus} from '@/lib/hero';
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
   * Hero paneli veri kosuluna rehin degil: sirali geri cekilme var —
   * iraksama, yoksa son duzeltme, yoksa tek bir degerin koken zinciri
   * (lib/hero.ts). Ucu de gercek dosyadan okunur, farazi ornek uretilmez
   * (CLAUDE.md §5.7).
   */
  const focus = heroFocus(systems);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <h1 className={styles.title}>
            {focus?.tier === 'divergence'
              ? t('heading', {
                  sources: focus.divergence.sources,
                  values: focus.divergence.distinct
                })
              : focus?.tier === 'revision'
                ? t('headingRevision')
                : t('headingPlain')}
          </h1>
          <p className={styles.lead}>{t('lead')}</p>
          <p className={styles.leadSecondary}>{t('leadSecondary')}</p>
          <a className={styles.button} href={`#${FILES_ID}`}>
            {t('cta')}
          </a>
        </div>

        {focus ? (
          <div className={styles.heroPanel}>
            {focus.tier === 'divergence' ? (
              <DivergenceHighlight
                divergence={focus.divergence}
                variants={focus.system.variants}
                locale={lang}
              />
            ) : null}
            {focus.tier === 'revision' ? (
              <HeroRevision
                revision={focus.revision}
                systemName={focus.system.name[lang]}
                locale={lang}
              />
            ) : null}
            {focus.tier === 'provenance' ? (
              <HeroProvenance
                measurement={focus.measurement}
                specKey={focus.key}
                group={focus.group}
                variants={focus.system.variants}
                systemName={focus.system.name[lang]}
                locale={lang}
              />
            ) : null}
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
