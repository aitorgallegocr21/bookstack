import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ACCENT_PALETTES, ThemeService } from './theme.service';
import { AppPreferencesService } from './app-preferences.service';

const THEME_STORAGE_KEY = 'bookstack_theme_v1';
const ACCENT_STORAGE_KEY = 'bookstack_accent_v1';

describe('ThemeService', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-accent');
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-accent');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should default to system mode (resolving light) and blue accent when unset', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.themeMode()).toBe('system');
    expect(service.getTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(service.accent()).toBe('blue');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-accent')).toBe('blue');
  });

  it('should respect a persisted dark preference from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = TestBed.inject(ThemeService);
    expect(service.themeMode()).toBe('dark');
    expect(service.getTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should use prefers-color-scheme when no saved theme exists', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    const service = TestBed.inject(ThemeService);
    expect(service.themeMode()).toBe('system');
    expect(service.getTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should reactively update isDark when matchMedia emits a change event in system mode', () => {
    const listenerRef: { cb?: (event: MediaQueryListEvent) => void } = {};
    const removeEventListener = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, cb: (event: MediaQueryListEvent) => void) => {
          listenerRef.cb = cb;
        }),
        removeEventListener,
        dispatchEvent: vi.fn(),
      }),
    });

    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);

    listenerRef.cb?.({ matches: true } as MediaQueryListEvent);
    TestBed.flushEffects();

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    TestBed.resetTestingModule();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('should not throw when window.matchMedia is unavailable (regression)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    expect(() => TestBed.inject(ThemeService)).not.toThrow();
    const service = TestBed.inject(ThemeService);
    expect(service.getTheme()).toBe('light');
  });

  it('should toggle and persist the active theme when effects flush', () => {
    const service = TestBed.inject(ThemeService);

    service.toggleTheme();
    TestBed.flushEffects();

    expect(service.themeMode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setTheme('light');
    TestBed.flushEffects();

    expect(service.themeMode()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    service.setTheme('system');
    TestBed.flushEffects();
    expect(service.themeMode()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('should apply and persist all 5 accent palettes', () => {
    const service = TestBed.inject(ThemeService);

    for (const palette of ACCENT_PALETTES) {
      service.setAccent(palette);
      TestBed.flushEffects();

      expect(service.accent()).toBe(palette);
      expect(document.documentElement.getAttribute('data-accent')).toBe(palette);
      expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe(palette);
    }
  });

  it('should fall back safely when localStorage contains invalid theme or accent values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia-invalid');
    localStorage.setItem(ACCENT_STORAGE_KEY, 'neon-invalid');

    const service = TestBed.inject(ThemeService);
    expect(service.themeMode()).toBe('system');
    expect(service.accent()).toBe('blue');
    expect(document.documentElement.getAttribute('data-accent')).toBe('blue');
  });

  it('should sync data-reduced-motion attribute with AppPreferencesService.reducedMotion()', () => {
    const prefs = TestBed.inject(AppPreferencesService);
    TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBeNull();

    prefs.setPreference('reducedMotion', 'reduce');
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('reduce');

    prefs.setPreference('reducedMotion', 'system');
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBeNull();
  });
});
