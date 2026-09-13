import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BooksService } from '../../../features/books/services/books.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import {
  LucidePlus,
  LucideSun,
  LucideMoon,
  LucideBook,
  LucideBarChart2,
  LucideSettings,
  LucideHome,
  LucideChevronLeft,
  LucideGithub,
  LucideInfo,
} from '@lucide/angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hidden lg:flex',
  },
})
export class SidebarComponent {
  protected readonly uiState = inject(UiStateService);
  protected readonly booksService = inject(BooksService);
  protected readonly themeService = inject(ThemeService);

  protected readonly Plus = LucidePlus;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Book = LucideBook;
  protected readonly Stats = LucideBarChart2;
  protected readonly Settings = LucideSettings;
  protected readonly Home = LucideHome;
  protected readonly ChevronLeft = LucideChevronLeft;
  protected readonly Github = LucideGithub;
  protected readonly Info = LucideInfo;

  protected toggleSidebar(): void {
    this.uiState.toggleSidebar();
  }

  protected openCreate(): void {
    this.booksService.openCreateModal();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected openGitHub(): void {
    window.open('https://github.com', '_blank', 'noopener,noreferrer');
  }
}
