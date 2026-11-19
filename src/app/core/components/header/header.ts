import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideDynamicIcon,
  LucideGitBranch,
  LucideHome,
  LucideMoon,
  LucidePlus,
  LucideSun,
} from '@lucide/angular';
import { I18nService } from '../../i18n/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideDynamicIcon],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);

  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Home = LucideHome;
  protected readonly Plus = LucidePlus;
  protected readonly Github = LucideGitBranch;

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected openCreateModal(): void {
    this.uiState.openCreateModal();
  }
}
