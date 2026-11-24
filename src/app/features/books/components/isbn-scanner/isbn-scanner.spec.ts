import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { IsbnScannerComponent } from './isbn-scanner';

interface MockHtml5QrcodeInstance {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  scanFile: ReturnType<typeof vi.fn>;
}

const flushMicrotasks = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

describe('IsbnScannerComponent', () => {
  let capturedSuccessCallback: ((decodedText: string) => void) | null = null;
  let mockCameras: { id: string; label: string }[];
  let getCamerasMock: ReturnType<typeof vi.fn>;
  let startMock: ReturnType<typeof vi.fn>;
  let stopMock: ReturnType<typeof vi.fn>;
  let clearMock: ReturnType<typeof vi.fn>;
  let scanFileMock: ReturnType<typeof vi.fn>;
  let mockLibrary: typeof import('html5-qrcode');

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

  const clickEnableCamera = async (
    fixture: ComponentFixture<IsbnScannerComponent>
  ): Promise<void> => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="enable-camera-consent-btn"]'
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    btn!.click();
    await flushMicrotasks();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    IsbnScannerComponent.resetSessionConsent();
    localStorage.clear();
    capturedSuccessCallback = null;
    mockCameras = [
      { id: 'cam-front', label: 'Front Camera' },
      { id: 'cam-back', label: 'Back Camera' },
    ];

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
    getCamerasMock = vi.fn(async () => mockCameras);

    class MockHtml5Qrcode implements MockHtml5QrcodeInstance {
      static getCameras = getCamerasMock;
      start = startMock;
      stop = stopMock;
      clear = clearMock;
      scanFile = scanFileMock;
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
    vi.restoreAllMocks();
  });

  it('stays idle without starting camera on init until user grants consent, then auto-starts in same session', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(startMock).not.toHaveBeenCalled();
    const root = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);
    expect(root.textContent).toContain(i18n.t().bookForm.lookup.cameraConsentHint);
    expect(root.textContent).toContain(i18n.t().bookForm.lookup.enableCamera);

    await clickEnableCamera(fixture);

    expect(getCamerasMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledWith(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 120 } },
      expect.any(Function),
      expect.any(Function)
    );
    expect(root.textContent).toContain(i18n.t().bookForm.lookup.stopCamera);

    // Subsequent mount in the same session reuses granted consent
    const secondFixture = createFixture();
    secondFixture.detectChanges();
    await flushMicrotasks();
    expect(startMock).toHaveBeenCalledTimes(2);
  });

  it('ignores non-ISBN barcodes without stopping camera and emits normalized ISBN-13 on valid scan', async () => {
    const fixture = createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.isbnDetected.subscribe((isbn) => emitted.push(isbn));

    fixture.detectChanges();
    await clickEnableCamera(fixture);

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
    await clickEnableCamera(fixture);

    fixture.destroy();
    await flushMicrotasks();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it('switches cameras when multiple devices are available', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await clickEnableCamera(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const selectEl = root.querySelector('select') as HTMLSelectElement;
    expect(selectEl).not.toBeNull();

    selectEl.value = 'cam-front';
    selectEl.dispatchEvent(new Event('change'));
    await flushMicrotasks();
    fixture.detectChanges();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenLastCalledWith(
      'cam-front',
      { fps: 10, qrbox: { width: 240, height: 120 } },
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('shows permissionError when camera access is denied', async () => {
    startMock.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));

    const fixture = createFixture();
    fixture.detectChanges();
    await clickEnableCamera(fixture);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(
      TestBed.inject(I18nService).t().bookForm.lookup.permissionError
    );
  });

  it('shows cameraUnavailableError when no camera device is found', async () => {
    mockCameras = [];
    startMock.mockRejectedValueOnce(
      new DOMException('Requested device not found', 'NotFoundError')
    );

    const fixture = createFixture();
    fixture.detectChanges();
    await clickEnableCamera(fixture);

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
    await clickEnableCamera(fixture);

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
