import { Component, input, output, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book, BookStatus } from '../../models/book.model';
import { BooksService } from '../../services/books.service';

@Component({
  selector: 'app-book-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './book-editor.html',
  styleUrl: './book-editor.css'
})
export class BookEditorComponent implements OnInit {
  private readonly booksService = inject(BooksService);

  readonly existingBook = input<Book | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<Book>();

  protected readonly statusOptions: BookStatus[] = ['pending', 'reading', 'completed', 'abandoned'];
  protected draft: Book;

  constructor() {
    this.draft = this.emptyBook();
  }

  ngOnInit(): void {
    const selected = this.existingBook();
    if (selected) {
      this.draft = { ...selected };
    }
  }

  protected save(): void {
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

    if (!normalized.id) {
      normalized.id = this.makeId();
      normalized.createdAt = now;
      this.booksService.add(normalized);
    } else {
      this.booksService.update(normalized.id, normalized);
    }

    this.saved.emit(normalized);
    this.closed.emit();
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

  private makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
