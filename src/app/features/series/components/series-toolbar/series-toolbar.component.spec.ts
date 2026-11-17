import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeriesToolbarComponent } from './series-toolbar.component';
import { SagaStatusCounts } from '../../models/series.model';

describe('SeriesToolbarComponent', () => {
  let fixture: ComponentFixture<SeriesToolbarComponent>;
  let component: SeriesToolbarComponent;

  const mockCounts: SagaStatusCounts = {
    all: 5,
    reading: 2,
    completed: 1,
    pending: 2,
    hasGaps: 2,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeriesToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeriesToolbarComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('searchQuery', '');
    fixture.componentRef.setInput('statusFilter', 'all');
    fixture.componentRef.setInput('sortOption', 'recent');
    fixture.componentRef.setInput('statusCounts', mockCounts);
    fixture.componentRef.setInput('hasActiveFilters', false);
    fixture.detectChanges();
  });

  it('should render search input, sort dropdown, and all 5 filter chips with counters', () => {
    const searchInput = fixture.nativeElement.querySelector(
      '#series-search-input'
    ) as HTMLInputElement;
    const sortSelect = fixture.nativeElement.querySelector(
      '#series-sort-select'
    ) as HTMLSelectElement;
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');

    expect(searchInput).toBeTruthy();
    expect(sortSelect).toBeTruthy();
    expect(sortSelect.options.length).toBe(5);
    expect(tabs.length).toBe(5);
    expect(tabs[0].textContent).toContain('5');
    expect(tabs[1].textContent).toContain('2');
    expect(tabs[4].textContent).toContain('2');
  });

  it('should emit searchChange when typing and clear when clicking clear button', () => {
    const spy = vi.fn();
    component.searchChange.subscribe(spy);

    const searchInput = fixture.nativeElement.querySelector(
      '#series-search-input'
    ) as HTMLInputElement;
    searchInput.value = 'Mistborn';
    searchInput.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('Mistborn');

    fixture.componentRef.setInput('searchQuery', 'Mistborn');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Limpiar búsqueda de sagas"]'
    ) as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    expect(spy).toHaveBeenCalledWith('');
  });

  it('should emit statusChange when clicking filter chips', () => {
    const spy = vi.fn();
    component.statusChange.subscribe(spy);

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[4] as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith('has-gaps');
  });

  it('should emit sortChange when changing sort dropdown', () => {
    const spy = vi.fn();
    component.sortChange.subscribe(spy);

    const sortSelect = fixture.nativeElement.querySelector(
      '#series-sort-select'
    ) as HTMLSelectElement;
    sortSelect.value = 'progress-desc';
    sortSelect.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith('progress-desc');
  });

  it('should show reset button only when hasActiveFilters is true and emit resetFilters', () => {
    let resetBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Restablecer filtros"]'
    ) as HTMLButtonElement | null;
    expect(resetBtn).toBeNull();

    fixture.componentRef.setInput('hasActiveFilters', true);
    fixture.detectChanges();

    const spy = vi.fn();
    component.resetFilters.subscribe(spy);

    resetBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Restablecer filtros"]'
    ) as HTMLButtonElement;
    expect(resetBtn).toBeTruthy();
    resetBtn.click();
    expect(spy).toHaveBeenCalledOnce();
  });
});
