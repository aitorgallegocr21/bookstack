export interface BooksI18n {
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
    viewCatalog: string;
    viewSeries: string;
  };
  catalog: {
    searchPlaceholder: string;
    searchAria: string;
    clearSearchAria: string;
    viewModes: {
      grid: string;
      detailed: string;
      compact: string;
    };
    sortOptions: {
      recent: string;
      titleAsc: string;
      titleDesc: string;
      authorAsc: string;
      ratingDesc: string;
      progressDesc: string;
      pagesDesc: string;
    };
    statusChips: {
      all: string;
      reading: string;
      pending: string;
      completed: string;
      abandoned: string;
    };
    filterButton: string;
    filterButtonAria: string;
    activeFiltersBadgeAria: string;
    clearFilters: string;
    resultsCount: string;
    resultsCountSingle: string;
    emptyState: {
      title: string;
      description: string;
      resetAction: string;
    };
    drawer: {
      formatTitle: string;
      formatAll: string;
      ratingTitle: string;
      ratingAll: string;
      starsSuffix: string;
    };
  };
  bookForm: {
    libraryBadge: string;
    createTitle: string;
    editTitle: string;
    createSubmit: string;
    saveChanges: string;
    closeModalAria: string;
    basicInfoSection: string;
    progressFormatSection: string;
    seriesSection: string;
    datesCoverSection: string;
    notesSection: string;
    titleLabel: string;
    titlePlaceholder: string;
    authorLabel: string;
    authorPlaceholder: string;
    isbnLabel: string;
    isbnPlaceholder: string;
    yearLabel: string;
    yearPlaceholder: string;
    publisherLabel: string;
    publisherPlaceholder: string;
    formatLabel: string;
    formatTitle: string;
    statusLabel: string;
    createStatusTitle: string;
    editStatusTitle: string;
    ratingLabel: string;
    ratingPlaceholder: string;
    totalPagesLabel: string;
    totalPagesError: string;
    currentPageExceedsTotalError: string;
    readPagesLabel: string;
    totalChaptersLabel: string;
    readChaptersLabel: string;
    totalCharactersLabel: string;
    belongsToSeriesLabel: string;
    seriesNameLabel: string;
    seriesNamePlaceholder: string;
    seriesVolumeLabel: string;
    seriesVolumePlaceholder: string;
    seriesAutocompleteHint: string;
    seriesSuggestionsAria: string;
    startDateLabel: string;
    endDateLabel: string;
    notesPlaceholder: string;
    formats: {
      physical: string;
      ebook: string;
      audiobook: string;
    };
    cover: {
      label: string;
      webUrlTab: string;
      webUrlTabTitle: string;
      uploadFileTab: string;
      uploadFileTabTitle: string;
      urlLabel: string;
      urlPlaceholder: string;
      dropzoneTitle: string;
      dropzoneFormats: string;
      chooseFile: string;
      selectedFileTitle: string;
      preview: string;
      remove: string;
      removeAria: string;
      previewAlt: string;
      uploadError: string;
    };
    lookup: {
      panelTitle: string;
      panelSubtitle: string;
      expandAria: string;
      collapseAria: string;
      scanTab: string;
      searchTab: string;
      searchPlaceholder: string;
      searchButton: string;
      searchEmptyHint: string;
      isbnLookupButton: string;
      isbnLookupAria: string;
      startCamera: string;
      stopCamera: string;
      switchCamera: string;
      uploadPhoto: string;
      scanningHint: string;
      permissionError: string;
      cameraUnavailableError: string;
      invalidBarcodeError: string;
      noBarcodeInImageError: string;
      searchingMetadata: string;
      optimizingCover: string;
      resultsTitle: string;
      noResults: string;
      networkError: string;
      pagesUnit: string;
      useEditionButton: string;
      sources: {
        openlibrary: string;
        googlebooks: string;
        merged: string;
      };
      duplicateWarningTitle: string;
      duplicateWarningByIsbn: string;
      duplicateWarningByTitle: string;
      applyFillEmpty: string;
      applyOverwritePublic: string;
      appliedFeedback: string;
      editProtectionHint: string;
    };
  };
  bookDetail: {
    closeModalAria: string;
    coverAltPrefix: string;
    progress: string;
    logReading: string;
    logReadingButton: string;
    editBook: string;
    detailsHeading: string;
    isbn: string;
    publisher: string;
    year: string;
    series: string;
    chapters: string;
    characters: string;
    readingDates: string;
    startPrefix: string;
    endPrefix: string;
    sessionsTitle: string;
    showMore: string;
    showLess: string;
    noSessions: string;
    pagesReadSuffix: string;
    minutesUnit: string;
    editSessionTitle: string;
    deleteSessionTitle: string;
    editAction: string;
    deleteAction: string;
    volumePrefix: string;
  };
  readingLog: {
    badge: string;
    editTitle: string;
    createTitle: string;
    closeAria: string;
    date: string;
    pagesRead: string;
    timeMinutes: string;
    notes: string;
  };
}

