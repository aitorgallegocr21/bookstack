import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReadingLog } from '../../models/book.model';
import { ReadingLogService } from '../../services/reading-log.service';
import { ReadingLogEditorComponent } from './reading-log-editor';

describe('ReadingLogEditorComponent', () => {
  let addMock: ReturnType<typeof vi.fn>;
  let updateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    addMock = vi.fn(async () => undefined);
    updateMock = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [ReadingLogEditorComponent],
      providers: [
        {
          provide: ReadingLogService,
          useValue: {
            add: addMock,
            update: updateMock,
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

  it('should manage body scroll lock and dismiss on Escape', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ReadingLogEditorComponent);
    fixture.componentRef.setInput('bookId', 'book-1');
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(180);
    expect(closedSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('should create a new log and emit saved/closed on submit', async () => {
    const fixture = TestBed.createComponent(ReadingLogEditorComponent);
    fixture.componentRef.setInput('bookId', 'book-1');
    const savedSpy = vi.fn<(log: ReadingLog) => void>();
    const closedSpy = vi.fn();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(addMock).toHaveBeenCalledTimes(1);
    expect(updateMock).not.toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].bookId).toBe('book-1');
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should update an existing log when existingLog input is provided', async () => {
    const existing: ReadingLog = {
      id: 'existing-log-1',
      bookId: 'book-1',
      date: '2026-02-01',
      pagesRead: 35,
      timeSpentMinutes: 40,
      createdAt: '2026-02-01T10:00:00.000Z',
    };

    const fixture = TestBed.createComponent(ReadingLogEditorComponent);
    fixture.componentRef.setInput('bookId', 'book-1');
    fixture.componentRef.setInput('existingLog', existing);
    const savedSpy = vi.fn<(log: ReadingLog) => void>();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(addMock).not.toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing-log-1' }));
  });
});
