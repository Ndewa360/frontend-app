import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { StatisticState, StatisticAction, StatisticError } from 'src/app/shared/store';
import { EnrichedStatisticResponse } from 'src/app/shared/store/statistic-data/statistic.model';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'chart-finance-room',
  templateUrl: './chart-finance-room.component.html',
  styleUrls: ['./chart-finance-room.component.css']
})
export class ChartFinanceRoomComponent implements OnInit, OnChanges, OnDestroy {

  @Input() label: string = '';
  @Input() title: string = 'Révenu unité';
  @Input() propertyID: string = '';
  @Input() selectedYear: number = new Date().getFullYear();

  charsOpts: any = {};
  isLoading: boolean = false;
  error: StatisticError | null = null;
  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyID'] || changes['selectedYear']) {
      this.title = `Révenu unité ${this.selectedYear}`;
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.propertyID || !this.selectedYear) {
      this.charsOpts = this.getEmptyChart();
      return;
    }

    this.isLoading = true;
    this.error = null;

    // ✅ Dispatch vers FetchStaticByPropertyIdAndYear (qui stocke dans propertyStatistic)
    this.store.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(
      this.propertyID,
      this.selectedYear.toString()
    ));

    // ✅ Écoute le bon selector : selectStateStatisticPropertyIdAndYear
    combineLatest([
      this.store.select(
        StatisticState.selectStateStatisticPropertyIdAndYear(this.propertyID, this.selectedYear)
      ),
      this.store.select(StatisticState.selectStateLoadingPropertyStatistic),
      this.store.select(StatisticState.selectRoomStatisticError)
    ]).pipe(
      takeUntil(this.destroy$),
      map(([propertyStats, loading, error]) => ({ propertyStats, loading, error }))
    ).subscribe(({ propertyStats, loading, error }) => {
      this.error = error;

      if (propertyStats && propertyStats.length > 0) {
        this.isLoading = false;
        // propertyStats[0].data est l'EnrichedStatisticResponse
        this.charsOpts = this.buildChart(propertyStats[0].data as EnrichedStatisticResponse);
      } else if (!loading) {
        this.isLoading = false;
        this.charsOpts = this.getEmptyChart();
      }
    });
  }

  onRetry(): void {
    this.loadData();
  }

  private buildChart(data: EnrichedStatisticResponse): any {
    if (!data || !data.data || !data.data.rooms || data.data.rooms.length === 0) {
      return this.getEmptyChart();
    }

    const rooms = data.data.rooms;
    const legendData: string[] = [];
    const dataSeries: any[] = [];

    rooms.forEach((roomData: any) => {
      const room = roomData.room;
      const roomName = `${room?.code || 'Chambre'} - ${room?.type || 'Standard'}`;

      // paymentValue = encaissements réels de l'année (onglet Revenus)
      const monthlyPayments = roomData.paymentValue || Array(12).fill(0);

      // Projection mensuelle : distribuer coveredAmountInYear sur les mois couverts
      // Un mois est couvert si paymentState[month].state === 'payed'
      const projectedMonthly = Array(12).fill(0);
      if (roomData.coveredMonthsInYear > 0 && room?.price > 0) {
        // Identifier les mois couverts dans l'année via la coveredUntilDate
        const coveredUntil = roomData.coveredUntilDate ? new Date(roomData.coveredUntilDate) : null;
        const entryDate    = roomData.entryDate ? new Date(roomData.entryDate) : null;
        if (coveredUntil && entryDate) {
          for (let m = 0; m < 12; m++) {
            const monthStart = new Date(this.selectedYear, m, 1);
            const monthEnd   = new Date(this.selectedYear, m + 1, 0, 23, 59, 59);
            const isOccupied = entryDate <= monthEnd;
            if (isOccupied && coveredUntil >= monthStart) {
              projectedMonthly[m] = room.price;
            }
          }
        }
      }

      const totalReceived: number = roomData.totalReceived != null
        ? roomData.totalReceived
        : (monthlyPayments as number[]).reduce((s: number, v: number) => s + (v || 0), 0);

      legendData.push(roomName);

      // Série 1 : encaissements réels (barres)
      dataSeries.push({
        name: roomName,
        type: 'bar',
        stack: 'encaisse',
        data: monthlyPayments,
        itemStyle: { opacity: 0.85 },
        _roomInfo: {
          monthlyRent:    room?.price || 0,
          monthsDue:      roomData.monthsDue || 12,
          totalReceived,
          expectedAmount: roomData.expectedAmount || 0,
          collectionRate: roomData.collectionRate || 0,
          paymentStatus:  roomData.paymentStatus || 'unknown',
          coveredMonthsInYear: roomData.coveredMonthsInYear || 0,
          coveredAmountInYear: roomData.coveredAmountInYear || 0
        }
      });

      // Série 2 : projection (ligne pointillée) — mois couverts par le cumul
      dataSeries.push({
        name: `${roomName} (couvert)`,
        type: 'line',
        data: projectedMonthly,
        lineStyle: { type: 'dashed', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        showInLegend: false,
        _isProjection: true
      });
    });

    // Filtrer les légendes pour n'afficher que les séries principales
    const mainLegend = legendData;

    return {
      title: {
        text: `Revenus par chambre ${this.selectedYear}`,
        subtext: 'Barres = encaissé | Ligne pointillée = couvert par cumul',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        formatter: (params: any[]) => {
          const monthName = UtilsString.capitalizedFirstLetter(
            new Date(this.selectedYear, params[0].dataIndex)
              .toLocaleDateString('fr-FR', { month: 'long' })
          );
          let content = `<strong>${monthName}</strong><br/>`;
          params.filter(p => !dataSeries.find(s => s.name === p.seriesName)?._isProjection)
            .forEach(param => {
              const series = dataSeries.find(s => s.name === param.seriesName);
              const info = series?._roomInfo || {};
              const icon = this.getStatusIcon(info.paymentStatus);
              content += `
                <div style="margin:6px 0;padding:6px;border-left:3px solid ${param.color};background:#f9f9f9;">
                  <strong>${param.seriesName}</strong> ${icon}<br/>
                  · Encaissé ce mois : <strong>${(param.value || 0).toLocaleString('fr-FR')} FCFA</strong><br/>
                  · Loyer mensuel : ${(info.monthlyRent || 0).toLocaleString('fr-FR')} FCFA<br/>
                  · Mois couverts ${this.selectedYear} : ${info.coveredMonthsInYear || 0}<br/>
                  · Taux couverture : <strong>${(info.collectionRate || 0).toFixed(1)}%</strong>
                </div>`;
            });
          return content;
        }
      },
      legend: { data: mainLegend, top: 50 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
      toolbox: { feature: { saveAsImage: { title: 'Télécharger' } } },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: UtilsString.getListOfMonth(),
        name: 'Mois',
        nameLocation: 'middle',
        nameGap: 25
      },
      yAxis: {
        type: 'value',
        name: 'Montant (FCFA)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: { formatter: (v: number) => v.toLocaleString('fr-FR') }
      },
      series: dataSeries
    };
  }

  private getStatusIcon(status: string): string {
    const icons = {
      up_to_date: '✅', advance: '💰', late: '⚠️', critical: '🚨', no_payment: '❌'
    };
    return icons[status] || '❓';
  }

  private getEmptyChart(): any {
    return {
      title: { text: `Revenus par chambre ${this.selectedYear}`, textStyle: { fontSize: 16, fontWeight: 'bold' } },
      xAxis: { type: 'category', data: UtilsString.getListOfMonth(), name: 'Mois' },
      yAxis: { type: 'value', name: 'Montant (FCFA)' },
      series: [],
      graphic: {
        type: 'text', left: 'center', top: 'middle',
        style: { text: 'Aucune donnée disponible', fontSize: 16, fill: '#999' }
      }
    };
  }
}
