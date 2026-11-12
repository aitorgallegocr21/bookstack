import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AnnualProgress, ReadingGoals } from '../../../books/models/book.model';
import { AnnualGoalCardComponent } from './annual-goal-card';

describe('AnnualGoalCardComponent', () => {
  let fixture: ComponentFixture<AnnualGoalCardComponent>;
  let component: AnnualGoalCardComponent;

  const sampleGoals: ReadingGoals = {
    year: 2026,
    targetBooks: 20,
    targetPages: 5000,
  };

  const sampleProgress: AnnualProgress = {
    year: 2026,
    completedBooks: 5,
    pagesRead: 1500,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualGoalCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnualGoalCardComponent);
    component = fixture.componentInstance;
  });

  it('should render annual goals progress and percentage bars', () => {
    fixture.componentRef.setInput('goals', sampleGoals);
    fixture.componentRef.setInput('annualProgress', sampleProgress);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Metas anuales (2026)');
    expect(root.textContent).toContain('5 / 20');
    expect(root.textContent).toContain('25%');
    expect(root.textContent).toContain('1500 / 5000');
    expect(root.textContent).toContain('30%');
  });

  it('should open edit modal when clicking edit button and emit goalsUpdated on save', () => {
    fixture.componentRef.setInput('goals', sampleGoals);
    fixture.componentRef.setInput('annualProgress', sampleProgress);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="dialog"]')).toBeNull();

    const editButton = root.querySelector('button[type="button"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).not.toBeNull();

    const updateSpy = vi.fn();
    component.goalsUpdated.subscribe(updateSpy);

    const booksInput = root.querySelector('#goal-books-input') as HTMLInputElement;
    booksInput.value = '25';
    booksInput.dispatchEvent(new Event('input'));

    const pagesInput = root.querySelector('#goal-pages-input') as HTMLInputElement;
    pagesInput.value = '6000';
    pagesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = root.querySelectorAll('[role="dialog"] button')[2] as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith({
      year: 2026,
      targetBooks: 25,
      targetPages: 6000,
    });
    expect(root.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should dismiss edit modal on Escape key', () => {
    fixture.componentRef.setInput('goals', sampleGoals);
    fixture.componentRef.setInput('annualProgress', sampleProgress);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const editButton = root.querySelector('button[type="button"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).toBeNull();
  });
});
