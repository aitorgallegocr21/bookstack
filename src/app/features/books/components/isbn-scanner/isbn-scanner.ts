import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  LucideAlertCircle,
  LucideCamera,
  LucideCameraOff,
  LucideDynamicIcon,
  LucideImagePlus,
  LucideRefreshCw,
  LucideSwitchCamera,
} from '@lucide/angular';
import type { Html5Qrcode } from 'html5-qrcode';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  buildCameraSwitchPlan,
  filterAndNormalizeCameras,
  type ScannerCameraDevice,
} from '../../utils/camera-selection.utils';
import { isValidIsbn, normalizeIsbn } from '../../utils/isbn.utils';

export type { ScannerCameraDevice };

export type IsbnScannerState =
  'idle' | 'starting' | 'scanning' | 'processing-file' | 'error' | 'permission-denied';

@Component({
  selector: 'app-isbn-scanner',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './isbn-scanner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block space-y-3',
  },
})
export class IsbnScannerComponent implements AfterViewInit, OnDestroy {
  private static nextElementId = 0;

  protected readonly i18n = inject(I18nService);
  protected readonly Camera = LucideCamera;
  protected readonly CameraOff = LucideCameraOff;
  protected readonly RefreshCw = LucideRefreshCw;
  protected readonly SwitchCamera = LucideSwitchCamera;
  protected readonly ImagePlus = LucideImagePlus;
  protected readonly AlertCircle = LucideAlertCircle;

  protected readonly scannerElementId = `bookstack-isbn-scanner-${++IsbnScannerComponent.nextElementId}`;

  readonly isbnDetected = output<string>();
  readonly closed = output<void>();

  protected readonly scannerState = signal<IsbnScannerState>('idle');
  protected readonly availableCameras = signal<ScannerCameraDevice[]>([]);
  protected readonly selectedCameraId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly ignoredNonIsbnHint = signal<boolean>(false);

  protected readonly cameraSwitchPlan = computed(() =>
    buildCameraSwitchPlan(this.availableCameras(), this.selectedCameraId())
  );

  protected readonly nextToggleCamera = computed<ScannerCameraDevice | null>(() => {
    const plan = this.cameraSwitchPlan();
    if (plan.mode !== 'facing-toggle' || !plan.rearCamera || !plan.frontCamera) {
      return null;
    }
    return this.selectedCameraId() === plan.frontCamera.id ? plan.rearCamera : plan.frontCamera;
  });

  protected readonly toggleCameraLabel = computed(() => {
    const next = this.nextToggleCamera();
    if (!next) {
      return this.i18n.t().bookForm.lookup.switchCamera;
    }
    return next.facing === 'front'
      ? this.i18n.t().bookForm.lookup.switchToFrontCamera
      : this.i18n.t().bookForm.lookup.switchToRearCamera;
  });

  private scannerInstance: Html5Qrcode | null = null;
  private isCameraRunning = false;
  private isDestroyed = false;
  private handlingDetection = false;

  ngAfterViewInit(): void {
    void this.startCamera();
  }

  protected onToggleCameraFacing(): void {
    const next = this.nextToggleCamera();
    if (!next) {
      return;
    }
    void this.startCamera(next.id);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    void this.stopCamera(false);
  }

  /**
   * Lazily loads `html5-qrcode` in a separate async chunk.
   * Extracted as a protected method so unit tests can mock the dynamic import cleanly.
   */
  protected loadScannerLibrary(): Promise<typeof import('html5-qrcode')> {
    return import('html5-qrcode');
  }

  protected async startCamera(preferredCameraId?: string): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.handlingDetection = false;
    this.scannerState.set('starting');
    this.errorMessage.set(null);
    this.ignoredNonIsbnHint.set(false);

    await this.stopCamera(false);

