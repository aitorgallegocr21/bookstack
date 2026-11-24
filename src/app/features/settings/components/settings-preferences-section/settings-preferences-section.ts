import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  LucideCheck,
  LucideDynamicIcon,
  LucideMonitor,
  LucideMoon,
  LucidePanelBottom,
  LucidePanelLeft,
  LucidePanelRight,
  LucidePanelTop,
  LucideSun,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { SupportedLocale } from '../../../../core/i18n/i18n.types';
import { CONFIRM_SUPPRESSION_KEYS } from '../../../../core/models/confirm-dialog.model';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { DockPositionService } from '../../../../core/services/dock-position.service';
import { AccentPalette, ThemeMode, ThemeService } from '../../../../core/services/theme.service';
import { DockPosition, MobileDockPosition } from '../../../../core/utils/dock-snap.utils';
import { CatalogViewMode } from '../../../books/models/catalog-filter.model';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';

interface AccentSwatchOption {
  readonly id: AccentPalette;
  readonly colorHex: string;
}

type ThemeModeIcon = typeof LucideSun | typeof LucideMoon | typeof LucideMonitor;
type DockPositionIcon =
  | typeof LucidePanelLeft
  | typeof LucidePanelRight
  | typeof LucidePanelTop
  | typeof LucidePanelBottom;

interface ThemeModeOption {
  readonly mode: ThemeMode;
  readonly testId: string;
  readonly icon: ThemeModeIcon;
}

const ACCENT_SWATCH_OPTIONS: readonly AccentSwatchOption[] = [
  { id: 'blue', colorHex: '#2563eb' },
  { id: 'indigo', colorHex: '#4f46e5' },
  { id: 'emerald', colorHex: '#059669' },
  { id: 'amber', colorHex: '#b45309' },
  { id: 'rose', colorHex: '#be123c' },
] as const;

const THEME_MODE_OPTIONS: readonly ThemeModeOption[] = [
  { mode: 'light', testId: 'theme-light-btn', icon: LucideSun },
  { mode: 'dark', testId: 'theme-dark-btn', icon: LucideMoon },
  { mode: 'system', testId: 'theme-system-btn', icon: LucideMonitor },
] as const;

const DOCK_POSITION_ICONS: Record<DockPosition, DockPositionIcon> = {
  left: LucidePanelLeft,
  right: LucidePanelRight,
  top: LucidePanelTop,
  bottom: LucidePanelBottom,
};

@Component({
  selector: 'app-settings-preferences-section',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './settings-preferences-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class SettingsPreferencesSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dockPositionService = inject(DockPositionService);
  protected readonly catalogFilter = inject(CatalogFilterService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly Check = LucideCheck;
  protected readonly themeOptions = THEME_MODE_OPTIONS;
  protected readonly accentSwatches = ACCENT_SWATCH_OPTIONS;
  protected readonly dockIcons = DOCK_POSITION_ICONS;
  protected readonly desktopDockPositions: readonly DockPosition[] = [
    'left',
    'right',
    'top',
    'bottom',
  ];
  protected readonly mobileDockPositions: readonly MobileDockPosition[] = ['bottom', 'top'];

  protected readonly hasSuppressedConfirms = signal<boolean>(this.checkHasSuppressedConfirms());
  protected readonly confirmsResetDone = signal<boolean>(false);

  protected onLocaleChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const nextLocale: SupportedLocale = target?.value === 'en' ? 'en' : 'es';
    this.i18n.setLocale(nextLocale);
  }

  protected setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  protected getThemeLabel(mode: ThemeMode): string {
    const prefs = this.i18n.t().settings.preferences;
    const labels: Record<ThemeMode, string> = {
      light: prefs.themeLight,
      dark: prefs.themeDark,
      system: prefs.themeSystem,
    };
    return labels[mode];
  }

  protected setAccent(accent: AccentPalette): void {
    this.themeService.setAccent(accent);
  }

  protected getAccentLabel(accent: AccentPalette): string {
    return this.i18n.t().settings.preferences.accents[accent];
  }

  protected setDesktopDock(position: DockPosition): void {
    this.dockPositionService.setDesktopPosition(position);
  }

  protected setMobileDock(position: MobileDockPosition): void {
    this.dockPositionService.setMobilePosition(position);
  }

  protected getDockPositionLabel(position: DockPosition): string {
    const nav = this.i18n.t().nav;
    const labels: Record<DockPosition, string> = {
      left: nav.dockLeft,
      right: nav.dockRight,
      top: nav.dockTop,
      bottom: nav.dockBottom,
    };
    return labels[position];
  }

  protected onViewModeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const rawValue = target?.value;
    const nextMode: CatalogViewMode =
      rawValue === 'detailed' || rawValue === 'compact' ? rawValue : 'grid';
    this.catalogFilter.setViewMode(nextMode);
  }

  protected resetSuppressedConfirms(): void {
    this.confirmDialogService.resetSuppressed();
    this.hasSuppressedConfirms.set(false);
    this.confirmsResetDone.set(true);
  }

  private checkHasSuppressedConfirms(): boolean {
    return CONFIRM_SUPPRESSION_KEYS.some((key) => this.confirmDialogService.isSuppressed(key));
  }
}
