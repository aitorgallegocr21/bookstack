import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { RecentActivityFeedComponent } from './recent-activity-feed';

describe('RecentActivityFeedComponent', () => {
  let fixture: ComponentFixture<RecentActivityFeedComponent>;
  let component: RecentActivityFeedComponent;

  const sampleBooks: Book[] = [
    {
      id: 'b-1',
      title: 'Atomic Habits',
      author: 'James Clear',
      totalPages: 320,
      currentPage: 150,
      status: 'reading',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    },
    {
      id: 'b-2',
      title: 'Deep Work',
      author: 'Cal Newport',
      totalPages: 300,
      currentPage: 200,
      status: 'reading',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    },
  ];

  const sampleLogs: ReadingLog[] = [
    {
      id: 'log-1',
      bookId: 'b-1',
      date: '2026-03-10',
      pagesRead: 25,
      timeSpentMinutes: 30,
      notes: 'Great insights on cues',
      createdAt: '2026-03-10T10:00:00.000Z',
    },
    {
      id: 'log-2',
      bookId: 'b-2',
      date: '2026-03-11',
      pagesRead: 40,
      createdAt: '2026-03-11T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentActivityFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentActivityFeedComponent);
    component = fixture.componentInstance;
  });

  it('should render empty state message when no reading logs are passed', () => {
    fixture.componentRef.setInput('books', sampleBooks);
    fixture.componentRef.setInput('logs', []);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Aún no has registrado sesiones de lectura.');
  });

  it('should render recent sessions sorted by date descending', () => {
    fixture.componentRef.setInput('books', sampleBooks);
    fixture.componentRef.setInput('logs', sampleLogs);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Actividad reciente');
    expect(root.textContent).toContain('Atomic Habits');
    expect(root.textContent).toContain('+25 págs.');
    expect(root.textContent).toContain('Deep Work');
    expect(root.textContent).toContain('+40 págs.');
    expect(root.textContent).toContain('"Great insights on cues"');
  });

  it('should emit bookSelected and logSelected on item click', () => {
    fixture.componentRef.setInput('books', sampleBooks);
    fixture.componentRef.setInput('logs', sampleLogs);
    fixture.detectChanges();

    const bookSpy = vi.fn();
    const logSpy = vi.fn();
    component.bookSelected.subscribe(bookSpy);
    component.logSelected.subscribe(logSpy);

    const root = fixture.nativeElement as HTMLElement;
    const firstButton = root.querySelector('button') as HTMLButtonElement;
    firstButton.click();

    expect(bookSpy).toHaveBeenCalledWith(sampleBooks[1]); // log-2 is 2026-03-11 (most recent)
    expect(logSpy).toHaveBeenCalledWith(sampleLogs[1]);
  });
});
