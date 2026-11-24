import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './core/components/bottom-nav/bottom-nav';
import { ConfirmDialogComponent } from './core/components/confirm-dialog/confirm-dialog';
import { SidebarComponent } from './core/components/sidebar/sidebar';
import { DockPositionService } from './core/services/dock-position.service';
import { UiStateService } from './core/services/ui-state.service';
import { getSnapPreviewRect } from './core/utils/dock-snap.utils';
import { BookCreateModalComponent } from './features/books/components/book-create-modal/book-create-modal';
import { BooksService } from './features/books/services/books.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarComponent,
    BottomNavComponent,
    BookCreateModalComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly booksService = inject(BooksService);
  protected readonly uiState = inject(UiStateService);
  protected readonly dockPosition = inject(DockPositionService);
  protected readonly isFallbackTransitionActive = signal(false);
  private fallbackRafId: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.fallbackRafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.fallbackRafId);
      }
    });
  }

  protected onRouteActivate(): void {
    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      return;
    }

    this.isFallbackTransitionActive.set(false);
    if (this.fallbackRafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.fallbackRafId);
    }

    if (typeof requestAnimationFrame === 'function') {
      this.fallbackRafId = requestAnimationFrame(() => {
        this.isFallbackTransitionActive.set(true);
        this.fallbackRafId = null;
      });
    } else {
      this.isFallbackTransitionActive.set(true);
    }
  }

  protected readonly snapPreviewRect = computed(() => {
    const pos = this.dockPosition.snapPreviewPosition();
    return pos ? getSnapPreviewRect(pos, this.uiState.isSidebarCollapsed()) : null;
  });

  protected readonly mainOffsetClasses = computed(() => {
    const mobileClass = this.dockPosition.mobilePosition() === 'top' ? 'pt-24 pb-6' : 'pt-4 pb-24';
    const enterClass = this.isFallbackTransitionActive() ? ' page-enter' : '';

    switch (this.dockPosition.desktopPosition()) {
      case 'left':
        return `${mobileClass} md:ml-[var(--sidebar-width)] md:mr-0 md:pt-4 md:pb-6${enterClass}`;
      case 'right':
        return `${mobileClass} md:mr-[var(--sidebar-width)] md:ml-0 md:pt-4 md:pb-6${enterClass}`;
      case 'top':
        return `${mobileClass} md:ml-0 md:mr-0 md:pt-24 md:pb-6${enterClass}`;
      case 'bottom':
        return `${mobileClass} md:ml-0 md:mr-0 md:pt-4 md:pb-24${enterClass}`;
    }
  });
}
