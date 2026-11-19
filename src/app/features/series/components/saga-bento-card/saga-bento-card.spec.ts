import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Book } from '../../../books/models/book.model';
import { SagaAggregation } from '../../models/series.model';
import { SagaBentoCardComponent } from './saga-bento-card';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: overrides.id ?? 'book-1',
    title: overrides.title ?? 'El imperio final',
    author: overrides.author ?? 'Brandon Sanderson',
    status: overrides.status ?? 'reading',
    totalPages: overrides.totalPages ?? 600,
    currentPage: overrides.currentPage ?? 300,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function makeSaga(overrides: Partial<SagaAggregation> = {}): SagaAggregation {
  const b1 = makeBook({
    id: 'b1',
    title: 'Libro 1',
    status: 'completed',
    totalPages: 500,
    currentPage: 500,
    series: { id: 'saga-1', name: 'Nacidos de la bruma', volumeNumber: 1 },
  });
  const b2 = makeBook({
    id: 'b2',
    title: 'Libro 2',
    status: 'reading',
    totalPages: 600,
    currentPage: 300,
    series: { id: 'saga-1', name: 'Nacidos de la bruma', volumeNumber: 2 },
  });

  return {
    id: 'saga-1',
    normalizedKey: 'nacidos de la bruma',
    name: 'Nacidos de la bruma',
    authors: ['Brandon Sanderson'],
    books: [b1, b2],
    timelineSlots: [
      { volumeNumber: 1, kind: 'owned', book: b1 },
      { volumeNumber: 2, kind: 'owned', book: b2 },
    ],
    ownedCount: 2,
    totalTargetVolumes: 2,
    completedCount: 1,
    readingCount: 1,
    pendingCount: 0,
    abandonedCount: 0,
    missingVolumes: [],
    totalPages: 1100,
    readPages: 800,
    progressPercent: 73,
    totalReadingMinutes: 125,
    nextBookToRead: b2,
    statusCategory: 'reading',
    bentoScale: 'compact',
    lastActivityAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('SagaBentoCardComponent', () => {
  let fixture: ComponentFixture<SagaBentoCardComponent>;
  let component: SagaBentoCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SagaBentoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SagaBentoCardComponent);
    component = fixture.componentInstance;
  });

  it('should apply compact, medium, and showcase bento grid host classes', () => {
    fixture.componentRef.setInput('saga', makeSaga({ bentoScale: 'compact' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.className).toContain('col-span-1');
    expect(fixture.nativeElement.className).toContain('md:col-span-6');

    fixture.componentRef.setInput('saga', makeSaga({ bentoScale: 'medium' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.className).toContain('col-span-full');
    expect(fixture.nativeElement.className).not.toContain('md:row-span-2');

    fixture.componentRef.setInput('saga', makeSaga({ bentoScale: 'showcase' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.className).toContain('col-span-full');
    expect(fixture.nativeElement.className).not.toContain('md:row-span-2');
  });

  it('should wrap cover shelves without horizontal scroll and avoid truncating titles or authors', () => {
    for (const scale of ['compact', 'medium', 'showcase'] as const) {
      fixture.componentRef.setInput('saga', makeSaga({ bentoScale: scale }));
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2') as HTMLElement;
      expect(heading.className).toContain('break-words');
      expect(heading.className).not.toContain('truncate');
      expect(heading.className).not.toContain('line-clamp-2');

      const author = fixture.nativeElement.querySelector('p') as HTMLElement;
      expect(author.className).toContain('break-words');
      expect(author.className).not.toContain('truncate');

      if (scale !== 'compact') {
        expect(fixture.nativeElement.querySelector('.overflow-x-auto')).toBeNull();
        expect(fixture.nativeElement.querySelector('.flex-wrap')).toBeTruthy();
      }
    }
  });

  it('should emit openBook without bubbling to openSaga when clicking a book thumbnail', () => {
    const saga = makeSaga({ bentoScale: 'compact' });
    fixture.componentRef.setInput('saga', saga);
    fixture.detectChanges();

    const openSagaSpy = vi.fn();
    const openBookSpy = vi.fn();
    component.openSaga.subscribe(openSagaSpy);
    component.openBook.subscribe(openBookSpy);

    const bookBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Libro 1"]'
    ) as HTMLButtonElement;
    expect(bookBtn).toBeTruthy();
    bookBtn.click();

    expect(openBookSpy).toHaveBeenCalledWith('b1');
    expect(openSagaSpy).not.toHaveBeenCalled();
  });

  it('should emit continueBook without bubbling to openSaga when clicking smart CTA', () => {
    const saga = makeSaga({ bentoScale: 'compact' });
    fixture.componentRef.setInput('saga', saga);
    fixture.detectChanges();

    const openSagaSpy = vi.fn();
    const continueSpy = vi.fn();
    component.openSaga.subscribe(openSagaSpy);
    component.continueBook.subscribe(continueSpy);

    const ctaBtn = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((btn) => btn.textContent?.includes('Continuar lectura'));
    expect(ctaBtn).toBeTruthy();
    ctaBtn!.click();

    expect(continueSpy).toHaveBeenCalledWith(saga.nextBookToRead);
    expect(openSagaSpy).not.toHaveBeenCalled();
  });

  it('should render dashed missing volume slot in medium scale and emit addMissingVolume', () => {
    const b1 = makeBook({
      id: 'b1',
      title: 'Libro 1',
      series: { id: 'saga-x', name: 'Saga X', volumeNumber: 1 },
    });
    const b3 = makeBook({
      id: 'b3',
      title: 'Libro 3',
      series: { id: 'saga-x', name: 'Saga X', volumeNumber: 3 },
    });
    const saga = makeSaga({
      name: 'Saga X',
      bentoScale: 'medium',
      books: [b1, b3],
      missingVolumes: [2],
      timelineSlots: [
        { volumeNumber: 1, kind: 'owned', book: b1 },
        { volumeNumber: 2, kind: 'missing' },
        { volumeNumber: 3, kind: 'owned', book: b3 },
      ],
    });
    fixture.componentRef.setInput('saga', saga);
    fixture.detectChanges();

    const openSagaSpy = vi.fn();
    const addMissingSpy = vi.fn();
    component.openSaga.subscribe(openSagaSpy);
    component.addMissingVolume.subscribe(addMissingSpy);

    const missingBtn = fixture.nativeElement.querySelector(
      'button[aria-label="+ Añadir Vol. 2"]'
    ) as HTMLButtonElement;
    expect(missingBtn).toBeTruthy();
    missingBtn.click();

    expect(addMissingSpy).toHaveBeenCalledWith({ seriesName: 'Saga X', volumeNumber: 2 });
    expect(openSagaSpy).not.toHaveBeenCalled();
  });

  it('should render aggregated metrics strip in showcase scale and up-to-date badge when nextBookToRead is null', () => {
    const saga = makeSaga({
      bentoScale: 'showcase',
      averageRating: 9.2,
      totalReadingMinutes: 135,
      readPages: 2400,
      totalPages: 2400,
      progressPercent: 100,
      nextBookToRead: null,
      metadata: {
        id: 'm1',
        normalizedKey: 'nacidos de la bruma',
        name: 'Nacidos de la bruma',
        publicationStatus: 'completed',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    });
    fixture.componentRef.setInput('saga', saga);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2400 / 2400');
    expect(text).toContain('9.2/10');
    expect(text).toContain('2h 15m');
    expect(text).toContain('Finalizada');
    expect(text).toContain('Saga al día');
  });

  it('should emit openSaga when clicking the card container', () => {
    const saga = makeSaga();
    fixture.componentRef.setInput('saga', saga);
    fixture.detectChanges();

    const openSagaSpy = vi.fn();
    component.openSaga.subscribe(openSagaSpy);

    const article = fixture.nativeElement.querySelector('article') as HTMLElement;
    article.click();
    expect(openSagaSpy).toHaveBeenCalledWith(saga);
  });
});
