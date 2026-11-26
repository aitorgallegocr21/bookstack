import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { ExistingSeriesOption, SeriesService } from '../../../series/services/series.service';
import { normalizeSeriesKey } from '../../../series/utils/series.utils';
import { BOOK_RATING_MAX, BOOK_RATING_MIN, Book, BookStatus } from '../../models/book.model';
import { BookMetadataApplyMode, BookMetadataCandidate } from '../../models/book-metadata.model';
import { BooksService } from '../../services/books.service';
import {
  BOOK_STATUS_VALUES,
  buildBookSeriesPayload,
  buildMetadataFormPatch,
  getCompletedAutofillValues,
  normalizeBookFormat,
  normalizeBookRating,
} from '../../utils/book-form.utils';
import {
  MIN_HISTORICAL_PUBLICATION_YEAR,
  extractYearFromIsoPrefix,
  getMaxAllowedIsoDate,
  getMaxAllowedYear,
  requiresManualAntiqueYearConfirmation,
} from '../../utils/temporal-bounds.utils';
import { BookMetadataLookupComponent } from '../book-metadata-lookup/book-metadata-lookup';
import { CoverPickerComponent } from '../cover-picker/cover-picker';
import { IsbnScannerComponent } from '../isbn-scanner/isbn-scanner';

