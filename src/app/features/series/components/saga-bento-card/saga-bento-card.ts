import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  LucideAlertTriangle,
  LucideBookOpen,
  LucideCheckCircle2,
  LucideClock,
  LucideDynamicIcon,
  LucideLibrary,
  LucidePlay,
  LucidePlus,
  LucideStar,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BOOK_STATUS_CONFIG, Book } from '../../../books/models/book.model';
import { SagaAggregation, SeriesPublicationStatus } from '../../models/series.model';

@Component({
  selector: 'app-saga-bento-card',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './saga-bento-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class SagaBentoCardComponent {
  protected readonly i18n = inject(I18nService);

  readonly saga = input.required<SagaAggregation>();

  readonly openSaga = output<SagaAggregation>();
  readonly openBook = output<string>();
  readonly continueBook = output<Book>();
  readonly addMissingVolume = output<{ seriesName: string; volumeNumber: number }>();

  protected readonly BookOpen = LucideBookOpen;
  protected readonly Play = LucidePlay;
  protected readonly Plus = LucidePlus;
  protected readonly CheckCircle2 = LucideCheckCircle2;
  protected readonly AlertTriangle = LucideAlertTriangle;
  protected readonly Star = LucideStar;
  protected readonly Clock = LucideClock;
  protected readonly Library = LucideLibrary;

  protected readonly hostClasses = computed<string>(() => {
    const scale = this.saga().bentoScale;
    switch (scale) {
      case 'compact':
        return 'block min-w-0 md:col-span-6 lg:col-span-4';
      case 'medium':
        return 'block min-w-0 md:col-span-6 lg:col-span-8';
      case 'showcase':
        return 'block min-w-0 md:col-span-12 lg:col-span-8 md:row-span-2';
    }
  });

  protected readonly authorLabel = computed<string>(() => {
    const authors = this.saga().authors;
    if (authors.length === 0) {
      return '';
    }
    if (authors.length === 1) {
      return authors[0];
    }
    return `${authors[0]} +${authors.length - 1}`;
  });

  protected readonly volumePillLabel = computed<string>(() => {
    const s = this.saga();
    const t = this.i18n.t().series.card;
    if (s.expectedVolumes && s.expectedVolumes > 0) {
      return `${s.ownedCount} ${t.volumesOf} ${s.expectedVolumes} ${t.ownedVolumes}`;
    }
    return `${s.ownedCount} ${t.ownedVolumes}`;
  });

  protected readonly missingPillLabel = computed<string>(() => {
    const count = this.saga().missingVolumes.length;
    const t = this.i18n.t().series.card;
    return count === 1 ? `1 ${t.missingSingle}` : `${count} ${t.missingPlural}`;
  });

  protected readonly compactCovers = computed<Book[]>(() => {
    return this.saga().books.slice(0, 2);
  });

  protected readonly formattedReadingTime = computed<string>(() => {
    const minutes = this.saga().totalReadingMinutes;
    if (minutes <= 0) {
      return '0m';
    }
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours === 0) {
      return `${rem}m`;
    }
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  });

  protected readonly nextBookPercent = computed<number>(() => {
    const next = this.saga().nextBookToRead;
    if (!next || next.totalPages <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((Math.max(0, next.currentPage) / next.totalPages) * 100));
  });

  protected readonly nextBookCtaLabel = computed<string>(() => {
    const next = this.saga().nextBookToRead;
    if (!next) {
      return this.i18n.t().series.card.upToDate;
    }
    const t = this.i18n.t().series.card;
    const vol = next.series?.volumeNumber;
    const volSuffix = vol ? ` ${t.volumeShort} ${vol}` : '';

    if (next.status === 'reading') {
      const pct = this.nextBookPercent();
      return pct > 0
        ? `${t.continueReading}${volSuffix} · ${pct}%`
        : `${t.continueReading}${volSuffix}`;
    }

    return vol ? `${t.startVolume} ${vol}` : `${t.startVolume} ${next.title}`;
  });

  protected getStatusDotClass(book: Book): string {
    return BOOK_STATUS_CONFIG[book.status].dotClass;
  }

  protected getPublicationStatusLabel(status?: SeriesPublicationStatus): string | null {
    if (!status) {
      return null;
    }
    return this.i18n.t().series.publicationStatus[status];
  }

  protected onCardClick(): void {
    this.openSaga.emit(this.saga());
  }

  protected onCardKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openSaga.emit(this.saga());
    }
  }

  protected onBookClick(event: Event, bookId: string): void {
    event.stopPropagation();
    this.openBook.emit(bookId);
  }

  protected onContinueClick(event: Event, book: Book): void {
    event.stopPropagation();
    this.continueBook.emit(book);
  }

  protected onAddMissingClick(event: Event, volumeNumber: number): void {
    event.stopPropagation();
    this.addMissingVolume.emit({
      seriesName: this.saga().name,
      volumeNumber,
    });
  }
}
