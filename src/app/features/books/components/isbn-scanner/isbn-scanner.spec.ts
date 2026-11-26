import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import {
  BarcodeDecoderService,
  type BarcodeDetectionResult,
  type ImageFileDecodeResult,
} from '../../services/barcode-decoder.service';
import {
  CameraStreamError,
  CameraStreamService,
  type ActiveCameraTrackSettings,
  type StartCameraStreamOptions,
} from '../../services/camera-stream.service';
import type { RawCameraDevice } from '../../utils/camera-selection.utils';
import { IsbnScannerComponent } from './isbn-scanner';

const flushAsync = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

function createMockVideoStream(deviceId = 'cam-back'): MediaStream {
  const track = {
    stop: vi.fn(),
    getSettings: () => ({ deviceId }),
  } as unknown as MediaStreamTrack;
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

function stubVideoElementPlayback(video: HTMLVideoElement): ReturnType<typeof vi.fn> {
  Object.defineProperty(video, 'readyState', {
    configurable: true,
    value: HTMLMediaElement.HAVE_ENOUGH_DATA,
  });
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: 1280 });
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: 720 });
  const playSpy = vi.fn().mockResolvedValue(undefined);
  video.play = playSpy;
  return playSpy;
}

describe('IsbnScannerComponent', () => {
  let activeStreamSig: WritableSignal<MediaStream | null>;
  let activeTrackSettingsSig: WritableSignal<ActiveCameraTrackSettings | null>;
  let availableDevicesSig: WritableSignal<RawCameraDevice[]>;
  let torchSupportedSig: WritableSignal<boolean>;
  let torchEnabledSig: WritableSignal<boolean>;
  let scannerPreferPhotoModeSig: WritableSignal<boolean>;
  let scannerAutoTorchSig: WritableSignal<boolean>;

  let startStreamMock: ReturnType<
    typeof vi.fn<(options?: StartCameraStreamOptions) => Promise<MediaStream>>
  >;
  let enhanceActiveTrackMock: ReturnType<typeof vi.fn<(track: MediaStreamTrack) => Promise<void>>>;
  let toggleTorchMock: ReturnType<typeof vi.fn<() => Promise<boolean>>>;
  let stopStreamMock: ReturnType<typeof vi.fn<() => void>>;
  let decodeFromVideoMock: ReturnType<
    typeof vi.fn<(video: HTMLVideoElement) => Promise<BarcodeDetectionResult | null>>
  >;
  let decodeFromImageFileMock: ReturnType<
    typeof vi.fn<(file: File) => Promise<ImageFileDecodeResult>>
  >;

  beforeEach(async () => {
    activeStreamSig = signal<MediaStream | null>(null);
    activeTrackSettingsSig = signal<ActiveCameraTrackSettings | null>({
      deviceId: 'cam-back',
      facingMode: 'environment',
      width: 1280,
      height: 720,
    });
    availableDevicesSig = signal<RawCameraDevice[]>([
      { deviceId: 'cam-front', kind: 'videoinput', label: 'camera2 1, facing front' },
      { deviceId: 'cam-back', kind: 'videoinput', label: 'camera2 0, facing back' },
    ]);
    torchSupportedSig = signal(false);
    torchEnabledSig = signal(false);
    scannerPreferPhotoModeSig = signal(false);
    scannerAutoTorchSig = signal(false);

    startStreamMock = vi.fn(async (options?: StartCameraStreamOptions) => {
      const deviceId =
        options?.deviceId ?? (options?.facingMode === 'user' ? 'cam-front' : 'cam-back');
      const facingMode = options?.facingMode ?? (deviceId === 'cam-front' ? 'user' : 'environment');
      const stream = createMockVideoStream(deviceId);
      activeStreamSig.set(stream);
      activeTrackSettingsSig.set({ deviceId, facingMode, width: 1280, height: 720 });
      return stream;
    });
    enhanceActiveTrackMock = vi.fn(async () => undefined);
    toggleTorchMock = vi.fn(async () => {
      const next = !torchEnabledSig();
      torchEnabledSig.set(next);
      return next;
    });
    stopStreamMock = vi.fn(() => {
      activeStreamSig.set(null);
      torchSupportedSig.set(false);
      torchEnabledSig.set(false);
    });

    decodeFromVideoMock = vi.fn(async () => null);
    decodeFromImageFileMock = vi.fn(async () => ({
      status: 'isbn',
      isbn: '9780441172719',
    }));

    await TestBed.configureTestingModule({
      imports: [IsbnScannerComponent],
      providers: [
        {
          provide: CameraStreamService,
          useValue: {
            activeStream: activeStreamSig.asReadonly(),
            activeTrackSettings: activeTrackSettingsSig.asReadonly(),
            availableDevices: availableDevicesSig.asReadonly(),
            torchSupported: torchSupportedSig.asReadonly(),
            torchEnabled: torchEnabledSig.asReadonly(),
            startStream: startStreamMock,
            enhanceActiveTrack: enhanceActiveTrackMock,
            toggleTorch: toggleTorchMock,
            stopStream: stopStreamMock,
            grantCameraConsent: vi.fn(),
          },
        },
        {
          provide: BarcodeDecoderService,
          useValue: {
            decodeFromVideo: decodeFromVideoMock,
            decodeFromImageFile: decodeFromImageFileMock,
          },
        },
        {
          provide: AppPreferencesService,
          useValue: {
            scannerPreferPhotoMode: scannerPreferPhotoModeSig.asReadonly(),
            scannerAutoTorch: scannerAutoTorchSig.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
  });

  const mountScanner = async (): Promise<{
    fixture: ComponentFixture<IsbnScannerComponent>;
    video: HTMLVideoElement;
    playSpy: ReturnType<typeof vi.fn>;
  }> => {
    const fixture = TestBed.createComponent(IsbnScannerComponent);
    fixture.detectChanges();
    const video = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    const playSpy = stubVideoElementPlayback(video);
    await flushAsync();
    fixture.detectChanges();
    return { fixture, video, playSpy };
  };

  it('starts the camera on mount, attaches MediaStream to <video>, and enhances the active track', async () => {
    const { fixture, video, playSpy } = await mountScanner();

    expect(startStreamMock).toHaveBeenCalledTimes(1);
    expect(video.srcObject).not.toBeNull();
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(enhanceActiveTrackMock).toHaveBeenCalledTimes(1);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="isbn-scanner-viewport"]')).toBeTruthy();

    fixture.destroy();
  });

  it('emits normalized ISBN from live decode loop and stops camera tracks', async () => {
    decodeFromVideoMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      rawValue: '978-0-441-17271-9',
      normalizedIsbn: '9780441172719',
      format: 'ean_13',
    });

    const { fixture, video } = await mountScanner();
    const emitted: string[] = [];
    fixture.componentInstance.isbnDetected.subscribe((isbn) => emitted.push(isbn));

    await vi.waitFor(() => {
      expect(emitted).toEqual(['9780441172719']);
    });

    expect(stopStreamMock).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();

    fixture.destroy();
  });

  it('collapses Android multi-lens cameras to 1-tap toggle-camera-facing-btn and switches facing mode', async () => {
    availableDevicesSig.set([
      { deviceId: 'cam-back-main', kind: 'videoinput', label: 'camera2 0, facing back' },
      {
        deviceId: 'cam-back-wide',
        kind: 'videoinput',
        label: 'camera2 2, facing back, ultra wide',
      },
      { deviceId: 'cam-front', kind: 'videoinput', label: 'camera2 1, facing front' },
    ]);
    activeTrackSettingsSig.set({
      deviceId: 'cam-back-main',
      facingMode: 'environment',
      width: 1280,
      height: 720,
    });

    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    const toggleBtn = root.querySelector(
      '[data-testid="toggle-camera-facing-btn"]'
    ) as HTMLButtonElement | null;
    expect(toggleBtn).toBeTruthy();
    expect(root.querySelector('[data-testid="camera-device-select"]')).toBeNull();

    toggleBtn?.click();
    await flushAsync();
    fixture.detectChanges();

    expect(startStreamMock).toHaveBeenLastCalledWith({ facingMode: 'user' });
    fixture.destroy();
  });

  it('renders camera-device-select on desktop multi-webcam setups and switches by deviceId', async () => {
    availableDevicesSig.set([
      { deviceId: 'usb-logi', kind: 'videoinput', label: 'Logitech C920 HD Pro' },
      { deviceId: 'usb-elgato', kind: 'videoinput', label: 'Elgato Facecam' },
    ]);
    activeTrackSettingsSig.set({
      deviceId: 'usb-logi',
      facingMode: null,
      width: 1280,
      height: 720,
    });

    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    const select = root.querySelector(
      '[data-testid="camera-device-select"]'
    ) as HTMLSelectElement | null;
    expect(select).toBeTruthy();
    expect(root.querySelector('[data-testid="toggle-camera-facing-btn"]')).toBeNull();

    if (select) {
      select.value = 'usb-elgato';
      select.dispatchEvent(new Event('change'));
    }
    await flushAsync();
    fixture.detectChanges();

    expect(startStreamMock).toHaveBeenLastCalledWith({ deviceId: 'usb-elgato' });
    fixture.destroy();
  });

  it('hides camera switcher controls when only a single camera is available', async () => {
    availableDevicesSig.set([
      { deviceId: 'single-cam', kind: 'videoinput', label: 'Integrated Webcam' },
    ]);

    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="toggle-camera-facing-btn"]')).toBeNull();
    expect(root.querySelector('[data-testid="camera-device-select"]')).toBeNull();

    fixture.destroy();
  });

  it('renders toggle-torch-btn only when torchSupported is true and toggles aria-pressed', async () => {
    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="toggle-torch-btn"]')).toBeNull();

    torchSupportedSig.set(true);
    fixture.detectChanges();

    const torchBtn = root.querySelector(
      '[data-testid="toggle-torch-btn"]'
    ) as HTMLButtonElement | null;
    expect(torchBtn).toBeTruthy();
    expect(torchBtn?.getAttribute('aria-pressed')).toBe('false');

    torchBtn?.click();
    await flushAsync();
    fixture.detectChanges();

    expect(toggleTorchMock).toHaveBeenCalledTimes(1);
    expect(torchBtn?.getAttribute('aria-pressed')).toBe('true');

    fixture.destroy();
  });

  it('handles photo upload isbn, invalid-barcode, and no-barcode outcomes', async () => {
    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;
    const emitted: string[] = [];
    fixture.componentInstance.isbnDetected.subscribe((isbn) => emitted.push(isbn));

    const fileInput = root.querySelector('input[type="file"]') as HTMLInputElement;
    const uploadFile = async (name: string) => {
      const file = new File(['mock'], name, { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { configurable: true, value: [file] });
      fileInput.dispatchEvent(new Event('change'));
      await flushAsync();
      fixture.detectChanges();
    };

    decodeFromImageFileMock.mockResolvedValueOnce({ status: 'isbn', isbn: '9780441172719' });
    await uploadFile('valid.png');
    expect(emitted).toEqual(['9780441172719']);

    decodeFromImageFileMock.mockResolvedValueOnce({
      status: 'invalid-barcode',
      rawValue: '12345',
    });
    await uploadFile('invalid.png');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'The scanned barcode is not a valid ISBN.'
    );

    decodeFromImageFileMock.mockResolvedValueOnce({ status: 'no-barcode' });
    await uploadFile('empty.png');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'No ISBN barcode was found in the selected image.'
    );

    fixture.destroy();
  });

  it('shows permission error on NotAllowedError and cleans up tracks on destroy', async () => {
    const permissionError = Object.assign(new Error('Permission denied'), {
      name: 'NotAllowedError',
    });
    startStreamMock.mockRejectedValueOnce(permissionError);

    const { fixture, video } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Camera permission denied.'
    );
    expect(video.srcObject).toBeNull();

    // Now test destroy cleanup after successful start
    startStreamMock.mockImplementationOnce(async () => createMockVideoStream('cam-back'));
    const startBtn = root.querySelector('footer button') as HTMLButtonElement;
    startBtn.click();
    await flushAsync();
    fixture.detectChanges();

    expect(video.srcObject).not.toBeNull();
    stopStreamMock.mockClear();

    fixture.destroy();
    expect(stopStreamMock).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBeNull();
  });

  it('acquires body scroll lock on mount, releases on destroy, and closes on Escape or backdrop click', async () => {
    const { fixture } = await mountScanner();
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    // Clicking inside the dialog panel should not close
    const root = fixture.nativeElement as HTMLElement;
    const viewport = root.querySelector('[data-testid="isbn-scanner-viewport"]') as HTMLElement;
    viewport.click();
    expect(closedSpy).not.toHaveBeenCalled();

    // Clicking the backdrop itself closes the scanner
    const modalBackdrop = root.querySelector('[data-testid="isbn-scanner-modal"]') as HTMLElement;
    modalBackdrop.click();
    expect(closedSpy).toHaveBeenCalledTimes(1);

    // Pressing Escape also closes and stops camera
    stopStreamMock.mockClear();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).toHaveBeenCalledTimes(2);
    expect(stopStreamMock).toHaveBeenCalled();

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('shows camera unavailable error when CameraStreamError is thrown', async () => {
    startStreamMock.mockRejectedValueOnce(
      new CameraStreamError('unavailable', 'No camera devices available')
    );

    const { fixture } = await mountScanner();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'No available camera was detected on this device.'
    );

    fixture.destroy();
  });

  it('skips auto-starting live camera when scannerPreferPhotoMode is enabled', async () => {
    scannerPreferPhotoModeSig.set(true);
    const { fixture } = await mountScanner();

    expect(startStreamMock).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('auto-enables torch when scannerAutoTorch is enabled and rear camera supports torch', async () => {
    scannerAutoTorchSig.set(true);
    torchSupportedSig.set(true);

    const { fixture } = await mountScanner();
    await flushAsync();

    expect(toggleTorchMock).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
});
