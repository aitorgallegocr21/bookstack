import {
  Component,
  ChangeDetectionStrategy,
  inject,
  output,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService } from '../../services/books.service';
import { Book, BookStatus } from '../../models/book.model';

@Component({
  selector: 'app-book-create-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './book-create-modal.html',
  styleUrl: './book-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()'
  }
})
export class BookCreateModalComponent {
  private readonly booksService = inject(BooksService);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly saved = output<Book>();

  protected readonly isSaving = signal<boolean>(false);

  protected readonly statusOptions: { value: BookStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'reading', label: 'Leyendo' },
    { value: 'completed', label: 'Completado' },
    { value: 'abandoned', label: 'Abandonado' }
  ];

  protected readonly createForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    totalPages: [0, [Validators.required, Validators.min(0)]],
    format: ['Físico'],
    status: ['pending' as BookStatus, [Validators.required]],
    coverUrl: [''],
    notes: ['']
  });

  protected handleEscape(): void {
    this.cancel();
  }

  protected async save(): Promise<void> {
    if (this.createForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const val = this.createForm.value;
    const now = new Date().toISOString();

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: val.title!.trim(),
      author: val.author!.trim(),
      totalPages: Number(val.totalPages) || 0,
      currentPage: 0,
      status: val.status as BookStatus,
      format: val.format?.trim() || 'Físico',
      coverUrl: val.coverUrl?.trim() || undefined,
      notes: val.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.booksService.add(newBook);
      this.saved.emit(newBook);
      this.closed.emit();
    } catch (error) {
      console.error('Error al crear el nuevo libro:', error);
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
