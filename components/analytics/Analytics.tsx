'use client';

import Script from 'next/script';
import {useEffect} from 'react';
import {
  isAnalyticsEvent,
  track,
  TRACK_ATTRIBUTE,
  TRACK_DATA_PREFIX
} from '@/lib/analytics';
import {
  ANALYTICS_HOST_URL,
  ANALYTICS_SCRIPT_URL,
  ANALYTICS_WEBSITE_ID
} from '@/lib/config';

/**
 * Olcum baslatici — CLAUDE.md §6 ve §5.
 *
 * Iki is yapiyor:
 *  1. Umami tarayici script'ini kendi origin'imizden yukler.
 *  2. Sunucuda cizilen baglara tek bir yakalayici dinleyiciyle olay takar.
 *
 * Ikinci madde neden var: kaynak baglari ve yontem bagi sunucu
 * bileşenlerinde ciziliyor. Her birine onClick vermek o bilesenleri
 * istemciye tasirdi. Umami'nin kendi data-umami-event ozniteligi de var
 * ama o, bagi tiklandiginda preventDefault edip istegi bekliyor: ic
 * gezinme tam sayfa yuklemesine dusuyor ve olcum yavassa bag takiliyor.
 * Kendi dinleyicimiz gezinmeye dokunmaz; istek keepalive ile yolda kalir.
 */
export function Analytics() {
  useEffect(() => {
    if (!ANALYTICS_WEBSITE_ID) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest(`[${TRACK_ATTRIBUTE}]`);
      if (!element) return;

      const name = element.getAttribute(TRACK_ATTRIBUTE);
      /* Yazim hatasi panelde ayri bir olay olarak birikmez, burada duser. */
      if (!name || !isAnalyticsEvent(name)) return;

      const data: Record<string, string> = {};
      for (const attribute of element.attributes) {
        if (attribute.name === TRACK_ATTRIBUTE) continue;
        if (!attribute.name.startsWith(TRACK_DATA_PREFIX)) continue;
        data[attribute.name.slice(TRACK_DATA_PREFIX.length)] = attribute.value;
      }

      track(name, data);
    }

    /* Yakalama evresi: arada duran bir onClick olayi yutarsa da sayilir. */
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!ANALYTICS_WEBSITE_ID) return null;

  return (
    <Script
      src={ANALYTICS_SCRIPT_URL}
      /*
       * Olcum ilk boyamanin onune gecmez: script window 'load' sonrasi,
       * tarayici bos kaldiginda inar (CLAUDE.md §6). Gec baglanma riski
       * yok — next/script'in bilesen yolu (loadLazyScript) load olayi
       * zaten gectiyse readyState'e bakip hemen kuyruga alir.
       */
      strategy="lazyOnload"
      data-website-id={ANALYTICS_WEBSITE_ID}
      data-host-url={ANALYTICS_HOST_URL}
      /* Tarayici "izleme" diyorsa izlenmez. */
      data-do-not-track="true"
      /*
       * Sorgu dizesi kaydedilmez. Menzil zarfi referans noktasini URL'de
       * tasiyor (?ref=41.0,29.0); o nokta ziyaretcinin sectigi bir konum,
       * kaydi tutulmaz.
       */
      data-exclude-search="true"
    />
  );
}
