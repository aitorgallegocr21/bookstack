export interface SettingsI18n {
  settings: {
    title: string;
    subtitle: string;
    languageSectionTitle: string;
    languageSectionDescription: string;
    languageLabel: string;
    spanishOption: string;
    englishOption: string;
    roadmapNote: string;
    preferences: {
      sectionTitle: string;
      sectionDescription: string;
      themeLabel: string;
      themeLight: string;
      themeDark: string;
      defaultViewLabel: string;
      viewGrid: string;
      viewDetailed: string;
      viewCompact: string;
    };
    storage: {
      sectionTitle: string;
      sectionDescription: string;
      engineLabel: string;
      engineIndexedDb: string;
      engineLocalStorage: string;
      healthLabel: string;
      healthHealthy: string;
      healthModerate: string;
      healthNearLimit: string;
      totalUsedLabel: string;
      browserQuotaLabel: string;
      quotaUnavailable: string;
      categoryBooksMetadata: string;
      categoryCoversBase64: string;
      categoryReadingLogs: string;
      categoryPreferences: string;
      booksCountLabel: string;
      coversCountLabel: string;
      logsCountLabel: string;
      refreshAction: string;
    };
    portability: {
      sectionTitle: string;
      sectionDescription: string;
      exportTitle: string;
      exportJsonTitle: string;
      exportJsonDescription: string;
      exportJsonAction: string;
      exportLightJsonTitle: string;
      exportLightJsonDescription: string;
      exportLightJsonAction: string;
      exportCsvTitle: string;
      exportCsvDescription: string;
      exportCsvAction: string;
      exportZipTitle: string;
      exportZipDescription: string;
      exportZipAction: string;
      exportSuccessJson: string;
      exportSuccessLightJson: string;
      exportSuccessCsv: string;
      exportSuccessZip: string;
      importTitle: string;
      importDescription: string;
      importDropzoneLabel: string;
      importFileHint: string;
      importSelectFileAction: string;
      importSelectedFileLabel: string;
      previewTitle: string;
      previewValidBooks: string;
      previewNewBooks: string;
      previewDuplicateBooks: string;
      previewInvalidBooks: string;
      previewValidLogs: string;
      previewInvalidLogs: string;
      previewGoalsIncluded: string;
      previewPreferencesIncluded: string;
      previewYes: string;
      previewNo: string;
      conflictModeLabel: string;
      modeMergeLabel: string;
      modeMergeDescription: string;
      modeOverwriteLabel: string;
      modeOverwriteDescription: string;
      modeOverwriteWarning: string;
      autoEnrichAfterImportLabel: string;
      autoEnrichAfterImportDescription: string;
      confirmImportAction: string;
      cancelImportAction: string;
      importSuccessMessage: string;
      importErrorInvalidFile: string;
      importErrorNoValidRecords: string;
      importErrorExecution: string;
    };
    coverEnrichment: {
      sectionTitle: string;
      sectionDescription: string;
      withIsbn: string;
      withoutIsbn: string;
      allCoversComplete: string;
      incompleteMetadataBadge: string;
      missingPagesLabel: string;
      missingYearLabel: string;
      missingPublisherLabel: string;
      startIntegralEnrichmentAction: string;
      fieldsUpdatedCountLabel: string;
      postImportBannerTitle: string;
      postImportBannerDescription: string;
      postImportBannerAction: string;
      startIsbnEnrichmentAction: string;
      progressRunning: string;
      progressPaused: string;
      progressCompleted: string;
      progressCancelled: string;
      pauseAction: string;
      resumeAction: string;
      cancelAction: string;
      visualAssistantTitle: string;
      visualAssistantDescription: string;
      visualAssistantStartAction: string;
      visualAssistantStepCounter: string;
      visualAssistantSelectAction: string;
      visualAssistantSkipAction: string;
      visualAssistantCloseAction: string;
      visualAssistantNoSuggestions: string;
      visualAssistantNotFoundTitle: string;
      visualAssistantNotFoundDescription: string;
      strictSearchTitle: string;
      strictSearchWarning: string;
      strictSearchConfirmAction: string;
      reportTitle: string;
      reportDownloadedCount: string;
      reportSkippedCount: string;
      reasonMissingIsbn: string;
      reasonNoMetadata: string;
      reasonNoCover: string;
      reasonMismatch: string;
      reasonInvalidImage: string;
      reasonNetworkError: string;
    };
    dangerZone: {
      sectionTitle: string;
      sectionDescription: string;
      clearLogsTitle: string;
      clearLogsDescription: string;
      clearLogsAction: string;
      factoryResetTitle: string;
      factoryResetDescription: string;
      factoryResetAction: string;
      modalClearLogsTitle: string;
      modalClearLogsMessage: string;
      modalFactoryResetTitle: string;
      modalFactoryResetMessage: string;
      modalBackupFirstAction: string;
      modalBackupDownloaded: string;
      modalConfirmClearLogsAction: string;
      modalConfirmFactoryResetAction: string;
      modalCancelAction: string;
      clearLogsSuccess: string;
      factoryResetSuccess: string;
    };
  };
}

