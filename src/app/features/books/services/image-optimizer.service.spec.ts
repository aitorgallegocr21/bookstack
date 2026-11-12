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
});
