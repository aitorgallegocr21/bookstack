import { Injectable, type OnDestroy, signal } from '@angular/core';
import {
  classifyCameraFacing,
  filterAndNormalizeCameras,
  isAuxiliaryCameraLabel,
  pickPrimaryDeviceId,
  type RawCameraDevice,
} from '../utils/camera-selection.utils';

export const PREFERRED_REAR_DEVICE_KEY = 'bookstack.scanner.preferredRearDeviceId';
export const CAMERA_CONSENT_STORAGE_KEY = 'bookstack.scanner.cameraConsentAcknowledged';
export const CAMERA_ATTEMPT_TIMEOUT_MS = 2500;

export interface ActiveCameraTrackSettings {
  deviceId: string | null;
  facingMode: string | null;
  width: number | null;
  height: number | null;
}

export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  width?: { min?: number; max?: number };
  height?: { min?: number; max?: number };
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
}

interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  advanced?: ExtendedMediaTrackConstraintSet[];
  focusMode?: string;
}

export interface StartCameraStreamOptions {
  deviceId?: string;
  facingMode?: 'environment' | 'user';
}

export type CameraStreamErrorCode = 'unavailable' | 'stream-failed';

export class CameraStreamError extends Error {
  constructor(
    readonly code: CameraStreamErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message, { cause });
    this.name = 'CameraStreamError';
  }
}

function isPermissionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError';
}

