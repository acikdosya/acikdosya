import {inflateSync} from 'node:zlib';

/**
 * Kucuk bir PNG cozucu — cizilmis ciktinin sinanmasi icin.
 *
 * Uygulama kodu bunu ICE AKTARMAZ. Rotalar PNG uretir, okumaz; buradaki
 * tek tuketici testler. Yine de lib altinda duruyor cunku sinadigi sey
 * paylasim gorselinin kendisi: "font dogru yuklendi mi" sorusunun cevabi
 * ancak piksellerde var. Bagimlilik eklemedik, node:zlib yetiyor.
 *
 * Kapsam bilincli olarak dar: 8 bit derinlik, araligi bozulmamis
 * (interlace yok) RGBA ya da RGB. resvg tam olarak boyle yaziyor; baska
 * bir bicim gelirse sessizce yanlis okumak yerine hata atiyoruz.
 */

export type Bitmap = {
  width: number;
  height: number;
  channels: number;
  data: Buffer;
};

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** PNG satir filtrelerini geri alir — spec 9.2. */
function unfilter(raw: Buffer, width: number, height: number, channels: number): Buffer {
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let read = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[read++];
    const line = raw.subarray(read, read + stride);
    read += stride;

    const prev =
      y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let value = line[x];

      switch (filter) {
        case 0:
          break;
        case 1:
          value += a;
          break;
        case 2:
          value += b;
          break;
        case 3:
          value += (a + b) >> 1;
          break;
        case 4: {
          const estimate = a + b - c;
          const da = Math.abs(estimate - a);
          const db = Math.abs(estimate - b);
          const dc = Math.abs(estimate - c);
          value += da <= db && da <= dc ? a : db <= dc ? b : c;
          break;
        }
        default:
          throw new Error(`bilinmeyen PNG satir filtresi: ${filter}`);
      }

      cur[x] = value & 0xff;
    }
  }

  return out;
}

export function decodePng(buffer: Buffer): Bitmap {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('PNG imzasi yok');
  }

  let position = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  const chunks: Buffer[] = [];

  while (position < buffer.length) {
    const length = buffer.readUInt32BE(position);
    const kind = buffer.toString('ascii', position + 4, position + 8);
    const data = buffer.subarray(position + 8, position + 8 + length);

    if (kind === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('araligi bozulmus PNG desteklenmiyor');
    } else if (kind === 'IDAT') {
      chunks.push(data);
    } else if (kind === 'IEND') {
      break;
    }

    position += 12 + length;
  }

  if (depth !== 8) throw new Error(`8 bit bekleniyordu, ${depth} geldi`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (channels === 0) throw new Error(`desteklenmeyen renk turu: ${colorType}`);

  return {
    width,
    height,
    channels,
    data: unfilter(inflateSync(Buffer.concat(chunks)), width, height, channels)
  };
}

/**
 * Koyu piksellerin sinir kutusu. Kartlarin zemini acik, yazisi koyu;
 * esik ikisinin arasinda genis bir bosluga dusuyor.
 */
export function inkBox(
  bitmap: Bitmap
): {x: number; y: number; width: number; height: number} | undefined {
  const {width, height, channels, data} = bitmap;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;
      const alpha = channels === 4 ? data[index + 3] : 255;
      if (alpha < 128) continue;
      if (data[index] > 127) continue;

      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) return undefined;
  return {x: left, y: top, width: right - left + 1, height: bottom - top + 1};
}

/** Sinir kutusuna kirpilmis piksel dizisi — iki cizimi karsilastirmak icin. */
export function inkPixels(bitmap: Bitmap): Buffer {
  const box = inkBox(bitmap);
  if (!box) return Buffer.alloc(0);

  const {width, channels, data} = bitmap;
  const out = Buffer.alloc(box.width * box.height * channels);

  for (let y = 0; y < box.height; y++) {
    const from = ((box.y + y) * width + box.x) * channels;
    data.copy(out, y * box.width * channels, from, from + box.width * channels);
  }

  return out;
}
