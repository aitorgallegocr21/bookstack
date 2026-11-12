import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BookStatus } from '../../models/book.model';
import {
  CatalogFilterCriteria,
  CatalogSortOption,
  CatalogViewMode,
  DEFAULT_CATALOG_FILTER_CRITERIA,
} from '../../models/catalog-filter.model';
import { CatalogToolbarComponent } from './catalog-toolbar.component';

@Component({
  standalone: true,
  imports: [CatalogToolbarComponent],
  template: `
    <app-catalog-toolbar
      [criteria]="criteria()"
      [viewMode]="viewMode()"
      [sortOption]="sortOption()"
      [statusCounts]="statusCounts()"
      [totalBooks]="totalBooks()"
      [filteredBooksCount]="filteredBooksCount()"
      [availableFormats]="availableFormats()"
      (criteriaChange)="onCriteriaChange($event)"
      (viewModeChange)="onViewModeChange($event)"
      (sortChange)="onSortChange($event)"
      (resetFilters)="onResetFilters()"
    />
  `,
})
class TestHostComponent {
  readonly criteria = signal<CatalogFilterCriteria>({ ...DEFAULT_CATALOG_FILTER_CRITERIA });
  readonly viewMode = signal<CatalogViewMode>('detailed');
  readonly sortOption = signal<CatalogSortOption>('recent');
  readonly statusCounts = signal<Record<BookStatus | 'all', number>>({
    all: 10,
    reading: 3,
    pending: 4,
    completed: 2,
    abandoned: 1,
  });
  readonly totalBooks = signal<number>(10);
  readonly filteredBooksCount = signal<number>(10);
  readonly availableFormats = signal<string[]>(['Físico', 'Ebook', 'Audiolibro']);

  lastCriteriaChange: Partial<CatalogFilterCriteria> | null = null;
  lastViewModeChange: CatalogViewMode | null = null;
  lastSortChange: CatalogSortOption | null = null;
  resetFiltersCalled = false;

  onCriteriaChange(change: Partial<CatalogFilterCriteria>): void {
    this.lastCriteriaChange = change;
    this.criteria.update((c) => ({ ...c, ...change }));
  }

  onViewModeChange(mode: CatalogViewMode): void {
    this.lastViewModeChange = mode;
    this.viewMode.set(mode);
  }

  onSortChange(sort: CatalogSortOption): void {
    this.lastSortChange = sort;
    this.sortOption.set(sort);
  }

  onResetFilters(): void {
    this.resetFiltersCalled = true;
    this.criteria.set({ ...DEFAULT_CATALOG_FILTER_CRITERIA });
  }
}

