import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { BookCreateModalComponent } from './book-create-modal';

describe('BookCreateModalComponent', () => {
  let addMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    addMock = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [BookCreateModalComponent],
      providers: [
        {
          provide: BooksService,
          useValue: {
            add: addMock,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.classList.remove('overflow-hidden');
    vi.restoreAllMocks();
  });

  it('should acquire body scroll lock on mount and release it on destroy', () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('should dismiss on Escape key after closing animation delay', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(180);
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should validate required fields and emit saved/closed when creating a book', async () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const savedSpy = vi.fn<(book: Book) => void>();
    const closedSpy = vi.fn();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector('input[formcontrolname="title"]') as HTMLInputElement;
    const authorInput = root.querySelector('input[formcontrolname="author"]') as HTMLInputElement;
    const totalPagesInput = root.querySelector(
      'input[formcontrolname="totalPages"]'
    ) as HTMLInputElement;

    // Submit while required fields are empty
    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(addMock).not.toHaveBeenCalled();

    titleInput.value = 'Fundación';
    titleInput.dispatchEvent(new Event('input'));
    authorInput.value = 'Isaac Asimov';
    authorInput.dispatchEvent(new Event('input'));
    totalPagesInput.value = '256';
    totalPagesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(addMock).toHaveBeenCalledTimes(1);
    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].title).toBe('Fundación');
    expect(savedSpy.mock.calls[0][0].author).toBe('Isaac Asimov');
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });
});
