import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { Book } from '../../models/book.model';
import { BookGridCardComponent } from './book-grid-card';

@Component({
  standalone: true,
  imports: [BookGridCardComponent],
  template: `
    <app-book-grid-card
      [book]="book()"
      (viewDetails)="onViewDetails($event)"
      (logReading)="onLogReading($event)"
      (editBook)="onEditBook($event)"
      (deleteBook)="onDeleteBook($event)"
    />
  `,
})
class TestHostComponent {
  readonly book = signal<Book>({
    id: 'book-1',
    title: 'Elantris',
    author: 'Brandon Sanderson',
    totalPages: 600,
    currentPage: 150,
    status: 'reading',
    format: 'Físico',
    rating: 9,
    coverUrl: 'https://example.com/cover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
  });

  lastViewDetailsId: string | null = null;
  lastLogReadingId: string | null = null;
  lastEditBookId: string | null = null;
  lastDeleteBookId: string | null = null;

  onViewDetails(id: string): void {
    this.lastViewDetailsId = id;
  }

  onLogReading(id: string): void {
    this.lastLogReadingId = id;
  }

  onEditBook(id: string): void {
    this.lastEditBookId = id;
  }

  onDeleteBook(id: string): void {
    this.lastDeleteBookId = id;
  }
}

describe('BookGridCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render cover image, title, author, rating badge, and progress', () => {
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.getAttribute('src')).toBe('https://example.com/cover.jpg');

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Elantris');
    expect(root.textContent).toContain('Brandon Sanderson');
    expect(root.textContent).toContain('★ 9');
    expect(root.textContent).toContain('150/600');
  });

  it('should emit viewDetails when clicking the cover or title', () => {
    const coverWrapper = fixture.debugElement.query(By.css('[role="button"]'));
    coverWrapper.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-1');

    host.lastViewDetailsId = null;
    const titleButton = fixture.debugElement.query(By.css('h2 button'));
    titleButton.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-1');
  });

  it('should emit logReading, editBook, and deleteBook from action buttons', () => {
    const logButton = fixture.debugElement.query(
      By.css('button[aria-label="Registrar lectura de Elantris"]')
    );
    logButton.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastLogReadingId).toBe('book-1');

    const editButton = fixture.debugElement.query(By.css('button[aria-label="Editar Elantris"]'));
    editButton.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastEditBookId).toBe('book-1');

    const deleteButton = fixture.debugElement.query(
      By.css('button[aria-label="Eliminar Elantris"]')
    );
    deleteButton.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastDeleteBookId).toBe('book-1');
  });

  it('should use @container and container-query label visibility on the Log button without clipping', () => {
    const article = fixture.debugElement.query(By.css('article'));
    expect(article.nativeElement.classList.contains('@container')).toBe(true);

    const logButton = fixture.debugElement.query(
      By.css('button[aria-label="Registrar lectura de Elantris"]')
    );
    expect(logButton).toBeTruthy();
    expect(logButton.nativeElement.getAttribute('title')).toBeTruthy();
    expect(logButton.nativeElement.classList.contains('whitespace-nowrap')).toBe(true);

    const labelSpan = logButton.query(By.css('span'));
    expect(labelSpan).toBeTruthy();
    expect(labelSpan.nativeElement.classList.contains('hidden')).toBe(true);
    expect(labelSpan.nativeElement.classList.contains('@[205px]:inline')).toBe(true);
  });

  it('should hide quick actions and progress bar when disabled in AppPreferencesService', () => {
    const appPreferences = TestBed.inject(AppPreferencesService);
    expect(
      fixture.debugElement.query(By.css('[data-testid="grid-card-quick-actions"]'))
    ).not.toBeNull();
    expect(
      fixture.debugElement.query(By.css('[data-testid="grid-card-progress-bar"]'))
    ).not.toBeNull();

    appPreferences.updatePreferences({ showCardQuickActions: false, showCardProgressBar: false });
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('[data-testid="grid-card-quick-actions"]'))
    ).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="grid-card-progress-bar"]'))).toBeNull();
  });

  it('should toggle data-book-tint-active based on adaptiveCoverTint preference', () => {
    const appPreferences = TestBed.inject(AppPreferencesService);
    const article = fixture.debugElement.query(By.css('article')).nativeElement as HTMLElement;

    expect(article.getAttribute('data-book-tint-active')).toBe('true');

    appPreferences.updatePreferences({ adaptiveCoverTint: false });
    fixture.detectChanges();
    expect(article.getAttribute('data-book-tint-active')).toBeNull();
  });
});
