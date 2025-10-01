import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { StatisticRoomYearModel, StatisticState, StatisticAction, StatisticError } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { FinancialCalculationsService } from 'src/app/shared/services/financial-calculations.service';

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

  constructor(
    private store: Store,
    private financialService: FinancialCalculationsService
  ) {}

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

    console.log(`📊 Chargement des données financières centralisées - Propriété: ${this.propertyID}, Année: ${this.selectedYear}`);

    // Déclencher l'action pour récupérer les calculs centralisés
    this.store.dispatch(new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyID, this.selectedYear.toString()));

    // Écouter les données centralisées depuis le store
    combineLatest([
      this.store.select(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyID, this.selectedYear)),
      this.store.select(StatisticState.selectStateRoomStatisticLoading),
      this.store.select(StatisticState.selectRoomStatisticError)
    ]).pipe(
      takeUntil(this.destroy$),
      map(([backendData, loading, error]) => {
        // Validation des données backend
        if (backendData && backendData.length > 0) {
          const validation = this.financialService.validateBackendData(backendData[0]);
          if (!validation.isValid) {
            console.warn('⚠️ Données backend invalides:', validation.errors);
          }
        }
        return { backendData, loading, error };
      })
    ).subscribe(({ backendData, loading, error }) => {
      this.isLoading = loading as boolean;
      this.error = error;

      if (!loading && !error && backendData) {
        this.charsOpts = this.getChart(backendData);
      }
    });
  }

  onRetry(): void {
    console.log('🔄 Retrying to load room statistics');
    this.loadData();
  }

  private getChart(backendData: any[]): any {
    if (!backendData || backendData.length === 0) {
      return this.getEmptyChart();
    }

    console.log('📊 Utilisation des données centralisées du backend:', backendData);

    // Extraire les données des chambres depuis les calculs centralisés
    const roomsData = backendData[0]?.rooms || [];
    
    const legendData: string[] = [];
    const dataSeries: any[] = [];

    roomsData.forEach((roomData: any) => {
      const room = roomData.room;
      const roomName = `${room?.code || 'Chambre'} - ${room?.type || 'Standard'}`;
      const monthlyPayments = roomData.paymentValue || Array(12).fill(0);
      
      legendData.push(roomName);

      // Ajouter des informations sur les calculs centralisés dans le tooltip
      dataSeries.push({
        name: roomName,
        type: 'line',
        smooth: true,
        data: monthlyPayments,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderRadius: 5
        },
        // Données supplémentaires pour le tooltip
        roomInfo: {
          monthlyRent: room?.price || 0,
          monthsDue: roomData.monthsDue || 12,
          totalReceived: roomData.totalReceived || 0,
          expectedAmount: roomData.expectedAmount || 0,
          collectionRate: roomData.collectionRate || 0,
          paymentStatus: roomData.paymentStatus || 'unknown'
        }
      });
    });

    return {
      title: {
        text: `Revenus par chambre ${this.selectedYear} (Calculs centralisés)`,
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
          const monthName = UtilsString.capitalizedFirstLetter(
            new Date(this.selectedYear, params[0].dataIndex).toLocaleDateString('fr-FR', { month: 'long' })
          );
          
          let tooltipContent = `<strong>${monthName}</strong><br/>`;

          params.forEach((param) => {
            const roomInfo = param.data.roomInfo || {};
            const statusIcon = this.getStatusIcon(roomInfo.paymentStatus);
            
            tooltipContent += `
              <div style="margin: 8px 0; padding: 8px; border-left: 3px solid ${param.color}; background: #f9f9f9;">
                <strong>${param.seriesName}</strong> ${statusIcon}<br/>
                · Reçu ce mois: <strong>${param.value?.toLocaleString('fr-FR')} FCFA</strong><br/>
                · Loyer mensuel: ${roomInfo.monthlyRent?.toLocaleString('fr-FR')} FCFA<br/>
                · Total reçu: ${roomInfo.totalReceived?.toLocaleString('fr-FR')} FCFA<br/>
                · Taux recouvrement: <strong>${roomInfo.collectionRate?.toFixed(1)}%</strong><br/>
                · Mois dus: ${roomInfo.monthsDue} mois
              </div>
            `;
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

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'up_to_date': return '✅';
      case 'advance': return '💰';
      case 'late': return '⚠️';
      case 'critical': return '🚨';
      case 'no_payment': return '❌';
      default: return '❓';
    }
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
