import { Pipe, PipeTransform } from '@angular/core';
import { ReadingLog } from '../../models/book.model';

@Pipe({
  name: 'logsByBook',
  standalone: true,
  pure: true
})
export class LogsByBookPipe implements PipeTransform {
  transform(logs: ReadingLog[], bookId: string): ReadingLog[] {
    if (!logs || !bookId) {
      return [];
    }
    return logs.filter((log) => log.bookId === bookId);
  }
}
