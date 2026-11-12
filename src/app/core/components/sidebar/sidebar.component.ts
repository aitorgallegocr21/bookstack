import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBarChart2,
  LucideBook,
  LucideChevronLeft,
  LucideDynamicIcon,
  LucideGitBranch,
  LucideHome,
  LucideInfo,
  LucideMoon,
  LucidePlus,
  LucideSettings,
  LucideSun,
} from '@lucide/angular';
import { BooksService } from '../../../features/books/services/books.service';
import { I18nService } from '../../i18n/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hidden md:flex',
  },
})
export class SidebarComponent {
  protected readonly uiState = inject(UiStateService);
  protected readonly booksService = inject(BooksService);
  protected readonly themeService = inject(ThemeService);
  protected readonly i18n = inject(I18nService);

  protected readonly Plus = LucidePlus;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Book = LucideBook;
  protected readonly Stats = LucideBarChart2;
  protected readonly Settings = LucideSettings;
  protected readonly Home = LucideHome;
  protected readonly ChevronLeft = LucideChevronLeft;
  protected readonly Info = LucideInfo;
  protected readonly Github = LucideGitBranch;

  protected readonly navItems = computed(() => {
    const nav = this.i18n.t().nav;
    return [
      { path: '/', label: nav.home, icon: this.Home },
      { path: '/books', label: nav.books, icon: this.Book },
      { path: '/stats', label: nav.stats, icon: this.Stats },
    ] as const;
  });

  protected readonly secondaryNavItems = computed(() => {
    const nav = this.i18n.t().nav;
    return [
      { path: '/settings', label: nav.settings, icon: this.Settings },
      { path: '/about', label: nav.about, icon: this.Info },
    ] as const;
  });

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
    window.open(
      'https://github.com/aitorgallegocr21/bookstack.git',
      '_blank',
      'noopener,noreferrer',
    );
  }
}
