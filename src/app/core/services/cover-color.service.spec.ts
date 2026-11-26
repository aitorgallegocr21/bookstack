import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoverColorService } from './cover-color.service';
import { AppPreferencesService } from './app-preferences.service';

describe('CoverColorService', () => {
  let service: CoverColorService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverColorService);
  });

  afterEach(() => {
    service.clearCache();
    vi.useRealTimers();
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
    vi.useFakeTimers();

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
      clearRect: vi.fn(),
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

    await vi.advanceTimersByTimeAsync(600);

    const cachedTint = service.getTint(book);
    expect(cachedTint).toMatch(/^#[0-9a-f]{6}$/i);
    expect(mockContext.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 16, 16);

    const persisted = localStorage.getItem('bookstack_cover_tints_v1');
    expect(persisted).toContain('book-canvas');
    expect(persisted).toContain(cachedTint);
  });

  it('falls back gracefully when canvas pixel access throws a CORS SecurityError', async () => {
    vi.useFakeTimers();

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
      clearRect: vi.fn(),
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

    await vi.advanceTimersByTimeAsync(100);

    expect(service.getTint(book)).toBe(fallback);
  });

  it('does not evict or re-extract earlier books when processing 300 distinct books', async () => {
    vi.useFakeTimers();

    let imageLoads = 0;
    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 40;
      pixels[i + 1] = 120;
      pixels[i + 2] = 180;
      pixels[i + 3] = 255;
    }

    const mockContext = {
      clearRect: vi.fn(),
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

    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      const img = {
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_value: string) {
          imageLoads += 1;
          queueMicrotask(() => img.onload?.());
        },
      };
      return img as unknown as HTMLImageElement;
    } as unknown as typeof Image);

    const books = Array.from({ length: 300 }, (_, i) => ({
      id: `book-${i}`,
      title: `Title ${i}`,
      author: `Author ${i}`,
      coverUrl: `https://covers.example.com/${i}.jpg`,
    }));

    for (const book of books) {
      service.getTint(book);
    }

    await vi.advanceTimersByTimeAsync(5000);
    expect(imageLoads).toBe(300);

    // Re-reading book 0 and book 299 must not trigger any additional extractions.
    const tint0 = service.getTint(books[0]);
    const tint299 = service.getTint(books[299]);
    await vi.advanceTimersByTimeAsync(500);

    expect(tint0).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tint299).toMatch(/^#[0-9a-f]{6}$/i);
    expect(imageLoads).toBe(300);
  });

  it('isolates per-key signals so updating book A does not re-run a computed reading book B', async () => {
    vi.useFakeTimers();

    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 180;
      pixels[i + 1] = 80;
      pixels[i + 2] = 60;
      pixels[i + 3] = 255;
    }

    const mockContext = {
      clearRect: vi.fn(),
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

    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      const img = {
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_value: string) {
          queueMicrotask(() => img.onload?.());
        },
      };
      return img as unknown as HTMLImageElement;
    } as unknown as typeof Image);

    const bookA = {
      id: 'book-a',
      title: 'Book A',
      coverUrl: 'https://covers.example.com/a.jpg',
    };
    const bookB = {
      id: 'book-b',
      title: 'Book B',
    };

    let bookBComputations = 0;
    const bookATint = computed(() => service.getTint(bookA));
    const bookBTint = computed(() => {
      bookBComputations += 1;
      return service.getTint(bookB);
    });

    expect(bookATint()).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bookBTint()).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bookBComputations).toBe(1);

    await vi.advanceTimersByTimeAsync(100);

    // Book A resolves to its extracted tint, but Book B's computed() must not re-evaluate.
    expect(bookATint()).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bookBTint()).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bookBComputations).toBe(1);
  });

  it('caps concurrent extractions at 2 and debounces localStorage writes', async () => {
    vi.useFakeTimers();

    let inFlight = 0;
    let maxInFlight = 0;
    const pendingResolvers: (() => void)[] = [];

    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 90;
      pixels[i + 1] = 140;
      pixels[i + 2] = 110;
      pixels[i + 3] = 255;
    }

    const mockContext = {
      clearRect: vi.fn(),
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

    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      const img = {
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_value: string) {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          pendingResolvers.push(() => {
            inFlight -= 1;
            img.onload?.();
          });
        },
      };
      return img as unknown as HTMLImageElement;
    } as unknown as typeof Image);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    for (let i = 0; i < 6; i += 1) {
      service.getTint({
        id: `queued-${i}`,
        title: `Queued ${i}`,
        coverUrl: `https://covers.example.com/q${i}.jpg`,
      });
    }

    // Drain first batch (max 2 concurrent)
    await vi.advanceTimersByTimeAsync(20);
    expect(maxInFlight).toBe(2);
    expect(pendingResolvers.length).toBe(2);

    // Resolve all 6 jobs across batches
    while (pendingResolvers.length > 0) {
      const resolveNext = pendingResolvers.shift()!;
      resolveNext();
      await vi.advanceTimersByTimeAsync(20);
    }

    expect(maxInFlight).toBe(2);
    // Debounce has not elapsed yet if we check immediately, or once 500ms elapses it writes once.
    await vi.advanceTimersByTimeAsync(500);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null when adaptiveCoverTint is disabled without clearing cached entries, and clears via clearCache()', () => {
    const prefs = TestBed.inject(AppPreferencesService);
    const book = { id: 'cache-test-1', title: 'Dune', author: 'Frank Herbert' };

    const tintBefore = service.getTint(book);
    expect(tintBefore).toBeTruthy();

    prefs.setPreference('adaptiveCoverTint', false);
    expect(service.getTint(book)).toBeNull();

    prefs.setPreference('adaptiveCoverTint', true);
    expect(service.getTint(book)).toBe(tintBefore);

    localStorage.setItem('bookstack_cover_tints_v1', JSON.stringify([['1|a|b', '#4c5b7a']]));
    service.clearCache();
    expect(localStorage.getItem('bookstack_cover_tints_v1')).toBeNull();
  });
});
