import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import {
  formatLocalizedDate,
  getCurrentLocalDateTime,
} from '../../../../core/utils/date-formatter';
import { ReadingLog } from '../../models/book.model';
import { ReadingLogService } from '../../services/reading-log.service';

@Component({
  selector: 'app-reading-log-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reading-log-editor.html',
  styleUrl: './reading-log-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape($event)',
  },
})
export class ReadingLogEditorComponent implements AfterViewInit, OnDestroy {
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);
  private readonly readingLogService = inject(ReadingLogService);

  readonly bookId = input.required<string>();
  readonly existingLog = input<ReadingLog | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<ReadingLog>();

  private readonly pagesReadInput = viewChild<ElementRef<HTMLInputElement>>('pagesReadInput');

  protected draft: ReadingLog = this.emptyLog();
  protected readonly isSaving = signal(false);
  protected readonly isClosing = signal(false);

  constructor() {
    this.uiState.acquireScrollLock();

    effect(() => {
      const selected = this.existingLog();
      const currentBookId = this.bookId();

      if (selected) {
        const dateWithTime =
          selected.date && !selected.date.includes('T') ? `${selected.date}T12:00` : selected.date;
        this.draft = { ...selected, date: dateWithTime };
      } else {
        this.draft = this.emptyLog(currentBookId);
      }
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.pagesReadInput()?.nativeElement.focus({ preventScroll: true }));
  }

  ngOnDestroy(): void {
    this.uiState.releaseScrollLock();
  }

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
      date: this.draft.date || getCurrentLocalDateTime(),
      createdAt: this.draft.createdAt || now,
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
      console.error('[ReadingLogEditor] Failed to save reading session:', error);
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

  protected formatDate(date?: string): string {
    return formatLocalizedDate(date, true, this.i18n.intlLocale());
  }

  private emptyLog(bookId = ''): ReadingLog {
    return {
      id: '',
      bookId,
      date: getCurrentLocalDateTime(),
      pagesRead: 0,
      timeSpentMinutes: 0,
      notes: '',
      createdAt: new Date().toISOString(),
    };
  }
}
