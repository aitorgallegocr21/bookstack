import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { CoverEnrichmentSectionComponent } from '../../components/cover-enrichment-section/cover-enrichment-section';
import { DangerZoneSectionComponent } from '../../components/danger-zone-section/danger-zone-section';
import { DataPortabilitySectionComponent } from '../../components/data-portability-section/data-portability-section';
import { SettingsPreferencesSectionComponent } from '../../components/settings-preferences-section/settings-preferences-section';
import { StorageQuotaInspectorComponent } from '../../components/storage-quota-inspector/storage-quota-inspector';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';

const INITIAL_STORAGE_BREAKDOWN: StorageBreakdownSummary = {
  engine: 'indexeddb',
  totalBookstackBytes: 0,
  booksMetadataBytes: 0,
  coversBase64Bytes: 0,
  readingLogsBytes: 0,
  preferencesBytes: 0,
  booksCount: 0,
  coversCount: 0,
  readingLogsCount: 0,
  browserUsageBytes: null,
  browserQuotaBytes: null,
  healthStatus: 'healthy',
};

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    SettingsPreferencesSectionComponent,
    StorageQuotaInspectorComponent,
    DataPortabilitySectionComponent,
    CoverEnrichmentSectionComponent,
    DangerZoneSectionComponent,
  ],
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly dataPortabilityService = inject(DataPortabilityService);
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);

  readonly storageBreakdown = signal<StorageBreakdownSummary>(INITIAL_STORAGE_BREAKDOWN);
  private readonly coverEnrichmentRef = viewChild('coverEnrichmentSection', { read: ElementRef });
  private refreshSequence = 0;

  constructor() {
    effect(() => {
      this.booksService.books();
      this.readingLogService.readingLogs();
      void this.refreshStorageBreakdown();
    });
  }

  async refreshStorageBreakdown(): Promise<void> {
    const token = ++this.refreshSequence;
    const summary = await this.dataPortabilityService.computeStorageBreakdown();
    if (token === this.refreshSequence) {
      this.storageBreakdown.set(summary);
    }
  }

  scrollToCoverEnrichment(): void {
    const element = this.coverEnrichmentRef()?.nativeElement as HTMLElement | undefined;
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
