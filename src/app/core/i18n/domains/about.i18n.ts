export interface AboutI18n {
  about: {
    title: string;
    subtitle: string;
    manifestoTitle: string;
    manifestoIntroPrefix: string;
    manifestoIntroStrong: string;
    manifestoPoints: {
      localDataTitle: string;
      localDataText: string;
      privacyTitle: string;
      privacyText: string;
      performanceTitle: string;
      performanceText: string;
      independenceTitle: string;
      independenceText: string;
      portabilityTitle: string;
      portabilityText: string;
    };
    appInfoTitle: string;
    versionLabel: string;
    technologyLabel: string;
    technologyValue: string;
    platformLabel: string;
    platformValue: string;
    authorshipTitle: string;
    authorshipTextPrefix: string;
    authorMotto: string;
    githubProfileLabel: string;
    githubProfileAria: string;
    personalWebsiteLabel: string;
    personalWebsiteAria: string;
    instagramLabel: string;
    instagramAria: string;
    sourceCodeLabel: string;
    githubRepoAria: string;
    featuresTitle: string;
    features: {
      catalog: string;
      sessions: string;
      analytics: string;
      organization: string;
      theme: string;
      responsive: string;
      persistence: string;
    };
    privacyTitle: string;
    privacyIntro: string;
    privacyItems: {
      localStorageTitle: string;
      localStorageText: string;
      externalLookupTitle: string;
      externalLookupText: string;
      cameraAccessTitle: string;
      cameraAccessText: string;
    };
    legalTitle: string;
    licenseHeading: string;
    licenseSummary: string;
    warrantyNotice: string;
    attributionsHeading: string;
    attributionsText: string;
    footerTagline: string;
  };
}

export const ES_ABOUT: AboutI18n = {
  about: {
    title: 'Acerca de BookStack',
    subtitle: 'Gestor de lectura basado en la filosofía Local-First',
    manifestoTitle: 'Manifiesto Local-First',
    manifestoIntroPrefix: 'Diseñado bajo arquitectura ',
    manifestoIntroStrong: 'Local-First:',
    manifestoPoints: {
      localDataTitle: 'Datos locales:',
      localDataText:
        'Tu biblioteca, sesiones y sagas viven exclusivamente en tu dispositivo (IndexedDB / LocalStorage).',
      privacyTitle: 'Privacidad total:',
      privacyText:
        'Cero telemetría, cuentas o rastreadores. Las búsquedas por ISBN/título son opcionales y sin credenciales.',
      performanceTitle: 'Instantáneo:',
      performanceText: 'Acceso inmediato a tu colección sin latencias de red.',
      independenceTitle: '100 % offline:',
      independenceText:
        'Seguimiento completo sin conexión; las consultas externas son bajo demanda.',
      portabilityTitle: 'Portabilidad:',
      portabilityText: 'Exporta e importa tu biblioteca en JSON cuando quieras.',
    },
    appInfoTitle: 'Información de la Aplicación',
    versionLabel: 'Versión',
    technologyLabel: 'Tecnología',
    technologyValue: 'Angular 22+ + Tailwind CSS v4',
    platformLabel: 'Plataforma',
    platformValue: 'Web + Responsive (Móvil)',
    authorshipTitle: 'Autoría',
    authorshipTextPrefix: 'Diseñado y desarrollado por ',
    authorMotto: 'Aprende y deja aprender.',
    githubProfileLabel: 'GitHub',
    githubProfileAria: 'Perfil de Aitor Gallego-Casilda Romero en GitHub',
    personalWebsiteLabel: 'Web personal',
    personalWebsiteAria: 'Página web personal de Aitor Gallego-Casilda Romero',
    instagramLabel: 'Instagram',
    instagramAria: 'Perfil de Instagram de Aitor Gallego-Casilda Romero',
    sourceCodeLabel: 'Código fuente',
    githubRepoAria: 'Código fuente de BookStack en GitHub',
    featuresTitle: 'Características',
    features: {
      catalog: 'Gestión completa de biblioteca de libros',
      sessions: 'Registro detallado de sesiones de lectura',
      analytics: 'Estadísticas avanzadas de lectura',
      organization: 'Organización por series y géneros',
      theme: 'Soporte para modo claro y modo oscuro',
      responsive: 'Interfaz responsiva para dispositivos móviles y desktop',
      persistence: 'Persistencia Local-First en IndexedDB / LocalStorage',
    },
    privacyTitle: 'Privacidad y Permisos del Dispositivo',
    privacyIntro:
      'BookStack minimiza la exposición de datos y solicita permisos únicamente cuando activas funciones opcionales:',
    privacyItems: {
      localStorageTitle: 'Almacenamiento local (IndexedDB y LocalStorage):',
      localStorageText:
        'Todos tus libros, sesiones, metas y preferencias permanecen en tu dispositivo hasta que los exportes o borres desde Ajustes.',
      externalLookupTitle: 'Consultas de metadatos externos (opcional):',
      externalLookupText:
        'Solo se ejecutan al lanzar manualmente una búsqueda por ISBN o título. Envían únicamente tu consulta y las cabeceras HTTP estándar (dirección IP) a Open Library (Internet Archive) y Google Books API con credentials: "omit" y referrerPolicy: "no-referrer".',
      cameraAccessTitle: 'Acceso a la cámara (opcional):',
      cameraAccessText:
        'Se utiliza exclusivamente en tu navegador mediante BarcodeDetector nativo o ZXing-WASM local para decodificar códigos de barras ISBN en local. Ningún fotograma de vídeo se almacena ni se transmite.',
    },
    legalTitle: 'Aviso Legal, Licencia y Atribuciones',
    licenseHeading: 'Licencia MIT — Copyright © 2026 Aitor Gallego-Casilda Romero',
    licenseSummary:
      'Este proyecto es software libre bajo licencia MIT. Puedes consultar el texto completo en el repositorio de GitHub.',
    warrantyNotice:
      'El software se proporciona «tal cual» (as is), sin garantías de ningún tipo. Recuerda exportar copias de seguridad periódicas en formato JSON desde Ajustes.',
    attributionsHeading: 'APIs de terceros y stack de código abierto',
    attributionsText:
      'Metadatos opcionales proporcionados por Open Library (Internet Archive) y Google Books API. Construido con Angular, Tailwind CSS, Lucide Icons, Zod y barcode-detector (ZXing-WASM).',
    footerTagline: 'Construido con dedicación. Propiedad tuya. Siempre.',
  },
};

