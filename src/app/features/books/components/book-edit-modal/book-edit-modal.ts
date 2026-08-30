import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService } from '../../services/books.service';
import { Book, BookFormat, BookStatus } from '../../models/book.model';

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
  private readonly fb = inject(FormBuilder);

  // Inputs y Outputs reactivos nativos de Angular 18+
  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly saved = output<Book>();

  // Estado local
  protected readonly isSaving = signal<boolean>(false);
  protected readonly isClosing = signal<boolean>(false);

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
    totalPages: [0, [Validators.required, Validators.min(0)]],
    currentPage: [0, [Validators.required, Validators.min(0)]],
    totalChapters: [0, [Validators.min(0)]],
    currentChapter: [0, [Validators.min(0)]],
    totalCharacters: [0, [Validators.min(0)]],
    status: ['pending' as BookStatus, [Validators.required]],
    format: ['Físico'],
    coverUrl: [''],
    startDate: [''],
    endDate: [''],
    notes: ['']
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

        this.editForm.patchValue({
          title: currentBook.title,
          author: currentBook.author,
          totalPages: currentBook.totalPages,
          currentPage: completedValues.currentPage ?? currentBook.currentPage,
          totalChapters: currentBook.totalChapters ?? 0,
          currentChapter: completedValues.currentChapter ?? (currentBook.currentChapter ?? 0),
          totalCharacters: currentBook.totalCharacters ?? 0,
          status: currentBook.status,
          format: this.normalizeFormatValue(currentBook.format),
          coverUrl: currentBook.coverUrl || '',
          startDate: currentBook.startDate || '',
          notes: currentBook.notes || '',
          endDate: completedValues.endDate ?? (currentBook.endDate || '')
        });
      }
    });
  }

  protected onStatusChange(status: BookStatus): void {
    const values = this.editForm.getRawValue();
    const nextValues = this.getCompletedAutofillValues({
      status,
      totalPages: Number(values.totalPages) || 0,
      currentPage: Number(values.currentPage) || 0,
      totalChapters: Number(values.totalChapters) || 0,
      currentChapter: Number(values.currentChapter) || 0,
      endDate: values.endDate || ''
    });

    this.editForm.patchValue({
      ...nextValues,
      status
    });
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

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscape(event: Event): void {
    event.preventDefault();
    this.cancel();
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
    const val = this.editForm.value;

    const updatedBook: Book = {
      ...currentBook,
      title: val.title!.trim(),
      author: val.author!.trim(),
      totalPages: Number(val.totalPages) || 0,
      currentPage: Number(val.currentPage) || 0,
      totalChapters: Number(val.totalChapters) || 0,
      currentChapter: Number(val.currentChapter) || 0,
      totalCharacters: Number(val.totalCharacters) || 0,
      status: val.status as BookStatus,
      format: this.normalizeFormatValue(val.format),
      coverUrl: val.coverUrl?.trim() || undefined,
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

  private getTodayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
