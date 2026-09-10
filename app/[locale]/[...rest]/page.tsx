import {notFound} from 'next/navigation';

/**
 * Yerel onekli ama karsiligi olmayan her adres buraya duser ve 404'u
 * tetikler. Bu olmadan Next kok seviyesindeki varsayilan 404'u cizerdi;
 * o sayfa bizim kabugumuzun ve dilimizin disinda kalir.
 */
export default function CatchAll() {
  notFound();
}
