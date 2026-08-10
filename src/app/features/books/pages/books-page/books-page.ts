import { Component, computed, inject } from '@angular/core';
import { BooksService } from '../../services/books.service';

@Component({
  selector: 'app-books-page',
  standalone: true,
  templateUrl: './books-page.html',
  styleUrl: './books-page.css'
})
export class BooksPage {
  private readonly booksService = inject(BooksService);

  protected readonly books = this.booksService.books;

  protected readonly totalBooks = computed(() => this.books().length);
  protected readonly readingBooks = computed(
    () => this.books().filter((book) => book.status === 'reading').length
  );
}
