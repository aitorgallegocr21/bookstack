export interface ZipEntryInput {
  path: string;
  data: Uint8Array | string;
}

export interface BinaryCoverData {
  bytes: Uint8Array;
  extension: 'webp' | 'jpg' | 'png';
  mimeType: string;
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIR_HEADER_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const DEFLATE_METHOD = 8;

const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder('utf-8');

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

const BASE64_CHUNK_SIZE = 0x8000;
const RASTER_DATA_URL_REGEX = /^data:(image\/(webp|jpeg|jpg|png));base64,([a-z0-9+/=\s]+)$/i;

/**
 * Computes the standard IEEE 802.3 CRC-32 checksum for a byte array.
 */
export function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Converts a `data:image/...;base64,...` URL into raw binary bytes and normalized file metadata.
 */
export function dataUrlToBinary(dataUrl: string): BinaryCoverData | null {
  const match = RASTER_DATA_URL_REGEX.exec(dataUrl.trim());
  if (!match) {
    return null;
  }

  const rawMime = match[1].toLowerCase();
  const base64Body = match[3].replace(/\s+/g, '');

  let extension: 'webp' | 'jpg' | 'png';
  let mimeType: string;

  if (rawMime === 'image/webp') {
    extension = 'webp';
    mimeType = 'image/webp';
  } else if (rawMime === 'image/png') {
    extension = 'png';
    mimeType = 'image/png';
  } else {
    extension = 'jpg';
    mimeType = 'image/jpeg';
  }

  try {
    const binaryString = atob(base64Body);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { bytes, extension, mimeType };
  } catch {
    return null;
  }
}

/**
 * Encodes raw image bytes into a `data:<mimeType>;base64,...` URL without overflowing call stacks.
 */
export function binaryToDataUrl(bytes: Uint8Array, mimeType: string): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    const slice = bytes.subarray(offset, offset + BASE64_CHUNK_SIZE);
    chunks.push(String.fromCharCode(...slice));
  }
  return `data:${mimeType};base64,${btoa(chunks.join(''))}`;
}

/**
 * Creates a standard PKZIP archive (Store method 0) with UTF-8 filenames and CRC-32 checksums.
 */
