import { Injectable, DOCUMENT, computed, effect, inject, signal } from '@angular/core';
import { EN_TRANSLATIONS } from './en';
import { ES_TRANSLATIONS } from './es';
import { SupportedLocale, TranslationDictionary } from './i18n.types';

const LOCALE_STORAGE_KEY = 'bookstack_locale_v1';

const DICTIONARIES: Record<SupportedLocale, TranslationDictionary> = {
  es: ES_TRANSLATIONS,
  en: EN_TRANSLATIONS,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);

  readonly locale = signal<SupportedLocale>(this.getInitialLocale());
  readonly t = computed<TranslationDictionary>(() => DICTIONARIES[this.locale()]);
  readonly intlLocale = computed<string>(() => (this.locale() === 'en' ? 'en-US' : 'es-ES'));

  constructor() {
    effect(() => {
      const activeLocale = this.locale();
      this.document.documentElement.lang = activeLocale;
      this.persistLocale(activeLocale);
    });
  }

  setLocale(locale: SupportedLocale): void {
    this.locale.set(locale);
  }

  private getInitialLocale(): SupportedLocale {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      return saved === 'es' || saved === 'en' ? saved : 'es';
    } catch {
      return 'es';
    }
  }

  private persistLocale(locale: SupportedLocale): void {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (error) {
      console.warn('[I18nService] Failed to persist locale preference:', error);
    }
  }
}
