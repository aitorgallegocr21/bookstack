import { TestBed } from '@angular/core/testing';
import {
  DESKTOP_DOCK_STORAGE_KEY,
  DockPositionService,
  MOBILE_DOCK_STORAGE_KEY,
} from './dock-position.service';

describe('DockPositionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to left on desktop and bottom on mobile', () => {
    const service = TestBed.inject(DockPositionService);

    expect(service.desktopPosition()).toBe('left');
    expect(service.mobilePosition()).toBe('bottom');
    expect(service.isDesktopVertical()).toBe(true);
    expect(service.isDesktopHorizontal()).toBe(false);
  });

  it('restores persisted positions and falls back on invalid values', () => {
    localStorage.setItem(DESKTOP_DOCK_STORAGE_KEY, 'top');
    localStorage.setItem(MOBILE_DOCK_STORAGE_KEY, 'invalid');

    const service = TestBed.inject(DockPositionService);

    expect(service.desktopPosition()).toBe('top');
    expect(service.mobilePosition()).toBe('bottom');
    expect(service.isDesktopVertical()).toBe(false);
    expect(service.isDesktopHorizontal()).toBe(true);
  });

  it('persists desktop and mobile position updates and toggles mobile edge', () => {
    const service = TestBed.inject(DockPositionService);

    service.setDesktopPosition('right');
    expect(service.desktopPosition()).toBe('right');
    expect(localStorage.getItem(DESKTOP_DOCK_STORAGE_KEY)).toBe('right');

    service.toggleMobilePosition();
    expect(service.mobilePosition()).toBe('top');
    expect(localStorage.getItem(MOBILE_DOCK_STORAGE_KEY)).toBe('top');

    service.toggleMobilePosition();
    expect(service.mobilePosition()).toBe('bottom');
    expect(localStorage.getItem(MOBILE_DOCK_STORAGE_KEY)).toBe('bottom');
  });

  it('manages drag preview lifecycle and commits valid positions on endDrag', () => {
    const service = TestBed.inject(DockPositionService);

    service.startDrag('left');
    expect(service.isDragging()).toBe(true);
    expect(service.snapPreviewPosition()).toBe('left');

    service.updateDragPreview('bottom');
    expect(service.snapPreviewPosition()).toBe('bottom');

    service.endDrag('bottom', false);
    expect(service.isDragging()).toBe(false);
    expect(service.snapPreviewPosition()).toBeNull();
    expect(service.desktopPosition()).toBe('bottom');

    // Mobile drag ignores non-vertical edges like 'left'
    service.startDrag('bottom');
    service.endDrag('left', true);
    expect(service.mobilePosition()).toBe('bottom');

    service.startDrag('bottom');
    service.endDrag('top', true);
    expect(service.mobilePosition()).toBe('top');
  });

  it('resets dock positions and drag state to defaults', () => {
    const service = TestBed.inject(DockPositionService);
    service.setDesktopPosition('top');
    service.setMobilePosition('top');
    service.startDrag('right');

    service.reset();

    expect(service.desktopPosition()).toBe('left');
    expect(service.mobilePosition()).toBe('bottom');
    expect(service.isDragging()).toBe(false);
    expect(service.snapPreviewPosition()).toBeNull();
    expect(localStorage.getItem(DESKTOP_DOCK_STORAGE_KEY)).toBe('left');
    expect(localStorage.getItem(MOBILE_DOCK_STORAGE_KEY)).toBe('bottom');
  });
});
