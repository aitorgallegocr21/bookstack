export interface AnalyticsI18n {
  stats: {
    title: string;
    subtitle: string;
    placeholderNote: string;
    periods: {
      groupAria: string;
      currentYear: string;
      last12Months: string;
      allTime: string;
      specificYearLabel: string;
      specificYearAria: string;
    };
    kpis: {
      completedBooks: string;
      completionRate: string;
      pagesRead: string;
      pagesPerDay: string;
      readingTime: string;
      pagesPerHour: string;
      streakAndConsistency: string;
      activeDays: string;
      bestStreak: string;
      currentStreak: string;
      daysUnit: string;
      hoursShort: string;
      minutesShort: string;
    };
    velocity: {
      title: string;
      subtitle: string;
      metricsAria: string;
      pagesMetric: string;
      booksMetric: string;
      timeMetric: string;
      periodTotal: string;
      periodAverage: string;
      averageLineLabel: string;
      emptyPeriod: string;
      selectedBucketLabel: string;
      pagesUnit: string;
      booksUnit: string;
      minutesUnit: string;
    };
    composition: {
      sectionTitle: string;
      formatsTitle: string;
      formatsSubtitle: string;
      totalBooksLabel: string;
      statusTitle: string;
      statusSubtitle: string;
      completionRateLabel: string;
      abandonmentRateLabel: string;
      ratingsTitle: string;
      ratingsSubtitle: string;
      averageRatingLabel: string;
      ratedBooksCountLabel: string;
      noRatingsYet: string;
      topAuthorsTitle: string;
      topAuthorsSubtitle: string;
      noAuthorsYet: string;
      authorBooksUnit: string;
      authorPagesUnit: string;
    };
    habits: {
      sectionTitle: string;
      weekdayTitle: string;
      weekdaySubtitle: string;
      peakDayBadge: string;
      sessionsUnit: string;
      noSessionsYet: string;
      highlightsTitle: string;
      highlightsSubtitle: string;
      bestDayTitle: string;
      bestDayEmpty: string;
      longestBookTitle: string;
      longestBookEmpty: string;
      avgDaysTitle: string;
      avgDaysUnit: string;
      avgDaysEmpty: string;
      topRatedTitle: string;
      topRatedEmpty: string;
    };
    emptyState: {
      title: string;
      description: string;
      ctaAddBook: string;
    };
  };
}

export const ES_ANALYTICS: AnalyticsI18n = {
  stats: {
    title: 'Estadísticas',
    subtitle: 'Análisis detallado de tu actividad de lectura.',
    placeholderNote:
      'Los gráficos avanzados y métricas extendidas se implementarán en próximas fases.',
    periods: {
      groupAria: 'Selector de período de analítica',
      currentYear: 'Este año',
      last12Months: 'Últimos 12 meses',
      allTime: 'Todo el historial',
      specificYearLabel: 'Año',
      specificYearAria: 'Seleccionar año específico',
    },
    kpis: {
      completedBooks: 'Libros completados',
      completionRate: 'Tasa de finalización',
      pagesRead: 'Páginas leídas',
      pagesPerDay: 'págs/día',
      readingTime: 'Tiempo de lectura',
      pagesPerHour: 'págs/h',
      streakAndConsistency: 'Racha y constancia',
      activeDays: 'días activos',
      bestStreak: 'Mejor racha',
      currentStreak: 'Racha actual',
      daysUnit: 'días',
      hoursShort: 'h',
      minutesShort: 'm',
    },
    velocity: {
      title: 'Velocidad y tendencia temporal',
      subtitle: 'Evolución de tu lectura en el período seleccionado.',
      metricsAria: 'Métrica del gráfico de tendencia',
      pagesMetric: 'Páginas',
      booksMetric: 'Libros',
      timeMetric: 'Tiempo',
      periodTotal: 'Total del período',
      periodAverage: 'Media',
      averageLineLabel: 'Media',
      emptyPeriod: 'Sin actividad registrada para esta métrica en el período.',
      selectedBucketLabel: 'Detalle seleccionado',
      pagesUnit: 'págs',
      booksUnit: 'libros',
      minutesUnit: 'min',
    },
    composition: {
      sectionTitle: 'Composición de la biblioteca',
      formatsTitle: 'Distribución por formato',
      formatsSubtitle: 'Proporción y páginas leídas según el soporte.',
      totalBooksLabel: 'libros',
      statusTitle: 'Estado del catálogo',
      statusSubtitle: 'Balance entre lecturas completadas, en curso y pendientes.',
      completionRateLabel: 'Finalización',
      abandonmentRateLabel: 'Abandono',
      ratingsTitle: 'Valoraciones',
      ratingsSubtitle: 'Distribución de puntuaciones sobre 10.',
      averageRatingLabel: 'Nota media',
      ratedBooksCountLabel: 'libros valorados',
      noRatingsYet: 'Aún no hay libros valorados en este período.',
      topAuthorsTitle: 'Autores más leídos',
      topAuthorsSubtitle: 'Clasificación por libros y páginas leídas.',
      noAuthorsYet: 'Sin autores registrados en este período.',
      authorBooksUnit: 'libros',
      authorPagesUnit: 'págs',
    },
    habits: {
      sectionTitle: 'Hábitos e hitos de lectura',
      weekdayTitle: 'Ritmo por día de la semana',
      weekdaySubtitle: 'Actividad acumulada según tus sesiones registradas.',
      peakDayBadge: 'Día estrella',
      sessionsUnit: 'sesiones',
      noSessionsYet:
        'Registra sesiones de lectura con fecha para descubrir tu ritmo semanal por días.',
      highlightsTitle: 'Hitos del período',
      highlightsSubtitle: 'Marcas personales dentro del rango temporal activo.',
      bestDayTitle: 'Día de mayor lectura',
      bestDayEmpty: 'Sin sesiones o registros diarios en el período.',
      longestBookTitle: 'Libro más largo completado',
      longestBookEmpty: 'Aún no has completado libros en este período.',
      avgDaysTitle: 'Tiempo medio por libro',
      avgDaysUnit: 'días',
      avgDaysEmpty: 'Añade fecha de inicio y fin al completar libros para calcularlo.',
      topRatedTitle: 'Libro mejor valorado',
      topRatedEmpty: 'Sin libros puntuados en este período.',
    },
    emptyState: {
      title: 'Tu panel de analítica está esperando tu primer libro',
      description:
        'Añade libros a tu biblioteca y registra sesiones de lectura para desbloquear gráficos de velocidad, distribución por formatos, rachas e hitos personales.',
      ctaAddBook: 'Añadir primer libro',
    },
  },
};

