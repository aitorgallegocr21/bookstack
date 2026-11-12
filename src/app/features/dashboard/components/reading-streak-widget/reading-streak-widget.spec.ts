import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreakInfo } from '../../../books/models/book.model';
import { ReadingStreakWidgetComponent } from './reading-streak-widget';

describe('ReadingStreakWidgetComponent', () => {
  let fixture: ComponentFixture<ReadingStreakWidgetComponent>;

  const sampleStreak: StreakInfo = {
    currentStreak: 4,
    longestStreak: 10,
    hasReadToday: true,
    weeklyActivity: [
      { dayIndex: 0, dayKey: 'mon', date: '2026-03-09', active: true, isToday: false },
      { dayIndex: 1, dayKey: 'tue', date: '2026-03-10', active: true, isToday: false },
      { dayIndex: 2, dayKey: 'wed', date: '2026-03-11', active: true, isToday: false },
      { dayIndex: 3, dayKey: 'thu', date: '2026-03-12', active: true, isToday: true },
      { dayIndex: 4, dayKey: 'fri', date: '2026-03-13', active: false, isToday: false },
      { dayIndex: 5, dayKey: 'sat', date: '2026-03-14', active: false, isToday: false },
      { dayIndex: 6, dayKey: 'sun', date: '2026-03-15', active: false, isToday: false },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadingStreakWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingStreakWidgetComponent);
  });

  it('should render current streak count and longest streak record', () => {
    fixture.componentRef.setInput('streakInfo', sampleStreak);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('4');
    expect(root.textContent).toContain('10');
    expect(root.textContent).toContain('Racha de lectura');
  });

  it('should indicate when today reading has been completed', () => {
    fixture.componentRef.setInput('streakInfo', sampleStreak);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('¡Lectura de hoy completada!');
  });

  it('should prompt user to read when today is pending', () => {
    const pendingStreak: StreakInfo = {
      ...sampleStreak,
      hasReadToday: false,
    };
    fixture.componentRef.setInput('streakInfo', pendingStreak);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Lee hoy para mantener la racha');
  });

  it('should render 7 weekly activity items', () => {
    fixture.componentRef.setInput('streakInfo', sampleStreak);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const days = root.querySelectorAll('.grid > div');
    expect(days).toHaveLength(7);
  });
});
