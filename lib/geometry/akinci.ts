import type {AircraftProfile} from './aircraft';

/**
 * AKINCI dis profili.
 *
 * OLCEK KAYNAKLI, BICIM DEGIL. Modelin olcegi iki yayimlanmis sayidan
 * gelir: uzunluk 12,2 m ve kanat acikligi 20 m — content/systems/akinci.json,
 * BAYKAR urun sayfasi. Asagidaki oranlarin hicbiri yayimlanmis bir sayi
 * degildir.
 *
 * Oranlarin iki farkli kaynagi var, karistirilmamali:
 *
 * OLCULEN — ureticinin yayimladigi gorsellerden piksel olcumuyle
 * cikarildi (11.09.2026'da goruldu):
 *   - on gorunus render'i
 *     cdn.baykartech.com/media/upload/userFormUpload/RqpaU6eZjeknYwWcpdMVAXYMLRcyuvT3.png
 *   - urun sayfasindaki 360° gosterinin yan ve on kareleri
 *     cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-akinci/
 * Yontem: saydamlik maskesinin sinir kutusu kanat acikligina (20 m) ve
 * govde uzunluguna (12,2 m) olceklendi, sonra oran okundu. Iki kare
 * birbirinden bagimsiz olceklendiginde %0,2 icinde ortustu.
 *
 * Gorsellerin kendisi depoya GIRMEZ ve saklanmaz — telif BAYKAR'da.
 * Alinan sey goruntu degil, orandir.
 *
 * SECILEN — gorselden cikarilamayan, okunabilir bir sema icin secilmis
 * degerler. Yanlarinda gerekcesi yazili.
 *
 * Modellenmeyenler: motor gondollari ve pervane, iniş takimi, anten
 * diregi, yuk istasyonu ve tasinan muhimmat. Iniş takimi modellenmedigi
 * icin modelin dikey olcusu tablodaki 4,1 m degildir; o deger takim
 * acikken olculen toplam yuksekliktir (yan gorunuste govde ekseninin
 * 2,5 m ustundeki kuyruk ucu + yerden govde eksenine ~1,6 m, toplami
 * yayimlanan degere denk geliyor).
 */
export const AKINCI_PROFILE: AircraftProfile = {
  /** OLCULEN: on gorunuste govde eni ~1,1 m. */
  fuselageRatio: 0.09,
  /** OLCULEN: yan gorunuste govde tam capa t≈0,14'te ulasiyor. */
  noseRatio: 0.14,
  /** OLCULEN: daralma t≈0,55'te basliyor ve kuyruga kadar suruyor. */
  tailConeRatio: 0.45,
  /** OLCULEN: kuyruk ucu capi govde capinin ~beste biri. */
  tailTipRatio: 0.22,
  /** OLCULEN: kanat kokunun hucum kenari t≈0,27. */
  wingPositionT: 0.27,
  /** OLCULEN: kok veche ~2,7 m. */
  wingChordRatio: 0.22,
  /** OLCULEN: uc veche kok vechenin ucte birinden biraz fazlasi. */
  wingTaper: 0.35,
  /**
   * SECILEN: ok acisi yalniz ust gorunusten okunur, 360° gosteri yatay
   * yorungede donuyor ve ust kare yok. Kucuk bir deger birakildi.
   */
  wingSweepDeg: 3,
  /** OLCULEN: on gorunuste kanat kalinligi ~0,24 m. */
  wingThicknessRatio: 0.09,
  /** OLCULEN: on gorunuste son %7'lik pay yukari donuyor. */
  tipSpanRatio: 0.07,
  /** OLCULEN: uc, kanat duzleminin ~0,4 m ustune cikiyor. */
  tipRiseDeg: 30,
  /** OLCULEN: kuyruk kokunun hucum kenari t≈0,78. */
  tailPositionT: 0.78,
  /** OLCULEN: yan gorunuste kuyruk ucu govde ekseninin 2,5 m ustunde. */
  tailHeightRatio: 0.205,
  /** OLCULEN: kuyruk kok vechesi ~2,2 m. */
  tailChordRatio: 0.18,
  /**
   * SECILEN: V'nin acikligi ancak temiz bir arka gorunusten olculur;
   * mevcut karede kanat, iniş takimi ve yuk istasyonlari onu kapatiyor.
   * Bu alandaki yaygin V kuyruk acisi alindi. Kuyruk ucunun YUKSEKLIGI
   * olculmus oldugu icin acinin degismesi panel boyunu degistirir,
   * modelin yuksekligini degil.
   */
  tailDihedralDeg: 35
};
