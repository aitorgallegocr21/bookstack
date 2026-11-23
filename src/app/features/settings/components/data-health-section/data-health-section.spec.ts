import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DataHealthReport } from '../../models/data-health.model';
import { DataHealthService } from '../../services/data-health.service';
import { DataHealthSectionComponent } from './data-health-section';

function makeHealthyReport(): DataHealthReport {
  return {
    totalIssuesCount: 0,
    autoFixableCount: 0,
    healthScorePercent: 100,
    issuesByCategory: {
      'temporal-anomaly': [],
      'progress-mismatch': [],
      'duplicate-book': [],
      'fragmented-saga': [],
    },
    allIssues: [],
  };
}

describe('DataHealthSectionComponent', () => {
  let fixture: ComponentFixture<DataHealthSectionComponent>;
  let reportSignal: ReturnType<typeof signal<DataHealthReport>>;
  let i18n: I18nService;

  const applyIssueFixMock = vi.fn<(id: string) => Promise<boolean>>();
  const applyAllAutoFixesMock = vi.fn<() => Promise<number>>();

  beforeEach(async () => {
    vi.clearAllMocks();
    reportSignal = signal<DataHealthReport>(makeHealthyReport());
    applyIssueFixMock.mockResolvedValue(true);
    applyAllAutoFixesMock.mockResolvedValue(1);

    await TestBed.configureTestingModule({
      imports: [DataHealthSectionComponent],
      providers: [
        {
          provide: DataHealthService,
          useValue: {
            report: reportSignal.asReadonly(),
            applyIssueFix: applyIssueFixMock,
            applyAllAutoFixes: applyAllAutoFixesMock,
          },
        },
      ],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLocale('es');

    fixture = TestBed.createComponent(DataHealthSectionComponent);
    fixture.detectChanges();
  });

  it('renders 100% healthy state when no issues are detected', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="data-health-healthy-state"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="data-health-score-badge"]')?.textContent).toContain(
      '100% Saludable'
    );
    expect(el.querySelector('[data-testid="data-health-fix-all-btn"]')).toBeNull();
  });

  it('renders detected issues, toggles category collapse, and runs single and bulk fixes', async () => {
    const issue = {
      id: 'temporal-book-pubyear:b1',
      category: 'temporal-anomaly' as const,
      severity: 'high' as const,
      title: 'Año de publicación anómalo: Dune',
      description: 'El año de publicación (2925) está fuera del rango válido.',
      affectedBookIds: ['b1'],
      suggestedValueLabel: '2925 → 2025',
      canAutoFix: true,
    };

    reportSignal.set({
      totalIssuesCount: 1,
      autoFixableCount: 1,
      healthScorePercent: 85,
      issuesByCategory: {
        'temporal-anomaly': [issue],
        'progress-mismatch': [],
        'duplicate-book': [],
        'fragmented-saga': [],
      },
      allIssues: [issue],
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="data-health-healthy-state"]')).toBeNull();
    expect(
      el.querySelector('[data-testid="data-health-issue-temporal-book-pubyear:b1"]')
    ).toBeTruthy();

    const fixBtn = el.querySelector(
      '[data-testid="data-health-fix-btn-temporal-book-pubyear:b1"]'
    ) as HTMLButtonElement;
    fixBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(applyIssueFixMock).toHaveBeenCalledWith('temporal-book-pubyear:b1');
    expect(el.querySelector('[data-testid="data-health-feedback"]')?.textContent).toContain(
      i18n.t().settings.dataHealth.fixedSingleMessage
    );

    const fixAllBtn = el.querySelector(
      '[data-testid="data-health-fix-all-btn"]'
    ) as HTMLButtonElement;
    fixAllBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(applyAllAutoFixesMock).toHaveBeenCalledTimes(1);

    const toggleBtn = el.querySelector(
      '[data-testid="data-health-category-toggle-temporal-anomaly"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();
    expect(
      el.querySelector('[data-testid="data-health-issue-temporal-book-pubyear:b1"]')
    ).toBeNull();
  });
});
