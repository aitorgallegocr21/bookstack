import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Book } from '../../models/book.model';
import { BookDetailedCardComponent } from './book-detailed-card.component';

@Component({
  standalone: true,
  imports: [BookDetailedCardComponent],
  template: `
    <app-book-detailed-card
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
    id: 'book-detailed-1',
    title: 'El Nombre del Viento',
    author: 'Patrick Rothfuss',
    totalPages: 800,
    currentPage: 400,
    status: 'reading',
    format: 'Físico',
    rating: 9.5,
    series: { id: 'kvothe', name: 'Crónica del Asesino de Reyes', volumeNumber: 1 },
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

describe('BookDetailedCardComponent', () => {
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

  it('should render book details, series pill, status, and progress', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('El Nombre del Viento');
    expect(root.textContent).toContain('Patrick Rothfuss');
    expect(root.textContent).toContain('Crónica del Asesino de Reyes');
    expect(root.textContent).toContain('#1');
    expect(root.textContent).toContain('400 / 800');
    expect(root.textContent).toContain('50%');
    expect(root.textContent).toContain('★ 9.5/10');
  });

  it('should emit viewDetails when clicking cover or title', () => {
    const coverBtn = fixture.debugElement.query(By.css('button.aspect-\\[2\\/3\\]'));
    coverBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-detailed-1');

    host.lastViewDetailsId = null;
    const titleBtn = fixture.debugElement.query(By.css('h2 button'));
    titleBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastViewDetailsId).toBe('book-detailed-1');
  });

  it('should emit logReading, editBook, and deleteBook from action buttons', () => {
    const logBtn = fixture.debugElement.query(
      By.css('button[aria-label="Registrar lectura de El Nombre del Viento"]')
    );
    logBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastLogReadingId).toBe('book-detailed-1');

    const editBtn = fixture.debugElement.query(
      By.css('button[aria-label="Editar El Nombre del Viento"]')
    );
    editBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastEditBookId).toBe('book-detailed-1');

    const deleteBtn = fixture.debugElement.query(
      By.css('button[aria-label="Eliminar El Nombre del Viento"]')
    );
    deleteBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.lastDeleteBookId).toBe('book-detailed-1');
  });
});
