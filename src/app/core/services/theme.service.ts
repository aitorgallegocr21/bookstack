import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'bookstack_theme_v1';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly theme = signal<Theme>('light');
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.initializeTheme();
    this.setupThemeEffect();
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();

    if (savedTheme) {
      this.theme.set(savedTheme);
      this.applyTheme(savedTheme);
      return;
    }

    const prefersDark =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    const initialTheme: Theme = prefersDark ? 'dark' : 'light';
    this.theme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  private setupThemeEffect(): void {
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      this.persistTheme(currentTheme);
    });
  }

  toggleTheme(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  getTheme(): Theme {
    return this.theme();
  }

  private applyTheme(theme: Theme): void {
    const htmlElement = this.document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }

  private persistTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('[ThemeService] Failed to persist theme to localStorage:', error);
    }
  }

  private getSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch (error) {
      console.warn('[ThemeService] Failed to retrieve theme from localStorage:', error);
      return null;
    }
  }
}