export const ES_SETTINGS: SettingsI18n = {
  settings: {
    title: 'Ajustes',
    subtitle: 'Configura tus preferencias locales de BookStack.',
    languageSectionTitle: 'Idioma de la interfaz',
    languageSectionDescription:
      'Selecciona el idioma en el que se muestran los textos, menús y formatos de fecha.',
    languageLabel: 'Idioma activo',
    spanishOption: 'Español (es)',
    englishOption: 'Inglés (en)',
    roadmapNote:
      'La gestión avanzada de copias de seguridad (importación/exportación local) llegará en próximas fases.',
    preferences: {
      sectionTitle: 'Preferencias de interfaz',
      sectionDescription:
        'Personaliza el idioma, el tema visual y la vista predeterminada del catálogo.',
      themeLabel: 'Tema visual',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      defaultViewLabel: 'Vista del catálogo',
      viewGrid: 'Cuadrícula',
      viewDetailed: 'Detallada',
      viewCompact: 'Compacta',
    },
    storage: {
      sectionTitle: 'Inspector de almacenamiento local',
      sectionDescription:
        'Consulta el espacio ocupado por tu biblioteca, portadas y sesiones en este navegador.',
      engineLabel: 'Motor activo',
      engineIndexedDb: 'IndexedDB',
      engineLocalStorage: 'LocalStorage (respaldo)',
      healthLabel: 'Estado de cuota',
      healthHealthy: 'Saludable',
      healthModerate: 'Moderado',
      healthNearLimit: 'Cerca del límite',
      totalUsedLabel: 'Uso total de BookStack',
      browserQuotaLabel: 'Cuota del navegador',
      quotaUnavailable: 'No disponible',
      categoryBooksMetadata: 'Metadatos de libros',
      categoryCoversBase64: 'Portadas locales (Base64)',
      categoryReadingLogs: 'Sesiones de lectura',
      categoryPreferences: 'Ajustes y metas',
      booksCountLabel: 'Libros',
      coversCountLabel: 'Portadas locales',
      logsCountLabel: 'Sesiones',
      refreshAction: 'Actualizar',
    },
    portability: {
      sectionTitle: 'Portabilidad y copias de seguridad',
      sectionDescription:
        'Exporta o restaura tu biblioteca completa en JSON o la tabla de libros en CSV.',
      exportTitle: 'Exportar datos',
      exportJsonTitle: 'Copia completa (.json)',
      exportJsonDescription:
        'Incluye libros, portadas en Base64, sesiones de lectura, metas anuales y preferencias.',
      exportJsonAction: 'Descargar JSON completo',
      exportLightJsonTitle: 'JSON ligero (solo texto)',
      exportLightJsonDescription:
        'Respaldo compacto sin imágenes Base64, ideal para IA, edición rápida o control de versiones.',
      exportLightJsonAction: 'Descargar JSON ligero',
      exportCsvTitle: 'Catálogo completo (.csv)',
      exportCsvDescription:
        'Formato compatible con Excel y Google Sheets con editorial, año y género en UTF-8.',
      exportCsvAction: 'Descargar CSV',
      exportZipTitle: 'Paquete portátil (.zip)',
      exportZipDescription:
        'Archivo 100% offline con backup.json, catalog.csv y carpeta /covers con portadas separadas.',
      exportZipAction: 'Descargar ZIP portátil',
      exportSuccessJson: 'Copia de seguridad JSON descargada correctamente.',
      exportSuccessLightJson: 'Copia JSON ligera descargada correctamente.',
      exportSuccessCsv: 'Catálogo CSV exportado correctamente.',
      exportSuccessZip: 'Paquete portátil .ZIP exportado correctamente.',
      importTitle: 'Importar datos',
      importDescription:
        'Selecciona un archivo .json o .csv para previsualizar y validar los registros antes de aplicar cambios.',
      importDropzoneLabel: 'Selecciona un archivo de respaldo (.json o .csv)',
      importFileHint: 'Tus datos actuales no se modificarán hasta confirmar la importación.',
      importSelectFileAction: 'Elegir archivo',
      importSelectedFileLabel: 'Archivo seleccionado',
      previewTitle: 'Resumen de validación',
      previewValidBooks: 'Libros válidos',
      previewNewBooks: 'Nuevos',
      previewDuplicateBooks: 'Existentes / actualizables',
      previewInvalidBooks: 'Libros descartados',
      previewValidLogs: 'Sesiones válidas',
      previewInvalidLogs: 'Sesiones descartadas',
      previewGoalsIncluded: 'Metas anuales incluidas',
      previewPreferencesIncluded: 'Preferencias incluidas',
      previewYes: 'Sí',
      previewNo: 'No',
      conflictModeLabel: 'Modo de importación',
      modeMergeLabel: 'Combinar (recomendado)',
      modeMergeDescription:
        'Actualiza los registros coincidentes e incorpora los nuevos conservando el resto de tu biblioteca.',
      modeOverwriteLabel: 'Reemplazar todo',
      modeOverwriteDescription:
        'Sustituye por completo tu biblioteca y sesiones actuales por el contenido del archivo.',
      modeOverwriteWarning:
        'Atención: esta acción sobrescribirá todos tus libros y sesiones actuales.',
      autoEnrichAfterImportLabel: 'Enriquecer metadatos y portadas automáticamente tras importar',
      autoEnrichAfterImportDescription:
        'Completa páginas, año, editorial, ISBN y portadas faltantes consultando los 5 catálogos públicos.',
      confirmImportAction: 'Confirmar importación',
      cancelImportAction: 'Cancelar',
      importSuccessMessage: 'Importación completada correctamente.',
      importErrorInvalidFile: 'El archivo seleccionado no tiene un formato JSON o CSV válido.',
      importErrorNoValidRecords: 'No se encontraron registros válidos para importar.',
      importErrorExecution: 'No se pudo completar la importación. Se restauró el estado previo.',
    },
    coverEnrichment: {
      sectionTitle: 'Enriquecimiento de portadas',
      sectionDescription:
        'Busca y descarga portadas faltantes de forma privada por ISBN exacto o mediante el asistente visual.',
      withIsbn: 'Con ISBN válido',
      withoutIsbn: 'Sin ISBN',
      allCoversComplete: 'Todos los libros de tu biblioteca ya tienen portada.',
      incompleteMetadataBadge: 'Metadatos incompletos',
      missingPagesLabel: 'Sin páginas',
      missingYearLabel: 'Sin año',
      missingPublisherLabel: 'Sin editorial',
      startIntegralEnrichmentAction: 'Enriquecer metadatos y portadas',
      fieldsUpdatedCountLabel: 'Campos completados',
      postImportBannerTitle: 'Libros importados sin portada',
      postImportBannerDescription:
        'Detectamos libros sin imagen de portada tras la importación. Puedes enriquecerlos automáticamente ahora.',
      postImportBannerAction: 'Buscar portadas ahora',
      startIsbnEnrichmentAction: 'Buscar por ISBN',
      progressRunning: 'Buscando portadas...',
      progressPaused: 'Búsqueda en pausa',
      progressCompleted: 'Enriquecimiento completado',
      progressCancelled: 'Búsqueda cancelada',
      pauseAction: 'Pausar',
      resumeAction: 'Reanudar',
      cancelAction: 'Cancelar',
      visualAssistantTitle: 'Asistente visual paso a paso',
      visualAssistantDescription:
        'Revisa solo los libros con varias portadas candidatas y elige la edición correcta con un clic. Los libros sin portada se resumen al final.',
      visualAssistantStartAction: 'Revisar uno a uno',
      visualAssistantStepCounter: 'Libro',
      visualAssistantSelectAction: 'Usar portada',
      visualAssistantSkipAction: 'Saltar',
      visualAssistantCloseAction: 'Cerrar asistente',
      visualAssistantNoSuggestions:
        'No se encontraron portadas candidatas para este libro. Puedes saltarlo para conservar su portada tipográfica.',
      visualAssistantNotFoundTitle: 'Libros sin portada encontrada',
      visualAssistantNotFoundDescription:
        'No se encontraron portadas disponibles para estos libros. Conservarán su portada tipográfica hasta que añadas una manualmente.',
      strictSearchTitle: 'Búsqueda automática estricta por título y autor',
      strictSearchWarning:
        'Atención: las búsquedas sin ISBN pueden coincidir ocasionalmente con otra edición del mismo libro.',
      strictSearchConfirmAction: 'Confirmar y buscar por título y autor',
      reportTitle: 'Informe de verificación y libros omitidos',
      reportDownloadedCount: 'Portadas descargadas',
      reportSkippedCount: 'Libros omitidos',
      reasonMissingIsbn: 'Sin ISBN válido',
      reasonNoMetadata: 'Sin resultados en proveedores',
      reasonNoCover: 'Sin portada disponible',
      reasonMismatch: 'Sin coincidencia estricta de título/autor',
      reasonInvalidImage: 'Imagen descartada (marcador o tamaño insuficiente)',
      reasonNetworkError: 'Error de red o tiempo agotado',
    },
    dangerZone: {
      sectionTitle: 'Zona de peligro',
      sectionDescription:
        'Acciones destructivas irreversibles sobre los datos almacenados localmente en este dispositivo.',
      clearLogsTitle: 'Borrar sesiones de lectura',
      clearLogsDescription:
        'Elimina todo el historial de sesiones de lectura pero conserva tu catálogo de libros.',
      clearLogsAction: 'Borrar sesiones',
      factoryResetTitle: 'Restablecer aplicación de fábrica',
      factoryResetDescription:
        'Elimina todos los libros, portadas, sesiones, metas y preferencias locales.',
      factoryResetAction: 'Restablecer todo',
      modalClearLogsTitle: '¿Borrar todas las sesiones de lectura?',
      modalClearLogsMessage:
        'Se eliminarán todas las sesiones registradas y las métricas de actividad. Tu catálogo de libros se mantendrá intacto.',
      modalFactoryResetTitle: '¿Restablecer BookStack de fábrica?',
      modalFactoryResetMessage:
        'Esta acción eliminará permanentemente todos tus libros, portadas, sesiones de lectura, metas y ajustes locales.',
      modalBackupFirstAction: 'Descargar copia JSON primero',
      modalBackupDownloaded: 'Copia JSON descargada',
      modalConfirmClearLogsAction: 'Sí, borrar sesiones',
      modalConfirmFactoryResetAction: 'Sí, restablecer todo',
      modalCancelAction: 'Cancelar',
      clearLogsSuccess: 'Historial de sesiones de lectura eliminado.',
      factoryResetSuccess: 'Aplicación restablecida a su estado inicial.',
    },
  },
};

