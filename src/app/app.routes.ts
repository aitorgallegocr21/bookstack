import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage)
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/pages/books-page/books-page').then((m) => m.BooksPage)
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/analytics/pages/stats-page/stats-page').then((m) => m.StatsPage)
  },
  {
    path: 'series',
    loadComponent: () =>
      import('./features/series/pages/series-page/series-page').then((m) => m.SeriesPage)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/pages/settings-page/settings-page').then((m) => m.SettingsPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
