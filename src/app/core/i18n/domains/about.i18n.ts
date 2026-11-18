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
    githubProfileLabel: string;
    githubProfileAria: string;
    githubRepoLabel: string;
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
    footerTagline: string;
  };
}

export const ES_ABOUT: AboutI18n = {
  about: {
    title: 'Acerca de BookStack',
    subtitle: 'Gestor de lectura basado en la filosofía Local-First',
    manifestoTitle: 'Manifiesto Local-First',
    manifestoIntroPrefix: 'BookStack está construido bajo los principios de la arquitectura ',
    manifestoIntroStrong: 'Local-First:',
    manifestoPoints: {
      localDataTitle: 'Datos Locales:',
      localDataText: 'Tu biblioteca reside completamente en tu dispositivo, bajo tu control.',
      privacyTitle: 'Privacidad:',
      privacyText:
        'Ningún servidor centralizado recopila datos personales de lectura o preferencias.',
      performanceTitle: 'Rendimiento:',
      performanceText: 'Acceso instantáneo a tu colección sin latencias de red.',
      independenceTitle: 'Independencia:',
      independenceText: 'Funciona sin conexión a internet y no depende de servicios de terceros.',
      portabilityTitle: 'Portabilidad:',
      portabilityText: 'Exporta y migra tus datos en cualquier momento sin restricciones.',
    },
    appInfoTitle: 'Información de la Aplicación',
    versionLabel: 'Versión',
    technologyLabel: 'Tecnología',
    technologyValue: 'Angular 22+ + Tailwind CSS v4',
    platformLabel: 'Plataforma',
    platformValue: 'Web + Responsive (Móvil)',
    authorshipTitle: 'Autoría',
    authorshipTextPrefix: 'BookStack está diseñado y desarrollado por ',
    githubProfileLabel: 'Perfil de GitHub',
    githubProfileAria: 'Perfil de Aitor Gallego-Casilda Romero en GitHub',
    githubRepoLabel: 'Código fuente en GitHub',
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
    footerTagline: 'Construido con dedicación. Propiedad tuya. Siempre.',
  },
};

export const EN_ABOUT: AboutI18n = {
  about: {
    title: 'About BookStack',
    subtitle: 'Reading tracker built around the Local-First philosophy',
    manifestoTitle: 'Local-First Manifesto',
    manifestoIntroPrefix: 'BookStack is engineered under ',
    manifestoIntroStrong: 'Local-First architecture principles:',
    manifestoPoints: {
      localDataTitle: 'Local Data:',
      localDataText: 'Your library lives entirely on your device, under your control.',
      privacyTitle: 'Privacy:',
      privacyText: 'No central server collects personal reading activity or preferences.',
      performanceTitle: 'Performance:',
      performanceText: 'Instant access to your collection with zero network latency.',
      independenceTitle: 'Independence:',
      independenceText: 'Works offline and does not depend on third-party cloud services.',
      portabilityTitle: 'Portability:',
      portabilityText: 'Export and migrate your data anytime without lock-in.',
    },
    appInfoTitle: 'Application Information',
    versionLabel: 'Version',
    technologyLabel: 'Technology',
    technologyValue: 'Angular 22+ + Tailwind CSS v4',
    platformLabel: 'Platform',
    platformValue: 'Web + Responsive (Mobile)',
    authorshipTitle: 'Authorship',
    authorshipTextPrefix: 'BookStack is designed and developed by ',
    githubProfileLabel: 'GitHub Profile',
    githubProfileAria: 'Aitor Gallego-Casilda Romero GitHub profile',
    githubRepoLabel: 'Source Code on GitHub',
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
    footerTagline: 'Built with care. Yours forever.',
  },
};
