import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAMERA_ATTEMPT_TIMEOUT_MS,
  CameraStreamError,
  CameraStreamService,
  PREFERRED_REAR_DEVICE_KEY,
} from './camera-stream.service';

interface MockTrackOptions {
  deviceId?: string;
  facingMode?: string;
  torch?: boolean;
  focusMode?: string[];
  maxWidth?: number;
  applyConstraintsError?: boolean;
}

function createMockTrack(options: MockTrackOptions = {}): MediaStreamTrack {
  const stop = vi.fn();
  const applyConstraints = vi.fn(async () => {
    if (options.applyConstraintsError) {
      throw new Error('Hardware constraint error');
    }
  });

  return {
    kind: 'video',
    stop,
    applyConstraints,
    getSettings: vi.fn(() => ({
      deviceId: options.deviceId,
      facingMode: options.facingMode,
      width: 640,
      height: 480,
    })),
    getCapabilities: vi.fn(() => ({
      torch: options.torch,
      focusMode: options.focusMode,
      width: options.maxWidth !== undefined ? { min: 320, max: options.maxWidth } : undefined,
    })),
  } as unknown as MediaStreamTrack;
}

function createMockStream(trackOptions: MockTrackOptions = {}): {
  stream: MediaStream;
  track: MediaStreamTrack;
} {
  const track = createMockTrack(trackOptions);
  const stream = {
    getTracks: vi.fn(() => [track]),
    getVideoTracks: vi.fn(() => [track]),
  } as unknown as MediaStream;
  return { stream, track };
}

