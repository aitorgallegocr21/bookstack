import {
  Component,
  ChangeDetectionStrategy,
  inject,
  output,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BooksService } from '../../services/books.service';
import { Book, BookStatus } from '../../models/book.model';
import { ImageOptimizerService } from '../../services/image-optimizer.service';

@Component({
  selector: 'app-book-create-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './book-create-modal.html',
  styleUrl: './book-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()'
  }
})
export class BookCreateModalComponent {
  private readonly booksService = inject(BooksService);
  private readonly imageOptimizerService = inject(ImageOptimizerService);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly saved = output<Book>();

  protected readonly isSaving = signal<boolean>(false);
  protected readonly isClosing = signal<boolean>(false);
  protected readonly coverMode = signal<'url' | 'upload'>('url');
  protected readonly coverPreview = signal<string>('');

  protected readonly statusOptions: { value: BookStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'reading', label: 'Leyendo' },
    { value: 'completed', label: 'Completado' },
    { value: 'abandoned', label: 'Abandonado' }
  ];

  protected readonly createForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    author: ['', [Validators.required, Validators.minLength(1)]],
    isbn: [''],
    publisher: [''],
    publicationYear: [null],
    totalPages: [0, [Validators.required, Validators.min(0)]],
    currentPage: [0, [Validators.min(0)]],
    totalCharacters: [0, [Validators.min(0)]],
    totalChapters: [0, [Validators.min(0)]],
    currentChapter: [0, [Validators.min(0)]],
    format: ['Físico'],
    status: ['pending' as BookStatus, [Validators.required]],
    coverUrl: [''],
    startDate: [''],
    endDate: [''],
    rating: [0, [Validators.min(0), Validators.max(5)]],
    notes: [''],
    seriesEnabled: [false],
    seriesName: [''],
    seriesVolumeNumber: [null],
    coverSource: ['url']
  });

  protected handleEscape(): void {
    this.cancel();
  }

  protected onStatusChange(status: BookStatus): void {
    const totalPages = Number(this.createForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.createForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.createForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.createForm.get('currentChapter')?.value) || 0;
    const nextValues = this.getCompletedAutofillValues({
      status,
      totalPages,
      currentPage,
      totalChapters,
      currentChapter,
      endDate: this.createForm.get('endDate')?.value || ''
    });

    this.createForm.patchValue(nextValues);
  }

  private getCompletedAutofillValues(values: {
    status: BookStatus | null;
    totalPages: number;
    currentPage: number;
    totalChapters: number;
    currentChapter: number;
    endDate: string | null;
  }): Partial<{ currentPage: number; currentChapter: number; endDate: string }> {
    if (values.status !== 'completed') {
      return {};
    }

    return {
      currentPage: Math.max(values.currentPage, values.totalPages),
      currentChapter: Math.max(values.currentChapter, values.totalChapters),
      endDate: values.endDate || this.getTodayIso()
    };
  }

  protected onCoverModeChange(mode: 'url' | 'upload'): void {
    this.coverMode.set(mode);
    this.createForm.patchValue({ coverSource: mode });

    if (mode === 'url') {
      this.createForm.patchValue({ coverUrl: this.coverPreview() || '' });
      return;
    }

    if (!this.coverPreview()) {
      this.createForm.patchValue({ coverUrl: '' });
    }
  }

  protected async onCoverSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const optimizedCover = await this.imageOptimizerService.optimize(file);
      this.coverPreview.set(optimizedCover);
      this.createForm.patchValue({ coverUrl: optimizedCover });
      this.coverMode.set('upload');
    } catch (error) {
      console.error('Error al optimizar la portada:', error);
      this.coverPreview.set('');
      this.createForm.patchValue({ coverUrl: '' });
    } finally {
      input.value = '';
    }
  }

  protected clearCover(): void {
    this.coverPreview.set('');
    this.createForm.patchValue({ coverUrl: '' });
  }

  protected async save(): Promise<void> {
    if (this.createForm.invalid || this.isSaving()) return;

    const status = this.createForm.get('status')?.value as BookStatus | null;
    const totalPages = Number(this.createForm.get('totalPages')?.value) || 0;
    const currentPage = Number(this.createForm.get('currentPage')?.value) || 0;
    const totalChapters = Number(this.createForm.get('totalChapters')?.value) || 0;
    const currentChapter = Number(this.createForm.get('currentChapter')?.value) || 0;
    const endDate = this.createForm.get('endDate')?.value || '';

    this.createForm.patchValue(
      this.getCompletedAutofillValues({
        status,
        totalPages,
        currentPage,
        totalChapters,
        currentChapter,
        endDate
      })
    );

    this.isSaving.set(true);
    const val = this.createForm.getRawValue();
    const now = new Date().toISOString();

    const hasSeries = Boolean(val.seriesEnabled) && Boolean(val.seriesName?.trim());
    const series = hasSeries
      ? {
          id: crypto.randomUUID(),
          name: val.seriesName!.trim(),
          volumeNumber: val.seriesVolumeNumber ? Number(val.seriesVolumeNumber) : undefined
        }
      : undefined;

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: val.title!.trim(),
      author: val.author!.trim(),
      isbn: val.isbn?.trim() || undefined,
      publisher: val.publisher?.trim() || undefined,
      publicationYear: val.publicationYear ? Number(val.publicationYear) : undefined,
      totalPages: Number(val.totalPages) || 0,
      currentPage: Number(val.currentPage) || 0,
      totalCharacters: val.totalCharacters ? Number(val.totalCharacters) : undefined,
      totalChapters: val.totalChapters ? Number(val.totalChapters) : undefined,
      currentChapter: val.currentChapter ? Number(val.currentChapter) : undefined,
      status: val.status as BookStatus,
      format: val.format?.trim() || 'Físico',
      series,
      coverUrl: val.coverUrl?.trim() || this.coverPreview() || undefined,
      rating: val.rating ? Number(val.rating) : undefined,
      startDate: val.startDate || undefined,
      endDate: val.endDate || undefined,
      notes: val.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.booksService.add(newBook);
      this.saved.emit(newBook);
      this.closed.emit();
    } catch (error) {
      console.error('Error al crear el nuevo libro:', error);
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

  protected onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }

  private getTodayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
