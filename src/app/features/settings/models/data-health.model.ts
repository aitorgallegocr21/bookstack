export type DataHealthIssueCategory =
  'temporal-anomaly' | 'progress-mismatch' | 'duplicate-book' | 'fragmented-saga';

export type DataHealthIssueSeverity = 'high' | 'medium' | 'low';

export interface DataHealthIssue {
  id: string;
  category: DataHealthIssueCategory;
  severity: DataHealthIssueSeverity;
  title: string;
  description: string;
  affectedBookIds: string[];
  affectedLogIds?: string[];
  suggestedValueLabel?: string;
  canAutoFix: boolean;
}

export interface DataHealthReport {
  totalIssuesCount: number;
  autoFixableCount: number;
  healthScorePercent: number;
  issuesByCategory: Record<DataHealthIssueCategory, DataHealthIssue[]>;
  allIssues: DataHealthIssue[];
}
