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
    expect(root.textContent).toContain('Privacidad y Permisos del Dispositivo');
    expect(root.textContent).toContain('Aviso Legal, Licencia y Atribuciones');
    expect(root.textContent).toContain('Copyright © 2026 Aitor Gallego-Casilda Romero');
    expect(root.textContent).toContain('Open Library');
    expect(root.textContent).toContain('Google Books');
    expect(root.textContent).toContain('Aprende y deja aprender.');
    expect(root.textContent).toContain('Código fuente');
    expect(root.textContent).toContain('Web personal');

    i18n.setLocale('en');
    fixture.detectChanges();

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('About BookStack');
    expect(root.textContent).toContain('Local-First Manifesto');
    expect(root.textContent).toContain('Privacy & Device Permissions');
    expect(root.textContent).toContain('Legal Notice, License & Attributions');
    expect(root.textContent).toContain('MIT License');
    expect(root.textContent).toContain('barcode-detector (ZXing-WASM)');
    expect(root.textContent).toContain('Learn and let learn.');
    expect(root.textContent).toContain('Source Code');
    expect(root.textContent).toContain('Personal Website');
  });

  it('should render all four author profile external links with rel="noopener noreferrer"', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const expectedUrls = [
      'https://github.com/aitorgallegocr21',
      'https://aitorgallegocr21.github.io/personal-website/',
      'https://www.instagram.com/aitorgallegoo_cr/',
      'https://github.com/aitorgallegocr21/bookstack',
    ];

    for (const url of expectedUrls) {
      const anchor = root.querySelector(`a[href="${url}"]`) as HTMLAnchorElement | null;
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('should render the official BrandLogoComponent in the hero header', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const brandLogo = root.querySelector('header app-brand-logo svg');
    expect(brandLogo).not.toBeNull();
  });
});
