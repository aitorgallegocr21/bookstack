export type SupportedLocale = 'es' | 'en';

export interface TranslationDictionary {
  nav: {
    home: string;
    books: string;
    stats: string;
    settings: string;
    about: string;
    github: string;
    addBook: string;
    createBookAria: string;
    collapseSidebar: string;
    expandSidebar: string;
    lightTheme: string;
    darkTheme: string;
    switchToLight: string;
    switchToDark: string;
    mainMenuAria: string;
    bottomNavAria: string;
  };
  status: {
    pending: string;
    reading: string;
    completed: string;
    abandoned: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    metricsAria: string;
    statsAria: string;
    books: string;
    reading: string;
    completed: string;
    pages: string;
    speed: string;
    pagesPerHourUnit: string;
    statusDistribution: string;
    monthlyActivity: string;
    noMonthlyLogs: string;
  };
  books: {
    title: string;
    subtitle: string;
    listAria: string;
    noFormat: string;
    pagesUnit: string;
    noRating: string;
    logAction: string;
    logReadingAria: string;
    viewDetails: string;
    edit: string;
    delete: string;
    emptyState: string;
    confirmDeleteBook: string;
    confirmDeleteLog: string;
  };
  common: {
    save: string;
    saving: string;
    cancel: string;
    close: string;
  };
}
