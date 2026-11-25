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
    expect(nav?.getAttribute('style')).toContain('env(safe-area-inset-bottom)');

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
    expect(nav?.getAttribute('style')).toContain('env(safe-area-inset-top)');

    // Reopen in top mode -> popover opens downward
    menuTrigger.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')?.classList.contains('dock-popover-top')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });

  it('should render exterior grip tab and symmetric 6-control icon row', () => {
    const dockPosition = TestBed.inject(DockPositionService);
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const shell = root.querySelector('[data-testid="mobile-dock-shell"]') as HTMLElement;
    const dragHandle = root.querySelector('[data-testid="dock-drag-handle"]') as HTMLButtonElement;
    const iconRow = root.querySelector('[data-testid="mobile-dock-row"]') as HTMLElement;

    expect(shell).not.toBeNull();
    expect(dragHandle).not.toBeNull();
    expect(iconRow).not.toBeNull();

    // Drag handle sits outside the horizontal 6-control row and is positioned on the exterior lip
    expect(iconRow.contains(dragHandle)).toBe(false);
    expect(shell.classList.contains('relative')).toBe(true);
    expect(shell.classList.contains('flex-col')).toBe(false);
    expect(shell.classList.contains('flex-col-reverse')).toBe(false);

    // Exterior grip tab (h-4 w-11) with LucideGripHorizontal SVG icon attached to top lip when bottom-docked
    expect(dragHandle.classList.contains('h-4')).toBe(true);
    expect(dragHandle.classList.contains('w-11')).toBe(true);
    expect(dragHandle.classList.contains('bottom-full')).toBe(true);
    expect(dragHandle.classList.contains('rounded-t-lg')).toBe(true);
    expect(dragHandle.classList.contains('border-b-0')).toBe(true);
    expect(dragHandle.classList.contains('top-full')).toBe(false);
    expect(dragHandle.querySelector('svg')).not.toBeNull();

    // Strictly 6 balanced interactive controls in the icon row
    const controls = Array.from(iconRow.children) as HTMLElement[];
    expect(controls.length).toBe(6);
    expect(controls[0].getAttribute('href')).toBe('/');
    expect(controls[5].getAttribute('aria-label')).toBe('Más opciones de navegación');
    for (const control of controls) {
      expect(control.classList.contains('min-h-[44px]')).toBe(true);
      expect(control.classList.contains('min-w-[44px]')).toBe(true);
    }

    // Switching dock to top flips exterior grip tab to bottom lip
    dockPosition.setMobilePosition('top');
    fixture.detectChanges();
    expect(dragHandle.classList.contains('top-full')).toBe(true);
    expect(dragHandle.classList.contains('rounded-b-lg')).toBe(true);
    expect(dragHandle.classList.contains('border-t-0')).toBe(true);
    expect(dragHandle.classList.contains('bottom-full')).toBe(false);
  });

  it('should close overflow menu when clicking any primary dock navigation link', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const moreBtn = root.querySelector(
      'button[aria-label="Más opciones de navegación"]'
    ) as HTMLButtonElement;
    const routeHrefs = ['/', '/books', '/stats', '/settings'];

    for (const href of routeHrefs) {
      moreBtn.click();
      fixture.detectChanges();
      expect(root.querySelector('[role="menu"]')).not.toBeNull();

      const link = root.querySelector(
        `[data-testid="mobile-dock-row"] a[href="${href}"]`
      ) as HTMLAnchorElement;
      expect(link).not.toBeNull();
      link.click();
      fixture.detectChanges();
      expect(root.querySelector('[role="menu"]')).toBeNull();
    }
  });
});
