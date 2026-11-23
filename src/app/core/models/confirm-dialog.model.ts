export type ConfirmDialogSeverity = 'danger' | 'warning' | 'info';

export type ConfirmSuppressionKey = 'deleteReadingLog' | 'unlinkSagaBook' | 'manualAntiqueYear';

export const CONFIRM_SUPPRESSION_KEYS: readonly ConfirmSuppressionKey[] = [
  'deleteReadingLog',
  'unlinkSagaBook',
  'manualAntiqueYear',
];

export function isConfirmSuppressionKey(value: unknown): value is ConfirmSuppressionKey {
  return (
    typeof value === 'string' && (CONFIRM_SUPPRESSION_KEYS as readonly string[]).includes(value)
  );
}

export interface ConfirmDialogEntityPreview {
  title: string;
  subtitle?: string;
  badge?: string;
  coverUrl?: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: ConfirmDialogSeverity;
  entityPreview?: ConfirmDialogEntityPreview;
  suppressibleKey?: ConfirmSuppressionKey;
  suppressCheckboxLabel?: string;
}

export interface ConfirmDialogState {
  id: number;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity: ConfirmDialogSeverity;
  entityPreview?: ConfirmDialogEntityPreview;
  suppressibleKey?: ConfirmSuppressionKey;
  suppressCheckboxLabel?: string;
}
