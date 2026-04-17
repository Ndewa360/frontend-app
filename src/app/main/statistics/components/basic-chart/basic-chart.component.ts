import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'basic-chart',
  templateUrl: './basic-chart.component.html',
  styleUrls: ['./basic-chart.component.css']
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
