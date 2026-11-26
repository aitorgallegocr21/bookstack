import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BARCODE_DECODER_ENV,
  type BarcodeDecoderEnvironment,
  type BarcodeDetectorCtorLike,
  type BarcodeDetectorLike,
  BarcodeDecoderService,
  ISBN_BARCODE_FORMATS,
  resolveLocalWasmUrl,
} from './barcode-decoder.service';

describe('BarcodeDecoderService', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalImage = globalThis.Image;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  function setupService(env: BarcodeDecoderEnvironment): BarcodeDecoderService {
    TestBed.configureTestingModule({
      providers: [BarcodeDecoderService, { provide: BARCODE_DECODER_ENV, useValue: env }],
    });
    return TestBed.inject(BarcodeDecoderService);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    globalThis.Image = originalImage;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    vi.restoreAllMocks();
  });

  describe('resolveLocalWasmUrl', () => {
    it('resolves zxing_reader.wasm against a subpath baseURI', () => {
      expect(resolveLocalWasmUrl('https://user.github.io/Bookstack/add')).toBe(
        'https://user.github.io/Bookstack/assets/wasm/zxing_reader.wasm'
      );
    });

    it('falls back to root-relative path when baseURI is empty', () => {
      expect(resolveLocalWasmUrl('')).toBe('/assets/wasm/zxing_reader.wasm');
    });
  });

  describe('engine resolution', () => {
    it('selects native BarcodeDetector when ean_13 and ean_8 are supported', async () => {
      const detectSpy = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([]);
      const ctorSpy = vi.fn();

      class MockNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8', 'qr_code']);
        constructor(options?: { formats?: readonly string[] }) {
          ctorSpy(options);
        }
        detect = detectSpy;
      }

      const loadPonyfillSpy = vi.fn();
      const service = setupService({
        getNativeDetector: () => MockNativeDetector as unknown as BarcodeDetectorCtorLike,
        loadPonyfill: loadPonyfillSpy,
      });

      const [first, second] = await Promise.all([
        service.ensureDetector(),
        service.ensureDetector(),
      ]);

      expect(first).toBe(second);
      expect(service.activeEngine()).toBe('native');
      expect(ctorSpy).toHaveBeenCalledTimes(1);
      expect(ctorSpy).toHaveBeenCalledWith({ formats: [...ISBN_BARCODE_FORMATS] });
      expect(loadPonyfillSpy).not.toHaveBeenCalled();
    });

    it('falls back to local WASM ponyfill when native BarcodeDetector is absent', async () => {
      const ponyfillDetect = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([]);
      const locateUrls: string[] = [];

      class MockPonyfillDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = ponyfillDetect;
      }

      const prepareZXingModule = vi.fn(
        (opts?: { overrides?: { locateFile?: (path: string) => string } }) => {
          const locate = opts?.overrides?.locateFile;
          if (locate) {
            locateUrls.push(locate('zxing_reader.wasm'));
            locateUrls.push(locate('other.js'));
          }
        }
      );

      const service = setupService({
        getNativeDetector: () => undefined,
        baseUri: 'https://example.com/Bookstack/',
        loadPonyfill: async () => ({
          BarcodeDetector: MockPonyfillDetector as unknown as BarcodeDetectorCtorLike,
          prepareZXingModule,
        }),
      });

      await service.ensureDetector();

      expect(service.activeEngine()).toBe('wasm');
      expect(prepareZXingModule).toHaveBeenCalledTimes(1);
      expect(locateUrls).toEqual([
        'https://example.com/Bookstack/assets/wasm/zxing_reader.wasm',
        'other.js',
      ]);
    });

    it('falls back to local WASM ponyfill when native BarcodeDetector lacks ean_13', async () => {
      class PartialNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['qr_code']);
        detect = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([]);
      }

      class MockPonyfillDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([]);
      }

      const prepareZXingModule = vi.fn();
      const service = setupService({
        getNativeDetector: () => PartialNativeDetector as unknown as BarcodeDetectorCtorLike,
        loadPonyfill: async () => ({
          BarcodeDetector: MockPonyfillDetector as unknown as BarcodeDetectorCtorLike,
          prepareZXingModule,
        }),
      });

      await service.ensureDetector();

      expect(service.activeEngine()).toBe('wasm');
      expect(prepareZXingModule).toHaveBeenCalledTimes(1);
    });
  });

  describe('decodeFromVideo', () => {
    it('skips unready video frames with videoWidth === 0 without calling detector', async () => {
      const detectSpy = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([]);
      class MockNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = detectSpy;
      }

      const service = setupService({
        getNativeDetector: () => MockNativeDetector as unknown as BarcodeDetectorCtorLike,
      });

      const unreadyVideo = {
        readyState: HTMLMediaElement.HAVE_METADATA,
        videoWidth: 0,
        videoHeight: 0,
      } as unknown as HTMLVideoElement;

      const result = await service.decodeFromVideo(unreadyVideo);

      expect(result).toBeNull();
      expect(detectSpy).not.toHaveBeenCalled();
    });

    it('returns the first valid normalized ISBN-13/ISBN-10 from a ready video frame', async () => {
      const detectSpy = vi.fn<BarcodeDetectorLike['detect']>().mockResolvedValue([
        { rawValue: '4006381333931', format: 'ean_13' },
        { rawValue: '0-306-40615-2', format: 'ean_13' },
      ]);

      class MockNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = detectSpy;
      }

      const service = setupService({
        getNativeDetector: () => MockNativeDetector as unknown as BarcodeDetectorCtorLike,
      });

      const readyVideo = {
        readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
        videoWidth: 1280,
        videoHeight: 720,
      } as unknown as HTMLVideoElement;

      const result = await service.decodeFromVideo(readyVideo);

      expect(result).toEqual({
        rawValue: '0-306-40615-2',
        normalizedIsbn: '9780306406157',
        format: 'ean_13',
      });
    });
  });

  describe('decodeFromImageFile', () => {
    it('uses createImageBitmap, closes it, and returns isbn status when valid', async () => {
      const closeSpy = vi.fn();
      const fakeBitmap = { close: closeSpy } as unknown as ImageBitmap;
      globalThis.createImageBitmap = vi.fn(async () => fakeBitmap);

      const detectSpy = vi
        .fn<BarcodeDetectorLike['detect']>()
        .mockResolvedValue([{ rawValue: '978-0-306-40615-7', format: 'ean_13' }]);

      class MockNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = detectSpy;
      }

      const service = setupService({
        getNativeDetector: () => MockNativeDetector as unknown as BarcodeDetectorCtorLike,
      });

      const file = new File(['mock'], 'cover.jpg', { type: 'image/jpeg' });
      const result = await service.decodeFromImageFile(file);

      expect(result).toEqual({ status: 'isbn', isbn: '9780306406157' });
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to HTMLImageElement + object URL and distinguishes invalid-barcode and no-barcode', async () => {
      // Simulate environment without createImageBitmap
      (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap =
        undefined;

      const createUrlSpy = vi.fn(() => 'blob:mock-image');
      const revokeUrlSpy = vi.fn();
      URL.createObjectURL = createUrlSpy;
      URL.revokeObjectURL = revokeUrlSpy;

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      globalThis.Image = MockImage as unknown as typeof Image;

      const detectSpy = vi
        .fn<BarcodeDetectorLike['detect']>()
        .mockResolvedValueOnce([{ rawValue: '4006381333931', format: 'ean_13' }])
        .mockResolvedValueOnce([]);

      class MockNativeDetector implements BarcodeDetectorLike {
        static getSupportedFormats = vi.fn(async () => ['ean_13', 'ean_8']);
        detect = detectSpy;
      }

      const service = setupService({
        getNativeDetector: () => MockNativeDetector as unknown as BarcodeDetectorCtorLike,
      });

      const file = new File(['mock'], 'barcode.png', { type: 'image/png' });

      const invalidResult = await service.decodeFromImageFile(file);
      expect(invalidResult).toEqual({ status: 'invalid-barcode', rawValue: '4006381333931' });

      const emptyResult = await service.decodeFromImageFile(file);
      expect(emptyResult).toEqual({ status: 'no-barcode' });
      expect(revokeUrlSpy).toHaveBeenCalledTimes(2);
      expect(revokeUrlSpy).toHaveBeenCalledWith('blob:mock-image');
    });
  });
});
