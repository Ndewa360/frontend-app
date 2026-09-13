import { trackByFn } from '../../../../../../shared/utils/track-by.util';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PfPieSlice, PfPieChartComponent } from '../pie-chart/pie-chart.component';
import { NgFor } from '@angular/common';

@Component({
  selector: 'pf-pie-tooltip',
  templateUrl: './pie-tooltip.component.html',
  styleUrls: ['./pie-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PfPieChartComponent, NgFor]
})
export class PfPieTooltipComponent {
  trackByFn = trackByFn;

  @Input() slices: PfPieSlice[] = [];
  @Input() title = '';
  @Input() left = 0;
  @Input() top = 0;
  @Input() placement: 'above' | 'below' = 'above';
  @Input() size = 120;

  get total(): number {
    return this.slices.reduce((sum, s) => sum + s.value, 0);
  }

  pct(s: PfPieSlice): string {
    if (!this.total) return '0 %';
    const raw = (s.value / this.total) * 100;
    return `${Number.isInteger(raw) ? raw : raw.toFixed(1)} %`;
  }
}
