import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { BottomNavComponent } from './core/components/bottom-nav/bottom-nav.component';
import { BookCreateModalComponent } from './features/books/components/book-create-modal/book-create-modal';
import { BooksService } from './features/books/services/books.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, BottomNavComponent, BookCreateModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly booksService = inject(BooksService);
}
