import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { CoverColorService } from '../../../../core/services/cover-color.service';
import { DockPositionService } from '../../../../core/services/dock-position.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Book } from '../../../books/models/book.model';
import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
} from '../../../books/models/catalog-filter.model';
import { BooksService } from '../../../books/services/books.service';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';
import { SettingsAdvancedSectionComponent } from './settings-advanced-section';

const SAMPLE_SECRET_BOOK: Book = {
  id: 'book-secret-1',
  title: 'The Secret Garden Manuscript',
  author: 'Frances Hodgson SecretAuthor',
  isbn: '978-0-123456-78-9',
  totalPages: 320,
  currentPage: 160,
  status: 'reading',
  format: 'physical',
  rating: 5,
  series: {
    id: 'secret-saga-1',
    name: 'Secret Saga Name',
    volumeNumber: 1,
  },
  notes: 'Private personal reflection notes should never leak',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
};

const MOCK_BREAKDOWN: StorageBreakdownSummary = {
  engine: 'indexeddb',
  persistenceStatus: 'persisted',
  indexedDbInfo: {
    dbName: 'bookstackDB',
    version: 2,
    objectStoresCount: 3,
  },
  totalBookstackBytes: 4096,
  booksMetadataBytes: 1024,
  coversBase64Bytes: 2048,
  readingLogsBytes: 512,
  preferencesBytes: 512,
  booksCount: 1,
  coversCount: 1,
  readingLogsCount: 3,
  browserUsageBytes: 10000,
  browserQuotaBytes: 1000000,
  healthStatus: 'healthy',
};

