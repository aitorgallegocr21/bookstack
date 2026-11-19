import { z } from 'zod';
import { SeriesMetadata } from '../models/series.model';

export const SeriesPublicationStatusSchema = z.enum(['ongoing', 'completed', 'hiatus']);

export const SeriesMetadataSchema = z.object({
  id: z.string().min(1).max(128),
  normalizedKey: z.string().min(1).max(300),
  name: z.string().min(1).max(300),
  expectedVolumes: z.number().int().min(1).max(500).optional(),
  publicationStatus: SeriesPublicationStatusSchema.optional(),
  notes: z.string().max(5_000).optional(),
  createdAt: z.string().min(1).max(64),
  updatedAt: z.string().min(1).max(64),
});

/**
 * Validates raw persisted SeriesMetadata records, discarding corrupted items
 * safely without breaking application initialization.
 */
export function parseStoredSeriesMetadata(records: unknown[]): SeriesMetadata[] {
  const valid: SeriesMetadata[] = [];

  for (const record of records) {
    const parsed = SeriesMetadataSchema.safeParse(record);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      console.warn(
        '[SeriesSchema] Discarded corrupted series metadata record:',
        parsed.error.issues
      );
    }
  }

  return valid;
}
