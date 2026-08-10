import { Routes } from '@angular/router';
import { BooksPage } from './features/books/pages/books-page/books-page';

export const routes: Routes = [
  {
    path: 'books',
    component: BooksPage
  },
  {
    path: '',
    redirectTo: '/books',
    pathMatch: 'full'
  }
];
