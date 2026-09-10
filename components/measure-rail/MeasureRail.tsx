import styles from './MeasureRail.module.css';

/**
 * Dekoratif degil: sayfa olcum hakkinda oldugu icin var.
 * Ekran okuyucuya bir sey soylemedigi icin gizli.
 */
export function MeasureRail() {
  return <div className={styles.rail} aria-hidden="true" />;
}
