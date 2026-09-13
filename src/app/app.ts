import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { BottomNavComponent } from './core/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { BookCreateModalComponent } from './features/books/components/book-create-modal/book-create-modal';
import { BooksService } from './features/books/services/books.service';
import { UiStateService } from './core/services/ui-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, BottomNavComponent, BookCreateModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly booksService = inject(BooksService);
  protected readonly uiState = inject(UiStateService);
}
