import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';

@Component({ selector: 'app-dummy-bottom-route', standalone: true, template: '' })
class DummyBottomRouteComponent {}

describe('BottomNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyBottomRouteComponent },
          { path: 'books', component: DummyBottomRouteComponent },
          { path: 'stats', component: DummyBottomRouteComponent },
          { path: 'settings', component: DummyBottomRouteComponent },
          { path: 'about', component: DummyBottomRouteComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('should render mobile bottom navigation links with safe-area padding', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(BottomNavComponent);
    await router.navigateByUrl('/books');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const nav = root.querySelector('nav[role="navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.classList.contains('md:hidden')).toBe(true);
    expect(nav?.className).toContain('pb-[env(safe-area-inset-bottom)]');

    const links = root.querySelectorAll('nav a');
    expect(links.length).toBe(5);

    const homeLink = root.querySelector('a[href="/"]');
    const booksLink = root.querySelector('a[href="/books"]');
    expect(homeLink?.classList.contains('text-sky-600')).toBe(false);
    expect(booksLink?.classList.contains('text-sky-600')).toBe(true);
  });
});
