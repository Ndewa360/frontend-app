import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatisticRoomYearModel, StatisticState, StatisticAction, StatisticError } from 'src/app/shared/store';
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
      this.isLoading = false;
      this.error = null;
      return;
    }

    // Dispatch action to fetch data if not already loaded
    this.store.dispatch(new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyID, this.selectedYear.toString()));

    // Combine data, loading state, and error state
    combineLatest([
      this.store.select(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyID, this.selectedYear)),
      this.store.select(StatisticState.selectStateRoomStatisticLoading),
      this.store.select(StatisticState.selectRoomStatisticError)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([data, loading, error]) => {
        this.isLoading = loading as boolean;
        this.error = error;

        if (!loading && !error) {
          this.charsOpts = this.getChart(data);
        }
      });
  }

  onRetry(): void {
    console.log('🔄 Retrying to load room statistics');
    this.loadData();
  }

  private getChart(data: StatisticRoomYearModel[]): any {
    if (!data || data.length === 0) {
      return this.getEmptyChart();
    }

    const legendData: string[] = [];
    const dataSeries: any[] = [];

    console.log('📊 Chart Finance Room - Données reçues:', data);

    data.forEach((roomStat) => {
      const roomName = `${roomStat.room?.code || 'Chambre'} - ${roomStat.room?.type || 'Standard'}`;
      legendData.push(roomName);

      dataSeries.push({
        name: roomName,
        type: 'line',
        smooth: true,
        data: roomStat.paymentValue || Array(12).fill(0),
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderRadius: 5
        }
      });
    });

    return {
      title: {
        text: `Revenus par chambre ${this.selectedYear}`,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params: any[]) => {
          let tooltipContent = `<strong>${UtilsString.capitalizedFirstLetter(
            new Date(this.selectedYear, params[0].dataIndex).toLocaleDateString('fr-FR', { month: 'long' })
          )}</strong><br/>`;

          params.forEach((param) => {
            tooltipContent += `${param.seriesName}: ${param.value?.toLocaleString('fr-FR')} FCFA<br/>`;
          });

          return tooltipContent;
        }
      },
      legend: {
        data: legendData,
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Télécharger'
          }
        }
      },
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
        axisLabel: {
          formatter: (value: number) => value.toLocaleString('fr-FR')
        }
      },
      series: dataSeries
    };
  }

  private getEmptyChart(): any {
    return {
      title: {
        text: `Revenus par chambre ${this.selectedYear}`,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      xAxis: {
        type: 'category',
        data: UtilsString.getListOfMonth(),
        name: 'Mois'
      },
      yAxis: {
        type: 'value',
        name: 'Montant (FCFA)'
      },
      series: [],
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: 'Aucune donnée disponible',
          fontSize: 16,
          fill: '#999'
        }
      }
    };
  }

}
