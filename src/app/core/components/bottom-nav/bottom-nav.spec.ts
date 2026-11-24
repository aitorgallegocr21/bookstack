import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DockPositionService } from '../../services/dock-position.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import { BottomNavComponent } from './bottom-nav';

@Component({ selector: 'app-dummy-bottom-route', standalone: true, template: '' })
class DummyBottomRouteComponent {}

describe('BottomNavComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyBottomRouteComponent },
          { path: 'books', component: DummyBottomRouteComponent },
          { path: 'series', component: DummyBottomRouteComponent },
          { path: 'stats', component: DummyBottomRouteComponent },
          { path: 'settings', component: DummyBottomRouteComponent },
          { path: 'about', component: DummyBottomRouteComponent },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render floating mobile dock with 44px touch targets and active route state', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(BottomNavComponent);
    await router.navigateByUrl('/books');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const nav = root.querySelector('nav[role="navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.classList.contains('md:hidden')).toBe(true);
    expect(nav?.className).toContain('env(safe-area-inset-bottom)');

    const links = root.querySelectorAll('nav a[routerLink]');
    expect(links.length).toBe(4);

    const homeLink = root.querySelector('a[href="/"]');
    const booksLink = root.querySelector('a[href="/books"]');
    expect(homeLink?.classList.contains('text-accent-soft-text')).toBe(false);
    expect(booksLink?.classList.contains('text-accent-soft-text')).toBe(true);
  });

  it('should open directional popover, toggle mobile edge top/bottom, and trigger create modal', async () => {
    const dockPosition = TestBed.inject(DockPositionService);
    const uiState = TestBed.inject(UiStateService);
    const themeService = TestBed.inject(ThemeService);

    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const createBtn = root.querySelector(
      'button[aria-label="Crear nuevo libro"]'
    ) as HTMLButtonElement;
    createBtn.click();
    expect(uiState.isCreateModalOpen()).toBe(true);

    const menuTrigger = root.querySelector(
      'button[aria-label="Más opciones de navegación"]'
    ) as HTMLButtonElement;
    menuTrigger.click();
    fixture.detectChanges();

    const menu = root.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();
    expect(menu?.classList.contains('dock-popover-bottom')).toBe(true);

    const initialDark = themeService.isDark();
    const menuItems = root.querySelectorAll('[role="menuitem"]');
    const themeBtn = menuItems[1] as HTMLButtonElement;
    themeBtn.click();
    expect(themeService.isDark()).toBe(!initialDark);

    const moveBtn = menuItems[4] as HTMLButtonElement;
    moveBtn.click();
    fixture.detectChanges();

    expect(dockPosition.mobilePosition()).toBe('top');
    expect(root.querySelector('[role="menu"]')).toBeNull();

    const nav = root.querySelector('nav[role="navigation"]');
    expect(nav?.className).toContain('env(safe-area-inset-top)');

    // Reopen in top mode -> popover opens downward
    menuTrigger.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')?.classList.contains('dock-popover-top')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });
});
