import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  DEFAULT_METADATA_PROVIDERS,
  MetadataProviderPreference,
} from '../../../../core/models/app-preferences.model';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { CameraStreamService } from '../../../books/services/camera-stream.service';
import { SettingsPrivacyScannerSectionComponent } from './settings-privacy-scanner-section';

describe('SettingsPrivacyScannerSectionComponent', () => {
  let fixture: ComponentFixture<SettingsPrivacyScannerSectionComponent>;
  let offlineModeSignal: ReturnType<typeof signal<boolean>>;
  let providersSignal: ReturnType<typeof signal<MetadataProviderPreference[]>>;
  let preferPhotoSignal: ReturnType<typeof signal<boolean>>;
  let autoTorchSignal: ReturnType<typeof signal<boolean>>;
  let updatePreferencesMock: ReturnType<typeof vi.fn>;
  let toggleMetadataProviderMock: ReturnType<typeof vi.fn>;
  let moveMetadataProviderMock: ReturnType<typeof vi.fn>;
  let hasCameraConsentMock: ReturnType<typeof vi.fn>;
  let clearCameraConsentMock: ReturnType<typeof vi.fn>;
  let getPreferredRearDeviceIdMock: ReturnType<typeof vi.fn>;
  let clearPreferredRearDeviceIdMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    offlineModeSignal = signal(false);
    providersSignal = signal(DEFAULT_METADATA_PROVIDERS.map((p) => ({ ...p })));
    preferPhotoSignal = signal(false);
    autoTorchSignal = signal(false);

    updatePreferencesMock = vi.fn(
      (
        patch: Partial<{
          offlineMode: boolean;
          metadataProviders: MetadataProviderPreference[];
          scannerPreferPhotoMode: boolean;
          scannerAutoTorch: boolean;
        }>
      ) => {
        if (patch.offlineMode !== undefined) offlineModeSignal.set(patch.offlineMode);
        if (patch.metadataProviders !== undefined) providersSignal.set(patch.metadataProviders);
        if (patch.scannerPreferPhotoMode !== undefined)
          preferPhotoSignal.set(patch.scannerPreferPhotoMode);
        if (patch.scannerAutoTorch !== undefined) autoTorchSignal.set(patch.scannerAutoTorch);
      }
    );
    toggleMetadataProviderMock = vi.fn();
    moveMetadataProviderMock = vi.fn();
    hasCameraConsentMock = vi.fn(() => true);
    clearCameraConsentMock = vi.fn();
    getPreferredRearDeviceIdMock = vi.fn(() => 'rear-camera-device-1234567890');
    clearPreferredRearDeviceIdMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [SettingsPrivacyScannerSectionComponent],
      providers: [
        {
          provide: AppPreferencesService,
          useValue: {
            offlineMode: offlineModeSignal.asReadonly(),
            metadataProviders: providersSignal.asReadonly(),
            scannerPreferPhotoMode: preferPhotoSignal.asReadonly(),
            scannerAutoTorch: autoTorchSignal.asReadonly(),
            updatePreferences: updatePreferencesMock,
            toggleMetadataProvider: toggleMetadataProviderMock,
            moveMetadataProvider: moveMetadataProviderMock,
          },
        },
        {
          provide: CameraStreamService,
          useValue: {
            hasCameraConsent: hasCameraConsentMock,
            clearCameraConsent: clearCameraConsentMock,
            getPreferredRearDeviceId: getPreferredRearDeviceIdMock,
            clearPreferredRearDeviceId: clearPreferredRearDeviceIdMock,
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(SettingsPrivacyScannerSectionComponent);
    fixture.detectChanges();
  });

  it('toggles 100% Offline Mode and dims provider controls when active', () => {
    const toggle = fixture.debugElement.query(By.css('[data-testid="offline-mode-toggle"]'));
    expect(toggle.attributes['aria-checked']).toBe('false');

    toggle.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(updatePreferencesMock).toHaveBeenCalledWith({ offlineMode: true });
    expect(toggle.attributes['aria-checked']).toBe('true');
    expect(
      fixture.debugElement.query(By.css('[data-testid="providers-offline-hint"]'))
    ).toBeTruthy();
  });

  it('delegates provider toggle, priority move, and reset default order actions', () => {
    fixture.debugElement
      .query(By.css('[data-testid="provider-toggle-wikidata"]'))
      .triggerEventHandler('click', null);
    expect(toggleMetadataProviderMock).toHaveBeenCalledWith('wikidata');

    fixture.debugElement
      .query(By.css('[data-testid="provider-up-openlibrary"]'))
      .triggerEventHandler('click', null);
    expect(moveMetadataProviderMock).toHaveBeenCalledWith('openlibrary', 'up');

    fixture.debugElement
      .query(By.css('[data-testid="reset-providers-order-btn"]'))
      .triggerEventHandler('click', null);
    expect(updatePreferencesMock).toHaveBeenCalledWith({
      metadataProviders: DEFAULT_METADATA_PROVIDERS,
    });
  });

  it('shows warning when all 5 providers are disabled', () => {
    providersSignal.set(DEFAULT_METADATA_PROVIDERS.map((p) => ({ ...p, enabled: false })));
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('[data-testid="providers-all-disabled-warning"]'))
    ).toBeTruthy();
  });

  it('revokes camera consent, forgets remembered rear camera, and toggles scanner defaults', () => {
    fixture.debugElement
      .query(By.css('[data-testid="revoke-camera-consent-btn"]'))
      .triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(clearCameraConsentMock).toHaveBeenCalledTimes(1);

    fixture.debugElement
      .query(By.css('[data-testid="forget-remembered-camera-btn"]'))
      .triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(clearPreferredRearDeviceIdMock).toHaveBeenCalledTimes(1);

    fixture.debugElement
      .query(By.css('[data-testid="scanner-prefer-photo-toggle"]'))
      .triggerEventHandler('click', null);
    expect(updatePreferencesMock).toHaveBeenCalledWith({ scannerPreferPhotoMode: true });

    fixture.debugElement
      .query(By.css('[data-testid="scanner-auto-torch-toggle"]'))
      .triggerEventHandler('click', null);
    expect(updatePreferencesMock).toHaveBeenCalledWith({ scannerAutoTorch: true });
  });
});
