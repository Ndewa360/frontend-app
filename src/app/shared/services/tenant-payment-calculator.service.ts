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

    try {
      console.log(`🧮 Calcul du statut de paiement pour locataire ${paymentStat.locataire?.fullName}`);

      // Validation des données d'entrée
      if (!paymentStat.locataire || !paymentStat.room) {
        console.warn('⚠️ Données de locataire ou chambre manquantes');
        return null;
      }

      if (!location || !location.startedAt) {
        console.warn('⚠️ Contrat de location ou date de début manquante');
        return null;
      }

      const tenant = paymentStat.locataire;
      const room = paymentStat.room;
      const monthlyRent = room.price || 0;

      if (monthlyRent <= 0) {
        console.warn('⚠️ Prix de la chambre invalide:', monthlyRent);
        return null;
      }

      // Utiliser la date d'entrée exacte si disponible, sinon la date de création du contrat
      const entryDate = location.isKnowExactDateEntry && location.startedAt
        ? new Date(location.startedAt)
        : new Date(location.createdAt || location.startedAt);

      const currentDate = new Date();

      console.log(`📅 Date d'entrée: ${entryDate.toISOString()}, Date actuelle: ${currentDate.toISOString()}`);

      // Calculer les mois réellement occupés dans l'année sélectionnée
      const monthsOccupied = this.calculateMonthsOccupied(entryDate, currentDate, selectedYear);
      const monthlyDetails = this.buildMonthlyDetails(paymentStat, entryDate, selectedYear, monthlyRent);

      // Calculer les totaux basés sur les mois réellement dus
      const dueMonths = monthlyDetails.filter(m => m.isDue);
      const totalExpected = dueMonths.reduce((sum, m) => sum + m.expected, 0);
      const totalReceived = monthlyDetails.reduce((sum, m) => sum + m.received, 0);
      const totalPending = Math.max(0, totalExpected - totalReceived);

      // Calculer le taux de paiement correct avec validation
      let paymentRate = 0;
      if (totalExpected > 0 && !isNaN(totalReceived)) {
        paymentRate = Math.min((totalReceived / totalExpected) * 100, 100);
        paymentRate = Math.max(paymentRate, 0); // Pas de taux négatif
      }

      // Déterminer le statut correct
      const status = this.determineCorrectStatus(monthlyDetails, totalReceived, totalExpected, monthsOccupied, currentDate);
      const statusLabel = this.getStatusLabel(status);

      // Calculer les jours de retard ou mois d'avance
      const { daysLate, monthsAhead } = this.calculateLateness(monthlyDetails, totalReceived, monthlyRent, monthsOccupied, currentDate);

      console.log(`📊 Résultat: ${status} - Reçu: ${totalReceived}/${totalExpected} (${paymentRate.toFixed(1)}%)`);
    
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

    } catch (error) {
      console.error('❌ Erreur lors du calcul du statut de paiement:', error);
      return null;
    }
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
   * Calcule le nombre de mois dus dans une année spécifique
   * Tient compte de la date d'entrée et de la date actuelle
   */
  private calculateMonthsDueInYear(entryDate: Date, selectedYear: number): number {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
    const currentDate = new Date();

    // Déterminer la date de début effective dans l'année
    const effectiveStart = entryDate > yearStart ? entryDate : yearStart;

    // Déterminer la date de fin effective dans l'année
    const effectiveEnd = currentDate < yearEnd ? currentDate : yearEnd;

    if (effectiveStart > effectiveEnd) {
      return 0;
    }

    // Calculer le nombre de mois complets
    const startMonth = effectiveStart.getMonth();
    const startYear = effectiveStart.getFullYear();
    const endMonth = effectiveEnd.getMonth();
    const endYear = effectiveEnd.getFullYear();

    let monthsDue = 0;

    if (startYear === endYear) {
      // Même année
      monthsDue = endMonth - startMonth + 1;
    } else {
      // Années différentes (ne devrait pas arriver dans ce contexte)
      monthsDue = (12 - startMonth) + endMonth + 1;
    }

    // S'assurer que le résultat est positif et raisonnable
    monthsDue = Math.max(0, Math.min(monthsDue, 12));


    return monthsDue;
  }

  /**
   * Calcule les revenus réels à comptabiliser pour une année donnée
   * Tient compte des avances et de la répartition temporelle
   */
  private calculateActualRevenueForYear(
    totalReceivedAllTime: number,
    entryDate: Date,
    monthlyRent: number,
    selectedYear: number
  ): number {
    const monthsDue = this.calculateMonthsDueInYear(entryDate, selectedYear);
    const expectedForYear = monthlyRent * monthsDue;

    // Si le locataire a payé moins que ce qui est dû pour l'année
    if (totalReceivedAllTime <= expectedForYear) {
      return totalReceivedAllTime;
    }

    // Si le locataire a payé plus que ce qui est dû pour l'année (avance)
    // On comptabilise seulement ce qui correspond à l'année en cours
    return expectedForYear;
  }

  /**
   * Construit les détails mensuels en tenant compte de la date d'entrée
   */
  private buildMonthlyDetails(
    paymentStat: StatisticAllPaymentLocataireYearModel,
    entryDate: Date,
    selectedYear: number,
    monthlyRent: number
  ): MonthlyPaymentDetail[] {

    try {
      const monthlyDetails: MonthlyPaymentDetail[] = [];
      const currentDate = new Date();

      console.log(`📅 Construction des détails mensuels pour l'année ${selectedYear}`);

      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(selectedYear, month, 1);
        const entryMonthDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
        const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Un mois est dû s'il est après l'entrée ET avant/égal au mois actuel
        const isAfterEntry = monthDate >= entryMonthDate;
        const isBeforeCurrent = monthDate <= currentMonthDate;
        const isDue = isAfterEntry && isBeforeCurrent;

        // Chercher les données de paiement pour ce mois (attention: les mois peuvent être indexés différemment)
        const paymentData = paymentStat.paymentState?.find(p => {
          // Essayer différents formats de mois (0-based ou 1-based)
          return p.month === month || p.month === month + 1;
        });

        // Calculer le montant attendu
        let expected = 0;
        if (isDue) {
          expected = monthlyRent; // Utiliser le loyer mensuel fixe
        }

        // Calculer le montant reçu
        let received = 0;
        if (paymentData) {
          // Essayer différents champs pour le montant reçu
          received = paymentData.unitLocationPaymentPrice ||
                    paymentData.price ||
                    0;
        }

        // Déterminer le statut correct
        let status: StatisticPaymentStateType = StatisticPaymentStateType.NO_CONTRACT;
        if (isDue) {
          if (received >= expected) {
            status = StatisticPaymentStateType.PAYED;
          } else if (received > 0) {
            status = StatisticPaymentStateType.PARTIAL_PAYMENT;
          } else {
            status = StatisticPaymentStateType.LATE;
          }
        } else if (paymentData?.state) {
          status = paymentData.state;
        }
      
        // Calculer les jours de retard pour ce mois
        const daysLate = this.calculateDaysLate(month, status, selectedYear, currentDate);

        monthlyDetails.push({
          month: month + 1,
          monthName: this.getMonthName(month),
          year: selectedYear,
          expected: Math.round(expected * 100) / 100, // Arrondir à 2 décimales
          received: Math.round(received * 100) / 100,
          status,
          isDue,
          daysLate
        });
      }

      console.log(`✅ ${monthlyDetails.length} mois traités, ${monthlyDetails.filter(m => m.isDue).length} mois dus`);
      return monthlyDetails;

    } catch (error) {
      console.error('❌ Erreur lors de la construction des détails mensuels:', error);
      return [];
    }
  }

  /**
   * Détermine le statut correct basé sur la logique métier
   */
  private determineCorrectStatus(
    monthlyDetails: MonthlyPaymentDetail[],
    totalReceived: number,
    totalExpected: number,
    monthsOccupied: number,
    currentDate: Date
  ): TenantPaymentCalculation['status'] {

    try {
      // Vérifier les cas spéciaux
      const hasEndedContract = monthlyDetails.some(m => m.status === StatisticPaymentStateType.ENDED_CONTRACT);
      const hasNoContract = monthlyDetails.every(m => m.status === StatisticPaymentStateType.NO_CONTRACT);

      if (hasEndedContract) return 'ended_contract';
      if (hasNoContract) return 'no_contract';

      // Analyser seulement les mois dus
      const dueMonths = monthlyDetails.filter(m => m.isDue);

      if (dueMonths.length === 0) {
        return 'no_contract'; // Aucun mois dû
      }

      // Calculer les totaux pour les mois dus
      const totalDue = dueMonths.reduce((sum, m) => sum + m.expected, 0);
      const totalPaid = dueMonths.reduce((sum, m) => sum + m.received, 0);

      // Vérifier s'il y a des paiements en retard
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const hasLatePayments = dueMonths.some(m => {
        const monthDate = new Date(m.year, m.month - 1, 1);
        const isCurrentOrPast = monthDate <= new Date(currentYear, currentMonth, 1);
        return isCurrentOrPast && m.received < m.expected;
      });

      // Logique de détermination du statut
      if (totalPaid >= totalDue) {
        // Vérifie s'il y a des paiements d'avance
        if (totalPaid > totalDue) {
          return 'ahead';
        }
        return 'up_to_date';
      } else if (totalPaid > 0) {
        // Il y a des paiements mais pas complets
        if (hasLatePayments) {
          return 'late';
        }
        return 'partial';
      } else {
        // Aucun paiement
        return 'late';
      }

    } catch (error) {
      console.error('❌ Erreur lors de la détermination du statut:', error);
      return 'no_contract'; // Statut par défaut en cas d'erreur
    }
  }

  /**
   * Calcule les jours de retard ou mois d'avance
   */
  private calculateLateness(
    monthlyDetails: MonthlyPaymentDetail[],
    totalReceived: number,
    monthlyRent: number,
    monthsOccupied: number,
    currentDate: Date
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
  private calculateDaysLate(month: number, status: StatisticPaymentStateType, year: number, currentDate: Date): number | undefined {
    try {
      // Calculer les jours de retard seulement pour les paiements en retard ou non payés
      if (status === StatisticPaymentStateType.LATE ||
          status === StatisticPaymentStateType.UNPAYED ||
          (status === StatisticPaymentStateType.PARTIAL_PAYMENT)) {

        // Date d'échéance : le 5 de chaque mois (standard du marché)
        const dueDate = new Date(year, month, 5); // month est 0-based dans Date()

        // Vérifier si la date d'échéance est dépassée
        if (currentDate > dueDate) {
          const diffTime = currentDate.getTime() - dueDate.getTime();
          const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Retourner seulement si c'est vraiment en retard (plus de 0 jours)
          return daysLate > 0 ? daysLate : undefined;
        }
      }

      return undefined;

    } catch (error) {
      console.error('❌ Erreur lors du calcul des jours de retard:', error);
      return undefined;
    }
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

    console.log('🔢 REFONTE - Calcul des métriques financières pour l\'année', selectedYear);
    console.log('📊 Données reçues:', {
      yearlyStatsLength: yearlyStats?.length || 0,
      locationsLength: locations?.length || 0,
      selectedYear
    });

    if (!yearlyStats || yearlyStats.length === 0) {
      console.log('⚠️ Aucune donnée yearlyStats disponible');
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

    console.log('🏠 Analyse de', totalRooms, 'chambres pour l\'année', selectedYear);

    yearlyStats.forEach((roomStat, index) => {
      if (!roomStat.room) {
        console.log(`⚠️ Chambre ${index + 1}: Pas de données de chambre`);
        return;
      }

      const roomPrice = roomStat.room.price || 0;
      const roomCode = roomStat.room.code || `Room_${index + 1}`;
      const monthlyPayments = roomStat.paymentValue || [];
      const totalReceivedAllTime = monthlyPayments.reduce((sum: number, payment: number) => sum + (payment || 0), 0);

      console.log(`\n🏠 === ANALYSE CHAMBRE ${roomCode} ===`);
      console.log(`💰 Prix mensuel: ${roomPrice} FCFA`);
      console.log(`📊 Paiements mensuels:`, monthlyPayments);
      console.log(`💵 Total reçu (tous temps): ${totalReceivedAllTime} FCFA`);

      // Trouver la location correspondante pour cette chambre
      const roomLocation = locations.find(loc =>
        loc.room === roomStat.room._id && loc.isRunning === true
      );

      let expectedForYear = 0;
      let revenueForYear = 0;
      let isOccupied = false;

      if (roomLocation && roomLocation.startedAt) {
        isOccupied = true;
        const entryDate = new Date(roomLocation.startedAt);

        console.log(`📅 Date d'entrée: ${entryDate.toLocaleDateString()}`);
        console.log(`🗓️ Année analysée: ${selectedYear}`);

        // Calculer les mois dus dans l'année sélectionnée
        const monthsDueInYear = this.calculateMonthsDueInYear(entryDate, selectedYear);
        expectedForYear = roomPrice * monthsDueInYear;

        // Calculer les revenus réels pour cette année
        revenueForYear = this.calculateActualRevenueForYear(
          totalReceivedAllTime,
          entryDate,
          roomPrice,
          selectedYear
        );

        console.log(`📈 Mois dus dans l'année ${selectedYear}: ${monthsDueInYear}`);
        console.log(`💰 Attendu pour l'année: ${expectedForYear} FCFA`);
        console.log(`💵 Revenus comptabilisés pour l'année: ${revenueForYear} FCFA`);
        console.log(`✅ Chambre occupée: OUI`);

      } else {
        isOccupied = false;
        expectedForYear = 0;
        revenueForYear = 0;

        console.log(`❌ Chambre libre: AUCUNE LOCATION ACTIVE`);
      }

      // Ajouter aux totaux
      totalRevenue += revenueForYear;
      totalExpected += expectedForYear;
      totalRentSum += roomPrice;

      if (isOccupied) {
        occupiedRooms++;
      }

      console.log(`📊 Contribution aux totaux:`);
      console.log(`   - Revenus: +${revenueForYear} FCFA`);
      console.log(`   - Attendu: +${expectedForYear} FCFA`);
      console.log(`   - Occupée: ${isOccupied ? 'OUI' : 'NON'}`);
    });

    // Calculs finaux
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;
    const averageRent = totalRooms > 0 ? totalRentSum / totalRooms : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    console.log('\n🎯 === RÉSULTATS FINAUX ===');
    console.log(`💰 Revenus totaux pour ${selectedYear}: ${totalRevenue.toLocaleString()} FCFA`);
    console.log(`📈 Revenus attendus pour ${selectedYear}: ${totalExpected.toLocaleString()} FCFA`);
    console.log(`📊 Taux de recouvrement: ${collectionRate.toFixed(1)}%`);
    console.log(`🏠 Taux d'occupation: ${occupancyRate.toFixed(1)}% (${occupiedRooms}/${totalRooms} chambres)`);
    console.log(`💵 Loyer moyen: ${averageRent.toLocaleString()} FCFA`);

    // Vérifications de cohérence
    if (collectionRate > 200) {
      console.warn('⚠️ ATTENTION: Taux de recouvrement anormalement élevé (>200%)');
      console.warn('   Cela peut indiquer un problème dans le calcul des avances');
    }

    if (occupancyRate > 100) {
      console.warn('⚠️ ATTENTION: Taux d\'occupation > 100% (impossible)');
    }

    return {
      totalRevenue,
      totalExpected,
      collectionRate,
      averageRent,
      occupancyRate,
      occupiedRooms,
      totalRooms
    };
  }
}
