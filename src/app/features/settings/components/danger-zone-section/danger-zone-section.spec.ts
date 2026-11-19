import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { DataPortabilityService } from '../../services/data-portability.service';
import { DangerZoneSectionComponent } from './danger-zone-section';

describe('DangerZoneSectionComponent', () => {
  let fixture: ComponentFixture<DangerZoneSectionComponent>;
  let i18n: I18nService;

  const mockPortabilityService = {
    downloadJsonBackup: vi.fn(),
    clearReadingSessionsOnly: vi.fn(),
    factoryResetAllData: vi.fn(),
  };

  const mockUiStateService = {
    acquireScrollLock: vi.fn(),
    releaseScrollLock: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPortabilityService.clearReadingSessionsOnly.mockResolvedValue(undefined);
    mockPortabilityService.factoryResetAllData.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [DangerZoneSectionComponent],
      providers: [
        { provide: DataPortabilityService, useValue: mockPortabilityService },
        { provide: UiStateService, useValue: mockUiStateService },
      ],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLocale('es');

    fixture = TestBed.createComponent(DangerZoneSectionComponent);
    fixture.detectChanges();
  });

  it('opens and closes sessions reset modal with scroll lock lifecycle', () => {
    const resetSessionsBtn = fixture.nativeElement.querySelector(
      '[data-testid="reset-sessions-btn"]'
    ) as HTMLButtonElement;
    resetSessionsBtn.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector(
      '[data-testid="danger-reset-modal"]'
    ) as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain(i18n.t().settings.dangerZone.modalClearLogsTitle);
    expect(mockUiStateService.acquireScrollLock).toHaveBeenCalledTimes(1);

    const cancelBtn = fixture.nativeElement.querySelector(
      '[data-testid="cancel-danger-reset-btn"]'
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(cancelBtn);

    cancelBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="danger-reset-modal"]')).toBeNull();
    expect(mockUiStateService.releaseScrollLock).toHaveBeenCalledTimes(1);
  });

  it('opens factory reset modal and dismisses on Escape key', () => {
    const factoryBtn = fixture.nativeElement.querySelector(
      '[data-testid="factory-reset-btn"]'
    ) as HTMLButtonElement;
    factoryBtn.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector(
      '[data-testid="danger-reset-modal"]'
    ) as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain(i18n.t().settings.dangerZone.modalFactoryResetTitle);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="danger-reset-modal"]')).toBeNull();
    expect(mockUiStateService.releaseScrollLock).toHaveBeenCalledTimes(1);
  });

  it('triggers 1-click JSON backup inside the modal without closing it', () => {
    const factoryBtn = fixture.nativeElement.querySelector(
      '[data-testid="factory-reset-btn"]'
    ) as HTMLButtonElement;
    factoryBtn.click();
    fixture.detectChanges();

    const backupBtn = fixture.nativeElement.querySelector(
      '[data-testid="modal-backup-first-btn"]'
    ) as HTMLButtonElement;
    backupBtn.click();
    fixture.detectChanges();

    expect(mockPortabilityService.downloadJsonBackup).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="modal-backup-downloaded-msg"]')
        ?.textContent
    ).toContain(i18n.t().settings.dangerZone.modalBackupDownloaded);
    expect(
      fixture.nativeElement.querySelector('[data-testid="danger-reset-modal"]')
    ).not.toBeNull();
  });

  it('executes sessions reset, releases scroll lock, emits dataReset, and shows status', async () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.dataReset, 'emit');
    const resetSessionsBtn = fixture.nativeElement.querySelector(
      '[data-testid="reset-sessions-btn"]'
    ) as HTMLButtonElement;
    resetSessionsBtn.click();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-danger-reset-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPortabilityService.clearReadingSessionsOnly).toHaveBeenCalledTimes(1);
    expect(mockPortabilityService.factoryResetAllData).not.toHaveBeenCalled();
    expect(mockUiStateService.releaseScrollLock).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[data-testid="danger-reset-modal"]')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="danger-zone-status-banner"]')?.textContent
    ).toContain(i18n.t().settings.dangerZone.clearLogsSuccess);
  });

  it('executes factory reset and emits dataReset on confirmation', async () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.dataReset, 'emit');
    const factoryBtn = fixture.nativeElement.querySelector(
      '[data-testid="factory-reset-btn"]'
    ) as HTMLButtonElement;
    factoryBtn.click();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-danger-reset-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPortabilityService.factoryResetAllData).toHaveBeenCalledTimes(1);
    expect(mockPortabilityService.clearReadingSessionsOnly).not.toHaveBeenCalled();
    expect(mockUiStateService.releaseScrollLock).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="danger-zone-status-banner"]')?.textContent
    ).toContain(i18n.t().settings.dangerZone.factoryResetSuccess);
  });
});
