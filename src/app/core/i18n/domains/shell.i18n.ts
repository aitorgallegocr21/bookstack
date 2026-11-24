export interface ShellI18n {
  nav: {
    home: string;
    books: string;
    series: string;
    stats: string;
    settings: string;
    about: string;
    github: string;
    addBook: string;
    createBookAria: string;
    collapseSidebar: string;
    expandSidebar: string;
    lightTheme: string;
    darkTheme: string;
    switchToLight: string;
    switchToDark: string;
    mainMenuAria: string;
    bottomNavAria: string;
    dockPosition: string;
    dockLeft: string;
    dockRight: string;
    dockTop: string;
    dockBottom: string;
    dockDragHint: string;
    quickDockAria: string;
    moreMenuAria: string;
    moveDockTop: string;
    moveDockBottom: string;
  };
  status: {
    pending: string;
    reading: string;
    completed: string;
    abandoned: string;
  };
  common: {
    save: string;
    saving: string;
    cancel: string;
    close: string;
  };
  confirmDialog: {
    confirm: string;
    cancel: string;
    delete: string;
    dontAskAgainMinor: string;
    entityPreviewFallbackAlt: string;
  };
}

export const ES_SHELL: ShellI18n = {
  nav: {
    home: 'Inicio',
    books: 'Libros',
    series: 'Sagas',
    stats: 'Stats',
    settings: 'Ajustes',
    about: 'Acerca de',
    github: 'GitHub',
    addBook: 'Añadir libro',
    createBookAria: 'Crear nuevo libro',
    collapseSidebar: 'Contraer barra lateral',
    expandSidebar: 'Expandir barra lateral',
    lightTheme: 'Tema claro',
    darkTheme: 'Tema oscuro',
    switchToLight: 'Cambiar a tema claro',
    switchToDark: 'Cambiar a tema oscuro',
    mainMenuAria: 'Menú principal',
    bottomNavAria: 'Navegación inferior',
    dockPosition: 'Posición del dock',
    dockLeft: 'Izquierda',
    dockRight: 'Derecha',
    dockTop: 'Arriba',
    dockBottom: 'Abajo',
    dockDragHint: 'Arrastra para acoplar el dock',
    quickDockAria: 'Cambiar posición del dock',
    moreMenuAria: 'Más opciones de navegación',
    moveDockTop: 'Mover arriba',
    moveDockBottom: 'Mover abajo',
  },
  status: {
    pending: 'Por leer',
    reading: 'Leyendo',
    completed: 'Completado',
    abandoned: 'Abandonado',
  },
  common: {
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    close: 'Cerrar',
  },
  confirmDialog: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    dontAskAgainMinor: 'No volver a preguntar para esta acción',
    entityPreviewFallbackAlt: 'Portada del elemento',
  },
};

export const EN_SHELL: ShellI18n = {
  nav: {
    home: 'Home',
    books: 'Books',
    series: 'Series',
    stats: 'Stats',
    settings: 'Settings',
    about: 'About',
    github: 'GitHub',
    addBook: 'Add book',
    createBookAria: 'Create new book',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
    mainMenuAria: 'Main menu',
    bottomNavAria: 'Bottom navigation',
    dockPosition: 'Dock position',
    dockLeft: 'Left',
    dockRight: 'Right',
    dockTop: 'Top',
    dockBottom: 'Bottom',
    dockDragHint: 'Drag to dock to an edge',
    quickDockAria: 'Change dock position',
    moreMenuAria: 'More navigation options',
    moveDockTop: 'Move to top',
    moveDockBottom: 'Move to bottom',
  },
  status: {
    pending: 'Pending',
    reading: 'Reading',
    completed: 'Completed',
    abandoned: 'Abandoned',
  },
  common: {
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    close: 'Close',
  },
  confirmDialog: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    dontAskAgainMinor: 'Do not ask again for this action',
    entityPreviewFallbackAlt: 'Item cover',
  },
};