describe('CameraStreamService', () => {
  let service: CameraStreamService;
  let originalMediaDevices: MediaDevices | undefined;

  beforeEach(() => {
    localStorage.clear();
    originalMediaDevices = navigator.mediaDevices;
    TestBed.configureTestingModule({});
    service = TestBed.inject(CameraStreamService);
  });

  afterEach(() => {
    service.stopStream();
    vi.useRealTimers();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  function setMockMediaDevices(
    enumerateDevices: () => Promise<MediaDeviceInfo[]>,
    getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  ): void {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(enumerateDevices),
        getUserMedia: vi.fn(getUserMedia),
      },
    });
  }

  it('throws typed unavailable error when navigator.mediaDevices is missing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    await expect(service.startStream()).rejects.toSatisfy(
      (error: unknown) => error instanceof CameraStreamError && error.code === 'unavailable'
    );
  });

  it('opens remembered preferredRearDeviceId directly on Attempt 0 with 1 getUserMedia call', async () => {
    localStorage.setItem(PREFERRED_REAR_DEVICE_KEY, 'cam-0');
    const { stream } = createMockStream({ deviceId: 'cam-0', facingMode: 'environment' });

    const devices = [
      { deviceId: 'cam-4', kind: 'videoinput', label: 'camera 4, facing back' },
      { deviceId: 'cam-0', kind: 'videoinput', label: 'camera 0, facing back' },
      { deviceId: 'cam-1', kind: 'videoinput', label: 'camera 1, facing front' },
    ] as MediaDeviceInfo[];

    const getUserMediaSpy = vi.fn(async () => stream);
    setMockMediaDevices(async () => devices, getUserMediaSpy);

    const active = await service.startStream();

    expect(active).toBe(stream);
    expect(getUserMediaSpy).toHaveBeenCalledTimes(1);
    expect(getUserMediaSpy).toHaveBeenCalledWith({
      video: { deviceId: { exact: 'cam-0' } },
      audio: false,
    });
    expect(service.activeStream()).toBe(stream);
    expect(service.activeTrackSettings()?.deviceId).toBe('cam-0');
  });

  it('times out a dead auxiliary sensor, falls back to the next working sensor, and stops late-resolving stale streams', async () => {
    vi.useFakeTimers();

    const stale = createMockStream({ deviceId: 'cam-4', facingMode: 'environment' });
    const working = createMockStream({ deviceId: 'cam-2', facingMode: 'environment' });

    let resolveStale!: (value: MediaStream) => void;
    const devices = [
      { deviceId: 'cam-4', kind: 'videoinput', label: 'camera 0, facing back' },
      { deviceId: 'cam-2', kind: 'videoinput', label: 'camera 2, facing back' },
    ] as MediaDeviceInfo[];

    const getUserMediaSpy = vi
      .fn<(constraints: MediaStreamConstraints) => Promise<MediaStream>>()
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveStale = resolve;
          })
      )
      .mockResolvedValueOnce(working.stream);

    setMockMediaDevices(async () => devices, getUserMediaSpy);

    const startPromise = service.startStream();
    await vi.advanceTimersByTimeAsync(CAMERA_ATTEMPT_TIMEOUT_MS + 10);
    const active = await startPromise;

    expect(active).toBe(working.stream);
    expect(getUserMediaSpy).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(PREFERRED_REAR_DEVICE_KEY)).toBe('cam-2');

    // Late resolution of the timed-out stream must immediately stop its tracks.
    resolveStale(stale.stream);
    await Promise.resolve();
    expect(stale.track.stop).toHaveBeenCalledTimes(1);
  });

  it('falls back to user camera on first-visit environment hang, unlocks labels, and upgrades to camera 0 rear', async () => {
    vi.useFakeTimers();

    const userMock = createMockStream({ deviceId: 'cam-1', facingMode: 'user' });
    const rearMock = createMockStream({ deviceId: 'cam-0', facingMode: 'environment' });

    let unlocked = false;
    const getUserMediaSpy = vi.fn(async (constraints: MediaStreamConstraints) => {
      const video = constraints.video as MediaTrackConstraints;
      if (
        typeof video.facingMode === 'object' &&
        video.facingMode !== null &&
        'ideal' in video.facingMode &&
        video.facingMode.ideal === 'environment'
      ) {
        return new Promise<MediaStream>(() => {
          // Simulates hanging HAL on first-visit environment constraint.
        });
      }
      if (video.facingMode === 'user') {
        unlocked = true;
        return userMock.stream;
      }
      if (
        typeof video.deviceId === 'object' &&
        video.deviceId !== null &&
        'exact' in video.deviceId &&
        video.deviceId.exact === 'cam-0'
      ) {
        return rearMock.stream;
      }
      throw new Error('Unexpected constraint');
    });

    setMockMediaDevices(async () => {
      if (!unlocked) {
        return [{ deviceId: '', kind: 'videoinput', label: '' }] as MediaDeviceInfo[];
      }
      return [
        { deviceId: 'cam-4', kind: 'videoinput', label: 'camera 4, facing back' },
        { deviceId: 'cam-0', kind: 'videoinput', label: 'camera 0, facing back' },
        { deviceId: 'cam-1', kind: 'videoinput', label: 'camera 1, facing front' },
      ] as MediaDeviceInfo[];
    }, getUserMediaSpy);

    const startPromise = service.startStream();
    await vi.advanceTimersByTimeAsync(CAMERA_ATTEMPT_TIMEOUT_MS + 10);
    const active = await startPromise;

    expect(active).toBe(rearMock.stream);
    expect(userMock.track.stop).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(PREFERRED_REAR_DEVICE_KEY)).toBe('cam-0');
  });

  it('short-circuits immediately on NotAllowedError without retrying', async () => {
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    const getUserMediaSpy = vi.fn(async () => {
      throw permissionError;
    });

    setMockMediaDevices(async () => [], getUserMediaSpy);

    await expect(service.startStream()).rejects.toBe(permissionError);
    expect(getUserMediaSpy).toHaveBeenCalledTimes(1);
  });

  it('detects torchSupported, toggles torch constraints, and upgrades focus/HD in enhanceActiveTrack', async () => {
    const { stream, track } = createMockStream({
      deviceId: 'cam-0',
      facingMode: 'environment',
      torch: true,
      focusMode: ['continuous'],
      maxWidth: 1920,
    });

    setMockMediaDevices(
      async () => [],
      async () => stream
    );
    await service.startStream();

    expect(service.torchSupported()).toBe(false);
    await service.enhanceActiveTrack(track);

    expect(service.torchSupported()).toBe(true);
    expect(service.torchEnabled()).toBe(false);
    expect(track.applyConstraints).toHaveBeenCalledWith({
      focusMode: 'continuous',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    });

    const onResult = await service.toggleTorch();
    expect(onResult).toBe(true);
    expect(service.torchEnabled()).toBe(true);
    expect(track.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });

    const offResult = await service.toggleTorch();
    expect(offResult).toBe(false);
    expect(service.torchEnabled()).toBe(false);
  });

  it('stops all tracks and resets signals cleanly in stopStream()', async () => {
    const { stream, track } = createMockStream({
      deviceId: 'cam-0',
      facingMode: 'environment',
      torch: true,
    });

    setMockMediaDevices(
      async () => [],
      async () => stream
    );
    await service.startStream();
    await service.enhanceActiveTrack(track);
    await service.toggleTorch();

    expect(service.activeStream()).toBe(stream);
    expect(service.torchEnabled()).toBe(true);

    service.stopStream();

    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(service.activeStream()).toBeNull();
    expect(service.activeTrackSettings()).toBeNull();
    expect(service.torchSupported()).toBe(false);
    expect(service.torchEnabled()).toBe(false);
  });
});
