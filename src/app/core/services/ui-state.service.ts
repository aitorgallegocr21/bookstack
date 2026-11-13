import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { StorageAdapterService } from './storage-adapter.service';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  private readonly storage = inject(StorageAdapterService);
  private readonly document = inject(DOCUMENT);
  private readonly STORAGE_KEY = 'bookstack_sidebar_collapsed';
  private scrollLockCount = 0;

  // Expanded by default on desktop/tablet unless a saved preference exists
  readonly isSidebarCollapsed = signal<boolean>(this.getInitialValue());
  readonly isCreateModalOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.storage.setItem(this.STORAGE_KEY, this.isSidebarCollapsed());
    });
  }

  private getInitialValue(): boolean {
    const stored = this.storage.getItem<unknown>(this.STORAGE_KEY);
    return typeof stored === 'boolean' ? stored : false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  acquireScrollLock(): void {
    this.scrollLockCount += 1;
    if (this.scrollLockCount === 1) {
      this.document.body?.classList.add('overflow-hidden');
    }
  }

  releaseScrollLock(): void {
    if (this.scrollLockCount > 0) {
      this.scrollLockCount -= 1;
    }
    if (this.scrollLockCount === 0) {
      this.document.body?.classList.remove('overflow-hidden');
    }
  }
}
