import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatisticsRoutingModule } from './statistics-routing.module';
import { ChartNombreLocataireComponent } from './components/chart-nombre-locataire/chart-nombre-locataire.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChartPieNomnbreComponent } from './components/chart-pie-nomnbre/chart-pie-nomnbre.component';
import { ChartNombreRoomComponent } from './components/chart-nombre-room/chart-nombre-room.component';
import { ChartFinanceRoomComponent } from './components/chart-finance-room/chart-finance-room.component';
import { BasicChartComponent } from './components/basic-chart/basic-chart.component';
import { ChartFinancePayementLocationComponent } from './components/chart-finance-payement-location/chart-finance-payement-location.component';
import { ChartFinancePayementAnneeComponent } from './components/chart-finance-payement-annee/chart-finance-payement-annee.component';


@NgModule({
  declarations: [
    ChartNombreLocataireComponent,
    ChartPieNomnbreComponent,
    ChartNombreRoomComponent,
    ChartFinanceRoomComponent,
    BasicChartComponent,
    ChartFinancePayementLocationComponent,
    ChartFinancePayementAnneeComponent
  ],
  imports: [
    CommonModule,
    StatisticsRoutingModule,
    SharedModule
  ],
  exports:[
    ChartNombreLocataireComponent,
    ChartNombreRoomComponent,
    ChartFinanceRoomComponent,
    ChartFinancePayementLocationComponent,
    ChartFinancePayementAnneeComponent
  ]
})
export class StatisticsModule { }
