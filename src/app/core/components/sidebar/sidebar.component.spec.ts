import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BooksService } from '../../../features/books/services/books.service';
import { ThemeService } from '../../services/theme.service';
import { UiStateService } from '../../services/ui-state.service';
import { SidebarComponent } from './sidebar.component';

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

  it('should toggle collapse state and update aside width', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const uiState = TestBed.inject(UiStateService);
    fixture.detectChanges();

    const aside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    expect(aside?.style.width).toBe('240px');

    const collapseBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Contraer barra lateral"]'
    ) as HTMLButtonElement | null;
    expect(collapseBtn).not.toBeNull();

    collapseBtn?.click();
    fixture.detectChanges();

    expect(uiState.isSidebarCollapsed()).toBe(true);
    expect(aside?.style.width).toBe('68px');
  });

  it('should match root "/" strictly and trigger create modal & theme toggle', async () => {
    const router = TestBed.inject(Router);
    const booksService = TestBed.inject(BooksService);
    const themeService = TestBed.inject(ThemeService);

    const fixture = TestBed.createComponent(SidebarComponent);
    await router.navigateByUrl('/books');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const homeLink = root.querySelector('a[href="/"]');
    const booksLink = root.querySelector('a[href="/books"]');
    expect(homeLink?.classList.contains('font-semibold')).toBe(false);
    expect(booksLink?.classList.contains('font-semibold')).toBe(true);

    const createBtn = root.querySelector(
      'button[aria-label="Crear nuevo libro"]'
    ) as HTMLButtonElement | null;
    createBtn?.click();
    expect(booksService.isCreateModalOpen()).toBe(true);

    const initialDark = themeService.isDark();
    const themeBtn = root.querySelector(
      'aside > div:last-child button:last-child'
    ) as HTMLButtonElement;
    themeBtn.click();
    expect(themeService.isDark()).toBe(!initialDark);
  });
});
