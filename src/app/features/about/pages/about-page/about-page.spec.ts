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

    i18n.setLocale('en');
    fixture.detectChanges();

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('About BookStack');
    expect(root.textContent).toContain('Local-First Manifesto');
    expect(root.textContent).toContain('Privacy & Device Permissions');
    expect(root.textContent).toContain('Legal Notice, License & Attributions');
    expect(root.textContent).toContain('MIT License');
    expect(root.textContent).toContain('html5-qrcode');
  });
});
