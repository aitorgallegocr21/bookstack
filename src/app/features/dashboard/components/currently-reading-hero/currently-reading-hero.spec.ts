import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book } from '../../../books/models/book.model';
import { CurrentlyReadingHeroComponent } from './currently-reading-hero';

describe('CurrentlyReadingHeroComponent', () => {
  let fixture: ComponentFixture<CurrentlyReadingHeroComponent>;
  let component: CurrentlyReadingHeroComponent;

  const sampleBook: Book = {
    id: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    totalPages: 320,
    currentPage: 160,
    status: 'reading',
    format: 'hardcover',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  const parallelBook: Book = {
    id: 'book-2',
    title: 'Deep Work',
    author: 'Cal Newport',
    totalPages: 300,
    currentPage: 100,
    status: 'reading',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  const pendingBook: Book = {
    id: 'book-3',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    totalPages: 450,
    currentPage: 0,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentlyReadingHeroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentlyReadingHeroComponent);
    component = fixture.componentInstance;
  });

  it('should render welcome empty state when totalBooksCount is 0', () => {
    fixture.componentRef.setInput('totalBooksCount', 0);
    fixture.componentRef.setInput('activeBook', null);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('¡Te damos la bienvenida a BookStack!');
    expect(root.textContent).toContain('Añadir mi primer libro');

    const createSpy = vi.fn();
    component.openCreateModal.subscribe(createSpy);

    const button = root.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(createSpy).toHaveBeenCalled();
  });

  it('should render pick next read empty state when totalBooks > 0 but no active book', () => {
    fixture.componentRef.setInput('totalBooksCount', 2);
    fixture.componentRef.setInput('activeBook', null);
    fixture.componentRef.setInput('pendingBooks', [pendingBook]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Sin lecturas en curso');
    expect(root.textContent).toContain('Clean Code');

    const startReadingSpy = vi.fn();
    component.startReading.subscribe(startReadingSpy);

    const startButton = root.querySelector('button') as HTMLButtonElement;
    startButton.click();
    expect(startReadingSpy).toHaveBeenCalledWith(pendingBook);
  });

  it('should render all caught up empty state with addNewBook CTA when books exist but 0 pending', () => {
    fixture.componentRef.setInput('totalBooksCount', 2);
    fixture.componentRef.setInput('activeBook', null);
    fixture.componentRef.setInput('pendingBooks', []);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('¡Biblioteca al día!');
    expect(root.textContent).toContain('Añadir nuevo libro');
    expect(root.textContent).not.toContain('Añadir mi primer libro');
  });

  it('should require new page to be greater than current page in fast page update', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook); // currentPage: 160
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="number"]') as HTMLInputElement;
    const submitBtn = root.querySelectorAll('button')[1] as HTMLButtonElement;

    // By default value is 160 (currentPage) => button is disabled but warning is not shown until attempted
    expect(submitBtn.disabled).toBe(true);
    expect(root.textContent).not.toContain('La página debe ser mayor a la actual (160)');

    // Attempting to set value lower than or equal to 160 => shows warning
    input.value = '150';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(true);
    expect(root.textContent).toContain('La página debe ser mayor a la actual (160)');

    // Setting valid value => hides warning and enables submit button
    input.value = '175';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(false);
    expect(root.textContent).not.toContain('La página debe ser mayor a la actual (160)');
  });

  it('should show warning if user tries to submit without increasing current page (regression)', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook); // currentPage: 160
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="number"]') as HTMLInputElement;

    expect(root.textContent).not.toContain('La página debe ser mayor a la actual (160)');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(root.textContent).toContain('La página debe ser mayor a la actual (160)');
  });

  it('should open confirmation modal when updating to totalPages and emit upon confirmation', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook); // totalPages: 320
    fixture.detectChanges();

    const pageUpdateSpy = vi.fn();
    component.pageUpdated.subscribe(pageUpdateSpy);

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '320';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submitBtn = root.querySelectorAll('button')[1] as HTMLButtonElement;
    submitBtn.click();
    fixture.detectChanges();

    // Confirmation modal should be visible
    expect(root.textContent).toContain('¿Has terminado este libro?');
    expect(pageUpdateSpy).not.toHaveBeenCalled();

    // Click confirm button in modal
    const confirmBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sí, completar libro')
    );
    expect(confirmBtn).toBeDefined();
    confirmBtn?.click();

    expect(pageUpdateSpy).toHaveBeenCalledWith({
      bookId: 'book-1',
      newPage: 320,
    });
  });

  it('should render active book details, format, and progress percentage', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Atomic Habits');
    expect(root.textContent).toContain('James Clear');
    expect(root.textContent).toContain('50%');
    expect(root.textContent).toContain('160 / 320');
  });

  it('should emit pageUpdated when updating input and submitting', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook);
    fixture.detectChanges();

    const pageUpdateSpy = vi.fn();
    component.pageUpdated.subscribe(pageUpdateSpy);

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '200';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submitBtn = root.querySelectorAll('button')[1] as HTMLButtonElement;
    submitBtn.click();

    expect(pageUpdateSpy).toHaveBeenCalledWith({
      bookId: 'book-1',
      newPage: 200,
    });
  });

  it('should emit openFullLog when clicking session detail action', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook);
    fixture.detectChanges();

    const openFullLogSpy = vi.fn();
    component.openFullLog.subscribe(openFullLogSpy);

    const root = fixture.nativeElement as HTMLElement;
    const detailBtn = root.querySelector('button') as HTMLButtonElement;
    detailBtn.click();

    expect(openFullLogSpy).toHaveBeenCalledWith(sampleBook);
  });

  it('should render parallel active books and emit bookSelected when switching', () => {
    fixture.componentRef.setInput('totalBooksCount', 3);
    fixture.componentRef.setInput('activeBook', sampleBook);
    fixture.componentRef.setInput('otherActiveBooks', [parallelBook]);
    fixture.detectChanges();

    const selectSpy = vi.fn();
    component.bookSelected.subscribe(selectSpy);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Otras lecturas en curso (1)');
    expect(root.textContent).toContain('Deep Work');

    const parallelBtn = root.querySelectorAll('button')[2] as HTMLButtonElement;
    parallelBtn.click();

    expect(selectSpy).toHaveBeenCalledWith(parallelBook);
  });
});
