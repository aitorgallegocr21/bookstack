import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiStateService } from './ui-state.service';

const SIDEBAR_STORAGE_KEY = 'bookstack_sidebar_collapsed';

describe('UiStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('overflow-hidden');
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should default to expanded sidebar when localStorage is empty', () => {
    const service = TestBed.inject(UiStateService);
    expect(service.isSidebarCollapsed()).toBe(false);
  });

  it('should fall back safely when localStorage contains corrupted JSON (regression)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, '{not-valid-json');

    expect(() => TestBed.inject(UiStateService)).not.toThrow();
    const service = TestBed.inject(UiStateService);
    expect(service.isSidebarCollapsed()).toBe(false);
  });

  it('should restore saved boolean preference and persist toggles', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(true));

    const service = TestBed.inject(UiStateService);
    expect(service.isSidebarCollapsed()).toBe(true);

    service.toggleSidebar();
    TestBed.flushEffects();

    expect(service.isSidebarCollapsed()).toBe(false);
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false');
  });

  it('should reference-count body scroll locks for stacked modals (regression)', () => {
    const service = TestBed.inject(UiStateService);

    service.acquireScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    service.acquireScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    // Releasing the inner modal must keep scroll locked while the outer modal remains open.
    service.releaseScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    service.releaseScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);

    // Extra releases should remain idempotent and never go negative.
    service.releaseScrollLock();
    service.acquireScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    service.releaseScrollLock();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });
});
