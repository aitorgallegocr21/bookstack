import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LucideAlertTriangle,
  LucideArrowDown,
  LucideArrowUp,
  LucideCamera,
  LucideCheck,
  LucideDynamicIcon,
  LucideGlobe,
  LucideRotateCcw,
  LucideWifiOff,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  ConfigurableMetadataProvider,
  DEFAULT_METADATA_PROVIDERS,
} from '../../../../core/models/app-preferences.model';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { CameraStreamService } from '../../../books/services/camera-stream.service';

@Component({
  selector: 'app-settings-privacy-scanner-section',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './settings-privacy-scanner-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block space-y-6',
  },
})
export class SettingsPrivacyScannerSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly appPreferences = inject(AppPreferencesService);
  private readonly cameraStream = inject(CameraStreamService);

  protected readonly WifiOffIcon = LucideWifiOff;
  protected readonly GlobeIcon = LucideGlobe;
  protected readonly ArrowUpIcon = LucideArrowUp;
  protected readonly ArrowDownIcon = LucideArrowDown;
  protected readonly RotateCcwIcon = LucideRotateCcw;
  protected readonly CameraIcon = LucideCamera;
  protected readonly AlertTriangleIcon = LucideAlertTriangle;
  protected readonly CheckIcon = LucideCheck;

  protected readonly hasConsent = signal<boolean>(this.cameraStream.hasCameraConsent());
  protected readonly preferredRearDeviceId = signal<string | null>(
    this.cameraStream.getPreferredRearDeviceId()
  );
  protected readonly consentResetFeedback = signal<boolean>(false);
  protected readonly cameraForgottenFeedback = signal<boolean>(false);

  protected readonly orderedProviders = computed(() => [
    ...this.appPreferences.metadataProviders(),
  ]);

  protected readonly allProvidersDisabled = computed(() =>
    this.orderedProviders().every((provider) => !provider.enabled)
  );

  protected readonly truncatedDeviceId = computed(() => {
    const id = this.preferredRearDeviceId();
    if (!id) {
      return '';
    }
    return id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
  });

  protected toggleOfflineMode(): void {
    this.appPreferences.updatePreferences({
      offlineMode: !this.appPreferences.offlineMode(),
    });
  }

  protected toggleProvider(id: ConfigurableMetadataProvider): void {
    this.appPreferences.toggleMetadataProvider(id);
  }

  protected moveProvider(id: ConfigurableMetadataProvider, direction: 'up' | 'down'): void {
    this.appPreferences.moveMetadataProvider(id, direction);
  }

  protected resetProvidersOrder(): void {
    this.appPreferences.updatePreferences({
      metadataProviders: DEFAULT_METADATA_PROVIDERS.map((provider) => ({ ...provider })),
    });
  }

  protected revokeCameraConsent(): void {
    this.cameraStream.clearCameraConsent();
    this.hasConsent.set(false);
    this.consentResetFeedback.set(true);
  }

  protected forgetRememberedCamera(): void {
    this.cameraStream.clearPreferredRearDeviceId();
    this.preferredRearDeviceId.set(null);
    this.cameraForgottenFeedback.set(true);
  }

  protected togglePreferPhotoMode(): void {
    this.appPreferences.updatePreferences({
      scannerPreferPhotoMode: !this.appPreferences.scannerPreferPhotoMode(),
    });
  }

  protected toggleAutoTorch(): void {
    this.appPreferences.updatePreferences({
      scannerAutoTorch: !this.appPreferences.scannerAutoTorch(),
    });
  }

  protected getProviderCopy(id: ConfigurableMetadataProvider): {
    name: string;
    description: string;
  } {
    return this.i18n.t().settings.privacyScanner.providers[id];
  }
}
