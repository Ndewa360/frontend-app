import { Injectable } from '@angular/core';
import { 
  LocataireModel, 
  RoomModel, 
  LocationModel, 
  LocationPaymentModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentStateType 
} from '../store';

export interface TenantPaymentCalculation {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyRent: number;
  entryDate: Date;
  monthsOccupied: number;
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  paymentRate: number;
  status: 'up_to_date' | 'ahead' | 'partial' | 'late' | 'no_contract' | 'ended_contract';
  statusLabel: string;
  daysLate?: number;
  monthsAhead?: number;
  monthlyDetails: MonthlyPaymentDetail[];
  lastPaymentDate?: Date;
  contractStatus: 'active' | 'ended' | 'none';
}

export interface MonthlyPaymentDetail {
  month: number;
  monthName: string;
  year: number;
  expected: number;
  received: number;
  status: StatisticPaymentStateType;
  daysLate?: number;
  isDue: boolean; // Nouveau : indique si ce mois est réellement dû
}

@Injectable({
  providedIn: 'root'
})
export class TenantPaymentCalculatorService {

  constructor() { }

  /**
   * Calcule le statut de paiement correct d'un locataire
   */
  calculateTenantPaymentStatus(
    paymentStat: StatisticAllPaymentLocataireYearModel,
    location: LocationModel,
    selectedYear: number = new Date().getFullYear()
  ): TenantPaymentCalculation | null {
    
    if (!paymentStat.locataire || !paymentStat.room || !location.startedAt) {
      return null;
    }

    const tenant = paymentStat.locataire;
    const room = paymentStat.room;
    const monthlyRent = room.price || 0;
    const entryDate = new Date(location.startedAt);
    const currentDate = new Date();
    
    // Calculer les mois réellement occupés
    const monthsOccupied = this.calculateMonthsOccupied(entryDate, currentDate, selectedYear);
    const monthlyDetails = this.buildMonthlyDetails(paymentStat, entryDate, selectedYear);
    
    // Calculer les totaux basés sur les mois réellement dus
    const dueMonths = monthlyDetails.filter(m => m.isDue);
    const totalExpected = dueMonths.reduce((sum, m) => sum + m.expected, 0);
    const totalReceived = monthlyDetails.reduce((sum, m) => sum + m.received, 0);
    const totalPending = Math.max(0, totalExpected - totalReceived);
    
    // Calculer le taux de paiement correct
    const paymentRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;
    
    // Déterminer le statut correct
    const status = this.determineCorrectStatus(monthlyDetails, totalReceived, totalExpected, monthsOccupied);
    const statusLabel = this.getStatusLabel(status);
    
    // Calculer les jours de retard ou mois d'avance
    const { daysLate, monthsAhead } = this.calculateLateness(monthlyDetails, totalReceived, monthlyRent, monthsOccupied);
    
    return {
      tenantId: tenant._id || '',
      tenantName: tenant.fullName || 'Locataire inconnu',
      roomCode: room.code || 'N/A',
      monthlyRent,
      entryDate,
      monthsOccupied,
      totalExpected,
      totalReceived,
      totalPending,
      paymentRate,
      status,
      statusLabel,
      daysLate,
      monthsAhead,
      monthlyDetails,
      lastPaymentDate: this.findLastPaymentDate(monthlyDetails),
      contractStatus: this.determineContractStatus(monthlyDetails)
    };
  }

  /**
   * Calcule le nombre de mois réellement occupés
   */
  private calculateMonthsOccupied(entryDate: Date, currentDate: Date, selectedYear: number): number {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);
    
    // Utiliser la date d'entrée si elle est dans l'année sélectionnée
    const startDate = entryDate > yearStart ? entryDate : yearStart;
    const endDate = currentDate < yearEnd ? currentDate : yearEnd;
    
    if (startDate > endDate) return 0;
    
