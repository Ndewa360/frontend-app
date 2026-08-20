import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface PfPieSlice {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
}

interface PfPiePath {
  d: string;
  color: string;
}

@Component({
  selector: 'pf-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PfPieChartComponent implements OnChanges {
  @Input() slices: PfPieSlice[] = [];
  @Input() size = 140;
  @Input() strokeWidth = 1;
  @Input() gapColor = '#ffffff';

  readonly cx = 50;
  readonly cy = 50;
  readonly radius = 45;
  readonly viewBox = '0 0 100 100';

  total = 0;
  hasData = false;
  paths: PfPiePath[] = [];
  fullCircleColor: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slices']) this.buildPaths();
  }

  get ariaLabel(): string {
    return this.slices
      .filter(s => s.value > 0)
      .map(s => `${s.label} : ${s.formattedValue || s.value}`)
      .join(', ');
  }

  trackByIndex(index: number, _path: PfPiePath): number {
    return index;
  }

  private buildPaths(): void {
    const segments = this.slices.filter(s => s.value > 0);
    this.total = segments.reduce((sum, s) => sum + s.value, 0);
    this.hasData = this.total > 0;
    this.paths = [];
    this.fullCircleColor = null;

    if (!this.hasData) return;

    if (segments.length === 1) {
      this.fullCircleColor = segments[0].color;
      return;
    }

    let angleStart = -Math.PI / 2;
    for (const seg of segments) {
      const sweep = (seg.value / this.total) * Math.PI * 2;
      const angleEnd = angleStart + sweep;
      const largeArc = sweep > Math.PI ? 1 : 0;
      const x1 = this.cx + this.radius * Math.cos(angleStart);
      const y1 = this.cy + this.radius * Math.sin(angleStart);
      const x2 = this.cx + this.radius * Math.cos(angleEnd);
      const y2 = this.cy + this.radius * Math.sin(angleEnd);

      this.paths.push({
        d: `M ${this.cx} ${this.cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${this.radius} ${this.radius} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`,
        color: seg.color,
      });

      angleStart = angleEnd;
    }
  }
}
