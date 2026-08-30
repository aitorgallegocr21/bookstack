import {
  Component,
  inject,
  input,
  output,
  effect,
  signal,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReadingLog } from '../../models/book.model';
import { ReadingLogService } from '../../services/reading-log.service';

@Component({
  selector: 'app-reading-log-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reading-log-editor.html',
  styleUrl: './reading-log-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReadingLogEditorComponent {
  private readonly readingLogService = inject(ReadingLogService);

  readonly bookId = input.required<string>();
  readonly existingLog = input<ReadingLog | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<ReadingLog>();

  protected draft: ReadingLog = this.emptyLog();
  protected readonly isSaving = signal(false);
  protected readonly isClosing = signal(false);

  constructor() {
    effect(() => {
      const selected = this.existingLog();
      const currentBookId = this.bookId();

      if (selected) {
        this.draft = { ...selected };
      } else {
        this.draft = this.emptyLog(currentBookId);
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscape(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  protected async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const now = new Date().toISOString();

    const normalized: ReadingLog = {
      ...this.draft,
      bookId: this.bookId() || this.draft.bookId,
      pagesRead: Number(this.draft.pagesRead) || 0,
      timeSpentMinutes: Number(this.draft.timeSpentMinutes) || 0,
      date: this.draft.date || this.getTodayLocalDate(),
      createdAt: this.draft.createdAt || now
    };

    try {
      if (!normalized.id) {
        normalized.id = crypto.randomUUID();
        normalized.createdAt = now;
        await this.readingLogService.add(normalized);
      } else {
        await this.readingLogService.update(normalized.id, normalized);
      }

      this.saved.emit(normalized);
      this.closed.emit();
    } catch (error) {
      console.error('Error guardando la sesión de lectura:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    window.setTimeout(() => this.closed.emit(), 180);
  }

  private emptyLog(bookId: string = ''): ReadingLog {
    return {
      id: '',
      bookId,
      date: this.getTodayLocalDate(),
      pagesRead: 0,
      timeSpentMinutes: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };
  }

  private getTodayLocalDate(): string {
    return new Date().toLocaleDateString('sv');
  }
}
