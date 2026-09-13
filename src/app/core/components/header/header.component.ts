import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { LucideDynamicIcon, LucideSun, LucideMoon, LucideHome } from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideDynamicIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);

  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Home = LucideHome;

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
