import {SPEC_UNITS} from './format';
import {specGroups} from './measurement/groups';
import {
  specKeys,
  type Measurement,
  type Revision,
  type RevisionValue,
  type SpecKey,
  type System
} from './schema';

/**
 * Duzeltme defteri ile dosyanin geri kalani tutuyor mu — CLAUDE.md §3.
 *
 * Defterin isi yayimlanmis bir degerin nereye gittigini gostermek. Defter
 * "yeni deger 12,3 m" derken tabloda 12,2 m yaziyorsa okuyucuya iki ayri
 * sey soylenmis olur ve hangisinin dogru oldugu disaridan anlasilamaz —
 * yani defter ise yaramaz hale gelir. Bu yuzden uyusmazlik DERLEMEYI
 * DUSURUR (scripts/validate-content.ts).
 *
 * Kontrol dar tutuldu; her dar tutulan yerin bir gerekcesi var:
 *
 *  yalnizca SON kayit   Ayni alanda birden fazla duzeltme olabilir ve
 *                       eskisi zaten gecersiz kilinmistir. Bugunku
 *                       degerle kiyaslanacak olan en sonuncusudur.
 *  yalnizca 'measurement'  'removed' bir degerin YOKLUGUNU anlatir;
 *                       'text' ise niteleyici tasir ("> 280 km (resmî)")
 *                       ve sayiya cevrilemez. Ikisi de kiyaslanamaz, bu
 *                       yuzden atlanir — uydurma bir kiyas, kiyassizliktan
 *                       kotudur.
 *  yalnizca bilinen alan  Serbest metin alan adi (ornegin "source") bir
 *                       olcum listesine karsilik gelmez.
 *  grup ayrimi YOK      Kayit hangi varyanta ait oldugunu soylemiyor, bu
 *                       yuzden deger sistemin HERHANGI bir grubunda
 *                       bulunursa yeterli sayilir. Aksi halde varyant
 *                       duzeltmeleri yanlis yere hata verirdi.
 */

export type RevisionIssue = {
  field: string;
  date: string;
  /** Defterin yazdigi yeni deger. */
  expected: string;
  /** Alanda bugun duran degerler. */
  found: string[];
  kind: 'unit-mismatch' | 'value-missing';
};

function isSpecKey(field: string): field is SpecKey {
  return (specKeys as readonly string[]).includes(field);
}

function show(value: RevisionValue & {kind: 'measurement'}): string {
  return `${value.operator ? `${value.operator} ` : ''}${value.value} ${value.unit}`;
}

function showMeasurement(measurement: Measurement, unit: string): string {
  const upper =
    measurement.upper_value !== undefined
      ? ` – ${measurement.upper_operator ? `${measurement.upper_operator} ` : ''}${measurement.upper_value}`
      : '';
  return `${measurement.operator ? `${measurement.operator} ` : ''}${measurement.value}${upper} ${unit}`;
}

/**
 * Deger ile kayit ayni seyi mi soyluyor.
 *
 * Operator degerin PARCASI: "> 280" ile "280" ayni sayi degil (§5.8).
 * Aralikli bir kayit da tek bir degerle eslesmez — kaynak iki uc
 * vermisse defterin tek sayi yazmasi kaydin yarisini gizler.
 */
function matches(
  measurement: Measurement,
  value: RevisionValue & {kind: 'measurement'}
): boolean {
  return (
    measurement.value === value.value &&
    measurement.operator === value.operator &&
    measurement.upper_value === undefined
  );
}

/** Alan basina en son duzeltme. Esit tarihte dosya sirasi karar verir. */
function latestByField(revisions: readonly Revision[]): Map<string, Revision> {
  const latest = new Map<string, Revision>();

  revisions.forEach((revision) => {
    const current = latest.get(revision.field);
    if (!current || revision.date >= current.date) {
      latest.set(revision.field, revision);
    }
  });

  return latest;
}

export function revisionIssues(system: System): RevisionIssue[] {
  const issues: RevisionIssue[] = [];
  const groups = specGroups(system);

  for (const [field, revision] of latestByField(system.revisions ?? [])) {
    const to = revision.to;
    if (to.kind !== 'measurement') continue;
    if (!isSpecKey(field)) continue;

    const unit = SPEC_UNITS[field];
    if (to.unit !== unit) {
      issues.push({
        field,
        date: revision.date,
        expected: show(to),
        found: [`alan birimi "${unit}"`],
        kind: 'unit-mismatch'
      });
      continue;
    }

    const measurements = groups.flatMap((group) => group.specs[field] ?? []);
    if (measurements.some((measurement) => matches(measurement, to))) continue;

    issues.push({
      field,
      date: revision.date,
      expected: show(to),
      found: measurements.map((measurement) => showMeasurement(measurement, unit)),
      kind: 'value-missing'
    });
  }

  return issues;
}

/** Derleme ciktisinda okunacak hali. */
export function describeIssue(issue: RevisionIssue): string {
  if (issue.kind === 'unit-mismatch') {
    return (
      `duzeltme kaydi (${issue.date}, ${issue.field}) "${issue.expected}" diyor ` +
      `ama ${issue.found[0]} — birim alan adinin icinde tasiniyor, degistirilemez`
    );
  }

  const found =
    issue.found.length > 0 ? issue.found.join(', ') : 'alanda hic kayit yok';
  return (
    `duzeltme kaydi (${issue.date}, ${issue.field}) yeni deger olarak ` +
    `"${issue.expected}" yaziyor ama dosyada o deger yok: ${found}\n` +
    '  defter ile tablo ayrisirsa okuyucu hangisinin dogru oldugunu bilemez'
  );
}
