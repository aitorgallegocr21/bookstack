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
import {
  ImportConflictMode,
  ImportExecutionResult,
  ImportPreviewSummary,
} from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';

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
  protected readonly i18n = inject(I18nService);

  readonly dataChanged = output<void>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly previewSummary = signal<ImportPreviewSummary | null>(null);
  readonly conflictMode = signal<ImportConflictMode>('merge');
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

  onExportJson(): void {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);
    this.dataPortabilityService.downloadJsonBackup();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessJson);
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

    try {
      const rawContent = await this.readFileAsText(file);
      const preview = this.dataPortabilityService.analyzeImportFile(file.name, rawContent);

      if (preview.validBooks.length === 0 && preview.validReadingLogs.length === 0) {
        this.previewSummary.set(null);
        this.errorMessage.set(this.i18n.t().settings.portability.importErrorNoValidRecords);
        return;
      }

      this.previewSummary.set(preview);
      this.conflictMode.set('merge');
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

  async confirmImport(): Promise<void> {
    const preview = this.previewSummary();
    if (!preview || this.isImporting()) {
      return;
    }

    this.isImporting.set(true);
    this.errorMessage.set(null);
    this.statusMessage.set(null);

    try {
      const result = await this.dataPortabilityService.executeImport(preview, this.conflictMode());
      this.previewSummary.set(null);
      this.conflictMode.set('merge');
      this.lastImportResult.set(result);
      this.statusMessage.set(this.i18n.t().settings.portability.importSuccessMessage);
      this.dataChanged.emit();
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
}
