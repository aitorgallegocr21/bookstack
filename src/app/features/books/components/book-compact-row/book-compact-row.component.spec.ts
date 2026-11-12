import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Book } from '../../models/book.model';
import { BookCompactRowComponent } from './book-compact-row.component';

@Component({
  standalone: true,
  imports: [BookCompactRowComponent],
  template: `
    <app-book-compact-row
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
    id: 'book-compact-1',
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    totalPages: 250,
    currentPage: 125,
    status: 'reading',
    format: 'Ebook',
    rating: 8.5,
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

describe('BookCompactRowComponent', () => {
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

  it('should render title, author, rating, format, and progress percentage', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Fahrenheit 451');
    expect(root.textContent).toContain('Ray Bradbury');
    expect(root.textContent).toContain('★ 8.5');
    expect(root.textContent).toContain('50%');
  });

  it('should emit viewDetails when clicking thumbnail or title', () => {
    const thumbnailBtn = fixture.debugElement.query(By.css('button.aspect-\\[2\\/3\\]'));
    thumbnailBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-compact-1');

    host.lastViewDetailsId = null;
    const titleBtn = fixture.debugElement.query(By.css('h2 button'));
    titleBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-compact-1');
  });

  it('should emit logReading, editBook, and deleteBook from action buttons', () => {
    const logBtn = fixture.debugElement.query(
      By.css('button[aria-label="Registrar lectura de Fahrenheit 451"]')
    );
    logBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastLogReadingId).toBe('book-compact-1');

    const editBtn = fixture.debugElement.query(
      By.css('button[aria-label="Editar Fahrenheit 451"]')
    );
    editBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastEditBookId).toBe('book-compact-1');

    const deleteBtn = fixture.debugElement.query(
      By.css('button[aria-label="Eliminar Fahrenheit 451"]')
    );
    deleteBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastDeleteBookId).toBe('book-compact-1');
  });
});
