import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BooksService } from '../../../features/books/services/books.service';
import { ThemeService } from '../../services/theme.service';
import { LucideDynamicIcon, LucidePlus, LucideSun, LucideMoon, LucideBook, LucideBarChart2, LucideList, LucideSettings, LucideHome } from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  protected readonly booksService = inject(BooksService);
  protected readonly themeService = inject(ThemeService);

  protected readonly Plus = LucidePlus;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Book = LucideBook;
  protected readonly Stats = LucideBarChart2;
  protected readonly Series = LucideList;
  protected readonly Settings = LucideSettings;
  protected readonly Home = LucideHome;

  protected openCreate(): void {
    this.booksService.openCreateModal();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
