import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import {
  BookMetadataCandidate,
  MetadataProviderSource,
} from '../../../books/models/book-metadata.model';
import { CoverEnrichmentFailureReason } from '../../models/cover-enrichment.model';
import { CoverEnrichmentService } from '../../services/cover-enrichment.service';

@Component({
  selector: 'app-cover-enrichment-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cover-enrichment-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    id: 'cover-enrichment-section',
  },
})
export class CoverEnrichmentSectionComponent {
  protected readonly appPreferences = inject(AppPreferencesService);
  protected readonly coverEnrichmentService = inject(CoverEnrichmentService);
  protected readonly i18n = inject(I18nService);

  readonly offlineMode = this.appPreferences.offlineMode;

  readonly showStrictTitleWarning = signal<boolean>(false);
  readonly reportExpanded = signal<boolean>(false);

  readonly summary = this.coverEnrichmentService.missingCoverSummary;
  readonly state = this.coverEnrichmentService.state;
  readonly assistantActive = this.coverEnrichmentService.assistantActive;
  readonly assistantQueue = this.coverEnrichmentService.assistantQueue;
  readonly assistantCurrentIndex = this.coverEnrichmentService.assistantCurrentIndex;
  readonly assistantCurrentBook = this.coverEnrichmentService.assistantCurrentBook;
  readonly assistantNotFoundBooks = this.coverEnrichmentService.assistantNotFoundBooks;
  readonly assistantLoading = this.coverEnrichmentService.assistantLoading;

  readonly isBusy = computed(() => {
    const status = this.state().status;
    return status === 'running' || status === 'paused';
  });

  readonly progressPercent = computed(() => {
    const { processedCount, totalCount } = this.state();
    if (totalCount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((processedCount / totalCount) * 100));
  });

  readonly assistantCandidates = computed(() =>
    this.coverEnrichmentService.assistantCandidates().slice(0, 3)
  );

  readonly showResultSummary = computed(() => {
    const current = this.state();
    return (
      current.status === 'completed' ||
      current.status === 'cancelled' ||
      current.skippedItems.length > 0
    );
  });

  async startIsbnEnrichment(): Promise<void> {
    this.showStrictTitleWarning.set(false);
    this.coverEnrichmentService.closeVisualAssistant();
    await this.coverEnrichmentService.runIntegralEnrichment();
  }

  togglePauseResume(): void {
    if (this.state().status === 'running') {
      this.coverEnrichmentService.pause();
    } else if (this.state().status === 'paused') {
      this.coverEnrichmentService.resume();
    }
  }

  cancelEnrichment(): void {
    this.coverEnrichmentService.cancel();
  }

  async startVisualAssistant(): Promise<void> {
    this.showStrictTitleWarning.set(false);
    await this.coverEnrichmentService.startVisualAssistant();
  }

  async selectAssistantCover(candidate: BookMetadataCandidate): Promise<void> {
    await this.coverEnrichmentService.selectAssistantCover(candidate);
  }

  async skipAssistantBook(): Promise<void> {
    await this.coverEnrichmentService.skipAssistantBook();
  }

  closeVisualAssistant(): void {
    this.coverEnrichmentService.closeVisualAssistant();
  }

  toggleStrictTitleWarning(): void {
    this.showStrictTitleWarning.update((open) => !open);
  }

  closeStrictTitleWarning(): void {
    this.showStrictTitleWarning.set(false);
  }

  async confirmStrictTitleSearch(): Promise<void> {
    this.showStrictTitleWarning.set(false);
    this.coverEnrichmentService.closeVisualAssistant();
    await this.coverEnrichmentService.runStrictTitleAuthorEnrichment();
  }

  toggleReportExpanded(): void {
    this.reportExpanded.update((expanded) => !expanded);
  }

  getSourceLabel(source: MetadataProviderSource): string {
    return this.i18n.t().bookForm.lookup.sources[source];
  }

  getReasonLabel(reason: CoverEnrichmentFailureReason): string {
    const texts = this.i18n.t().settings.coverEnrichment;
    switch (reason) {
      case 'missing_isbn':
        return texts.reasonMissingIsbn;
      case 'no_metadata_found':
        return texts.reasonNoMetadata;
      case 'no_cover_in_provider':
        return texts.reasonNoCover;
      case 'mismatch_verification':
        return texts.reasonMismatch;
      case 'invalid_cover_dimensions':
        return texts.reasonInvalidImage;
      case 'network_error':
        return texts.reasonNetworkError;
    }
  }
}
