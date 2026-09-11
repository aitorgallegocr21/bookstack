import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-series-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './series-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeriesPage {}
