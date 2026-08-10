import { Component, computed, inject } from '@angular/core';
import { BooksService } from '../../services/books.service';
import { ReadingStatsService } from '../../services/reading-stats.service';

@Component({
  selector: 'app-books-page',
  standalone: true,
  templateUrl: './books-page.html',
  styleUrl: './books-page.css'
})
export class BooksPage {
  private readonly booksService = inject(BooksService);
  private readonly readingStatsService = inject(ReadingStatsService);

  protected readonly books = this.booksService.books;
  protected readonly stats = computed(() => this.readingStatsService.getStats());

  protected readonly totalBooks = computed(() => this.books().length);
  protected readonly readingBooks = computed(
    () => this.books().filter((book) => book.status === 'reading').length
  );
}
