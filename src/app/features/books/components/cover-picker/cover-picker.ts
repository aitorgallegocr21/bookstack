import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { isSafeCoverUrl } from '../../schemas/book.schema';
import { ImageOptimizerService } from '../../services/image-optimizer.service';

@Component({
  selector: 'app-cover-picker',
  standalone: true,
  templateUrl: './cover-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block space-y-4',
  },
})
export class CoverPickerComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly imageOptimizerService = inject(ImageOptimizerService);

  readonly idPrefix = input<string>('book');
  readonly coverUrl = model<string>('');

  protected readonly coverMode = signal<'url' | 'upload'>('url');
  protected readonly coverFileName = signal<string>('');
  protected readonly isDraggingCover = signal<boolean>(false);
  protected readonly uploadError = signal<string>('');

  protected readonly displayedCover = computed<string>(() => {
    const trimmed = this.coverUrl().trim();
    if (!trimmed || !isSafeCoverUrl(trimmed)) {
      return '';
    }

    return trimmed;
  });

  protected readonly urlInputValue = computed<string>(() => {
    const current = this.coverUrl();
    return current.startsWith('data:image/') ? '' : current;
  });

  constructor() {
    effect(() => {
      if (!this.coverUrl()) {
        this.coverFileName.set('');
      }
    });
  }

  ngOnInit(): void {
    if (this.coverUrl().startsWith('data:image/')) {
      this.coverMode.set('upload');
    }
  }

  protected setCoverMode(mode: 'url' | 'upload'): void {
    this.coverMode.set(mode);
    this.uploadError.set('');
  }

  protected onUrlInput(value: string): void {
    this.coverFileName.set('');
    this.uploadError.set('');
    this.coverUrl.set(value);
  }

  protected async onCoverSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];

    if (!file) {
      return;
    }

    await this.processCoverFile(file);
    inputEl.value = '';
  }

  protected onCoverDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingCover.set(true);
  }

  protected onCoverDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingCover.set(false);
  }

  protected async onCoverDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDraggingCover.set(false);
    const file = event.dataTransfer?.files[0];

    if (file) {
      await this.processCoverFile(file);
    }
  }

  protected clearCover(): void {
    this.coverUrl.set('');
    this.coverFileName.set('');
    this.uploadError.set('');
  }

  private async processCoverFile(file: File): Promise<void> {
    this.uploadError.set('');
    this.coverFileName.set(file.name);

    try {
      const optimizedCover = await this.imageOptimizerService.optimize(file);
      this.coverUrl.set(optimizedCover);
      this.coverMode.set('upload');
    } catch (error) {
      console.error('[CoverPickerComponent] Failed to optimize cover image:', error);
      this.coverFileName.set('');
      this.uploadError.set(this.i18n.t().bookForm.cover.uploadError);
    }
  }
}
