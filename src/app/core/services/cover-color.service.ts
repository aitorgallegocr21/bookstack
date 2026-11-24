import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { z } from 'zod';

export interface CoverTintBookInput {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
}

const COVER_TINT_STORAGE_KEY = 'bookstack_cover_tints_v1';
const MAX_CACHE_ENTRIES = 250;
const CANVAS_SAMPLE_SIZE = 16;

const CoverTintCacheSchema = z.array(z.tuple([z.string(), z.string()]));

/**
 * Curated muted editorial hues used as O(1) deterministic fallbacks
 * when a book has no cover image or pixel extraction is blocked.
 */
const EDITORIAL_FALLBACK_PALETTE: readonly string[] = [
  '#8c5a3c', // Warm Terracotta
  '#5b7065', // Editorial Sage
  '#4c5b7a', // Dusty Slate Indigo
  '#946b3b', // Ochre Bronze
  '#755269', // Muted Plum
  '#3f6b72', // Deep Teal
  '#6c6257', // Warm Umber
  '#4f6f52', // Forest Moss
  '#844c54', // Burgundy Rose
  '#556b82', // Nordic Blue
];

/**
 * Extracts and caches a muted dominant hue from book cover images using a tiny
 * 16x16 offscreen canvas, with an O(1) deterministic title+author editorial fallback.
 */
@Injectable({ providedIn: 'root' })
export class CoverColorService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly cache = new Map<string, string>();
  private readonly pendingKeys = new Set<string>();
  private readonly cacheSignal = signal<Record<string, string>>({});

  constructor() {
    this.hydrateFromStorage();
  }

  /**
   * Returns a CSS color string suitable for `--book-tint`.
   * Reads reactively from the internal cache signal and schedules background
   * 16x16 canvas extraction when an uncached `coverUrl` is provided.
   */
  getTint(book: CoverTintBookInput): string {
    const cacheKey = this.buildCacheKey(book);
    const snapshot = this.cacheSignal();
    const cached = snapshot[cacheKey] ?? this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const fallback = this.getFallbackTint(book.title, book.author);

    if (this.isBrowser && book.coverUrl && !this.pendingKeys.has(cacheKey)) {
      this.pendingKeys.add(cacheKey);
      queueMicrotask(() => {
        void this.extractAndCache(cacheKey, book.coverUrl!, fallback);
      });
    }

    return fallback;
  }

  /**
   * Computes an instant O(1) deterministic muted editorial color from title and author.
   */
  getFallbackTint(title: string, author = ''): string {
    const seed = `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const index = (hash >>> 0) % EDITORIAL_FALLBACK_PALETTE.length;
    return EDITORIAL_FALLBACK_PALETTE[index];
  }

  /**
   * Clears in-memory and persisted tint caches (primarily for testing or reset).
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingKeys.clear();
    this.cacheSignal.set({});
    if (this.isBrowser) {
      try {
        localStorage.removeItem(COVER_TINT_STORAGE_KEY);
      } catch {
        // Ignore storage access errors in restricted environments.
      }
    }
  }

  private buildCacheKey(book: CoverTintBookInput): string {
    const cover = book.coverUrl?.trim() ?? '';
    if (!cover) {
      return `${book.id}:fallback`;
    }
    const signature = `${cover.length}:${cover.slice(0, 24)}:${cover.slice(-16)}`;
    return `${book.id}:${signature}`;
  }

  private async extractAndCache(
    cacheKey: string,
    coverUrl: string,
    fallback: string
  ): Promise<void> {
    try {
      const extracted = await this.extractDominantHue(coverUrl);
      this.setCacheEntry(cacheKey, extracted ?? fallback);
    } catch {
      this.setCacheEntry(cacheKey, fallback);
    } finally {
      this.pendingKeys.delete(cacheKey);
    }
  }

  private extractDominantHue(coverUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.isBrowser || typeof Image === 'undefined') {
        resolve(null);
        return;
      }

      const img = new Image();
      if (!coverUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = CANVAS_SAMPLE_SIZE;
          canvas.height = CANVAS_SAMPLE_SIZE;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, CANVAS_SAMPLE_SIZE, CANVAS_SAMPLE_SIZE);
          const { data } = ctx.getImageData(0, 0, CANVAS_SAMPLE_SIZE, CANVAS_SAMPLE_SIZE);
          resolve(this.computeMutedHexFromPixels(data));
        } catch {
          // CORS-tainted canvas or unsupported context falls back cleanly.
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = coverUrl;
    });
  }

  private computeMutedHexFromPixels(pixels: Uint8ClampedArray): string | null {
    let weightedR = 0;
    let weightedG = 0;
    let weightedB = 0;
    let totalWeight = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 128) continue;
      if (r > 240 && g > 240 && b > 240) continue;
      if (r < 18 && g < 18 && b < 18) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = (max - min) / 255;
      const weight = 0.25 + chroma * 1.75;

      weightedR += r * weight;
      weightedG += g * weight;
      weightedB += b * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) {
      return null;
    }

    const avgR = Math.round(weightedR / totalWeight);
    const avgG = Math.round(weightedG / totalWeight);
    const avgB = Math.round(weightedB / totalWeight);

    return this.normalizeToEditorialHex(avgR, avgG, avgB);
  }

  private normalizeToEditorialHex(r: number, g: number, b: number): string {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta > 0) {
      if (max === rn) {
        h = ((gn - bn) / delta) % 6;
      } else if (max === gn) {
        h = (bn - rn) / delta + 2;
      } else {
        h = (rn - gn) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const rawS = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Clamp saturation and lightness so tints stay tasteful and editorial.
    const clampedS = rawS < 0.08 ? 0.14 : Math.min(0.56, Math.max(0.24, rawS));
    const clampedL = Math.min(0.54, Math.max(0.36, l));

    return this.hslToHex(h, clampedS, clampedL);
  }

  private hslToHex(h: number, s: number, l: number): string {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (h < 60) {
      rPrime = c;
      gPrime = x;
    } else if (h < 120) {
      rPrime = x;
      gPrime = c;
    } else if (h < 180) {
      gPrime = c;
      bPrime = x;
    } else if (h < 240) {
      gPrime = x;
      bPrime = c;
    } else if (h < 300) {
      rPrime = x;
      bPrime = c;
    } else {
      rPrime = c;
      bPrime = x;
    }

    const toHex = (value: number): string =>
      Math.round((value + m) * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`;
  }

  private setCacheEntry(key: string, color: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, color);

    while (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }

    this.cacheSignal.set(Object.fromEntries(this.cache));
    this.persistToStorage();
  }

  private hydrateFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(COVER_TINT_STORAGE_KEY);
      if (!raw) return;
      const parsed = CoverTintCacheSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return;

      for (const [key, value] of parsed.data.slice(-MAX_CACHE_ENTRIES)) {
        this.cache.set(key, value);
      }
      this.cacheSignal.set(Object.fromEntries(this.cache));
    } catch {
      // Ignore malformed or inaccessible storage.
    }
  }

  private persistToStorage(): void {
    if (!this.isBrowser) return;
    try {
      const entries = Array.from(this.cache.entries()).slice(-MAX_CACHE_ENTRIES);
      localStorage.setItem(COVER_TINT_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore QuotaExceededError or private mode errors.
    }
  }
}
