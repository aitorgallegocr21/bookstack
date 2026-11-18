export interface DashboardI18n {
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
    currentlyReading: string;
    otherActiveReads: string;
    progress: string;
    currentPageLabel: string;
    updatePageAction: string;
    pageInputAria: string;
    openFullLogAction: string;
    openFullLogAria: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    addFirstBook: string;
    noActiveReadsTitle: string;
    noActiveReadsSubtitle: string;
    pickNextRead: string;
    startReadingAction: string;
    allCompletedTitle: string;
    allCompletedSubtitle: string;
    addNewBook: string;
    pageInputMustBeGreater: string;
    confirmCompletionTitle: string;
    confirmCompletionMessage: string;
    confirmCompletionAction: string;
    streakTitle: string;
    streakDaysLabel: string;
    streakTodayDone: string;
    streakTodayPending: string;
    longestStreakLabel: string;
    weekDays: {
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    };
    annualGoalsTitle: string;
    editGoalsAction: string;
    booksGoalLabel: string;
    pagesGoalLabel: string;
    recentActivityTitle: string;
    noRecentActivity: string;
    pagesReadBadge: string;
    minutesBadge: string;
    editGoalModalTitle: string;
    targetBooksInputLabel: string;
    targetPagesInputLabel: string;
  };
}

export const ES_DASHBOARD: DashboardI18n = {
  dashboard: {
    title: 'Resumen de lectura',
    subtitle: 'Tu actividad y progreso en un solo vistazo.',
    metricsAria: 'Resumen de lectura',
    statsAria: 'Estadísticas de lectura',
    books: 'Libros',
    reading: 'Leyendo',
    completed: 'Completados',
    pages: 'Páginas',
    speed: 'Velocidad',
    pagesPerHourUnit: 'pp/h',
    statusDistribution: 'Distribución por estado',
    monthlyActivity: 'Actividad mensual',
    noMonthlyLogs: 'Sin registros mensuales',
    currentlyReading: 'Leyendo ahora',
    otherActiveReads: 'Otras lecturas en curso',
    progress: 'Progreso',
    currentPageLabel: 'Página actual',
    updatePageAction: 'Actualizar',
    pageInputAria: 'Número de página actual',
    openFullLogAction: 'Añadir lectura detallada',
    openFullLogAria: 'Abrir registro completo de lectura',
    welcomeTitle: '¡Te damos la bienvenida a BookStack!',
    welcomeSubtitle:
      'Tu espacio privado y local para registrar tus lecturas y hábitos. Empieza añadiendo tu primer libro.',
    addFirstBook: 'Añadir mi primer libro',
    noActiveReadsTitle: 'Sin lecturas en curso',
    noActiveReadsSubtitle: 'Elige un libro de tu lista de pendientes para empezar a leer:',
    pickNextRead: 'Elige tu próxima lectura',
    startReadingAction: 'Empezar a leer',
    allCompletedTitle: '¡Biblioteca al día!',
    allCompletedSubtitle: 'Has completado todos tus libros registrados. ¡Enhorabuena!',
    addNewBook: 'Añadir nuevo libro',
    pageInputMustBeGreater: 'La página debe ser mayor a la actual',
    confirmCompletionTitle: '¿Has terminado este libro?',
    confirmCompletionMessage:
      'Estás a punto de registrar la página final. El libro pasará al estado Completado con fecha de hoy.',
    confirmCompletionAction: 'Sí, completar libro',
    streakTitle: 'Racha de lectura',
    streakDaysLabel: 'días seguidos',
    streakTodayDone: '¡Lectura de hoy completada!',
    streakTodayPending: 'Lee hoy para mantener la racha',
    longestStreakLabel: 'Récord histórico',
    weekDays: {
      mon: 'L',
      tue: 'M',
      wed: 'X',
      thu: 'J',
      fri: 'V',
      sat: 'S',
      sun: 'D',
    },
    annualGoalsTitle: 'Metas anuales',
    editGoalsAction: 'Editar metas',
    booksGoalLabel: 'Libros leídos',
    pagesGoalLabel: 'Páginas leídas',
    recentActivityTitle: 'Actividad reciente',
    noRecentActivity: 'Aún no has registrado sesiones de lectura.',
    pagesReadBadge: 'págs.',
    minutesBadge: 'min.',
    editGoalModalTitle: 'Configurar metas anuales',
    targetBooksInputLabel: 'Objetivo de libros',
    targetPagesInputLabel: 'Objetivo de páginas',
  },
};

export const EN_DASHBOARD: DashboardI18n = {
  dashboard: {
    title: 'Reading Overview',
    subtitle: 'Your reading activity and progress at a glance.',
    metricsAria: 'Reading summary',
    statsAria: 'Reading statistics',
    books: 'Books',
    reading: 'Reading',
    completed: 'Completed',
    pages: 'Pages',
    speed: 'Speed',
    pagesPerHourUnit: 'p/h',
    statusDistribution: 'Status distribution',
    monthlyActivity: 'Monthly activity',
    noMonthlyLogs: 'No monthly logs yet',
    currentlyReading: 'Currently Reading',
    otherActiveReads: 'Other Active Reads',
    progress: 'Progress',
    currentPageLabel: 'Current page',
    updatePageAction: 'Update',
    pageInputAria: 'Current page number input',
    openFullLogAction: 'Add detailed session',
    openFullLogAria: 'Open full reading log editor',
    welcomeTitle: 'Welcome to BookStack!',
    welcomeSubtitle:
      'Your private, local sanctuary to log books and build reading habits. Start by adding your first book.',
    addFirstBook: 'Add my first book',
    noActiveReadsTitle: 'No active reads',
    noActiveReadsSubtitle: 'Pick a book from your pending list to start reading:',
    pickNextRead: 'Pick your next read',
    startReadingAction: 'Start reading',
    allCompletedTitle: 'All caught up!',
    allCompletedSubtitle: 'You have completed all registered books in your library. Great job!',
    addNewBook: 'Add new book',
    pageInputMustBeGreater: 'Page must be greater than current page',
    confirmCompletionTitle: 'Finished this book?',
    confirmCompletionMessage:
      'You are about to log the final page. The book will be marked as Completed with today as the completion date.',
    confirmCompletionAction: 'Yes, complete book',
    streakTitle: 'Reading Streak',
    streakDaysLabel: 'days in a row',
    streakTodayDone: 'Today reading completed!',
    streakTodayPending: 'Read today to maintain your streak',
    longestStreakLabel: 'All-time best',
    weekDays: {
      mon: 'M',
      tue: 'T',
      wed: 'W',
      thu: 'T',
      fri: 'F',
      sat: 'S',
      sun: 'S',
    },
    annualGoalsTitle: 'Annual Goals',
    editGoalsAction: 'Edit goals',
    booksGoalLabel: 'Books read',
    pagesGoalLabel: 'Pages read',
    recentActivityTitle: 'Recent Activity',
    noRecentActivity: 'No reading sessions logged yet.',
    pagesReadBadge: 'pages',
    minutesBadge: 'min.',
    editGoalModalTitle: 'Set Annual Goals',
    targetBooksInputLabel: 'Target books',
    targetPagesInputLabel: 'Target pages',
  },
};
