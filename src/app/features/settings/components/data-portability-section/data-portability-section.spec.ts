import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ImportPreviewSummary } from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';
import { DataPortabilitySectionComponent } from './data-portability-section';

function buildPreview(overrides: Partial<ImportPreviewSummary> = {}): ImportPreviewSummary {
  return {
    format: 'json',
    fileName: 'bookstack-backup.json',
    validBooks: [
      {
        id: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        status: 'reading',
        totalPages: 500,
        currentPage: 120,
        format: 'physical',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    validReadingLogs: [
      {
        id: 'log-1',
        bookId: 'book-1',
        date: '2026-01-02',
        pagesRead: 35,
        createdAt: '2026-01-02T10:00:00.000Z',
      },
    ],
    validSeriesMetadata: [],
    readingGoals: {
      year: 2026,
      targetBooks: 24,
      targetPages: 6000,
    },
    preferences: null,
    invalidBooksCount: 1,
    invalidLogsCount: 0,
    invalidSeriesMetadataCount: 0,
    duplicateBooksCount: 0,
    newBooksCount: 1,
    ...overrides,
  };
}

describe('DataPortabilitySectionComponent', () => {
  let fixture: ComponentFixture<DataPortabilitySectionComponent>;
  let component: DataPortabilitySectionComponent;
  let i18n: I18nService;

  const mockPortabilityService = {
    downloadJsonBackup: vi.fn(),
    downloadCsvCatalog: vi.fn(),
    analyzeImportFile: vi.fn(),
    executeImport: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DataPortabilitySectionComponent],
      providers: [{ provide: DataPortabilityService, useValue: mockPortabilityService }],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLocale('es');

    fixture = TestBed.createComponent(DataPortabilitySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('triggers JSON and CSV downloads and shows feedback status', () => {
    const jsonBtn = fixture.nativeElement.querySelector(
      '[data-testid="export-json-btn"]'
    ) as HTMLButtonElement;
    jsonBtn.click();
    fixture.detectChanges();

    expect(mockPortabilityService.downloadJsonBackup).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-status-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.exportSuccessJson);

    const csvBtn = fixture.nativeElement.querySelector(
      '[data-testid="export-csv-btn"]'
    ) as HTMLButtonElement;
    csvBtn.click();
    fixture.detectChanges();

    expect(mockPortabilityService.downloadCsvCatalog).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-status-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.exportSuccessCsv);
  });

  it('analyzes selected file and renders the validation preview panel', async () => {
    const preview = buildPreview();
    mockPortabilityService.analyzeImportFile.mockReturnValue(preview);

    const file = new File(['{"books":[]}'], 'bookstack-backup.json', { type: 'application/json' });
    const fileInput = fixture.nativeElement.querySelector(
      '[data-testid="import-file-input"]'
    ) as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });

    await component.onFileSelected({ target: fileInput } as unknown as Event);
    fixture.detectChanges();

    expect(mockPortabilityService.analyzeImportFile).toHaveBeenCalledWith(
      'bookstack-backup.json',
      '{"books":[]}'
    );

    const previewPanel = fixture.nativeElement.querySelector(
      '[data-testid="import-preview-panel"]'
    ) as HTMLElement;
    expect(previewPanel).not.toBeNull();
    expect(previewPanel.textContent).toContain('bookstack-backup.json');
    expect(
      fixture.nativeElement.querySelector('[data-testid="import-preview-format"]')?.textContent
    ).toContain('json');
    expect(component.conflictMode()).toBe('merge');
  });

  it('shows an error banner when file analysis fails or yields no valid records', async () => {
    mockPortabilityService.analyzeImportFile.mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    const invalidFile = new File(['{bad'], 'broken.json', { type: 'application/json' });
    await component.onFileSelected({
      target: { files: [invalidFile] },
    } as unknown as Event);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-error-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.importErrorInvalidFile);
    expect(fixture.nativeElement.querySelector('[data-testid="import-preview-panel"]')).toBeNull();

    mockPortabilityService.analyzeImportFile.mockReturnValue(
      buildPreview({ validBooks: [], validReadingLogs: [] })
    );
    const emptyFile = new File(['{}'], 'empty.json', { type: 'application/json' });
    await component.onFileSelected({
      target: { files: [emptyFile] },
    } as unknown as Event);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-error-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.importErrorNoValidRecords);
  });

  it('rejects oversized backup files (>100MB) without reading them into memory', async () => {
    const hugeFile = new File(['{}'], 'huge.json', { type: 'application/json' });
    Object.defineProperty(hugeFile, 'size', { value: 101 * 1024 * 1024 });

    await component.onFileSelected({
      target: { files: [hugeFile] },
    } as unknown as Event);
    fixture.detectChanges();

    expect(mockPortabilityService.analyzeImportFile).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-error-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.importErrorInvalidFile);
  });

  it('toggles between merge and overwrite conflict modes with overwrite warning', () => {
    component.previewSummary.set(buildPreview());
    fixture.detectChanges();

    const mergeBtn = fixture.nativeElement.querySelector(
      '[data-testid="import-mode-merge"]'
    ) as HTMLButtonElement;
    const overwriteBtn = fixture.nativeElement.querySelector(
      '[data-testid="import-mode-overwrite"]'
    ) as HTMLButtonElement;

    expect(mergeBtn.getAttribute('aria-checked')).toBe('true');
    expect(overwriteBtn.getAttribute('aria-checked')).toBe('false');
    expect(
      fixture.nativeElement.querySelector('[data-testid="import-overwrite-warning"]')
    ).toBeNull();

    overwriteBtn.click();
    fixture.detectChanges();

    expect(component.conflictMode()).toBe('overwrite');
    expect(overwriteBtn.getAttribute('aria-checked')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('[data-testid="import-overwrite-warning"]')?.textContent
    ).toContain(i18n.t().settings.portability.modeOverwriteWarning);
  });

  it('executes import, emits dataChanged, and clears preview on confirm', async () => {
    const preview = buildPreview();
    component.previewSummary.set(preview);
    component.setConflictMode('overwrite');
    mockPortabilityService.executeImport.mockResolvedValue({
      mode: 'overwrite',
      format: 'json',
      booksImported: 1,
      logsImported: 1,
      skippedRecords: 1,
      goalsRestored: true,
      preferencesRestored: false,
      missingCoversCount: 0,
      missingCoversWithIsbnCount: 0,
    });
    const emitSpy = vi.spyOn(component.dataChanged, 'emit');
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-import-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPortabilityService.executeImport).toHaveBeenCalledWith(preview, 'overwrite');
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(component.previewSummary()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="portability-status-banner"]')?.textContent
    ).toContain(i18n.t().settings.portability.importSuccessMessage);
  });

  it('clears preview and resets conflict mode on cancel', () => {
    component.previewSummary.set(buildPreview());
    component.setConflictMode('overwrite');
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector(
      '[data-testid="cancel-import-btn"]'
    ) as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.previewSummary()).toBeNull();
    expect(component.conflictMode()).toBe('merge');
    expect(fixture.nativeElement.querySelector('[data-testid="import-preview-panel"]')).toBeNull();
  });

  it('renders post-import cover enrichment prompt when missingCoversCount > 0 and emits requestCoverEnrichment', async () => {
    component.previewSummary.set(buildPreview());
    mockPortabilityService.executeImport.mockResolvedValue({
      mode: 'merge',
      format: 'csv',
      booksImported: 5,
      logsImported: 0,
      skippedRecords: 0,
      goalsRestored: false,
      preferencesRestored: false,
      missingCoversCount: 4,
      missingCoversWithIsbnCount: 3,
    });
    const emitSpy = vi.spyOn(component.requestCoverEnrichment, 'emit');
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-import-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const callout = fixture.nativeElement.querySelector(
      '[data-testid="post-import-cover-enrichment-callout"]'
    ) as HTMLElement | null;
    expect(callout).not.toBeNull();
    expect(callout?.textContent).toContain('4');
    expect(callout?.textContent).toContain('3');

    const enrichBtn = fixture.nativeElement.querySelector(
      '[data-testid="post-import-enrich-covers-btn"]'
    ) as HTMLButtonElement;
    enrichBtn.click();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('does not render post-import cover enrichment prompt when missingCoversCount is 0', async () => {
    component.previewSummary.set(buildPreview());
    mockPortabilityService.executeImport.mockResolvedValue({
      mode: 'merge',
      format: 'json',
      booksImported: 1,
      logsImported: 1,
      skippedRecords: 0,
      goalsRestored: false,
      preferencesRestored: false,
      missingCoversCount: 0,
      missingCoversWithIsbnCount: 0,
    });
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-import-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="post-import-cover-enrichment-callout"]')
    ).toBeNull();
  });
});
