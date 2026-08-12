import {
  Component,
  input,
  output,
  inject,
  effect,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book, BookStatus } from '../../models/book.model';
import { BooksService } from '../../services/books.service';

@Component({
  selector: 'app-book-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './book-editor.html',
  styleUrl: './book-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookEditorComponent {
  private readonly booksService = inject(BooksService);

  readonly existingBook = input<Book | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<Book>();

  protected readonly statusOptions: BookStatus[] = ['pending', 'reading', 'completed', 'abandoned'];
  protected draft: Book = this.emptyBook();
  protected isSaving = false;

  constructor() {
    effect(() => {
      const selected = this.existingBook();
      if (selected) {
        this.draft = { ...selected };
      } else {
        this.draft = this.emptyBook();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel();
  }

  protected async save(): Promise<void> {
    if (!this.draft.title.trim() || !this.draft.author.trim() || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const now = new Date().toISOString();

    const normalized: Book = {
      ...this.draft,
      title: this.draft.title.trim(),
      author: this.draft.author.trim(),
      totalPages: Number(this.draft.totalPages) || 0,
      currentPage: Number(this.draft.currentPage) || 0,
      status: this.draft.status || 'pending',
      updatedAt: now,
      createdAt: this.draft.createdAt || now
    };

    try {
      if (!normalized.id) {
        normalized.id = crypto.randomUUID();
        normalized.createdAt = now;
        await this.booksService.add(normalized);
      } else {
        await this.booksService.update(normalized.id, normalized);
      }

      this.saved.emit(normalized);
      this.closed.emit();
    } catch (error) {
      console.error('Error guardando el libro:', error);
    } finally {
      this.isSaving = false;
    }
  }

  protected cancel(): void {
    this.closed.emit();
  }

  private emptyBook(): Book {
    return {
      id: '',
      title: '',
      author: '',
      totalPages: 0,
      currentPage: 0,
      status: 'pending',
      format: 'Físico',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
