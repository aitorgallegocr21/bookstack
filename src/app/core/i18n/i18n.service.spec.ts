import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

const LOCALE_STORAGE_KEY = 'bookstack_locale_v1';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'es';
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default to Spanish (es) when no locale is stored', () => {
    const service = TestBed.inject(I18nService);
    expect(service.locale()).toBe('es');
    expect(service.intlLocale()).toBe('es-ES');
    expect(service.t().nav.books).toBe('Libros');
  });

  it('should ignore unsupported saved locales and fall back to es', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');

    const service = TestBed.inject(I18nService);
    expect(service.locale()).toBe('es');
  });

  it('should update dictionary, intlLocale, document lang, and localStorage on setLocale', () => {
    const service = TestBed.inject(I18nService);

    service.setLocale('en');
    TestBed.flushEffects();

    expect(service.locale()).toBe('en');
    expect(service.intlLocale()).toBe('en-US');
    expect(service.t().nav.books).toBe('Books');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });
});
