export type SettingsTabId = 'general' | 'catalog' | 'data' | 'privacy' | 'advanced';

export type SettingsTabIconKey =
  'palette' | 'book-open' | 'database' | 'shield-check' | 'sliders-horizontal';

export interface SettingsTabDefinition {
  readonly id: SettingsTabId;
  readonly icon: SettingsTabIconKey;
  readonly isDangerTone?: boolean;
}

export interface SettingsSearchEntry {
  readonly id: string;
  readonly tab: SettingsTabId;
  readonly settingId: string;
  readonly titleEs: string;
  readonly titleEn: string;
  readonly descriptionEs: string;
  readonly descriptionEn: string;
  readonly keywords: readonly string[];
}

export const SETTINGS_TAB_IDS: readonly SettingsTabId[] = [
  'general',
  'catalog',
  'data',
  'privacy',
  'advanced',
] as const;

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  { id: 'general', icon: 'palette' },
  { id: 'catalog', icon: 'book-open' },
  { id: 'data', icon: 'database' },
  { id: 'privacy', icon: 'shield-check' },
  { id: 'advanced', icon: 'sliders-horizontal', isDangerTone: true },
] as const;

export const SETTINGS_SEARCH_ENTRIES: readonly SettingsSearchEntry[] = [
  {
    id: 'language',
    tab: 'general',
    settingId: 'preferences',
    titleEs: 'Idioma de la interfaz',
    titleEn: 'Interface language',
    descriptionEs: 'Cambia entre español e inglés en toda la aplicación.',
    descriptionEn: 'Switch between Spanish and English across the app.',
    keywords: ['idioma', 'language', 'espanol', 'english', 'locale', 'es', 'en'],
  },
  {
    id: 'theme-accent',
    tab: 'general',
    settingId: 'preferences',
    titleEs: 'Tema visual, color de acento y movimiento reducido',
    titleEn: 'Visual theme, accent color & reduced motion',
    descriptionEs: 'Personaliza modo claro/oscuro, paleta de acento y animaciones.',
    descriptionEn: 'Customize light/dark mode, accent palette, and animations.',
    keywords: [
      'tema',
      'theme',
      'oscuro',
      'dark',
      'claro',
      'light',
      'acento',
      'accent',
      'animaciones',
      'motion',
    ],
  },
  {
    id: 'dock-layout',
    tab: 'general',
    settingId: 'preferences',
    titleEs: 'Posición del dock (escritorio y móvil)',
    titleEn: 'Dock position (desktop & mobile)',
    descriptionEs: 'Elige dónde anclar la barra de navegación principal.',
    descriptionEn: 'Choose where to anchor the main navigation bar.',
    keywords: [
      'dock',
      'barra',
      'navegacion',
      'navigation',
      'movil',
      'mobile',
      'escritorio',
      'desktop',
    ],
  },
  {
    id: 'catalog-reading',
    tab: 'catalog',
    settingId: 'catalog-reading',
    titleEs: 'Vista del catálogo, metas de lectura y avisos',
    titleEn: 'Catalog view, reading goals & prompts',
    descriptionEs: 'Configura la vista inicial, meta anual de libros y confirmaciones.',
    descriptionEn: 'Configure default view, annual reading goal, and confirmation prompts.',
    keywords: [
      'catalogo',
      'catalog',
      'vista',
      'grid',
      'meta',
      'goal',
      'lectura',
      'reading',
      'confirmaciones',
      'prompts',
    ],
  },
  {
    id: 'storage-quota',
    tab: 'data',
    settingId: 'storage-quota',
    titleEs: 'Inspector de almacenamiento local',
    titleEn: 'Local storage quota inspector',
    descriptionEs: 'Consulta el espacio ocupado por libros, portadas y sesiones en IndexedDB.',
    descriptionEn: 'Inspect space used by books, covers, and reading sessions in IndexedDB.',
    keywords: ['almacenamiento', 'storage', 'indexeddb', 'cuota', 'quota', 'espacio', 'space'],
  },
  {
    id: 'data-health',
    tab: 'data',
    settingId: 'data-health',
    titleEs: 'Auditor de salud de biblioteca',
    titleEn: 'Library data health auditor',
    descriptionEs: 'Detecta y repara fechas anómalas, duplicados y sagas fragmentadas.',
    descriptionEn: 'Detects and repairs anomalous dates, duplicates, and fragmented sagas.',
    keywords: ['salud', 'health', 'auditor', 'duplicados', 'duplicates', 'sagas', 'reparar', 'fix'],
  },
  {
    id: 'data-portability',
    tab: 'data',
    settingId: 'data-portability',
    titleEs: 'Copias de seguridad, cifrado e importación',
    titleEn: 'Backups, encryption & import/export',
    descriptionEs: 'Exporta o importa JSON, CSV, ZIP y copias cifradas con contraseña.',
    descriptionEn: 'Export or import JSON, CSV, ZIP, and password-encrypted backups.',
    keywords: [
      'copia',
      'backup',
      'exportar',
      'export',
      'importar',
      'import',
      'cifrado',
      'encryption',
      'crypto',
      'json',
      'csv',
      'zip',
    ],
  },
  {
    id: 'cover-enrichment',
    tab: 'data',
    settingId: 'cover-enrichment',
    titleEs: 'Enriquecimiento de portadas y metadatos',
    titleEn: 'Cover & metadata enrichment',
    descriptionEs: 'Completa portadas, páginas, editorial e ISBN desde catálogos públicos.',
    descriptionEn: 'Complete missing covers, pages, publisher, and ISBN from public catalogs.',
    keywords: ['portadas', 'covers', 'metadatos', 'metadata', 'isbn', 'enriquecer', 'enrich'],
  },
  {
    id: 'privacy-offline',
    tab: 'privacy',
    settingId: 'privacy-offline',
    titleEs: 'Modo offline estricto y privacidad de red',
    titleEn: 'Strict offline mode & network privacy',
    descriptionEs: 'Bloquea consultas externas y gestiona preferencias del escáner ISBN.',
    descriptionEn: 'Block external lookups and manage ISBN scanner camera preferences.',
    keywords: [
      'privacidad',
      'privacy',
      'offline',
      'red',
      'network',
      'escaner',
      'scanner',
      'camara',
      'camera',
    ],
  },
  {
    id: 'advanced-system',
    tab: 'advanced',
    settingId: 'advanced-system',
    titleEs: 'Compresión de portadas y diagnóstico del sistema',
    titleEn: 'Cover compression & system diagnostics',
    descriptionEs: 'Ajusta la compresión de imágenes, caché y herramientas de experto.',
    descriptionEn: 'Tune image compression, cache controls, and expert diagnostics.',
    keywords: [
      'avanzado',
      'advanced',
      'experto',
      'expert',
      'compresion',
      'compression',
      'calidad',
      'quality',
      'diagnostico',
      'diagnostics',
    ],
  },
  {
    id: 'danger-zone',
    tab: 'advanced',
    settingId: 'danger-zone',
    titleEs: 'Zona de peligro y restablecimiento',
    titleEn: 'Danger zone & factory reset',
    descriptionEs: 'Borra sesiones de lectura o restablece toda la aplicación local.',
    descriptionEn: 'Clear reading sessions or factory-reset all local application data.',
    keywords: ['peligro', 'danger', 'reset', 'restablecer', 'borrar', 'delete', 'clear'],
  },
] as const;

export function isSettingsTabId(value: string | null): value is SettingsTabId {
  return value !== null && (SETTINGS_TAB_IDS as readonly string[]).includes(value);
}

export function normalizeSettingsSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterSettingsSearchEntries(
  entries: readonly SettingsSearchEntry[],
  rawQuery: string
): readonly SettingsSearchEntry[] {
  const normalizedQuery = normalizeSettingsSearchText(rawQuery);
  if (!normalizedQuery) {
    return [];
  }

  return entries.filter((entry) => {
    const searchableText = normalizeSettingsSearchText(
      [
        entry.titleEs,
        entry.titleEn,
        entry.descriptionEs,
        entry.descriptionEn,
        ...entry.keywords,
      ].join(' ')
    );
    return searchableText.includes(normalizedQuery);
  });
}
