import { z } from 'zod';
import {
  AppPreferences,
  CONFIGURABLE_METADATA_PROVIDERS,
  ConfigurableMetadataProvider,
  CoverMaxDimension,
  DEFAULT_APP_PREFERENCES,
  MetadataProviderPreference,
  MetadataSearchQuota,
  QuickPageStep,
} from '../models/app-preferences.model';

const ConfigurableMetadataProviderSchema = z.enum([
  'googlebooks',
  'openlibrary',
  'applebooks',
  'wikidata',
  'archive',
]);

const MetadataProviderPreferenceSchema = z.object({
  id: ConfigurableMetadataProviderSchema,
  enabled: z.boolean(),
});

const ReducedMotionPreferenceSchema = z.enum(['system', 'reduce']);
const DefaultBookFormatSchema = z.enum(['physical', 'ebook', 'audiobook']);
const DefaultBookStatusSchema = z.enum(['pending', 'reading']);

const QuickPageStepSchema = z
  .number()
  .refine((v): v is QuickPageStep => v === 1 || v === 5 || v === 10 || v === 25);

const CoverMaxDimensionSchema = z
  .number()
  .refine((v): v is CoverMaxDimension => v === 300 || v === 360 || v === 400 || v === 600);

const MetadataSearchQuotaSchema = z
  .number()
  .refine((v): v is MetadataSearchQuota => v === 4 || v === 8 || v === 12);

const MIN_COVER_QUALITY = 0.5;
const MAX_COVER_QUALITY = 0.95;

function clampCoverQuality(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_APP_PREFERENCES.coverQuality;
  }
  const clamped = Math.min(MAX_COVER_QUALITY, Math.max(MIN_COVER_QUALITY, value));
  return Math.round(clamped * 100) / 100;
}

function normalizeMetadataProviders(raw: unknown): MetadataProviderPreference[] {
  const seen = new Set<ConfigurableMetadataProvider>();
  const normalized: MetadataProviderPreference[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const parsed = MetadataProviderPreferenceSchema.safeParse(item);
      if (parsed.success && !seen.has(parsed.data.id)) {
        seen.add(parsed.data.id);
        normalized.push({ id: parsed.data.id, enabled: parsed.data.enabled });
      }
    }
  }

  for (const providerId of CONFIGURABLE_METADATA_PROVIDERS) {
    if (!seen.has(providerId)) {
      normalized.push({ id: providerId, enabled: true });
    }
  }

  return normalized;
}

export const AppPreferencesSchema = z.object({
  adaptiveCoverTint: z.boolean().catch(DEFAULT_APP_PREFERENCES.adaptiveCoverTint),
  reducedMotion: ReducedMotionPreferenceSchema.catch(DEFAULT_APP_PREFERENCES.reducedMotion),
  defaultBookFormat: DefaultBookFormatSchema.catch(DEFAULT_APP_PREFERENCES.defaultBookFormat),
  defaultBookStatus: DefaultBookStatusSchema.catch(DEFAULT_APP_PREFERENCES.defaultBookStatus),
  showCardQuickActions: z.boolean().catch(DEFAULT_APP_PREFERENCES.showCardQuickActions),
  showCardProgressBar: z.boolean().catch(DEFAULT_APP_PREFERENCES.showCardProgressBar),
  quickPageStep: QuickPageStepSchema.catch(DEFAULT_APP_PREFERENCES.quickPageStep),
  trackReadingTime: z.boolean().catch(DEFAULT_APP_PREFERENCES.trackReadingTime),
  offlineMode: z.boolean().catch(DEFAULT_APP_PREFERENCES.offlineMode),
  metadataProviders: z
    .unknown()
    .optional()
    .transform((val) => normalizeMetadataProviders(val)),
  scannerPreferPhotoMode: z.boolean().catch(DEFAULT_APP_PREFERENCES.scannerPreferPhotoMode),
  scannerAutoTorch: z.boolean().catch(DEFAULT_APP_PREFERENCES.scannerAutoTorch),
  coverMaxDimension: CoverMaxDimensionSchema.catch(DEFAULT_APP_PREFERENCES.coverMaxDimension),
  coverQuality: z
    .unknown()
    .optional()
    .transform((val) => clampCoverQuality(val)),
  metadataSearchQuota: MetadataSearchQuotaSchema.catch(DEFAULT_APP_PREFERENCES.metadataSearchQuota),
  includePreferencesInBackup: z.boolean().catch(DEFAULT_APP_PREFERENCES.includePreferencesInBackup),
  lastBackupExportedAt: z.string().nullable().catch(DEFAULT_APP_PREFERENCES.lastBackupExportedAt),
});

export function parseAppPreferences(raw: unknown): AppPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ...DEFAULT_APP_PREFERENCES,
      metadataProviders: DEFAULT_APP_PREFERENCES.metadataProviders.map((p) => ({ ...p })),
    };
  }

  const parsed = AppPreferencesSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    ...DEFAULT_APP_PREFERENCES,
    metadataProviders: DEFAULT_APP_PREFERENCES.metadataProviders.map((p) => ({ ...p })),
  };
}
