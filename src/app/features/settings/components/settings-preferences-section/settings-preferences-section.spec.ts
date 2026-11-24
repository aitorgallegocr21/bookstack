import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DockPositionService } from '../../../../core/services/dock-position.service';
import { StorageAdapterService } from '../../../../core/services/storage-adapter.service';
import { ACCENT_PALETTES, ThemeService } from '../../../../core/services/theme.service';
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

  it('should render vertical editorial rows, equal-width theme controls, 5-column accent grid, and spacious dock selectors', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('block')).toBe(true);

    const stack = host.querySelector('.divide-y.divide-subtle') as HTMLElement;
    expect(stack).toBeTruthy();

    const labels = Array.from(host.querySelectorAll('.field-label')) as HTMLElement[];
    expect(labels).toHaveLength(3);
    for (const label of labels) {
      expect(label.classList.contains('truncate')).toBe(true);
    }

    const languageSelect = host.querySelector('#settings-language') as HTMLSelectElement;
    const themeGroup = host.querySelector(
      '[role="group"][aria-labelledby="settings-theme-label"]'
    ) as HTMLElement;
    const defaultViewSelect = host.querySelector('#settings-default-view') as HTMLSelectElement;

    for (const control of [languageSelect, themeGroup, defaultViewSelect]) {
      expect(control).toBeTruthy();
      expect(control.classList.contains('h-11')).toBe(true);
    }

    expect(themeGroup.classList.contains('grid-cols-3')).toBe(true);
    const themeButtons = Array.from(themeGroup.querySelectorAll('button'));
    expect(themeButtons).toHaveLength(3);
    for (const btn of themeButtons) {
      expect(btn.classList.contains('min-w-0')).toBe(true);
      expect(btn.classList.contains('flex-1')).toBe(true);
    }

    const accentGroup = host.querySelector(
      '[role="group"][aria-labelledby="settings-accent-label"]'
    ) as HTMLElement;
    expect(accentGroup.classList.contains('sm:grid-cols-5')).toBe(true);
    const swatchIds = Array.from(accentGroup.querySelectorAll('button')).map((btn) =>
      btn.getAttribute('data-testid')
    );
    expect(swatchIds).toEqual([
      'accent-swatch-blue',
      'accent-swatch-indigo',
      'accent-swatch-emerald',
      'accent-swatch-amber',
      'accent-swatch-rose',
    ]);

    const desktopDockGroup = host.querySelector(
      '[role="group"][aria-labelledby="settings-desktop-dock-label"]'
    ) as HTMLElement;
    expect(desktopDockGroup.classList.contains('sm:grid-cols-4')).toBe(true);
    expect(desktopDockGroup.querySelectorAll('button')).toHaveLength(4);
  });

  it('should show and execute reset suppressed confirmations button when at least one prompt is suppressed', () => {
    const storage = TestBed.inject(StorageAdapterService);
    storage.setConfirmSuppressed('deleteReadingLog', true);

    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const resetBtn = host.querySelector(
      '[data-testid="reset-suppressed-confirms-btn"]'
    ) as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();

    resetBtn.click();
    fixture.detectChanges();

    expect(storage.getSuppressedConfirms()).toEqual([]);
    expect(host.querySelector('[data-testid="reset-suppressed-confirms-btn"]')).toBeNull();
  });

  it('should switch theme mode to system and update accent palette via ThemeService', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('dark');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const systemBtn = host.querySelector('[data-testid="theme-system-btn"]') as HTMLButtonElement;
    expect(systemBtn).not.toBeNull();

    systemBtn.click();
    fixture.detectChanges();
    expect(themeService.themeMode()).toBe('system');
    expect(systemBtn.getAttribute('aria-pressed')).toBe('true');

    for (const palette of ACCENT_PALETTES) {
      const swatchBtn = host.querySelector(
        `[data-testid="accent-swatch-${palette}"]`
      ) as HTMLButtonElement;
      expect(swatchBtn).not.toBeNull();
      swatchBtn.click();
      fixture.detectChanges();
      expect(themeService.accent()).toBe(palette);
      expect(swatchBtn.getAttribute('aria-pressed')).toBe('true');
      expect(document.documentElement.getAttribute('data-accent')).toBe(palette);
    }
  });

  it('should update desktop and mobile dock positions via DockPositionService', () => {
    const fixture = TestBed.createComponent(SettingsPreferencesSectionComponent);
    const dockService = TestBed.inject(DockPositionService);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    for (const pos of ['right', 'top', 'bottom', 'left'] as const) {
      const btn = host.querySelector(`[data-testid="dock-desktop-${pos}"]`) as HTMLButtonElement;
      expect(btn).not.toBeNull();
      btn.click();
      fixture.detectChanges();
      expect(dockService.desktopPosition()).toBe(pos);
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    }

    for (const pos of ['top', 'bottom'] as const) {
      const btn = host.querySelector(`[data-testid="dock-mobile-${pos}"]`) as HTMLButtonElement;
      expect(btn).not.toBeNull();
      btn.click();
      fixture.detectChanges();
      expect(dockService.mobilePosition()).toBe(pos);
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    }
  });
});
