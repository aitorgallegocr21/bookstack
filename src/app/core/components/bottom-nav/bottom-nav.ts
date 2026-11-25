import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowUp,
  LucideBarChart2,
  LucideBook,
  LucideDynamicIcon,
  LucideGitBranch,
  LucideGripHorizontal,
  LucideHome,
  LucideInfo,
  LucideLayers,
  LucideMoon,
  LucidePlus,
  LucideSettings,
  LucideSun,
} from '@lucide/angular';
import { I18nService } from '../../i18n/i18n.service';
import { DockPositionService } from '../../services/dock-position.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import { detectSnapEdge } from '../../utils/dock-snap.utils';
import { BrandLogoComponent } from '../brand-logo/brand-logo';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideDynamicIcon, BrandLogoComponent],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenu()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class BottomNavComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly i18n = inject(I18nService);
  protected readonly uiState = inject(UiStateService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dockPosition = inject(DockPositionService);

  protected readonly Home = LucideHome;
  protected readonly Book = LucideBook;
  protected readonly Stats = LucideBarChart2;
  protected readonly Settings = LucideSettings;
  protected readonly About = LucideInfo;
  protected readonly Series = LucideLayers;
  protected readonly Plus = LucidePlus;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;
  protected readonly Github = LucideGitBranch;
  protected readonly ArrowUp = LucideArrowUp;
  protected readonly ArrowDown = LucideArrowDown;
  protected readonly GripHorizontal = LucideGripHorizontal;

  protected readonly isMenuOpen = signal(false);
  protected readonly position = this.dockPosition.mobilePosition;

  protected readonly popoverAnimationClass = computed(() =>
    this.position() === 'top' ? 'dock-popover-top' : 'dock-popover-bottom'
  );

  private activePointerMove: ((event: PointerEvent) => void) | null = null;
  private activePointerUp: ((event: PointerEvent) => void) | null = null;

  ngOnDestroy(): void {
    this.cleanupDragListeners();
    if (this.dockPosition.isDragging()) {
      this.dockPosition.endDrag(null, true);
    }
  }

  protected openCreate(): void {
    this.closeMenu();
    this.uiState.openCreateModal();
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected toggleMobileEdge(): void {
    this.dockPosition.toggleMobilePosition();
    this.isMenuOpen.set(false);
  }

  protected openGitHub(): void {
    this.isMenuOpen.set(false);
    window.open(
      'https://github.com/aitorgallegocr21/bookstack.git',
      '_blank',
      'noopener,noreferrer'
    );
  }

  protected onDocumentClick(event: Event): void {
    if (!this.isMenuOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isMenuOpen.set(false);
    }
  }

  protected onDragStart(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    this.isMenuOpen.set(false);
    this.dockPosition.startDrag(this.position());

    this.activePointerMove = (moveEvent: PointerEvent) => {
      const edge = detectSnapEdge(
        moveEvent.clientX,
        moveEvent.clientY,
        Math.min(window.innerWidth, 767),
        window.innerHeight,
        48
      );
      if (edge === 'top' || edge === 'bottom') {
        this.dockPosition.updateDragPreview(edge);
      }
    };

    this.activePointerUp = (upEvent: PointerEvent) => {
      const edge =
        detectSnapEdge(
          upEvent.clientX,
          upEvent.clientY,
          Math.min(window.innerWidth, 767),
          window.innerHeight,
          48
        ) ?? this.dockPosition.snapPreviewPosition();
      this.dockPosition.endDrag(edge, true);
      this.cleanupDragListeners();
    };

    window.addEventListener('pointermove', this.activePointerMove);
    window.addEventListener('pointerup', this.activePointerUp);
    window.addEventListener('pointercancel', this.activePointerUp);
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
