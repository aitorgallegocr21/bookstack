import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  LucideCode2,
  LucideDatabase,
  LucideDynamicIcon,
  LucideExternalLink,
  LucideGlobe,
  LucideScale,
  LucideShieldCheck,
  LucideSparkles,
} from '@lucide/angular';
import { BrandLogoComponent } from '../../../../core/components/brand-logo/brand-logo';
import { I18nService } from '../../../../core/i18n/i18n.service';
import packageJson from '../../../../../../package.json';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [LucideDynamicIcon, BrandLogoComponent],
  templateUrl: './about-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly i18n = inject(I18nService);

  protected readonly Code2 = LucideCode2;
  protected readonly Database = LucideDatabase;
  protected readonly ExternalLink = LucideExternalLink;
  protected readonly Globe = LucideGlobe;
  protected readonly Scale = LucideScale;
  protected readonly ShieldCheck = LucideShieldCheck;
  protected readonly Sparkles = LucideSparkles;

  protected readonly techPills = ['Angular 22+', 'Tailwind CSS v4', 'IndexedDB', 'PWA'] as const;
  protected readonly appVersion = `v${packageJson.version}`;
}