describe('CatalogToolbarComponent', () => {
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

  it('should render search input, view mode buttons, sort dropdown, and status chips', () => {
    const searchInput = fixture.debugElement.query(By.css('#catalog-search-input'));
    expect(searchInput).toBeTruthy();

    const sortSelect = fixture.debugElement.query(By.css('#catalog-sort-select'));
    expect(sortSelect).toBeTruthy();

    const statusChips = fixture.debugElement.queryAll(By.css('[role="tablist"] button'));
    expect(statusChips.length).toBe(5);

    const countBadges = fixture.debugElement.queryAll(
      By.css('[role="tablist"] button span.tabular-nums')
    );
    expect(countBadges.map((b) => b.nativeElement.textContent.trim())).toEqual([
      '10',
      '3',
      '4',
      '2',
      '1',
    ]);
  });

  it('should emit criteriaChange when search query is typed and clearSearch is clicked', () => {
    const searchInput = fixture.debugElement.query(By.css('#catalog-search-input')).nativeElement;

    searchInput.value = 'Quijote';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.lastCriteriaChange).toEqual({ searchQuery: 'Quijote' });

    // Clear button ('x') should now be visible
    const clearBtn = fixture.debugElement.query(By.css('button[title="Limpiar búsqueda"]'));
    expect(clearBtn).toBeTruthy();

    clearBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastCriteriaChange).toEqual({ searchQuery: '' });
  });

  it('should emit viewModeChange when clicking mode buttons', () => {
    const modeButtons = fixture.debugElement.queryAll(
      By.css('[role="group"][aria-label="Selector de tipo de vista"] button')
    );
    expect(modeButtons.length).toBe(3);

    // Click grid
    modeButtons[0].nativeElement.click();
    fixture.detectChanges();
    expect(host.lastViewModeChange).toBe('grid');

    // Click compact
    modeButtons[2].nativeElement.click();
    fixture.detectChanges();
    expect(host.lastViewModeChange).toBe('compact');
  });

  it('should emit sortChange when selecting an option from dropdown', () => {
    const select = fixture.debugElement.query(By.css('#catalog-sort-select')).nativeElement;

    select.value = 'title-asc';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastSortChange).toBe('title-asc');
  });

  it('should emit criteriaChange when clicking status chips', () => {
    const statusChips = fixture.debugElement.queryAll(By.css('[role="tablist"] button'));

    // Click 'Leyendo' chip (index 1)
    statusChips[1].nativeElement.click();
    fixture.detectChanges();

    expect(host.lastCriteriaChange).toEqual({ status: 'reading' });
    expect(statusChips[1].nativeElement.getAttribute('aria-selected')).toBe('true');
  });

  it('should toggle secondary filter drawer and reflect active secondary filters badge', () => {
    // Filter drawer should initially be collapsed (inert + aria-hidden="true")
    const drawerWrapper = fixture.debugElement.query(By.css('.grid.duration-200'));
    expect(drawerWrapper).toBeTruthy();
    expect(drawerWrapper.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(drawerWrapper.nativeElement.hasAttribute('inert')).toBe(true);

    // Toggle drawer open
    const toggleButton = fixture.debugElement.query(
      By.css('button[aria-label="Alternar panel de filtros secundarios"]')
    );
    toggleButton.nativeElement.click();
    fixture.detectChanges();

    // Drawer should now be expanded
    expect(drawerWrapper.nativeElement.getAttribute('aria-hidden')).toBe('false');
    expect(drawerWrapper.nativeElement.hasAttribute('inert')).toBe(false);

    const formatButtons = fixture.debugElement.queryAll(By.css('.flex.flex-wrap button'));
    expect(formatButtons.length).toBeGreaterThan(0);

    // Select format 'Ebook'
    const ebookButton = formatButtons.find((btn) =>
      btn.nativeElement.textContent.trim().includes('Ebook')
    );
    expect(ebookButton).toBeTruthy();
    ebookButton?.nativeElement.click();
    fixture.detectChanges();

    expect(host.lastCriteriaChange).toEqual({ format: 'Ebook' });

    // Active secondary badge should show 1
    const badge = fixture.debugElement.query(
      By.css('button[aria-label="Alternar panel de filtros secundarios"] span.rounded-full')
    );
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent.trim()).toBe('1');
  });

  it('should emit resetFilters when clicking reset filters button in drawer', () => {
    // Open drawer
    const toggleButton = fixture.debugElement.query(
      By.css('button[aria-label="Alternar panel de filtros secundarios"]')
    );
    toggleButton.nativeElement.click();
    fixture.detectChanges();

    // Activate a filter
    host.criteria.set({ ...DEFAULT_CATALOG_FILTER_CRITERIA, minRating: 4 });
    fixture.detectChanges();

    // Reset button should be visible
    const resetBtn = fixture.debugElement.query(By.css('button.text-blue-600'));
    expect(resetBtn).toBeTruthy();

    resetBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.resetFiltersCalled).toBe(true);
  });

  it('should render contextual quick reset button when filters are active and emit criteriaChange from mobile status selector', () => {
    // Initially no quick reset button
    expect(
      fixture.debugElement.query(By.css('button[aria-label="Restablecer filtros"]'))
    ).toBeNull();

    // Activate status filter via mobile select
    const mobileSelect = fixture.debugElement.query(By.css('#catalog-mobile-status-select'))
      .nativeElement as HTMLSelectElement;
    expect(mobileSelect).toBeTruthy();

    mobileSelect.value = 'completed';
    mobileSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.lastCriteriaChange).toEqual({ status: 'completed' });

    // Reflect active criteria in host and verify contextual reset button appears
    host.criteria.set({ ...DEFAULT_CATALOG_FILTER_CRITERIA, status: 'completed' });
    fixture.detectChanges();

    const quickResetBtn = fixture.debugElement.query(
      By.css('button[aria-label="Restablecer filtros"]')
    );
    expect(quickResetBtn).toBeTruthy();

    quickResetBtn.nativeElement.click();
    fixture.detectChanges();
    expect(host.resetFiltersCalled).toBe(true);
  });
});
