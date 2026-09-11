import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon, LucideHome, LucideBook, LucideBarChart2, LucideList, LucideSettings } from '@lucide/angular';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent {
  protected readonly Home = LucideHome;
  protected readonly Book = LucideBook;
  protected readonly Stats = LucideBarChart2;
  protected readonly Series = LucideList;
  protected readonly Settings = LucideSettings;
}
