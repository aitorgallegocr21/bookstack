import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  LucideAlertCircle,
  LucideCamera,
  LucideCameraOff,
  LucideDynamicIcon,
  LucideFlashlight,
  LucideFlashlightOff,
  LucideImagePlus,
  LucideRefreshCw,
  LucideSwitchCamera,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BarcodeDecoderService } from '../../services/barcode-decoder.service';
import {
  CameraStreamError,
  CameraStreamService,
  type StartCameraStreamOptions,
} from '../../services/camera-stream.service';
import {
  buildCameraSwitchPlan,
  filterAndNormalizeCameras,
  type CameraSwitchPlan,
  type ScannerCameraDevice,
} from '../../utils/camera-selection.utils';

export type { ScannerCameraDevice };

export type IsbnScannerState =
  'idle' | 'starting' | 'scanning' | 'processing-file' | 'error' | 'permission-denied';

const LIVE_DECODE_INTERVAL_MS = 120;
const VIDEO_READY_TIMEOUT_MS = 1500;

function isPermissionDeniedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError';
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
  protected readonly i18n = inject(I18nService);
  private readonly cameraStream = inject(CameraStreamService);
  private readonly barcodeDecoder = inject(BarcodeDecoderService);

  protected readonly Camera = LucideCamera;
  protected readonly CameraOff = LucideCameraOff;
  protected readonly RefreshCw = LucideRefreshCw;
  protected readonly SwitchCamera = LucideSwitchCamera;
  protected readonly Flashlight = LucideFlashlight;
  protected readonly FlashlightOff = LucideFlashlightOff;
  protected readonly ImagePlus = LucideImagePlus;
  protected readonly AlertCircle = LucideAlertCircle;

  protected readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  readonly isbnDetected = output<string>();
  readonly closed = output<void>();

  protected readonly scannerState = signal<IsbnScannerState>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedCameraId = signal<string>('');
  protected readonly activeFacing = signal<'rear' | 'front' | null>(null);

  protected readonly torchSupported = computed(() => this.cameraStream.torchSupported());
  protected readonly torchEnabled = computed(() => this.cameraStream.torchEnabled());

  protected readonly availableCameras = computed<ScannerCameraDevice[]>(() => {
    const lookup = this.i18n.t().bookForm.lookup;
    return filterAndNormalizeCameras(this.cameraStream.availableDevices(), {
      rearCamera: lookup.rearCamera,
      frontCamera: lookup.frontCamera,
      genericCameraPrefix: lookup.genericCameraPrefix,
    });
  });

  protected readonly cameraSwitchPlan = computed<CameraSwitchPlan>(() =>
    buildCameraSwitchPlan(this.availableCameras(), this.selectedCameraId() || null)
  );

  protected readonly nextToggleFacing = computed<'rear' | 'front' | null>(() => {
    const plan = this.cameraSwitchPlan();
    if (plan.mode !== 'facing-toggle' || !plan.rearCamera || !plan.frontCamera) {
      return null;
    }

    const currentFacing = this.activeFacing();
    if (currentFacing === 'front') {
      return 'rear';
    }
    if (currentFacing === 'rear') {
      return 'front';
    }

    return this.selectedCameraId() === plan.frontCamera.id ? 'rear' : 'front';
  });

  protected readonly toggleCameraLabel = computed(() => {
    const lookup = this.i18n.t().bookForm.lookup;
    return this.nextToggleFacing() === 'front'
      ? lookup.switchToFrontCamera
      : lookup.switchToRearCamera;
  });

  private destroyed = false;
  private startToken = 0;
  private decodeSessionToken = 0;
  private decodeTimerId: ReturnType<typeof setTimeout> | null = null;
  private hasEmittedCurrentSession = false;

  ngAfterViewInit(): void {
    void this.startCamera();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.startToken++;
    this.stopDecodeLoop();
    this.detachVideoElement();
    this.cameraStream.stopStream();
  }

  /** Starts or restarts the live camera stream, attaches it to `<video>`, and begins decoding. */
  async startCamera(options?: StartCameraStreamOptions): Promise<void> {
    const token = ++this.startToken;
    this.stopDecodeLoop();
    this.hasEmittedCurrentSession = false;
    this.errorMessage.set(null);
    this.scannerState.set('starting');

    try {
      const stream = await this.cameraStream.startStream(options);
      if (this.destroyed || token !== this.startToken) {
        if (this.destroyed) {
          this.cameraStream.stopStream();
        }
        return;
      }

      const video = this.videoEl()?.nativeElement;
      if (!video) {
        this.cameraStream.stopStream();
        this.scannerState.set('error');
        this.errorMessage.set(this.i18n.t().bookForm.lookup.cameraUnavailableError);
        return;
      }

      video.srcObject = stream;
      await video.play();
      await this.waitForVideoReady(video);

      if (this.destroyed || token !== this.startToken) {
        if (this.destroyed) {
          this.detachVideoElement();
          this.cameraStream.stopStream();
        }
        return;
      }

      const trackSettings = this.cameraStream.activeTrackSettings();
      const resolvedDeviceId = trackSettings?.deviceId ?? '';
      this.selectedCameraId.set(resolvedDeviceId);
      this.activeFacing.set(this.resolveCurrentFacing(options?.facingMode, resolvedDeviceId));

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        void this.cameraStream.enhanceActiveTrack(videoTrack);
      }

      this.scannerState.set('scanning');
      this.startDecodeLoop();
    } catch (error: unknown) {
      if (this.destroyed || token !== this.startToken) {
        return;
      }

      this.detachVideoElement();
      this.cameraStream.stopStream();

      if (isPermissionDeniedError(error)) {
        this.scannerState.set('permission-denied');
        this.errorMessage.set(this.i18n.t().bookForm.lookup.permissionError);
        return;
      }

      this.scannerState.set('error');
      this.errorMessage.set(
        error instanceof CameraStreamError && error.code === 'unavailable'
          ? this.i18n.t().bookForm.lookup.cameraUnavailableError
          : this.i18n.t().bookForm.lookup.cameraUnavailableError
      );
    }
  }

  /** Stops the decode loop, detaches the `<video>` element, and releases all camera tracks. */
  stopCamera(): void {
    this.startToken++;
    this.stopDecodeLoop();
    this.detachVideoElement();
    this.cameraStream.stopStream();
    this.scannerState.set('idle');
  }

  /** Restarts the live camera using default selection preferences. */
  restartCamera(): void {
    void this.startCamera();
  }

  /** Switches between rear and front camera facing modes with one tap. */
  toggleFacingMode(): void {
    const nextFacing = this.nextToggleFacing() === 'front' ? 'user' : 'environment';
    void this.startCamera({ facingMode: nextFacing });
  }

  /** Switches to an explicit camera device ID from the desktop device selector. */
  onCameraChange(cameraId: string): void {
    if (!cameraId) {
      return;
    }
    this.selectedCameraId.set(cameraId);
    void this.startCamera({ deviceId: cameraId });
  }

  /** Handles `<select>` change events for switching cameras. */
  protected onCameraSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (select?.value) {
      this.onCameraChange(select.value);
    }
  }

  /** Toggles the device flashlight/torch when supported by the active video track. */
  async toggleTorch(): Promise<void> {
    await this.cameraStream.toggleTorch();
  }

  /** Decodes a barcode from a user-selected static image file. */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (input) {
      input.value = '';
    }
    if (!file) {
      return;
    }

    this.errorMessage.set(null);
    this.stopDecodeLoop();
    this.detachVideoElement();
    this.cameraStream.stopStream();
    this.scannerState.set('processing-file');

    try {
      const result = await this.barcodeDecoder.decodeFromImageFile(file);
      if (this.destroyed) {
        return;
      }

      if (result.status === 'isbn') {
        this.scannerState.set('idle');
        if (!this.hasEmittedCurrentSession) {
          this.hasEmittedCurrentSession = true;
          this.isbnDetected.emit(result.isbn);
        }
        return;
      }

      this.scannerState.set('error');
      this.errorMessage.set(
        result.status === 'invalid-barcode'
          ? this.i18n.t().bookForm.lookup.invalidBarcodeError
          : this.i18n.t().bookForm.lookup.noBarcodeInImageError
      );
    } catch {
      if (this.destroyed) {
        return;
      }
      this.scannerState.set('error');
      this.errorMessage.set(this.i18n.t().bookForm.lookup.noBarcodeInImageError);
    }
  }

  private startDecodeLoop(): void {
    this.stopDecodeLoop();
    const sessionToken = ++this.decodeSessionToken;
    this.scheduleNextDecode(sessionToken, 0);
  }

  private stopDecodeLoop(): void {
    this.decodeSessionToken++;
    if (this.decodeTimerId !== null) {
      clearTimeout(this.decodeTimerId);
      this.decodeTimerId = null;
    }
  }

  private scheduleNextDecode(sessionToken: number, delayMs: number): void {
    if (
      this.destroyed ||
      sessionToken !== this.decodeSessionToken ||
      this.scannerState() !== 'scanning'
    ) {
      return;
    }

    this.decodeTimerId = setTimeout(() => {
      this.decodeTimerId = null;
      void this.runDecodeTick(sessionToken);
    }, delayMs);
  }

  private async runDecodeTick(sessionToken: number): Promise<void> {
    if (
      this.destroyed ||
      sessionToken !== this.decodeSessionToken ||
      this.scannerState() !== 'scanning'
    ) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.scheduleNextDecode(sessionToken, LIVE_DECODE_INTERVAL_MS);
      return;
    }

    const video = this.videoEl()?.nativeElement;
    if (!video) {
      this.scheduleNextDecode(sessionToken, LIVE_DECODE_INTERVAL_MS);
      return;
    }

    try {
      const detection = await this.barcodeDecoder.decodeFromVideo(video);
      if (
        detection &&
        !this.hasEmittedCurrentSession &&
        !this.destroyed &&
        sessionToken === this.decodeSessionToken
      ) {
        this.hasEmittedCurrentSession = true;
        this.stopCamera();
        this.isbnDetected.emit(detection.normalizedIsbn);
        return;
      }
    } catch {
      // Transient frame decode errors are ignored while live scanning continues
    }

    this.scheduleNextDecode(sessionToken, LIVE_DECODE_INTERVAL_MS);
  }

  private detachVideoElement(): void {
    const video = this.videoEl()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  private resolveCurrentFacing(
    requestedFacing: StartCameraStreamOptions['facingMode'],
    deviceId: string
  ): 'rear' | 'front' | null {
    if (requestedFacing === 'user') {
      return 'front';
    }
    if (requestedFacing === 'environment') {
      return 'rear';
    }

    const trackFacing = this.cameraStream.activeTrackSettings()?.facingMode;
    if (trackFacing === 'user') {
      return 'front';
    }
    if (trackFacing === 'environment') {
      return 'rear';
    }

    const matched = this.availableCameras().find((camera) => camera.id === deviceId);
    if (matched?.facing === 'front' || matched?.facing === 'rear') {
      return matched.facing;
    }

    return null;
  }

  private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('playing', onReady);
        clearTimeout(timeoutId);
      };
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };
      const onReady = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          finish();
        }
      };
      const timeoutId = setTimeout(finish, VIDEO_READY_TIMEOUT_MS);
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('playing', onReady);
    });
  }
}
