import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import type {System} from '@/lib/schema';
import styles from './MeasureGap.module.css';

/**
 * Olcu verisi olmayan varyantlarin acik kaydi.
 *
 * Siluet, 3B model ve GLB pisirici, uzunluk veya cap verisi olmayan varyanti
 * sessizce atliyor — CLAUDE.md §9: "Olcu verisi yoksa model uretilmez."
 * Sessiz atlama okuyucuya yanlis bir sey soyluyordu: varyant hic yokmus ya
 * da cizmeye deger bulunmamis gibi gorunuyordu. Oysa sebep belli ve
 * soylenebilir — dogrulanmis olcu verisi yok.
 *
 * Bu bir hata durumu degil, kaydin durumu. Bu yuzden uyari dili yok:
 * eksik verinin dili tire ve soluk metin (§4, data-state="absent").
 */
export function MeasureGap({system}: {system: System}) {
  const t = useTranslations('MeasureGap');

  const missing = system.variants.filter(
    (variant) => !variant.specs.length_m || !variant.specs.diameter_mm
  );

  if (missing.length === 0) return null;

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {missing.map((variant) => (
          <li className={styles.item} key={variant.id}>
            <span className={styles.label}>{variant.label}</span>
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
