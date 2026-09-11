/**
 * ATMACA dis profili.
 *
 * Bu degerler yapisal olcu degildir; govde biciminin genel hatlaridir.
 * Kanatcik profili ve burun egimi icin henuz lisansli bir referans
 * bulunamadigindan (content/systems/atmaca.json _todo), mevcut degerler
 * yaygin seyir fuzesi oranlarina gore secilmistir. Ozel geometri
 * eklendiginde bu dosya genisletilir; secim mekanizmasi ayni kalir.
 */
export const ATMACA_PROFILE = {
  /** Daha sivri burun profili. */
  noseRatio: 0.18,
  /** Hafif kuyruk daralmasi. */
  boattail: 0.92,
  /** Su-ustu fuzelerde yaygin dort kanatcik dizilimi. */
  finCount: 4
} as const;