    try {
      const lib = await this.loadScannerLibrary();
      if (this.isDestroyed) {
        return;
      }

      if (preferredCameraId) {
        this.selectedCameraId.set(preferredCameraId);
      }

      const scanner = this.createScannerInstance(lib);
      this.scannerInstance = scanner;

      await this.startWithFallbackLadder(scanner, preferredCameraId);

      this.isCameraRunning = true;

      if (this.isDestroyed) {
        await this.stopCamera(false);
        return;
      }

      const activeDeviceId = this.getRunningDeviceId(scanner) ?? preferredCameraId ?? null;
      if (activeDeviceId) {
        this.selectedCameraId.set(activeDeviceId);
      }

      await this.applyContinuousAutofocus(scanner);
      await this.refreshAvailableCameras();

      if (!this.selectedCameraId() && this.availableCameras().length > 0) {
        this.selectedCameraId.set(this.availableCameras()[0].id);
      }

      this.scannerState.set('scanning');
    } catch (error: unknown) {
      await this.stopCamera(false);
      if (this.isDestroyed) {
        return;
      }

      const isPermissionError = this.isPermissionDeniedError(error);

      this.errorMessage.set(
        isPermissionError
          ? this.i18n.t().bookForm.lookup.permissionError
          : this.i18n.t().bookForm.lookup.cameraUnavailableError
      );
      this.scannerState.set(isPermissionError ? 'permission-denied' : 'error');
    }
  }

  protected async stopCamera(updateState = true): Promise<void> {
    const instance = this.scannerInstance;
    this.scannerInstance = null;

    if (instance) {
      if (this.isCameraRunning) {
        try {
          await instance.stop();
        } catch {
          // Ignore teardown errors when the stream is already inactive.
        }
      }

      try {
        instance.clear();
      } catch {
        // Ignore DOM cleanup errors if element is already detached.
      }
    }

    this.isCameraRunning = false;

    if (updateState && !this.isDestroyed) {
      this.scannerState.set('idle');
    }
  }

  protected async switchCamera(cameraId: string): Promise<void> {
    if (!cameraId || cameraId === this.selectedCameraId()) {
      return;
    }

    await this.startCamera(cameraId);
  }

  protected onCameraSelectChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    if (selectEl.value) {
      void this.switchCamera(selectEl.value);
    }
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';

    if (!file || this.isDestroyed) {
      return;
    }

    this.handlingDetection = false;
    this.scannerState.set('processing-file');
    this.errorMessage.set(null);
    this.ignoredNonIsbnHint.set(false);

    await this.stopCamera(false);

    let fileScanner: Html5Qrcode | null = null;

    try {
      const lib = await this.loadScannerLibrary();
      if (this.isDestroyed) {
        return;
      }

      fileScanner = this.createScannerInstance(lib);
      const decodedText = await fileScanner.scanFile(file, false);

      if (this.isDestroyed) {
        return;
      }

      if (!isValidIsbn(decodedText)) {
        this.errorMessage.set(this.i18n.t().bookForm.lookup.invalidBarcodeError);
        this.scannerState.set('error');
        return;
      }

      const normalized = normalizeIsbn(decodedText);
      if (!normalized) {
        this.errorMessage.set(this.i18n.t().bookForm.lookup.invalidBarcodeError);
        this.scannerState.set('error');
        return;
      }

      this.scannerState.set('idle');
      this.isbnDetected.emit(normalized);
    } catch {
      if (!this.isDestroyed) {
        this.errorMessage.set(this.i18n.t().bookForm.lookup.noBarcodeInImageError);
        this.scannerState.set('error');
      }
    } finally {
      if (fileScanner) {
        try {
          fileScanner.clear();
        } catch {
          // Ignore DOM cleanup errors.
        }
      }
    }
  }

  protected async closeScanner(): Promise<void> {
    await this.stopCamera();
    this.closed.emit();
  }

  private async handleDecodedText(decodedText: string): Promise<void> {
    if (this.handlingDetection || this.isDestroyed) {
      return;
    }

    if (!isValidIsbn(decodedText)) {
      this.ignoredNonIsbnHint.set(true);
      return;
    }

    const normalized = normalizeIsbn(decodedText);
    if (!normalized) {
      this.ignoredNonIsbnHint.set(true);
      return;
    }

    this.handlingDetection = true;
    this.ignoredNonIsbnHint.set(false);

    await this.stopCamera();
    if (!this.isDestroyed) {
      this.isbnDetected.emit(normalized);
    }
  }

  private createScannerInstance(lib: typeof import('html5-qrcode')): Html5Qrcode {
    const formats = lib.Html5QrcodeSupportedFormats
      ? [
          lib.Html5QrcodeSupportedFormats.EAN_13,
          lib.Html5QrcodeSupportedFormats.EAN_8,
          lib.Html5QrcodeSupportedFormats.UPC_A,
          lib.Html5QrcodeSupportedFormats.CODE_128,
        ]
      : undefined;

    return formats
      ? new lib.Html5Qrcode(this.scannerElementId, {
          verbose: false,
          formatsToSupport: formats,
          useBarCodeDetectorIfSupported: true,
        })
      : new lib.Html5Qrcode(this.scannerElementId, {
          verbose: false,
          useBarCodeDetectorIfSupported: true,
        });
  }

  private async startWithFallbackLadder(
    scanner: Html5Qrcode,
    preferredCameraId?: string
  ): Promise<void> {
    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => ({
      width: Math.max(180, Math.min(320, Math.floor(viewfinderWidth * 0.8))),
      height: Math.max(96, Math.min(160, Math.floor(viewfinderHeight * 0.55))),
    });
    const onDecode = (decodedText: string) => {
      void this.handleDecodedText(decodedText);
    };
    const onFrameMiss = () => {
      // Ignore per-frame decode misses while scanning live video.
    };

    if (preferredCameraId) {
      await scanner.start(
        preferredCameraId,
        {
          fps: 10,
          qrbox,
          videoConstraints: {
            deviceId: { exact: preferredCameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        onDecode,
        onFrameMiss
      );
      return;
    }

    const attempts: Array<{
      cameraIdOrConfig: MediaTrackConstraints;
      videoConstraints?: MediaTrackConstraints;
    }> = [
      {
        cameraIdOrConfig: { facingMode: { ideal: 'environment' } },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        cameraIdOrConfig: { facingMode: 'environment' },
      },
      {
        cameraIdOrConfig: { facingMode: 'user' },
      },
    ];

    let lastError: unknown;
    for (const attempt of attempts) {
      if (this.isDestroyed) {
        return;
      }
      try {
        await scanner.start(
          attempt.cameraIdOrConfig,
          {
            fps: 10,
            qrbox,
            ...(attempt.videoConstraints ? { videoConstraints: attempt.videoConstraints } : {}),
          },
          onDecode,
          onFrameMiss
        );
        return;
      } catch (error: unknown) {
        if (this.isPermissionDeniedError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  }

  private getRunningDeviceId(scanner: Html5Qrcode): string | null {
    try {
      const settings = scanner.getRunningTrackSettings?.();
      return typeof settings?.deviceId === 'string' && settings.deviceId.trim().length > 0
        ? settings.deviceId
        : null;
    } catch {
      return null;
    }
  }

  private async applyContinuousAutofocus(scanner: Html5Qrcode): Promise<void> {
    try {
      const capabilities = scanner.getRunningTrackCapabilities?.() as
        (MediaTrackCapabilities & { focusMode?: string[] }) | undefined;
      if (
        capabilities &&
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes('continuous')
      ) {
        await scanner.applyVideoConstraints({
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Ignore unsupported autofocus constraints on devices without continuous focus.
    }
  }

  private async refreshAvailableCameras(): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!this.isDestroyed) {
        const lookup = this.i18n.t().bookForm.lookup;
        this.availableCameras.set(
          filterAndNormalizeCameras(devices, {
            rearCamera: lookup.rearCamera,
            frontCamera: lookup.frontCamera,
            genericCameraPrefix: lookup.genericCameraPrefix,
          })
        );
      }
    } catch {
      // Some browsers restrict enumerateDevices until getUserMedia resolves.
    }
  }

  private isPermissionDeniedError(error: unknown): boolean {
    const rawName =
      error instanceof Error
        ? `${error.name} ${error.message}`.toLowerCase()
        : String(error ?? '').toLowerCase();

    return (
      rawName.includes('notallowed') || rawName.includes('permission') || rawName.includes('denied')
    );
  }
}
