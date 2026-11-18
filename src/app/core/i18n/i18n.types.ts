import { AboutI18n } from './domains/about.i18n';
import { AnalyticsI18n } from './domains/analytics.i18n';
import { BooksI18n } from './domains/books.i18n';
import { DashboardI18n } from './domains/dashboard.i18n';
import { SeriesI18n } from './domains/series.i18n';
import { SettingsI18n } from './domains/settings.i18n';
import { ShellI18n } from './domains/shell.i18n';

export type SupportedLocale = 'es' | 'en';

export interface TranslationDictionary
  extends ShellI18n, DashboardI18n, BooksI18n, AnalyticsI18n, SeriesI18n, SettingsI18n, AboutI18n {}
