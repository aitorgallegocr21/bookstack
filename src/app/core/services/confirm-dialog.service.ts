import { Injectable, inject, signal } from '@angular/core';
import {
  ConfirmDialogOptions,
  ConfirmDialogState,
  ConfirmSuppressionKey,
} from '../models/confirm-dialog.model';
import { StorageAdapterService } from './storage-adapter.service';
import { UiStateService } from './ui-state.service';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly storage = inject(StorageAdapterService);
  private readonly uiState = inject(UiStateService);

  readonly activeDialog = signal<ConfirmDialogState | null>(null);
  readonly dontAskAgainChecked = signal<boolean>(false);
  private readonly _suppressedKeys = signal<ConfirmSuppressionKey[]>(
    this.storage.getSuppressedConfirms()
  );
  readonly suppressedKeys = this._suppressedKeys.asReadonly();

  private pendingResolver: ((confirmed: boolean) => void) | null = null;
  private nextDialogId = 1;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    if (options.suppressibleKey && this.storage.isConfirmSuppressed(options.suppressibleKey)) {
      return Promise.resolve(true);
    }

    if (this.pendingResolver !== null) {
      this.resolveActive(false);
    }

    this.dontAskAgainChecked.set(false);
    this.uiState.acquireScrollLock();
    this.activeDialog.set({
      id: this.nextDialogId++,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      severity: options.severity ?? 'danger',
      entityPreview: options.entityPreview,
      suppressibleKey: options.suppressibleKey,
      suppressCheckboxLabel: options.suppressCheckboxLabel,
    });

    return new Promise<boolean>((resolve) => {
      this.pendingResolver = resolve;
    });
  }

  setDontAskAgain(checked: boolean): void {
    this.dontAskAgainChecked.set(checked);
  }

  accept(): void {
    const current = this.activeDialog();
    if (!current) {
      return;
    }

    if (this.dontAskAgainChecked() && current.suppressibleKey) {
      this.storage.setConfirmSuppressed(current.suppressibleKey, true);
      this._suppressedKeys.set(this.storage.getSuppressedConfirms());
    }

    this.resolveActive(true);
  }

  cancel(): void {
    if (!this.activeDialog()) {
      return;
    }

    this.resolveActive(false);
  }

  isSuppressed(key: ConfirmSuppressionKey): boolean {
    return this._suppressedKeys().includes(key);
  }

  setSuppressed(key: ConfirmSuppressionKey, suppressed: boolean): void {
    this.storage.setConfirmSuppressed(key, suppressed);
    this._suppressedKeys.set(this.storage.getSuppressedConfirms());
  }

  resetSuppressed(): void {
    this.storage.resetSuppressedConfirms();
    this._suppressedKeys.set([]);
  }

  private resolveActive(confirmed: boolean): void {
    const resolve = this.pendingResolver;
    this.pendingResolver = null;
    this.activeDialog.set(null);
    this.dontAskAgainChecked.set(false);
    this.uiState.releaseScrollLock();
    resolve?.(confirmed);
  }
}