describe('SettingsAdvancedSectionComponent', () => {
  let fixture: ComponentFixture<SettingsAdvancedSectionComponent>;
  let component: SettingsAdvancedSectionComponent;
  let appPreferences: AppPreferencesService;

  let confirmMock: {
    confirm: ReturnType<typeof vi.fn>;
    resetSuppressed: ReturnType<typeof vi.fn>;
  };
  let coverColorMock: { clearCache: ReturnType<typeof vi.fn> };
  let readingLogMock: { clearAllLogs: ReturnType<typeof vi.fn> };
  let themeMock: {
    setTheme: ReturnType<typeof vi.fn>;
    setAccent: ReturnType<typeof vi.fn>;
  };
  let dockMock: { reset: ReturnType<typeof vi.fn> };
  let catalogFilterMock: {
    setViewMode: ReturnType<typeof vi.fn>;
    setSortOption: ReturnType<typeof vi.fn>;
  };
  let dataPortabilityMock: {
    computeStorageBreakdown: ReturnType<typeof vi.fn>;
  };
  let booksSignal = signal<Book[]>([SAMPLE_SECRET_BOOK]);

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([SAMPLE_SECRET_BOOK]);

    confirmMock = {
      confirm: vi.fn().mockResolvedValue(true),
      resetSuppressed: vi.fn(),
    };
    coverColorMock = {
      clearCache: vi.fn(),
    };
    readingLogMock = {
      clearAllLogs: vi.fn().mockResolvedValue(undefined),
    };
    themeMock = {
      setTheme: vi.fn(),
      setAccent: vi.fn(),
    };
    dockMock = {
      reset: vi.fn(),
    };
    catalogFilterMock = {
      setViewMode: vi.fn(),
      setSortOption: vi.fn(),
    };
    dataPortabilityMock = {
      computeStorageBreakdown: vi.fn().mockResolvedValue(MOCK_BREAKDOWN),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsAdvancedSectionComponent],
      providers: [
        { provide: ConfirmDialogService, useValue: confirmMock },
        { provide: CoverColorService, useValue: coverColorMock },
        { provide: ReadingLogService, useValue: readingLogMock },
        { provide: ThemeService, useValue: themeMock },
        { provide: DockPositionService, useValue: dockMock },
        { provide: CatalogFilterService, useValue: catalogFilterMock },
        { provide: DataPortabilityService, useValue: dataPortabilityMock },
        {
          provide: BooksService,
          useValue: {
            books: booksSignal.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAdvancedSectionComponent);
    component = fixture.componentInstance;
    appPreferences = TestBed.inject(AppPreferencesService);
    appPreferences.resetToDefaults();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates coverMaxDimension and coverQuality via UI controls', () => {
    const dim600Btn = fixture.nativeElement.querySelector(
      '[data-testid="cover-dimension-600"]'
    ) as HTMLButtonElement;
    dim600Btn.click();
    fixture.detectChanges();

    expect(appPreferences.coverMaxDimension()).toBe(600);
    expect(dim600Btn.getAttribute('aria-pressed')).toBe('true');

    const slider = fixture.nativeElement.querySelector(
      '[data-testid="cover-quality-slider"]'
    ) as HTMLInputElement;
    slider.value = '0.85';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(appPreferences.coverQuality()).toBe(0.85);
    const qualityValue = fixture.nativeElement.querySelector(
      '[data-testid="cover-quality-value"]'
    ) as HTMLElement;
    expect(qualityValue.textContent).toContain('85% (0.85)');
  });

  it('updates metadataSearchQuota via segmented control', () => {
    const quota12Btn = fixture.nativeElement.querySelector(
      '[data-testid="metadata-quota-12"]'
    ) as HTMLButtonElement;
    quota12Btn.click();
    fixture.detectChanges();

    expect(appPreferences.metadataSearchQuota()).toBe(12);
    expect(quota12Btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('requires confirmation before clearing cover color cache and preserves books', async () => {
    confirmMock.confirm.mockResolvedValueOnce(false);
    const btn = fixture.nativeElement.querySelector(
      '[data-testid="reset-color-cache-btn"]'
    ) as HTMLButtonElement;

    btn.click();
    await fixture.whenStable();
    expect(confirmMock.confirm).toHaveBeenCalledTimes(1);
    expect(coverColorMock.clearCache).not.toHaveBeenCalled();

    confirmMock.confirm.mockResolvedValueOnce(true);
    btn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(coverColorMock.clearCache).toHaveBeenCalledTimes(1);
    expect(booksSignal()).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="advanced-status-banner"]')
    ).toBeTruthy();
  });

  it('requires confirmation before clearing reading logs, emits dataReset, and preserves books', async () => {
    const resetSpy = vi.fn();
    component.dataReset.subscribe(resetSpy);

    confirmMock.confirm.mockResolvedValueOnce(false);
    const btn = fixture.nativeElement.querySelector(
      '[data-testid="reset-reading-logs-btn"]'
    ) as HTMLButtonElement;

    btn.click();
    await fixture.whenStable();
    expect(readingLogMock.clearAllLogs).not.toHaveBeenCalled();
    expect(resetSpy).not.toHaveBeenCalled();

    confirmMock.confirm.mockResolvedValueOnce(true);
    btn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(readingLogMock.clearAllLogs).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(booksSignal()).toHaveLength(1);
  });

  it('requires confirmation before resetting all preferences and restores defaults without deleting books', async () => {
    appPreferences.updatePreferences({
      coverMaxDimension: 600,
      coverQuality: 0.9,
      metadataSearchQuota: 12,
      offlineMode: true,
    });

    confirmMock.confirm.mockResolvedValueOnce(false);
    const btn = fixture.nativeElement.querySelector(
      '[data-testid="reset-all-preferences-btn"]'
    ) as HTMLButtonElement;

    btn.click();
    await fixture.whenStable();
    expect(appPreferences.coverMaxDimension()).toBe(600);
    expect(themeMock.setTheme).not.toHaveBeenCalled();

    confirmMock.confirm.mockResolvedValueOnce(true);
    btn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(appPreferences.coverMaxDimension()).toBe(360);
    expect(appPreferences.coverQuality()).toBe(0.7);
    expect(appPreferences.metadataSearchQuota()).toBe(8);
    expect(appPreferences.offlineMode()).toBe(false);
    expect(themeMock.setTheme).toHaveBeenCalledWith('system');
    expect(themeMock.setAccent).toHaveBeenCalledWith('blue');
    expect(dockMock.reset).toHaveBeenCalledTimes(1);
    expect(catalogFilterMock.setViewMode).toHaveBeenCalledWith(DEFAULT_CATALOG_VIEW_MODE);
    expect(catalogFilterMock.setSortOption).toHaveBeenCalledWith(DEFAULT_CATALOG_SORT);
    expect(confirmMock.resetSuppressed).toHaveBeenCalledTimes(1);
    expect(booksSignal()).toHaveLength(1);
  });

  it('exports a strictly anonymous diagnostic JSON report with zero book titles, authors, ISBNs, notes, or sagas', async () => {
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-diagnostics');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    const payload = await component.buildDiagnosticReport();
    const serialized = JSON.stringify(payload);

    expect(payload.appVersion).toBeTruthy();
    expect(payload.storage.booksCount).toBe(1);
    expect(payload.storage.readingLogsCount).toBe(3);
    expect(typeof payload.scanner.nativeBarcodeDetectorSupported).toBe('boolean');
    expect(payload.preferences.coverMaxDimension).toBe(360);

    // Ensure zero PII / personal book data leaks into the diagnostic snapshot
    expect(serialized).not.toContain(SAMPLE_SECRET_BOOK.title);
    expect(serialized).not.toContain(SAMPLE_SECRET_BOOK.author);
    expect(serialized).not.toContain(SAMPLE_SECRET_BOOK.isbn ?? '');
    expect(serialized).not.toContain(SAMPLE_SECRET_BOOK.series?.name ?? '');
    expect(serialized).not.toContain(SAMPLE_SECRET_BOOK.notes ?? '');

    await component.exportDiagnosticReport();

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:mock-diagnostics');
  });
});
