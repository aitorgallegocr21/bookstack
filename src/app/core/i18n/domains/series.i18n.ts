export interface SeriesI18n {
  series: {
    title: string;
    subtitle: string;
    galleryAria: string;
    searchPlaceholder: string;
    searchAria: string;
    clearSearchAria: string;
    filters: {
      all: string;
      reading: string;
      completed: string;
      pending: string;
      hasGaps: string;
    };
    sortOptions: {
      recent: string;
      progressDesc: string;
      volumesDesc: string;
      ratingDesc: string;
      titleAsc: string;
    };
    sortAria: string;
    publicationStatus: {
      ongoing: string;
      completed: string;
      hiatus: string;
    };
    card: {
      volumeShort: string;
      volumesOf: string;
      ownedVolumes: string;
      missingSingle: string;
      missingPlural: string;
      continueReading: string;
      startVolume: string;
      upToDate: string;
      pagesProgress: string;
      averageRating: string;
      readingTime: string;
      openDetailsAria: string;
    };
    empty: {
      noSeriesTitle: string;
      noSeriesDescription: string;
      addBookToSeries: string;
      noMatchesTitle: string;
      noMatchesDescription: string;
      resetFilters: string;
    };
    detail: {
      modalAria: string;
      metadataTitle: string;
      nameLabel: string;
      expectedVolumesLabel: string;
      expectedVolumesPlaceholder: string;
      publicationStatusLabel: string;
      notesLabel: string;
      notesPlaceholder: string;
      saveMetadata: string;
      timelineTitle: string;
      missingSlotLabel: string;
      addMissingVolume: string;
      volumeNumberLabel: string;
      unnumberedVolume: string;
      unlinkBook: string;
      unlinkBookAria: string;
      openBookDetails: string;
      bulkLinkerTitle: string;
      bulkLinkerPlaceholder: string;
      bulkLinkerEmpty: string;
      linkBookAction: string;
      linkedBooksCount: string;
    };
  };
}

export const ES_SERIES: SeriesI18n = {
  series: {
    title: 'Sagas y Series',
    subtitle: 'Explora tus colecciones, detecta volúmenes faltantes y retoma tu lectura.',
    galleryAria: 'Galería de sagas',
    searchPlaceholder: 'Buscar por saga, libro o autor...',
    searchAria: 'Buscar sagas',
    clearSearchAria: 'Limpiar búsqueda de sagas',
    filters: {
      all: 'Todas',
      reading: 'En curso',
      completed: 'Completadas',
      pending: 'Por empezar',
      hasGaps: 'Con volúmenes faltantes',
    },
    sortOptions: {
      recent: 'Actividad reciente',
      progressDesc: 'Mayor progreso',
      volumesDesc: 'Más volúmenes',
      ratingDesc: 'Mejor valoradas',
      titleAsc: 'Nombre (A-Z)',
    },
    sortAria: 'Ordenar sagas',
    publicationStatus: {
      ongoing: 'En publicación',
      completed: 'Finalizada',
      hiatus: 'En pausa',
    },
    card: {
      volumeShort: 'Vol.',
      volumesOf: 'de',
      ownedVolumes: 'volúmenes',
      missingSingle: 'faltante',
      missingPlural: 'faltantes',
      continueReading: 'Continuar lectura',
      startVolume: 'Empezar Vol.',
      upToDate: 'Saga al día',
      pagesProgress: 'páginas leídas',
      averageRating: 'Nota media',
      readingTime: 'Tiempo leído',
      openDetailsAria: 'Abrir detalles de la saga',
    },
    empty: {
      noSeriesTitle: 'Todavía no tienes sagas registradas',
      noSeriesDescription:
        'Asigna una serie al crear o editar cualquiera de tus libros para organizar tus colecciones automáticamente.',
      addBookToSeries: 'Añadir libro a una saga',
      noMatchesTitle: 'Ninguna saga coincide con los filtros',
      noMatchesDescription: 'Prueba otra búsqueda o restablece los filtros activos.',
      resetFilters: 'Restablecer filtros',
    },
    detail: {
      modalAria: 'Detalles de la saga',
      metadataTitle: 'Metadatos de la colección',
      nameLabel: 'Nombre de la saga',
      expectedVolumesLabel: 'Volúmenes esperados',
      expectedVolumesPlaceholder: 'Ej. 7',
      publicationStatusLabel: 'Estado de publicación',
      notesLabel: 'Notas de la saga',
      notesPlaceholder: 'Orden de lectura, spin-offs o notas personales...',
      saveMetadata: 'Guardar saga',
      timelineTitle: 'Línea temporal de volúmenes',
      missingSlotLabel: 'Faltante',
      addMissingVolume: '+ Añadir Vol.',
      volumeNumberLabel: 'Vol.',
      unnumberedVolume: 'Sin número',
      unlinkBook: 'Desvincular',
      unlinkBookAria: 'Desvincular libro de la saga',
      openBookDetails: 'Ver ficha del libro',
      bulkLinkerTitle: 'Vincular libros existentes',
      bulkLinkerPlaceholder: 'Buscar libros sin saga por título o autor...',
      bulkLinkerEmpty: 'No hay libros disponibles para vincular.',
      linkBookAction: 'Vincular',
      linkedBooksCount: 'libros en esta saga',
    },
  },
};