export const ES_BOOKS: BooksI18n = {
  books: {
    title: 'Biblioteca',
    subtitle: 'Gestiona tus libros y registra tu progreso.',
    listAria: 'Lista de libros',
    noFormat: 'Sin formato',
    pagesUnit: 'págs.',
    noRating: 'Sin valoración',
    logAction: 'Registrar',
    logReadingAria: 'Registrar lectura de',
    viewDetails: 'Ver detalles',
    edit: 'Editar',
    delete: 'Eliminar',
    emptyState: 'No hay libros todavía.',
    confirmDeleteBook:
      '¿Estás seguro de que deseas eliminar este libro? Se conservarán sus lecturas asociadas.',
    confirmDeleteLog: '¿Deseas borrar este registro de lectura?',
    viewCatalog: 'Catálogo',
    viewSeries: 'Sagas',
  },
  catalog: {
    searchPlaceholder: 'Buscar por título, autor o saga...',
    searchAria: 'Buscar en la biblioteca',
    clearSearchAria: 'Limpiar búsqueda',
    viewModes: {
      grid: 'Vista de cuadrícula',
      detailed: 'Vista detallada',
      compact: 'Vista compacta',
    },
    sortOptions: {
      recent: 'Recientes',
      titleAsc: 'Título (A-Z)',
      titleDesc: 'Título (Z-A)',
      authorAsc: 'Autor (A-Z)',
      ratingDesc: 'Mayor valoración',
      progressDesc: 'Mayor progreso',
      pagesDesc: 'Número de páginas',
    },
    statusChips: {
      all: 'Todos',
      reading: 'Leyendo',
      pending: 'Por leer',
      completed: 'Completados',
      abandoned: 'Abandonados',
    },
    filterButton: 'Filtros',
    filterButtonAria: 'Alternar panel de filtros secundarios',
    activeFiltersBadgeAria: 'filtros activos',
    clearFilters: 'Limpiar filtros',
    resultsCount: 'Mostrando {count} de {total} libros',
    resultsCountSingle: 'Mostrando 1 libro',
    emptyState: {
      title: 'No se encontraron libros',
      description:
        'No hay libros que coincidan con los criterios de búsqueda y filtros seleccionados.',
      resetAction: 'Restablecer filtros',
    },
    drawer: {
      formatTitle: 'Formato',
      formatAll: 'Todos los formatos',
      ratingTitle: 'Valoración mínima',
      ratingAll: 'Todas las valoraciones',
      starsSuffix: 'o más',
    },
  },
  bookForm: {
    libraryBadge: 'Biblioteca',
    createTitle: 'Añadir nuevo libro',
    editTitle: 'Editar datos del libro',
    createSubmit: 'Añadir libro',
    saveChanges: 'Guardar cambios',
    closeModalAria: 'Cerrar modal',
    basicInfoSection: 'Información básica',
    progressFormatSection: 'Progreso y formato',
    seriesSection: 'Saga / serie',
    datesCoverSection: 'Fechas y portada',
    notesSection: 'Notas',
    titleLabel: 'Título',
    titlePlaceholder: 'Ej. El problema de los tres cuerpos',
    authorLabel: 'Autor',
    authorPlaceholder: 'Ej. Cixin Liu',
    isbnLabel: 'ISBN',
    isbnPlaceholder: '978-84-...',
    yearLabel: 'Año',
    yearPlaceholder: '2025',
    publisherLabel: 'Editorial',
    publisherPlaceholder: 'Nombre de la editorial',
    formatLabel: 'Formato',
    formatTitle: 'Formato del libro',
    statusLabel: 'Estado',
    createStatusTitle: 'Estado inicial del libro',
    editStatusTitle: 'Estado del libro',
    ratingLabel: 'Valoración',
    ratingPlaceholder: '0 - 10',
    totalPagesLabel: 'Páginas totales',
    totalPagesError: 'El total de páginas debe ser al menos 1',
    currentPageExceedsTotalError: 'Las páginas leídas no pueden superar el total de páginas',
    readPagesLabel: 'Páginas leídas',
    totalChaptersLabel: 'Capítulos totales',
    readChaptersLabel: 'Capítulos leídos',
    totalCharactersLabel: 'Total de caracteres',
    belongsToSeriesLabel: 'Pertenece a una saga',
    seriesNameLabel: 'Nombre de serie',
    seriesNamePlaceholder: 'Ej. Trilogía de la Fundación',
    seriesVolumeLabel: 'Número de volumen',
    seriesVolumePlaceholder: '1',
    seriesAutocompleteHint: 'Sugerencia: elige una saga existente o escribe un nuevo nombre',
    seriesSuggestionsAria: 'Sugerencias de sagas existentes',
    startDateLabel: 'Fecha inicio',
    endDateLabel: 'Fecha fin',
    notesPlaceholder: 'Sinopsis, expectativas o notas personales...',
    formats: {
      physical: 'Físico',
      ebook: 'Ebook',
      audiobook: 'Audiolibro',
    },
    cover: {
      label: 'Portada',
      webUrlTab: 'URL web',
      webUrlTabTitle: 'Usar URL de portada',
      uploadFileTab: 'Subir archivo',
      uploadFileTabTitle: 'Subir archivo de portada',
      urlLabel: 'URL de portada',
      urlPlaceholder: 'https://...',
      dropzoneTitle: 'Arrastra una imagen aquí',
      dropzoneFormats: 'PNG, JPG, WebP o AVIF',
      chooseFile: 'Elegir archivo',
      selectedFileTitle: 'Archivo seleccionado',
      preview: 'Previsualización',
      remove: 'Eliminar',
      removeAria: 'Eliminar portada',
      previewAlt: 'Previsualización de la portada',
      uploadError: 'No se pudo procesar la imagen. Usa PNG, JPG, WebP o AVIF (máx. 10 MB).',
    },
    lookup: {
      panelTitle: 'Autocompletar con ISBN o búsqueda',
      panelSubtitle: 'Escanea el código de barras o busca por título/autor',
      expandAria: 'Expandir panel de búsqueda y escáner ISBN',
      collapseAria: 'Contraer panel de búsqueda y escáner ISBN',
      scanTab: 'Escanear código',
      searchTab: 'Buscar libro',
      searchPlaceholder: 'Título, autor o ISBN...',
      searchButton: 'Buscar',
      searchEmptyHint: 'Introduce un título, autor o ISBN para buscar ediciones públicas.',
      isbnLookupButton: 'Buscar',
      isbnLookupAria: 'Buscar metadatos para este ISBN',
      startCamera: 'Iniciar cámara',
      stopCamera: 'Detener cámara',
      switchCamera: 'Cambiar cámara',
      uploadPhoto: 'Subir foto del código',
      scanningHint: 'Apunta la cámara al código de barras ISBN (978/979) del libro.',
      permissionError: 'Permiso de cámara denegado. Puedes subir una foto del código de barras.',
      cameraUnavailableError: 'No se detectó ninguna cámara disponible en este dispositivo.',
      invalidBarcodeError: 'El código leído no corresponde a un ISBN válido.',
      noBarcodeInImageError: 'No se encontró ningún código de barras ISBN en la imagen.',
      searchingMetadata: 'Buscando metadatos...',
      optimizingCover: 'Optimizando portada localmente...',
      resultsTitle: 'Ediciones encontradas',
      noResults: 'No se encontraron ediciones para esa búsqueda.',
      networkError: 'No se pudo conectar con los catálogos públicos. Revisa tu conexión.',
      pagesUnit: 'págs.',
      useEditionButton: 'Usar edición',
      sources: {
        openlibrary: 'Open Library',
        googlebooks: 'Google Books',
        merged: 'Combinado',
      },
      duplicateWarningTitle: 'Posible libro duplicado en tu biblioteca',
      duplicateWarningByIsbn: 'Coincide por ISBN con:',
      duplicateWarningByTitle: 'Coincide por título y autor con:',
      applyFillEmpty: 'Rellenar campos vacíos',
      applyOverwritePublic: 'Sobrescribir datos públicos',
      appliedFeedback: 'Datos aplicados al formulario',
      editProtectionHint:
        'Tu progreso, valoración, fechas, notas y saga personales nunca se sobrescriben.',
    },
  },
  bookDetail: {
    closeModalAria: 'Cerrar modal',
    coverAltPrefix: 'Portada de',
    progress: 'Progreso',
    logReading: 'Registrar lectura',
    logReadingButton: '+ Registrar lectura',
    editBook: 'Editar libro',
    detailsHeading: 'Detalles del libro',
    isbn: 'ISBN',
    publisher: 'Editorial',
    year: 'Año',
    series: 'Saga / serie',
    chapters: 'Capítulos',
    characters: 'Caracteres',
    readingDates: 'Fechas de lectura',
    startPrefix: 'Inicio:',
    endPrefix: 'Fin:',
    sessionsTitle: 'Sesiones de lectura',
    showMore: 'Ver más',
    showLess: 'Ver menos',
    noSessions: 'Sin sesiones registradas para este libro.',
    pagesReadSuffix: 'páginas leídas',
    minutesUnit: 'min',
    editSessionTitle: 'Editar sesión',
    deleteSessionTitle: 'Borrar sesión',
    editAction: 'Editar',
    deleteAction: 'Borrar',
    volumePrefix: 'Vol.',
  },
  readingLog: {
    badge: 'Sesión de lectura',
    editTitle: 'Editar sesión',
    createTitle: 'Registrar lectura',
    closeAria: 'Cerrar editor',
    date: 'Fecha',
    pagesRead: 'Páginas leídas',
    timeMinutes: 'Tiempo (min)',
    notes: 'Notas',
  },
};

