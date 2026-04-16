import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Currency,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentStateType,
  StatisticState,
  StatisticAction
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'chart-finance-payement-annee',
  templateUrl: './chart-finance-payement-annee.component.html',
  styleUrls: ['./chart-finance-payement-annee.component.css']
})
export class ChartFinancePayementAnneeComponent implements OnChanges, OnDestroy {
  currentDate = new Date();
  @Input() label: string = '';
  @Input() title: string = `Paiement de locataire ${this.currentDate.getFullYear()}`;
  @Input() propertyID: string = '';
  @Input() selectedYear: number;

  currentPayementData: StatisticAllPaymentLocataireYearModel[] = [];
  charsOpts: any = {};

  private destroy$ = new Subject<void>();
  // FIX #F18 : Subject dédié pour annuler la subscription courante avant d'en créer une nouvelle
  private subscriptionReset$ = new Subject<void>();

  constructor(
    private _store: Store,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyID'] || changes['selectedYear']) {
      this.title = `Paiement de locataire ${this.selectedYear}`;

      // FIX #F18 : annuler la subscription précédente avant d'en créer une nouvelle
      this.subscriptionReset$.next();

      this._store.dispatch(
        new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(
          this.propertyID,
          this.selectedYear.toString()
        )
      );

      this._store.select(
        StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(
          this.propertyID,
          this.selectedYear
        )
      ).pipe(
        takeUntil(this.subscriptionReset$),
        takeUntil(this.destroy$)
      ).subscribe(data => {
          this.charsOpts = this.buildChart(data);
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptionReset$.next();
    this.subscriptionReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildChart(value: StatisticAllPaymentLocataireYearModel[]): any {
    this.currentPayementData = value;

    const locataires = value.map(item => item.locataire.fullName);
    const dataPayment = value
      .map(item =>
        item.paymentState.map(payState => [
          payState.month,
          item.locataire.fullName,
          this.getNumberFromStatus(payState.state)
        ])
      )
      .reduce((acc, curr) => [...acc, ...curr], []);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const status = params.data[2];
          const statusText = this.getTextFromPaymentStatus(status);
          const roomInfo = this.getRoomInfosByUserName(params.data[1], params.data[0]);
          return `
            <div style="padding:8px;background:#f9f9f9;border-radius:4px;">
              <strong>${params.seriesName}</strong><br/>
              <strong>Locataire :</strong> ${params.data[1]}<br/>
              <strong>Mois :</strong> ${UtilsString.capitalizedFirstLetter(
                new Date(this.selectedYear, params.data[0])
                  .toLocaleDateString('fr-FR', { month: 'long' })
              )}<br/>
              <strong>Montant :</strong> ${roomInfo?.price || '—'}<br/>
              <strong>${roomInfo?.roomStringType || 'Unité'} :</strong> ${roomInfo?.roomCode || '—'}<br/>
              <strong>Statut :</strong> ${statusText}
            </div>`;
        }
      },
      grid: { height: '60%', top: '10%', right: '1%' },
      xAxis: {
        type: 'category',
        data: UtilsString.getListOfMonth(),
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: locataires,
        splitArea: { show: true },
        nameTextStyle: { align: 'left', verticalAlign: 'middle', lineHeight: -1 }
      },
      visualMap: {
        min: 0,
        max: 5,
        calculable: true,
        show: false,
        inRange: {
          color: [
            'rgb(220,38,38)',       // 0 Non payé
            'rgb(101,163,13)',      // 1 Payé
            'rgb(203,213,225)',     // 2 En attente
            'rgb(41,37,36)',        // 3 Contrat terminé
            'rgba(100,163,13,0.6)',// 4 Paiement partiel
            'rgba(41,37,36,0.8)'   // 5 Aucun contrat
          ]
        }
      },
      series: [{
        name: 'Statut des Paiements',
        type: 'heatmap',
        data: dataPayment,
        label: {
          show: true,
          formatter: (params) => this.getTextFromPaymentStatus(params.data[2]),
          fontSize: 10,
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' }
        }
      }]
    };
  }

  private getRoomInfosByUserName(userName: string, monthIndex: number) {
    const detail = this.currentPayementData.find(item => item.locataire.fullName === userName);
    if (!detail) return null;

    const room = detail.room;
    // ✅ Correction : utiliser `price` (montant réellement payé) et non `unitLocationPaymentPrice`
    const payState = detail.paymentState.find(item => item.month === monthIndex);
    const displayPrice = payState?.state === StatisticPaymentStateType.PARTIAL_PAYMENT
      ? this.currencyPipe.transform(payState.price, Currency.XAF, 'symbol', '1.0-0')
      : this.currencyPipe.transform(room.price, Currency.XAF, 'symbol', '1.0-0');

    return {
      price: displayPrice,
      roomCode: room.code,
      roomStringType: UtilsString.getStringOfRoomType(room.type)
    };
  }

  // 0: Non payé, 1: Payé, 2: En attente, 3: Contrat terminé, 4: Paiement partiel, 5: Aucun contrat
  getNumberFromStatus(status: StatisticPaymentStateType): number {
    switch (status) {
      case StatisticPaymentStateType.UNPAYED: return 0;
      case StatisticPaymentStateType.PAYED: return 1;
      case StatisticPaymentStateType.WAITING: return 2;
      case StatisticPaymentStateType.ENDED_CONTRACT: return 3;
      case StatisticPaymentStateType.PARTIAL_PAYMENT: return 4;
      default: return 5;
    }
  }

  getTextFromPaymentStatus(status: number): string {
    switch (status) {
      case 0: return 'Non payé';
      case 1: return 'Payé';
      case 2: return 'En attente';
      case 3: return 'Fin de contrat';
      case 4: return 'Partiel';
      default: return 'Aucun contrat';
    }
  }
}
