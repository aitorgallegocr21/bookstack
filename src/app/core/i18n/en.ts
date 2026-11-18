import { EN_ABOUT } from './domains/about.i18n';
import { EN_ANALYTICS } from './domains/analytics.i18n';
import { EN_BOOKS } from './domains/books.i18n';
import { EN_DASHBOARD } from './domains/dashboard.i18n';
import { EN_SERIES } from './domains/series.i18n';
import { EN_SETTINGS } from './domains/settings.i18n';
import { EN_SHELL } from './domains/shell.i18n';
import { TranslationDictionary } from './i18n.types';

export const EN_TRANSLATIONS: TranslationDictionary = {
  ...EN_SHELL,
  ...EN_DASHBOARD,
  ...EN_BOOKS,
  ...EN_ANALYTICS,
  ...EN_SERIES,
  ...EN_SETTINGS,
  ...EN_ABOUT,
};
