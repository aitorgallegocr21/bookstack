import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideBell,
  LucideBookOpen,
  LucideDatabase,
  LucideDownload,
  LucideDynamicIcon,
  LucidePalette,
  LucideSearch,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideX,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { CoverEnrichmentSectionComponent } from '../../components/cover-enrichment-section/cover-enrichment-section';
import { DangerZoneSectionComponent } from '../../components/danger-zone-section/danger-zone-section';
import { DataHealthSectionComponent } from '../../components/data-health-section/data-health-section';
import { DataPortabilitySectionComponent } from '../../components/data-portability-section/data-portability-section';
import { SettingsAdvancedSectionComponent } from '../../components/settings-advanced-section/settings-advanced-section';
import { SettingsCatalogReadingSectionComponent } from '../../components/settings-catalog-reading-section/settings-catalog-reading-section';
import { SettingsPreferencesSectionComponent } from '../../components/settings-preferences-section/settings-preferences-section';
import { SettingsPrivacyScannerSectionComponent } from '../../components/settings-privacy-scanner-section/settings-privacy-scanner-section';
import { StorageQuotaInspectorComponent } from '../../components/storage-quota-inspector/storage-quota-inspector';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import {
  SETTINGS_SEARCH_ENTRIES,
  SETTINGS_TABS,
  SettingsSearchEntry,
  SettingsTabIconKey,
  SettingsTabId,
  filterSettingsSearchEntries,
  isSettingsTabId,
} from '../../models/settings-navigation.model';
import { DataPortabilityService } from '../../services/data-portability.service';

type SettingsTabLucideIcon =
  | typeof LucidePalette
  | typeof LucideBookOpen
  | typeof LucideDatabase
  | typeof LucideShieldCheck
  | typeof LucideSlidersHorizontal;

const INITIAL_STORAGE_BREAKDOWN: StorageBreakdownSummary = {
  engine: 'indexeddb',
  persistenceStatus: 'unsupported',
  indexedDbInfo: {
    dbName: 'bookstackDB',
    version: 2,
    objectStoresCount: 3,
  },
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

const TAB_ICON_MAP: Record<SettingsTabIconKey, SettingsTabLucideIcon> = {
  palette: LucidePalette,
  'book-open': LucideBookOpen,
  database: LucideDatabase,
  'shield-check': LucideShieldCheck,
  'sliders-horizontal': LucideSlidersHorizontal,
};

const SETTING_HIGHLIGHT_DURATION_MS = 2000;

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    LucideDynamicIcon,
    SettingsPreferencesSectionComponent,
    SettingsCatalogReadingSectionComponent,
    SettingsPrivacyScannerSectionComponent,
    SettingsAdvancedSectionComponent,
    StorageQuotaInspectorComponent,
    DataHealthSectionComponent,
    DataPortabilitySectionComponent,
    CoverEnrichmentSectionComponent,
    DangerZoneSectionComponent,
  ],
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly appPreferences = inject(AppPreferencesService);
  private readonly dataPortabilityService = inject(DataPortabilityService);
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);

  protected readonly tabs = SETTINGS_TABS;
  protected readonly tabIcons = TAB_ICON_MAP;
  protected readonly SearchIcon = LucideSearch;
  protected readonly ClearIcon = LucideX;
  protected readonly BellIcon = LucideBell;
  protected readonly DownloadIcon = LucideDownload;

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly activeTab = computed<SettingsTabId>(() => {
    const rawTab = this.queryParamMap()?.get('tab') ?? null;
    return isSettingsTabId(rawTab) ? rawTab : 'general';
  });

  readonly searchQuery = signal('');
  readonly isSearchActive = computed(() => this.searchQuery().trim().length > 0);
  readonly searchResults = computed(() =>
    filterSettingsSearchEntries(SETTINGS_SEARCH_ENTRIES, this.searchQuery())
  );

  readonly backupReminderDismissed = signal(false);
  readonly showBackupReminder = computed(
    () =>
      this.booksService.books().length > 0 &&
      this.appPreferences.isBackupOverdue() &&
      !this.backupReminderDismissed()
  );

  readonly highlightedSettingId = signal<string | null>(null);
  readonly storageBreakdown = signal<StorageBreakdownSummary>(INITIAL_STORAGE_BREAKDOWN);

  private readonly coverEnrichmentRef = viewChild('coverEnrichmentSection', { read: ElementRef });
  private refreshSequence = 0;
  private scrollTimerId: ReturnType<typeof setTimeout> | null = null;
  private highlightTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.booksService.books();
      this.readingLogService.readingLogs();
      void this.refreshStorageBreakdown();
    });

    this.destroyRef.onDestroy(() => {
      this.clearNavigationTimers();
    });
  }

  async refreshStorageBreakdown(): Promise<void> {
    const token = ++this.refreshSequence;
    const summary = await this.dataPortabilityService.computeStorageBreakdown();
    if (token === this.refreshSequence) {
      this.storageBreakdown.set(summary);
    }
  }

  selectTab(tab: SettingsTabId): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchQuery.set(input?.value ?? '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectSearchResult(entry: SettingsSearchEntry): void {
    this.searchQuery.set('');
    this.navigateToSection(entry.tab, entry.settingId);
  }

  dismissBackupReminder(): void {
    this.backupReminderDismissed.set(true);
  }

  navigateToSection(tab: SettingsTabId, settingId?: string): void {
    if (this.activeTab() !== tab) {
      this.selectTab(tab);
    }

    if (!settingId) {
      return;
    }

    this.clearNavigationTimers();
    this.scrollTimerId = setTimeout(() => {
      const target = this.hostElement.nativeElement.querySelector<HTMLElement>(
        `[data-setting-id="${settingId}"]`
      );
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.highlightedSettingId.set(settingId);

      this.highlightTimerId = setTimeout(() => {
        this.highlightedSettingId.set(null);
      }, SETTING_HIGHLIGHT_DURATION_MS);
    }, 50);
  }

  scrollToCoverEnrichment(): void {
    if (this.activeTab() === 'data') {
      const element = this.coverEnrichmentRef()?.nativeElement as HTMLElement | undefined;
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    this.navigateToSection('data', 'cover-enrichment');
  }

  protected getTabLabel(tabId: SettingsTabId): string {
    return this.i18n.t().settings.tabs[tabId];
  }

  protected getSearchEntryTitle(entry: SettingsSearchEntry): string {
    return this.i18n.locale() === 'en' ? entry.titleEn : entry.titleEs;
  }

  protected getSearchEntryDescription(entry: SettingsSearchEntry): string {
    return this.i18n.locale() === 'en' ? entry.descriptionEn : entry.descriptionEs;
  }

  private clearNavigationTimers(): void {
    if (this.scrollTimerId !== null) {
      clearTimeout(this.scrollTimerId);
      this.scrollTimerId = null;
    }
    if (this.highlightTimerId !== null) {
      clearTimeout(this.highlightTimerId);
      this.highlightTimerId = null;
    }
  }
}
