import type {Locale} from '@/i18n/routing';
import {SITE_URL} from './config';
import {SPEC_UNITS, unitLabel} from './format';
import {specGroups} from './measurement/groups';
import {
  specKeys,
  type Confidence,
  type Measurement,
  type MeasurementObject,
  type SpecKey,
  type System
} from './schema';
import {systemStats} from './stats';

/**
 * Arama motoru ve arsivler icin yapisal veri — CLAUDE.md §5 sinirlari
 * icinde.
 *
 * Iki tur veriliyor:
 *  Article — sayfanin kendisi: baslik, ozet, son guncelleme, kim yayimladi.
 *  Dataset — sayfadaki olcumler: her deger, birimi, guven seviyesi ve
 *            kaynagi. Bu sayfa bir yazidan cok bir kayittir; Dataset onu
 *            oldugu gibi tarif eder.
 *
 * Sayfada gorunmeyen hicbir sey buraya girmez. Hedef, hedef sinifi,
 * operasyonel yorum yok (§5.1, §5.2); menzil degeri sayfada zaten yazan
 * yayimlanmis beyandir.
 */

/** Sayfada olmayan bir tarih uydurulmaz; hicbir alanda tarih yoksa alan da yok. */
export function lastModified(system: System): string | undefined {
  const dates = [
    systemStats(system).verifiedAt,
    ...(system.revisions ?? []).map((revision) => revision.date)
  ].filter((date) => date !== undefined);

  return dates.length > 0 ? dates.sort().at(-1) : undefined;
}

/**
 * Operator sayinin parcasi: "> 280 km" ile "280 km" ayni sey degil.
 * schema.org'un minValue/maxValue alanlari tam bu ayrimi tasir; olculmemis
 * bir kesinlik iddia etmemek icin deger buna gore yerlestirilir.
 */
function bounded(measurement: Measurement): Record<string, number> {
  if (measurement.upper_value !== undefined) {
    return {
      minValue: measurement.value,
      maxValue: measurement.upper_value
    };
  }

  switch (measurement.operator) {
    case '>':
    case '≥':
      return {minValue: measurement.value};
    case '<':
    case '≤':
      return {maxValue: measurement.value};
    default:
      return {value: measurement.value};
  }
}

type Labels = {
  spec: (key: SpecKey) => string;
  /** Olcumun tarif ettigi nesne — sayfadaki kapsam notuyla ayni kelime. */
  object: (value: MeasurementObject) => string;
  confidence: (level: Confidence) => string;
  familyLabel: string;
  /** "TAYFUN — teknik veri" gibi; sayfa basligini tekrar etmez. */
  datasetName: string;
  datasetDescription: string;
};

const organization = {
  '@type': 'Organization',
  name: 'Açık Dosya',
  url: SITE_URL
};

export function systemJsonLd({
  system,
  locale,
  url,
  labels
}: {
  system: System;
  locale: Locale;
  url: string;
  labels: Labels;
}) {
  const modified = lastModified(system);
  const datasetId = `${url}#veri`;

  /*
   * Celisen degerler tek bir "dogru" degere indirgenmez: her olcum kendi
   * kaydiyla listelenir. Sayfada da boyle duruyor (SpecTable), yapisal
   * veride farkli davranmak okuyucuya bir sey, makineye baskasini
   * soylemek olurdu.
   */
  const variableMeasured = specGroups(system).flatMap((group) =>
    specKeys.flatMap((key) =>
      (group.specs[key] ?? []).map((measurement) => {
        const groupLabel =
          group.kind === 'family' ? labels.familyLabel : group.label;
        /*
         * Nesne ada giriyor. Sayfada her degerin altinda yaziyor
         * (ScopeNote); yapisal veride kaybolsaydi makineye okuyucuya
         * soyledigimizden AZINI soylemis olurduk ve ayni alandaki iki
         * ayri nicelik tek ad altinda yigilirdi (CLAUDE.md §5.8).
         */
        const objectLabel = measurement.object
          ? ` (${labels.object(measurement.object)})`
          : '';
        return {
          '@type': 'PropertyValue',
          name: `${labels.spec(key)}${objectLabel} — ${groupLabel}`,
          /*
           * Birimsiz buyuklukte unitText HIC YAZILMAZ. Bos bir dize,
           * "birimi var ama bilmiyoruz" der; oysa sayimin birimi yok.
           */
          ...(unitLabel(SPEC_UNITS[key])
            ? {unitText: unitLabel(SPEC_UNITS[key])}
            : {}),
          ...bounded(measurement),
          description: `${labels.confidence(measurement.confidence)} · ${
            measurement.source[locale]
          }`,
          ...(measurement.source_url ? {url: measurement.source_url} : {})
        };
      })
    )
  );

  /** Kaynak adresleri: yayimlanmis her kaynak, bir kez. */
  const citation = [
    ...new Set(
      specGroups(system)
        .flatMap((group) =>
          specKeys.flatMap((key) =>
            (group.specs[key] ?? []).map((item) => item.source_url)
          )
        )
        .concat(
          system.variants.flatMap((variant) =>
            Object.values(variant.attributes).map(
              (attribute) => attribute?.source_url
            )
          )
        )
        .concat(system.timeline.map((event) => event.source_url))
        .concat((system.revisions ?? []).map((revision) => revision.source_url))
        .filter((href) => href !== undefined)
    )
  ];

  const article = {
    '@type': 'Article',
    headline: system.name[locale],
    description: system.summary?.[locale],
    inLanguage: locale,
    isAccessibleForFree: true,
    mainEntityOfPage: url,
    author: organization,
    publisher: organization,
    about: {'@id': datasetId},
    ...(modified ? {dateModified: modified} : {})
  };

  const dataset = {
    '@type': 'Dataset',
    '@id': datasetId,
    name: labels.datasetName,
    description: labels.datasetDescription,
    url,
    inLanguage: locale,
    isAccessibleForFree: true,
    creator: organization,
    variableMeasured,
    ...(citation.length > 0 ? {citation} : {}),
    ...(modified ? {dateModified: modified} : {})
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [article, dataset]
  };
}
