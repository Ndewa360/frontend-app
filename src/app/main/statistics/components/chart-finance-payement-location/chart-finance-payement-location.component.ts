import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatisticLocataireYearModel, StatisticState, StatisticAction } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'chart-finance-payement-location',
  templateUrl: './chart-finance-payement-location.component.html',
  styleUrls: ['./chart-finance-payement-location.component.css']
})
export class ChartFinancePayementLocationComponent implements OnChanges, OnDestroy {

  @Input() label: string = '';
  @Input() title: string = `Paiement de locataire ${new Date().getFullYear()}`;
  @Input() propertyID: string = '';
  @Input() selectedYear: number;

  charsOpts: any = {};

  private destroy$ = new Subject<void>();

  constructor(private _store: Store) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyID'] || changes['selectedYear']) {
      this.title = `Encaissements par locataire — ${this.selectedYear}`;

      // Renouveler le subject pour annuler la subscription précédente
      this.destroy$.next();

      if (!this.propertyID || !this.selectedYear) return;

      this._store.dispatch(
        new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyID, this.selectedYear)
      );

      this._store.select(
        StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(this.propertyID, this.selectedYear)
      ).pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          this.charsOpts = this.getChart(value);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getChart(data: StatisticLocataireYearModel[]) {
    const legendData: string[] = [];
    const dataSeries: any[] = [];

    data.forEach(item => {
      legendData.push(item.locataire.fullName);
      // paymentValue = montants bruts réellement versés par mois (après correction backend)
      dataSeries.push({
        name: item.locataire.fullName,
        type: 'bar',
        stack: 'encaisse',
        data: item.paymentValue,
        itemStyle: { opacity: 0.85 },
        tooltip: {
          valueFormatter: (v: number) =>
            v > 0 ? `${v.toLocaleString('fr-FR')} FCFA` : 'Aucun encaissement'
        }
      });
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const monthName = UtilsString.capitalizedFirstLetter(
            new Date(this.selectedYear, params[0].dataIndex)
              .toLocaleDateString('fr-FR', { month: 'long' })
          );
          let content = `<strong>${monthName} ${this.selectedYear}</strong><br/>`;
          params.forEach(p => {
            const icon = p.value > 0 ? '✅' : '❌';
            content += `${icon} ${p.seriesName} : <strong>${p.value > 0 ? p.value.toLocaleString('fr-FR') + ' FCFA encaissés' : 'Aucun encaissement'}</strong><br/>`;
          });
          return content;
        }
      },
      legend: { data: legendData },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      toolbox: { feature: { saveAsImage: {} } },
      xAxis: {
        type: 'category',
        name: 'Mois',
        boundaryGap: true,
        data: UtilsString.getListOfMonth()
      },
      yAxis: {
        type: 'value',
        name: 'Montant encaissé (FCFA)',
        axisLabel: { formatter: (v: number) => v > 0 ? v.toLocaleString('fr-FR') : '0' }
      },
      series: dataSeries
    };
  }
}
