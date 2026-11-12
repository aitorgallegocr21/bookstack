import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { AnnualProgress, ReadingGoals } from '../../../books/models/book.model';

@Component({
  selector: 'app-annual-goal-card',
  standalone: true,
  templateUrl: './annual-goal-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
    '(document:keydown.escape)': 'handleEscape()',
  },
})
export class AnnualGoalCardComponent implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly uiState = inject(UiStateService);

  readonly goals = input.required<ReadingGoals>();
  readonly annualProgress = input.required<AnnualProgress>();

  readonly goalsUpdated = output<ReadingGoals>();

  protected readonly isEditModalOpen = signal<boolean>(false);
  protected readonly booksGoalInput = signal<number>(12);
  protected readonly pagesGoalInput = signal<number>(3000);

  protected readonly booksPercentage = computed<number>(() => {
    const target = this.goals().targetBooks;
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.annualProgress().completedBooks / target) * 100));
  });

  protected readonly pagesPercentage = computed<number>(() => {
    const target = this.goals().targetPages;
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.annualProgress().pagesRead / target) * 100));
  });

  ngOnDestroy(): void {
    if (this.isEditModalOpen()) {
      this.uiState.releaseScrollLock();
    }
  }

  protected openEditModal(): void {
    this.booksGoalInput.set(this.goals().targetBooks);
    this.pagesGoalInput.set(this.goals().targetPages);
    this.uiState.acquireScrollLock();
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    if (this.isEditModalOpen()) {
      this.uiState.releaseScrollLock();
      this.isEditModalOpen.set(false);
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeEditModal();
    }
  }

  protected saveGoals(): void {
    const targetBooks = Math.max(1, Math.min(1000, this.booksGoalInput()));
    const targetPages = Math.max(10, Math.min(1000000, this.pagesGoalInput()));

    this.goalsUpdated.emit({
      year: this.goals().year,
      targetBooks,
      targetPages,
    });
    this.closeEditModal();
  }

  protected handleEscape(): void {
    if (this.isEditModalOpen()) {
      this.closeEditModal();
    }
  }

  protected onBooksInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = parseInt(target.value, 10);
    this.booksGoalInput.set(Number.isNaN(val) ? 1 : val);
  }

  protected onPagesInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = parseInt(target.value, 10);
    this.pagesGoalInput.set(Number.isNaN(val) ? 10 : val);
  }
}
