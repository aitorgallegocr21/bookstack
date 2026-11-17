import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideDynamicIcon,
  LucideLibrary,
  LucidePlus,
  LucideRotateCcw,
  LucideSearch,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookDetailModalComponent } from '../../../books/components/book-detail-modal/book-detail-modal';
import { BookEditModalComponent } from '../../../books/components/book-edit-modal/book-edit-modal';
import { ReadingLogEditorComponent } from '../../../books/components/reading-log-editor/reading-log-editor';
import { Book } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { SagaBentoCardComponent } from '../../components/saga-bento-card/saga-bento-card.component';
import { SeriesToolbarComponent } from '../../components/series-toolbar/series-toolbar.component';
import { SagaAggregation } from '../../models/series.model';
import { SeriesService } from '../../services/series.service';

@Component({
  selector: 'app-series-page',
  standalone: true,
  imports: [
    RouterLink,
    LucideDynamicIcon,
    SeriesToolbarComponent,
    SagaBentoCardComponent,
    BookDetailModalComponent,
    BookEditModalComponent,
    ReadingLogEditorComponent,
  ],
  templateUrl: './series-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesPage {
  protected readonly seriesService = inject(SeriesService);
  protected readonly booksService = inject(BooksService);
  protected readonly i18n = inject(I18nService);

  protected readonly Library = LucideLibrary;
  protected readonly Plus = LucidePlus;
  protected readonly Search = LucideSearch;
  protected readonly RotateCcw = LucideRotateCcw;

  protected readonly sagas = this.seriesService.sagas;
  protected readonly filteredSagas = this.seriesService.filteredSagas;

  protected readonly selectedSagaForDetail = signal<SagaAggregation | null>(null);
  protected readonly selectedBookForDetailId = signal<string | null>(null);
  protected readonly selectedBookForEditId = signal<string | null>(null);

  protected readonly showReadingLogEditor = signal<boolean>(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);

  protected openSagaModal(saga: SagaAggregation): void {
    this.selectedSagaForDetail.set(saga);
  }

  protected openDetailModal(bookId: string): void {
    this.selectedBookForDetailId.set(bookId);
  }

  protected closeDetailModal(): void {
    this.selectedBookForDetailId.set(null);
  }

  protected openEditModal(bookId: string): void {
    this.selectedBookForEditId.set(bookId);
  }

  protected closeEditModal(): void {
    this.selectedBookForEditId.set(null);
  }

  protected handleEditRequestedFromDetail(bookId: string): void {
    this.closeDetailModal();
    this.openEditModal(bookId);
  }

  protected openReadingLogForBook(book: Book): void {
    this.readingLogBookId.set(book.id);
    this.showReadingLogEditor.set(true);
  }

  protected closeReadingLogEditor(): void {
    this.showReadingLogEditor.set(false);
    this.readingLogBookId.set(undefined);
  }

  protected handleAddMissingVolume(payload: { seriesName: string; volumeNumber: number }): void {
    this.booksService.openCreateModal({
      seriesName: payload.seriesName,
      seriesVolumeNumber: payload.volumeNumber,
    });
  }

  protected openAddBookToSeries(): void {
    this.booksService.openCreateModal();
  }
}
