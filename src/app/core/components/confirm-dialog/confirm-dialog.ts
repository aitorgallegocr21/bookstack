import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
  },
})
export class ConfirmDialogComponent {
  protected readonly confirmDialogService = inject(ConfirmDialogService);
  protected readonly i18n = inject(I18nService);

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    effect(() => {
      const dialog = this.confirmDialogService.activeDialog();
      if (!dialog) {
        return;
      }

      queueMicrotask(() => {
        const target =
          dialog.severity === 'danger'
            ? this.cancelButton()?.nativeElement
            : this.confirmButton()?.nativeElement;
        target?.focus();
      });
    });
  }

  protected onEscape(event: Event): void {
    if (!this.confirmDialogService.activeDialog()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.confirmDialogService.cancel();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmDialogService.cancel();
    }
  }

  protected onDontAskAgainChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.confirmDialogService.setDontAskAgain(Boolean(target?.checked));
  }
}