export const EN_ANALYTICS: AnalyticsI18n = {
  stats: {
    title: 'Statistics',
    subtitle: 'Detailed analytics of your reading activity.',
    placeholderNote: 'Advanced charts and extended metrics will be added in upcoming phases.',
    periods: {
      groupAria: 'Analytics period selector',
      currentYear: 'This year',
      last12Months: 'Last 12 months',
      allTime: 'All time',
      specificYearLabel: 'Year',
      specificYearAria: 'Select specific year',
    },
    kpis: {
      completedBooks: 'Completed books',
      completionRate: 'Completion rate',
      pagesRead: 'Pages read',
      pagesPerDay: 'pages/day',
      readingTime: 'Reading time',
      pagesPerHour: 'pages/h',
      streakAndConsistency: 'Streak & consistency',
      activeDays: 'active days',
      bestStreak: 'Best streak',
      currentStreak: 'Current streak',
      daysUnit: 'days',
      hoursShort: 'h',
      minutesShort: 'm',
    },
    velocity: {
      title: 'Reading velocity & trends',
      subtitle: 'Progress over the selected timeframe.',
      metricsAria: 'Trend chart metric',
      pagesMetric: 'Pages',
      booksMetric: 'Books',
      timeMetric: 'Time',
      periodTotal: 'Period total',
      periodAverage: 'Average',
      averageLineLabel: 'Avg',
      emptyPeriod: 'No activity recorded for this metric in the selected period.',
      selectedBucketLabel: 'Selected breakdown',
      pagesUnit: 'pages',
      booksUnit: 'books',
      minutesUnit: 'min',
    },
    composition: {
      sectionTitle: 'Library composition',
      formatsTitle: 'Format distribution',
      formatsSubtitle: 'Share and pages read across book formats.',
      totalBooksLabel: 'books',
      statusTitle: 'Catalog status',
      statusSubtitle: 'Balance across completed, active, and queued reads.',
      completionRateLabel: 'Completion',
      abandonmentRateLabel: 'Dropped',
      ratingsTitle: 'Ratings',
      ratingsSubtitle: 'Score distribution out of 10.',
      averageRatingLabel: 'Average score',
      ratedBooksCountLabel: 'rated books',
      noRatingsYet: 'No rated books in this period yet.',
      topAuthorsTitle: 'Top authors',
      topAuthorsSubtitle: 'Ranked by books and pages read.',
      noAuthorsYet: 'No authors recorded in this period.',
      authorBooksUnit: 'books',
      authorPagesUnit: 'pages',
    },
    habits: {
      sectionTitle: 'Reading habits & milestones',
      weekdayTitle: 'Weekday reading pace',
      weekdaySubtitle: 'Cumulative activity across your logged sessions.',
      peakDayBadge: 'Peak day',
      sessionsUnit: 'sessions',
      noSessionsYet: 'Log dated reading sessions to uncover your weekly pace by weekday.',
      highlightsTitle: 'Period highlights',
      highlightsSubtitle: 'Personal records within the active timeframe.',
      bestDayTitle: 'Peak reading day',
      bestDayEmpty: 'No daily logs recorded in this period.',
      longestBookTitle: 'Longest completed book',
      longestBookEmpty: 'No completed books in this period yet.',
      avgDaysTitle: 'Average days per book',
      avgDaysUnit: 'days',
      avgDaysEmpty: 'Set start and end dates on completed books to compute this.',
      topRatedTitle: 'Highest-rated book',
      topRatedEmpty: 'No rated books in this period.',
    },
    emptyState: {
      title: 'Your analytics suite is waiting for your first book',
      description:
        'Add books to your library and log reading sessions to unlock velocity charts, format breakdowns, streaks, and personal milestones.',
      ctaAddBook: 'Add first book',
    },
  },
};
