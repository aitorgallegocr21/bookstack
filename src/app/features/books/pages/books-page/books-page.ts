import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideDynamicIcon, LucidePlus, LucideEye, LucideEdit2, LucideTrash2, LucideSun, LucideMoon } from '@lucide/angular';
import { BooksService } from '../../services/books.service';
import { ReadingStatsService } from '../../services/reading-stats.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { ThemeService } from '../../../../core/services/theme.service';
import {
  Book,
  BookStatus,
  ReadingLog,
  BOOK_STATUS_CONFIG,
  BOOK_STATUS_LABELS,
  BOOK_RATING_MAX
} from '../../models/book.model';
import { BookCreateModalComponent } from '../../components/book-create-modal/book-create-modal';
import { BookEditModalComponent } from '../../components/book-edit-modal/book-edit-modal';
import { BookDetailModalComponent } from '../../components/book-detail-modal/book-detail-modal';
import { ReadingLogEditorComponent } from '../../components/reading-log-editor/reading-log-editor';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideDynamicIcon,
    BookCreateModalComponent,
    BookEditModalComponent,
    BookDetailModalComponent,
    ReadingLogEditorComponent
],
  templateUrl: './books-page.html',
  styleUrl: './books-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksPage {
  private readonly booksService = inject(BooksService);
  private readonly readingStatsService = inject(ReadingStatsService);
  private readonly readingLogService = inject(ReadingLogService);
  protected readonly themeService = inject(ThemeService);

  // Exportar constantes de presentación y iconos para uso en templates
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;
  protected readonly BOOK_STATUS_LABELS = BOOK_STATUS_LABELS;
  protected readonly Plus = LucidePlus;
  protected readonly Eye = LucideEye;
  protected readonly Edit2 = LucideEdit2;
  protected readonly Trash2 = LucideTrash2;
  protected readonly Sun = LucideSun;
  protected readonly Moon = LucideMoon;

  protected readonly books = this.booksService.books;
  protected readonly readingLogs = this.readingLogService.readingLogs;
  protected readonly stats = this.readingStatsService.stats;

  // Signals para control de los 3 Modales Independientes
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly selectedBookForDetailId = signal<string | null>(null);
  protected readonly selectedBookForEditId = signal<string | null>(null);

  // Modales de registros de lectura
  protected readonly showReadingLogEditor = signal<boolean>(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);
  protected readonly editingReadingLog = signal<ReadingLog | undefined>(undefined);

  // Signal para rastrear qué libros tienen sesiones expandidas
  protected readonly expandedBookIds = signal<Set<string>>(new Set());

  /**
   * Agrupación reactiva O(N) de sesiones de lectura por ID de libro.
   */
  protected readonly logsByBookMap = computed(() => {
    const map = new Map<string, ReadingLog[]>();
    for (const log of this.readingLogs()) {
      const list = map.get(log.bookId);
      if (list) {
        list.push(log);
      } else {
        map.set(log.bookId, [log]);
      }
    }
    return map;
  });

  /**
   * Obtiene las sesiones visibles para un libro (máx 2 si no está expandido).
   */
  protected getVisibleLogs(bookId: string): ReadingLog[] {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    const isExpanded = this.expandedBookIds().has(bookId);
    return isExpanded ? allLogs : allLogs.slice(0, 2);
  }

  /**
   * Retorna true si hay más sesiones para mostrar (más de 2).
   */
  protected hasMoreLogs(bookId: string): boolean {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    return allLogs.length > 2;
  }

  /**
   * Retorna el contador de sesiones ocultas.
   */
  protected getHiddenLogsCount(bookId: string): number {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    const isExpanded = this.expandedBookIds().has(bookId);
    if (isExpanded || allLogs.length <= 2) {
      return 0;
    }
    return allLogs.length - 2;
  }

  /**
   * Alterna la expansión de sesiones para un libro.
   */
  protected toggleLogsExpanded(bookId: string): void {
    this.expandedBookIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  }

  protected readonly maxMonthlyPages = computed(() => {
    const monthly = this.stats().monthlyPages;
    if (monthly.length === 0) {
      return 1;
    }
    return Math.max(...monthly.map((m) => m.pages), 1);
  });

  // Métodos de apertura y cierre
  protected openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
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

  protected async deleteBook(bookId: string): Promise<void> {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este libro? Se conservarán sus lecturas asociadas.');
    if (!confirmed) {
      return;
    }

    try {
      await this.booksService.remove(bookId);
    } catch (error) {
      console.error('Error al eliminar el libro:', error);
    }
  }

  protected openReadingLogEditor(book: Book, existingLog?: ReadingLog): void {
    this.readingLogBookId.set(book.id);
    this.editingReadingLog.set(existingLog);
    this.showReadingLogEditor.set(true);
  }

  protected closeReadingLogEditor(): void {
    this.showReadingLogEditor.set(false);
    this.readingLogBookId.set(undefined);
    this.editingReadingLog.set(undefined);
  }

  protected async deleteReadingLog(logId: string): Promise<void> {
    const confirmed = window.confirm('¿Deseas borrar este registro de lectura?');
    if (!confirmed) {
      return;
    }

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('Error al borrar la sesión de lectura:', error);
    }
  }

  /**
   * Helper puro para resolver las clases de insignia de estado de manera consistente.
   * Utiliza la configuración centralizada de BOOK_STATUS_CONFIG.
   */
  protected getStatusBadgeClass(status: BookStatus): string {
    return BOOK_STATUS_CONFIG[status].badgeClass;
  }

  protected getRatingBadge(rating?: number): string {
    if (rating === undefined || rating === null || Number.isNaN(rating)) {
      return 'Sin valoración';
    }

    const normalized = Math.min(BOOK_RATING_MAX, Math.max(0, rating));
    return `★ ${normalized.toFixed(1).replace(/\.0$/, '')}/10`;
  }

  /**
   * Helper para obtener el color de la barra de progreso según el estado.
   */
  protected getStatusBarColor(status: BookStatus): string {
    return BOOK_STATUS_CONFIG[status].dotClass.replace('bg-', '');
  }
}