export const EN_ABOUT: AboutI18n = {
  about: {
    title: 'About BookStack',
    subtitle: 'Reading tracker built around the Local-First philosophy',
    manifestoTitle: 'Local-First Manifesto',
    manifestoIntroPrefix: 'Engineered under ',
    manifestoIntroStrong: 'Local-First principles:',
    manifestoPoints: {
      localDataTitle: 'Local data:',
      localDataText:
        'Your library, reading logs, and series live exclusively on your device (IndexedDB / LocalStorage).',
      privacyTitle: 'Zero tracking:',
      privacyText:
        'No telemetry, cloud accounts, or trackers. Opt-in ISBN/title lookups run without credentials.',
      performanceTitle: 'Instant:',
      performanceText: 'Immediate access to your collection with zero network latency.',
      independenceTitle: '100% offline:',
      independenceText:
        'Full reading tracking offline; external catalog lookups are always opt-in.',
      portabilityTitle: 'Portable:',
      portabilityText: 'Export and migrate your library as JSON anytime without lock-in.',
    },
    appInfoTitle: 'Application Information',
    versionLabel: 'Version',
    technologyLabel: 'Technology',
    technologyValue: 'Angular 22+ + Tailwind CSS v4',
    platformLabel: 'Platform',
    platformValue: 'Web + Responsive (Mobile)',
    authorshipTitle: 'Authorship',
    authorshipTextPrefix: 'Designed and built by ',
    authorMotto: 'Learn and let learn.',
    githubProfileLabel: 'GitHub',
    githubProfileAria: 'Aitor Gallego-Casilda Romero GitHub profile',
    personalWebsiteLabel: 'Personal Website',
    personalWebsiteAria: 'Aitor Gallego-Casilda Romero personal website',
    instagramLabel: 'Instagram',
    instagramAria: 'Aitor Gallego-Casilda Romero Instagram profile',
    sourceCodeLabel: 'Source Code',
    githubRepoAria: 'BookStack source code on GitHub',
    featuresTitle: 'Features',
    features: {
      catalog: 'Complete book library management',
      sessions: 'Detailed reading session logging',
      analytics: 'Advanced reading statistics',
      organization: 'Organization by series and genres',
      theme: 'Light and dark mode support',
      responsive: 'Responsive interface for mobile and desktop',
      persistence: 'Local-First persistence in IndexedDB / LocalStorage',
    },
    privacyTitle: 'Privacy & Device Permissions',
    privacyIntro:
      'BookStack minimizes data exposure and only requests permissions when you explicitly trigger optional features:',
    privacyItems: {
      localStorageTitle: 'Local Storage (IndexedDB & LocalStorage):',
      localStorageText:
        'All your books, reading sessions, goals, and preferences stay exclusively on your device until you export or clear them in Settings.',
      externalLookupTitle: 'External Metadata Queries (Opt-In):',
      externalLookupText:
        'Triggered only when you manually run an ISBN or title search. Sends only your search query and standard HTTP request headers (IP address) to Open Library (Internet Archive) and Google Books API with credentials: "omit" and referrerPolicy: "no-referrer".',
      cameraAccessTitle: 'Camera Access (Opt-In):',
      cameraAccessText:
        'Used exclusively in-browser via native BarcodeDetector or local ZXing-WASM to decode ISBN barcodes locally. Video frames are never transmitted or stored.',
    },
    legalTitle: 'Legal Notice, License & Attributions',
    licenseHeading: 'MIT License — Copyright © 2026 Aitor Gallego-Casilda Romero',
    licenseSummary:
      'This project is open-source software licensed under the MIT License. See the full license text in the GitHub repository.',
    warrantyNotice:
      'The software is provided "as is", without warranty of any kind. Remember to export periodic JSON backups from Settings.',
    attributionsHeading: 'Third-Party APIs & Open-Source Stack',
    attributionsText:
      'Optional metadata provided by Open Library (Internet Archive) and Google Books API. Built with Angular, Tailwind CSS, Lucide Icons, Zod, and barcode-detector (ZXing-WASM).',
    footerTagline: 'Built with care. Yours forever.',
  },
};
