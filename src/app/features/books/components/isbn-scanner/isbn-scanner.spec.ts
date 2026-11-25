import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { IsbnScannerComponent } from './isbn-scanner';

interface MockHtml5QrcodeInstance {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  scanFile: ReturnType<typeof vi.fn>;
  getRunningTrackSettings: ReturnType<typeof vi.fn>;
  getRunningTrackCapabilities: ReturnType<typeof vi.fn>;
  applyVideoConstraints: ReturnType<typeof vi.fn>;
}

const flushMicrotasks = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

describe('IsbnScannerComponent', () => {
  let capturedSuccessCallback: ((decodedText: string) => void) | null = null;
  let mockMediaDevicesList: Array<{ deviceId: string; kind: string; label: string }>;
  let getCamerasMock: ReturnType<typeof vi.fn>;
  let enumerateDevicesMock: ReturnType<typeof vi.fn>;
  let startMock: ReturnType<typeof vi.fn>;
  let stopMock: ReturnType<typeof vi.fn>;
  let clearMock: ReturnType<typeof vi.fn>;
  let scanFileMock: ReturnType<typeof vi.fn>;
  let getRunningTrackSettingsMock: ReturnType<typeof vi.fn>;
  let getRunningTrackCapabilitiesMock: ReturnType<typeof vi.fn>;
  let applyVideoConstraintsMock: ReturnType<typeof vi.fn>;
  let mockLibrary: typeof import('html5-qrcode');
  let originalMediaDevices: MediaDevices | undefined;

  const createFixture = (): ComponentFixture<IsbnScannerComponent> => {
    const fixture = TestBed.createComponent(IsbnScannerComponent);
    vi.spyOn(
      fixture.componentInstance as unknown as {
        loadScannerLibrary: () => Promise<typeof import('html5-qrcode')>;
      },
      'loadScannerLibrary'
    ).mockResolvedValue(mockLibrary);
    return fixture;
  };

  beforeEach(async () => {
    localStorage.clear();
    capturedSuccessCallback = null;
    mockMediaDevicesList = [
      { deviceId: 'cam-front', kind: 'videoinput', label: 'camera2 1, facing front' },
      { deviceId: 'cam-back', kind: 'videoinput', label: 'camera2 0, facing back' },
    ];

    originalMediaDevices = navigator.mediaDevices;
    enumerateDevicesMock = vi.fn(async () => mockMediaDevicesList);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: enumerateDevicesMock,
      },
    });

    startMock = vi.fn(
      async (
        _cameraIdOrConfig: string | MediaTrackConstraints,
        _config: unknown,
        onSuccess: (decodedText: string) => void
      ) => {
        capturedSuccessCallback = onSuccess;
        return null;
      }
    );
    stopMock = vi.fn(async () => undefined);
    clearMock = vi.fn(() => undefined);
    scanFileMock = vi.fn(async () => '9780441172719');
    getRunningTrackSettingsMock = vi.fn(() => ({ deviceId: 'cam-back' }));
    getRunningTrackCapabilitiesMock = vi.fn(() => ({}));
    applyVideoConstraintsMock = vi.fn(async () => undefined);
    getCamerasMock = vi.fn(async () => []);

    class MockHtml5Qrcode implements MockHtml5QrcodeInstance {
      static getCameras = getCamerasMock;
      start = startMock;
      stop = stopMock;
      clear = clearMock;
      scanFile = scanFileMock;
      getRunningTrackSettings = getRunningTrackSettingsMock;
      getRunningTrackCapabilities = getRunningTrackCapabilitiesMock;
      applyVideoConstraints = applyVideoConstraintsMock;
    }

    mockLibrary = {
      Html5Qrcode: MockHtml5Qrcode as unknown as typeof import('html5-qrcode').Html5Qrcode,
      Html5QrcodeSupportedFormats: {
        EAN_13: 9,
        EAN_8: 10,
        UPC_A: 14,
        CODE_128: 5,
      },
    } as unknown as typeof import('html5-qrcode');

    await TestBed.configureTestingModule({
      imports: [IsbnScannerComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('auto-starts rear HD camera immediately on mount without calling Html5Qrcode.getCameras() and shows inline privacy hint', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(getCamerasMock).not.toHaveBeenCalled();
    expect(enumerateDevicesMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledWith(
      { facingMode: { ideal: 'environment' } },
      {
        fps: 10,
        qrbox: expect.any(Function),
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      expect.any(Function),
      expect.any(Function)
    );

    const root = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);
    expect(root.querySelector('[data-testid="enable-camera-consent-btn"]')).toBeNull();
    expect(root.textContent).toContain(i18n.t().bookForm.lookup.cameraConsentHint);
    expect(root.textContent).toContain(i18n.t().bookForm.lookup.stopCamera);
  });

  it('applies continuous autofocus when running track capabilities support it', async () => {
    getRunningTrackCapabilitiesMock.mockReturnValue({
      focusMode: ['manual', 'continuous'],
    });

    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(applyVideoConstraintsMock).toHaveBeenCalledWith({
      advanced: [{ focusMode: 'continuous' }],
    });
  });

  it('falls back to bare environment and then front camera on OverconstrainedError', async () => {
    startMock
      .mockRejectedValueOnce(new DOMException('Overconstrained', 'OverconstrainedError'))
      .mockRejectedValueOnce(new DOMException('NotFound', 'NotFoundError'))
      .mockImplementationOnce(
        async (
          _cameraIdOrConfig: string | MediaTrackConstraints,
          _config: unknown,
          onSuccess: (decodedText: string) => void
        ) => {
          capturedSuccessCallback = onSuccess;
          return null;
        }
      );

    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(startMock).toHaveBeenCalledTimes(3);
    expect(startMock.mock.calls[0]?.[0]).toEqual({ facingMode: { ideal: 'environment' } });
    expect(startMock.mock.calls[1]?.[0]).toEqual({ facingMode: 'environment' });
    expect(startMock.mock.calls[2]?.[0]).toEqual({ facingMode: 'user' });
  });

  it('does not fall back when permission is denied (NotAllowedError)', async () => {
    startMock.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));

    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(startMock).toHaveBeenCalledTimes(1);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.permissionError
    );
  });

  it('shows 1-tap facing toggle on mobile when rear and front cameras exist and switches between them', async () => {
    mockMediaDevicesList = [
      { deviceId: 'cam-back', kind: 'videoinput', label: 'camera2 0, facing back' },
      { deviceId: 'cam-depth', kind: 'videoinput', label: 'camera2 2, facing back (depth)' },
      { deviceId: 'cam-macro', kind: 'videoinput', label: 'camera2 3, macro' },
      { deviceId: 'cam-front', kind: 'videoinput', label: 'camera2 1, facing front' },
    ];
    getRunningTrackSettingsMock.mockReturnValue({ deviceId: 'cam-back' });

    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const toggleBtn = root.querySelector(
      '[data-testid="toggle-camera-facing-btn"]'
    ) as HTMLButtonElement | null;
    expect(toggleBtn).not.toBeNull();
    expect(root.querySelector('[data-testid="camera-device-select"]')).toBeNull();
    expect(toggleBtn!.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.switchToFrontCamera
    );

    getRunningTrackSettingsMock.mockReturnValue({ deviceId: 'cam-front' });
    toggleBtn!.click();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenLastCalledWith(
      'cam-front',
      {
        fps: 10,
        qrbox: expect.any(Function),
        videoConstraints: {
          deviceId: { exact: 'cam-front' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('hides switcher for a single webcam and shows select dropdown for multiple desktop webcams', async () => {
    mockMediaDevicesList = [
      { deviceId: 'usb-1', kind: 'videoinput', label: 'Logitech HD Webcam (046d:082d)' },
    ];
    getRunningTrackSettingsMock.mockReturnValue({ deviceId: 'usb-1' });

    const singleFixture = createFixture();
    singleFixture.detectChanges();
    await flushMicrotasks();
    singleFixture.detectChanges();

    const singleRoot = singleFixture.nativeElement as HTMLElement;
    expect(singleRoot.querySelector('[data-testid="toggle-camera-facing-btn"]')).toBeNull();
    expect(singleRoot.querySelector('[data-testid="camera-device-select"]')).toBeNull();
    singleFixture.destroy();

    mockMediaDevicesList = [
      { deviceId: 'usb-1', kind: 'videoinput', label: 'Logitech C920 (046d:082d)' },
      { deviceId: 'usb-2', kind: 'videoinput', label: 'Elgato Facecam (0fd9:0078)' },
    ];
    const multiFixture = createFixture();
    multiFixture.detectChanges();
    await flushMicrotasks();
    multiFixture.detectChanges();

    const multiRoot = multiFixture.nativeElement as HTMLElement;
    const selectEl = multiRoot.querySelector(
      '[data-testid="camera-device-select"]'
    ) as HTMLSelectElement | null;
    expect(selectEl).not.toBeNull();
    expect(selectEl!.options[1]?.textContent).toBe('Logitech C920');
    expect(selectEl!.options[2]?.textContent).toBe('Elgato Facecam');

    selectEl!.value = 'usb-2';
    selectEl!.dispatchEvent(new Event('change'));
    await flushMicrotasks();
    multiFixture.detectChanges();

    expect(startMock).toHaveBeenLastCalledWith(
      'usb-2',
      expect.objectContaining({
        videoConstraints: {
          deviceId: { exact: 'usb-2' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('ignores non-ISBN barcodes without stopping camera and emits normalized ISBN-13 on valid scan', async () => {
    const fixture = createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.isbnDetected.subscribe((isbn) => emitted.push(isbn));

    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(capturedSuccessCallback).not.toBeNull();

    // 5-digit price add-on barcode or invalid EAN should be ignored
    capturedSuccessCallback!('51999');
    await flushMicrotasks();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(stopMock).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.invalidBarcodeError
    );

    // Valid ISBN-10 (Dune: 0-441-17271-7) normalizes to 9780441172719 and stops camera
    capturedSuccessCallback!('0441172717');
    await flushMicrotasks();
    fixture.detectChanges();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual(['9780441172719']);
  });

  it('guarantees camera stream teardown on ngOnDestroy', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    fixture.destroy();
    await flushMicrotasks();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it('shows cameraUnavailableError when no camera device is found', async () => {
    mockMediaDevicesList = [];
    startMock.mockRejectedValue(new DOMException('Requested device not found', 'NotFoundError'));

    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.cameraUnavailableError
    );
  });

  it('scans uploaded image file, stops live camera, and emits normalized ISBN-13', async () => {
    const fixture = createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.isbnDetected.subscribe((isbn) => emitted.push(isbn));

    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const fileInput = root.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['barcode'], 'barcode.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

    scanFileMock.mockResolvedValueOnce('978-0-441-17271-9');
    fileInput.dispatchEvent(new Event('change'));
    await flushMicrotasks();
    fixture.detectChanges();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(scanFileMock).toHaveBeenCalledWith(file, false);
    expect(emitted).toEqual(['9780441172719']);
  });

  it('shows invalidBarcodeError when uploaded image contains a non-ISBN barcode', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();

    const root = fixture.nativeElement as HTMLElement;
    const fileInput = root.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['barcode'], 'product.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

    scanFileMock.mockResolvedValueOnce('4006381333931');
    fileInput.dispatchEvent(new Event('change'));
    await flushMicrotasks();
    fixture.detectChanges();

    expect(root.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.invalidBarcodeError
    );
  });

  it('shows noBarcodeInImageError when uploaded image cannot be decoded', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();

    const root = fixture.nativeElement as HTMLElement;
    const fileInput = root.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['blank'], 'blank.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

    scanFileMock.mockRejectedValueOnce(
      new Error('No MultiFormat Readers were able to detect the code')
    );
    fileInput.dispatchEvent(new Event('change'));
    await flushMicrotasks();
    fixture.detectChanges();

    expect(root.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.noBarcodeInImageError
    );
  });

  it('stacks scanner control buttons full-width on mobile with 44px touch targets', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const controlsBar = root.querySelector('div.mt-3.grid') as HTMLElement;
    expect(controlsBar).toBeTruthy();
    expect(controlsBar.className).toContain('grid-cols-1');
    expect(controlsBar.className).toContain('sm:flex');

    const buttons = Array.from(controlsBar.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    for (const button of buttons) {
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('w-full');
    }
  });
});
