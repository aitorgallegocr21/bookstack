import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoverColorService } from './cover-color.service';

describe('CoverColorService', () => {
  let service: CoverColorService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverColorService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns an O(1) deterministic fallback tint when no coverUrl is provided', () => {
    const tintA = service.getTint({ id: '1', title: 'Dune', author: 'Frank Herbert' });
    const tintB = service.getTint({ id: '2', title: 'Dune', author: 'Frank Herbert' });
    const tintC = service.getTint({ id: '3', title: '1984', author: 'George Orwell' });

    expect(tintA).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tintA).toBe(tintB);
    expect(tintC).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('hydrates cached tints from localStorage when valid', () => {
    localStorage.setItem(
      'bookstack_cover_tints_v1',
      JSON.stringify([['book-1:fallback', '#4c5b7a']])
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(CoverColorService);

    expect(freshService.getTint({ id: 'book-1', title: 'Anything' })).toBe('#4c5b7a');
  });

  it('ignores malformed localStorage data safely', () => {
    localStorage.setItem('bookstack_cover_tints_v1', '{not-valid-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(CoverColorService);

    const tint = freshService.getTint({ id: 'book-2', title: 'Foundation' });
    expect(tint).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('extracts a muted dominant hue via 16x16 canvas and persists it to localStorage', async () => {
    const mockImage = {
      crossOrigin: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      },
    };

    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      return mockImage as unknown as HTMLImageElement;
    } as unknown as typeof Image);

    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 200;
      pixels[i + 1] = 60;
      pixels[i + 2] = 50;
      pixels[i + 3] = 255;
    }

    const mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: pixels })),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const book = {
      id: 'book-canvas',
      title: 'Crimson Shore',
      author: 'A. Author',
      coverUrl: 'https://covers.example.com/crimson.jpg',
    };

    const initialTint = service.getTint(book);
    expect(initialTint).toMatch(/^#[0-9a-f]{6}$/i);

    await new Promise((resolve) => setTimeout(resolve, 20));

    const cachedTint = service.getTint(book);
    expect(cachedTint).toMatch(/^#[0-9a-f]{6}$/i);
    expect(mockContext.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 16, 16);

    const persisted = localStorage.getItem('bookstack_cover_tints_v1');
    expect(persisted).toContain('book-canvas');
    expect(persisted).toContain(cachedTint);
  });

  it('falls back gracefully when canvas pixel access throws a CORS SecurityError', async () => {
    const mockImage = {
      crossOrigin: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      },
    };

    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      return mockImage as unknown as HTMLImageElement;
    } as unknown as typeof Image);

    const mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => {
        throw new DOMException('Tainted canvas', 'SecurityError');
      }),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const book = {
      id: 'book-cors',
      title: 'CORS Book',
      author: 'B. Author',
      coverUrl: 'https://blocked.example.com/cover.jpg',
    };

    const fallback = service.getFallbackTint(book.title, book.author);
    expect(service.getTint(book)).toBe(fallback);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(service.getTint(book)).toBe(fallback);
  });
});
