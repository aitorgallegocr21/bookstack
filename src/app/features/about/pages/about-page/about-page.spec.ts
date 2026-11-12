import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AboutPage } from './about-page';

describe('AboutPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AboutPage],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render localized content in Spanish and update reactively when locale switches to English', () => {
    const fixture = TestBed.createComponent(AboutPage);
    const i18n = TestBed.inject(I18nService);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Acerca de BookStack');

    i18n.setLocale('en');
    fixture.detectChanges();

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('About BookStack');
    expect(root.textContent).toContain('Local-First Manifesto');
  });
});
