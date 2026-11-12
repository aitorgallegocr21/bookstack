import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReadingStats } from '../../../books/models/book.model';
import { ReadingStatsService } from '../../../books/services/reading-stats.service';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  const mockStats = signal<ReadingStats>({
    totalBooks: 4,
    completedBooks: 2,
    readingBooks: 1,
    pendingBooks: 1,
    totalPagesRead: 720,
    totalTimeSpentMinutes: 360,
    averagePagesPerDay: 24,
    averageReadingSpeedPagesPerHour: 48,
    monthlyPages: [
      { month: '2026-01', pages: 320 },
      { month: '2026-02', pages: 400 },
    ],
    statusDistribution: [
      { status: 'pending', count: 1 },
      { status: 'reading', count: 1 },
      { status: 'completed', count: 2 },
      { status: 'abandoned', count: 0 },
    ],
    streakInfo: {
      currentStreak: 3,
      longestStreak: 5,
      hasReadToday: true,
      weeklyActivity: [
        { dayIndex: 0, dayKey: 'mon', date: '2026-03-09', active: true, isToday: false },
        { dayIndex: 1, dayKey: 'tue', date: '2026-03-10', active: true, isToday: false },
        { dayIndex: 2, dayKey: 'wed', date: '2026-03-11', active: true, isToday: true },
        { dayIndex: 3, dayKey: 'thu', date: '2026-03-12', active: false, isToday: false },
        { dayIndex: 4, dayKey: 'fri', date: '2026-03-13', active: false, isToday: false },
        { dayIndex: 5, dayKey: 'sat', date: '2026-03-14', active: false, isToday: false },
        { dayIndex: 6, dayKey: 'sun', date: '2026-03-15', active: false, isToday: false },
      ],
    },
    annualProgress: {
      year: 2026,
      completedBooks: 2,
      pagesRead: 720,
    },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        {
          provide: ReadingStatsService,
          useValue: { stats: mockStats },
        },
      ],
    }).compileComponents();
  });

  it('should render dashboard KPIs and charts without nesting a second <main> landmark', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('main')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toContain('Resumen de lectura');
    expect(root.textContent).toContain('720');
    expect(root.textContent).toContain('48');
    expect(root.textContent).toContain('Enero 2026');
    expect(root.textContent).toContain('Febrero 2026');
  });
});
