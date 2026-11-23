import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let service: ConfirmDialogService;

  beforeEach(async () => {
    localStorage.clear();
    document.body.classList.remove('overflow-hidden');

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    service = TestBed.inject(ConfirmDialogService);
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    localStorage.clear();
  });

  it('does not render alertdialog when no dialog is active', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('renders accessible dialog with entity preview and suppression checkbox', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const confirmPromise = service.confirm({
      title: 'Eliminar sesión',
      message: 'Se eliminará esta sesión de lectura.',
      severity: 'warning',
      entityPreview: {
        title: 'Dune',
        subtitle: 'Frank Herbert',
        badge: '45 páginas',
        coverUrl: 'data:image/png;base64,iVBORw0KGgo=',
      },
      suppressibleKey: 'deleteReadingLog',
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('[role="alertdialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    expect(dialog?.getAttribute('aria-describedby')).toBe('confirm-dialog-message');
    expect(root.textContent).toContain('Dune');
    expect(root.textContent).toContain('Frank Herbert');
    expect(root.textContent).toContain('45 páginas');

    const img = root.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');

    const checkbox = root.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    checkbox.click();
    fixture.detectChanges();
    expect(service.dontAskAgainChecked()).toBe(true);

    const buttons = root.querySelectorAll('button');
    const confirmBtn = buttons[1] as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    await expect(confirmPromise).resolves.toBe(true);
    expect(service.isSuppressed('deleteReadingLog')).toBe(true);
    expect(root.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('focuses cancel button for danger severity and confirm button for info severity', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const dangerPromise = service.confirm({
      title: 'Danger',
      message: 'Delete permanently?',
      severity: 'danger',
    });
    fixture.detectChanges();
    await Promise.resolve();

    const root = fixture.nativeElement as HTMLElement;
    const dangerButtons = root.querySelectorAll('button');
    expect(document.activeElement).toBe(dangerButtons[0]);

    service.cancel();
    await expect(dangerPromise).resolves.toBe(false);

    const infoPromise = service.confirm({
      title: 'Info',
      message: 'Proceed?',
      severity: 'info',
    });
    fixture.detectChanges();
    await Promise.resolve();

    const infoButtons = root.querySelectorAll('button');
    expect(document.activeElement).toBe(infoButtons[1]);

    service.accept();
    await expect(infoPromise).resolves.toBe(true);
  });

  it('cancels on Escape key and stops propagation, and cancels on backdrop click', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const parentSpy = vi.fn();
    document.addEventListener('keydown', parentSpy);

    try {
      const firstPromise = service.confirm({
        title: 'Confirm',
        message: 'Escape test',
      });
      fixture.detectChanges();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      await expect(firstPromise).resolves.toBe(false);
      expect(escapeEvent.defaultPrevented).toBe(true);
      expect(parentSpy).not.toHaveBeenCalled();

      const secondPromise = service.confirm({
        title: 'Confirm 2',
        message: 'Backdrop test',
      });
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const backdrop = root.querySelector('.modal-backdrop') as HTMLElement;
      backdrop.click();
      fixture.detectChanges();

      await expect(secondPromise).resolves.toBe(false);
    } finally {
      document.removeEventListener('keydown', parentSpy);
    }
  });
});
