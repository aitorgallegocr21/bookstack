import { BookStatus } from '../../books/models/book.model';

export type AnalyticsPeriodMode = 'current-year' | 'last-12-months' | 'all-time' | 'specific-year';

export type AnalyticsTrendMetric = 'pages' | 'books' | 'time';

export type AnalyticsFormatKey = 'physical' | 'ebook' | 'audiobook';

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface AnalyticsKpiSummary {
  completedBooks: number;
  completionRatePercent: number;
  pagesRead: number;
  averagePagesPerDay: number;
  totalTimeMinutes: number;
  averageSpeedPagesPerHour: number;
  activeDaysCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface AnalyticsTrendPoint {
  key: string;
  label: string;
  pages: number;
  books: number;
  timeMinutes: number;
}

export interface FormatDistributionItem {
  formatKey: AnalyticsFormatKey;
  count: number;
  percentage: number;
  pages: number;
}

export interface StatusDistributionItem {
  status: BookStatus;
  count: number;
  percentage: number;
}

export interface StatusDistributionSummary {
  items: StatusDistributionItem[];
  completionRatePercent: number;
  abandonmentRatePercent: number;
}

export interface RatingBucketItem {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface RatingDistributionSummary {
  averageRating: number;
  ratedBooksCount: number;
  buckets: RatingBucketItem[];
}

export interface AuthorRankItem {
  author: string;
  booksCount: number;
  pagesRead: number;
}

export interface WeekdayPaceItem {
  dayKey: WeekdayKey;
  pages: number;
  sessionsCount: number;
  percentageOfPeak: number;
  isPeakDay: boolean;
}

export interface AnalyticsHighlights {
  bestDay: { date: string; pages: number } | null;
  longestBookCompleted: { title: string; author: string; pages: number } | null;
  averageDaysToFinishBook: number | null;
  topRatedBook: { title: string; author: string; rating: number } | null;
}
