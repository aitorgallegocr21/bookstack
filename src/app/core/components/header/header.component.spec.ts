import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BooksService } from '../../../features/books/services/books.service';
import { ThemeService } from '../../services/theme.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render mobile banner with 44x44px interactive controls', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector('header[role="banner"]');
    expect(header).not.toBeNull();
    expect(header?.classList.contains('md:hidden')).toBe(true);

    const buttons = Array.from(
      root.querySelectorAll('header button, header a[aria-label="GitHub"]')
    );
    expect(buttons.length).toBe(3);
    for (const control of buttons) {
      expect(control.classList.contains('h-11')).toBe(true);
      expect(control.classList.contains('w-11')).toBe(true);
    }
  });

  it('should toggle theme and open create book modal from header buttons', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const themeService = TestBed.inject(ThemeService);
    const booksService = TestBed.inject(BooksService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const initialDark = themeService.isDark();
    const themeButton = root.querySelector('button[aria-pressed]') as HTMLButtonElement;
    themeButton.click();
    expect(themeService.isDark()).toBe(!initialDark);

    const addButton = root.querySelector(
      'button[aria-label="Crear nuevo libro"]'
    ) as HTMLButtonElement;
    addButton.click();
    expect(booksService.isCreateModalOpen()).toBe(true);
  });
});
