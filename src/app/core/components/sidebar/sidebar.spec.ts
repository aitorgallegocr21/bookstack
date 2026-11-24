import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DockPositionService } from '../../services/dock-position.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import { SidebarComponent } from './sidebar';

@Component({ selector: 'app-dummy-route', standalone: true, template: '' })
class DummyRouteComponent {}

describe('SidebarComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyRouteComponent },
          { path: 'books', component: DummyRouteComponent },
          { path: 'series', component: DummyRouteComponent },
          { path: 'stats', component: DummyRouteComponent },
          { path: 'settings', component: DummyRouteComponent },
          { path: 'about', component: DummyRouteComponent },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should use hidden md:flex on host so tablet viewports remain supported (regression)', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.classList.contains('hidden')).toBe(true);
    expect(hostEl.classList.contains('md:flex')).toBe(true);
    expect(hostEl.classList.contains('lg:flex')).toBe(false);
  });

  it('should toggle collapse state and update aside width in left and right vertical modes', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const uiState = TestBed.inject(UiStateService);
    const dockPosition = TestBed.inject(DockPositionService);
    fixture.detectChanges();

    const aside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    expect(aside?.style.width).toBe('240px');
    expect(aside?.classList.contains('left-0')).toBe(true);

    const collapseBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Contraer barra lateral"]'
    ) as HTMLButtonElement | null;
    expect(collapseBtn).not.toBeNull();

    collapseBtn?.click();
    fixture.detectChanges();

    expect(uiState.isSidebarCollapsed()).toBe(true);
    expect(aside?.style.width).toBe('68px');

    dockPosition.setDesktopPosition('right');
    fixture.detectChanges();
    const rightAside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    expect(rightAside?.classList.contains('right-0')).toBe(true);
    expect(rightAside?.style.width).toBe('68px');
  });

  it('should match root "/" strictly and trigger create modal & theme toggle', async () => {
    const router = TestBed.inject(Router);
    const uiState = TestBed.inject(UiStateService);
    const themeService = TestBed.inject(ThemeService);

    const fixture = TestBed.createComponent(SidebarComponent);
    await router.navigateByUrl('/books');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const homeLink = root.querySelector('a[href="/"]');
    const booksLink = root.querySelector('a[href="/books"]');
    const seriesLink = root.querySelector('a[href="/series"]');
    expect(homeLink?.classList.contains('font-semibold')).toBe(false);
    expect(booksLink?.classList.contains('font-semibold')).toBe(true);
    expect(seriesLink).not.toBeNull();

    const createBtn = root.querySelector(
      'button[aria-label="Crear nuevo libro"]'
    ) as HTMLButtonElement | null;
    createBtn?.click();
    expect(uiState.isCreateModalOpen()).toBe(true);

    const initialDark = themeService.isDark();
    const themeBtn = root.querySelector(
      'button[aria-label="Cambiar a tema oscuro"]'
    ) as HTMLButtonElement;
    themeBtn.click();
    expect(themeService.isDark()).toBe(!initialDark);
  });

  it('should open quick-dock popover, switch to top/bottom horizontal mode, and close on Escape', async () => {
    const dockPosition = TestBed.inject(DockPositionService);
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const quickDockBtn = root.querySelector(
      'button[aria-label="Cambiar posición del dock"]'
    ) as HTMLButtonElement;
    expect(quickDockBtn).not.toBeNull();

    quickDockBtn.click();
    fixture.detectChanges();

    const menu = root.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();

    const topBtn = root.querySelector(
      'button[role="menuitemradio"]:nth-child(3)'
    ) as HTMLButtonElement;
    topBtn.click();
    fixture.detectChanges();

    expect(dockPosition.desktopPosition()).toBe('top');
    expect(root.querySelector('[role="menu"]')).toBeNull();

    const aside = root.querySelector('aside');
    expect(aside?.classList.contains('top-3')).toBe(true);
    expect(aside?.style.width).toBe('');

    // Reopen and close with Escape
    const horizontalQuickDockBtn = root.querySelector(
      'button[aria-label="Cambiar posición del dock"]'
    ) as HTMLButtonElement;
    horizontalQuickDockBtn.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });
});
