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
      const monthlyPayments = roomData.paymentValue || Array(12).fill(0);
      // totalReceived : champ enrichi du backend, fallback sur la somme des paiements mensuels
      const totalReceived: number = roomData.totalReceived != null
        ? roomData.totalReceived
        : (monthlyPayments as number[]).reduce((s: number, v: number) => s + (v || 0), 0);

      legendData.push(roomName);
      dataSeries.push({
        name: roomName,
        type: 'line',
        smooth: true,
        data: monthlyPayments,
        lineStyle: { width: 3 },
        itemStyle: { borderRadius: 5 },
        _roomInfo: {
          monthlyRent: room?.price || 0,
          monthsDue: roomData.monthsDue || 12,
          totalReceived,
          expectedAmount: roomData.expectedAmount || 0,
          collectionRate: roomData.collectionRate || 0,
          paymentStatus: roomData.paymentStatus || 'unknown'
        }
      });
    });

    return {
      title: {
        text: `Revenus par chambre ${this.selectedYear}`,
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
          params.forEach(param => {
            const series = dataSeries.find(s => s.name === param.seriesName);
            const info = series?._roomInfo || {};
            const icon = this.getStatusIcon(info.paymentStatus);
            content += `
              <div style="margin:6px 0;padding:6px;border-left:3px solid ${param.color};background:#f9f9f9;">
                <strong>${param.seriesName}</strong> ${icon}<br/>
                · Reçu ce mois : <strong>${(param.value || 0).toLocaleString('fr-FR')} FCFA</strong><br/>
                · Loyer mensuel : ${(info.monthlyRent || 0).toLocaleString('fr-FR')} FCFA<br/>
                · Taux recouvrement : <strong>${(info.collectionRate || 0).toFixed(1)}%</strong>
              </div>`;
          });
          return content;
        }
      },
      legend: { data: legendData, top: 30 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      toolbox: { feature: { saveAsImage: { title: 'Télécharger' } } },
      xAxis: {
        type: 'category',
        boundaryGap: false,
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
