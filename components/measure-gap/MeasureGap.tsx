import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {systemKind} from '@/lib/geometry/measurements';
import {specGroups} from '@/lib/measurement/groups';
import type {System} from '@/lib/schema';
import styles from './MeasureGap.module.css';

/**
 * Olcu verisi olmayan gruplarin acik kaydi.
 *
 * Siluet, 3B model ve GLB pisirici, gerekli boyut verisi olmayan grubu
 * sessizce atliyor — CLAUDE.md §9: "Olcu verisi yoksa model uretilmez."
 * Sessiz atlama okuyucuya yanlis bir sey soyluyordu: grup hic yokmus ya
 * da cizmeye deger bulunmamis gibi gorunuyordu. Oysa sebep belli ve
 * soylenebilir — dogrulanmis olcu verisi yok.
 *
 * Bu bir hata durumu degil, kaydin durumu. Bu yuzden uyari dili yok:
 * eksik verinin dili tire ve soluk metin (§4, data-state="absent").
 */
export function MeasureGap({system}: {system: System}) {
  const t = useTranslations('MeasureGap');
  const kind = systemKind(system);

  const missing = specGroups(system).filter((group) => {
    const hasLength = group.specs.length_m;
    if (kind === 'missile') {
      return !hasLength || !group.specs.diameter_mm;
    }
    return !hasLength || !group.specs.wingspan_m;
  });

  if (missing.length === 0) return null;

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {missing.map((group) => (
          <li className={styles.item} key={group.id}>
            <span className={styles.label}>
              {group.kind === 'family' ? t('familyLabel') : group.label}
            </span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.state} data-state="absent">
              {t('absent')}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.invite}>
        {t.rich('invite', {
          link: (chunks) => (
            <Link href="/hakkinda" className={styles.link}>
              {chunks}
            </Link>
          )
        })}
      </p>
    </div>
  );
}
