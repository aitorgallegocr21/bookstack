import { describe, it, expect } from 'vitest';
import {
  binaryToDataUrl,
  computeCrc32,
  createZipArchive,
  dataUrlToBinary,
  readZipArchive,
} from './zip-archive.utils';

describe('zip-archive.utils', () => {
  it('computes standard IEEE 802.3 CRC-32 for known vectors', () => {
    const bytes = new TextEncoder().encode('123456789');
    expect(computeCrc32(bytes)).toBe(0xcbf43926);
  });

  it('round-trips UTF-8 text and binary entries in a PKZIP archive', async () => {
    const binaryCover = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x01, 0xff, 0x42]);
    const zipBytes = createZipArchive([
      { path: 'backup.json', data: '{"title":"El Quijote — Edición"}' },
      { path: '/covers/book-1.webp', data: binaryCover },
    ]);

    const entries = await readZipArchive(zipBytes);
    expect(entries.size).toBe(2);
    expect(new TextDecoder().decode(entries.get('backup.json'))).toBe(
      '{"title":"El Quijote — Edición"}'
    );
    expect(entries.get('covers/book-1.webp')).toEqual(binaryCover);
  });

  it('supports deflate-compressed ZIP entries via DecompressionStream when available', async () => {
    if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') {
      return;
    }

    const originalText = 'BookStack deflate-raw test payload '.repeat(12);
    const plainBytes = new TextEncoder().encode(originalText);
    const crc = computeCrc32(plainBytes);
    const sourceStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(plainBytes);
        controller.close();
      },
    });
    const deflatedStream = sourceStream.pipeThrough(
      new CompressionStream('deflate-raw') as unknown as TransformStream<Uint8Array, Uint8Array>
    );
    const deflatedBytes = new Uint8Array(await new Response(deflatedStream).arrayBuffer());

    const nameBytes = new TextEncoder().encode('notes.txt');
    const totalSize = 30 + nameBytes.length + deflatedBytes.length + 46 + nameBytes.length + 22;
    const archive = new Uint8Array(totalSize);
    const view = new DataView(archive.buffer);

    // Local header (method 8 = deflate)
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 8, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, deflatedBytes.length, true);
    view.setUint32(22, plainBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    archive.set(nameBytes, 30);
    archive.set(deflatedBytes, 30 + nameBytes.length);

    const cdOffset = 30 + nameBytes.length + deflatedBytes.length;
    view.setUint32(cdOffset, 0x02014b50, true);
    view.setUint16(cdOffset + 4, 20, true);
    view.setUint16(cdOffset + 6, 20, true);
    view.setUint16(cdOffset + 8, 0x0800, true);
    view.setUint16(cdOffset + 10, 8, true);
    view.setUint32(cdOffset + 16, crc, true);
    view.setUint32(cdOffset + 20, deflatedBytes.length, true);
    view.setUint32(cdOffset + 24, plainBytes.length, true);
    view.setUint16(cdOffset + 28, nameBytes.length, true);
    view.setUint32(cdOffset + 42, 0, true);
    archive.set(nameBytes, cdOffset + 46);

    const eocdOffset = cdOffset + 46 + nameBytes.length;
    view.setUint32(eocdOffset, 0x06054b50, true);
    view.setUint16(eocdOffset + 8, 1, true);
    view.setUint16(eocdOffset + 10, 1, true);
    view.setUint32(eocdOffset + 12, 46 + nameBytes.length, true);
    view.setUint32(eocdOffset + 16, cdOffset, true);

    const unpacked = await readZipArchive(archive);
    expect(new TextDecoder().decode(unpacked.get('notes.txt'))).toBe(originalText);
  });

  it('rejects corrupted CRC-32 or invalid ZIP buffers', async () => {
    await expect(readZipArchive(new Uint8Array([1, 2, 3]))).rejects.toThrow();

    const zipBytes = createZipArchive([{ path: 'hello.txt', data: 'world' }]);
    // Corrupt one byte inside the stored file payload
    const corrupted = new Uint8Array(zipBytes);
    corrupted[30 + 'hello.txt'.length] ^= 0xff;
    await expect(readZipArchive(corrupted)).rejects.toThrow(/CRC-32/);
  });

  it('converts data URLs to binary and back cleanly', () => {
    const sampleBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const dataUrl = binaryToDataUrl(sampleBytes, 'image/png');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);

    const parsed = dataUrlToBinary(dataUrl);
    expect(parsed).not.toBeNull();
    expect(parsed?.extension).toBe('png');
    expect(parsed?.mimeType).toBe('image/png');
    expect(parsed?.bytes).toEqual(sampleBytes);

    expect(dataUrlToBinary('https://example.com/cover.jpg')).toBeNull();
    expect(dataUrlToBinary('data:text/html;base64,PGgxPkJhZDwvaDE+')).toBeNull();
  });
});