@Component({
  selector: 'app-book-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CoverPickerComponent,
    BookMetadataLookupComponent,
    IsbnScannerComponent,
  ],
  templateUrl: './book-edit-modal.html',
  styleUrl: './book-edit-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()',
  },
})
export class BookEditModalComponent implements AfterViewInit, OnDestroy {
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);
  private readonly booksService = inject(BooksService);
  private readonly seriesService = inject(SeriesService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly saved = output<Book>();

  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private readonly publicationYearInput =
    viewChild<ElementRef<HTMLInputElement>>('publicationYearInput');
  private readonly startDateInput = viewChild<ElementRef<HTMLInputElement>>('startDateInput');
  private readonly endDateInput = viewChild<ElementRef<HTMLInputElement>>('endDateInput');
  private readonly metadataLookup = viewChild(BookMetadataLookupComponent);

  protected readonly maxAllowedYear = getMaxAllowedYear();
  protected readonly maxAllowedIsoDate = getMaxAllowedIsoDate();
  private readonly providerApprovedYear = signal<number | null>(null);

  protected readonly isSaving = signal<boolean>(false);
  protected readonly isClosing = signal<boolean>(false);
  protected readonly isScannerOpen = signal<boolean>(false);
  protected readonly statusValues = BOOK_STATUS_VALUES;
  protected readonly existingSeriesOptions = this.seriesService.existingSeriesOptions;
  protected readonly quickPickSeriesOptions = computed(() =>
    this.existingSeriesOptions().slice(0, 5)
  );

  protected readonly book = computed<Book | undefined>(() => {
    return this.booksService.books().find((b) => b.id === this.bookId());
  });

  protected readonly editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    isbn: [''],
    publisher: [''],
    publicationYear: [
      null as number | null,
      [Validators.min(MIN_HISTORICAL_PUBLICATION_YEAR), Validators.max(this.maxAllowedYear)],
    ],
    totalPages: [0, [Validators.required, Validators.min(1)]],
    currentPage: [0, [Validators.required, Validators.min(0)]],
    totalCharacters: [0, [Validators.min(0)]],
    totalChapters: [0, [Validators.min(0)]],
    currentChapter: [0, [Validators.min(0)]],
    format: ['Físico'],
    status: ['pending' as BookStatus, [Validators.required]],
    coverUrl: [''],
    startDate: [''],
    endDate: [''],
    rating: [0, [Validators.min(BOOK_RATING_MIN), Validators.max(BOOK_RATING_MAX)]],
    notes: [''],
    seriesEnabled: [false],
    seriesName: [''],
    seriesVolumeNumber: [null as number | null],
  });

  constructor() {
    this.uiState.acquireScrollLock();
    this.editForm.addValidators((control) => {
      const total = Number(control.get('totalPages')?.value) || 0;
      const current = Number(control.get('currentPage')?.value) || 0;
      const startYear = extractYearFromIsoPrefix(control.get('startDate')?.value);
      const endYear = extractYearFromIsoPrefix(control.get('endDate')?.value);
      const errors: Record<string, boolean> = {};
      if (total > 0 && current > total) {
        errors['currentPageExceedsTotal'] = true;
      }
      if (startYear !== null && startYear > this.maxAllowedYear) {
        errors['startDateExceedsMaxYear'] = true;
      }
      if (endYear !== null && endYear > this.maxAllowedYear) {
        errors['endDateExceedsMaxYear'] = true;
      }
      return Object.keys(errors).length > 0 ? errors : null;
    });

    effect(() => {
      const currentBook = this.book();
      if (currentBook) {
        this.providerApprovedYear.set(currentBook.publicationYear ?? null);
        const completedValues = getCompletedAutofillValues({
          status: currentBook.status,
          totalPages: currentBook.totalPages,
          currentPage: currentBook.currentPage,
          totalChapters: currentBook.totalChapters ?? 0,
          currentChapter: currentBook.currentChapter ?? 0,
          endDate: currentBook.endDate || '',
        });

        const hasSeries = Boolean(currentBook.series);

        this.editForm.patchValue({
          title: currentBook.title,
          author: currentBook.author,
          isbn: currentBook.isbn || '',
          publisher: currentBook.publisher || '',
          publicationYear: currentBook.publicationYear || null,
          totalPages: currentBook.totalPages,
          currentPage: completedValues.currentPage ?? currentBook.currentPage,
          totalChapters: currentBook.totalChapters ?? 0,
          currentChapter: completedValues.currentChapter ?? currentBook.currentChapter ?? 0,
          totalCharacters: currentBook.totalCharacters ?? 0,
          status: currentBook.status,
          format: normalizeBookFormat(currentBook.format),
          coverUrl: currentBook.coverUrl || '',
          startDate: currentBook.startDate || '',
          endDate: completedValues.endDate ?? (currentBook.endDate || ''),
          rating: currentBook.rating || 0,
          notes: currentBook.notes || '',
          seriesEnabled: hasSeries,
          seriesName: currentBook.series?.name || '',
          seriesVolumeNumber: currentBook.series?.volumeNumber || null,
        });
      }
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.titleInput()?.nativeElement.focus({ preventScroll: true }));
  }

  ngOnDestroy(): void {
    this.uiState.releaseScrollLock();
  }

  protected onSeriesNameInput(rawName: string): void {
    const key = normalizeSeriesKey(rawName);
    if (!key) {
      return;
    }

    const matched = this.existingSeriesOptions().find((opt) => opt.normalizedKey === key);
    const currentVolume = this.editForm.get('seriesVolumeNumber')?.value;
    if (matched && !currentVolume) {
      this.editForm.patchValue({ seriesVolumeNumber: matched.nextVolumeNumber });
    }
  }

  protected selectSeriesOption(option: ExistingSeriesOption): void {
    const currentVolume = this.editForm.get('seriesVolumeNumber')?.value;
    this.editForm.patchValue({
      seriesName: option.name,
      seriesVolumeNumber: currentVolume || option.nextVolumeNumber,
    });
  }

  protected onStatusChange(status: BookStatus): void {
    const totalPages = Number(this.editForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.editForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.editForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.editForm.get('currentChapter')?.value) || 0;
    const nextValues = getCompletedAutofillValues({
      status,
      totalPages,
      currentPage,
      totalChapters,
      currentChapter,
      endDate: this.editForm.get('endDate')?.value || '',
    });

    this.editForm.patchValue({
      ...nextValues,
      status,
    });
  }

  protected onCoverUrlChange(coverUrl: string): void {
    this.editForm.controls.coverUrl.setValue(coverUrl);
  }

  protected triggerInlineIsbnLookup(): void {
    void this.metadataLookup()?.triggerIsbnLookup(this.editForm.controls.isbn.value || '');
  }

  protected openScanner(): void {
    this.isScannerOpen.set(true);
  }

  protected closeScanner(): void {
    this.isScannerOpen.set(false);
  }

  protected onScannerIsbnDetected(isbn: string): void {
    this.isScannerOpen.set(false);
    void this.metadataLookup()?.onIsbnScanned(isbn);
  }

  protected onMetadataCandidateApplied(event: {
    candidate: BookMetadataCandidate;
    applyMode: BookMetadataApplyMode;
  }): void {
    const raw = this.editForm.getRawValue();
    const patch = buildMetadataFormPatch(
      {
        title: raw.title,
        author: raw.author,
        isbn: raw.isbn,
        publisher: raw.publisher,
        publicationYear: raw.publicationYear,
        totalPages: raw.totalPages,
        coverUrl: raw.coverUrl,
        seriesName: raw.seriesName,
        seriesOrder: raw.seriesVolumeNumber,
      },
      event.candidate,
      event.applyMode
    );

    const { seriesOrder, genre: _genre, ...formPatch } = patch;
    const extendedPatch: Record<string, unknown> = { ...formPatch };
    if (patch.seriesName || seriesOrder !== undefined) {
      extendedPatch['seriesEnabled'] = true;
    }
    if (seriesOrder !== undefined) {
      extendedPatch['seriesVolumeNumber'] = seriesOrder;
    }

    this.editForm.patchValue(extendedPatch);
    if (patch.publicationYear != null) {
      this.providerApprovedYear.set(Number(patch.publicationYear));
    }

    for (const key of Object.keys(extendedPatch)) {
      const control = this.editForm.get(key);
      control?.markAsDirty();
      control?.markAsTouched();
    }
  }

  protected async save(): Promise<void> {
    const currentBook = this.book();
    if (this.editForm.invalid || !currentBook || this.isSaving()) return;

    const status = this.editForm.get('status')?.value as BookStatus | null;
    const totalPages = Number(this.editForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.editForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.editForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.editForm.get('currentChapter')?.value) || 0;
    const endDate = this.editForm.get('endDate')?.value || '';

    this.editForm.patchValue(
      getCompletedAutofillValues({
        status,
        totalPages,
        currentPage,
        totalChapters,
        currentChapter,
        endDate,
      })
    );

    const preCheckVal = this.editForm.getRawValue();
    const pubYear = preCheckVal.publicationYear ? Number(preCheckVal.publicationYear) : null;
    const antiqueCheck = requiresManualAntiqueYearConfirmation({
      publicationYear: pubYear,
      startDate: preCheckVal.startDate || null,
      endDate: preCheckVal.endDate || null,
      isFromExternalProvider: pubYear !== null && pubYear === this.providerApprovedYear(),
    });
    if (antiqueCheck.required) {
      const t = this.i18n.t();
      const confirmed = await this.confirmDialogService.confirm({
        title: t.bookForm.antiqueYearConfirmTitle,
        message: t.bookForm.antiqueYearConfirmMessage.replace(
          '{years}',
          antiqueCheck.anomalousYears.join(', ')
        ),
        confirmLabel: t.bookForm.antiqueYearConfirmAction,
        cancelLabel: t.bookForm.antiqueYearCancelAction,
        severity: 'warning',
        suppressibleKey: 'manualAntiqueYear',
        suppressCheckboxLabel: t.confirmDialog.dontAskAgainMinor,
      });
      if (!confirmed) {
        this.focusAntiqueYearInput(preCheckVal.startDate, preCheckVal.endDate);
        return;
      }
    }

    this.isSaving.set(true);
    const val = this.editForm.getRawValue();

    const normalizedSeriesKey = normalizeSeriesKey(val.seriesName ?? '');
    const matchedSeries = normalizedSeriesKey
      ? this.existingSeriesOptions().find((opt) => opt.normalizedKey === normalizedSeriesKey)
      : undefined;
    const sameExistingSeries =
      normalizedSeriesKey &&
      normalizeSeriesKey(currentBook.series?.name ?? '') === normalizedSeriesKey;

    const series = buildBookSeriesPayload({
      enabled: val.seriesEnabled,
      name: val.seriesName,
      volumeNumber: val.seriesVolumeNumber,
      existingSeriesId:
        matchedSeries?.id ?? (sameExistingSeries ? currentBook.series?.id : undefined),
    });
    const normalizedRating = normalizeBookRating(val.rating);

    const updatedBook: Book = {
      ...currentBook,
      title: val.title!.trim(),
      author: val.author!.trim(),
      isbn: val.isbn?.trim() || undefined,
      publisher: val.publisher?.trim() || undefined,
      publicationYear: val.publicationYear ? Number(val.publicationYear) : undefined,
      totalPages: Number(val.totalPages) || 0,
      currentPage: Number(val.currentPage) || 0,
      totalCharacters: val.totalCharacters ? Number(val.totalCharacters) : undefined,
      totalChapters: val.totalChapters ? Number(val.totalChapters) : undefined,
      currentChapter: val.currentChapter ? Number(val.currentChapter) : undefined,
      status: val.status as BookStatus,
      format: normalizeBookFormat(val.format),
      series,
      coverUrl: val.coverUrl?.trim() || undefined,
      rating: normalizedRating,
      startDate: val.startDate || undefined,
      endDate: val.endDate || undefined,
      notes: val.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.booksService.update(currentBook.id, updatedBook);
      this.saved.emit(updatedBook);
      this.closed.emit();
    } catch (error) {
      console.error('[BookEditModal] Failed to update book:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    window.setTimeout(() => this.closed.emit(), 180);
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  protected handleEscape(): void {
    if (this.confirmDialogService.activeDialog() !== null || this.isScannerOpen()) {
      return;
    }
    this.cancel();
  }

  private focusAntiqueYearInput(startDate?: string | null, endDate?: string | null): void {
    const startYear = extractYearFromIsoPrefix(startDate);
    if (startYear !== null && startYear < 1900) {
      this.startDateInput()?.nativeElement.focus({ preventScroll: true });
      return;
    }
    const endYear = extractYearFromIsoPrefix(endDate);
    if (endYear !== null && endYear < 1900) {
      this.endDateInput()?.nativeElement.focus({ preventScroll: true });
      return;
    }
    this.publicationYearInput()?.nativeElement.focus({ preventScroll: true });
  }
}
