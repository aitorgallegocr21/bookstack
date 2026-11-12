import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ImageOptimizerService } from '../../services/image-optimizer.service';
import { CoverPickerComponent } from './cover-picker';

describe('CoverPickerComponent', () => {
  let optimizeMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    optimizeMock = vi.fn(async () => 'data:image/webp;base64,optimized');

    await TestBed.configureTestingModule({
      imports: [CoverPickerComponent],
      providers: [
        {
          provide: ImageOptimizerService,
          useValue: {
            optimize: optimizeMock,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should emit coverUrl updates when typing a valid URL and clear preview when removed', () => {
    const fixture = TestBed.createComponent(CoverPickerComponent);
    fixture.componentRef.setInput('idPrefix', 'create');

    const emitted: string[] = [];
    fixture.componentInstance.coverUrl.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const urlInput = root.querySelector('#create-book-cover-url') as HTMLInputElement;
    urlInput.value = 'https://example.com/dune.jpg';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitted.at(-1)).toBe('https://example.com/dune.jpg');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('https://example.com/dune.jpg');

    const removeBtn = root.querySelector(
      'button[aria-label="Eliminar portada"]'
    ) as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();

    expect(emitted.at(-1)).toBe('');
    expect(root.querySelector('img')).toBeNull();
  });

  it('should not render unsafe cover URLs in preview', () => {
    const fixture = TestBed.createComponent(CoverPickerComponent);
    fixture.componentRef.setInput('coverUrl', 'javascript:alert(1)');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')).toBeNull();
  });

  it('should switch to upload mode for initial data URI and handle image file optimization', async () => {
    const fixture = TestBed.createComponent(CoverPickerComponent);
    fixture.componentRef.setInput('idPrefix', 'edit');
    fixture.componentRef.setInput('coverUrl', 'data:image/png;base64,abc');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#edit-book-cover-file')).not.toBeNull();
    expect(root.querySelector('#edit-book-cover-url')).toBeNull();

    const fileInput = root.querySelector('#edit-book-cover-file') as HTMLInputElement;
    const file = new File(['cover'], 'cover.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(optimizeMock).toHaveBeenCalledWith(file);
    expect(fixture.componentInstance.coverUrl()).toBe('data:image/webp;base64,optimized');
    expect(root.textContent).toContain('cover.png');
  });

  it('should display localized upload error when image optimization rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    optimizeMock.mockRejectedValueOnce(new Error('Unsupported'));

    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');

    const fixture = TestBed.createComponent(CoverPickerComponent);
    fixture.componentRef.setInput('idPrefix', 'create');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const uploadTab = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Upload file')
    ) as HTMLButtonElement;
    uploadTab.click();
    fixture.detectChanges();

    const fileInput = root.querySelector('#create-book-cover-file') as HTMLInputElement;
    const file = new File(['bad'], 'bad.gif', { type: 'image/gif' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const alert = root.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not process image');
  });
});
