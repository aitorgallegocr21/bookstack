import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  DEFAULT_METADATA_PROVIDERS,
  MetadataProviderPreference,
} from '../../../../core/models/app-preferences.model';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
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
    persistenceStatus: 'best-effort',
    indexedDbInfo: {
      dbName: 'bookstackDB',
      version: 2,
      objectStoresCount: 3,
    },
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

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b-1',
    title: 'Dune',
    author: 'Frank Herbert',
    totalPages: 500,
    currentPage: 100,
    status: 'reading',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let i18n: I18nService;
  let router: Router;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;
  let isBackupOverdueSignal: ReturnType<typeof signal<boolean>>;

  const computeStorageBreakdownMock = vi.fn<() => Promise<StorageBreakdownSummary>>();

  async function setQueryTab(tab: string | null): Promise<void> {
    queryParamMap$.next(convertToParamMap(tab ? { tab } : {}));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);
    isBackupOverdueSignal = signal<boolean>(false);
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));
    computeStorageBreakdownMock.mockResolvedValue(makeBreakdown());

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
        {
          provide: AppPreferencesService,
          useValue: {
            isBackupOverdue: isBackupOverdueSignal.asReadonly(),
            reducedMotion: signal<'system' | 'reduce'>('system').asReadonly(),
            adaptiveCoverTint: signal<boolean>(true).asReadonly(),
            defaultBookFormat: signal<'physical' | 'ebook' | 'audiobook'>('physical').asReadonly(),
            defaultBookStatus: signal<'pending' | 'reading'>('pending').asReadonly(),
            showCardQuickActions: signal<boolean>(true).asReadonly(),
            showCardProgressBar: signal<boolean>(true).asReadonly(),
            quickPageStep: signal<1 | 5 | 10 | 25>(10).asReadonly(),
            trackReadingTime: signal<boolean>(true).asReadonly(),
            offlineMode: signal<boolean>(false).asReadonly(),
            metadataProviders: signal<MetadataProviderPreference[]>(
              DEFAULT_METADATA_PROVIDERS.map((p) => ({ ...p }))
            ).asReadonly(),
            scannerPreferPhotoMode: signal<boolean>(false).asReadonly(),
            scannerAutoTorch: signal<boolean>(false).asReadonly(),
            coverMaxDimension: signal<300 | 360 | 400 | 600>(360).asReadonly(),
            coverQuality: signal<number>(0.7).asReadonly(),
            metadataSearchQuota: signal<4 | 8 | 12>(8).asReadonly(),
            enabledMetadataProviders: signal(
              DEFAULT_METADATA_PROVIDERS.map((p) => p.id)
            ).asReadonly(),
            includePreferencesInBackup: signal<boolean>(true).asReadonly(),
            lastBackupExportedAt: signal<string | null>(null).asReadonly(),
            toggleMetadataProvider: vi.fn(),
            moveMetadataProvider: vi.fn(),
            updatePreferences: vi.fn(),
            setPreference: vi.fn(),
            resetToDefaults: vi.fn(),
          },
        },
        {
          provide: DataPortabilityService,
          useValue: {
            computeStorageBreakdown: computeStorageBreakdownMock,
            requestPersistentStorage: vi.fn().mockResolvedValue('persisted'),
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
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to general tab, renders all 5 category tabs, and shows Expert badge on advanced', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.activeTab()).toBe('general');
    expect(el.querySelector('app-settings-preferences-section')).toBeTruthy();
    expect(el.querySelector('app-data-portability-section')).toBeNull();

    for (const tabId of ['general', 'catalog', 'data', 'privacy', 'advanced']) {
      expect(el.querySelector(`[data-testid="settings-tab-${tabId}"]`)).toBeTruthy();
      expect(el.querySelector(`[data-testid="settings-mobile-tab-${tabId}"]`)).toBeTruthy();
    }

    const advancedTab = el.querySelector('[data-testid="settings-tab-advanced"]') as HTMLElement;
    expect(advancedTab.textContent).not.toContain('Experto');
    expect(advancedTab.className).toContain('text-rose-700');

    const mobileAdvancedTab = el.querySelector(
      '[data-testid="settings-mobile-tab-advanced"]'
    ) as HTMLElement;
    expect(mobileAdvancedTab.textContent).not.toContain('Experto');
    expect(mobileAdvancedTab.className).toContain('col-span-2');
    expect(mobileAdvancedTab.className).toContain('text-rose-700');
  });

  it('synchronizes activeTab from ?tab= query param and falls back to general for invalid values', async () => {
    await setQueryTab('data');
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.activeTab()).toBe('data');
    expect(el.querySelector('app-storage-quota-inspector')).toBeTruthy();
    expect(el.querySelector('app-data-health-section')).toBeTruthy();
    expect(el.querySelector('app-data-portability-section')).toBeTruthy();
    expect(el.querySelector('app-cover-enrichment-section')).toBeTruthy();

    await setQueryTab('unknown');
    expect(fixture.componentInstance.activeTab()).toBe('general');
    expect(el.querySelector('app-settings-preferences-section')).toBeTruthy();
  });

  it('updates URL query params when clicking a category tab', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = fixture.nativeElement as HTMLElement;
    const privacyBtn = el.querySelector(
      '[data-testid="settings-tab-privacy"]'
    ) as HTMLButtonElement;

    privacyBtn.click();

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { tab: 'privacy' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
    );
  });

  it('initializes storage breakdown on load and passes summary to inspector in data tab', async () => {
    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(1);
    await setQueryTab('data');

    const inspector = fixture.debugElement.query(By.directive(StorageQuotaInspectorComponent))
      .componentInstance as StorageQuotaInspectorComponent;
    expect(inspector.breakdown().totalBookstackBytes).toBe(2048);
    expect(inspector.breakdown().booksCount).toBe(2);
  });

  it('refreshes storage breakdown when books or readingLogs signals change', async () => {
    computeStorageBreakdownMock.mockResolvedValueOnce(
      makeBreakdown({ booksCount: 5, totalBookstackBytes: 8192 })
    );

    booksSignal.set([makeBook()]);

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

    await setQueryTab('data');
    const inspectorDe = fixture.debugElement.query(By.directive(StorageQuotaInspectorComponent));
    (inspectorDe.componentInstance as StorageQuotaInspectorComponent).refreshRequested.emit();
    await fixture.whenStable();

    const portabilityDe = fixture.debugElement.query(By.directive(DataPortabilitySectionComponent));
    (portabilityDe.componentInstance as DataPortabilitySectionComponent).dataChanged.emit();
    await fixture.whenStable();

    await setQueryTab('advanced');
    const dangerDe = fixture.debugElement.query(By.directive(DangerZoneSectionComponent));
    (dangerDe.componentInstance as DangerZoneSectionComponent).dataReset.emit();
    await fixture.whenStable();

    expect(computeStorageBreakdownMock).toHaveBeenCalledTimes(4);
    expect(fixture.componentInstance.storageBreakdown().totalBookstackBytes).toBe(4096);
  });

  it('switches page and tab headings reactively when locale changes', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Ajustes');
    expect(el.querySelector('[data-testid="settings-tab-general"]')?.textContent).toContain(
      'General y apariencia'
    );

    i18n.setLocale('en');
    fixture.detectChanges();

    expect(el.querySelector('h1')?.textContent).toContain('Settings');
    expect(el.querySelector('[data-testid="settings-tab-general"]')?.textContent).toContain(
      'General & Appearance'
    );
  });

  it('filters settings on live search for offline, cifrado, idioma, and compresión and jumps to target', async () => {
    vi.useFakeTimers();
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async (_commands, extras) => {
        const nextTab = (extras?.queryParams as { tab?: string } | undefined)?.tab ?? null;
        queryParamMap$.next(convertToParamMap(nextTab ? { tab: nextTab } : {}));
        return true;
      });

    const el = fixture.nativeElement as HTMLElement;
    const searchInput = el.querySelector(
      '[data-testid="settings-search-input"]'
    ) as HTMLInputElement;
    expect(searchInput.getAttribute('type')).toBe('text');
    expect(searchInput.getAttribute('role')).toBe('searchbox');

    for (const term of ['offline', 'cifrado', 'idioma', 'compresión']) {
      searchInput.value = term;
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.componentInstance.searchResults().length).toBeGreaterThan(0);
      expect(el.querySelectorAll('[data-testid="settings-search-clear"]').length).toBe(1);
    }

    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.searchQuery()).toBe('');

    searchInput.value = 'zzznomatch999';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="settings-search-empty"]')).toBeTruthy();

    searchInput.value = 'offline';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const offlineResult = el.querySelector(
      '[data-testid="settings-search-result-privacy-offline"]'
    ) as HTMLButtonElement;
    expect(offlineResult).toBeTruthy();
    offlineResult.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.activeTab()).toBe('privacy');
    expect(fixture.componentInstance.searchQuery()).toBe('');

    const privacySection = el.querySelector('[data-setting-id="privacy-offline"]') as HTMLElement;
    const scrollIntoViewMock = vi.fn();
    privacySection.scrollIntoView = scrollIntoViewMock;

    vi.advanceTimersByTime(60);
    fixture.detectChanges();

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(fixture.componentInstance.highlightedSettingId()).toBe('privacy-offline');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(fixture.componentInstance.highlightedSettingId()).toBeNull();
  });

  it('shows passive 30-day backup reminder only when books exist and overdue, and allows jump or dismiss', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="settings-backup-reminder"]')).toBeNull();

    isBackupOverdueSignal.set(true);
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="settings-backup-reminder"]')).toBeNull();

    booksSignal.set([makeBook()]);
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="settings-backup-reminder"]')).toBeTruthy();

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const exportBtn = el.querySelector(
      '[data-testid="settings-backup-reminder-export"]'
    ) as HTMLButtonElement;
    exportBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { tab: 'data' } })
    );

    const dismissBtn = el.querySelector(
      '[data-testid="settings-backup-reminder-dismiss"]'
    ) as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="settings-backup-reminder"]')).toBeNull();
  });

  it('scrolls smoothly to cover enrichment section when portability emits requestCoverEnrichment', async () => {
    await setQueryTab('data');
    const el = fixture.nativeElement as HTMLElement;
    const enrichmentHost = el.querySelector('#cover-enrichment-section') as HTMLElement;
    expect(enrichmentHost).toBeTruthy();

    const scrollIntoViewMock = vi.fn();
    enrichmentHost.scrollIntoView = scrollIntoViewMock;

    const portabilityDe = fixture.debugElement.query(By.directive(DataPortabilitySectionComponent));
    (
      portabilityDe.componentInstance as DataPortabilitySectionComponent
    ).requestCoverEnrichment.emit();

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
