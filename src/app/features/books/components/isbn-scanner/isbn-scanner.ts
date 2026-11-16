import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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
} from '@lucide/angular';
import type { Html5Qrcode } from 'html5-qrcode';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { isValidIsbn, normalizeIsbn } from '../../utils/isbn.utils';

export type IsbnScannerState = 'idle' | 'starting' | 'scanning' | 'processing-file' | 'error';

export interface ScannerCameraDevice {
  id: string;
  label: string;
}

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

  private scannerInstance: Html5Qrcode | null = null;
  private isCameraRunning = false;
  private isDestroyed = false;
  private handlingDetection = false;

  ngAfterViewInit(): void {
    void this.startCamera();
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

      await this.refreshAvailableCameras(lib);
      if (this.isDestroyed) {
        return;
      }

      const cameraIdOrConfig: string | MediaTrackConstraints = preferredCameraId ?? {
        facingMode: 'environment',
      };

      if (preferredCameraId) {
        this.selectedCameraId.set(preferredCameraId);
      }

      const scanner = this.createScannerInstance(lib);
      this.scannerInstance = scanner;

      await scanner.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: 240, height: 120 },
        },
        (decodedText: string) => {
          void this.handleDecodedText(decodedText);
        },
        () => {
          // Ignore per-frame decode misses while scanning live video.
        }
      );

      this.isCameraRunning = true;

      if (this.isDestroyed) {
        await this.stopCamera(false);
        return;
      }

      if (this.availableCameras().length === 0) {
        await this.refreshAvailableCameras(lib);
      }

      this.scannerState.set('scanning');
    } catch (error: unknown) {
      await this.stopCamera(false);
      if (this.isDestroyed) {
        return;
      }

      this.errorMessage.set(this.mapCameraError(error));
      this.scannerState.set('error');
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
        })
      : new lib.Html5Qrcode(this.scannerElementId, false);
  }

  private async refreshAvailableCameras(lib: typeof import('html5-qrcode')): Promise<void> {
    try {
      const devices = await lib.Html5Qrcode.getCameras();
      if (!this.isDestroyed) {
        this.availableCameras.set(
          devices.map((device) => ({
            id: device.id,
            label: device.label || device.id,
          }))
        );
      }
    } catch {
      // Some browsers restrict enumerateDevices until getUserMedia resolves.
    }
  }

  private mapCameraError(error: unknown): string {
    const t = this.i18n.t().bookForm.lookup;
    const rawName =
      error instanceof Error
        ? `${error.name} ${error.message}`.toLowerCase()
        : String(error ?? '').toLowerCase();

    if (
      rawName.includes('notallowed') ||
      rawName.includes('permission') ||
      rawName.includes('denied')
    ) {
      return t.permissionError;
    }

    return t.cameraUnavailableError;
  }
}
