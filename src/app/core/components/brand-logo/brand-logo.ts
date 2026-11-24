import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center gap-2.5 select-none shrink-0',
  },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="showWordmark() ? 'true' : null"
      [attr.role]="showWordmark() ? null : 'img'"
      [attr.aria-label]="showWordmark() ? null : 'BookStack'"
      class="shrink-0 rounded-[25%] shadow-xs ring-1 ring-white/15"
    >
      <rect width="64" height="64" rx="16" fill="#0f172a" />
      <rect x="13" y="13" width="38" height="11" rx="3" fill="#f59e0b" />
      <rect x="17" y="16" width="5" height="5" rx="1" fill="#fef3c7" opacity="0.9" />
      <line
        x1="26"
        y1="18.5"
        x2="46"
        y2="18.5"
        stroke="#fef3c7"
        stroke-width="2.2"
        stroke-linecap="round"
        opacity="0.85"
      />
      <rect x="11" y="27" width="42" height="11" rx="3" fill="#4f46e5" />
      <rect x="15" y="30" width="5" height="5" rx="1" fill="#e0e7ff" opacity="0.9" />
      <line
        x1="24"
        y1="32.5"
        x2="48"
        y2="32.5"
        stroke="#e0e7ff"
        stroke-width="2.2"
        stroke-linecap="round"
        opacity="0.85"
      />
      <rect x="14" y="41" width="36" height="11" rx="3" fill="#2563eb" />
      <rect x="18" y="44" width="5" height="5" rx="1" fill="#dbeafe" opacity="0.9" />
      <line
        x1="27"
        y1="46.5"
        x2="45"
        y2="46.5"
        stroke="#dbeafe"
        stroke-width="2.2"
        stroke-linecap="round"
        opacity="0.85"
      />
    </svg>
    @if (showWordmark()) {
      <span class="font-editorial text-lg font-bold tracking-tight text-ink">BookStack</span>
    }
  `,
})
export class BrandLogoComponent {
  readonly size = input<number>(32);
  readonly showWordmark = input<boolean>(false);
}
