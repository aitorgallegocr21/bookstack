import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'bookstack_theme_v1';

describe('ThemeService', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should default to light theme when no preference or dark media query matches', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.getTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should respect a persisted dark preference from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = TestBed.inject(ThemeService);
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
    expect(service.getTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
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

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setTheme('light');
    TestBed.flushEffects();

    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
