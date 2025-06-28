import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StatisticError } from 'src/app/shared/store';

@Component({
  selector: 'chart-error',
  templateUrl: './chart-error.component.html',
  styleUrls: ['./chart-error.component.css']
})
export class ChartErrorComponent {
  @Input() error: StatisticError | null = null;
  @Input() height: string = '240px';
  @Input() title: string = 'Graphique';
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
