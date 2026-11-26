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
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
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
import {
  BACKUP_MIN_PASSWORD_LENGTH,
  BackupCryptoError,
  evaluatePasswordStrength,
  isWebCryptoAvailable,
} from '../../utils/backup-crypto.utils';

const MAX_BACKUP_FILE_BYTES = 100 * 1024 * 1024;

interface PendingEncryptedBackup {
  fileName: string;
  rawContent: string;
}

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
  protected readonly appPreferences = inject(AppPreferencesService);
  protected readonly i18n = inject(I18nService);

  readonly dataChanged = output<void>();
  readonly requestCoverEnrichment = output<void>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly previewSummary = signal<ImportPreviewSummary | null>(null);
  readonly pendingEncryptedBackup = signal<PendingEncryptedBackup | null>(null);
  readonly decryptPassword = signal<string>('');
  readonly showDecryptPassword = signal<boolean>(false);
  readonly isDecrypting = signal<boolean>(false);
  readonly conflictMode = signal<ImportConflictMode>('merge');
  readonly autoEnrichOnImport = signal<boolean>(true);
  readonly restorePreferences = signal<boolean>(true);
  readonly isImporting = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly lastImportResult = signal<ImportExecutionResult | null>(null);

  readonly encryptionEnabled = signal<boolean>(false);
  readonly exportPassword = signal<string>('');
  readonly exportConfirmPassword = signal<string>('');
  readonly showExportPassword = signal<boolean>(false);
  readonly showExportConfirmPassword = signal<boolean>(false);
  readonly isExporting = signal<boolean>(false);

  readonly webCryptoSupported = isWebCryptoAvailable();
  readonly minPasswordLength = BACKUP_MIN_PASSWORD_LENGTH;

  readonly passwordStrength = computed(() => evaluatePasswordStrength(this.exportPassword()));
  readonly passwordsMismatch = computed(
    () =>
      this.exportConfirmPassword().length > 0 &&
      this.exportPassword() !== this.exportConfirmPassword()
  );
  readonly isExportPasswordValid = computed(
    () =>
      !this.encryptionEnabled() ||
      (this.webCryptoSupported &&
        this.exportPassword().length >= BACKUP_MIN_PASSWORD_LENGTH &&
        this.exportPassword() === this.exportConfirmPassword())
  );

  readonly formattedLastBackupDate = computed(() => {
    const raw = this.appPreferences.lastBackupExportedAt();
    if (!raw) {
      return this.i18n.t().settings.portability.lastBackupNever;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return this.i18n.t().settings.portability.lastBackupNever;
    }
    const locale = this.i18n.locale() === 'en' ? 'en-US' : 'es-ES';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsed);
  });

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

  toggleEncryptionEnabled(): void {
    const next = !this.encryptionEnabled();
    this.encryptionEnabled.set(next);
    if (!next) {
      this.clearExportPasswordState();
    }
    this.errorMessage.set(null);
  }

  onExportPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.exportPassword.set(input?.value ?? '');
  }

  onExportConfirmPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.exportConfirmPassword.set(input?.value ?? '');
  }

  toggleShowExportPassword(): void {
    this.showExportPassword.update((v) => !v);
  }

  toggleShowExportConfirmPassword(): void {
    this.showExportConfirmPassword.update((v) => !v);
  }

  onDecryptPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.decryptPassword.set(input?.value ?? '');
  }

  toggleShowDecryptPassword(): void {
    this.showDecryptPassword.update((v) => !v);
  }

  async onExportZip(): Promise<void> {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);

    if (this.encryptionEnabled()) {
      const password = this.validateExportPassword();
      if (!password) {
        return;
      }
      this.isExporting.set(true);
      try {
        await this.dataPortabilityService.downloadEncryptedZipBackup(password);
        this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessEncryptedZip);
      } catch {
        this.errorMessage.set(this.i18n.t().settings.portability.encryptionUnavailableError);
      } finally {
        this.isExporting.set(false);
        this.clearExportPasswordState();
      }
      return;
    }

    void this.dataPortabilityService.downloadZipBundle();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessZip);
  }

  async onExportJson(): Promise<void> {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);

    if (this.encryptionEnabled()) {
      const password = this.validateExportPassword();
      if (!password) {
        return;
      }
      this.isExporting.set(true);
      try {
        await this.dataPortabilityService.downloadEncryptedJsonBackup(password, {
          includeCovers: true,
        });
        this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessEncryptedJson);
      } catch {
        this.errorMessage.set(this.i18n.t().settings.portability.encryptionUnavailableError);
      } finally {
        this.isExporting.set(false);
        this.clearExportPasswordState();
      }
      return;
    }

    void this.dataPortabilityService.downloadJsonBackup();
    this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessJson);
  }

  async onExportLightJson(): Promise<void> {
    this.errorMessage.set(null);
    this.lastImportResult.set(null);

    if (this.encryptionEnabled()) {
      const password = this.validateExportPassword();
      if (!password) {
        return;
      }
      this.isExporting.set(true);
      try {
        await this.dataPortabilityService.downloadEncryptedJsonBackup(password, {
          includeCovers: false,
        });
        this.statusMessage.set(this.i18n.t().settings.portability.exportSuccessEncryptedJson);
      } catch {
        this.errorMessage.set(this.i18n.t().settings.portability.encryptionUnavailableError);
      } finally {
        this.isExporting.set(false);
        this.clearExportPasswordState();
      }
      return;
    }

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
    this.pendingEncryptedBackup.set(null);
    this.decryptPassword.set('');
    this.showDecryptPassword.set(false);

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

      if (isZipFile) {
        const preview = await this.dataPortabilityService.analyzeImportZipFile(
          file.name,
          new Uint8Array(await this.readFileAsArrayBuffer(file))
        );
        this.applyParsedPreview(preview);
        return;
      }

      const rawText = await this.readFileAsText(file);
      if (this.dataPortabilityService.detectEncryptedBackup(rawText)) {
        this.previewSummary.set(null);
        this.pendingEncryptedBackup.set({ fileName: file.name, rawContent: rawText });
        return;
      }

      const preview = this.dataPortabilityService.analyzeImportFile(file.name, rawText);
      this.applyParsedPreview(preview);
    } catch {
      this.previewSummary.set(null);
      this.errorMessage.set(this.i18n.t().settings.portability.importErrorInvalidFile);
    } finally {
      this.resetFileInput();
    }
  }

  async unlockEncryptedBackup(): Promise<void> {
    const pending = this.pendingEncryptedBackup();
    const password = this.decryptPassword();
    if (!pending || !password || this.isDecrypting()) {
      return;
    }

    this.isDecrypting.set(true);
    this.errorMessage.set(null);

    try {
      const preview = await this.dataPortabilityService.decryptBackupFile(
        pending.fileName,
        pending.rawContent,
        password
      );
      this.pendingEncryptedBackup.set(null);
      this.decryptPassword.set('');
      this.showDecryptPassword.set(false);
      this.applyParsedPreview(preview);
    } catch (err) {
      if (err instanceof BackupCryptoError && err.code === 'UNSUPPORTED_FORMAT') {
        this.errorMessage.set(this.i18n.t().settings.portability.decryptErrorUnsupportedFormat);
      } else {
        this.errorMessage.set(this.i18n.t().settings.portability.decryptErrorInvalidPassword);
      }
    } finally {
      this.isDecrypting.set(false);
    }
  }

  cancelEncryptedPrompt(): void {
    this.pendingEncryptedBackup.set(null);
    this.decryptPassword.set('');
    this.showDecryptPassword.set(false);
    this.errorMessage.set(null);
  }

  private applyParsedPreview(preview: ImportPreviewSummary): void {
    if (preview.validBooks.length === 0 && preview.validReadingLogs.length === 0) {
      this.previewSummary.set(null);
      this.errorMessage.set(this.i18n.t().settings.portability.importErrorNoValidRecords);
      return;
    }

    this.previewSummary.set(preview);
    this.conflictMode.set('merge');
    this.autoEnrichOnImport.set(true);
    this.restorePreferences.set(true);
  }

  private validateExportPassword(): string | null {
    if (!this.webCryptoSupported) {
      this.errorMessage.set(this.i18n.t().settings.portability.encryptionUnavailableError);
      return null;
    }
    const password = this.exportPassword();
    if (password.length < BACKUP_MIN_PASSWORD_LENGTH) {
      this.errorMessage.set(this.i18n.t().settings.portability.encryptionMinLengthHint);
      return null;
    }
    if (password !== this.exportConfirmPassword()) {
      this.errorMessage.set(this.i18n.t().settings.portability.encryptionMismatchError);
      return null;
    }
    return password;
  }

  private clearExportPasswordState(): void {
    this.exportPassword.set('');
    this.exportConfirmPassword.set('');
    this.showExportPassword.set(false);
    this.showExportConfirmPassword.set(false);
  }

  setConflictMode(mode: ImportConflictMode): void {
    this.conflictMode.set(mode);
  }

  onAutoEnrichChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.autoEnrichOnImport.set(Boolean(input?.checked));
  }

  onRestorePreferencesChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.restorePreferences.set(Boolean(input?.checked));
  }

  toggleIncludePreferencesInBackup(): void {
    const current = this.appPreferences.includePreferencesInBackup();
    this.appPreferences.updatePreferences({ includePreferencesInBackup: !current });
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
      const result = await this.dataPortabilityService.executeImport(preview, this.conflictMode(), {
        applyPreferences: this.restorePreferences(),
      });
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
