import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { Book, BookStatus, ReadingLog } from '../../models/book.model';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-detail-modal.html',
  styleUrl: './book-detail-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailModalComponent {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly fb = inject(FormBuilder);

  // Inputs y Outputs
  readonly bookId = input.required<string>();
  readonly closed = output<void>();

  // Estados locales con Signals
  protected readonly mode = signal<'view' | 'edit'>('view');
  protected readonly showLogEditor = signal<boolean>(false);
  protected readonly editingLog = signal<ReadingLog | undefined>(undefined);
  protected readonly isSaving = signal<boolean>(false);

  // Búsqueda y reactividad declarativa
  protected readonly book = computed<Book | undefined>(() => {
    return this.booksService.books().find((b) => b.id === this.bookId());
  });

  protected readonly bookLogs = computed<ReadingLog[]>(() => {
    const id = this.bookId();
    return this.readingLogService
      .readingLogs()
      .filter((log) => log.bookId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  protected readonly progressPercentage = computed(() => {
    const currentBook = this.book();
    if (!currentBook || currentBook.totalPages <= 0) return 0;
    return Math.min(100, Math.round((currentBook.currentPage / currentBook.totalPages) * 100));
  });

  // Formulario reactivo tipado
  protected readonly editForm = this.fb.group({
    title: ['', [Validators.required]],
    author: ['', [Validators.required]],
    totalPages: [1, [Validators.required, Validators.min(1)]],
    currentPage: [0, [Validators.required, Validators.min(0)]],
    status: ['pending' as BookStatus, [Validators.required]],
    format: [''],
    coverUrl: [''],
    notes: [''],
  });

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.closed.emit();
  }

  protected setMode(newMode: 'view' | 'edit'): void {
    if (newMode === 'edit') {
      const currentBook = this.book();
      if (currentBook) {
        this.editForm.patchValue({
          title: currentBook.title,
          author: currentBook.author,
          totalPages: currentBook.totalPages,
          currentPage: currentBook.currentPage,
          status: currentBook.status,
          format: currentBook.format || '',
          coverUrl: currentBook.coverUrl || '',
          notes: currentBook.notes || '',
        });
      }
    }
    this.mode.set(newMode);
  }

  protected async saveBookChanges(): Promise<void> {
    const currentBook = this.book();
    if (this.editForm.invalid || !currentBook || this.isSaving()) return;

    this.isSaving.set(true);
    const val = this.editForm.value;

    const updatedBook: Book = {
      ...currentBook,
      title: val.title!.trim(),
      author: val.author!.trim(),
      totalPages: Number(val.totalPages) || 1,
      currentPage: Number(val.currentPage) || 0,
      status: val.status as BookStatus,
      format: val.format?.trim() || undefined,
      coverUrl: val.coverUrl?.trim() || undefined,
      notes: val.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.booksService.update(currentBook.id, updatedBook);
      this.mode.set('view');
    } catch (error) {
      console.error('Error actualizando el libro:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected openLogEditor(existingLog?: ReadingLog): void {
    this.editingLog.set(existingLog);
    this.showLogEditor.set(true);
  }

  protected closeLogEditor(): void {
    this.showLogEditor.set(false);
    this.editingLog.set(undefined);
  }

  protected async deleteLog(logId: string): Promise<void> {
    const confirmed = window.confirm('¿Deseas eliminar este registro de lectura?');
    if (!confirmed) return;

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('Error al eliminar la sesión de lectura:', error);
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }

  protected getStatusBadgeClass(status: BookStatus): string {
    switch (status) {
      case 'reading':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'abandoned':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  protected getStatusLabel(status: BookStatus): string {
    switch (status) {
      case 'reading': return 'Leyendo';
      case 'completed': return 'Completado';
      case 'abandoned': return 'Abandonado';
      case 'pending': return 'Pendiente';
    }
  }
}
