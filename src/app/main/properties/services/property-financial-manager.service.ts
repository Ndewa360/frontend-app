import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EnrichedStatisticResponse,
  StatisticAction
} from '../../../shared/store';
import { StatisticState } from '../../../shared/store/statistic-data/statistic.state';

/**
 * Interface pour les métriques financières extraites du backend
 */
export interface PropertyFinancialMetrics {
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  averageRent: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  totalAdvances: number;
  totalDebts: number;
  selectedYear: number;
  roomDetails: RoomFinancialDetail[];
}

/**
 * Interface pour les détails financiers d'une chambre (depuis backend)
 */
export interface RoomFinancialDetail {
  roomId: string;
  roomCode: string;
  monthlyRent: number;
  monthsDue: number;
  totalReceived: number;
  expectedAmount: number;
  collectionRate: number;
  paymentStatus: string;
  advanceAmount: number;
  debtAmount: number;
  monthlyPayments: number[];
}

/**
 * Interface pour les données mensuelles (depuis backend)
 */
export interface MonthlyFinancialData {
  month: string;
  monthIndex: number;
  expected: number;
  received: number;
  rate: number;
  profit: number;
  growth?: number;
  performancePercentage?: number;
  monthName?: string;
  totalRevenue?: number;
  paymentsCount?: number;
  collectionRate?: number;
  activeUnits?: number;
}

