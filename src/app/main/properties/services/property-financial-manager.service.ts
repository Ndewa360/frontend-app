import { Injectable } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  LocationModel,
  StatisticPaymentStateType
} from '../../../shared/store';

/**
 * Interface pour les métriques financières d'une propriété
 */
export interface PropertyFinancialMetrics {
  // Métriques principales
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  averageRent: number;
  occupancyRate: number;
  
  // Détails des unités
  totalRooms: number;
  occupiedRooms: number;
  freeRooms: number;
  
  // Détails temporels
  selectedYear: number;
  currentMonth: number;
  monthsAnalyzed: number;
  
  // Détails par chambre
  roomDetails: RoomFinancialDetail[];
}

/**
 * Interface pour les détails financiers d'une chambre
 */
export interface RoomFinancialDetail {
  roomId: string;
  roomCode: string;
  monthlyRent: number;
  isOccupied: boolean;
  
  // Informations locataire
  tenantName?: string;
  entryDate?: Date;
  
  // Calculs pour l'année
  monthsDueInYear: number;
  expectedForYear: number;
  receivedForYear: number;
  collectionRate: number;
  advanceAmount?: number; // Nouveau : montant d'avance
  
  // Statut
  status: 'occupied' | 'free' | 'pending';
  paymentStatus: 'up_to_date' | 'late' | 'advance' | 'no_payment';
  
  // Détails mensuels
  monthlyDistribution?: number[]; // Nouveau : répartition mensuelle
}

/**
 * Interface pour les données mensuelles
 */
export interface MonthlyFinancialData {
  month: number;
  monthName: string;
  expected: number;
  received: number;
  collectionRate: number;
  occupiedRooms: number;
}

