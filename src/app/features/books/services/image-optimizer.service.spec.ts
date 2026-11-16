import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ImageOptimizerService } from './image-optimizer.service';

describe('ImageOptimizerService', () => {
  let service: ImageOptimizerService;
  const originalImage = globalThis.Image;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  beforeEach(() => {
    service = TestBed.inject(ImageOptimizerService);
  });

  afterEach(() => {
    globalThis.Image = originalImage;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    vi.restoreAllMocks();
  });

  it('should reject unsupported image MIME types', async () => {
    const gifFile = new File(['gif-bytes'], 'cover.gif', { type: 'image/gif' });
    await expect(service.optimize(gifFile)).rejects.toThrow(
      'Unsupported image format. Use JPEG, PNG, WebP, or AVIF.'
    );
  });

  it('should reject files larger than 10MB', async () => {
    const hugeFile = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(hugeFile, 'size', { value: 11 * 1024 * 1024 });

    await expect(service.optimize(hugeFile)).rejects.toThrow(
      'Image exceeds the maximum allowed size of 10MB.'
    );
  });

  it('should resize oversized images proportionally and encode PNG uploads as WebP', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-cover');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalWidth = 800;
      naturalHeight = 1600;
      width = 800;
      height = 1600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const drawImage = vi.fn();
    const toDataURL = vi.fn().mockReturnValue('data:image/webp;base64,optimized');
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage }),
      toDataURL,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return document.createElement(tagName);
    });

    const pngFile = new File(['png-bytes'], 'cover.png', { type: 'image/png' });
    const result = await service.optimize(pngFile);

    expect(result).toBe('data:image/webp;base64,optimized');
    expect(mockCanvas.width).toBe(200);
    expect(mockCanvas.height).toBe(400);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(toDataURL).toHaveBeenCalledWith('image/webp', 0.75);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-cover');
  });

  describe('optimizeRemoteUrl', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('rejects non-HTTPS remote URLs', async () => {
      await expect(service.optimizeRemoteUrl('http://example.com/cover.jpg')).rejects.toThrow(
        'Remote cover URL must use HTTPS.'
      );
    });

    it('fetches HTTPS cover with no-referrer/omit credentials and optimizes it locally', async () => {
      const mockBlob = new Blob(['webp-bytes'], { type: 'image/webp' });
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const optimizeSpy = vi
        .spyOn(service, 'optimize')
        .mockResolvedValue('data:image/webp;base64,localCover');

      const result = await service.optimizeRemoteUrl('https://covers.openlibrary.org/b/id/1-L.jpg');

      expect(result).toBe('data:image/webp;base64,localCover');
      expect(fetchMock).toHaveBeenCalledWith('https://covers.openlibrary.org/b/id/1-L.jpg', {
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      expect(optimizeSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back gracefully to the remote URL when fetch or optimization fails', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError('CORS blocked')) as unknown as typeof fetch;

      const remoteUrl = 'https://books.google.com/books/content?id=123';
      const result = await service.optimizeRemoteUrl(remoteUrl);

      expect(result).toBe(remoteUrl);
    });

    it('falls back to the remote URL when response is not ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }) as unknown as typeof fetch;

      const remoteUrl = 'https://covers.openlibrary.org/b/id/missing-L.jpg';
      const result = await service.optimizeRemoteUrl(remoteUrl);

      expect(result).toBe(remoteUrl);
    });
  });
});