export const EN_SERIES: SeriesI18n = {
  series: {
    title: 'Sagas & Series',
    subtitle: 'Explore your collections, spot missing volumes, and pick up where you left off.',
    galleryAria: 'Series gallery',
    searchPlaceholder: 'Search by series, book, or author...',
    searchAria: 'Search series',
    clearSearchAria: 'Clear series search',
    filters: {
      all: 'All',
      reading: 'In progress',
      completed: 'Completed',
      pending: 'To start',
      hasGaps: 'With missing volumes',
    },
    sortOptions: {
      recent: 'Recent activity',
      progressDesc: 'Highest progress',
      volumesDesc: 'Most volumes',
      ratingDesc: 'Highest rated',
      titleAsc: 'Name (A-Z)',
    },
    sortAria: 'Sort series',
    publicationStatus: {
      ongoing: 'Ongoing',
      completed: 'Completed',
      hiatus: 'On hiatus',
    },
    card: {
      volumeShort: 'Vol.',
      volumesOf: 'of',
      ownedVolumes: 'volumes',
      missingSingle: 'missing',
      missingPlural: 'missing',
      continueReading: 'Continue reading',
      startVolume: 'Start Vol.',
      upToDate: 'Up to date',
      pagesProgress: 'pages read',
      averageRating: 'Avg. rating',
      readingTime: 'Time read',
      openDetailsAria: 'Open series details',
    },
    empty: {
      noSeriesTitle: 'No series tracked yet',
      noSeriesDescription:
        'Assign a series when creating or editing any book to automatically organize your collections.',
      addBookToSeries: 'Add book to a series',
      noMatchesTitle: 'No series match your filters',
      noMatchesDescription: 'Try another search query or reset active filters.',
      resetFilters: 'Reset filters',
    },
    detail: {
      modalAria: 'Series details',
      metadataTitle: 'Collection metadata',
      nameLabel: 'Series name',
      expectedVolumesLabel: 'Expected volumes',
      expectedVolumesPlaceholder: 'e.g. 7',
      publicationStatusLabel: 'Publication status',
      notesLabel: 'Series notes',
      notesPlaceholder: 'Reading order, spin-offs, or personal notes...',
      saveMetadata: 'Save series',
      timelineTitle: 'Volume timeline',
      missingSlotLabel: 'Missing',
      addMissingVolume: '+ Add Vol.',
      volumeNumberLabel: 'Vol.',
      unnumberedVolume: 'Unnumbered',
      unlinkBook: 'Unlink',
      unlinkBookAria: 'Unlink book from series',
      openBookDetails: 'View book details',
      bulkLinkerTitle: 'Link existing books',
      bulkLinkerPlaceholder: 'Search standalone books by title or author...',
      bulkLinkerEmpty: 'No standalone books available to link.',
      linkBookAction: 'Link',
      linkedBooksCount: 'books in this series',
    },
  },
};
