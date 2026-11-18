import { ES_ABOUT } from './domains/about.i18n';
import { ES_ANALYTICS } from './domains/analytics.i18n';
import { ES_BOOKS } from './domains/books.i18n';
import { ES_DASHBOARD } from './domains/dashboard.i18n';
import { ES_SERIES } from './domains/series.i18n';
import { ES_SETTINGS } from './domains/settings.i18n';
import { ES_SHELL } from './domains/shell.i18n';
import { TranslationDictionary } from './i18n.types';

export const ES_TRANSLATIONS: TranslationDictionary = {
  ...ES_SHELL,
  ...ES_DASHBOARD,
  ...ES_BOOKS,
  ...ES_ANALYTICS,
  ...ES_SERIES,
  ...ES_SETTINGS,
  ...ES_ABOUT,
};
