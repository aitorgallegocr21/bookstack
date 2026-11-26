import { TestBed } from '@angular/core/testing';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { StorageAdapterService } from '../../../../core/services/storage-adapter.service';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';
import { SettingsCatalogReadingSectionComponent } from './settings-catalog-reading-section';

describe('SettingsCatalogReadingSectionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SettingsCatalogReadingSectionComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should update default catalog view mode and sort order via CatalogFilterService', () => {
    const fixture = TestBed.createComponent(SettingsCatalogReadingSectionComponent);
    const catalogFilter = TestBed.inject(CatalogFilterService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const viewSelect = root.querySelector('#settings-default-view') as HTMLSelectElement;
    viewSelect.value = 'compact';
    viewSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(catalogFilter.viewMode()).toBe('compact');

    const sortSelect = root.querySelector('#settings-default-sort') as HTMLSelectElement;
    sortSelect.value = 'rating-desc';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(catalogFilter.sortOption()).toBe('rating-desc');
  });

  it('should toggle card visibility, book defaults, quick page step, and reading time tracking', () => {
    const fixture = TestBed.createComponent(SettingsCatalogReadingSectionComponent);
    const appPreferences = TestBed.inject(AppPreferencesService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    const actionsSwitch = root.querySelector(
      '[data-testid="toggle-card-actions"]'
    ) as HTMLButtonElement;
    expect(actionsSwitch.getAttribute('role')).toBe('switch');
    expect(actionsSwitch.getAttribute('aria-checked')).toBe('true');
    actionsSwitch.click();
    fixture.detectChanges();
    expect(appPreferences.showCardQuickActions()).toBe(false);
    expect(actionsSwitch.getAttribute('aria-checked')).toBe('false');

    const progressSwitch = root.querySelector(
      '[data-testid="toggle-card-progress"]'
    ) as HTMLButtonElement;
    progressSwitch.click();
    fixture.detectChanges();
    expect(appPreferences.showCardProgressBar()).toBe(false);

    const formatSelect = root.querySelector('#settings-default-format') as HTMLSelectElement;
    formatSelect.value = 'ebook';
    formatSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(appPreferences.defaultBookFormat()).toBe('ebook');

    const statusSelect = root.querySelector('#settings-default-status') as HTMLSelectElement;
    statusSelect.value = 'reading';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(appPreferences.defaultBookStatus()).toBe('reading');

    const step25Btn = root.querySelector('[data-testid="quick-page-step-25"]') as HTMLButtonElement;
    step25Btn.click();
    fixture.detectChanges();
    expect(appPreferences.quickPageStep()).toBe(25);
    expect(step25Btn.getAttribute('aria-pressed')).toBe('true');

    const trackTimeSwitch = root.querySelector(
      '[data-testid="toggle-track-reading-time"]'
    ) as HTMLButtonElement;
    trackTimeSwitch.click();
    fixture.detectChanges();
    expect(appPreferences.trackReadingTime()).toBe(false);
  });

  it('should toggle individual confirmation prompts and restore all suppressed confirmations', () => {
    const storage = TestBed.inject(StorageAdapterService);
    storage.setConfirmSuppressed('deleteReadingLog', true);

    const fixture = TestBed.createComponent(SettingsCatalogReadingSectionComponent);
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const deleteToggle = root.querySelector(
      '[data-testid="toggle-confirm-deleteReadingLog"]'
    ) as HTMLButtonElement;
    const unlinkToggle = root.querySelector(
      '[data-testid="toggle-confirm-unlinkSagaBook"]'
    ) as HTMLButtonElement;

    expect(deleteToggle.getAttribute('aria-checked')).toBe('false');
    expect(unlinkToggle.getAttribute('aria-checked')).toBe('true');

    unlinkToggle.click();
    fixture.detectChanges();
    expect(confirmDialogService.isSuppressed('unlinkSagaBook')).toBe(true);

    const resetBtn = root.querySelector(
      '[data-testid="reset-suppressed-confirms-btn"]'
    ) as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();
    resetBtn.click();
    fixture.detectChanges();

    expect(confirmDialogService.suppressedKeys()).toEqual([]);
    expect(root.querySelector('[data-testid="reset-suppressed-confirms-btn"]')).toBeNull();
  });
});
