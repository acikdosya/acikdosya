import localFont from 'next/font/local';

/**
 * Fontlar self-host — Google CDN yok (CLAUDE.md §2).
 * Kaynak: fontsource variable paketleri, ikisi de SIL OFL 1.1.
 * Lisans metinleri bu dizinde.
 *
 * Turkce icin iki alt kume de gerekli:
 *   ü ö ç ı → latin (U+0131 dahil)
 *   ğ ş İ Ğ Ş → latin-ext (U+011E-011F, U+015E-015F, U+0130)
 * Tarayici ilk ailede glyph bulamazsa siradakine duser, bu yuzden
 * globals.css'teki font stack'inde once latin sonra latin-ext gelir.
 */

/**
 * NOT: next/font degerleri literal olmak zorunda, bu yuzden unicode-range
 * dizeleri asagida tekrar ediyor. Sabite alinamaz.
 */

/** Baslik, sayi, UI. Tabular figurler globals.css'te aciliyor. */
export const archivo = localFont({
  src: './archivo-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-archivo',
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'sans-serif'],
  declarations: [
    {
      prop: 'unicode-range', value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
    }
  ]
});

export const archivoExt = localFont({
  src: './archivo-latin-ext-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-archivo-ext',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
  declarations: [
    {
      prop: 'unicode-range', value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
    }
  ]
});

/** Govde metni — 18px / 1.62. */
export const sourceSerif = localFont({
  src: './source-serif-4-latin-wght-normal.woff2',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-source-serif',
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'serif'],
  declarations: [
    {
      prop: 'unicode-range', value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
    }
  ]
});

export const sourceSerifExt = localFont({
  src: './source-serif-4-latin-ext-wght-normal.woff2',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-source-serif-ext',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
  declarations: [
    {
      prop: 'unicode-range', value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
    }
  ]
});

export const fontVariables = [
  archivo.variable,
  archivoExt.variable,
  sourceSerif.variable,
  sourceSerifExt.variable
].join(' ');
