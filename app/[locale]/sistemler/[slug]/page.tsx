import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {
  ModelSection,
  type ModelVariant
} from '@/components/model-viewer/ModelSection';
import {RangeEnvelope} from '@/components/range-envelope/RangeEnvelope';
import {buildRings} from '@/components/range-envelope/rings';
import {ScaleSilhouette} from '@/components/scale-silhouette/ScaleSilhouette';
import {SpecTable} from '@/components/spec-table/SpecTable';
import {Timeline} from '@/components/timeline/Timeline';
import {getPathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';
import {SITE_URL} from '@/lib/config';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {primary} from '@/lib/format';
import type {Confidence, System} from '@/lib/schema';

type Props = {params: Promise<{locale: string; slug: string}>};

export function generateStaticParams() {
  return getSystemSlugs().map((slug) => ({slug}));
}

function absoluteUrl(locale: Locale, slug: string): string {
  return new URL(
    getPathname({
      locale,
      href: {pathname: '/sistemler/[slug]', params: {slug}}
    }),
    SITE_URL
  ).toString();
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
  const t = await getTranslations({locale, namespace: 'SystemPage'});

  const description =
    system.summary?.[lang] ??
    t('metaFallback', {manufacturer: system.manufacturer.name});

  return {
    title: system.name[lang],
    description,
    alternates: {
      canonical: absoluteUrl(lang, slug),
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, absoluteUrl(item, slug)])
      )
    },
    openGraph: {
      type: 'article',
      locale: lang,
      title: system.name[lang],
      description,
      url: absoluteUrl(lang, slug)
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

  return (
    <article>
      <section className="pt-14 pb-16">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-3.5">
          <h1 className="text-[clamp(52px,10vw,104px)] leading-[0.9] font-extrabold tracking-[-0.035em]">
            {system.name[lang]}
          </h1>
          <span className="rounded-[2px] border border-signal px-[7px] py-[3px] font-display text-[13px] font-semibold text-signal">
            {t('badge')}
          </span>
        </div>

        <p className="font-display text-[13px] font-semibold tracking-[0.03em] text-ink-2">
          {tCategory(system.category)} · {system.manufacturer.name} ·{' '}
          {tStatus(system.status)}
        </p>

        {system.summary ? (
          <p className="mt-3.5 mb-10 max-w-[52ch] text-[19px] text-ink-2">
            {system.summary[lang]}
          </p>
        ) : (
          <div className="mb-10" />
        )}

        <ScaleSilhouette system={system} locale={lang} />
      </section>

      <section className="border-t border-rule py-16">
        <h2 className="mb-7 font-display text-[15px] font-extrabold tracking-[0.02em] text-ink-2">
          {t('specs')}
        </h2>
        <SpecTable system={system} locale={lang} />
      </section>

      <section className="border-t border-rule py-16">
        <h2 className="mb-7 font-display text-[15px] font-extrabold tracking-[0.02em] text-ink-2">
          {t('timeline')}
        </h2>
        <Timeline system={system} locale={lang} />
      </section>

      {rings.length > 0 ? (
        <section className="border-t border-rule py-16">
          <h2 className="mb-7 font-display text-[15px] font-extrabold tracking-[0.02em] text-ink-2">
            {t('range')}
          </h2>
          <p className="mb-6 max-w-[62ch] text-ink-2">{tRange('intro')}</p>
          <RangeEnvelope rings={rings} locale={lang} />
        </section>
      ) : null}

      {modelVariants.length > 0 ? (
        <section className="border-t border-rule py-16">
          <h2 className="mb-7 font-display text-[15px] font-extrabold tracking-[0.02em] text-ink-2">
            {t('model')}
          </h2>
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
          <p className="mt-6 max-w-[70ch] text-sm text-ink-2">
            {tModel('note')}
          </p>
        </section>
      ) : null}

      <section className="border-t border-rule py-10">
        <p className="max-w-[62ch] text-sm text-ink-2">
          {system.disclaimer[lang]}
        </p>
      </section>
    </article>
  );
}