export function createZipArchive(entries: readonly ZipEntryInput[]): Uint8Array {
  const { dosTime, dosDate } = toDosDateTime(new Date());

  const prepared = entries.map((entry) => {
    const normalizedPath = normalizeZipPath(entry.path);
    const nameBytes = UTF8_ENCODER.encode(normalizedPath);
    const dataBytes = typeof entry.data === 'string' ? UTF8_ENCODER.encode(entry.data) : entry.data;
    const crc = computeCrc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localSectionSize = 0;
  let centralDirSize = 0;
  for (const item of prepared) {
    localSectionSize += 30 + item.nameBytes.length + item.dataBytes.length;
    centralDirSize += 46 + item.nameBytes.length;
  }

  const totalSize = localSectionSize + centralDirSize + 22;
  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);

  let offset = 0;
  const localOffsets: number[] = [];

  for (const item of prepared) {
    localOffsets.push(offset);
    view.setUint32(offset, LOCAL_FILE_HEADER_SIGNATURE, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, UTF8_FLAG, true);
    view.setUint16(offset + 8, STORE_METHOD, true);
    view.setUint16(offset + 10, dosTime, true);
    view.setUint16(offset + 12, dosDate, true);
    view.setUint32(offset + 14, item.crc, true);
    view.setUint32(offset + 18, item.dataBytes.length, true);
    view.setUint32(offset + 22, item.dataBytes.length, true);
    view.setUint16(offset + 26, item.nameBytes.length, true);
    view.setUint16(offset + 28, 0, true);
    output.set(item.nameBytes, offset + 30);
    output.set(item.dataBytes, offset + 30 + item.nameBytes.length);
    offset += 30 + item.nameBytes.length + item.dataBytes.length;
  }

  const centralDirOffset = offset;

  for (let i = 0; i < prepared.length; i++) {
    const item = prepared[i];
    view.setUint32(offset, CENTRAL_DIR_HEADER_SIGNATURE, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 20, true);
    view.setUint16(offset + 8, UTF8_FLAG, true);
    view.setUint16(offset + 10, STORE_METHOD, true);
    view.setUint16(offset + 12, dosTime, true);
    view.setUint16(offset + 14, dosDate, true);
    view.setUint32(offset + 16, item.crc, true);
    view.setUint32(offset + 20, item.dataBytes.length, true);
    view.setUint32(offset + 24, item.dataBytes.length, true);
    view.setUint16(offset + 28, item.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, localOffsets[i], true);
    output.set(item.nameBytes, offset + 46);
    offset += 46 + item.nameBytes.length;
  }

  view.setUint32(offset, EOCD_SIGNATURE, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, centralDirSize, true);
  view.setUint32(offset + 16, centralDirOffset, true);
  view.setUint16(offset + 20, 0, true);

  return output;
}

/**
 * Unpacks a PKZIP archive into a map of normalized entry paths to raw bytes.
 * Supports Store (0) and Deflate (8, via native `DecompressionStream`) entries.
 */
export async function readZipArchive(zipBytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  if (zipBytes.length < 22) {
    throw new Error('Invalid ZIP archive: file is too small.');
  }

  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const eocdOffset = findEocdOffset(view, zipBytes.length);
  if (eocdOffset < 0) {
    throw new Error('Invalid ZIP archive: End of Central Directory not found.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map<string, Uint8Array>();

  let cursor = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (
      cursor + 46 > zipBytes.length ||
      view.getUint32(cursor, true) !== CENTRAL_DIR_HEADER_SIGNATURE
    ) {
      throw new Error('Invalid ZIP archive: corrupted central directory header.');
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const expectedCrc = view.getUint32(cursor + 16, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const nameBytes = zipBytes.subarray(cursor + 46, cursor + 46 + nameLen);
    const entryName = normalizeZipPath(UTF8_DECODER.decode(nameBytes));
    cursor += 46 + nameLen + extraLen + commentLen;

    if (entryName.endsWith('/') || entryName.length === 0) {
      continue;
    }

    if (
      localHeaderOffset + 30 > zipBytes.length ||
      view.getUint32(localHeaderOffset, true) !== LOCAL_FILE_HEADER_SIGNATURE
    ) {
      throw new Error(`Invalid ZIP archive: corrupted local header for "${entryName}".`);
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > zipBytes.length) {
      throw new Error(`Invalid ZIP archive: truncated data for "${entryName}".`);
    }

    const compressedSlice = zipBytes.subarray(dataStart, dataEnd);
    let entryBytes: Uint8Array;

    if (compressionMethod === STORE_METHOD) {
      entryBytes = zipBytes.slice(dataStart, dataEnd);
    } else if (compressionMethod === DEFLATE_METHOD) {
      entryBytes = await inflateRawBytes(compressedSlice);
    } else {
      throw new Error(
        `Unsupported ZIP compression method (${compressionMethod}) for "${entryName}".`
      );
    }

    if (computeCrc32(entryBytes) !== expectedCrc) {
      throw new Error(`Corrupted ZIP entry "${entryName}": CRC-32 checksum mismatch.`);
    }

    entries.set(entryName, entryBytes);
  }

  return entries;
}

function findEocdOffset(view: DataView, byteLength: number): number {
  const minOffset = Math.max(0, byteLength - 65_557);
  for (let offset = byteLength - 22; offset >= minOffset; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }
  return -1;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined' || typeof ReadableStream === 'undefined') {
    throw new Error('Deflate-compressed ZIP archives require browser DecompressionStream support.');
  }

  const sourceStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(compressed));
      controller.close();
    },
  });
  const stream = sourceStream.pipeThrough(
    new DecompressionStream('deflate-raw') as unknown as TransformStream<Uint8Array, Uint8Array>
  );
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
      totalLength += value.byteLength;
    }
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function normalizeZipPath(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function toDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  return { dosTime, dosDate };
}
