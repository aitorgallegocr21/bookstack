import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { BooksService } from './features/books/services/books.service';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    localStorage.clear();
  });

  it('should create the root application shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the sidebar, header, main outlet, and bottom navigation', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(root.querySelector('app-header')).not.toBeNull();
    expect(root.querySelector('main router-outlet')).not.toBeNull();
    expect(root.querySelector('app-bottom-nav')).not.toBeNull();
    expect(root.querySelectorAll('app-book-create-modal').length).toBe(0);
  });

  it('should mount a single global create-book modal when opened', async () => {
    const fixture = TestBed.createComponent(App);
    const booksService = TestBed.inject(BooksService);
    fixture.detectChanges();
    await fixture.whenStable();

    booksService.openCreateModal();
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('app-book-create-modal').length).toBe(1);

    booksService.closeCreateModal();
    fixture.detectChanges();
    expect(root.querySelectorAll('app-book-create-modal').length).toBe(0);
  });
});
