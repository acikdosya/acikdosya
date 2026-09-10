import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {
  ModelSection,
  type ModelVariant
} from '@/components/model-viewer/ModelSection';
import {RangeEnvelope} from '@/components/range-envelope/RangeEnvelope';
import {RevisionLog} from '@/components/revision-log/RevisionLog';
import {buildRings} from '@/components/range-envelope/rings';
import {ScaleSilhouette} from '@/components/scale-silhouette/ScaleSilhouette';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {SpecTable} from '@/components/spec-table/SpecTable';
import {Timeline} from '@/components/timeline/Timeline';
import {routing, type Locale} from '@/i18n/routing';
import {SITE_URL} from '@/lib/config';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {primary} from '@/lib/format';
import type {Confidence, System} from '@/lib/schema';
import {absoluteUrl, localizedUrls} from '@/lib/urls';
import styles from './page.module.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export function generateStaticParams() {
  return getSystemSlugs().map((slug) => ({slug}));
}

/**
 * Model bolumunun verisi. Olcu alani olmayan varyant atlanir; ayni kurali
 * scripts/bake-glb.mjs de uygular, boylece GLB ile sahne ayni kumede kalir.
 * Cevrilmis metinler burada cozulur — goruntuleyici client tarafina
 * mesaj paketi tasimaz (CLAUDE.md §6).
 */
function buildModelVariants(
  system: System,
  lang: Locale,
  labels: {
    confidence: (key: Confidence) => string;
    ariaLabel: (name: string) => string;
  }
): ModelVariant[] {
  return system.variants
    .map((variant) => {
      const length = variant.specs.length_m;
      const diameter = variant.specs.diameter_mm;
      if (!length || !diameter) return undefined;

      const primaryLength = primary(length);

      return {
        id: variant.id,
        label: variant.label,
        lengthM: primaryLength.value,
        diameterMm: primary(diameter).value,
        confidence: primaryLength.confidence,
        confidenceLabel: labels.confidence(primaryLength.confidence),
        annotations: (variant.annotations ?? []).map((annotation) => ({
          id: annotation.id,
          t: annotation.t,
          angle: annotation.angle,
          label: annotation.label[lang],
          confidence: annotation.confidence,
          confidenceLabel: labels.confidence(annotation.confidence)
        })),
        // Scene Viewer goreli adres kabul etmez; bake script ayni adi yazar.
        modelUrl: new URL(
          `/models/${system.slug}-${variant.id}.glb`,
          SITE_URL
        ).toString(),
        ariaLabel: labels.ariaLabel(variant.label)
      };
    })
    .filter((variant) => variant !== undefined);
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const system = getSystem(slug);
  if (!system) return {};

  const lang = locale as Locale;
  const href = {pathname: '/sistemler/[slug]', params: {slug}} as const;
  const t = await getTranslations({locale, namespace: 'SystemPage'});

  const description =
    system.summary?.[lang] ??
    t('metaFallback', {manufacturer: system.manufacturer.name});

  return {
    title: system.name[lang],
    description,
    alternates: {
      canonical: absoluteUrl(lang, href),
      languages: localizedUrls(href, routing.locales)
    },
    openGraph: {
      type: 'article',
      locale: lang,
      title: system.name[lang],
      description,
      url: absoluteUrl(lang, href)
    }
  };
}

export default async function SystemPage({params}: Props) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  const system = getSystem(slug);
  if (!system) notFound();

  const lang = locale as Locale;
  const t = await getTranslations('SystemPage');
  const tRange = await getTranslations('RangeEnvelope');
  const tCategory = await getTranslations('Categories');
  const tStatus = await getTranslations('Status');
  const tModel = await getTranslations('ModelViewer');
  const tConfidence = await getTranslations('Confidence');

  const rings = buildRings(system);
  const modelVariants = buildModelVariants(system, lang, {
    confidence: tConfidence,
    ariaLabel: (name) => tModel('ariaLabel', {name})
  });

  /*
   * Bolum kimlikleri cevrilmez: paylasilan bir bag (#specs) iki dilde de
   * ayni bolumu acsin.
   *
   * Bolumler dizi olarak kuruluyor. Numaralar dizideki sirasindan gelir,
   * elle yazilmaz: model veya menzil bolumu verisi olmadigi icin
   * cizilmediginde kalan bolumler kesintisiz numaralanir.
   */
  const sections: {id: string; title: string; body: ReactNode}[] = [
    {
      id: 'scale',
      title: t('scale'),
      body: <ScaleSilhouette system={system} locale={lang} />
    }
  ];

  if (modelVariants.length > 0) {
    sections.push({
      id: 'model',
      title: t('model'),
      body: (
        <>
          <ModelSection
            variants={modelVariants}
            fallback={<ScaleSilhouette system={system} locale={lang} />}
            copy={{
              loading: tModel('loading'),
              hint: tModel('hint'),
              ar: tModel('ar'),
              overview: tModel('overview'),
              fullscreen: tModel('fullscreen'),
              exitFullscreen: tModel('exitFullscreen')
            }}
          />
          <p className={styles.note}>{tModel('note')}</p>
        </>
      )
    });
  }

  sections.push(
    {
      id: 'specs',
      title: t('specs'),
      body: <SpecTable system={system} locale={lang} />
    },
    {
      id: 'timeline',
      title: t('timeline'),
      body: <Timeline system={system} locale={lang} />
    }
  );

  /*
   * Duzeltme gecmisi yalnizca kayit varsa. Bos bir "Duzeltme gecmisi"
   * basligi, kaydin tutulmadigi izlenimi verir — kaydi hic gostermemekten
   * kotu. Bolum numaralari dizinin sirasindan geldigi icin eksilen bolum
   * numaralandirmayi bozmaz.
   */
  if ((system.revisions ?? []).length > 0) {
    sections.push({
      id: 'revisions',
      title: t('revisions'),
      body: <RevisionLog system={system} locale={lang} />
    });
  }

  if (rings.length > 0) {
    sections.push({
      id: 'range',
      title: t('range'),
      body: (
        <>
          <p className={styles.intro}>{tRange('intro')}</p>
          <RangeEnvelope
            rings={rings}
            locale={lang}
            copy={{
              loading: tRange('loading'),
              markerHint: tRange('markerHint'),
              mapLabel: tRange('mapLabel'),
              latitude: tRange('latitude'),
              longitude: tRange('longitude'),
              legend: tRange('legend'),
              confidence: {
                official: tConfidence('official'),
                press: tConfidence('press'),
                estimate: tConfidence('estimate')
              }
            }}
          />
        </>
      )
    });
  }

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        {/*
          Sayfa etiketi, guven rozeti degil. Kirmizi cerceve + kirmizi metin
          'tahmin' rozetinin dilidir; onu burada kullanmak uc durumlu gorsel
          dili bozar — CLAUDE.md §4.
        */}
        <p className={styles.eyebrow}>{t('badge')}</p>
        <h1 className={styles.title}>{system.name[lang]}</h1>
        <p className={styles.meta}>
          {tCategory(system.category)} · {system.manufacturer.name} ·{' '}
          {tStatus(system.status)}
        </p>
        {system.summary ? (
          <p className={styles.summary}>{system.summary[lang]}</p>
        ) : null}
      </header>

      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className={styles.section}
          aria-labelledby={`${section.id}-heading`}
        >
          <SectionHeading
            index={index + 1}
            title={section.title}
            id={`${section.id}-heading`}
          />
          {section.body}
        </section>
      ))}

      <p className={styles.disclaimer}>{system.disclaimer[lang]}</p>
    </article>
  );
}
