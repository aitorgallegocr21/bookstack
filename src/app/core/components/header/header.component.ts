import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BooksService } from '../../../features/books/services/books.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  protected readonly booksService = inject(BooksService);
  protected readonly themeService = inject(ThemeService);

  protected openCreate(): void {
    this.booksService.openCreateModal();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
