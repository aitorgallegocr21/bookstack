import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageAdapterService } from '../../features/books/services/storage-adapter.service';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private readonly storage = inject(StorageAdapterService);
  private readonly STORAGE_KEY = 'bookstack_sidebar_collapsed';

  // Por defecto expandido en desktop salvo preferencia guardada
  readonly isSidebarCollapsed = signal<boolean>(
    this.getInitialValue()
  );

  constructor() {
    effect(() => {
      this.storage.setItem(this.STORAGE_KEY, this.isSidebarCollapsed());
    });
  }

  private getInitialValue(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }
}