    // Calculer les mois complets + fraction du mois en cours
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    // Ajouter la fraction du mois en cours
    const daysFraction = endDate.getDate() / new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    
    return Math.max(0, monthsDiff + daysFraction);
  }

  /**
   * Construit les détails mensuels en tenant compte de la date d'entrée
   */
  private buildMonthlyDetails(
    paymentStat: StatisticAllPaymentLocataireYearModel,
    entryDate: Date,
    selectedYear: number
  ): MonthlyPaymentDetail[] {
    
    const monthlyDetails: MonthlyPaymentDetail[] = [];
    const currentDate = new Date();
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(selectedYear, month, 1);
      const isAfterEntry = monthDate >= new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      const isBeforeCurrent = monthDate <= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Un mois est dû s'il est après l'entrée ET avant/égal au mois actuel
      const isDue = isAfterEntry && isBeforeCurrent;
      
      const paymentData = paymentStat.paymentState.find(p => p.month === month + 1);
      const expected = isDue ? (paymentData?.price || paymentStat.room.price || 0) : 0;
      const received = paymentData?.unitLocationPaymentPrice || 0;
      const status = paymentData?.state || StatisticPaymentStateType.NO_CONTRACT;
      
      monthlyDetails.push({
        month: month + 1,
        monthName: this.getMonthName(month),
        year: selectedYear,
        expected,
        received,
        status,
        isDue,
        daysLate: this.calculateDaysLate(month, status, selectedYear)
      });
    }
    
    return monthlyDetails;
  }

  /**
   * Détermine le statut correct basé sur la logique métier
   */
  private determineCorrectStatus(
    monthlyDetails: MonthlyPaymentDetail[],
    totalReceived: number,
    totalExpected: number,
    monthsOccupied: number
  ): TenantPaymentCalculation['status'] {
    
    const hasEndedContract = monthlyDetails.some(m => m.status === StatisticPaymentStateType.ENDED_CONTRACT);
    const hasNoContract = monthlyDetails.every(m => m.status === StatisticPaymentStateType.NO_CONTRACT);
    
    if (hasEndedContract) return 'ended_contract';
    if (hasNoContract) return 'no_contract';
    
    // Si pas de paiement attendu encore
    if (totalExpected === 0) return 'up_to_date';
    
    const paymentRate = (totalReceived / totalExpected) * 100;
    
    // Logique améliorée pour déterminer le statut
    if (paymentRate >= 100) {
      // Vérifier s'il est en avance (a payé plus de mois que nécessaire)
      const monthlyRent = monthlyDetails.find(m => m.expected > 0)?.expected || 0;
      if (monthlyRent > 0) {
        const monthsPaid = totalReceived / monthlyRent;
        if (monthsPaid > monthsOccupied + 0.5) { // Plus d'un demi-mois d'avance
          return 'ahead';
        }
      }
      return 'up_to_date';
    } else if (paymentRate >= 80) {
      return 'partial';
    } else {
      return 'late';
    }
  }

  /**
   * Calcule les jours de retard ou mois d'avance
   */
  private calculateLateness(
    monthlyDetails: MonthlyPaymentDetail[],
    totalReceived: number,
    monthlyRent: number,
    monthsOccupied: number
  ): { daysLate?: number; monthsAhead?: number } {
    
    if (monthlyRent === 0) return {};
    
    const monthsPaid = totalReceived / monthlyRent;
    const difference = monthsPaid - monthsOccupied;
    
    if (difference > 0.5) {
      // En avance
      return { monthsAhead: Math.floor(difference) };
    } else if (difference < -0.1) {
      // En retard - calculer les jours
      const daysLate = Math.abs(difference) * 30; // Approximation
      return { daysLate: Math.floor(daysLate) };
    }
    
    return {};
  }

  /**
   * Obtient le libellé du statut
   */
  private getStatusLabel(status: TenantPaymentCalculation['status']): string {
    switch (status) {
      case 'up_to_date': return 'À jour';
      case 'ahead': return 'En avance';
      case 'partial': return 'Paiement partiel';
      case 'late': return 'En retard';
      case 'no_contract': return 'Pas de contrat';
      case 'ended_contract': return 'Contrat terminé';
      default: return 'Inconnu';
    }
  }

  /**
   * Trouve la dernière date de paiement
   */
  private findLastPaymentDate(monthlyDetails: MonthlyPaymentDetail[]): Date | undefined {
    const paidMonths = monthlyDetails.filter(m => m.received > 0);
    if (paidMonths.length === 0) return undefined;
    
    const lastPaidMonth = paidMonths[paidMonths.length - 1];
    return new Date(lastPaidMonth.year, lastPaidMonth.month - 1, 15);
  }

  /**
   * Détermine le statut du contrat
   */
  private determineContractStatus(monthlyDetails: MonthlyPaymentDetail[]): 'active' | 'ended' | 'none' {
    const hasEndedContract = monthlyDetails.some(m => m.status === StatisticPaymentStateType.ENDED_CONTRACT);
    const hasNoContract = monthlyDetails.every(m => m.status === StatisticPaymentStateType.NO_CONTRACT);
    
    if (hasEndedContract) return 'ended';
    if (hasNoContract) return 'none';
    return 'active';
  }

  /**
   * Calcule les jours de retard pour un mois donné
   */
  private calculateDaysLate(month: number, status: StatisticPaymentStateType, year: number): number | undefined {
    if (status === StatisticPaymentStateType.UNPAYED) {
      const currentDate = new Date();
      const dueDate = new Date(year, month - 1, 5); // Le 5 de chaque mois
      
      if (currentDate > dueDate) {
        return Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return undefined;
  }

  /**
   * Obtient le nom du mois
   */
  private getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || 'Inconnu';
  }

  /**
   * Calcule les métriques financières corrigées pour le dashboard
   */
  calculateFinancialMetrics(
    yearlyStats: any[],
    locations: LocationModel[],
    selectedYear: number
  ): {
    totalRevenue: number;
    totalExpected: number;
    collectionRate: number;
    averageRent: number;
    occupancyRate: number;
    occupiedRooms: number;
    totalRooms: number;
  } {

    if (!yearlyStats || yearlyStats.length === 0) {
      return {
        totalRevenue: 0,
        totalExpected: 0,
        collectionRate: 0,
        averageRent: 0,
        occupancyRate: 0,
        occupiedRooms: 0,
        totalRooms: 0
      };
    }

    let totalRevenue = 0;
    let totalExpected = 0;
    let totalRentSum = 0;
    let occupiedRooms = 0;
    const totalRooms = yearlyStats.length;

    yearlyStats.forEach(roomStat => {
      if (!roomStat.room) return;

      const roomPrice = roomStat.room.price || 0;
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum: number, payment: number) => sum + (payment || 0), 0);

      // Trouver la location correspondante pour cette chambre
      const roomLocation = locations.find(loc =>
        loc.room === roomStat.room._id &&
        loc.isRunning === true
      );

      let expectedForYear = 0;

      if (roomLocation && roomLocation.startedAt) {
        // Calculer les mois réellement dus basés sur la date d'entrée
        const entryDate = new Date(roomLocation.startedAt);
        const monthsOccupied = this.calculateMonthsOccupied(entryDate, new Date(), selectedYear);
        expectedForYear = roomPrice * Math.ceil(monthsOccupied);
      } else {
        // Fallback : utiliser les mois où il y a eu des paiements
        const monthsWithPayments = monthlyPayments.filter((payment: number) => payment > 0).length;
        expectedForYear = roomPrice * Math.max(monthsWithPayments, 1);
      }

      totalRevenue += receivedForRoom;
      totalExpected += expectedForYear;
      totalRentSum += roomPrice;

      // Une chambre est considérée comme occupée si elle a reçu des paiements
      if (receivedForRoom > 0) {
        occupiedRooms++;
      }
    });

    return {
      totalRevenue,
      totalExpected,
      collectionRate: totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0,
      averageRent: totalRooms > 0 ? totalRentSum / totalRooms : 0,
      occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      occupiedRooms,
      totalRooms
    };
  }
}
