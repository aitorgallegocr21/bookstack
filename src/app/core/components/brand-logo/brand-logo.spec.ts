import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandLogoComponent } from './brand-logo';

describe('BrandLogoComponent', () => {
  let fixture: ComponentFixture<BrandLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandLogoComponent);
    fixture.detectChanges();
  });

  it('should render the 3-book stack SVG with default size 32 and accessible role', () => {
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('BookStack');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('BookStack');
  });

  it('should support custom size and optional wordmark with aria-hidden SVG', () => {
    fixture.componentRef.setInput('size', 48);
    fixture.componentRef.setInput('showWordmark', true);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('48');
    expect(svg.getAttribute('height')).toBe('48');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('BookStack');
  });
});
