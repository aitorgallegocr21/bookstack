import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ConfirmDialogService } from './core/services/confirm-dialog.service';
import { DockPositionService } from './core/services/dock-position.service';
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

  it('should render the desktop dock, main outlet, and unified mobile dock without legacy header', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(root.querySelector('app-header')).toBeNull();
    expect(root.querySelector('main router-outlet')).not.toBeNull();
    expect(root.querySelector('app-bottom-nav')).not.toBeNull();
    expect(root.querySelectorAll('app-book-create-modal').length).toBe(0);
  });

  it('should update main offsets and snap preview overlay based on DockPositionService', async () => {
    const fixture = TestBed.createComponent(App);
    const dockPosition = TestBed.inject(DockPositionService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const main = root.querySelector('main') as HTMLElement;

    expect(main.className).toContain('md:ml-[var(--sidebar-width)]');
    expect(main.className).toContain('pb-24');

    dockPosition.setDesktopPosition('right');
    dockPosition.setMobilePosition('top');
    fixture.detectChanges();

    expect(main.className).toContain('md:mr-[var(--sidebar-width)]');
    expect(main.className).toContain('pt-24');

    dockPosition.setDesktopPosition('top');
    fixture.detectChanges();
    expect(main.className).toContain('md:pt-24');

    dockPosition.setDesktopPosition('bottom');
    fixture.detectChanges();
    expect(main.className).toContain('md:pb-24');

    dockPosition.startDrag('right');
    fixture.detectChanges();
    const preview = root.querySelector('[aria-hidden="true"].border-dashed');
    expect(preview).not.toBeNull();

    dockPosition.endDrag();
    fixture.detectChanges();
    expect(root.querySelector('[aria-hidden="true"].border-dashed')).toBeNull();
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

  it('should mount the global confirm dialog and open when ConfirmDialogService.confirm is called', async () => {
    const fixture = TestBed.createComponent(App);
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-confirm-dialog')).not.toBeNull();
    expect(root.querySelector('[role="alertdialog"]')).toBeNull();

    const confirmPromise = confirmDialogService.confirm({
      title: 'Confirmar acción',
      message: '¿Deseas continuar?',
    });
    fixture.detectChanges();

    expect(root.querySelector('[role="alertdialog"]')).not.toBeNull();
    confirmDialogService.cancel();
    fixture.detectChanges();

    await expect(confirmPromise).resolves.toBe(false);
    expect(root.querySelector('[role="alertdialog"]')).toBeNull();
  });
});
