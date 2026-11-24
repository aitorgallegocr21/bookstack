import { Injectable, computed, signal } from '@angular/core';
import {
  DockPosition,
  MobileDockPosition,
  isValidDockPosition,
  isValidMobileDockPosition,
} from '../utils/dock-snap.utils';

export const DESKTOP_DOCK_STORAGE_KEY = 'bookstack_desktop_dock_v1';
export const MOBILE_DOCK_STORAGE_KEY = 'bookstack_mobile_dock_v1';

@Injectable({
  providedIn: 'root',
})
export class DockPositionService {
  private readonly desktopPositionState = signal<DockPosition>(this.loadDesktopPosition());
  private readonly mobilePositionState = signal<MobileDockPosition>(this.loadMobilePosition());
  private readonly draggingState = signal<boolean>(false);
  private readonly snapPreviewState = signal<DockPosition | null>(null);

  readonly desktopPosition = this.desktopPositionState.asReadonly();
  readonly mobilePosition = this.mobilePositionState.asReadonly();
  readonly isDragging = this.draggingState.asReadonly();
  readonly snapPreviewPosition = this.snapPreviewState.asReadonly();

  readonly isDesktopVertical = computed(
    () => this.desktopPositionState() === 'left' || this.desktopPositionState() === 'right'
  );
  readonly isDesktopHorizontal = computed(
    () => this.desktopPositionState() === 'top' || this.desktopPositionState() === 'bottom'
  );

  setDesktopPosition(position: DockPosition): void {
    this.desktopPositionState.set(position);
    this.saveToStorage(DESKTOP_DOCK_STORAGE_KEY, position);
  }

  setMobilePosition(position: MobileDockPosition): void {
    this.mobilePositionState.set(position);
    this.saveToStorage(MOBILE_DOCK_STORAGE_KEY, position);
  }

  toggleMobilePosition(): void {
    const next: MobileDockPosition = this.mobilePositionState() === 'bottom' ? 'top' : 'bottom';
    this.setMobilePosition(next);
  }

  startDrag(initialPreview: DockPosition | null = null): void {
    this.draggingState.set(true);
    this.snapPreviewState.set(initialPreview);
  }

  updateDragPreview(position: DockPosition | null): void {
    if (!this.draggingState()) {
      return;
    }
    this.snapPreviewState.set(position);
  }

  endDrag(commitPosition?: DockPosition | null, isMobile = false): void {
    if (commitPosition) {
      if (isMobile && isValidMobileDockPosition(commitPosition)) {
        this.setMobilePosition(commitPosition);
      } else if (!isMobile && isValidDockPosition(commitPosition)) {
        this.setDesktopPosition(commitPosition);
      }
    }
    this.draggingState.set(false);
    this.snapPreviewState.set(null);
  }

  reset(): void {
    this.desktopPositionState.set('left');
    this.mobilePositionState.set('bottom');
    this.draggingState.set(false);
    this.snapPreviewState.set(null);
    this.saveToStorage(DESKTOP_DOCK_STORAGE_KEY, 'left');
    this.saveToStorage(MOBILE_DOCK_STORAGE_KEY, 'bottom');
  }

  private loadDesktopPosition(): DockPosition {
    const saved = this.readFromStorage(DESKTOP_DOCK_STORAGE_KEY);
    return isValidDockPosition(saved) ? saved : 'left';
  }

  private loadMobilePosition(): MobileDockPosition {
    const saved = this.readFromStorage(MOBILE_DOCK_STORAGE_KEY);
    return isValidMobileDockPosition(saved) ? saved : 'bottom';
  }

  private readFromStorage(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage quota or private browsing errors
    }
  }
}
