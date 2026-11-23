import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBookOpen,
  LucideChevronDown,
  LucideChevronUp,
  LucideClock,
  LucideLayers,
  LucideLink2,
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideStar,
  LucideUnlink,
  LucideX,
  LucideDynamicIcon,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { getStatusBadgeClass } from '../../../../shared/utils/book-display.utils';
import { Book, BookStatus } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { SagaAggregation, SeriesPublicationStatus } from '../../models/series.model';
import { SeriesService } from '../../services/series.service';

@Component({
  selector: 'app-saga-detail-modal',
  standalone: true,
  imports: [FormsModule, LucideDynamicIcon],
  templateUrl: './saga-detail-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()',
  },
})
export class SagaDetailModalComponent implements OnDestroy {
  private readonly uiState = inject(UiStateService);
  private readonly seriesService = inject(SeriesService);
  private readonly booksService = inject(BooksService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  protected readonly i18n = inject(I18nService);

  readonly saga = input.required<SagaAggregation>();
  readonly closed = output<void>();
  readonly openBook = output<string>();
  readonly addMissingVolume = output<{ seriesName: string; volumeNumber: number }>();

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly X = LucideX;
  protected readonly Pencil = LucidePencil;
  protected readonly Plus = LucidePlus;
  protected readonly Unlink = LucideUnlink;
  protected readonly Link2 = LucideLink2;
  protected readonly Search = LucideSearch;
  protected readonly BookOpen = LucideBookOpen;
  protected readonly Star = LucideStar;
  protected readonly Clock = LucideClock;
  protected readonly Layers = LucideLayers;
  protected readonly ChevronDown = LucideChevronDown;
  protected readonly ChevronUp = LucideChevronUp;

  protected readonly showMetadataEditor = signal<boolean>(false);
  protected readonly showBulkLinker = signal<boolean>(false);
  protected readonly bulkLinkerQuery = signal<string>('');
  protected readonly isSavingMetadata = signal<boolean>(false);

  protected readonly editName = signal<string>('');
  protected readonly editExpectedVolumes = signal<string | number | null>('');
  protected readonly editPublicationStatus = signal<SeriesPublicationStatus | ''>('');
  protected readonly editNotes = signal<string>('');

  private lastSyncedKey: string | null = null;

  constructor() {
    this.uiState.acquireScrollLock();

    queueMicrotask(() => {
      this.closeButton()?.nativeElement.focus();
    });

    effect(() => {
      const currentSaga = this.saga();
      const syncSignature = `${currentSaga.id}|${currentSaga.name}|${currentSaga.expectedVolumes ?? ''}|${currentSaga.metadata?.publicationStatus ?? ''}|${currentSaga.metadata?.notes ?? ''}`;
      if (this.lastSyncedKey !== syncSignature) {
        this.lastSyncedKey = syncSignature;
        this.editName.set(currentSaga.name);
        this.editExpectedVolumes.set(
          currentSaga.expectedVolumes !== undefined ? String(currentSaga.expectedVolumes) : ''
        );
        this.editPublicationStatus.set(currentSaga.metadata?.publicationStatus ?? '');
        this.editNotes.set(currentSaga.metadata?.notes ?? '');
      }
    });
  }

  ngOnDestroy(): void {
    this.uiState.releaseScrollLock();
  }

  protected readonly formattedHours = computed<string>(() => {
    const minutes = this.saga().totalReadingMinutes;
    if (minutes <= 0) {
      return '0h';
    }
    const hours = minutes / 60;
    return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
  });

  protected readonly linkableBooks = computed<Book[]>(() => {
    const query = this.bulkLinkerQuery().trim().toLowerCase();
    const standalone = this.booksService.books().filter((book) => !book.series?.name?.trim());

    if (!query) {
      return standalone;
    }

    return standalone.filter(
      (book) =>
        book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
    );
  });

  protected handleEscape(): void {
    if (this.confirmDialogService.activeDialog() !== null) {
      return;
    }
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected toggleMetadataEditor(): void {
    this.showMetadataEditor.update((v) => !v);
  }

  protected toggleBulkLinker(): void {
    this.showBulkLinker.update((v) => !v);
  }

  protected async saveMetadata(): Promise<void> {
    const trimmedName = this.editName().trim();
    if (!trimmedName || this.isSavingMetadata()) {
      return;
    }

    const rawExpected = String(this.editExpectedVolumes() ?? '').trim();
    const parsedExpected = rawExpected ? Number(rawExpected) : null;
    const expectedVolumes =
      parsedExpected !== null && Number.isInteger(parsedExpected) && parsedExpected > 0
        ? parsedExpected
        : null;

    const statusVal = this.editPublicationStatus();
    const publicationStatus = statusVal ? statusVal : null;
    const notesVal = this.editNotes().trim();

    this.isSavingMetadata.set(true);
    try {
      const current = this.saga();
      await this.seriesService.upsertSeriesMetadata({
        id: current.id,
        normalizedKey: current.normalizedKey,
        name: trimmedName,
        expectedVolumes,
        publicationStatus,
        notes: notesVal || null,
      });
      this.showMetadataEditor.set(false);
    } finally {
      this.isSavingMetadata.set(false);
    }
  }

  protected async onVolumeNumberCommit(bookId: string, rawValue: string): Promise<void> {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      await this.seriesService.updateBookVolumeNumber(bookId, null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isInteger(parsed) && parsed > 0) {
      await this.seriesService.updateBookVolumeNumber(bookId, parsed);
    }
  }

  protected async unlinkBook(bookId: string): Promise<void> {
    const book = this.booksService.books().find((b) => b.id === bookId);
    const t = this.i18n.t();
    const confirmed = await this.confirmDialogService.confirm({
      title: t.series.detail.confirmUnlinkTitle,
      message: t.series.detail.confirmUnlinkMessage,
      confirmLabel: t.series.detail.confirmUnlinkAction,
      cancelLabel: t.confirmDialog.cancel,
      severity: 'warning',
      suppressibleKey: 'unlinkSagaBook',
      suppressCheckboxLabel: t.confirmDialog.dontAskAgainMinor,
      entityPreview: book
        ? {
            title: book.title,
            subtitle: book.author,
            badge: book.series?.volumeNumber != null ? `#${book.series.volumeNumber}` : undefined,
            coverUrl: book.coverUrl,
          }
        : undefined,
    });
    if (!confirmed) {
      return;
    }

    await this.seriesService.unlinkBookFromSeries(bookId);
  }

  protected async linkStandaloneBook(bookId: string): Promise<void> {
    await this.seriesService.linkBooksToSeries(this.saga().name, [bookId]);
  }

  protected onAddMissingVolume(volumeNumber: number): void {
    this.addMissingVolume.emit({
      seriesName: this.saga().name,
      volumeNumber,
    });
  }

  protected getPublicationStatusLabel(status: SeriesPublicationStatus): string {
    return this.i18n.t().series.publicationStatus[status];
  }

  protected getPublicationStatusBadgeClass(status: SeriesPublicationStatus): string {
    switch (status) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'hiatus':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300';
      case 'ongoing':
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300';
    }
  }

  protected getBookStatusLabel(status: BookStatus): string {
    return this.i18n.t().status[status];
  }

  protected readonly getBookStatusClass = getStatusBadgeClass;
}
