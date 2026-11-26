import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';
import { StorageAdapterService } from './storage-adapter.service';
import { UiStateService } from './ui-state.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let storage: StorageAdapterService;
  let uiState: UiStateService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('overflow-hidden');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialogService);
    storage = TestBed.inject(StorageAdapterService);
    uiState = TestBed.inject(UiStateService);
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    localStorage.clear();
  });

  it('opens with default danger severity, acquires scroll lock, and resolves true on accept()', async () => {
    const promise = service.confirm({
      title: 'Delete book',
      message: 'This action cannot be undone.',
    });

    expect(service.activeDialog()).toMatchObject({
      title: 'Delete book',
      message: 'This action cannot be undone.',
      severity: 'danger',
    });
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    service.accept();

    await expect(promise).resolves.toBe(true);
    expect(service.activeDialog()).toBeNull();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('resolves false on cancel() and releases scroll lock', async () => {
    const promise = service.confirm({
      title: 'Unlink book',
      message: 'Remove from series?',
      severity: 'warning',
    });

    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    service.cancel();

    await expect(promise).resolves.toBe(false);
    expect(service.activeDialog()).toBeNull();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('resolves previous pending dialog with false when a new confirm() supersedes it', async () => {
    const firstPromise = service.confirm({
      title: 'First',
      message: 'First dialog',
    });
    const secondPromise = service.confirm({
      title: 'Second',
      message: 'Second dialog',
      severity: 'info',
    });

    await expect(firstPromise).resolves.toBe(false);
    expect(service.activeDialog()?.title).toBe('Second');
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    service.accept();
    await expect(secondPromise).resolves.toBe(true);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('persists suppressibleKey only when accepted with dontAskAgainChecked and auto-resolves future calls', async () => {
    const cancelledPromise = service.confirm({
      title: 'Delete log',
      message: 'Delete this reading log?',
      suppressibleKey: 'deleteReadingLog',
    });
    service.setDontAskAgain(true);
    service.cancel();
    await expect(cancelledPromise).resolves.toBe(false);
    expect(service.isSuppressed('deleteReadingLog')).toBe(false);

    const acceptedPromise = service.confirm({
      title: 'Delete log',
      message: 'Delete this reading log?',
      suppressibleKey: 'deleteReadingLog',
    });
    service.setDontAskAgain(true);
    service.accept();
    await expect(acceptedPromise).resolves.toBe(true);
    expect(service.isSuppressed('deleteReadingLog')).toBe(true);

    const autoResolvedPromise = service.confirm({
      title: 'Delete log again',
      message: 'Should skip modal',
      suppressibleKey: 'deleteReadingLog',
    });
    expect(service.activeDialog()).toBeNull();
    await expect(autoResolvedPromise).resolves.toBe(true);

    service.resetSuppressed();
    expect(service.isSuppressed('deleteReadingLog')).toBe(false);
  });

  it('filters invalid suppression keys from localStorage at runtime', () => {
    localStorage.setItem(
      storage.suppressedConfirmsKey,
      JSON.stringify(['deleteReadingLog', 'unknownKey', 123, 'deleteReadingLog'])
    );

    expect(storage.getSuppressedConfirms()).toEqual(['deleteReadingLog']);
    expect(storage.isConfirmSuppressed('deleteReadingLog')).toBe(true);
    expect(storage.isConfirmSuppressed('unlinkSagaBook')).toBe(false);

    storage.setConfirmSuppressed('deleteReadingLog', false);
    expect(localStorage.getItem(storage.suppressedConfirmsKey)).toBeNull();
    expect(uiState).toBeTruthy();
  });

  it('updates suppressedKeys signal via setSuppressed and resetSuppressed', () => {
    expect(service.suppressedKeys()).toEqual([]);

    service.setSuppressed('unlinkSagaBook', true);
    expect(service.isSuppressed('unlinkSagaBook')).toBe(true);
    expect(service.suppressedKeys()).toEqual(['unlinkSagaBook']);

    service.setSuppressed('unlinkSagaBook', false);
    expect(service.isSuppressed('unlinkSagaBook')).toBe(false);
    expect(service.suppressedKeys()).toEqual([]);
  });
});
