import { describe, it, expect, vi, afterEach } from 'vitest';
import { SeriesMetadata } from '../models/series.model';
import { SeriesMetadataSchema, parseStoredSeriesMetadata } from './series.schema';

const makeValidSeriesMetadata = (overrides: Partial<SeriesMetadata> = {}): SeriesMetadata => ({
  id: 'series-1',
  normalizedKey: 'el archivo de las tormentas',
  name: 'El Archivo de las Tormentas',
  expectedVolumes: 10,
  publicationStatus: 'ongoing',
  notes: 'Primera era de 5 libros',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-05T10:00:00.000Z',
  ...overrides,
});

describe('SeriesMetadataSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates a complete SeriesMetadata record', () => {
    const record = makeValidSeriesMetadata();
    const result = SeriesMetadataSchema.safeParse(record);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(record);
    }
  });

  it('validates minimal SeriesMetadata without optional fields', () => {
    const record = makeValidSeriesMetadata({
      expectedVolumes: undefined,
      publicationStatus: undefined,
      notes: undefined,
    });
    const result = SeriesMetadataSchema.safeParse(record);

    expect(result.success).toBe(true);
  });

  it('rejects expectedVolumes outside [1, 500] or non-integer values', () => {
    expect(
      SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ expectedVolumes: 0 })).success
    ).toBe(false);
    expect(
      SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ expectedVolumes: 501 })).success
    ).toBe(false);
    expect(
      SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ expectedVolumes: 3.5 })).success
    ).toBe(false);
  });

  it('rejects empty id, normalizedKey, or name', () => {
    expect(SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ id: '' })).success).toBe(false);
    expect(
      SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ normalizedKey: '' })).success
    ).toBe(false);
    expect(SeriesMetadataSchema.safeParse(makeValidSeriesMetadata({ name: '' })).success).toBe(
      false
    );
  });

  it('rejects invalid publicationStatus values', () => {
    const result = SeriesMetadataSchema.safeParse({
      ...makeValidSeriesMetadata(),
      publicationStatus: 'cancelled',
    });

    expect(result.success).toBe(false);
  });

  it('parseStoredSeriesMetadata keeps valid records and discards corrupted ones safely', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const valid = makeValidSeriesMetadata();
    const corrupted = { id: 'bad-1', name: '' };

    const parsed = parseStoredSeriesMetadata([valid, corrupted, null, 42]);

    expect(parsed).toEqual([valid]);
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });
});
