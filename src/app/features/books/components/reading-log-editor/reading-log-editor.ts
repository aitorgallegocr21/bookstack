import { Component, inject, input, output, OnInit } from '@angular/core';
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
export class ReadingLogEditorComponent implements OnInit {
  private readonly readingLogService = inject(ReadingLogService);

  readonly bookId = input.required<string>();
  readonly existingLog = input<ReadingLog | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<ReadingLog>();

  protected draft: ReadingLog;

  constructor() {
    this.draft = {
      id: '',
      bookId: '',
      date: new Date().toISOString().slice(0, 10),
      pagesRead: 0,
      timeSpentMinutes: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };
  }

  ngOnInit(): void {
    const selected = this.existingLog();
    const requiredBookId = this.bookId();

    if (selected) {
      this.draft = { ...selected };
    } else {
      this.draft = this.emptyLog(requiredBookId);
      this.draft.bookId = requiredBookId;
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
    this.closed.emit();
  }

  protected cancel(): void {
    this.closed.emit();
  }

  private emptyLog(bookId: string = ''): ReadingLog {
    return {
      id: '',
      bookId,
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
