import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EchartsComponent } from '../../../../../@youpez/modules/charts/echarts/echarts.component';
import { EchartsContainerComponent } from '../../../../../@youpez/modules/charts/echarts-container/echarts-container.component';
import { ChartSkeletonComponent } from '../chart-skeleton/chart-skeleton.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'basic-chart',
  templateUrl: './basic-chart.component.html',
  styleUrls: ['./basic-chart.component.css'],
  standalone: true,
  imports: [NgIf, ChartSkeletonComponent, EchartsContainerComponent, EchartsComponent]
})
export class BasicChartComponent implements OnChanges {
  @Input() title: string = '';
  @Input() options: any = {};
  @Input() height: string = '240px';
  @Input() isLoading: boolean = false;

  chartOptions: any = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.options) {
      this.chartOptions = this.options;
    }
  }
}