export const EN_BOOKS: BooksI18n = {
  books: {
    title: 'Library',
    subtitle: 'Manage your books and track your reading progress.',
    listAria: 'Book list',
    noFormat: 'No format',
    pagesUnit: 'pages',
    noRating: 'Unrated',
    logAction: 'Log',
    logReadingAria: 'Log reading for',
    viewDetails: 'View details',
    edit: 'Edit',
    delete: 'Delete',
    emptyState: 'No books yet.',
    confirmDeleteBook:
      'Are you sure you want to delete this book? Associated reading logs will be preserved.',
    confirmDeleteLog: 'Do you want to delete this reading log?',
    viewCatalog: 'Catalog',
    viewSeries: 'Series',
  },
  catalog: {
    searchPlaceholder: 'Search by title, author, or series...',
    searchAria: 'Search library',
    clearSearchAria: 'Clear search query',
    viewModes: {
      grid: 'Grid view',
      detailed: 'Detailed view',
      compact: 'Compact view',
    },
    sortOptions: {
      recent: 'Recently updated',
      titleAsc: 'Title (A-Z)',
      titleDesc: 'Title (Z-A)',
      authorAsc: 'Author (A-Z)',
      ratingDesc: 'Highest rated',
      progressDesc: 'Most progress',
      pagesDesc: 'Number of pages',
    },
    statusChips: {
      all: 'All',
      reading: 'Reading',
      pending: 'To read',
      completed: 'Completed',
      abandoned: 'Abandoned',
    },
    filterButton: 'Filters',
    filterButtonAria: 'Toggle secondary filters panel',
    activeFiltersBadgeAria: 'active filters',
    clearFilters: 'Clear filters',
    resultsCount: 'Showing {count} of {total} books',
    resultsCountSingle: 'Showing 1 book',
    emptyState: {
      title: 'No books found',
      description: 'No books match the selected search query and filter criteria.',
      resetAction: 'Reset filters',
    },
    drawer: {
      formatTitle: 'Format',
      formatAll: 'All formats',
      ratingTitle: 'Minimum rating',
      ratingAll: 'All ratings',
      starsSuffix: 'or higher',
    },
  },
  bookForm: {
    libraryBadge: 'Library',
    createTitle: 'Add new book',
    editTitle: 'Edit book details',
    createSubmit: 'Add book',
    saveChanges: 'Save changes',
    closeModalAria: 'Close modal',
    basicInfoSection: 'Basic information',
    progressFormatSection: 'Progress & format',
    seriesSection: 'Series / saga',
    datesCoverSection: 'Dates & cover',
    notesSection: 'Notes',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. The Three-Body Problem',
    authorLabel: 'Author',
    authorPlaceholder: 'e.g. Cixin Liu',
    isbnLabel: 'ISBN',
    isbnPlaceholder: '978-0-...',
    yearLabel: 'Year',
    yearPlaceholder: '2025',
    publisherLabel: 'Publisher',
    publisherPlaceholder: 'Publisher name',
    formatLabel: 'Format',
    formatTitle: 'Book format',
    statusLabel: 'Status',
    createStatusTitle: 'Initial book status',
    editStatusTitle: 'Book status',
    ratingLabel: 'Rating',
    ratingPlaceholder: '0 - 10',
    totalPagesLabel: 'Total pages',
    totalPagesError: 'Total pages must be at least 1',
    currentPageExceedsTotalError: 'Current page cannot exceed total pages',
    readPagesLabel: 'Pages read',
    totalChaptersLabel: 'Total chapters',
    readChaptersLabel: 'Chapters read',
    totalCharactersLabel: 'Total characters',
    belongsToSeriesLabel: 'Part of a series',
    seriesNameLabel: 'Series name',
    seriesNamePlaceholder: 'e.g. Foundation Trilogy',
    seriesVolumeLabel: 'Volume number',
    seriesVolumePlaceholder: '1',
    seriesAutocompleteHint: 'Tip: pick an existing series or type a new name',
    seriesSuggestionsAria: 'Existing series suggestions',
    startDateLabel: 'Start date',
    endDateLabel: 'End date',
    notesPlaceholder: 'Synopsis, expectations, or personal notes...',
    formats: {
      physical: 'Physical',
      ebook: 'Ebook',
      audiobook: 'Audiobook',
    },
    cover: {
      label: 'Cover',
      webUrlTab: 'Web URL',
      webUrlTabTitle: 'Use cover URL',
      uploadFileTab: 'Upload file',
      uploadFileTabTitle: 'Upload cover file',
      urlLabel: 'Cover URL',
      urlPlaceholder: 'https://...',
      dropzoneTitle: 'Drag an image here',
      dropzoneFormats: 'PNG, JPG, WebP, or AVIF',
      chooseFile: 'Choose file',
      selectedFileTitle: 'Selected file',
      preview: 'Preview',
      remove: 'Remove',
      removeAria: 'Remove cover',
      previewAlt: 'Cover preview',
      uploadError: 'Could not process image. Use PNG, JPG, WebP, or AVIF (max 10 MB).',
    },
    lookup: {
      panelTitle: 'Auto-fill via ISBN or search',
      panelSubtitle: 'Scan barcode or search by title/author',
      expandAria: 'Expand ISBN scanner and lookup panel',
      collapseAria: 'Collapse ISBN scanner and lookup panel',
      scanTab: 'Scan barcode',
      searchTab: 'Search book',
      searchPlaceholder: 'Title, author, or ISBN...',
      searchButton: 'Search',
      searchEmptyHint: 'Enter a title, author, or ISBN to search public editions.',
      isbnLookupButton: 'Lookup',
      isbnLookupAria: 'Lookup metadata for this ISBN',
      startCamera: 'Start camera',
      stopCamera: 'Stop camera',
      switchCamera: 'Switch camera',
      uploadPhoto: 'Upload barcode photo',
      scanningHint: 'Point the camera at the book ISBN barcode (978/979).',
      permissionError: 'Camera permission denied. You can upload a photo of the barcode instead.',
      cameraUnavailableError: 'No available camera was detected on this device.',
      invalidBarcodeError: 'The scanned barcode is not a valid ISBN.',
      noBarcodeInImageError: 'No ISBN barcode was found in the selected image.',
      searchingMetadata: 'Searching metadata...',
      optimizingCover: 'Optimizing cover locally...',
      resultsTitle: 'Matching editions',
      noResults: 'No matching editions were found.',
      networkError: 'Could not reach public catalogs. Check your connection.',
      pagesUnit: 'pages',
      useEditionButton: 'Use edition',
      sources: {
        openlibrary: 'Open Library',
        googlebooks: 'Google Books',
        merged: 'Merged',
      },
      duplicateWarningTitle: 'Possible duplicate in your library',
      duplicateWarningByIsbn: 'Matches by ISBN with:',
      duplicateWarningByTitle: 'Matches by title and author with:',
      applyFillEmpty: 'Fill empty fields',
      applyOverwritePublic: 'Overwrite public data',
      appliedFeedback: 'Metadata applied to form',
      editProtectionHint:
        'Your personal progress, rating, dates, notes, and series are never overwritten.',
    },
  },
  bookDetail: {
    closeModalAria: 'Close modal',
    coverAltPrefix: 'Cover of',
    progress: 'Progress',
    logReading: 'Log reading',
    logReadingButton: '+ Log reading',
    editBook: 'Edit book',
    detailsHeading: 'Book details',
    isbn: 'ISBN',
    publisher: 'Publisher',
    year: 'Year',
    series: 'Series / saga',
    chapters: 'Chapters',
    characters: 'Characters',
    readingDates: 'Reading dates',
    startPrefix: 'Start:',
    endPrefix: 'End:',
    sessionsTitle: 'Reading sessions',
    showMore: 'Show more',
    showLess: 'Show less',
    noSessions: 'No reading sessions logged for this book.',
    pagesReadSuffix: 'pages read',
    minutesUnit: 'min',
    editSessionTitle: 'Edit session',
    deleteSessionTitle: 'Delete session',
    editAction: 'Edit',
    deleteAction: 'Delete',
    volumePrefix: 'Vol.',
  },
  readingLog: {
    badge: 'Reading session',
    editTitle: 'Edit session',
    createTitle: 'Log reading',
    closeAria: 'Close editor',
    date: 'Date',
    pagesRead: 'Pages read',
    timeMinutes: 'Time (min)',
    notes: 'Notes',
  },
};
