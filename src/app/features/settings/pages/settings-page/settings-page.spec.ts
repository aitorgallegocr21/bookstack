import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { DangerZoneSectionComponent } from '../../components/danger-zone-section/danger-zone-section';
import { DataPortabilitySectionComponent } from '../../components/data-portability-section/data-portability-section';
import { StorageQuotaInspectorComponent } from '../../components/storage-quota-inspector/storage-quota-inspector';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';
import { SettingsPage } from './settings-page';

function makeBreakdown(overrides: Partial<StorageBreakdownSummary> = {}): StorageBreakdownSummary {
  return {
    engine: 'indexeddb',
    totalBookstackBytes: 2048,
    booksMetadataBytes: 1024,
    coversBase64Bytes: 512,
    readingLogsBytes: 256,
    preferencesBytes: 256,
    booksCount: 2,
    coversCount: 1,
    readingLogsCount: 3,
    browserUsageBytes: 4096,
    browserQuotaBytes: 1048576,
    healthStatus: 'healthy',
    ...overrides,
  };
}

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let i18n: I18nService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;

  const computeStorageBreakdownMock = vi.fn<() => Promise<StorageBreakdownSummary>>();

  beforeEach(async () => {
    vi.clearAllMocks();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);
    computeStorageBreakdownMock.mockResolvedValue(makeBreakdown());

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        {
          provide: DataPortabilityService,
          useValue: {
            computeStorageBreakdown: computeStorageBreakdownMock,
            downloadJsonBackup: vi.fn(),
            downloadCsvCatalog: vi.fn(),
            analyzeImportFile: vi.fn(),
            executeImport: vi.fn(),
            clearReadingSessionsOnly: vi.fn(),
            factoryResetAllData: vi.fn(),
          },
        },
        {
          provide: BooksService,
          useValue: {
            books: booksSignal.asReadonly(),
          },
        },
        {
          provide: ReadingLogService,
          useValue: {
            readingLogs: logsSignal.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLocale('es');

    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders all four settings sections and removes legacy roadmap placeholder', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-settings-preferences-section')).toBeTruthy();
    expect(el.querySelector('app-storage-quota-inspector')).toBeTruthy();
    expect(el.querySelector('app-data-portability-section')).toBeTruthy();
    expect(el.querySelector('app-danger-zone-section')).toBeTruthy();
  });

  it('initializes storage breakdown on load and passes summary to inspector', () => {
    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(1);
    const inspector = fixture.debugElement.query(By.directive(StorageQuotaInspectorComponent))
      .componentInstance as StorageQuotaInspectorComponent;
    expect(inspector.breakdown().totalBookstackBytes).toBe(2048);
    expect(inspector.breakdown().booksCount).toBe(2);
  });

  it('refreshes storage breakdown when books or readingLogs signals change', async () => {
    computeStorageBreakdownMock.mockResolvedValueOnce(
      makeBreakdown({ booksCount: 5, totalBookstackBytes: 8192 })
    );

    booksSignal.set([
      {
        id: 'b-1',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 500,
        currentPage: 100,
        status: 'reading',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.storageBreakdown().booksCount).toBe(5);

    computeStorageBreakdownMock.mockResolvedValueOnce(
      makeBreakdown({ readingLogsCount: 10, totalBookstackBytes: 9000 })
    );

    logsSignal.set([
      {
        id: 'l-1',
        bookId: 'b-1',
        date: '2026-01-02T10:00:00.000Z',
        pagesRead: 40,
        createdAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(3);
    expect(fixture.componentInstance.storageBreakdown().readingLogsCount).toBe(10);
  });

  it('refreshes storage breakdown on inspector refresh, portability dataChanged, and dangerZone dataReset', async () => {
    computeStorageBreakdownMock.mockResolvedValue(makeBreakdown({ totalBookstackBytes: 4096 }));

    const inspectorDe = fixture.debugElement.query(By.directive(StorageQuotaInspectorComponent));
    (inspectorDe.componentInstance as StorageQuotaInspectorComponent).refreshRequested.emit();
    await fixture.whenStable();

    const portabilityDe = fixture.debugElement.query(By.directive(DataPortabilitySectionComponent));
    (portabilityDe.componentInstance as DataPortabilitySectionComponent).dataChanged.emit();
    await fixture.whenStable();

    const dangerDe = fixture.debugElement.query(By.directive(DangerZoneSectionComponent));
    (dangerDe.componentInstance as DangerZoneSectionComponent).dataReset.emit();
    await fixture.whenStable();

    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(4);
    expect(fixture.componentInstance.storageBreakdown().totalBookstackBytes).toBe(4096);
  });

  it('switches page and section headings reactively when locale changes', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Ajustes');

    i18n.setLocale('en');
    fixture.detectChanges();

    expect(el.querySelector('h1')?.textContent).toContain('Settings');
  });
});
