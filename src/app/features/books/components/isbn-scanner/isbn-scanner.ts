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

export type CameraStartTarget =
  | { kind: 'facing'; facing: 'rear' | 'front'; fallbackDeviceId?: string }
  | { kind: 'device'; deviceId: string };

interface CameraStartAttempt {
  cameraIdOrConfig: string | MediaTrackConstraints;
  videoConstraints?: MediaTrackConstraints;
}

const CAMERA_SWITCH_SETTLE_MS = 150;
const CAMERA_START_TIMEOUT_MS = 3500;
const MAX_SECONDARY_DEVICE_FALLBACKS = 2;

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
  protected readonly cameraStartTimeoutMs = CAMERA_START_TIMEOUT_MS;

  readonly isbnDetected = output<string>();
  readonly closed = output<void>();

  protected readonly scannerState = signal<IsbnScannerState>('idle');
  protected readonly availableCameras = signal<ScannerCameraDevice[]>([]);
  protected readonly selectedCameraId = signal<string | null>(null);
  protected readonly activeFacing = signal<'rear' | 'front' | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly ignoredNonIsbnHint = signal<boolean>(false);

  protected readonly cameraSwitchPlan = computed(() =>
    buildCameraSwitchPlan(this.availableCameras(), this.selectedCameraId())
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
    const nextFacing = this.nextToggleFacing();
    if (!nextFacing) {
      return this.i18n.t().bookForm.lookup.switchCamera;
    }
    return nextFacing === 'front'
      ? this.i18n.t().bookForm.lookup.switchToFrontCamera
      : this.i18n.t().bookForm.lookup.switchToRearCamera;
  });

  private scannerInstance: Html5Qrcode | null = null;
  private isCameraRunning = false;
  private isDestroyed = false;
  private handlingDetection = false;
  private activeStartRequestId = 0;
  private attemptedRearAutoUpgrade = false;

  ngAfterViewInit(): void {
    this.attemptedRearAutoUpgrade = false;
    void this.startCamera();
  }

  protected onToggleCameraFacing(): void {
    const nextFacing = this.nextToggleFacing();
    const plan = this.cameraSwitchPlan();
    if (!nextFacing) {
      return;
    }

    const fallbackDeviceId = nextFacing === 'rear' ? plan.rearCamera?.id : plan.frontCamera?.id;

    void this.startCamera({
      kind: 'facing',
      facing: nextFacing,
      fallbackDeviceId,
    });
  }

  protected restartCamera(): void {
    const plan = this.cameraSwitchPlan();
    const currentDeviceId = this.selectedCameraId();
    if (plan.mode === 'select' && currentDeviceId) {
      void this.startCamera({ kind: 'device', deviceId: currentDeviceId });
      return;
    }

    const currentFacing = this.activeFacing();
    if (plan.mode === 'facing-toggle' && currentFacing) {
      const fallbackDeviceId =
        currentFacing === 'rear' ? plan.rearCamera?.id : plan.frontCamera?.id;
      void this.startCamera({
        kind: 'facing',
        facing: currentFacing,
        fallbackDeviceId,
      });
      return;
    }

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

  /**
   * Brief delay after stopping an active camera stream so Android Camera2 HAL
   * finishes releasing the hardware session before opening a new stream.
   */
  protected waitForCameraRelease(): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, CAMERA_SWITCH_SETTLE_MS);
    });
  }

  protected async startCamera(target?: CameraStartTarget): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const wasRunning = this.isCameraRunning;
    this.handlingDetection = false;
    this.scannerState.set('starting');
    this.errorMessage.set(null);
    this.ignoredNonIsbnHint.set(false);

    await this.stopCamera(false);

    const requestId = ++this.activeStartRequestId;

    if (wasRunning) {
      await this.waitForCameraRelease();
      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        return;
      }
    }

    try {
      const lib = await this.loadScannerLibrary();
      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        return;
      }

      // Pre-enumerate devices without triggering a permission prompt. When permission is already
      // granted, this reveals ranked Android Camera2 IDs (e.g. `camera 0, facing back`) so we can
      // open the primary rear lens directly instead of hanging on broken HAL `environment` mapping.
      await this.refreshAvailableCameras();
      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        return;
      }

      const hadRearCandidatesBeforeStart = this.availableCameras().some(
        (camera) => camera.facing === 'rear'
      );

      if (target?.kind === 'device') {
        this.selectedCameraId.set(target.deviceId);
      }

      const scanner = await this.startWithFallbackLadder(lib, target, requestId);
      if (!scanner) {
        return;
      }

      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        await this.teardownScannerInstance(scanner, true);
        if (this.scannerInstance === scanner) {
          this.scannerInstance = null;
          this.isCameraRunning = false;
        }
        return;
      }

      this.scannerInstance = scanner;
      this.isCameraRunning = true;

      const trackSettings = this.getRunningTrackSettings(scanner);
      const activeDeviceId =
        trackSettings.deviceId ?? (target?.kind === 'device' ? target.deviceId : null);
      if (activeDeviceId) {
        this.selectedCameraId.set(activeDeviceId);
      }

      await this.refreshAvailableCameras();
      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        return;
      }

      if (!this.selectedCameraId() && this.availableCameras().length > 0) {
        this.selectedCameraId.set(this.availableCameras()[0].id);
      }

      const resolvedFacing = this.resolveActiveFacing(
        trackSettings.facingMode,
        this.selectedCameraId(),
        target?.kind === 'facing' ? target.facing : null
      );
      this.activeFacing.set(resolvedFacing);

      // First-visit recovery on Android devices where `facingMode: 'environment'` times out before
      // labels are unlocked: once `facingMode: 'user'` unlocks camera labels and reveals the
      // primary rear sensor (`camera 0`), automatically upgrade to that rear camera once.
      const hasRearCandidatesNow = this.availableCameras().some(
        (camera) => camera.facing === 'rear'
      );
      if (
        !target &&
        !this.attemptedRearAutoUpgrade &&
        !hadRearCandidatesBeforeStart &&
        hasRearCandidatesNow &&
        resolvedFacing === 'front'
      ) {
        this.attemptedRearAutoUpgrade = true;
        void this.startCamera({ kind: 'facing', facing: 'rear' });
        return;
      }

      this.scannerState.set('scanning');

      // Apply continuous autofocus asynchronously so a slow driver never blocks the viewfinder.
      void this.applyContinuousAutofocus(scanner);
    } catch (error: unknown) {
      if (requestId !== this.activeStartRequestId) {
        return;
      }

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
    this.activeStartRequestId++;

    const instance = this.scannerInstance;
    const shouldStop = this.isCameraRunning;
    this.scannerInstance = null;
    this.isCameraRunning = false;

    if (instance) {
      await this.teardownScannerInstance(instance, shouldStop);
    }

    this.releaseResidualVideoTracks();

    if (updateState && !this.isDestroyed) {
      this.scannerState.set('idle');
    }
  }

  protected async switchCamera(cameraId: string): Promise<void> {
    if (!cameraId || cameraId === this.selectedCameraId()) {
      return;
    }

    await this.startCamera({ kind: 'device', deviceId: cameraId });
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
    lib: typeof import('html5-qrcode'),
    target: CameraStartTarget | undefined,
    requestId: number
  ): Promise<Html5Qrcode | null> {
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

    const attempts = this.buildStartAttempts(target);

    let lastError: unknown;
    for (const attempt of attempts) {
      if (this.isDestroyed || requestId !== this.activeStartRequestId) {
        return null;
      }

      // Use a fresh Html5Qrcode instance per attempt so a timed-out state transition on one
      // attempt never poisons subsequent fallback attempts with "already under transition".
      const scanner = this.createScannerInstance(lib);
      this.scannerInstance = scanner;

      try {
        await this.startAttemptWithTimeout(scanner, attempt, qrbox, onDecode, onFrameMiss);
        return scanner;
      } catch (error: unknown) {
        await this.teardownScannerInstance(scanner, false);
        this.releaseResidualVideoTracks();
        if (this.scannerInstance === scanner) {
          this.scannerInstance = null;
        }

        if (this.isPermissionDeniedError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  }

  private buildStartAttempts(target?: CameraStartTarget): CameraStartAttempt[] {
    if (target?.kind === 'device') {
      return this.buildDeviceAttempts(target.deviceId);
    }

    const rearCandidates = this.availableCameras().filter((camera) => camera.facing === 'rear');
    const frontCandidates = this.availableCameras().filter((camera) => camera.facing === 'front');

    if (target?.kind === 'facing') {
      const facingMode = target.facing === 'rear' ? 'environment' : 'user';
      const rankedCandidates = target.facing === 'rear' ? rearCandidates : frontCandidates;
      const candidateIds = this.collectUniqueCandidateIds(
        rankedCandidates.map((camera) => camera.id),
        target.fallbackDeviceId
      );

      const attempts: CameraStartAttempt[] = [];
      if (candidateIds.length > 0) {
        attempts.push(...this.buildDeviceAttempts(candidateIds[0]));
        for (const secondaryId of candidateIds.slice(1, 1 + MAX_SECONDARY_DEVICE_FALLBACKS)) {
          attempts.push({ cameraIdOrConfig: secondaryId });
        }
      }

      attempts.push(
        { cameraIdOrConfig: { facingMode: { exact: facingMode } } },
        { cameraIdOrConfig: { facingMode } }
      );

      return attempts;
    }

    // Initial mount: prefer ranked primary rear deviceId (e.g. Android `camera 0, facing back`)
    // whenever device labels are already available, bypassing broken HAL `environment` mappings.
    if (rearCandidates.length > 0) {
      const attempts: CameraStartAttempt[] = [...this.buildDeviceAttempts(rearCandidates[0].id)];

      for (const secondaryRear of rearCandidates.slice(1, 1 + MAX_SECONDARY_DEVICE_FALLBACKS)) {
        attempts.push({ cameraIdOrConfig: secondaryRear.id });
      }

      attempts.push({ cameraIdOrConfig: { facingMode: { exact: 'environment' } } });

      if (frontCandidates.length > 0) {
        attempts.push({ cameraIdOrConfig: frontCandidates[0].id });
      }
      attempts.push({ cameraIdOrConfig: { facingMode: 'user' } });

      return attempts;
    }

    return [
      {
        cameraIdOrConfig: { facingMode: { exact: 'environment' } },
        videoConstraints: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        cameraIdOrConfig: { facingMode: { exact: 'environment' } },
      },
      {
        cameraIdOrConfig: { facingMode: 'environment' },
      },
      {
        cameraIdOrConfig: { facingMode: 'user' },
      },
    ];
  }

  private buildDeviceAttempts(deviceId: string): CameraStartAttempt[] {
    return [
      {
        cameraIdOrConfig: deviceId,
        videoConstraints: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        cameraIdOrConfig: deviceId,
      },
    ];
  }

  private collectUniqueCandidateIds(rankedIds: readonly string[], fallbackId?: string): string[] {
    const result: string[] = [];
    for (const id of rankedIds) {
      if (id && !result.includes(id)) {
        result.push(id);
      }
    }
    if (fallbackId && !result.includes(fallbackId)) {
      result.push(fallbackId);
    }
    return result;
  }

  private async startAttemptWithTimeout(
    scanner: Html5Qrcode,
    attempt: CameraStartAttempt,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => { width: number; height: number },
    onDecode: (decodedText: string) => void,
    onFrameMiss: () => void
  ): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;

    const startPromise = scanner.start(
      attempt.cameraIdOrConfig,
      {
        fps: 10,
        qrbox,
        ...(attempt.videoConstraints ? { videoConstraints: attempt.videoConstraints } : {}),
      },
      onDecode,
      onFrameMiss
    );

    void startPromise
      .then(async () => {
        if (timedOut) {
          await this.teardownScannerInstance(scanner, true);
        }
      })
      .catch(() => {
        // Handled by Promise.race when not timed out.
      });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error('Camera start timed out'));
      }, this.cameraStartTimeoutMs);
    });

    try {
      await Promise.race([startPromise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async teardownScannerInstance(scanner: Html5Qrcode, shouldStop: boolean): Promise<void> {
    if (shouldStop) {
      try {
        await scanner.stop();
      } catch {
        // Ignore teardown errors when the stream is already inactive.
      }
    }

    try {
      scanner.clear();
    } catch {
      // Ignore DOM cleanup errors if element is already detached.
    }
  }

  private releaseResidualVideoTracks(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const container = document.getElementById(this.scannerElementId);
    if (!container) {
      return;
    }

    const videos = container.querySelectorAll('video');
    for (const video of videos) {
      const stream = video.srcObject as MediaStream | null;
      if (stream && typeof stream.getTracks === 'function') {
        for (const track of stream.getTracks()) {
          try {
            track.stop();
          } catch {
            // Ignore track stop errors on already-ended tracks.
          }
        }
      }
      video.srcObject = null;
    }
  }

  private getRunningTrackSettings(scanner: Html5Qrcode): {
    deviceId: string | null;
    facingMode: string | null;
  } {
    try {
      const settings = scanner.getRunningTrackSettings?.();
      const deviceId =
        typeof settings?.deviceId === 'string' && settings.deviceId.trim().length > 0
          ? settings.deviceId
          : null;
      const facingMode =
        typeof settings?.facingMode === 'string' && settings.facingMode.trim().length > 0
          ? settings.facingMode.toLowerCase()
          : null;
      return { deviceId, facingMode };
    } catch {
      return { deviceId: null, facingMode: null };
    }
  }

  private resolveActiveFacing(
    trackFacingMode: string | null,
    activeDeviceId: string | null,
    requestedFacing: 'rear' | 'front' | null
  ): 'rear' | 'front' | null {
    if (trackFacingMode === 'environment') {
      return 'rear';
    }
    if (trackFacingMode === 'user') {
      return 'front';
    }

    if (activeDeviceId) {
      const matched = this.availableCameras().find((camera) => camera.id === activeDeviceId);
      if (matched?.facing === 'rear' || matched?.facing === 'front') {
        return matched.facing;
      }
    }

    return requestedFacing;
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
