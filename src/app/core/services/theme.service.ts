import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { ReducedMotionPreference } from '../models/app-preferences.model';
import { AppPreferencesService } from './app-preferences.service';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentPalette = 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';

export const ACCENT_PALETTES: readonly AccentPalette[] = [
  'blue',
  'indigo',
  'emerald',
  'amber',
  'rose',
] as const;

const THEME_STORAGE_KEY = 'bookstack_theme_v1';
const ACCENT_STORAGE_KEY = 'bookstack_accent_v1';

const VALID_THEME_MODES = new Set<string>(['light', 'dark', 'system']);
const VALID_ACCENTS = new Set<string>(ACCENT_PALETTES);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferences = inject(AppPreferencesService);

  private readonly _themeMode = signal<ThemeMode>('system');
  private readonly _systemPrefersDark = signal<boolean>(false);
  private readonly _accent = signal<AccentPalette>('blue');

  readonly themeMode = this._themeMode.asReadonly();
  readonly accent = this._accent.asReadonly();
  readonly isDark = computed(() => {
    const mode = this._themeMode();
    return mode === 'system' ? this._systemPrefersDark() : mode === 'dark';
  });

  constructor() {
    this.initializeMediaQuery();
    this.initializeTheme();
    this.initializeAccent();
    this.setupEffects();
  }

  private initializeMediaQuery(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._systemPrefersDark.set(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      this._systemPrefersDark.set(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      this.destroyRef.onDestroy(() => {
        mediaQuery.removeEventListener('change', handleChange);
      });
    }
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    const initialMode: ThemeMode = savedTheme ?? 'system';
    this._themeMode.set(initialMode);
    this.applyDarkClass(this.isDark());
  }

  private initializeAccent(): void {
    const savedAccent = this.getSavedAccent();
    const initialAccent: AccentPalette = savedAccent ?? 'blue';
    this._accent.set(initialAccent);
    this.applyAccentAttribute(initialAccent);
  }

  private setupEffects(): void {
    effect(() => {
      const dark = this.isDark();
      const mode = this._themeMode();
      this.applyDarkClass(dark);
      this.persistValue(THEME_STORAGE_KEY, mode, 'theme');
    });

    effect(() => {
      const currentAccent = this._accent();
      this.applyAccentAttribute(currentAccent);
      this.persistValue(ACCENT_STORAGE_KEY, currentAccent, 'accent');
    });

    effect(() => {
      this.applyReducedMotionAttribute(this.preferences.reducedMotion());
    });
  }

  toggleTheme(): void {
    this._themeMode.set(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    if (!VALID_THEME_MODES.has(theme)) {
      return;
    }
    this._themeMode.set(theme);
  }

  getTheme(): ResolvedTheme {
    return this.isDark() ? 'dark' : 'light';
  }

  setAccent(accent: AccentPalette): void {
    if (!VALID_ACCENTS.has(accent)) {
      return;
    }
    this._accent.set(accent);
  }

  private applyDarkClass(dark: boolean): void {
    const htmlElement = this.document.documentElement;
    if (dark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }

  private applyAccentAttribute(accent: AccentPalette): void {
    this.document.documentElement.setAttribute('data-accent', accent);
  }

  private applyReducedMotionAttribute(mode: ReducedMotionPreference): void {
    const htmlElement = this.document.documentElement;
    if (mode === 'reduce') {
      htmlElement.setAttribute('data-reduced-motion', 'reduce');
    } else {
      htmlElement.removeAttribute('data-reduced-motion');
    }
  }

  private persistValue(key: string, value: string, label: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[ThemeService] Failed to persist ${label} to localStorage:`, error);
    }
  }

  private getSavedTheme(): ThemeMode | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved && VALID_THEME_MODES.has(saved) ? (saved as ThemeMode) : null;
    } catch (error) {
      console.warn('[ThemeService] Failed to retrieve theme from localStorage:', error);
      return null;
    }
  }

  private getSavedAccent(): AccentPalette | null {
    try {
      const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
      return saved && VALID_ACCENTS.has(saved) ? (saved as AccentPalette) : null;
    } catch (error) {
      console.warn('[ThemeService] Failed to retrieve accent from localStorage:', error);
      return null;
    }
  }
}
