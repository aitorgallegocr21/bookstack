import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import {
  ImportConflictMode,
  ImportExecutionResult,
  ImportPreviewSummary,
} from '../../models/data-portability.model';
import { CoverEnrichmentService } from '../../services/cover-enrichment.service';
import { DataPortabilityService } from '../../services/data-portability.service';

const MAX_BACKUP_FILE_BYTES = 100 * 1024 * 1024;

@Component({
  selector: 'app-data-portability-section',
  standalone: true,
  templateUrl: './data-portability-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class DataPortabilitySectionComponent {
  private readonly dataPortabilityService = inject(DataPortabilityService);
  private readonly coverEnrichmentService = inject(CoverEnrichmentService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  protected readonly i18n = inject(I18nService);

  readonly dataChanged = output<void>();
  readonly requestCoverEnrichment = output<void>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly previewSummary = signal<ImportPreviewSummary | null>(null);
  readonly conflictMode = signal<ImportConflictMode>('merge');
  readonly autoEnrichOnImport = signal<boolean>(true);
  readonly isImporting = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly lastImportResult = signal<ImportExecutionResult | null>(null);

  readonly skippedRecordsCount = computed(() => {
    const preview = this.previewSummary();
    if (!preview) {
      return 0;
    }
    return preview.invalidBooksCount + preview.invalidLogsCount;
  });

  readonly previewHasIncompleteOrMissing = computed(() => {
    const preview = this.previewSummary();
    if (!preview) {
      return false;
    }
    return preview.validBooks.some(
      (book) =>
        !book.coverUrl ||
        book.totalPages <= 1 ||
        !book.publicationYear ||
        !book.publisher ||
        !book.isbn
    );
  });

  onExportZip(): void {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);
    void this.dataPortabilityService.downloadZipBundle();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessZip);
  }

  onExportJson(): void {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);
    void this.dataPortabilityService.downloadJsonBackup();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessJson);
  }

  onExportLightJson(): void {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);
    void this.dataPortabilityService.downloadLightweightJsonBackup();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessLightJson);
  }

  onExportCsv(): void {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);
    this.dataPortabilityService.downloadCsvCatalog();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessCsv);
  }

  triggerFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.errorMessage.set(null);
    this.statusMessage.set(null);
    this.lastImportResult.set(null);

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      this.previewSummary.set(null);
      this.errorMessage.set(this.i18n.t().settings.portability.importErrorInvalidFile);
      this.resetFileInput();
      return;
    }

    try {
      const isZipFile =
        file.name.toLowerCase().endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed';
      const preview = isZipFile
        ? await this.dataPortabilityService.analyzeImportZipFile(
            file.name,
            new Uint8Array(await this.readFileAsArrayBuffer(file))
          )
        : this.dataPortabilityService.analyzeImportFile(file.name, await this.readFileAsText(file));

      if (preview.validBooks.length === 0 && preview.validReadingLogs.length === 0) {
        this.previewSummary.set(null);
        this.errorMessage.set(this.i18n.t().settings.portability.importErrorNoValidRecords);
        return;
      }

      this.previewSummary.set(preview);
      this.conflictMode.set('merge');
      this.autoEnrichOnImport.set(true);
    } catch {
      this.previewSummary.set(null);
      this.errorMessage.set(this.i18n.t().settings.portability.importErrorInvalidFile);
    } finally {
      this.resetFileInput();
    }
  }

  setConflictMode(mode: ImportConflictMode): void {
    this.conflictMode.set(mode);
  }

  onAutoEnrichChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.autoEnrichOnImport.set(Boolean(input?.checked));
  }

  async confirmImport(): Promise<void> {
    const preview = this.previewSummary();
    if (!preview || this.isImporting()) {
      return;
    }

    const existingBooksCount = this.booksService.books().length;
    if (this.conflictMode() === 'overwrite' && existingBooksCount > 0) {
      const t = this.i18n.t();
      const existingLogsCount = this.readingLogService.readingLogs().length;
      const confirmed = await this.confirmDialogService.confirm({
        title: t.settings.portability.confirmOverwriteTitle,
        message: t.settings.portability.confirmOverwriteMessage,
        confirmLabel: t.settings.portability.confirmOverwriteAction,
        cancelLabel: t.confirmDialog.cancel,
        severity: 'danger',
        entityPreview: {
          title: t.settings.portability.confirmOverwritePreviewTitle,
          subtitle: t.settings.portability.confirmOverwritePreviewSubtitle
            .replace('{books}', String(existingBooksCount))
            .replace('{logs}', String(existingLogsCount)),
        },
      });
      if (!confirmed) {
        return;
      }
    }

    this.isImporting.set(true);
    this.errorMessage.set(null);
    this.statusMessage.set(null);

    try {
      const result = await this.dataPortabilityService.executeImport(preview, this.conflictMode());
      const shouldAutoEnrich =
        this.autoEnrichOnImport() &&
        (result.incompleteMetadataCount > 0 || result.missingCoversCount > 0);
      this.previewSummary.set(null);
      this.conflictMode.set('merge');
      this.lastImportResult.set(result);
      this.statusMessage.set(this.i18n.t().settings.portability.importSuccessMessage);
      this.dataChanged.emit();
      if (shouldAutoEnrich) {
        this.requestCoverEnrichment.emit();
        void this.coverEnrichmentService.runIntegralEnrichment();
      }
    } catch {
      this.errorMessage.set(this.i18n.t().settings.portability.importErrorExecution);
    } finally {
      this.isImporting.set(false);
    }
  }

  cancelImport(): void {
    if (this.isImporting()) {
      return;
    }
    this.previewSummary.set(null);
    this.conflictMode.set('merge');
    this.errorMessage.set(null);
    this.resetFileInput();
  }

  dismissStatus(): void {
    this.statusMessage.set(null);
    this.lastImportResult.set(null);
  }

  onRequestCoverEnrichment(): void {
    this.requestCoverEnrichment.emit();
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }

  private resetFileInput(): void {
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private async readFileAsText(file: File): Promise<string> {
    if (typeof file.text === 'function') {
      return file.text();
    }
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
      reader.readAsText(file);
    });
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    if (typeof file.arrayBuffer === 'function') {
      return file.arrayBuffer();
    }
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to read binary file'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('Unable to read binary file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
