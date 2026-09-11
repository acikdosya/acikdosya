import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {
  ModelSection,
  type ModelVariant
} from '@/components/model-viewer/ModelSection';
import {MeasureGap} from '@/components/measure-gap/MeasureGap';
import {ModelProvenance} from '@/components/model-provenance/ModelProvenance';
import {RangeEnvelope} from '@/components/range-envelope/RangeEnvelope';
import {RangeScale} from '@/components/range-scale/RangeScale';
import {RevisionLog} from '@/components/revision-log/RevisionLog';
import {buildRings} from '@/components/range-envelope/rings';
import {ScaleSilhouette} from '@/components/scale-silhouette/ScaleSilhouette';
import {SectionHeading} from '@/components/section-heading/SectionHeading';
import {SpecTable} from '@/components/spec-table/SpecTable';
import {Timeline} from '@/components/timeline/Timeline';
import type {Locale} from '@/i18n/routing';
import {SITE_URL} from '@/lib/config';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {primary} from '@/lib/format';
import {selectMeasurements, systemKind} from '@/lib/geometry/measurements';
import {specGroups} from '@/lib/measurement/groups';
import type {Confidence, System} from '@/lib/schema';
import {systemJsonLd} from '@/lib/structured-data';
import {absoluteUrl, alternates, ogImage} from '@/lib/urls';
import styles from './page.module.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export function generateStaticParams() {
  return getSystemSlugs().map((slug) => ({slug}));
}

/**
 * Model bolumunun verisi.
 *
 * Kaynak: lib/geometry/measurements.ts icindeki ortak olcu secimi.
 * Siluet, paylasim gorseli, GLB pisirici ve bu bolum ayni secimden
 * gecer; boylece aile duzeyindeki beyanlar tek bir tuketicide kalmaz
 * ve "modeli ciziliyor" kararini iki yerde iki farkli kural vermez.
 *
 * Cevrilmis metinler burada cozulur — goruntuleyici client tarafina
 * mesaj paketi tasimaz (CLAUDE.md §6).
 */
function buildModelVariants(
  system: System,
  lang: Locale,
  labels: {
    confidence: (key: Confidence) => string;
    ariaLabel: (name: string) => string;
    family: string;
  }
): ModelVariant[] {
  // Aile grubunun varyanti yoktur; etiket veriden degil, o gruba ait olur.
  const variants = new Map(
    system.variants.map((variant) => [variant.id, variant])
  );

  return selectMeasurements(system)
    .filter((selection) => selection.canModel)
    .map((selection) => {
      const lengths = selection.group.specs.length_m;
      if (!lengths) return undefined;

      const primaryLength = primary(lengths);
      const variant = variants.get(selection.group.id);
      const label =
        selection.group.kind === 'family' ? labels.family : selection.group.label;

      return {
        id: selection.group.id,
        label,
        dimensions: selection.dimensions,
        systemSlug: system.slug,
        confidence: primaryLength.confidence,
        confidenceLabel: labels.confidence(primaryLength.confidence),
        annotations: (variant?.annotations ?? []).map((annotation) => ({
          id: annotation.id,
          part: annotation.part,
          t: annotation.t,
          angle: annotation.angle,
          label: annotation.label[lang],
          confidence: annotation.confidence,
          confidenceLabel: labels.confidence(annotation.confidence)
        })),
        // Scene Viewer goreli adres kabul etmez; bake script ayni adi yazar.
        modelUrl: new URL(
          `/models/${system.slug}-${selection.group.id}.glb`,
          SITE_URL
        ).toString(),
        ariaLabel: labels.ariaLabel(label)
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
    alternates: alternates(lang, href),
    openGraph: {
      type: 'article',
      locale: lang,
      title: system.name[lang],
      description,
      url: absoluteUrl(lang, href),
      /* Gorsel rotasi cevrilmez: /en/sistemler/... — lib/urls.ts. */
      images: ogImage(lang, `/sistemler/${slug}`)
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
  const tSpecs = await getTranslations('Specs');
  const tSpecTable = await getTranslations('SpecTable');

  /*
   * Yapisal veri sayfanin kendisinden turer: Article sayfayi, Dataset
   * icindeki olcumleri tarif eder. Sayfada gorunmeyen hicbir alan
   * eklenmez — lib/structured-data.ts.
   */
  const jsonLd = systemJsonLd({
    system,
    locale: lang,
    url: absoluteUrl(lang, {pathname: '/sistemler/[slug]', params: {slug}}),
    labels: {
      spec: (key) => tSpecs(key),
      confidence: (level) => tConfidence(level),
      familyLabel: tSpecTable('familyLabel'),
      datasetName: t('datasetName', {name: system.name[lang]}),
      datasetDescription: t('datasetDescription')
    }
  });

  const kind = systemKind(system);
  const rings = buildRings(system);
  /*
   * Ucakta menzil halkasi cizilmiyor. Gerekcesi iki katli ve
   * components/range-scale/geometry.ts basinda yazili: halka bir
   * yaricap iddiasi, "operasyonel menzil" ise oyle yorumlanmadi;
   * ustelik alti bin kilometrelik bir halka harita paketinin
   * kapsamina girmiyor (CLAUDE.md §11). Yerine mesafe cetveli.
   */
  const hasRangeStatement =
    kind === 'aircraft' &&
    specGroups(system).some(
      (group) =>
        group.specs.operational_range_km !== undefined ||
        group.specs.range_km !== undefined
    );
  const modelVariants = buildModelVariants(system, lang, {
    confidence: tConfidence,
    ariaLabel: (name) => tModel('ariaLabel', {name}),
    family: tSpecTable('familyLabel')
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
      /*
       * Olcu verisi olmayan varyant siluetten dusuyor. Dustugu tek yerde
       * soyleniyor: MeasureGap onu adiyla yazar ve neden cizilmedigini
       * belirtir. Model bolumunde tekrarlanmaz — ayni bosluk, iki kez
       * anlatilmaz.
       */
      body: (
        <>
          <ScaleSilhouette system={system} locale={lang} />
          <MeasureGap system={system} />
        </>
      )
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
              front: tModel('front'),
              fullscreen: tModel('fullscreen'),
              exitFullscreen: tModel('exitFullscreen')
            }}
          />
          <p className={styles.note}>
            {tModel(kind === 'missile' ? 'note' : 'noteAircraft')}
          </p>
          {/*
            Bicim kaydi: modelin oranlari nereden geldi. Sayfadaki her sayi
            guven seviyesiyle sunuluyor; bicim de kokenini soylemeli
            (specs/model-provenance).
          */}
          <ModelProvenance system={system} locale={lang} />
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

  if (hasRangeStatement) {
    sections.push({
      id: 'range',
      title: t('rangeDistance'),
      body: <RangeScale system={system} locale={lang} />
    });
  }

  return (
    <article className={styles.page}>
      {/*
        JSON-LD sayfanin icinde: ayri bir uc nokta degil, cizilen sayfanin
        parcasi. Boylece veri ile isaret ayni build'den cikar.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
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
