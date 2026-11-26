import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { isValidIsbn, normalizeIsbn } from '../utils/isbn.utils';

export type BarcodeEngineKind = 'native' | 'wasm';

export interface BarcodeDetectionResult {
  rawValue: string;
  normalizedIsbn: string;
  format: string;
}

export type ImageFileDecodeResult =
  | { status: 'isbn'; isbn: string }
  | { status: 'invalid-barcode'; rawValue: string }
  | { status: 'no-barcode' };

export interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
}

export interface BarcodeDetectorCtorLike {
  getSupportedFormats(): Promise<readonly string[]>;
  new (options?: { formats?: readonly string[] }): BarcodeDetectorLike;
}

export interface BarcodePonyfillModule {
  BarcodeDetector: BarcodeDetectorCtorLike;
  prepareZXingModule: (options?: {
    overrides?: { locateFile?: (path: string, prefix?: string) => string };
  }) => unknown;
}

export interface BarcodeDecoderEnvironment {
  getNativeDetector?: () => BarcodeDetectorCtorLike | undefined;
  loadPonyfill?: () => Promise<BarcodePonyfillModule>;
  baseUri?: string;
}

export const BARCODE_DECODER_ENV = new InjectionToken<BarcodeDecoderEnvironment>(
  'BARCODE_DECODER_ENV'
);

export const ISBN_BARCODE_FORMATS = ['ean_13', 'ean_8'] as const;

const LOCAL_WASM_RELATIVE_PATH = 'assets/wasm/zxing_reader.wasm';

/** Resolves the local ZXing WASM binary URL against `document.baseURI` for subpath deployments. */
export function resolveLocalWasmUrl(baseUri?: string): string {
  const resolvedBase = baseUri ?? (typeof document !== 'undefined' ? document.baseURI : '');
  if (resolvedBase) {
    try {
      return new URL(LOCAL_WASM_RELATIVE_PATH, resolvedBase).toString();
    } catch {
      // Fall back to root-relative path if baseURI is malformed
    }
  }
  return `/${LOCAL_WASM_RELATIVE_PATH}`;
}

@Injectable({ providedIn: 'root' })
export class BarcodeDecoderService {
  private readonly env = inject(BARCODE_DECODER_ENV, { optional: true });

  /** Currently active barcode decoding engine (`'native'`, `'wasm'`, or `null` before first use). */
  readonly activeEngine = signal<BarcodeEngineKind | null>(null);

  private detectorPromise: Promise<BarcodeDetectorLike> | null = null;

  /** Lazily initializes and memoizes either the native `BarcodeDetector` or local WASM ponyfill. */
  async ensureDetector(): Promise<BarcodeDetectorLike> {
    if (!this.detectorPromise) {
      this.detectorPromise = this.createDetector().catch((error: unknown) => {
        this.detectorPromise = null;
        throw error;
      });
    }
    return this.detectorPromise;
  }

  /** Detects raw barcodes from any `ImageBitmapSource` without ISBN filtering. */
  async detectRawBarcodes(
    source: ImageBitmapSource
  ): Promise<Array<{ rawValue: string; format: string }>> {
    const detector = await this.ensureDetector();
    return detector.detect(source);
  }

  /** Decodes a valid ISBN barcode from a live `<video>` frame, skipping unready frames. */
  async decodeFromVideo(video: HTMLVideoElement): Promise<BarcodeDetectionResult | null> {
    if (
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return null;
    }

    const detections = await this.detectRawBarcodes(video);
    for (const detection of detections) {
      const normalizedIsbn = normalizeIsbn(detection.rawValue);
      if (normalizedIsbn && isValidIsbn(normalizedIsbn)) {
        return {
          rawValue: detection.rawValue,
          normalizedIsbn,
          format: detection.format,
        };
      }
    }
    return null;
  }

  /** Decodes an ISBN barcode from a static uploaded image file and cleans up decoded resources. */
  async decodeFromImageFile(file: File): Promise<ImageFileDecodeResult> {
    const detector = await this.ensureDetector();

    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        try {
          return this.classifyDetections(await detector.detect(bitmap));
        } finally {
          bitmap.close();
        }
      } catch {
        // Fall back to HTMLImageElement decoding when createImageBitmap is unsupported or fails
      }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await this.loadImageFromUrl(objectUrl);
      const detections = await detector.detect(image);
      return this.classifyDetections(detections);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private classifyDetections(
    detections: Array<{ rawValue: string; format: string }>
  ): ImageFileDecodeResult {
    if (detections.length === 0) {
      return { status: 'no-barcode' };
    }

    for (const detection of detections) {
      const normalizedIsbn = normalizeIsbn(detection.rawValue);
      if (normalizedIsbn && isValidIsbn(normalizedIsbn)) {
        return { status: 'isbn', isbn: normalizedIsbn };
      }
    }

    return { status: 'invalid-barcode', rawValue: detections[0].rawValue };
  }

  private async createDetector(): Promise<BarcodeDetectorLike> {
    const nativeCtor = this.getNativeDetectorCtor();
    if (nativeCtor) {
      try {
        const supportedFormats = await nativeCtor.getSupportedFormats();
        const supportsIsbn = ISBN_BARCODE_FORMATS.every((fmt) => supportedFormats.includes(fmt));
        if (supportsIsbn) {
          const detector = new nativeCtor({ formats: [...ISBN_BARCODE_FORMATS] });
          this.activeEngine.set('native');
          return detector;
        }
      } catch {
        // Native BarcodeDetector inspection failed; fall back to local WASM ponyfill
      }
    }

    const ponyfill = await this.loadPonyfillModule();
    ponyfill.prepareZXingModule({
      overrides: {
        locateFile: (path: string) =>
          path.endsWith('.wasm') ? resolveLocalWasmUrl(this.env?.baseUri) : path,
      },
    });

    const detector = new ponyfill.BarcodeDetector({ formats: [...ISBN_BARCODE_FORMATS] });
    this.activeEngine.set('wasm');
    return detector;
  }

  private getNativeDetectorCtor(): BarcodeDetectorCtorLike | undefined {
    if (this.env?.getNativeDetector) {
      return this.env.getNativeDetector();
    }
    if (typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis) {
      return (globalThis as { BarcodeDetector?: BarcodeDetectorCtorLike }).BarcodeDetector;
    }
    return undefined;
  }

  private async loadPonyfillModule(): Promise<BarcodePonyfillModule> {
    if (this.env?.loadPonyfill) {
      return this.env.loadPonyfill();
    }
    const mod = await import('barcode-detector/ponyfill');
    return mod as unknown as BarcodePonyfillModule;
  }

  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode uploaded image file'));
      img.src = url;
    });
  }
}
