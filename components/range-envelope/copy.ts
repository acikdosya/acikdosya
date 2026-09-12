import type {Confidence} from '@/lib/schema';

/**
 * Haritanin ihtiyac duydugu cevrilmis metinler. Sunucuda cozulur ve prop
 * olarak iner; istemci tarafi mesaj paketi tasimaz — CLAUDE.md §6.
 */
export type RangeCopy = {
  loading: string;
  markerHint: string;
  mapLabel: string;
  latitude: string;
  longitude: string;
  legend: string;
  /**
   * Halkanin tasimadigi zarf bileseni. Yalnizca dosyada bir onleme
   * irtifasi kayitliysa verilir: duz daire yatay uzanimi gosterir, dikey
   * bileseni gostermez ve bu sessiz kalamaz (specs/range-envelope).
   */
  altitudeNote?: string;
  confidence: Record<Confidence, string>;
};
