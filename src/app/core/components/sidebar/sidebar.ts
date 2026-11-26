import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import {
  LucideBarChart2,
  LucideBook,
  LucideChevronLeft,
  LucideDynamicIcon,
  LucideGitBranch,
  LucideGripVertical,
  LucideHome,
  LucideInfo,
  LucideLayers,
  LucideMoon,
  LucideMove,
  LucidePanelBottom,
  LucidePanelLeft,
  LucidePanelRight,
  LucidePanelTop,
  LucidePlus,
  LucideSettings,
  LucideSun,
} from '@lucide/angular';
import { I18nService } from '../../i18n/i18n.service';
import { DockPositionService } from '../../services/dock-position.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import { DockPosition, detectSnapEdge } from '../../utils/dock-snap.utils';
import { BrandLogoComponent } from '../brand-logo/brand-logo';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideDynamicIcon, BrandLogoComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hidden md:flex',
    '(document:keydown.escape)': 'closeDockMenu()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SidebarComponent implements OnDestroy {
  private readonly router = inject(Router);
  protected readonly uiState = inject(UiStateService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dockPosition = inject(DockPositionService);
  protected readonly i18n = inject(I18nService);

  protected readonly Plus = LucidePlus;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Book = LucideBook;
  protected readonly Series = LucideLayers;
  protected readonly Stats = LucideBarChart2;
  protected readonly Settings = LucideSettings;
  protected readonly Home = LucideHome;
  protected readonly ChevronLeft = LucideChevronLeft;
  protected readonly Info = LucideInfo;
  protected readonly Github = LucideGitBranch;
  protected readonly Grip = LucideGripVertical;
  protected readonly Move = LucideMove;
  protected readonly PanelLeft = LucidePanelLeft;
  protected readonly PanelRight = LucidePanelRight;
  protected readonly PanelTop = LucidePanelTop;
  protected readonly PanelBottom = LucidePanelBottom;

  protected readonly isDockMenuOpen = signal(false);

  protected readonly position = this.dockPosition.desktopPosition;
  protected readonly isVertical = this.dockPosition.isDesktopVertical;

  protected readonly navItems = computed(() => {
    const nav = this.i18n.t().nav;
    return [
      { path: '/', label: nav.home, icon: this.Home },
      { path: '/books', label: nav.books, icon: this.Book },
      { path: '/series', label: nav.series, icon: this.Series },
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

  protected readonly dockOptions = computed(() => {
    const nav = this.i18n.t().nav;
    return [
      { id: 'left' as const, label: nav.dockLeft, icon: this.PanelLeft },
      { id: 'right' as const, label: nav.dockRight, icon: this.PanelRight },
      { id: 'top' as const, label: nav.dockTop, icon: this.PanelTop },
      { id: 'bottom' as const, label: nav.dockBottom, icon: this.PanelBottom },
    ] as const;
  });

  protected readonly popoverAnimationClass = computed(() => {
    switch (this.position()) {
      case 'left':
        return 'dock-popover-left';
      case 'right':
        return 'dock-popover-right';
      case 'top':
        return 'dock-popover-top';
      case 'bottom':
        return 'dock-popover-bottom';
    }
  });

  private activePointerMove: ((event: PointerEvent) => void) | null = null;
  private activePointerUp: ((event: PointerEvent) => void) | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.closeDockMenu();
      });
  }

  ngOnDestroy(): void {
    this.cleanupDragListeners();
    if (this.dockPosition.isDragging()) {
      this.dockPosition.endDrag(null, false);
    }
  }

  protected toggleSidebar(): void {
    this.closeDockMenu();
    this.uiState.toggleSidebar();
  }

  protected openCreate(): void {
    this.closeDockMenu();
    this.uiState.openCreateModal();
  }

  protected toggleTheme(): void {
    this.closeDockMenu();
    this.themeService.toggleTheme();
  }

  protected toggleDockMenu(event: Event): void {
    event.stopPropagation();
    this.isDockMenuOpen.update((open) => !open);
  }

  protected closeDockMenu(): void {
    this.isDockMenuOpen.set(false);
  }

  protected selectDockPosition(position: DockPosition): void {
    this.dockPosition.setDesktopPosition(position);
    this.isDockMenuOpen.set(false);
  }

  protected onDocumentClick(event: Event): void {
    if (!this.isDockMenuOpen()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-dock-menu-root]')) {
      this.isDockMenuOpen.set(false);
    }
  }

  protected onDragStart(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    this.isDockMenuOpen.set(false);
    this.dockPosition.startDrag(this.position());

    this.activePointerMove = (moveEvent: PointerEvent) => {
      const edge = detectSnapEdge(
        moveEvent.clientX,
        moveEvent.clientY,
        window.innerWidth,
        window.innerHeight,
        64
      );
      if (edge) {
        this.dockPosition.updateDragPreview(edge);
      }
    };

    this.activePointerUp = (upEvent: PointerEvent) => {
      const edge =
        detectSnapEdge(
          upEvent.clientX,
          upEvent.clientY,
          window.innerWidth,
          window.innerHeight,
          64
        ) ?? this.dockPosition.snapPreviewPosition();
      this.dockPosition.endDrag(edge, false);
      this.cleanupDragListeners();
    };

    window.addEventListener('pointermove', this.activePointerMove);
    window.addEventListener('pointerup', this.activePointerUp);
    window.addEventListener('pointercancel', this.activePointerUp);
  }

  protected openGitHub(): void {
    this.closeDockMenu();
    window.open(
      'https://github.com/aitorgallegocr21/bookstack.git',
      '_blank',
      'noopener,noreferrer'
    );
  }

  private cleanupDragListeners(): void {
    if (this.activePointerMove) {
      window.removeEventListener('pointermove', this.activePointerMove);
      this.activePointerMove = null;
    }
    if (this.activePointerUp) {
      window.removeEventListener('pointerup', this.activePointerUp);
      this.activePointerUp = null;
    }
  }
}
