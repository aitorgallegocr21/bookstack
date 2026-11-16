import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { DataPortabilityService } from '../../services/data-portability.service';

export type DangerResetKind = 'sessions' | 'factory';

@Component({
  selector: 'app-danger-zone-section',
  standalone: true,
  templateUrl: './danger-zone-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey($event)',
  },
})
export class DangerZoneSectionComponent implements OnDestroy {
  private readonly dataPortabilityService = inject(DataPortabilityService);
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);

  readonly dataReset = output<void>();

  private readonly modalCancelButton =
    viewChild<ElementRef<HTMLButtonElement>>('modalCancelButton');
  private hasScrollLock = false;

  readonly activeModal = signal<DangerResetKind | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly backupDownloadedInModal = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const cancelBtn = this.modalCancelButton();
      if (cancelBtn) {
        cancelBtn.nativeElement.focus();
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseScrollLockIfHeld();
  }

  openModal(kind: DangerResetKind): void {
    this.activeModal.set(kind);
    this.backupDownloadedInModal.set(false);
    this.acquireScrollLockIfNeeded();
  }

  closeModal(): void {
    if (this.activeModal() === null || this.isProcessing()) {
      return;
    }
    this.activeModal.set(null);
    this.releaseScrollLockIfHeld();
  }

  onEscapeKey(event: Event): void {
    if (this.activeModal() === null || this.isProcessing()) {
      return;
    }
    event.preventDefault();
    this.closeModal();
  }

  downloadBackupBeforeReset(): void {
    this.dataPortabilityService.downloadJsonBackup();
    this.backupDownloadedInModal.set(true);
  }

  async confirmReset(): Promise<void> {
    const kind = this.activeModal();
    if (!kind || this.isProcessing()) {
      return;
    }

    this.isProcessing.set(true);
    try {
      if (kind === 'sessions') {
        await this.dataPortabilityService.clearReadingSessionsOnly();
        this.statusMessage.set(this.i18n.t().settings.dangerZone.clearLogsSuccess);
      } else {
        await this.dataPortabilityService.factoryResetAllData();
        this.statusMessage.set(this.i18n.t().settings.dangerZone.factoryResetSuccess);
      }

      this.activeModal.set(null);
      this.releaseScrollLockIfHeld();
      this.dataReset.emit();
    } finally {
      this.isProcessing.set(false);
    }
  }

  dismissStatus(): void {
    this.statusMessage.set(null);
  }

  private acquireScrollLockIfNeeded(): void {
    if (!this.hasScrollLock) {
      this.uiState.acquireScrollLock();
      this.hasScrollLock = true;
    }
  }

  private releaseScrollLockIfHeld(): void {
    if (this.hasScrollLock) {
      this.uiState.releaseScrollLock();
      this.hasScrollLock = false;
    }
  }
}
