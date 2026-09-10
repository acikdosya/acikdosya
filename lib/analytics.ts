/**
 * Olay izleme — tek dosyada, tek sozluk.
 *
 * Olcum kendi sunucumuzdaki Umami'ye gider (deploy/analytics/compose.yaml).
 * Cerez yok, parmak izi yok, ziyaretcinin IP adresi ucuncu tarafa gitmiyor:
 * tarayici script'i de olay ucu da kendi origin'imizden servis ediliyor
 * (next.config.ts icindeki /veri yeniden yazimi). Bu yuzden cerez bandi
 * gerekmiyor — sorulacak bir riza yok.
 *
 * Olay adlari burada duruyor ki bilesenlere serpistirilmis dizeler
 * birbirinden ayrilmasin: panelde "harita-etkilesim" ile
 * "harita_etkilesimi" iki ayri olay olarak gorunur ve fark edilmez.
 */

type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    /** Tarayici script'i yuklenene kadar tanimsiz — cagri yerleri buna gore. */
    umami?: {track: (event: string, data?: EventData) => void};
  }
}

export const EVENTS = {
  /** Menzil zarfinda isaretci tasindi ya da halka acilip kapandi. */
  map: 'harita-etkilesim',
  /** 3D bolum goruntuye girdi ve goruntuleyici kuruldu. */
  model: 'model-yuklendi',
  /** Model bolumunde varyant degistirildi. */
  variant: 'varyant-degisti',
  /** Yontem sayfasina giden bir bag tiklandi. */
  method: 'yontem-gidis',
  /** Bir olcumun kaynak bagi tiklandi. */
  source: 'kaynak-tikla'
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

const KNOWN: ReadonlySet<string> = new Set(Object.values(EVENTS));

/** Bilinmeyen ad panelde sessizce birikir; burada durdurulur. */
export function isAnalyticsEvent(name: string): name is AnalyticsEvent {
  return KNOWN.has(name);
}

/**
 * Sunucu tarafinda ve script yuklenmemisken sessiz. Olcum calismiyor diye
 * sayfa bozulmaz — izleme her zaman ikincil.
 */
export function track(event: AnalyticsEvent, data?: EventData) {
  if (typeof window === 'undefined') return;
  window.umami?.track(event, data);
}

/**
 * Sunucuda cizilen baglara olay takmanin yolu. Bilesenin istemciye
 * gecmesi gerekmez: Analytics bileseni tek bir yakalayici dinleyiciyle
 * bu ozniteligi tasiyan ogeleri toplar.
 *
 * data-track-event  → olay adi
 * data-track-*      → olayla giden veri (data-track-kaynak="tablo")
 */
export const TRACK_ATTRIBUTE = 'data-track-event';
export const TRACK_DATA_PREFIX = 'data-track-';

/**
 * Kaynak bagi olayinda tam adres degil yalnizca alan adi tasinir.
 * Hangi yayinlarin okundugunu bilmek isteriz; kimin hangi satirdaki
 * hangi bagi actigini degil.
 */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'gecersiz';
  }
}
