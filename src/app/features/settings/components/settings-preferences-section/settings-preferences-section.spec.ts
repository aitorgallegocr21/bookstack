import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';
import { SettingsPreferencesSectionComponent } from './settings-preferences-section';

describe('SettingsPreferencesSectionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    await TestBed.configureTestingModule({
      imports: [SettingsPreferencesSectionComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render Spanish preferences copy by default and switch interface language dynamically', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    const i18n = TestBed.inject(I18nService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#settings-preferences-heading')?.textContent?.trim()).toBe(
      'Preferencias de interfaz'
    );

    const select = root.querySelector('#settings-language') as HTMLSelectElement;
    expect(select.value).toBe('es');

    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(i18n.locale()).toBe('en');
    expect(root.querySelector('#settings-preferences-heading')?.textContent?.trim()).toBe(
      'Interface preferences'
    );
  });

  it('should toggle theme between light and dark with accessible aria-pressed state', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const lightBtn = root.querySelector('[data-testid="theme-light-btn"]') as HTMLButtonElement;
    const darkBtn = root.querySelector('[data-testid="theme-dark-btn"]') as HTMLButtonElement;

    expect(lightBtn.getAttribute('aria-pressed')).toBe('true');
    expect(darkBtn.getAttribute('aria-pressed')).toBe('false');

    darkBtn.click();
    fixture.detectChanges();

    expect(themeService.isDark()).toBe(true);
    expect(lightBtn.getAttribute('aria-pressed')).toBe('false');
    expect(darkBtn.getAttribute('aria-pressed')).toBe('true');

    lightBtn.click();
    fixture.detectChanges();

    expect(themeService.isDark()).toBe(false);
    expect(lightBtn.getAttribute('aria-pressed')).toBe('true');
    expect(darkBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('should update default catalog view mode via CatalogFilterService', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    const catalogFilter = TestBed.inject(CatalogFilterService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const viewSelect = root.querySelector('#settings-default-view') as HTMLSelectElement;
    expect(viewSelect.value).toBe(catalogFilter.viewMode());

    viewSelect.value = 'grid';
    viewSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(catalogFilter.viewMode()).toBe('grid');

    viewSelect.value = 'detailed';
    viewSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(catalogFilter.viewMode()).toBe('detailed');

    viewSelect.value = 'compact';
    viewSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(catalogFilter.viewMode()).toBe('compact');
  });
});