function stopMediaTracks(stream: MediaStream | null | undefined): void {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

@Injectable({ providedIn: 'root' })
export class CameraStreamService implements OnDestroy {
  private readonly _activeStream = signal<MediaStream | null>(null);
  readonly activeStream = this._activeStream.asReadonly();

  private readonly _activeTrackSettings = signal<ActiveCameraTrackSettings | null>(null);
  readonly activeTrackSettings = this._activeTrackSettings.asReadonly();

  private readonly _availableDevices = signal<RawCameraDevice[]>([]);
  readonly availableDevices = this._availableDevices.asReadonly();

  private readonly _torchSupported = signal<boolean>(false);
  readonly torchSupported = this._torchSupported.asReadonly();

  private readonly _torchEnabled = signal<boolean>(false);
  readonly torchEnabled = this._torchEnabled.asReadonly();

  private sessionToken = 0;

  ngOnDestroy(): void {
    this.stopStream();
  }

  getPreferredRearDeviceId(): string | null {
    return this.readPreferredRearDeviceId();
  }

  clearPreferredRearDeviceId(): void {
    try {
      globalThis.localStorage?.removeItem(PREFERRED_REAR_DEVICE_KEY);
    } catch {
      // Ignore storage errors in private browsing.
    }
  }

  hasCameraConsent(): boolean {
    try {
      return globalThis.localStorage?.getItem(CAMERA_CONSENT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  grantCameraConsent(): void {
    try {
      globalThis.localStorage?.setItem(CAMERA_CONSENT_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing.
    }
  }

  clearCameraConsent(): void {
    try {
      globalThis.localStorage?.removeItem(CAMERA_CONSENT_STORAGE_KEY);
    } catch {
      // Ignore storage errors in private browsing.
    }
  }

  /**
   * Starts a camera stream using preferred device memory, Camera2 primary-sensor ranking,
   * fast per-attempt timeouts, and progressive fallback.
   */
  async startStream(options?: StartCameraStreamOptions): Promise<MediaStream> {
    this.stopStream();
    const token = this.sessionToken;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new CameraStreamError('unavailable', 'Camera mediaDevices API is unavailable.');
    }

    const initialDevices = await this.refreshAvailableDevices(token);
    this.assertActiveSession(token);

    let result: { stream: MediaStream; attemptedRear: boolean };

    if (options?.deviceId) {
      const stream = await this.tryGetUserMediaWithTimeout(
        { video: { deviceId: { exact: options.deviceId } }, audio: false },
        token
      );
      result = { stream, attemptedRear: false };
    } else if (options?.facingMode) {
      const stream = await this.openByFacingMode(options.facingMode, initialDevices, token);
      result = { stream, attemptedRear: options.facingMode === 'environment' };
    } else {
      result = await this.openAutoRearStream(initialDevices, token);
    }

    this.assertActiveSession(token, result.stream);

    const devicesAfterStart = initialDevices.some((device) => device.label.trim().length > 0)
      ? initialDevices
      : await this.refreshAvailableDevices(token);

    this.assertActiveSession(token, result.stream);

    const primaryTrack = result.stream.getVideoTracks()[0] ?? null;
    const settings = primaryTrack?.getSettings?.();
    const trackSettings: ActiveCameraTrackSettings = {
      deviceId: settings?.deviceId ?? null,
      facingMode: settings?.facingMode ?? null,
      width: settings?.width ?? null,
      height: settings?.height ?? null,
    };

    this._activeStream.set(result.stream);
    this._activeTrackSettings.set(trackSettings);
    this._torchSupported.set(false);
    this._torchEnabled.set(false);

    if (
      this.shouldPersistRearDevice(trackSettings, devicesAfterStart, options, result.attemptedRear)
    ) {
      this.writePreferredRearDeviceId(trackSettings.deviceId!);
    }

    return result.stream;
  }

  /**
   * Inspects capabilities and applies continuous autofocus / HD resolution upgrades
   * after the first video frame is active, without blocking stream startup.
   */
  async enhanceActiveTrack(track: MediaStreamTrack): Promise<void> {
    const capabilities = track.getCapabilities?.() as ExtendedMediaTrackCapabilities | undefined;
    this._torchSupported.set(Boolean(capabilities?.torch));
    this._torchEnabled.set(false);

    if (!capabilities || !track.applyConstraints) {
      return;
    }

    const constraints: ExtendedMediaTrackConstraints = {};
    let hasUpgrade = false;

    if (capabilities.focusMode?.includes('continuous')) {
      constraints.focusMode = 'continuous';
      hasUpgrade = true;
    }

    if ((capabilities.width?.max ?? 0) >= 1280) {
      constraints.width = { ideal: 1280 };
      constraints.height = { ideal: 720 };
      hasUpgrade = true;
    }

    if (!hasUpgrade) {
      return;
    }

    try {
      await track.applyConstraints(constraints);
    } catch {
      // Non-fatal: some mobile drivers reject optional autofocus or HD upgrades mid-stream.
    }
  }

  /** Toggles the camera flashlight when supported by the active video track. */
  async toggleTorch(): Promise<boolean> {
    if (!this._torchSupported()) {
      return false;
    }

    const track = this._activeStream()?.getVideoTracks()[0];
    if (!track?.applyConstraints) {
      return false;
    }

    const nextState = !this._torchEnabled();
    const constraints: ExtendedMediaTrackConstraints = {
      advanced: [{ torch: nextState }],
    };

    try {
      await track.applyConstraints(constraints);
      this._torchEnabled.set(nextState);
      return nextState;
    } catch {
      return false;
    }
  }

  /** Stops all active tracks, invalidates in-flight startup attempts, and resets signals. */
  stopStream(): void {
    this.sessionToken += 1;
    stopMediaTracks(this._activeStream());
    this._activeStream.set(null);
    this._activeTrackSettings.set(null);
    this._torchSupported.set(false);
    this._torchEnabled.set(false);
  }

  private async openByFacingMode(
    facingMode: 'environment' | 'user',
    devices: readonly RawCameraDevice[],
    token: number
  ): Promise<MediaStream> {
    const targetFacing = facingMode === 'environment' ? 'rear' : 'front';
    const preferredId = facingMode === 'environment' ? this.readPreferredRearDeviceId() : null;

    const rankedIds = this.buildRankedDeviceCandidateIds(devices, targetFacing, preferredId);
    let lastError: unknown;

    for (const deviceId of rankedIds) {
      try {
        return await this.tryGetUserMediaWithTimeout(
          { video: { deviceId: { exact: deviceId } }, audio: false },
          token
        );
      } catch (error) {
        if (isPermissionError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    for (const constraints of [
      { video: { facingMode: { exact: facingMode } }, audio: false },
      { video: { facingMode }, audio: false },
    ] satisfies MediaStreamConstraints[]) {
      try {
        return await this.tryGetUserMediaWithTimeout(constraints, token);
      } catch (error) {
        if (isPermissionError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new CameraStreamError('stream-failed', `Unable to open ${facingMode} camera.`, lastError);
  }

  private async openAutoRearStream(
    initialDevices: readonly RawCameraDevice[],
    token: number
  ): Promise<{ stream: MediaStream; attemptedRear: boolean }> {
    const preferredRearId = this.readPreferredRearDeviceId();
    const rankedRearIds = this.buildRankedDeviceCandidateIds(
      initialDevices,
      'rear',
      preferredRearId
    );
    let lastError: unknown;

    // Steps 1 & 2: Try remembered preferredRearDeviceId first, then ranked Camera2 rear sensors.
    for (const rearId of rankedRearIds) {
      try {
        const stream = await this.tryGetUserMediaWithTimeout(
          { video: { deviceId: { exact: rearId } }, audio: false },
          token
        );
        return { stream, attemptedRear: true };
      } catch (error) {
        if (isPermissionError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    // Step 3a: First-time visit (or all known rear IDs failed) -> try ideal environment.
    try {
      const stream = await this.tryGetUserMediaWithTimeout(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        token
      );
      return { stream, attemptedRear: true };
    } catch (error) {
      if (isPermissionError(error)) {
        throw error;
      }
      lastError = error;
    }

    // Step 3b: Unlock device labels via front camera, then immediately switch to camera 0 rear.
    try {
      const userStream = await this.tryGetUserMediaWithTimeout(
        { video: { facingMode: 'user' }, audio: false },
        token
      );
      const unlockedDevices = await this.refreshAvailableDevices(token);
      this.assertActiveSession(token, userStream);

      const discoveredRearId = pickPrimaryDeviceId(unlockedDevices, 'environment', preferredRearId);
      if (discoveredRearId) {
        stopMediaTracks(userStream);
        try {
          const rearStream = await this.tryGetUserMediaWithTimeout(
            { video: { deviceId: { exact: discoveredRearId } }, audio: false },
            token
          );
          return { stream: rearStream, attemptedRear: true };
        } catch (rearError) {
          if (isPermissionError(rearError)) {
            throw rearError;
          }
          lastError = rearError;
        }
      } else {
        return { stream: userStream, attemptedRear: false };
      }
    } catch (error) {
      if (isPermissionError(error)) {
        throw error;
      }
      lastError = error;
    }

    // Step 3c: Final fallback to any available video stream.
    try {
      const stream = await this.tryGetUserMediaWithTimeout({ video: true, audio: false }, token);
      return { stream, attemptedRear: false };
    } catch (error) {
      if (isPermissionError(error)) {
        throw error;
      }
      lastError = error;
    }

    throw lastError instanceof Error
      ? lastError
      : new CameraStreamError('stream-failed', 'Unable to start any camera stream.', lastError);
  }

  private buildRankedDeviceCandidateIds(
    devices: readonly RawCameraDevice[],
    facing: 'rear' | 'front',
    preferredId: string | null
  ): string[] {
    const ids: string[] = [];

    if (preferredId) {
      const preferredDevice = devices.find(
        (device) =>
          device.kind === 'videoinput' &&
          device.deviceId.trim() === preferredId &&
          !isAuxiliaryCameraLabel(device.label)
      );
      if (preferredDevice) {
        ids.push(preferredDevice.deviceId.trim());
      }
    }

    const ranked = filterAndNormalizeCameras(devices).filter((camera) => camera.facing === facing);
    for (const camera of ranked) {
      if (!ids.includes(camera.id)) {
        ids.push(camera.id);
      }
    }

    return ids;
  }

  private async tryGetUserMediaWithTimeout(
    constraints: MediaStreamConstraints,
    token: number
  ): Promise<MediaStream> {
    this.assertActiveSession(token);

    return new Promise<MediaStream>((resolve, reject) => {
      let settled = false;

      const timerId = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        reject(new CameraStreamError('stream-failed', 'Camera startup attempt timed out.'));
      }, CAMERA_ATTEMPT_TIMEOUT_MS);

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          clearTimeout(timerId);
          if (settled || token !== this.sessionToken) {
            stopMediaTracks(stream);
            if (!settled) {
              settled = true;
              reject(new CameraStreamError('stream-failed', 'Camera startup was cancelled.'));
            }
            return;
          }
          settled = true;
          resolve(stream);
        })
        .catch((error: unknown) => {
          clearTimeout(timerId);
          if (settled) {
            return;
          }
          settled = true;
          reject(error);
        });
    });
  }

  private async refreshAvailableDevices(token: number): Promise<RawCameraDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (token !== this.sessionToken) {
        return [];
      }
      const videoDevices: RawCameraDevice[] = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label,
        }));
      this._availableDevices.set(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }

  private assertActiveSession(token: number, streamToStop?: MediaStream): void {
    if (token !== this.sessionToken) {
      stopMediaTracks(streamToStop);
      throw new CameraStreamError('stream-failed', 'Camera startup was cancelled.');
    }
  }

  private shouldPersistRearDevice(
    settings: ActiveCameraTrackSettings,
    devices: readonly RawCameraDevice[],
    options: StartCameraStreamOptions | undefined,
    attemptedRear: boolean
  ): boolean {
    if (!settings.deviceId) {
      return false;
    }
    if (options?.facingMode === 'user' || settings.facingMode === 'user') {
      return false;
    }

    const matchedDevice = devices.find((device) => device.deviceId === settings.deviceId);
    const labelFacing = matchedDevice ? classifyCameraFacing(matchedDevice.label) : 'unknown';

    if (labelFacing === 'front') {
      return false;
    }

    return (
      settings.facingMode === 'environment' ||
      labelFacing === 'rear' ||
      options?.facingMode === 'environment' ||
      attemptedRear
    );
  }

  private readPreferredRearDeviceId(): string | null {
    try {
      const value = globalThis.localStorage?.getItem(PREFERRED_REAR_DEVICE_KEY);
      const trimmed = value?.trim() ?? '';
      return trimmed.length > 0 ? trimmed : null;
    } catch {
      return null;
    }
  }

  private writePreferredRearDeviceId(deviceId: string): void {
    try {
      globalThis.localStorage?.setItem(PREFERRED_REAR_DEVICE_KEY, deviceId);
    } catch {
      // Ignore storage quota / private browsing errors.
    }
  }
}
