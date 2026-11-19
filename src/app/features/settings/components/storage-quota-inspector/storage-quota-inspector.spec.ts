import { TestBed } from '@angular/core/testing';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import { StorageQuotaInspectorComponent } from './storage-quota-inspector';

function makeSummary(overrides: Partial<StorageBreakdownSummary> = {}): StorageBreakdownSummary {
  return {
    engine: 'indexeddb',
    totalBookstackBytes: 1000,
    booksMetadataBytes: 400,
    coversBase64Bytes: 300,
    readingLogsBytes: 200,
    preferencesBytes: 100,
    booksCount: 5,
    coversCount: 2,
    readingLogsCount: 12,
    browserUsageBytes: 2048,
    browserQuotaBytes: 10 * 1024 * 1024,
    healthStatus: 'healthy',
    ...overrides,
  };
}

describe('StorageQuotaInspectorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [StorageQuotaInspectorComponent],
    }).compileComponents();
  });

  it('should format bytes cleanly across B, KB, and MB', () => {
    const fixture = TestBed.createComponent(StorageQuotaInspectorComponent);
    fixture.componentRef.setInput('breakdown', makeSummary());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.formatBytes(0)).toBe('0 B');
    expect(component.formatBytes(512)).toBe('512 B');
    expect(component.formatBytes(1536)).toBe('1.5 KB');
    expect(component.formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('should render proportional segment widths and handle zero total safely', () => {
    const fixture = TestBed.createComponent(StorageQuotaInspectorComponent);
    fixture.componentRef.setInput('breakdown', makeSummary());
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const segMeta = root.querySelector('[data-testid="storage-segment-metadata"]') as HTMLElement;
    const segCovers = root.querySelector('[data-testid="storage-segment-covers"]') as HTMLElement;
    const segLogs = root.querySelector('[data-testid="storage-segment-logs"]') as HTMLElement;
    const segPrefs = root.querySelector(
      '[data-testid="storage-segment-preferences"]'
    ) as HTMLElement;

    expect(segMeta.style.width).toBe('40%');
    expect(segCovers.style.width).toBe('30%');
    expect(segLogs.style.width).toBe('20%');
    expect(segPrefs.style.width).toBe('10%');

    fixture.componentRef.setInput(
      'breakdown',
      makeSummary({
        totalBookstackBytes: 0,
        booksMetadataBytes: 0,
        coversBase64Bytes: 0,
        readingLogsBytes: 0,
        preferencesBytes: 0,
      })
    );
    fixture.detectChanges();

    expect(segMeta.style.width).toBe('0%');
    expect(segCovers.style.width).toBe('0%');
  });

  it('should render active storage engine badge for indexeddb and localstorage', () => {
    const fixture = TestBed.createComponent(StorageQuotaInspectorComponent);
    fixture.componentRef.setInput('breakdown', makeSummary({ engine: 'indexeddb' }));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const engineBadge = root.querySelector('[data-testid="storage-engine-badge"]') as HTMLElement;
    expect(engineBadge.textContent).toContain('IndexedDB');

    fixture.componentRef.setInput('breakdown', makeSummary({ engine: 'localstorage' }));
    fixture.detectChanges();
    expect(engineBadge.textContent).toContain('LocalStorage (respaldo)');
  });

  it('should apply health status badge classes for healthy, moderate, and near-limit', () => {
    const fixture = TestBed.createComponent(StorageQuotaInspectorComponent);
    fixture.componentRef.setInput('breakdown', makeSummary({ healthStatus: 'healthy' }));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const healthBadge = root.querySelector('[data-testid="storage-health-badge"]') as HTMLElement;
    expect(healthBadge.className).toContain('emerald');
    expect(healthBadge.textContent?.trim()).toBe('Saludable');

    fixture.componentRef.setInput('breakdown', makeSummary({ healthStatus: 'moderate' }));
    fixture.detectChanges();
    expect(healthBadge.className).toContain('amber');
    expect(healthBadge.textContent?.trim()).toBe('Moderado');

    fixture.componentRef.setInput('breakdown', makeSummary({ healthStatus: 'near-limit' }));
    fixture.detectChanges();
    expect(healthBadge.className).toContain('rose');
    expect(healthBadge.textContent?.trim()).toBe('Cerca del límite');
  });

  it('should display browser quota or fallback text and emit refreshRequested on click', () => {
    const fixture = TestBed.createComponent(StorageQuotaInspectorComponent);
    fixture.componentRef.setInput('breakdown', makeSummary());
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const quotaEl = root.querySelector('[data-testid="storage-browser-quota"]') as HTMLElement;
    expect(quotaEl.textContent?.trim()).toBe('2.0 KB / 10.0 MB');

    fixture.componentRef.setInput(
      'breakdown',
      makeSummary({ browserUsageBytes: null, browserQuotaBytes: null })
    );
    fixture.detectChanges();
    expect(quotaEl.textContent?.trim()).toBe('No disponible');

    let refreshCount = 0;
    fixture.componentInstance.refreshRequested.subscribe(() => {
      refreshCount++;
    });

    const refreshBtn = root.querySelector(
      '[data-testid="storage-refresh-btn"]'
    ) as HTMLButtonElement;
    refreshBtn.click();
    expect(refreshCount).toBe(1);
  });
});
