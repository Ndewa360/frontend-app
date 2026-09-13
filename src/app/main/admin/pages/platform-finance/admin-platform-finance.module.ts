import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { PlatformFinanceComponent } from './platform-finance.component';
import { PfPieChartComponent } from './components/pie-chart/pie-chart.component';
import { PfPieTooltipComponent } from './components/pie-tooltip/pie-tooltip.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule,
    SharedModule,
    PlatformFinanceComponent,
    PfPieChartComponent,
    PfPieTooltipComponent
  ]
})
export class AdminPlatformFinanceModule { }