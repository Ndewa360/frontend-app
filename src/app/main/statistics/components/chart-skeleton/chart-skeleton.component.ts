import { Component, Input } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'chart-skeleton',
  templateUrl: './chart-skeleton.component.html',
  styleUrls: ['./chart-skeleton.component.css'],
  standalone: true,
  imports: [NgIf, NgFor]
})
export class ChartSkeletonComponent {
  @Input() height: string = '240px';
  @Input() showTitle: boolean = true;
  @Input() showLegend: boolean = true;

  getRandomHeight(): number {
    return Math.floor(Math.random() * 80) + 20; // Between 20% and 100%
  }
}
