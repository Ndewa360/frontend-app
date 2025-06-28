import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

import { StatisticsRoutingModule } from './statistics-routing.module';
import { ChartNombreLocataireComponent } from './components/chart-nombre-locataire/chart-nombre-locataire.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChartPieNomnbreComponent } from './components/chart-pie-nomnbre/chart-pie-nomnbre.component';
import { ChartNombreRoomComponent } from './components/chart-nombre-room/chart-nombre-room.component';
import { ChartFinanceRoomComponent } from './components/chart-finance-room/chart-finance-room.component';
import { BasicChartComponent } from './components/basic-chart/basic-chart.component';
import { ChartFinancePayementLocationComponent } from './components/chart-finance-payement-location/chart-finance-payement-location.component';
import { ChartFinancePayementAnneeComponent } from './components/chart-finance-payement-annee/chart-finance-payement-annee.component';
import { ChartSkeletonComponent } from './components/chart-skeleton/chart-skeleton.component';
import { ChartErrorComponent } from './components/chart-error/chart-error.component';
import { AdvancedFiltersComponent } from './components/advanced-filters/advanced-filters.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { PerformanceAlertsComponent } from './components/performance-alerts/performance-alerts.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ChartNombreLocataireComponent,
    ChartPieNomnbreComponent,
    ChartNombreRoomComponent,
    ChartFinanceRoomComponent,
    BasicChartComponent,
    ChartFinancePayementLocationComponent,
    ChartFinancePayementAnneeComponent,
    ChartSkeletonComponent,
    ChartErrorComponent,
    AdvancedFiltersComponent,
    ExportDialogComponent,
    PerformanceAlertsComponent
  ],
  imports: [
    CommonModule,
    StatisticsRoutingModule,
    SharedModule,
    FormsModule
  ],
  exports:[
    ChartNombreLocataireComponent,
    ChartNombreRoomComponent,
    ChartFinanceRoomComponent,
    ChartFinancePayementLocationComponent,
    ChartFinancePayementAnneeComponent,
    ChartSkeletonComponent,
    ChartErrorComponent,
    AdvancedFiltersComponent,
    ExportDialogComponent,
    PerformanceAlertsComponent
  ],
  providers:    [ CurrencyPipe ]
})
export class StatisticsModule { }
