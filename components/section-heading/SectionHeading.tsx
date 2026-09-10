import type {ReactNode} from 'react';
import styles from './SectionHeading.module.css';

/**
 * Bolum basligi — desen sayfasi §08.
 *
 * Referans belgede baslik yaninda Ingilizce karsiligi da duruyor; o iki
 * dilli bir belge oldugu icin oyle. Urun sayfasi zaten okuyucunun dilinde
 * oldugundan burada ikinci dil yok, yerine saga yasli ikincil bilgi var.
 */
type Props = {
  title: string;
  /** Iki haneli sira numarasi. Bolumler numaralandirilmadiysa verilmez. */
  index?: number;
  meta?: ReactNode;
  id?: string;
};

export function SectionHeading({title, index, meta, id}: Props) {
  return (
    <div className={styles.heading}>
      {index === undefined ? null : (
        <span className={styles.index} aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <h2 className={styles.title} id={id}>
        {title}
      </h2>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
    </div>
  );
}