export const EN_SETTINGS: SettingsI18n = {
  settings: {
    title: 'Settings',
    subtitle: 'Configure your local BookStack preferences.',
    languageSectionTitle: 'Interface language',
    languageSectionDescription:
      'Choose the display language for interface labels, menus, and date formatting.',
    languageLabel: 'Active language',
    spanishOption: 'Spanish (es)',
    englishOption: 'English (en)',
    roadmapNote: 'Advanced local backup management (import/export) will arrive in upcoming phases.',
    preferences: {
      sectionTitle: 'Interface preferences',
      sectionDescription: 'Customize language, visual theme, and default catalog view mode.',
      themeLabel: 'Visual theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      defaultViewLabel: 'Catalog view',
      viewGrid: 'Grid',
      viewDetailed: 'Detailed',
      viewCompact: 'Compact',
    },
    storage: {
      sectionTitle: 'Local storage inspector',
      sectionDescription:
        'Inspect the storage footprint of your library, covers, and reading sessions in this browser.',
      engineLabel: 'Active engine',
      engineIndexedDb: 'IndexedDB',
      engineLocalStorage: 'LocalStorage (fallback)',
      healthLabel: 'Quota status',
      healthHealthy: 'Healthy',
      healthModerate: 'Moderate',
      healthNearLimit: 'Near limit',
      totalUsedLabel: 'Total BookStack usage',
      browserQuotaLabel: 'Browser quota',
      quotaUnavailable: 'Unavailable',
      categoryBooksMetadata: 'Book metadata',
      categoryCoversBase64: 'Local covers (Base64)',
      categoryReadingLogs: 'Reading sessions',
      categoryPreferences: 'Settings & goals',
      booksCountLabel: 'Books',
      coversCountLabel: 'Local covers',
      logsCountLabel: 'Sessions',
      refreshAction: 'Refresh',
    },
    portability: {
      sectionTitle: 'Data portability & backups',
      sectionDescription:
        'Export or restore your full library in JSON or your book catalog table in CSV.',
      exportTitle: 'Export data',
      exportJsonTitle: 'Full backup (.json)',
      exportJsonDescription:
        'Includes books, Base64 covers, reading sessions, annual goals, and preferences.',
      exportJsonAction: 'Download full JSON',
      exportLightJsonTitle: 'Lightweight JSON (text-only)',
      exportLightJsonDescription:
        'Compact backup without Base64 images, ideal for AI tools, quick editing, or diffs.',
      exportLightJsonAction: 'Download light JSON',
      exportCsvTitle: 'Complete catalog (.csv)',
      exportCsvDescription:
        'Compatible with Excel and Google Sheets with publisher, year, and genre in UTF-8.',
      exportCsvAction: 'Download CSV',
      exportZipTitle: 'Portable bundle (.zip)',
      exportZipDescription:
        '100% offline archive with backup.json, catalog.csv, and a /covers folder.',
      exportZipAction: 'Download portable ZIP',
      exportSuccessJson: 'JSON backup downloaded successfully.',
      exportSuccessLightJson: 'Lightweight JSON backup downloaded successfully.',
      exportSuccessCsv: 'CSV catalog exported successfully.',
      exportSuccessZip: 'Portable .ZIP bundle exported successfully.',
      importTitle: 'Import data',
      importDescription:
        'Select a .json or .csv file to preview and validate records before applying changes.',
      importDropzoneLabel: 'Select a backup file (.json or .csv)',
      importFileHint: 'Your current data will not be modified until you confirm the import.',
      importSelectFileAction: 'Choose file',
      importSelectedFileLabel: 'Selected file',
      previewTitle: 'Validation summary',
      previewValidBooks: 'Valid books',
      previewNewBooks: 'New',
      previewDuplicateBooks: 'Existing / updatable',
      previewInvalidBooks: 'Skipped books',
      previewValidLogs: 'Valid sessions',
      previewInvalidLogs: 'Skipped sessions',
      previewGoalsIncluded: 'Annual goals included',
      previewPreferencesIncluded: 'Preferences included',
      previewYes: 'Yes',
      previewNo: 'No',
      conflictModeLabel: 'Import mode',
      modeMergeLabel: 'Merge (recommended)',
      modeMergeDescription:
        'Updates matching records and adds new ones while preserving the rest of your library.',
      modeOverwriteLabel: 'Overwrite all',
      modeOverwriteDescription:
        'Replaces your entire current library and reading sessions with the file contents.',
      modeOverwriteWarning:
        'Warning: this action will overwrite all your current books and reading sessions.',
      autoEnrichAfterImportLabel: 'Automatically enrich missing metadata & covers after import',
      autoEnrichAfterImportDescription:
        'Backfills missing pages, year, publisher, ISBN, and covers from the 5 public catalogs.',
      confirmImportAction: 'Confirm import',
      cancelImportAction: 'Cancel',
      importSuccessMessage: 'Import completed successfully.',
      importErrorInvalidFile: 'The selected file is not a valid JSON or CSV backup.',
      importErrorNoValidRecords: 'No valid records were found to import.',
      importErrorExecution: 'Could not complete the import. Previous state was restored.',
    },
    coverEnrichment: {
      sectionTitle: 'Cover enrichment',
      sectionDescription:
        'Privately fetch missing book covers by strict ISBN lookup or using the step-by-step visual assistant.',
      withIsbn: 'With valid ISBN',
      withoutIsbn: 'Without ISBN',
      allCoversComplete: 'All books in your library already have a cover image.',
      incompleteMetadataBadge: 'Incomplete metadata',
      missingPagesLabel: 'Missing pages',
      missingYearLabel: 'Missing year',
      missingPublisherLabel: 'Missing publisher',
      startIntegralEnrichmentAction: 'Enrich metadata & covers',
      fieldsUpdatedCountLabel: 'Fields updated',
      postImportBannerTitle: 'Imported books missing covers',
      postImportBannerDescription:
        'We detected imported books without cover images. You can enrich them automatically now.',
      postImportBannerAction: 'Fetch covers now',
      startIsbnEnrichmentAction: 'Enrich by ISBN',
      progressRunning: 'Fetching covers...',
      progressPaused: 'Enrichment paused',
      progressCompleted: 'Enrichment completed',
      progressCancelled: 'Enrichment cancelled',
      pauseAction: 'Pause',
      resumeAction: 'Resume',
      cancelAction: 'Cancel',
      visualAssistantTitle: 'Step-by-step visual assistant',
      visualAssistantDescription:
        'Review only books with multiple candidate covers and pick the right edition in one click. Books without covers are summarized at the end.',
      visualAssistantStartAction: 'Review one by one',
      visualAssistantStepCounter: 'Book',
      visualAssistantSelectAction: 'Use cover',
      visualAssistantSkipAction: 'Skip',
      visualAssistantCloseAction: 'Close assistant',
      visualAssistantNoSuggestions:
        'No cover candidates were found for this book. You can skip it to keep its typographic cover.',
      visualAssistantNotFoundTitle: 'Books without covers found',
      visualAssistantNotFoundDescription:
        'No available covers were found for these books. They will keep their typographic cover until you add one manually.',
      strictSearchTitle: 'Strict automated title & author search',
      strictSearchWarning:
        'Warning: lookups without an ISBN can occasionally match a different edition of the same book.',
      strictSearchConfirmAction: 'Confirm and search by title & author',
      reportTitle: 'Verification & skipped books report',
      reportDownloadedCount: 'Downloaded covers',
      reportSkippedCount: 'Skipped books',
      reasonMissingIsbn: 'Missing valid ISBN',
      reasonNoMetadata: 'No metadata found',
      reasonNoCover: 'No cover available',
      reasonMismatch: 'Strict title/author mismatch',
      reasonInvalidImage: 'Discarded image (placeholder or too small)',
      reasonNetworkError: 'Network error or timeout',
    },
    dangerZone: {
      sectionTitle: 'Danger zone',
      sectionDescription:
        'Irreversible destructive actions affecting data stored locally on this device.',
      clearLogsTitle: 'Clear reading sessions',
      clearLogsDescription:
        'Deletes all reading session history while keeping your book catalog intact.',
      clearLogsAction: 'Clear sessions',
      factoryResetTitle: 'Factory reset application',
      factoryResetDescription:
        'Deletes all books, covers, reading sessions, goals, and local preferences.',
      factoryResetAction: 'Reset everything',
      modalClearLogsTitle: 'Clear all reading sessions?',
      modalClearLogsMessage:
        'All recorded reading sessions and activity metrics will be deleted. Your book catalog will remain intact.',
      modalFactoryResetTitle: 'Factory reset BookStack?',
      modalFactoryResetMessage:
        'This action will permanently delete all your books, covers, reading sessions, goals, and local settings.',
      modalBackupFirstAction: 'Download JSON backup first',
      modalBackupDownloaded: 'JSON backup downloaded',
      modalConfirmClearLogsAction: 'Yes, clear sessions',
      modalConfirmFactoryResetAction: 'Yes, reset everything',
      modalCancelAction: 'Cancel',
      clearLogsSuccess: 'Reading session history cleared.',
      factoryResetSuccess: 'Application reset to initial state.',
    },
  },
};
