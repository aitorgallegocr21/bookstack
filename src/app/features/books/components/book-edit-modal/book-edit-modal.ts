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
import { Book, BookStatus } from '../../models/book.model';

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

  // Formulario reactivo tipado
  protected readonly editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    totalPages: [0, [Validators.required, Validators.min(0)]],
    currentPage: [0, [Validators.required, Validators.min(0)]],
    status: ['pending' as BookStatus, [Validators.required]],
    format: ['Físico'],
    coverUrl: [''],
    notes: ['']
  });

  constructor() {
    // SOLUCIÓN ÓPTIMA: Se sincronizan los valores del formulario mediante effect()
    // Se ejecuta automáticamente cuando los inputs están ligados y listos.
    effect(() => {
      const currentBook = this.book();
      if (currentBook) {
        this.editForm.patchValue({
          title: currentBook.title,
          author: currentBook.author,
          totalPages: currentBook.totalPages,
          currentPage: currentBook.currentPage,
          status: currentBook.status,
          format: currentBook.format || 'Físico',
          coverUrl: currentBook.coverUrl || '',
          notes: currentBook.notes || ''
        });
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscape(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  protected async save(): Promise<void> {
    const currentBook = this.book();
    if (this.editForm.invalid || !currentBook || this.isSaving()) return;

    this.isSaving.set(true);
    const val = this.editForm.value;

    const updatedBook: Book = {
      ...currentBook,
      title: val.title!.trim(),
      author: val.author!.trim(),
      totalPages: Number(val.totalPages) || 0,
      currentPage: Number(val.currentPage) || 0,
      status: val.status as BookStatus,
      format: val.format?.trim() || 'Físico',
      coverUrl: val.coverUrl?.trim() || undefined,
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
    this.closed.emit();
  }

  protected onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }
}
