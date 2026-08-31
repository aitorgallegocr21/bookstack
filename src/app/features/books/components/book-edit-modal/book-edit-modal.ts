import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService } from '../../services/books.service';
import { ImageOptimizerService } from '../../services/image-optimizer.service';
import {
  Book,
  BookFormat,
  BookStatus,
  BOOK_RATING_MAX,
  BOOK_RATING_MIN
} from '../../models/book.model';

@Component({
  selector: 'app-book-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-edit-modal.html',
  styleUrl: './book-edit-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookEditModalComponent {
  private readonly booksService = inject(BooksService);
  private readonly imageOptimizerService = inject(ImageOptimizerService);
  private readonly fb = inject(FormBuilder);

  // Inputs y Outputs reactivos nativos de Angular 18+
  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly saved = output<Book>();

  // Estado local
  protected readonly isSaving = signal<boolean>(false);
  protected readonly isClosing = signal<boolean>(false);
  protected readonly coverMode = signal<'url' | 'upload'>('url');
  protected readonly coverPreview = signal<string>('');

  // Búsqueda declarativa del libro actual mediante Signal computed
  protected readonly book = computed<Book | undefined>(() => {
    return this.booksService.books().find((b) => b.id === this.bookId());
  });

  // Opciones de estado
  protected readonly statusOptions: { value: BookStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'reading', label: 'Leyendo' },
    { value: 'completed', label: 'Completado' },
    { value: 'abandoned', label: 'Abandonado' }
  ];

  private normalizeFormatValue(format?: BookFormat | string | null): string {
    if (typeof format === 'string') {
      return format.trim() || 'Físico';
    }

    return format?.name?.trim() || 'Físico';
  }

  // Formulario reactivo tipado
  protected readonly editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    isbn: [''],
    publisher: [''],
    publicationYear: [null as number | null],
    totalPages: [0, [Validators.required, Validators.min(0)]],
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
    coverSource: ['url']
  });

  constructor() {
    effect(() => {
      const currentBook = this.book();
      if (currentBook) {
        const completedValues = this.getCompletedAutofillValues({
          status: currentBook.status,
          totalPages: currentBook.totalPages,
          currentPage: currentBook.currentPage,
          totalChapters: currentBook.totalChapters ?? 0,
          currentChapter: currentBook.currentChapter ?? 0,
          endDate: currentBook.endDate || ''
        });

        this.coverPreview.set(currentBook.coverUrl || '');
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
          currentChapter: completedValues.currentChapter ?? (currentBook.currentChapter ?? 0),
          totalCharacters: currentBook.totalCharacters ?? 0,
          status: currentBook.status,
          format: this.normalizeFormatValue(currentBook.format),
          coverUrl: currentBook.coverUrl || '',
          startDate: currentBook.startDate || '',
          endDate: completedValues.endDate ?? (currentBook.endDate || ''),
          rating: currentBook.rating || 0,
          notes: currentBook.notes || '',
          seriesEnabled: hasSeries,
          seriesName: currentBook.series?.name || '',
          seriesVolumeNumber: currentBook.series?.volumeNumber || null,
          coverSource: 'url'
        });
      }
    });
  }

  protected onStatusChange(status: BookStatus): void {
    const totalPages = Number(this.editForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.editForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.editForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.editForm.get('currentChapter')?.value) || 0;
    const nextValues = this.getCompletedAutofillValues({
      status,
      totalPages,
      currentPage,
      totalChapters,
      currentChapter,
      endDate: this.editForm.get('endDate')?.value || ''
    });

    this.editForm.patchValue({
      ...nextValues,
      status
    });
  }

  protected onCoverModeChange(mode: 'url' | 'upload'): void {
    this.coverMode.set(mode);
    this.editForm.patchValue({ coverSource: mode });

    if (mode === 'url') {
      this.editForm.patchValue({ coverUrl: this.coverPreview() || '' });
      return;
    }

    if (!this.coverPreview()) {
      this.editForm.patchValue({ coverUrl: '' });
    }
  }

  protected async onCoverSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const optimizedCover = await this.imageOptimizerService.optimize(file);
      this.coverPreview.set(optimizedCover);
      this.editForm.patchValue({ coverUrl: optimizedCover });
      this.coverMode.set('upload');
    } catch (error) {
      console.error('Error al optimizar la portada:', error);
      this.coverPreview.set('');
      this.editForm.patchValue({ coverUrl: '' });
    } finally {
      input.value = '';
    }
  }

  protected clearCover(): void {
    this.coverPreview.set('');
    this.editForm.patchValue({ coverUrl: '' });
  }

  private getCompletedAutofillValues(values: {
    status: BookStatus | null;
    totalPages: number;
    currentPage: number;
    totalChapters: number;
    currentChapter: number;
    endDate: string | null;
  }): Partial<{ currentPage: number; currentChapter: number; endDate: string }> {
    if (values.status !== 'completed') {
      return {};
    }

    return {
      currentPage: Math.max(values.currentPage, values.totalPages),
      currentChapter: Math.max(values.currentChapter, values.totalChapters),
      endDate: values.endDate || this.getTodayIso()
    };
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
      this.getCompletedAutofillValues({
        status,
        totalPages,
        currentPage,
        totalChapters,
        currentChapter,
        endDate
      })
    );

    this.isSaving.set(true);
    const val = this.editForm.getRawValue();

    const hasSeries = Boolean(val.seriesEnabled) && Boolean(val.seriesName?.trim());
    const series = hasSeries
      ? {
          id: currentBook.series?.id || crypto.randomUUID(),
          name: val.seriesName!.trim(),
          volumeNumber: val.seriesVolumeNumber ? Number(val.seriesVolumeNumber) : undefined
        }
      : undefined;

    const rawRating = val.rating;
    const normalizedRating = typeof rawRating === 'number' && Number.isFinite(rawRating)
      ? Math.min(BOOK_RATING_MAX, Math.max(BOOK_RATING_MIN, rawRating))
      : undefined;

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
      format: this.normalizeFormatValue(val.format),
      series,
      coverUrl: val.coverUrl?.trim() || this.coverPreview() || undefined,
      rating: normalizedRating,
      startDate: val.startDate || undefined,
      endDate: val.endDate || undefined,
      notes: val.notes?.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      await this.booksService.update(currentBook.id, updatedBook);
      this.saved.emit(updatedBook);
      this.closed.emit();
    } catch (error) {
      console.error('Error al actualizar el libro:', error);
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
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }

  protected handleEscape(): void {
    this.cancel();
  }

  private getTodayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
