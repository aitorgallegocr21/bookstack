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
    tabs: {
      navAriaLabel: string;
      general: string;
      catalog: string;
      data: string;
      privacy: string;
      advanced: string;
      expertBadge: string;
    };
    search: {
      placeholder: string;
      ariaLabel: string;
      clearLabel: string;
      resultsLabel: string;
      emptyTitle: string;
      emptyDescription: string;
    };
    backupReminder: {
      title: string;
      description: string;
      exportAction: string;
      dismissAction: string;
    };
    placeholders: {
      catalogTitle: string;
      catalogDescription: string;
      privacyTitle: string;
      privacyDescription: string;
      advancedTitle: string;
      advancedDescription: string;
    };
    preferences: {
      sectionTitle: string;
      sectionDescription: string;
      themeLabel: string;
      themeLight: string;
      themeDark: string;
      themeSystem: string;
      accentLabel: string;
      accents: {
        blue: string;
        indigo: string;
        emerald: string;
        amber: string;
        rose: string;
      };
      desktopDockLabel: string;
      mobileDockLabel: string;
      adaptiveTintLabel: string;
      adaptiveTintDescription: string;
      reducedMotionLabel: string;
      reducedMotionDescription: string;
      reducedMotionSystem: string;
      reducedMotionReduce: string;
      defaultViewLabel: string;
      viewGrid: string;
      viewDetailed: string;
      viewCompact: string;
      suppressedConfirmsLabel: string;
      suppressedConfirmsReset: string;
      suppressedConfirmsResetDone: string;
    };
    catalogReading: {
      displayCardTitle: string;
      displayCardDescription: string;
      defaultViewLabel: string;
      viewGrid: string;
      viewDetailed: string;
      viewCompact: string;
      defaultSortLabel: string;
      showCardActionsLabel: string;
      showCardActionsDescription: string;
      showCardProgressLabel: string;
      showCardProgressDescription: string;
      readingCardTitle: string;
      readingCardDescription: string;
      defaultFormatLabel: string;
      defaultStatusLabel: string;
      quickPageStepLabel: string;
      quickPageStepDescription: string;
      trackReadingTimeLabel: string;
      trackReadingTimeDescription: string;
      confirmationsCardTitle: string;
      confirmationsCardDescription: string;
      confirmDeleteReadingLogLabel: string;
      confirmUnlinkSagaBookLabel: string;
      confirmManualAntiqueYearLabel: string;
      restoreAllConfirmations: string;
      allConfirmationsRestored: string;
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
      persistenceLabel: string;
      persistencePersisted: string;
      persistenceBestEffort: string;
      persistenceUnsupported: string;
      requestPersistentAction: string;
      requestPersistentGranted: string;
      requestPersistentDenied: string;
      requestPersistentUnsupported: string;
      diagnosticsLabel: string;
      diagnosticsVersionPrefix: string;
      diagnosticsStoresLabel: string;
    };
    portability: {
      sectionTitle: string;
      sectionDescription: string;
      includePreferencesLabel: string;
      includePreferencesDescription: string;
      lastBackupLabel: string;
      lastBackupNever: string;
      restorePreferencesLabel: string;
      restorePreferencesDescription: string;
      dangerZoneShortcutTitle: string;
      dangerZoneShortcutDescription: string;
      dangerZoneShortcutAction: string;
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
      confirmOverwriteTitle: string;
      confirmOverwriteMessage: string;
      confirmOverwriteAction: string;
      confirmOverwritePreviewTitle: string;
      confirmOverwritePreviewSubtitle: string;
      importErrorInvalidFile: string;
      importErrorNoValidRecords: string;
      importErrorExecution: string;
      encryptionToggleLabel: string;
      encryptionToggleDescription: string;
      encryptionPasswordLabel: string;
      encryptionPasswordPlaceholder: string;
      encryptionConfirmPasswordLabel: string;
      encryptionConfirmPasswordPlaceholder: string;
      encryptionShowPasswordLabel: string;
      encryptionHidePasswordLabel: string;
      encryptionStrengthLabel: string;
      encryptionStrengthWeak: string;
      encryptionStrengthFair: string;
      encryptionStrengthStrong: string;
      encryptionMinLengthHint: string;
      encryptionMismatchError: string;
      encryptionUnrecoverableWarning: string;
      encryptionUnavailableError: string;
      exportSuccessEncryptedJson: string;
      exportSuccessEncryptedZip: string;
      decryptCardTitle: string;
      decryptCardDescription: string;
      decryptPasswordLabel: string;
      decryptAction: string;
      decryptingAction: string;
      decryptErrorInvalidPassword: string;
      decryptErrorUnsupportedFormat: string;
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
      offlineBlockedBanner: string;
      offlineBlockedLink: string;
    };
    privacyScanner: {
      offlineCardTitle: string;
      offlineCardDescription: string;
      offlineToggleLabel: string;
      offlineToggleDescription: string;
      offlineStatusActive: string;
      offlineStatusOnline: string;
      providersCardTitle: string;
      providersCardDescription: string;
      providersOfflineHint: string;
      providersAllDisabledWarning: string;
      providersResetOrder: string;
      providerMoveUpAria: string;
      providerMoveDownAria: string;
      providerToggleAria: string;
      providers: {
        googlebooks: { name: string; description: string };
        openlibrary: { name: string; description: string };
        applebooks: { name: string; description: string };
        wikidata: { name: string; description: string };
        archive: { name: string; description: string };
      };
      scannerCardTitle: string;
      scannerCardDescription: string;
      cameraConsentLabel: string;
      cameraConsentGranted: string;
      cameraConsentNotGranted: string;
      cameraConsentRevoke: string;
      cameraConsentRevokedDone: string;
      rememberedCameraLabel: string;
      rememberedCameraStored: string;
      rememberedCameraNone: string;
      rememberedCameraForget: string;
      rememberedCameraForgottenDone: string;
      preferPhotoModeLabel: string;
      preferPhotoModeDescription: string;
      autoTorchLabel: string;
      autoTorchDescription: string;
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
    dataHealth: {
      sectionTitle: string;
      sectionDescription: string;
      scoreLabel: string;
      healthyBadge: string;
      healthyTitle: string;
      healthyDescription: string;
      issuesDetectedLabel: string;
      autoFixableLabel: string;
      fixAllAction: string;
      fixSingleAction: string;
      resolveDuplicateAction: string;
      fixedSingleMessage: string;
      fixedAllMessage: string;
      confirmFixAllTitle: string;
      confirmFixAllMessage: string;
      confirmFixAllAction: string;
      confirmDuplicateTitle: string;
      confirmDuplicateMessage: string;
      confirmDuplicateAction: string;
      cancelAction: string;
      categories: {
        'temporal-anomaly': string;
        'progress-mismatch': string;
        'duplicate-book': string;
        'fragmented-saga': string;
      };
      severities: {
        high: string;
        medium: string;
        low: string;
      };
      issues: {
        pubYearAnomalyTitle: string;
        pubYearAnomalyDescription: string;
        startDateAnomalyTitle: string;
        startDateAnomalyDescription: string;
        endDateAnomalyTitle: string;
        endDateAnomalyDescription: string;
        invertedDatesTitle: string;
        invertedDatesDescription: string;
        logDateAnomalyTitle: string;
        logDateAnomalyDescription: string;
        completedPagesMismatchTitle: string;
        completedPagesMismatchDescription: string;
        completedPlaceholderPagesTitle: string;
        completedPlaceholderPagesDescription: string;
        pendingWithProgressTitle: string;
        pendingWithProgressDescription: string;
        duplicateBookTitle: string;
        duplicateBookDescription: string;
        fragmentedSagaNameTitle: string;
        fragmentedSagaNameDescription: string;
        missingSagaVolumeTitle: string;
        missingSagaVolumeDescription: string;
        manualFixHint: string;
      };
    };
    advanced: {
      compressionTitle: string;
      compressionDescription: string;
      maxDimensionLabel: string;
      maxDimensionUnit: string;
      qualityLabel: string;
      compressionHint: string;
      quotaTitle: string;
      quotaDescription: string;
      quotaLabel: string;
      quotaOptionSuffix: string;
      resetsTitle: string;
      resetsDescription: string;
      clearColorCacheTitle: string;
      clearColorCacheDescription: string;
      clearColorCacheAction: string;
      clearColorCacheConfirmTitle: string;
      clearColorCacheConfirmMessage: string;
      clearColorCacheConfirmAction: string;
      clearColorCacheSuccess: string;
      clearLogsTitle: string;
      clearLogsDescription: string;
      clearLogsAction: string;
      clearLogsConfirmTitle: string;
      clearLogsConfirmMessage: string;
      clearLogsConfirmAction: string;
      clearLogsSuccess: string;
      resetPrefsTitle: string;
      resetPrefsDescription: string;
      resetPrefsAction: string;
      resetPrefsConfirmTitle: string;
      resetPrefsConfirmMessage: string;
      resetPrefsConfirmAction: string;
      resetPrefsSuccess: string;
      cancelAction: string;
      dismissStatusLabel: string;
      diagnosticsTitle: string;
      diagnosticsDescription: string;
      diagnosticsPrivacyNote: string;
      diagnosticsAction: string;
      diagnosticsExporting: string;
      diagnosticsSuccess: string;
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
    tabs: {
      navAriaLabel: 'Categorías de ajustes',
      general: 'General y apariencia',
      catalog: 'Catálogo y lectura',
      data: 'Datos y copias',
      privacy: 'Privacidad y escáner',
      advanced: 'Avanzado y sistema',
      expertBadge: 'Experto',
    },
    search: {
      placeholder: 'Buscar ajustes (ej. idioma, offline, cifrado, compresión)...',
      ariaLabel: 'Buscar en ajustes',
      clearLabel: 'Limpiar búsqueda',
      resultsLabel: 'Resultados de búsqueda',
      emptyTitle: 'No se encontraron ajustes',
      emptyDescription: 'Prueba con otros términos como idioma, tema, copias, offline o cifrado.',
    },
    backupReminder: {
      title: 'Recordatorio de copia de seguridad',
      description:
        'Han pasado más de 30 días desde tu última copia local o todavía no has exportado ninguna.',
      exportAction: 'Exportar copia',
      dismissAction: 'Descartar recordatorio',
    },
    placeholders: {
      catalogTitle: 'Catálogo, lectura y avisos',
      catalogDescription:
        'Configura la vista predeterminada del catálogo, metas de lectura, formato de progreso y confirmaciones.',
      privacyTitle: 'Privacidad, modo offline y escáner',
      privacyDescription:
        'Controla las consultas externas a catálogos públicos, la cámara del escáner ISBN y las opciones de privacidad.',
      advancedTitle: 'Avanzado, compresión y diagnóstico',
      advancedDescription:
        'Herramientas técnicas de optimización de portadas, caché local y diagnóstico del sistema.',
    },
    preferences: {
      sectionTitle: 'Preferencias de interfaz',
      sectionDescription:
        'Personaliza el idioma, el tema visual, el color de acento, el movimiento y el dock.',
      themeLabel: 'Tema visual',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      themeSystem: 'Sistema',
      accentLabel: 'Color de acento',
      accents: {
        blue: 'Azul clásico',
        indigo: 'Índigo',
        emerald: 'Esmeralda',
        amber: 'Ámbar editorial',
        rose: 'Terracota',
      },
      desktopDockLabel: 'Dock en escritorio',
      mobileDockLabel: 'Dock en móvil',
      adaptiveTintLabel: 'Tinte adaptativo por portada',
      adaptiveTintDescription:
        'Aplica un sutil halo cromático (--book-tint) extraído de cada portada en tarjetas y sagas.',
      reducedMotionLabel: 'Movimiento y animaciones',
      reducedMotionDescription:
        'Reduce las transiciones y animaciones de la interfaz o sigue la preferencia del sistema.',
      reducedMotionSystem: 'Sistema',
      reducedMotionReduce: 'Reducido',
      defaultViewLabel: 'Vista del catálogo',
      viewGrid: 'Cuadrícula',
      viewDetailed: 'Detallada',
      viewCompact: 'Compacta',
      suppressedConfirmsLabel: 'Confirmaciones omitidas',
      suppressedConfirmsReset: 'Restablecer avisos',
      suppressedConfirmsResetDone: 'Avisos restablecidos',
    },
    catalogReading: {
      displayCardTitle: 'Catálogo y tarjetas',
      displayCardDescription:
        'Configura la vista predeterminada, el orden inicial y los elementos visibles en las tarjetas.',
      defaultViewLabel: 'Vista predeterminada',
      viewGrid: 'Cuadrícula',
      viewDetailed: 'Detallada',
      viewCompact: 'Compacta',
      defaultSortLabel: 'Orden predeterminado',
      showCardActionsLabel: 'Acciones rápidas en tarjetas',
      showCardActionsDescription:
        'Muestra los botones de registrar lectura, ver, editar y eliminar en cada tarjeta.',
      showCardProgressLabel: 'Barra de progreso en cuadrícula',
      showCardProgressDescription:
        'Muestra la barra de progreso inferior sobre las portadas en la vista en cuadrícula.',
      readingCardTitle: 'Nuevo libro y sesiones de lectura',
      readingCardDescription:
        'Agiliza el alta de libros y el registro rápido de páginas desde el panel principal.',
      defaultFormatLabel: 'Formato por defecto',
      defaultStatusLabel: 'Estado inicial',
      quickPageStepLabel: 'Incremento rápido en Inicio',
      quickPageStepDescription:
        'Cantidad de páginas que suma el botón de avance rápido en la lectura actual.',
      trackReadingTimeLabel: 'Registrar tiempo de lectura (minutos)',
      trackReadingTimeDescription:
        'Incluye el campo de duración en minutos al registrar sesiones (prepara analíticas de ritmo lector).',
      confirmationsCardTitle: 'Diálogos de confirmación',
      confirmationsCardDescription:
        'Activa o silencia avisos individuales antes de realizar acciones destructivas o especiales.',
      confirmDeleteReadingLogLabel: 'Preguntar antes de eliminar una sesión de lectura',
      confirmUnlinkSagaBookLabel: 'Preguntar antes de desvincular un libro de una saga',
      confirmManualAntiqueYearLabel:
        'Preguntar antes de guardar un año de publicación antiguo (< 1900)',
      restoreAllConfirmations: 'Restablecer todas las confirmaciones',
      allConfirmationsRestored: 'Todas las confirmaciones están activas',
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
      persistenceLabel: 'Persistencia',
      persistencePersisted: 'Protegido contra borrado',
      persistenceBestEffort: 'Mejor esfuerzo',
      persistenceUnsupported: 'No compatible',
      requestPersistentAction: 'Solicitar almacenamiento persistente',
      requestPersistentGranted:
        'Almacenamiento protegido contra el borrado automático del navegador.',
      requestPersistentDenied:
        'El navegador mantuvo el modo estándar; instalar la PWA o añadir a marcadores aumenta la aprobación.',
      requestPersistentUnsupported:
        'Este navegador no permite solicitar almacenamiento persistente.',
      diagnosticsLabel: 'Diagnóstico',
      diagnosticsVersionPrefix: 'v',
      diagnosticsStoresLabel: 'almacenes',
    },
    portability: {
      sectionTitle: 'Portabilidad y copias de seguridad',
      sectionDescription:
        'Exporta o restaura tu biblioteca completa en JSON o la tabla de libros en CSV.',
      includePreferencesLabel: 'Incluir preferencias de la app en copias',
      includePreferencesDescription:
        'Guarda tema, acento, dock, vista, privacidad y escáner dentro de las copias JSON y ZIP.',
      lastBackupLabel: 'Última copia',
      lastBackupNever: 'Sin copias registradas',
      restorePreferencesLabel: 'Restaurar preferencias guardadas',
      restorePreferencesDescription:
        'Aplica el idioma, tema, diseño y ajustes de privacidad incluidos en este respaldo.',
      dangerZoneShortcutTitle:
        '¿Necesitas borrar sesiones, restablecer ajustes o vaciar tu biblioteca?',
      dangerZoneShortcutDescription:
        'Accede directamente a la Zona de peligro en Avanzado y sistema.',
      dangerZoneShortcutAction: 'Ir a Zona de peligro',
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
      confirmOverwriteTitle: 'Sobrescribir biblioteca actual',
      confirmOverwriteMessage:
        'El modo sobrescribir reemplazará toda tu biblioteca local actual con la copia de seguridad. Esta acción no se puede deshacer.',
      confirmOverwriteAction: 'Sobrescribir biblioteca',
      confirmOverwritePreviewTitle: 'Biblioteca local actual',
      confirmOverwritePreviewSubtitle: '{books} libros · {logs} sesiones',
      importErrorInvalidFile: 'El archivo seleccionado no tiene un formato JSON o CSV válido.',
      importErrorNoValidRecords: 'No se encontraron registros válidos para importar.',
      importErrorExecution: 'No se pudo completar la importación. Se restauró el estado previo.',
      encryptionToggleLabel: 'Proteger copia con contraseña (AES-256)',
      encryptionToggleDescription:
        'Cifra las exportaciones .JSON y .ZIP localmente con PBKDF2 + AES-GCM-256 antes de descargarlas.',
      encryptionPasswordLabel: 'Contraseña de cifrado',
      encryptionPasswordPlaceholder: 'Mínimo 8 caracteres',
      encryptionConfirmPasswordLabel: 'Confirmar contraseña',
      encryptionConfirmPasswordPlaceholder: 'Repite la contraseña',
      encryptionShowPasswordLabel: 'Mostrar contraseña',
      encryptionHidePasswordLabel: 'Ocultar contraseña',
      encryptionStrengthLabel: 'Seguridad',
      encryptionStrengthWeak: 'Débil',
      encryptionStrengthFair: 'Media',
      encryptionStrengthStrong: 'Fuerte',
      encryptionMinLengthHint: 'Introduce al menos 8 caracteres para cifrar la copia.',
      encryptionMismatchError: 'Las contraseñas no coinciden.',
      encryptionUnrecoverableWarning:
        '100% Local-First: BookStack no guarda esta contraseña. Si la olvidas, la copia no podrá recuperarse.',
      encryptionUnavailableError: 'Web Crypto API no está disponible en este navegador o contexto.',
      exportSuccessEncryptedJson: 'Copia JSON cifrada (.enc.json) exportada correctamente.',
      exportSuccessEncryptedZip: 'Paquete .ZIP cifrado (.enc.json) exportado correctamente.',
      decryptCardTitle: 'Esta copia de seguridad está cifrada',
      decryptCardDescription:
        'Introduce tu contraseña para descifrar "{file}" localmente antes de previsualizar los registros.',
      decryptPasswordLabel: 'Contraseña de la copia',
      decryptAction: 'Desbloquear y previsualizar',
      decryptingAction: 'Descifrando...',
      decryptErrorInvalidPassword:
        'Contraseña incorrecta o archivo cifrado alterado. Inténtalo de nuevo.',
      decryptErrorUnsupportedFormat:
        'El archivo cifrado tiene un formato no compatible o parámetros inválidos.',
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
      offlineBlockedBanner:
        'El Modo Offline 100% está activo: el enriquecimiento automático de portadas y metadatos está deshabilitado.',
      offlineBlockedLink: 'Configurar en Privacidad',
    },
    privacyScanner: {
      offlineCardTitle: 'Modo Offline 100%',
      offlineCardDescription:
        'Bloquea por completo cualquier petición de red saliente a catálogos públicos y servidores de portadas.',
      offlineToggleLabel: 'Activar Modo Offline 100%',
      offlineToggleDescription:
        'Solo funcionarán las funciones locales: creación manual, subida de portadas, escáner ISBN local, IndexedDB y copias de seguridad.',
      offlineStatusActive: '100% Offline Activo',
      offlineStatusOnline: 'Catálogos Públicos Permitidos',
      providersCardTitle: 'Proveedores de metadatos públicos (5 fuentes)',
      providersCardDescription:
        'Activa o desactiva cada catálogo público y ordena su prioridad al fusionar resultados y portadas.',
      providersOfflineHint:
        'El Modo Offline 100% está activo. Tu configuración de proveedores se conserva para cuando vuelvas a permitir consultas.',
      providersAllDisabledWarning:
        'Todos los proveedores están desactivados. No se realizarán búsquedas externas hasta activar al menos uno.',
      providersResetOrder: 'Restaurar orden por defecto',
      providerMoveUpAria: 'Subir prioridad de',
      providerMoveDownAria: 'Bajar prioridad de',
      providerToggleAria: 'Activar o desactivar',
      providers: {
        googlebooks: {
          name: 'Google Books',
          description: 'Amplia cobertura comercial, sinopsis y portadas de alta resolución.',
        },
        openlibrary: {
          name: 'Open Library',
          description: 'Catálogo abierto con ISBN por lotes, páginas medianas y ediciones.',
        },
        applebooks: {
          name: 'Apple Books ES',
          description: 'Ediciones minoristas en español con portadas limpias.',
        },
        wikidata: {
          name: 'Wikidata',
          description: 'Datos estructurados abiertos, sagas y volúmenes en español.',
        },
        archive: {
          name: 'Internet Archive / Crossref',
          description: 'Archivo histórico, ediciones descatalogadas y libros académicos.',
        },
      },
      scannerCardTitle: 'Privacidad de cámara y escáner ISBN',
      scannerCardDescription:
        'Gestiona el consentimiento local de cámara, el sensor trasero recordado y el comportamiento inicial del escáner.',
      cameraConsentLabel: 'Consentimiento local de cámara',
      cameraConsentGranted: 'Concedido en este navegador',
      cameraConsentNotGranted: 'Sin consentimiento guardado',
      cameraConsentRevoke: 'Revocar consentimiento',
      cameraConsentRevokedDone: 'Consentimiento de cámara restablecido',
      rememberedCameraLabel: 'Sensor trasero recordado',
      rememberedCameraStored: 'Sensor guardado:',
      rememberedCameraNone: 'Ningún sensor trasero recordado',
      rememberedCameraForget: 'Olvidar cámara recordada',
      rememberedCameraForgottenDone: 'Sensor trasero olvidado',
      preferPhotoModeLabel: 'Preferir modo foto al abrir el escáner',
      preferPhotoModeDescription:
        'No inicia la cámara en vivo automáticamente; muestra primero la subida de foto local.',
      autoTorchLabel: 'Encender linterna automáticamente',
      autoTorchDescription:
        'Activa el flash LED al abrir una cámara trasera compatible con linterna.',
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
    dataHealth: {
      sectionTitle: 'Auditor de salud de datos',
      sectionDescription:
        'Detecta automáticamente años anómalos (como 2925), fechas invertidas, páginas inconsistentes, duplicados y sagas fragmentadas.',
      scoreLabel: 'Salud de la biblioteca',
      healthyBadge: '100% Saludable',
      healthyTitle: 'Tu biblioteca está limpia y consistente',
      healthyDescription:
        'No se detectaron anomalías temporales, errores de progreso, libros duplicados ni sagas fragmentadas.',
      issuesDetectedLabel: 'Incidencias detectadas',
      autoFixableLabel: 'Autocorrección disponible',
      fixAllAction: 'Corregir todas automáticamente ({count})',
      fixSingleAction: 'Corregir',
      resolveDuplicateAction: 'Conservar mejor registro',
      fixedSingleMessage: 'Incidencia corregida correctamente.',
      fixedAllMessage: 'Se corrigieron {count} incidencias automáticamente.',
      confirmFixAllTitle: '¿Aplicar {count} correcciones automáticas?',
      confirmFixAllMessage:
        'Se corregirán las anomalías temporales, inconsistencias de progreso y nombres de sagas detectados sin eliminar ningún libro.',
      confirmFixAllAction: 'Aplicar correcciones',
      confirmDuplicateTitle: '¿Eliminar libro duplicado?',
      confirmDuplicateMessage:
        'Se conservará el registro más completo («{keeper}») y se eliminarán {count} duplicados redundantes.',
      confirmDuplicateAction: 'Conservar y limpiar duplicados',
      cancelAction: 'Cancelar',
      categories: {
        'temporal-anomaly': 'Anomalías temporales',
        'progress-mismatch': 'Progreso y páginas',
        'duplicate-book': 'Libros duplicados',
        'fragmented-saga': 'Sagas fragmentadas',
      },
      severities: {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
      },
      issues: {
        pubYearAnomalyTitle: 'Año de publicación anómalo: {title}',
        pubYearAnomalyDescription: 'El año de publicación ({year}) está fuera del rango válido.',
        startDateAnomalyTitle: 'Fecha de inicio anómala: {title}',
        startDateAnomalyDescription: 'La fecha de inicio ({date}) contiene un año fuera de rango.',
        endDateAnomalyTitle: 'Fecha de fin anómala: {title}',
        endDateAnomalyDescription:
          'La fecha de finalización ({date}) contiene un año fuera de rango.',
        invertedDatesTitle: 'Fechas de lectura invertidas: {title}',
        invertedDatesDescription:
          'La fecha de finalización ({endDate}) es anterior a la de inicio ({startDate}).',
        logDateAnomalyTitle: 'Sesión de lectura con año anómalo: {title}',
        logDateAnomalyDescription:
          'Una sesión registrada el {date} tiene un año fuera del rango permitido.',
        completedPagesMismatchTitle: 'Libro completado con páginas pendientes: {title}',
        completedPagesMismatchDescription:
          'Marcado como completado con {currentPage} de {totalPages} páginas.',
        completedPlaceholderPagesTitle: 'Libro completado sin total de páginas real: {title}',
        completedPlaceholderPagesDescription:
          'Tiene {totalPages} página(s) registradas. Edita el libro para indicar su extensión real.',
        pendingWithProgressTitle: 'Libro pendiente con progreso iniciado: {title}',
        pendingWithProgressDescription:
          'Está en estado pendiente pero registra {currentPage} páginas leídas.',
        duplicateBookTitle: 'Posible libro duplicado: {title}',
        duplicateBookDescription:
          'Se encontraron {count} registros coincidentes ({reason}). Se conservará el más completo.',
        fragmentedSagaNameTitle: 'Nombre de saga inconsistente: {saga}',
        fragmentedSagaNameDescription:
          '{count} libros usan variantes distintas de escritura para esta saga.',
        missingSagaVolumeTitle: 'Volúmenes sin número en saga: {saga}',
        missingSagaVolumeDescription:
          '{count} libro(s) de esta saga no tienen número de volumen asignado.',
        manualFixHint: 'Requiere revisión manual',
      },
    },
    advanced: {
      compressionTitle: 'Optimización y compresión de portadas',
      compressionDescription:
        'Ajusta la resolución máxima y la calidad WebP/JPEG para equilibrar nitidez visual y espacio en IndexedDB.',
      maxDimensionLabel: 'Resolución máxima (lado mayor)',
      maxDimensionUnit: 'px',
      qualityLabel: 'Calidad de compresión',
      compressionHint:
        'Los cambios se aplican a las portadas nuevas que subas o enriquezcas; las portadas existentes no se modifican.',
      quotaTitle: 'Cuota de búsqueda de metadatos',
      quotaDescription:
        'Limita cuántos resultados devuelve cada consulta al añadir libros por ISBN o título.',
      quotaLabel: 'Resultados por búsqueda',
      quotaOptionSuffix: 'resultados',
      resetsTitle: 'Restablecimientos selectivos',
      resetsDescription:
        'Limpia cachés temporales o reinicia preferencias sin borrar tus libros, portadas ni sagas.',
      clearColorCacheTitle: 'Limpiar caché de colores de portada',
      clearColorCacheDescription:
        'Elimina las paletas cromáticas cacheadas en localStorage; se recalcularán automáticamente al navegar.',
      clearColorCacheAction: 'Limpiar caché',
      clearColorCacheConfirmTitle: '¿Limpiar caché de colores?',
      clearColorCacheConfirmMessage:
        'Se borrarán las paletas de color extraídas de portadas en localStorage. Tus libros y portadas no se verán afectados.',
      clearColorCacheConfirmAction: 'Sí, limpiar caché',
      clearColorCacheSuccess: 'Caché de colores de portada limpiada correctamente.',
      clearLogsTitle: 'Borrar solo historial de sesiones de lectura',
      clearLogsDescription:
        'Elimina únicamente los registros diarios de lectura manteniendo intactos todos tus libros y sagas.',
      clearLogsAction: 'Borrar sesiones',
      clearLogsConfirmTitle: '¿Borrar todo el historial de sesiones?',
      clearLogsConfirmMessage:
        'Se eliminarán permanentemente todas las sesiones de lectura registradas. Tus libros, portadas y sagas se conservarán intactos.',
      clearLogsConfirmAction: 'Sí, borrar sesiones',
      clearLogsSuccess: 'Historial de sesiones de lectura eliminado.',
      resetPrefsTitle: 'Restablecer todas las preferencias por defecto',
      resetPrefsDescription:
        'Devuelve tema, acento, dock, vista del catálogo, escáner, compresión y avisos a sus valores iniciales.',
      resetPrefsAction: 'Restablecer preferencias',
      resetPrefsConfirmTitle: '¿Restablecer preferencias de la aplicación?',
      resetPrefsConfirmMessage:
        'Se restaurarán las preferencias visuales, de lectura, privacidad y compresión a sus valores predeterminados. Tu biblioteca no se tocará.',
      resetPrefsConfirmAction: 'Sí, restablecer',
      resetPrefsSuccess: 'Todas las preferencias se han restablecido a sus valores por defecto.',
      cancelAction: 'Cancelar',
      dismissStatusLabel: 'Cerrar aviso',
      diagnosticsTitle: 'Informe técnico de diagnóstico',
      diagnosticsDescription:
        'Descarga una instantánea JSON con métricas de entorno, almacenamiento, escáner y preferencias para depuración.',
      diagnosticsPrivacyNote:
        'Estrictamente anónimo: nunca incluye títulos de libros, autores, ISBN, notas ni nombres de sagas.',
      diagnosticsAction: 'Exportar informe de diagnóstico (.json)',
      diagnosticsExporting: 'Generando informe...',
      diagnosticsSuccess: 'Informe técnico de diagnóstico descargado correctamente.',
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
    tabs: {
      navAriaLabel: 'Settings categories',
      general: 'General & Appearance',
      catalog: 'Catalog & Reading',
      data: 'Data & Backups',
      privacy: 'Privacy & Scanner',
      advanced: 'Advanced & System',
      expertBadge: 'Expert',
    },
    search: {
      placeholder: 'Search settings (e.g. language, offline, encryption, compression)...',
      ariaLabel: 'Search settings',
      clearLabel: 'Clear search',
      resultsLabel: 'Search results',
      emptyTitle: 'No matching settings found',
      emptyDescription:
        'Try different keywords such as language, theme, backups, offline, or encryption.',
    },
    backupReminder: {
      title: 'Backup reminder',
      description:
        'More than 30 days have passed since your last local backup, or you have not exported one yet.',
      exportAction: 'Export backup',
      dismissAction: 'Dismiss reminder',
    },
    placeholders: {
      catalogTitle: 'Catalog, reading & prompts',
      catalogDescription:
        'Configure default catalog view, reading goals, progress display, and confirmation prompts.',
      privacyTitle: 'Privacy, offline mode & scanner',
      privacyDescription:
        'Control external public catalog lookups, ISBN scanner camera preferences, and privacy controls.',
      advancedTitle: 'Advanced, compression & diagnostics',
      advancedDescription:
        'Technical tools for cover compression, local cache management, and system diagnostics.',
    },
    preferences: {
      sectionTitle: 'Interface preferences',
      sectionDescription:
        'Customize language, visual theme, accent color, motion, and dock position.',
      themeLabel: 'Visual theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
      accentLabel: 'Accent color',
      accents: {
        blue: 'Classic Blue',
        indigo: 'Indigo',
        emerald: 'Emerald',
        amber: 'Editorial Amber',
        rose: 'Rose',
      },
      desktopDockLabel: 'Desktop dock',
      mobileDockLabel: 'Mobile dock',
      adaptiveTintLabel: 'Adaptive cover tinting',
      adaptiveTintDescription:
        'Applies a subtle chromatic halo (--book-tint) extracted from each cover to cards and sagas.',
      reducedMotionLabel: 'Motion & animations',
      reducedMotionDescription:
        'Reduce interface transitions and motion effects or follow your system preference.',
      reducedMotionSystem: 'System',
      reducedMotionReduce: 'Reduced',
      defaultViewLabel: 'Catalog view',
      viewGrid: 'Grid',
      viewDetailed: 'Detailed',
      viewCompact: 'Compact',
      suppressedConfirmsLabel: 'Suppressed confirmations',
      suppressedConfirmsReset: 'Reset prompts',
      suppressedConfirmsResetDone: 'Prompts reset',
    },
    catalogReading: {
      displayCardTitle: 'Catalog & cards',
      displayCardDescription:
        'Configure default view, initial sort order, and visible card elements.',
      defaultViewLabel: 'Default catalog view',
      viewGrid: 'Grid',
      viewDetailed: 'Detailed',
      viewCompact: 'Compact',
      defaultSortLabel: 'Default catalog sort',
      showCardActionsLabel: 'Quick actions on cards',
      showCardActionsDescription:
        'Show log reading, view, edit, and delete buttons on each book card.',
      showCardProgressLabel: 'Progress bar on grid cards',
      showCardProgressDescription: 'Show the bottom progress bar overlay on covers in grid view.',
      readingCardTitle: 'New book & reading session defaults',
      readingCardDescription: 'Speed up book creation and quick page logging from the dashboard.',
      defaultFormatLabel: 'Default format',
      defaultStatusLabel: 'Default initial status',
      quickPageStepLabel: 'Dashboard quick page step',
      quickPageStepDescription:
        'Number of pages added by the quick increment button on the current read.',
      trackReadingTimeLabel: 'Track reading time (minutes)',
      trackReadingTimeDescription:
        'Include the minutes duration field when logging sessions (prepares reading pace analytics).',
      confirmationsCardTitle: 'Confirmation dialogs',
      confirmationsCardDescription:
        'Enable or silence individual prompts before destructive or special actions.',
      confirmDeleteReadingLogLabel: 'Ask before deleting a reading session',
      confirmUnlinkSagaBookLabel: 'Ask before unlinking a book from a saga',
      confirmManualAntiqueYearLabel: 'Ask before saving an antique publication year (< 1900)',
      restoreAllConfirmations: 'Restore all confirmations',
      allConfirmationsRestored: 'All confirmation prompts are active',
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
      persistenceLabel: 'Persistence',
      persistencePersisted: 'Protected from eviction',
      persistenceBestEffort: 'Best-effort',
      persistenceUnsupported: 'Unsupported',
      requestPersistentAction: 'Request persistent storage',
      requestPersistentGranted: 'Storage protected against automatic browser eviction.',
      requestPersistentDenied:
        'Browser kept best-effort storage; installing as PWA or bookmarking increases approval.',
      requestPersistentUnsupported: 'This browser does not support requesting persistent storage.',
      diagnosticsLabel: 'Diagnostics',
      diagnosticsVersionPrefix: 'v',
      diagnosticsStoresLabel: 'stores',
    },
    portability: {
      sectionTitle: 'Data portability & backups',
      sectionDescription:
        'Export or restore your full library in JSON or your book catalog table in CSV.',
      includePreferencesLabel: 'Include app preferences in backups',
      includePreferencesDescription:
        'Saves theme, accent, dock, view, privacy, and scanner settings inside JSON and ZIP backups.',
      lastBackupLabel: 'Last backup',
      lastBackupNever: 'No backups recorded yet',
      restorePreferencesLabel: 'Restore saved app preferences',
      restorePreferencesDescription:
        'Applies the language, theme, layout, and privacy settings stored in this backup.',
      dangerZoneShortcutTitle: 'Need to clear logs, reset preferences, or wipe your library?',
      dangerZoneShortcutDescription: 'Jump directly to the Danger Zone in Advanced & System.',
      dangerZoneShortcutAction: 'Go to Danger Zone',
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
      confirmOverwriteTitle: 'Overwrite current library',
      confirmOverwriteMessage:
        'Overwrite mode will replace your entire current local library with the backup contents. This action cannot be undone.',
      confirmOverwriteAction: 'Overwrite library',
      confirmOverwritePreviewTitle: 'Current local library',
      confirmOverwritePreviewSubtitle: '{books} books · {logs} sessions',
      importErrorInvalidFile: 'The selected file is not a valid JSON or CSV backup.',
      importErrorNoValidRecords: 'No valid records were found to import.',
      importErrorExecution: 'Could not complete the import. Previous state was restored.',
      encryptionToggleLabel: 'Protect backup with a password (AES-256)',
      encryptionToggleDescription:
        'Encrypts .JSON and .ZIP exports locally with PBKDF2 + AES-GCM-256 before downloading.',
      encryptionPasswordLabel: 'Encryption password',
      encryptionPasswordPlaceholder: 'Minimum 8 characters',
      encryptionConfirmPasswordLabel: 'Confirm password',
      encryptionConfirmPasswordPlaceholder: 'Re-enter password',
      encryptionShowPasswordLabel: 'Show password',
      encryptionHidePasswordLabel: 'Hide password',
      encryptionStrengthLabel: 'Strength',
      encryptionStrengthWeak: 'Weak',
      encryptionStrengthFair: 'Fair',
      encryptionStrengthStrong: 'Strong',
      encryptionMinLengthHint: 'Enter at least 8 characters to encrypt your backup.',
      encryptionMismatchError: 'Passwords do not match.',
      encryptionUnrecoverableWarning:
        '100% Local-First: BookStack never stores this password. If forgotten, the backup cannot be recovered.',
      encryptionUnavailableError: 'Web Crypto API is unavailable in this browser or context.',
      exportSuccessEncryptedJson: 'Encrypted JSON backup (.enc.json) exported successfully.',
      exportSuccessEncryptedZip: 'Encrypted .ZIP bundle (.enc.json) exported successfully.',
      decryptCardTitle: 'This backup is encrypted',
      decryptCardDescription:
        'Enter your password to decrypt "{file}" locally before previewing records.',
      decryptPasswordLabel: 'Backup password',
      decryptAction: 'Unlock and preview',
      decryptingAction: 'Decrypting...',
      decryptErrorInvalidPassword:
        'Incorrect password or tampered encrypted file. Please try again.',
      decryptErrorUnsupportedFormat:
        'The encrypted file has an unsupported format or invalid parameters.',
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
      offlineBlockedBanner:
        '100% Offline Mode is active: automatic cover and metadata enrichment is disabled.',
      offlineBlockedLink: 'Manage in Privacy',
    },
    privacyScanner: {
      offlineCardTitle: '100% Offline Mode',
      offlineCardDescription:
        'Completely blocks all outbound network requests to public book catalogs and cover servers.',
      offlineToggleLabel: 'Enable 100% Offline Mode',
      offlineToggleDescription:
        'Only local features remain active: manual creation, local cover uploads, local ISBN scanning, IndexedDB, and backups.',
      offlineStatusActive: '100% Offline Active',
      offlineStatusOnline: 'Public Metadata Allowed',
      providersCardTitle: 'Public metadata providers (5 sources)',
      providersCardDescription:
        'Enable or disable individual public catalogs and reorder their priority when merging results and covers.',
      providersOfflineHint:
        '100% Offline Mode is active. Your provider preferences are preserved for when online lookups are re-enabled.',
      providersAllDisabledWarning:
        'All 5 providers are turned off. External lookups are skipped until at least one provider is enabled.',
      providersResetOrder: 'Reset default order',
      providerMoveUpAria: 'Move priority up for',
      providerMoveDownAria: 'Move priority down for',
      providerToggleAria: 'Toggle provider',
      providers: {
        googlebooks: {
          name: 'Google Books',
          description: 'Broad retail coverage, descriptions, and high-resolution covers.',
        },
        openlibrary: {
          name: 'Open Library',
          description: 'Open catalog with batch ISBN lookups, page counts, and work editions.',
        },
        applebooks: {
          name: 'Apple Books ES',
          description: 'Spanish retail editions with clean publisher cover art.',
        },
        wikidata: {
          name: 'Wikidata',
          description: 'Structured open knowledge graph with series and volume order.',
        },
        archive: {
          name: 'Internet Archive / Crossref',
          description: 'Historical archive, out-of-print editions, and academic works.',
        },
      },
      scannerCardTitle: 'Camera & ISBN scanner privacy',
      scannerCardDescription:
        'Manage local camera consent, remembered rear camera sensor, and default scanner startup behavior.',
      cameraConsentLabel: 'Local camera consent',
      cameraConsentGranted: 'Granted in this browser',
      cameraConsentNotGranted: 'No saved consent',
      cameraConsentRevoke: 'Revoke consent',
      cameraConsentRevokedDone: 'Camera consent reset',
      rememberedCameraLabel: 'Remembered rear camera sensor',
      rememberedCameraStored: 'Saved sensor:',
      rememberedCameraNone: 'No remembered rear camera',
      rememberedCameraForget: 'Forget remembered camera',
      rememberedCameraForgottenDone: 'Remembered camera cleared',
      preferPhotoModeLabel: 'Prefer photo upload mode',
      preferPhotoModeDescription:
        'Skips auto-starting the live camera viewfinder and highlights static barcode photo upload.',
      autoTorchLabel: 'Auto-enable flashlight (Torch)',
      autoTorchDescription:
        'Automatically turns on the LED torch when starting a rear camera that supports it.',
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
    dataHealth: {
      sectionTitle: 'Library data health auditor',
      sectionDescription:
        'Automatically detects anomalous years (such as 2925), inverted dates, progress mismatches, duplicates, and fragmented sagas.',
      scoreLabel: 'Library health',
      healthyBadge: '100% Healthy',
      healthyTitle: 'Your library is clean and consistent',
      healthyDescription:
        'No temporal anomalies, progress mismatches, duplicate books, or fragmented sagas were detected.',
      issuesDetectedLabel: 'Detected issues',
      autoFixableLabel: 'Auto-fixable',
      fixAllAction: 'Fix all auto-fixable issues ({count})',
      fixSingleAction: 'Fix',
      resolveDuplicateAction: 'Keep best record',
      fixedSingleMessage: 'Issue fixed successfully.',
      fixedAllMessage: 'Automatically fixed {count} issues.',
      confirmFixAllTitle: 'Apply {count} automatic fixes?',
      confirmFixAllMessage:
        'Detected temporal anomalies, progress mismatches, and fragmented saga names will be repaired without deleting any books.',
      confirmFixAllAction: 'Apply fixes',
      confirmDuplicateTitle: 'Remove duplicate book?',
      confirmDuplicateMessage:
        'The most complete record ("{keeper}") will be kept and {count} redundant duplicate(s) will be removed.',
      confirmDuplicateAction: 'Keep best & remove duplicates',
      cancelAction: 'Cancel',
      categories: {
        'temporal-anomaly': 'Temporal anomalies',
        'progress-mismatch': 'Progress & pages',
        'duplicate-book': 'Duplicate books',
        'fragmented-saga': 'Fragmented sagas',
      },
      severities: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      issues: {
        pubYearAnomalyTitle: 'Anomalous publication year: {title}',
        pubYearAnomalyDescription: 'Publication year ({year}) is outside the valid range.',
        startDateAnomalyTitle: 'Anomalous start date: {title}',
        startDateAnomalyDescription: 'Start date ({date}) contains an out-of-range year.',
        endDateAnomalyTitle: 'Anomalous end date: {title}',
        endDateAnomalyDescription: 'End date ({date}) contains an out-of-range year.',
        invertedDatesTitle: 'Inverted reading dates: {title}',
        invertedDatesDescription: 'End date ({endDate}) is earlier than start date ({startDate}).',
        logDateAnomalyTitle: 'Reading session with anomalous year: {title}',
        logDateAnomalyDescription: 'A reading session logged on {date} has an out-of-range year.',
        completedPagesMismatchTitle: 'Completed book with remaining pages: {title}',
        completedPagesMismatchDescription:
          'Marked as completed with {currentPage} of {totalPages} pages.',
        completedPlaceholderPagesTitle: 'Completed book with placeholder page count: {title}',
        completedPlaceholderPagesDescription:
          'Has {totalPages} page(s) recorded. Edit the book to enter its actual page count.',
        pendingWithProgressTitle: 'Pending book with reading progress: {title}',
        pendingWithProgressDescription:
          'Status is pending but {currentPage} pages are already logged.',
        duplicateBookTitle: 'Probable duplicate book: {title}',
        duplicateBookDescription:
          'Found {count} matching records ({reason}). The most complete record will be kept.',
        fragmentedSagaNameTitle: 'Inconsistent saga name: {saga}',
        fragmentedSagaNameDescription:
          '{count} books use different display spellings for this saga.',
        missingSagaVolumeTitle: 'Saga volumes missing volume number: {saga}',
        missingSagaVolumeDescription:
          '{count} book(s) in this saga do not have a volume number assigned.',
        manualFixHint: 'Manual review required',
      },
    },
    advanced: {
      compressionTitle: 'Cover optimization & compression',
      compressionDescription:
        'Tune maximum cover resolution and WebP/JPEG compression quality to balance sharpness against IndexedDB size.',
      maxDimensionLabel: 'Maximum resolution (longest edge)',
      maxDimensionUnit: 'px',
      qualityLabel: 'Compression quality',
      compressionHint:
        'New settings apply to newly uploaded or enriched covers; existing covers remain untouched.',
      quotaTitle: 'Metadata search quota',
      quotaDescription:
        'Limit how many results each lookup returns when adding books by ISBN or title.',
      quotaLabel: 'Results per search',
      quotaOptionSuffix: 'results',
      resetsTitle: 'Selective partial resets',
      resetsDescription:
        'Clear temporary caches or restore preferences without deleting any books, covers, or sagas.',
      clearColorCacheTitle: 'Clear cover color cache',
      clearColorCacheDescription:
        'Removes cached cover color palettes from localStorage; hues recompute lazily on next view.',
      clearColorCacheAction: 'Clear cache',
      clearColorCacheConfirmTitle: 'Clear cover color cache?',
      clearColorCacheConfirmMessage:
        'Extracted cover palettes in localStorage will be cleared. Your books and cover images remain untouched.',
      clearColorCacheConfirmAction: 'Yes, clear cache',
      clearColorCacheSuccess: 'Cover color cache cleared successfully.',
      clearLogsTitle: 'Clear reading session logs only',
      clearLogsDescription:
        'Deletes daily reading session records only while keeping all books, covers, and sagas intact.',
      clearLogsAction: 'Clear logs',
      clearLogsConfirmTitle: 'Clear all reading session logs?',
      clearLogsConfirmMessage:
        'All recorded reading sessions will be permanently deleted. Your books, covers, and sagas remain untouched.',
      clearLogsConfirmAction: 'Yes, clear logs',
      clearLogsSuccess: 'Reading session logs cleared.',
      resetPrefsTitle: 'Reset all preferences to defaults',
      resetPrefsDescription:
        'Restores theme, accent, dock position, catalog view, scanner, compression, and prompts to factory defaults.',
      resetPrefsAction: 'Reset preferences',
      resetPrefsConfirmTitle: 'Reset all app preferences?',
      resetPrefsConfirmMessage:
        'Visual, reading, privacy, and compression preferences will return to their default values. Your library stays untouched.',
      resetPrefsConfirmAction: 'Yes, reset',
      resetPrefsSuccess: 'All preferences have been reset to defaults.',
      cancelAction: 'Cancel',
      dismissStatusLabel: 'Dismiss notice',
      diagnosticsTitle: 'Technical diagnostic report',
      diagnosticsDescription:
        'Download a JSON snapshot with environment, storage, scanner, and preferences telemetry for debugging.',
      diagnosticsPrivacyNote:
        'Strictly anonymous: never includes book titles, authors, ISBNs, notes, or saga names.',
      diagnosticsAction: 'Export Diagnostic Report (.json)',
      diagnosticsExporting: 'Generating report...',
      diagnosticsSuccess: 'Technical diagnostic report downloaded successfully.',
    },
  },
};
