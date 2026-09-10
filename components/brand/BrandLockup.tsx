import type {CSSProperties} from 'react';
import {BrandMark} from '@/components/brand/BrandMark';
import {Link} from '@/i18n/navigation';
import {
  BRAND_CLEAR_RATIO,
  BRAND_GAP_RATIO,
  BRAND_MIN_LOCKUP_PX,
  BRAND_WORD_RATIO,
  BRAND_WORDMARK
} from '@/lib/brand';
import styles from './BrandLockup.module.css';

/**
 * Sembol + kelime markasi, yatay kilit — CLAUDE.md §10.
 *
 * Olculer sembol boyundan turetilir ve CSS degiskeni olarak gecirilir;
 * kural lib/brand.ts'te, uygulamasi CSS'te, ikisi arasinda kopya yok.
 *
 * Marka adi cevrilmez: TR ve EN sayfalarda ayni dizgi.
 */
export function BrandLockup({size = 30}: {size?: number}) {
  /* Yarim pikselin altindaki fark gorunmuyor; kayan nokta artigi da
     stil ozniteligine sizmasin. */
  const px = (ratio: number) => `${Math.round(size * ratio * 100) / 100}px`;

  const style = {
    '--brand-clear': px(BRAND_CLEAR_RATIO),
    '--brand-gap': px(BRAND_GAP_RATIO),
    '--brand-word': px(BRAND_WORD_RATIO)
  } as CSSProperties;

  if (process.env.NODE_ENV !== 'production') {
    /* Kilidin toplam eni sembol + aralik + yazidan olusur; yazinin eni
       fonta bagli oldugu icin burada yalnizca kaba bir alt sinir kontrolu
       yapiliyor. Sembolun kendi alt siniri BrandMark icinde. */
    const approxWidth = size * (1 + BRAND_GAP_RATIO + BRAND_WORD_RATIO * 5.6);
    if (approxWidth < BRAND_MIN_LOCKUP_PX) {
      console.warn(
        `BrandLockup: yaklasik ${Math.round(approxWidth)}px, ` +
          `§10 alt siniri ${BRAND_MIN_LOCKUP_PX}px.`
      );
    }
  }

  return (
    <Link href="/" className={styles.lockup} style={style}>
      <BrandMark size={size} />
      <span className={styles.word}>{BRAND_WORDMARK}</span>
    </Link>
  );
}
