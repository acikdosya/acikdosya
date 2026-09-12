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
import {OriginChain} from '@/components/origin-chain/OriginChain';
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
import {manufacturerNames, primary} from '@/lib/format';
import {selectMeasurements} from '@/lib/geometry/measurements';
import {specGroups} from '@/lib/measurement/groups';
import type {Category, Confidence, System} from '@/lib/schema';
import {systemJsonLd} from '@/lib/structured-data';
import {absoluteUrl, alternates, ogImage} from '@/lib/urls';
import styles from './page.module.css';

/**
 * Model aciklamasinin mesaj anahtari — kategoriye gore.
 *
 * Metin her sistemde ayni seyi soylemiyor: ucakta inis takimi ve yuk
 * istasyonu anlatiliyor, hava savunma sisteminde ATICI VE KANISTERIN
 * cizilmedigi. Record<Category, ...> exhaustive: semaya yeni bir kategori
 * eklenip buraya satir yazilmazsa derleme duser ve yeni sistem baska bir
 * sistemin aciklamasiyla cikmaz.
 */
const MODEL_NOTE_KEY: Record<Category, string> = {
  'balistik-fuze': 'note',
  'seyir-fuzesi': 'note',
  'insansiz-hava-araci': 'noteAircraft',
  'hava-savunma-sistemi': 'noteAirDefence'
};

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
    t('metaFallback', {
      manufacturer: manufacturerNames(system.manufacturer, lang)
    });

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
  const tDivergence = await getTranslations('Divergence');

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
      object: (value) => tDivergence(`object_${value}`),
      confidence: (level) => tConfidence(level),
      familyLabel: tSpecTable('familyLabel'),
      datasetName: t('datasetName', {name: system.name[lang]}),
      datasetDescription: t('datasetDescription')
    }
  });

  /*
   * Aile grubunun varyant adi yok; etiketi ceviri paketinden gelir.
   * rings.ts cevirmez — orasi React ve mesaj paketi ice aktarmaz.
   */
  const rings = buildRings(system).map((ring) =>
    ring.isFamily ? {...ring, variantLabel: tSpecTable('familyLabel')} : ring
  );
  /*
   * Halka cizilemeyen menzil beyani kaybolmaz, mesafe cetveline duser.
   *
   * Kosul artik kategori degil KAYIT: `range_ring` yoksa halka yok ve
   * sayfa sebebini cetvelin altyazisinda soyler. Gerekce
   * components/range-scale/geometry.ts basinda — halka bir yaricap
   * iddiasi, ucaktaki "operasyonel menzil" oyle yorumlanmadi; ustelik
   * alti bin kilometrelik bir halka harita paketinin kapsamina
   * girmiyor (CLAUDE.md §11).
   */
  const hasRangeStatement =
    rings.length === 0 &&
    specGroups(system).some(
      (group) =>
        group.specs.operational_range_km !== undefined ||
        group.specs.range_km !== undefined
    );
  /* Halka yatay uzanimi cizer; dosyada irtifa varsa bunu lejant soyler. */
  const hasInterceptAltitude = specGroups(system).some(
    (group) => group.specs.intercept_altitude_km !== undefined
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
            {tModel(MODEL_NOTE_KEY[system.category])}
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
   * Koken zinciri yalnizca kayit varsa. Kayit yoklugu "tekrar yok"
   * demek degil, "bu dosyada tekrar denetimi yapilmadi" demek; bos bir
   * bolum ikisini karistirirdi.
   */
  if ((system.origins ?? []).length > 0) {
    sections.push({
      id: 'origins',
      title: t('origins'),
      body: <OriginChain system={system} locale={lang} />
    });
  }

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
              /*
                Dikey bilesen yalnizca kayitliysa anlatilir. Kaydi
                olmayan bir dosyada "irtifayi gostermiyor" demek,
                olmayan bir veriye isaret etmek olurdu.
              */
              ...(hasInterceptAltitude
                ? {altitudeNote: tRange('altitudeNote')}
                : {}),
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
          {tCategory(system.category)} ·{' '}
          {manufacturerNames(system.manufacturer, lang)} · {tStatus(system.status)}
        </p>
        {/*
          Program yurutucusu gelistiriciden ayri bir rol: SIPER'de SSB
          programi yurutuyor, uc kurulus gelistiriyor. Ayni satira
          karistirmak rol bilgisini silerdi.
        */}
        {system.program_authority ? (
          <p className={styles.meta}>
            {t('programAuthority', {name: system.program_authority.name})}
          </p>
        ) : null}
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
