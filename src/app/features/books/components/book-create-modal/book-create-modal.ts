import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { BOOK_RATING_MAX, BOOK_RATING_MIN, Book, BookStatus } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import {
  BOOK_STATUS_VALUES,
  buildBookSeriesPayload,
  getCompletedAutofillValues,
  normalizeBookFormat,
  normalizeBookRating,
} from '../../utils/book-form.utils';
import { CoverPickerComponent } from '../cover-picker/cover-picker';

@Component({
  selector: 'app-book-create-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CoverPickerComponent],
  templateUrl: './book-create-modal.html',
  styleUrl: './book-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()',
  },
})
export class BookCreateModalComponent implements AfterViewInit, OnDestroy {
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);
  private readonly booksService = inject(BooksService);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly saved = output<Book>();

  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly isSaving = signal<boolean>(false);
  protected readonly isClosing = signal<boolean>(false);
  protected readonly statusValues = BOOK_STATUS_VALUES;

  protected readonly createForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    isbn: [''],
    publisher: [''],
    publicationYear: [null],
    totalPages: [0, [Validators.required, Validators.min(0)]],
    currentPage: [0, [Validators.min(0)]],
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
    seriesVolumeNumber: [null],
  });

  constructor() {
    this.uiState.acquireScrollLock();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.titleInput()?.nativeElement.focus({ preventScroll: true }));
  }

  ngOnDestroy(): void {
    this.uiState.releaseScrollLock();
  }

  protected handleEscape(): void {
    this.cancel();
  }

  protected onStatusChange(status: BookStatus): void {
    const totalPages = Number(this.createForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.createForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.createForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.createForm.get('currentChapter')?.value) || 0;
    const nextValues = getCompletedAutofillValues({
      status,
      totalPages,
      currentPage,
      totalChapters,
      currentChapter,
      endDate: this.createForm.get('endDate')?.value || '',
    });

    this.createForm.patchValue(nextValues);
  }

  protected onCoverUrlChange(coverUrl: string): void {
    this.createForm.controls.coverUrl.setValue(coverUrl);
  }

  protected async save(): Promise<void> {
    if (this.createForm.invalid || this.isSaving()) return;

    const status = this.createForm.get('status')?.value as BookStatus | null;
    const totalPages = Number(this.createForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.createForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.createForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.createForm.get('currentChapter')?.value) || 0;
    const endDate = this.createForm.get('endDate')?.value || '';

    this.createForm.patchValue(
      getCompletedAutofillValues({
        status,
        totalPages,
        currentPage,
        totalChapters,
        currentChapter,
        endDate,
      })
    );

    this.isSaving.set(true);
    const val = this.createForm.getRawValue();
    const now = new Date().toISOString();

    const series = buildBookSeriesPayload({
      enabled: val.seriesEnabled,
      name: val.seriesName,
      volumeNumber: val.seriesVolumeNumber,
    });
    const normalizedRating = normalizeBookRating(val.rating);

    const newBook: Book = {
      id: crypto.randomUUID(),
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
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.booksService.add(newBook);
      this.saved.emit(newBook);
      this.closed.emit();
    } catch (error) {
      console.error('[BookCreateModal] Failed to create book:', error);
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
    // Only treat clicks that originate on the backdrop itself as a close action
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}
