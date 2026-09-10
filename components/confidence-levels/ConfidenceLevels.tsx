import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Confidence} from '@/lib/schema';
import styles from './ConfidenceLevels.module.css';

const LEVELS: readonly Confidence[] = ['official', 'press', 'estimate'];

/**
 * Uc guven seviyesi, rozetleriyle. Ana sayfadaki ozet ile yontem sayfasi
 * ayni bileseni kullanir; metin tek yerde (ConfidenceLevels mesaj alani).
 */
export function ConfidenceLevels() {
  const t = useTranslations('ConfidenceLevels');

  return (
    <div className={styles.grid}>
      {LEVELS.map((level) => (
        <div className={styles.card} key={level}>
          <span className={styles.badge}>
            <ConfidenceBadge confidence={level} size="md" />
          </span>
          <p className={styles.body}>{t(level)}</p>
        </div>
      ))}
    </div>
  );
}
