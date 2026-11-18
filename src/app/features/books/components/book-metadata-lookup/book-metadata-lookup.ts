import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  LucideAlertCircle,
  LucideBookOpen,
  LucideCheckCircle2,
  LucideChevronDown,
  LucideDynamicIcon,
  LucideLoader2,
  LucideScanBarcode,
  LucideSearch,
  LucideSparkles,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  BookMetadataApplyMode,
  BookMetadataCandidate,
  DuplicateLibraryMatch,
  MetadataLookupMode,
  MetadataProviderSource,
} from '../../models/book-metadata.model';
import { BookMetadataError, BookMetadataService } from '../../services/book-metadata.service';
import { IsbnScannerComponent } from '../isbn-scanner/isbn-scanner';

@Component({
  selector: 'app-book-metadata-lookup',
  imports: [IsbnScannerComponent, LucideDynamicIcon],
  templateUrl: './book-metadata-lookup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class BookMetadataLookupComponent {
  private readonly i18n = inject(I18nService);
  private readonly bookMetadataService = inject(BookMetadataService);

  readonly mode = input<'create' | 'edit'>('create');
  readonly currentBookId = input<string | undefined>(undefined);
  readonly currentIsbn = input<string>('');
  readonly currentTitle = input<string>('');
  readonly currentAuthor = input<string>('');

  readonly candidateApplied = output<{
    candidate: BookMetadataCandidate;
    applyMode: BookMetadataApplyMode;
  }>();

  readonly t = this.i18n.t;

  readonly isExpanded = signal(false);
  readonly activeTab = signal<MetadataLookupMode>('search');
  readonly searchQuery = signal('');
  readonly isSearching = signal(false);
  readonly isOptimizingCover = signal(false);
  readonly hasSearched = signal(false);
  readonly results = signal<BookMetadataCandidate[]>([]);
  readonly appliedCandidate = signal<BookMetadataCandidate | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly ScanIcon = LucideScanBarcode;
  readonly SearchIcon = LucideSearch;
  readonly ChevronDownIcon = LucideChevronDown;
  readonly BookOpenIcon = LucideBookOpen;
  readonly AlertCircleIcon = LucideAlertCircle;
  readonly CheckCircleIcon = LucideCheckCircle2;
  readonly LoaderIcon = LucideLoader2;
  readonly SparklesIcon = LucideSparkles;

  readonly duplicateMatch = computed<DuplicateLibraryMatch | null>(() => {
    const candidate = this.appliedCandidate() ?? this.results()[0] ?? null;
    const isbn = candidate?.isbn || this.currentIsbn();
    const title = candidate?.title || this.currentTitle();
    const author = candidate?.author || this.currentAuthor();

    if (!isbn.trim() && (!title.trim() || !author.trim())) {
      return null;
    }

    return this.bookMetadataService.findDuplicateInLibrary(
      { isbn, title, author },
      this.currentBookId()
    );
  });

  openTab(tab: MetadataLookupMode): void {
    if (this.isExpanded() && this.activeTab() === tab) {
      this.isExpanded.set(false);
      return;
    }
    this.activeTab.set(tab);
    this.isExpanded.set(true);
    this.errorMessage.set(null);
  }

  toggleExpanded(): void {
    this.isExpanded.update((expanded) => !expanded);
    this.errorMessage.set(null);
  }

  onScannerClosed(): void {
    this.activeTab.set('search');
    this.isExpanded.set(false);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }

  async onSearchSubmit(event?: Event): Promise<void> {
    event?.preventDefault();
    const query = this.searchQuery().trim();
    if (query.length < 2) {
      this.errorMessage.set(this.t().bookForm.lookup.searchEmptyHint);
      return;
    }

    this.isExpanded.set(true);
    this.activeTab.set('search');
    this.errorMessage.set(null);
    this.appliedCandidate.set(null);
    this.isSearching.set(true);
    this.hasSearched.set(false);

    try {
      const candidates = await this.bookMetadataService.searchByQuery(query);
      this.results.set(candidates.slice(0, 5));
      this.hasSearched.set(true);
    } catch (error) {
      this.results.set([]);
      this.hasSearched.set(true);
      this.errorMessage.set(this.resolveLookupErrorMessage(error));
    } finally {
      this.isSearching.set(false);
    }
  }

  async onIsbnScanned(rawIsbn: string): Promise<void> {
    this.activeTab.set('search');
    this.isExpanded.set(true);
    await this.executeDirectIsbnLookup(rawIsbn, true);
  }

  async triggerIsbnLookup(rawIsbn: string): Promise<void> {
    this.isExpanded.set(true);
    this.activeTab.set('search');
    await this.executeDirectIsbnLookup(rawIsbn, false);
  }

  async applyCandidate(
    candidate: BookMetadataCandidate,
    applyMode: BookMetadataApplyMode
  ): Promise<void> {
    const resolved = await this.resolveCandidateCover(candidate);
    this.results.update((items) =>
      items.map((item) => (item.id === resolved.id ? resolved : item))
    );
    this.appliedCandidate.set(resolved);
    this.candidateApplied.emit({ candidate: resolved, applyMode });
  }

  getSourceLabel(source: MetadataProviderSource): string {
    return this.t().bookForm.lookup.sources[source];
  }

  private async executeDirectIsbnLookup(
    rawIsbn: string,
    autoApplyInCreate: boolean
  ): Promise<void> {
    const trimmed = rawIsbn.trim();
    this.searchQuery.set(trimmed);
    this.errorMessage.set(null);
    this.appliedCandidate.set(null);

    if (!trimmed) {
      this.errorMessage.set(this.t().bookForm.lookup.searchEmptyHint);
      return;
    }

    this.isSearching.set(true);
    this.hasSearched.set(false);

    try {
      const candidate = await this.bookMetadataService.lookupByIsbn(trimmed);
      if (!candidate) {
        this.results.set([]);
        this.hasSearched.set(true);
        return;
      }

      const resolved = await this.resolveCandidateCover(candidate);
      this.results.set([resolved]);
      this.hasSearched.set(true);

      if (autoApplyInCreate && this.mode() === 'create') {
        this.appliedCandidate.set(resolved);
        this.candidateApplied.emit({
          candidate: resolved,
          applyMode: 'overwrite-public',
        });
      }
    } catch (error) {
      this.results.set([]);
      this.hasSearched.set(true);
      this.errorMessage.set(this.resolveLookupErrorMessage(error));
    } finally {
      this.isSearching.set(false);
    }
  }

  private async resolveCandidateCover(
    candidate: BookMetadataCandidate
  ): Promise<BookMetadataCandidate> {
    if (!candidate.coverUrl) {
      return candidate;
    }

    this.isOptimizingCover.set(true);
    try {
      const optimizedCover = await this.bookMetadataService.resolveLocalCover(candidate.coverUrl);
      return {
        ...candidate,
        coverUrl: optimizedCover || candidate.coverUrl,
      };
    } catch {
      return candidate;
    } finally {
      this.isOptimizingCover.set(false);
    }
  }

  private resolveLookupErrorMessage(error: unknown): string {
    if (error instanceof BookMetadataError && error.code === 'INVALID_ISBN') {
      return this.t().bookForm.lookup.invalidBarcodeError;
    }
    return this.t().bookForm.lookup.networkError;
  }
}