/**
 * Service simplifié pour extraire les données financières du backend
 * Toute la logique de calcul est maintenant côté backend
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyFinancialManagerService {

  static readonly MONTHS_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(private store: Store) {}

  /**
   * Charge les données financières centralisées depuis le backend
   */
  loadPropertyFinancialData(propertyId: string, selectedYear: number): Observable<any> {
    this.store.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(propertyId, selectedYear.toString()));
    
    return this.store.select(
      StatisticState.selectStateStatisticPropertyIdAndYear(propertyId, selectedYear)
    );
  }

  /**
   * Extrait les métriques financières depuis les calculs centralisés du backend
   */
  extractPropertyMetrics(data: EnrichedStatisticResponse): PropertyFinancialMetrics {
    
    if (!data) {
      return this.getEmptyMetrics();
    }

    const propertyMetrics = data.data.propertyMetrics;
    const rooms = data.data.rooms || [];

    const roomDetails: RoomFinancialDetail[] = rooms.map((roomData: any) => ({
      roomId: roomData.room._id,
      roomCode: roomData.room.code,
      monthlyRent: roomData.room.price,
      monthsDue: roomData.monthsDue,
      totalReceived: roomData.totalReceived,
      expectedAmount: roomData.expectedAmount,
      collectionRate: roomData.collectionRate,
      paymentStatus: roomData.paymentStatus,
      advanceAmount: roomData.advanceAmount || 0,
      debtAmount: roomData.debtAmount || 0,
      monthlyPayments: roomData.paymentValue || []
    }));

    return {
      totalRevenue: propertyMetrics.totalRevenue,
      totalExpected: propertyMetrics.totalExpected,
      collectionRate: propertyMetrics.collectionRate,
      averageRent: propertyMetrics.averageRent,
      occupancyRate: propertyMetrics.occupancyRate,
      totalRooms: propertyMetrics.totalRooms,
      occupiedRooms: propertyMetrics.occupiedRooms,
      totalAdvances: propertyMetrics.totalAdvances,
      totalDebts: propertyMetrics.totalDebts,
      selectedYear: data.data.year ? parseInt(data.data.year) : new Date().getFullYear(),
      roomDetails
    };
  }

  /**
   * Extrait les données mensuelles depuis les calculs centralisés du backend
   */
  extractMonthlyData(data: EnrichedStatisticResponse): MonthlyFinancialData[] {
    console.log('📅 Extraction des données mensuelles depuis les calculs centralisés du backend');
    
    if (!data) {
      return this.getEmptyMonthlyData();
    }
    const rooms = data.data.rooms || [];
    const monthlyData: MonthlyFinancialData[] = [];
    
    for (let month = 0; month < 12; month++) {
      let monthlyReceived = data.data.revenueDistribution.monthlyAnalysis[month].distributed;
      let monthlyExpected = data.data.revenueDistribution.monthlyAnalysis[month].expected;

      

      const collectionRate = data.data.revenueDistribution.monthlyAnalysis[month].fulfillmentRate;
      const estimatedCosts = 0; // 30% de coûts opérationnels
      const profit = monthlyReceived - estimatedCosts;

      let growth = 0;
      if (month > 0 && monthlyData.length > 0) {
        const previousReceived = monthlyData[month - 1].received;
        growth = previousReceived > 0 ? ((monthlyReceived - previousReceived) / previousReceived) * 100 : 0;
      }
      
     
      
      const paymentsCount = rooms.filter(roomData => (roomData.paymentValue[month] || 0) > 0).length;
      
      monthlyData.push({
        month: PropertyFinancialManagerService.MONTHS_NAMES[month],
        monthIndex: month,
        expected: Math.round(monthlyExpected * 100) / 100,
        received: Math.round(monthlyReceived * 100) / 100,
        rate: Math.round(collectionRate * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        growth: Math.round(growth * 100) / 100,
        performancePercentage: Math.round(collectionRate * 100) / 100,
        monthName: PropertyFinancialManagerService.MONTHS_NAMES[month],
        totalRevenue: Math.round(monthlyReceived * 100) / 100,
        paymentsCount: paymentsCount,
        collectionRate: Math.round(collectionRate * 100) / 100,
        activeUnits: data.data.revenueDistribution.monthlyAnalysis[month].totalActiveRooms
      });
    }

    return monthlyData;
  }

  /**
   * Extrait les performances des locataires depuis les données backend
   */
  extractTenantPerformances(data: EnrichedStatisticResponse): any[] {
    console.log('👥 Extraction des performances locataires depuis les calculs centralisés du backend');

    if (!data) {
      return [];
    }

    const rooms = data.data.rooms || [];

    return rooms
      .filter((roomData: any) => roomData.totalReceived > 0)
      .map((roomData: any) => {
        const monthsActive = roomData.monthsDue || 12;
        const averageMonthlyPayment = monthsActive > 0 ? roomData.totalReceived / monthsActive : 0;
        
        return {
          tenantId: roomData.room._id || '',
          tenantName: `Chambre ${roomData.room.code}`,
          totalPaid: roomData.totalReceived,
          totalDue: roomData.expectedAmount,
          paymentRate: roomData.collectionRate,
          monthsActive,
          averageMonthlyPayment: Math.round(averageMonthlyPayment * 100) / 100,
          paymentStatus: roomData.paymentStatus,
          advanceAmount: roomData.advanceAmount || 0,
          debtAmount: roomData.debtAmount || 0
        };
      });
  }

  /**
   * Retourne des métriques vides
   */
  private getEmptyMetrics(): PropertyFinancialMetrics {
    return {
      totalRevenue: 0,
      totalExpected: 0,
      collectionRate: 0,
      averageRent: 0,
      occupancyRate: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      totalAdvances: 0,
      totalDebts: 0,
      selectedYear: new Date().getFullYear(),
      roomDetails: []
    };
  }

  /**
   * Retourne des données mensuelles vides
   */
  private getEmptyMonthlyData(): MonthlyFinancialData[] {
    const data: MonthlyFinancialData[] = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        month: PropertyFinancialManagerService.MONTHS_NAMES[i],
        monthIndex: i,
        expected: 0,
        received: 0,
        rate: 0,
        profit: 0,
        growth: 0,
        performancePercentage: 0,
        monthName: PropertyFinancialManagerService.MONTHS_NAMES[i],
        totalRevenue: 0,
        paymentsCount: 0,
        collectionRate: 0,
        activeUnits: 0
      });
    }
    return data;
  }

  /**
   * Génère les données pour les graphiques de revenus depuis les données backend
   */
  generateRevenueChartData(monthlyData: MonthlyFinancialData[]): {
    months: string[];
    revenues: number[];
    expected: number[];
  } {
    return {
      months: monthlyData.map(m => m.month.substring(0, 3)),
      revenues: monthlyData.map(m => m.received),
      expected: monthlyData.map(m => m.expected)
    };
  }

  /**
   * Génère les données pour les graphiques de statuts de paiement depuis les données backend
   */
  generatePaymentStatusData(roomDetails: RoomFinancialDetail[]): {
    name: string;
    value: number;
    color: string;
  }[] {
    const statusCounts = {
      up_to_date: 0,
      late: 0,
      advance: 0,
      critical: 0,
      no_payment: 0
    };

    roomDetails.forEach(room => {
      const status = room.paymentStatus;
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else {
        statusCounts.no_payment++;
      }
    });

    return [
      { name: 'À jour', value: statusCounts.up_to_date, color: '#10B981' },
      { name: 'En retard', value: statusCounts.late, color: '#F59E0B' },
      { name: 'En avance', value: statusCounts.advance, color: '#3B82F6' },
      { name: 'Critique', value: statusCounts.critical, color: '#DC2626' },
      { name: 'Aucun paiement', value: statusCounts.no_payment, color: '#6B7280' }
    ].filter(item => item.value > 0);
  }

  /**
   * Formate les montants en devise locale
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate les pourcentages
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
