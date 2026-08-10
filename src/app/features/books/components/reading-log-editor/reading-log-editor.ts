import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReadingLog } from '../../models/book.model';
import { ReadingLogService } from '../../services/reading-log.service';

@Component({
  selector: 'app-reading-log-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reading-log-editor.html',
  styleUrl: './reading-log-editor.css'
})
export class ReadingLogEditorComponent {
  private readonly readingLogService = inject(ReadingLogService);

  readonly bookId = input.required<string>();
  readonly existingLog = input<ReadingLog | undefined>(undefined);
  readonly close = output<void>();
  readonly saved = output<ReadingLog>();

  protected draft: ReadingLog;

  constructor() {
    this.draft = this.emptyLog();
  }

  protected ngOnInit(): void {
    const selected = this.existingLog();
    if (selected) {
      this.draft = { ...selected };
    } else {
      this.draft = this.emptyLog();
      this.draft.bookId = this.bookId();
    }
  }

  protected save(): void {
    const now = new Date().toISOString();
    const normalized: ReadingLog = {
      ...this.draft,
      bookId: this.bookId() || this.draft.bookId,
      pagesRead: Number(this.draft.pagesRead) || 0,
      timeSpentMinutes: Number(this.draft.timeSpentMinutes) || 0,
      date: this.draft.date || new Date().toISOString().slice(0, 10),
      createdAt: this.draft.createdAt || now
    };

    if (!normalized.id) {
      normalized.id = this.makeId();
      normalized.createdAt = now;
      this.readingLogService.add(normalized);
    } else {
      this.readingLogService.update(normalized.id, normalized);
    }

    this.saved.emit(normalized);
    this.close.emit();
  }

  protected cancel(): void {
    this.close.emit();
  }

  private emptyLog(): ReadingLog {
    return {
      id: '',
      bookId: this.bookId(),
      date: new Date().toISOString().slice(0, 10),
      pagesRead: 0,
      timeSpentMinutes: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };
  }

  private makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
