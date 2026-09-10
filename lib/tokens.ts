/**
 * Paletin JS kopyasi.
 *
 * TEK KAYNAK app/globals.css'tir. Burasi yalnizca CSS degiskeni okuyamayan
 * API'ler icin var: MapLibre marker rengi ve next/og ImageResponse (satori
 * var() cozmez). globals.css degisirse burasi da degisir — ikisi ayrisirsa
 * harita ve paylasim gorseli sayfadan farkli renkte cikar.
 */
export const PALETTE = {
  ground: '#e4e5e1',
  paper: '#f3f4f1',
  ink: '#1c2124',
  ink2: '#5c6367',
  rule: '#c6c9c3',
  signal: '#b3131b',
  /** Koyu zeminde kirmizi — --signal koyu uzerinde okunmuyor. */
  signalOnDark: '#e4535a'
} as const;