/**
 * Service centralisé pour la gestion financière des propriétés
 * Gère tous les calculs financiers en tenant compte des dates d'entrée, 
 * de l'année sélectionnée et du mois courant
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyFinancialManagerService {

  private readonly MONTHS_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor() {}

  /**
   * Calcule toutes les métriques financières pour une propriété
   */
  calculatePropertyMetrics(
    propertyId: string,
    selectedYear: number,
    yearlyStats: StatisticRoomYearModel[],
    locations: LocationModel[],
    paymentStats?: StatisticAllPaymentLocataireYearModel[]
  ): PropertyFinancialMetrics {
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filtrer les données pour cette propriété
    const propertyRooms = yearlyStats.filter(stat => 
      stat.room?.property === propertyId
    );
    
    const propertyLocations = locations.filter(loc => 
      loc.property === propertyId && loc.isRunning === true
    );
    
    // ⚠️ DIAGNOSTIC CRITIQUE: Vérifier les données manquantes
    console.warn(`🔍 DONNÉES PROPRIÉTÉ ${propertyId}:`, {
      chambresDetectees: propertyRooms.length,
      locationsActives: propertyLocations.length,
      annee: selectedYear
    });

    // Calculer les détails par chambre avec répartition mensuelle
    const roomDetails = this.calculateRoomDetails(
      propertyRooms, 
      propertyLocations, 
      selectedYear,
      currentMonth,
      currentYear
    );
    
    // Ajouter la répartition mensuelle pour chaque chambre
    roomDetails.forEach(room => {
      if (room.isOccupied && room.entryDate) {
        room.monthlyDistribution = this.distributeRevenueAcrossMonths(
          room.receivedForYear,
          room.entryDate,
          room.monthlyRent,
          selectedYear,
          new Date(currentYear, currentMonth, new Date().getDate())
        );
      }
    });

    // Calculer les métriques globales
    const metrics = this.calculateGlobalMetrics(roomDetails, selectedYear);

    return metrics;
  }

  /**
   * Calcule les détails financiers pour chaque chambre
   */
  private calculateRoomDetails(
    rooms: StatisticRoomYearModel[],
    locations: LocationModel[],
    selectedYear: number,
    currentMonth: number,
    currentYear: number
  ): RoomFinancialDetail[] {
    
    
    
    return rooms.map((roomStat, index) => {
      const room = roomStat.room;
      if (!room) {
        return this.createEmptyRoomDetail(`room_${index}`, 0);
      }

      const roomCode = room.code || `Room_${index + 1}`;
      const monthlyRent = room.price || 0;
      
      // Trouver la location active pour cette chambre
      const activeLocation = locations.find(loc => 
        loc.room === room._id && 
        loc.isRunning === true
      );
      
      if (!activeLocation) {
        return this.createEmptyRoomDetail(room._id, monthlyRent, roomCode);
      }
      
      // Calculer les métriques pour cette chambre occupée
      return this.calculateOccupiedRoomMetrics(
        room._id,
        roomCode,
        monthlyRent,
        activeLocation,
        roomStat.paymentValue || [],
        selectedYear,
        currentMonth,
        currentYear
      );
    });
  }

  /**
   * Crée un détail vide pour une chambre libre
   */
  private createEmptyRoomDetail(
    roomId: string, 
    monthlyRent: number, 
    roomCode?: string
  ): RoomFinancialDetail {
    return {
      roomId,
      roomCode: roomCode || 'N/A',
      monthlyRent,
      isOccupied: false,
      monthsDueInYear: 0,
      expectedForYear: 0,
      receivedForYear: 0,
      collectionRate: 0,
      status: 'free',
      paymentStatus: 'no_payment'
    };
  }

  /**
   * Calcule les métriques pour une chambre occupée avec logique corrigée
   */
  private calculateOccupiedRoomMetrics(
    roomId: string,
    roomCode: string,
    monthlyRent: number,
    location: LocationModel,
    paymentValues: number[],
    selectedYear: number,
    currentMonth: number,
    currentYear: number
  ): RoomFinancialDetail {
    
    const entryDate = new Date(location.startedAt);
    const currentDate = new Date(currentYear, currentMonth, new Date().getDate());
    const totalReceivedAllTime = paymentValues.reduce((sum, payment) => sum + (payment || 0), 0);
    console.log("PaymentValues ",paymentValues)
    // Calculer avec la nouvelle logique
    const revenueCalculation = this.calculateRevenueForYear(
      totalReceivedAllTime,
      entryDate,
      monthlyRent,
      selectedYear,
      currentDate
    );
    
    const expectedForYear = monthlyRent * revenueCalculation.monthsDue;
    const collectionRate = expectedForYear > 0 ? (revenueCalculation.revenueForYear / expectedForYear) * 100 : 0;
    
    return {
      roomId,
      roomCode,
      monthlyRent,
      isOccupied: true,
      tenantName: location.locataire?.toString() || 'N/A',
      entryDate,
      monthsDueInYear: revenueCalculation.monthsDue,
      expectedForYear,
      receivedForYear: revenueCalculation.revenueForYear,
      collectionRate,
      status: 'occupied',
      paymentStatus: this.determinePaymentStatus(collectionRate, revenueCalculation.isAdvancePayment)
    };
  }

  /**
   * Calcule précisément le nombre de mois dus dans une année
   */
  private calculatePreciseMonthsDue(
    entryDate: Date,
    selectedYear: number,
    currentDate: Date
  ): number {
    // ⚠️ DIAGNOSTIC: Vérifier les dates futures
    if (entryDate > currentDate) {
      console.warn(`⚠️ DATE FUTURE DÉTECTÉE: ${entryDate.toLocaleDateString()} > ${currentDate.toLocaleDateString()}`);
    }
    
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
    
    // CORRECTION: Si date d'entrée est future, retourner 0
    if (entryDate > currentDate) {
      return 0;
    }
    
    // CORRECTION: Si entrée après la fin de l'année sélectionnée, retourner 0
    if (entryDate > yearEnd) {
      return 0;
    }
    
    // Bornes effectives
    const effectiveStart = entryDate > yearStart ? entryDate : yearStart;
    const effectiveEnd = currentDate < yearEnd ? currentDate : yearEnd;
    
    if (effectiveStart > effectiveEnd) {
      return 0;
    }
    
    // Calcul précis avec jours
    const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Convertir en mois (30.44 jours par mois en moyenne)
    const monthsDue = diffDays / 30.44;
    const roundedMonths = Math.ceil(monthsDue);
    
    const finalMonths = Math.max(0, Math.min(roundedMonths, 12));
    
    return finalMonths;
  }

  /**
   * Calcule les revenus à comptabiliser pour une année avec gestion correcte des avances
   */
  private calculateRevenueForYear(
    totalReceived: number,
    entryDate: Date,
    monthlyRent: number,
    selectedYear: number,
    currentDate: Date
  ): {
    revenueForYear: number;
    advanceAmount: number;
    monthsDue: number;
    isAdvancePayment: boolean;
  } {
    const monthsDue = this.calculatePreciseMonthsDue(entryDate, selectedYear, currentDate);
    const expectedForYear = monthlyRent * monthsDue;
    
    if (totalReceived <= expectedForYear) {
      return {
        revenueForYear: totalReceived,
        advanceAmount: 0,
        monthsDue,
        isAdvancePayment: false
      };
    }
    
    // Gérer les avances : comptabiliser tout mais marquer l'avance
    const advanceAmount = totalReceived - expectedForYear;
    return {
      revenueForYear: totalReceived, // Comptabiliser tout pour l'année
      advanceAmount,
      monthsDue,
      isAdvancePayment: true
    };
  }

  /**
   * Détermine le statut de paiement avec logique améliorée
   */
  private determinePaymentStatus(
    collectionRate: number, 
    isAdvancePayment: boolean = false
  ): RoomFinancialDetail['paymentStatus'] {
    if (collectionRate === 0) return 'no_payment';
    
    if (isAdvancePayment || collectionRate > 110) {
      return 'advance'; // Nouveau statut pour les avances
    }
    
    if (collectionRate >= 95) return 'up_to_date'; // Tolérance de 5%
    if (collectionRate >= 50) return 'late';
    
    return 'no_payment';
  }

  /**
   * Calcule les métriques globales à partir des détails des chambres
   */
  private calculateGlobalMetrics(
    roomDetails: RoomFinancialDetail[],
    selectedYear: number
  ): PropertyFinancialMetrics {
    
    const totalRooms = roomDetails.length;
    const occupiedRooms = roomDetails.filter(room => room.isOccupied).length;
    const freeRooms = totalRooms - occupiedRooms;
    
    // ⚠️ ALERTE si le taux semble incorrect
    if (totalRooms === 1 && occupiedRooms === 1) {
      console.warn(`⚠️ ATTENTION: Taux d'occupation 100% avec seulement 1 chambre détectée`);
      console.warn(`🔍 Vérifier si toutes les chambres de la propriété sont incluses dans yearlyStats`);
    }
    
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    // Nouveau calcul du taux de recouvrement : seulement sur les chambres occupées
    const occupiedRoomsDetails = roomDetails.filter(room => room.isOccupied);
    const expectedFromOccupiedRooms = occupiedRoomsDetails.reduce((sum, room) => sum + room.expectedForYear, 0);
    const revenueFromOccupiedRooms = occupiedRoomsDetails.reduce((sum, room) => sum + room.receivedForYear, 0);
    
    const collectionRate = expectedFromOccupiedRooms > 0 ? 
      (revenueFromOccupiedRooms / expectedFromOccupiedRooms) * 100 : 0;
    
    if (collectionRate > 200) {
      console.warn(`⚠️ Taux de recouvrement anormalement élevé (${collectionRate.toFixed(1)}%) - probablement dû à une avance importante`);
    }
    
    // Calcul du loyer moyen (seulement les chambres avec un loyer > 0)
    const roomsWithRent = roomDetails.filter(room => room.monthlyRent > 0);
    const totalRentSum = roomsWithRent.reduce((sum, room) => sum + room.monthlyRent, 0);
    const averageRent = roomsWithRent.length > 0 ? totalRentSum / roomsWithRent.length : 0;
    
    const metrics = {
      totalRevenue: revenueFromOccupiedRooms, // Utiliser seulement les revenus des chambres occupées
      totalExpected: expectedFromOccupiedRooms, // Utiliser seulement l'attendu des chambres occupées
      collectionRate: Math.min(collectionRate, 200), // Limiter à 200% pour l'affichage
      averageRent,
      occupancyRate,
      totalRooms,
      occupiedRooms,
      freeRooms,
      selectedYear,
      currentMonth: new Date().getMonth(),
      monthsAnalyzed: this.calculateMonthsAnalyzed(selectedYear),
      roomDetails
    };
    
    return metrics;
  }

  /**
   * Calcule le nombre de mois analysés dans l'année
   */
  private calculateMonthsAnalyzed(selectedYear: number): number {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (selectedYear < currentYear) {
      return 12; // Année complète
    } else if (selectedYear === currentYear) {
      return currentDate.getMonth() + 1; // Jusqu'au mois actuel
    } else {
      return 0; // Année future
    }
  }

  /**
   * Génère les données mensuelles pour les graphiques
   * @param selectedYear L'année sélectionnée
   * @param roomDetails Les détails des chambres
   */
  generateMonthlyData(
    selectedYear: number,
    roomDetails: RoomFinancialDetail[]
  ): MonthlyFinancialData[] {

    const monthlyData: MonthlyFinancialData[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Déterminer jusqu'à quel mois analyser
    const maxMonth = selectedYear === currentYear ? currentMonth : 11;

    for (let month = 0; month <= maxMonth; month++) {
      const monthData = this.calculateMonthData(
        month,
        selectedYear,
        roomDetails,
        currentYear,
        currentMonth
      );
      monthlyData.push(monthData);
    }

    return monthlyData;
  }

  /**
   * Calcule les données pour un mois spécifique avec répartition correcte
   */
  private calculateMonthData(
    month: number,
    selectedYear: number,
    roomDetails: RoomFinancialDetail[],
    currentYear: number,
    currentMonth: number
  ): MonthlyFinancialData {

    let expected = 0;
    let received = 0;
    let occupiedRooms = 0;

    roomDetails.forEach(room => {
      if (!room.isOccupied || !room.entryDate) return;

      const entryDate = new Date(room.entryDate);
      const entryMonth = entryDate.getMonth();
      const entryYear = entryDate.getFullYear();

      // Vérifier si la chambre était occupée ce mois-là
      const wasOccupiedThisMonth = (
        (entryYear < selectedYear) ||
        (entryYear === selectedYear && entryMonth <= month)
      );

      if (wasOccupiedThisMonth) {
        expected += room.monthlyRent;
        occupiedRooms++;

        // NOUVELLE LOGIQUE : Répartir le montant total reçu sur les mois d'occupation
        const monthlyShare = this.calculateMonthlyShare(
          room,
          month,
          selectedYear,
          currentYear,
          currentMonth
        );

        received += monthlyShare;
      }
    });

    const collectionRate = expected > 0 ? (received / expected) * 100 : 0;

    return {
      month,
      monthName: this.MONTHS_NAMES[month],
      expected,
      received,
      collectionRate,
      occupiedRooms
    };
  }

  /**
   * Calcule la répartition mensuelle correcte des revenus
   */
  private calculateMonthlyShare(
    room: RoomFinancialDetail,
    month: number,
    selectedYear: number,
    currentYear: number,
    currentMonth: number
  ): number {

    if (!room.entryDate || !room.isOccupied) return 0;

    const entryDate = new Date(room.entryDate);
    const monthDate = new Date(selectedYear, month, 1);
    const entryMonthDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const currentMonthDate = new Date(currentYear, currentMonth, 1);

    // Vérifier si ce mois est dans la période d'occupation
    const isAfterEntry = monthDate >= entryMonthDate;
    const isBeforeCurrent = monthDate <= currentMonthDate;
    const isOccupiedThisMonth = isAfterEntry && isBeforeCurrent;

    if (!isOccupiedThisMonth) return 0;

    // Utiliser la répartition mensuelle si disponible
    if (room.monthlyDistribution && room.monthlyDistribution[month]) {
      return room.monthlyDistribution[month];
    }

    // Fallback : répartition égale sur les mois d'occupation
    const occupiedMonths = room.monthsDueInYear;
    return occupiedMonths > 0 ? room.receivedForYear / occupiedMonths : 0;
  }

  /**
   * Génère les données pour les graphiques de revenus
   */
  generateRevenueChartData(monthlyData: MonthlyFinancialData[]): {
    months: string[];
    revenues: number[];
    expected: number[];
  } {
    return {
      months: monthlyData.map(m => m.monthName.substring(0, 3)),
      revenues: monthlyData.map(m => m.received),
      expected: monthlyData.map(m => m.expected)
    };
  }

  /**
   * Génère les données pour les graphiques de statuts de paiement
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
      no_payment: 0,
      free: 0
    };

    roomDetails.forEach(room => {
      if (!room.isOccupied) {
        statusCounts.free++;
      } else {
        statusCounts[room.paymentStatus]++;
      }
    });

    return [
      { name: 'À jour', value: statusCounts.up_to_date, color: '#10B981' },
      { name: 'En retard', value: statusCounts.late, color: '#F59E0B' },
      { name: 'En avance', value: statusCounts.advance, color: '#3B82F6' },
      { name: 'Aucun paiement', value: statusCounts.no_payment, color: '#EF4444' },
      { name: 'Libre', value: statusCounts.free, color: '#6B7280' }
    ].filter(item => item.value > 0);
  }

  /**
   * Distribue les revenus sur les mois d'occupation
   */
  private distributeRevenueAcrossMonths(
    totalRevenue: number,
    entryDate: Date,
    monthlyRent: number,
    selectedYear: number,
    currentDate: Date
  ): number[] {
    const monthlyDistribution = new Array(12).fill(0);
    
    if (totalRevenue === 0) return monthlyDistribution;
    
    const monthsDue = this.calculatePreciseMonthsDue(entryDate, selectedYear, currentDate);
    if (monthsDue === 0) return monthlyDistribution;
    
    const monthlyShare = totalRevenue / monthsDue;
    
    // Répartir sur les mois d'occupation
    const entryMonth = entryDate.getMonth();
    const entryYear = entryDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(selectedYear, month, 1);
      const entryMonthDate = new Date(entryYear, entryMonth, 1);
      const currentMonthDate = new Date(currentYear, currentMonth, 1);
      
      const isAfterEntry = monthDate >= entryMonthDate;
      const isBeforeCurrent = monthDate <= currentMonthDate;
      
      if (isAfterEntry && isBeforeCurrent) {
        monthlyDistribution[month] = monthlyShare;
      }
    }
    
    return monthlyDistribution;
  }

  /**
   * Valide les calculs financiers et détecte les incohérences
   */
  validateFinancialCalculations(metrics: PropertyFinancialMetrics): {
    isValid: boolean;
    warnings: string[];
    corrections: Partial<PropertyFinancialMetrics>;
  } {
    const warnings: string[] = [];
    const corrections: Partial<PropertyFinancialMetrics> = {};
    
    // Vérifier les taux anormaux
    if (metrics.collectionRate > 200) {
      warnings.push('Taux de recouvrement anormalement élevé - vérifier les avances');
      corrections.collectionRate = Math.min(metrics.collectionRate, 200);
    }
    
    // Vérifier la cohérence des dates
    if (metrics.roomDetails.some(r => r.monthsDueInYear > 12)) {
      warnings.push('Nombre de mois dus supérieur à 12 - erreur de calcul');
    }
    
    // Vérifier les revenus négatifs
    if (metrics.totalRevenue < 0) {
      warnings.push('Revenus négatifs détectés');
      corrections.totalRevenue = 0;
    }
    
    // Vérifier l'occupation
    if (metrics.occupancyRate > 100) {
      warnings.push('Taux d\'occupation supérieur à 100%');
      corrections.occupancyRate = 100;
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
      corrections
    };
  }

  /**
   * Calcule les changements par rapport à une référence
   */
  calculateMetricChanges(metrics: PropertyFinancialMetrics): {
    revenueChange: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    collectionRateChange: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    occupancyRateChange: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    averageRentChange: { value: number; type: 'increase' | 'decrease' | 'neutral' };
  } {

    // Références standards
    const referenceCollectionRate = 85; // 85% est considéré comme bon
    const referenceOccupancyRate = 90; // 90% est considéré comme excellent

    // Calcul des écarts
    const revenueVsExpected = metrics.totalExpected > 0 ?
      ((metrics.totalRevenue - metrics.totalExpected) / metrics.totalExpected) * 100 : 0;

    const collectionRateDiff = metrics.collectionRate - referenceCollectionRate;
    const occupancyRateDiff = metrics.occupancyRate - referenceOccupancyRate;

    // Calcul de la variation du loyer moyen par rapport à la médiane
    const rents = metrics.roomDetails.map(r => r.monthlyRent).filter(r => r > 0);
    rents.sort((a, b) => a - b);
    const medianRent = rents.length > 0 ?
      (rents.length % 2 === 0 ?
        (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2 :
        rents[Math.floor(rents.length / 2)]) : 0;

    const averageRentDiff = medianRent > 0 ?
      ((metrics.averageRent - medianRent) / medianRent) * 100 : 0;

    return {
      revenueChange: {
        value: Math.abs(revenueVsExpected),
        type: revenueVsExpected > 0 ? 'increase' : revenueVsExpected < 0 ? 'decrease' : 'neutral'
      },
      collectionRateChange: {
        value: Math.abs(collectionRateDiff),
        type: collectionRateDiff > 0 ? 'increase' : collectionRateDiff < 0 ? 'decrease' : 'neutral'
      },
      occupancyRateChange: {
        value: Math.abs(occupancyRateDiff),
        type: occupancyRateDiff > 0 ? 'increase' : occupancyRateDiff < 0 ? 'decrease' : 'neutral'
      },
      averageRentChange: {
        value: Math.abs(averageRentDiff),
        type: averageRentDiff > 0 ? 'increase' : averageRentDiff < 0 ? 'decrease' : 'neutral'
      }
    };
  }
}
