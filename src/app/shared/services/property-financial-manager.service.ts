import { Injectable } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  LocationModel,
  StatisticPaymentStateType
} from '../store';

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
  
  // Statut
  status: 'occupied' | 'free' | 'pending';
  paymentStatus: 'up_to_date' | 'late' | 'advance' | 'no_payment';
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
    
    console.log(`🏢 === CALCUL FINANCIER PROPRIÉTÉ ${propertyId} - ANNÉE ${selectedYear} ===`);
    
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
    
    console.log(`📊 Données filtrées:`, {
      totalRooms: propertyRooms.length,
      activeLocations: propertyLocations.length,
      selectedYear,
      currentMonth: currentMonth + 1,
      currentYear
    });

    // Calculer les détails par chambre
    const roomDetails = this.calculateRoomDetails(
      propertyRooms, 
      propertyLocations, 
      selectedYear,
      currentMonth,
      currentYear
    );

    // Calculer les métriques globales
    const metrics = this.calculateGlobalMetrics(roomDetails, selectedYear);

    console.log(`✅ Métriques calculées pour la propriété ${propertyId}:`, {
      totalRevenue: metrics.totalRevenue.toLocaleString(),
      totalExpected: metrics.totalExpected.toLocaleString(),
      collectionRate: `${metrics.collectionRate.toFixed(1)}%`,
      occupancyRate: `${metrics.occupancyRate.toFixed(1)}%`,
      occupiedRooms: `${metrics.occupiedRooms}/${metrics.totalRooms}`
    });

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
        console.warn(`⚠️ Chambre ${index + 1}: Données manquantes`);
        return this.createEmptyRoomDetail(`room_${index}`, 0);
      }

      const roomCode = room.code || `Room_${index + 1}`;
      const monthlyRent = room.price || 0;
      
      console.log(`\n🏠 Analyse chambre: ${roomCode}`);
      
      // Trouver la location active pour cette chambre
      const activeLocation = locations.find(loc => loc.room === room._id);
      
      if (!activeLocation) {
        console.log(`   ❌ Aucune location active`);
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
   * Calcule les métriques pour une chambre occupée
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
    const totalReceivedAllTime = paymentValues.reduce((sum, payment) => sum + (payment || 0), 0);
    
    console.log(`   📅 Date d'entrée: ${entryDate.toLocaleDateString()}`);
    console.log(`   💰 Loyer mensuel: ${monthlyRent.toLocaleString()} FCFA`);
    console.log(`   💵 Total reçu: ${totalReceivedAllTime.toLocaleString()} FCFA`);
    
    // Calculer les mois dus dans l'année sélectionnée
    const monthsDueInYear = this.calculateMonthsDueInYear(
      entryDate, 
      selectedYear, 
      currentMonth, 
      currentYear
    );
    
    const expectedForYear = monthlyRent * monthsDueInYear;
    
    // Calculer les revenus à comptabiliser pour cette année
    const receivedForYear = this.calculateRevenueForYear(
      totalReceivedAllTime,
      expectedForYear
    );
    
    const collectionRate = expectedForYear > 0 ? (receivedForYear / expectedForYear) * 100 : 0;
    
    console.log(`   📊 Résultats:`);
    console.log(`      - Mois dus: ${monthsDueInYear}`);
    console.log(`      - Attendu: ${expectedForYear.toLocaleString()} FCFA`);
    console.log(`      - Comptabilisé: ${receivedForYear.toLocaleString()} FCFA`);
    console.log(`      - Taux: ${collectionRate.toFixed(1)}%`);
    
    return {
      roomId,
      roomCode,
      monthlyRent,
      isOccupied: true,
      tenantName: location.locataire?.toString() || 'N/A',
      entryDate,
      monthsDueInYear,
      expectedForYear,
      receivedForYear,
      collectionRate,
      status: 'occupied',
      paymentStatus: this.determinePaymentStatus(collectionRate)
    };
  }

  /**
   * Calcule le nombre de mois dus dans une année donnée
   */
  private calculateMonthsDueInYear(
    entryDate: Date,
    selectedYear: number,
    currentMonth: number,
    currentYear: number
  ): number {
    
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);
    const today = new Date(currentYear, currentMonth, new Date().getDate());
    
    // Déterminer les bornes effectives
    const effectiveStart = entryDate > yearStart ? entryDate : yearStart;
    const effectiveEnd = today < yearEnd ? today : yearEnd;
    
    if (effectiveStart > effectiveEnd) {
      return 0;
    }
    
    // Calculer les mois complets
    const startMonth = effectiveStart.getMonth();
    const endMonth = effectiveEnd.getMonth();
    const startYear = effectiveStart.getFullYear();
    const endYear = effectiveEnd.getFullYear();
    
    if (startYear === endYear) {
      return Math.max(0, endMonth - startMonth + 1);
    } else {
      // Cas où on traverse plusieurs années (rare dans ce contexte)
      return Math.max(0, (12 - startMonth) + endMonth + 1);
    }
  }

  /**
   * Calcule les revenus à comptabiliser pour une année
   * NOUVELLE LOGIQUE : Répartir intelligemment les avances
   */
  private calculateRevenueForYear(
    totalReceived: number,
    expectedForYear: number
  ): number {

    // Si le locataire a payé moins que l'attendu, comptabiliser tout
    if (totalReceived <= expectedForYear) {
      return totalReceived;
    }

    // Si le locataire a payé plus (avance)
    // Exemple: 175 000 FCFA reçus, 75 000 FCFA attendus pour l'année
    // On comptabilise les 75 000 FCFA pour cette année

    return expectedForYear;
  }

  /**
   * Détermine le statut de paiement basé sur le taux de recouvrement
   */
  private determinePaymentStatus(collectionRate: number): RoomFinancialDetail['paymentStatus'] {
    if (collectionRate >= 100) return 'up_to_date';
    if (collectionRate >= 80) return 'late';
    if (collectionRate > 0) return 'late';
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
    
    const totalRevenue = roomDetails.reduce((sum, room) => sum + room.receivedForYear, 0);
    const totalExpected = roomDetails.reduce((sum, room) => sum + room.expectedForYear, 0);
    const totalRentSum = roomDetails.reduce((sum, room) => sum + room.monthlyRent, 0);
    
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;
    const averageRent = totalRooms > 0 ? totalRentSum / totalRooms : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpected,
      collectionRate,
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

    console.log(`📅 Génération des données mensuelles pour ${selectedYear}`);

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

    console.log(`📊 Données mensuelles générées:`, monthlyData.map(m => ({
      month: m.monthName,
      expected: m.expected,
      received: m.received,
      rate: `${m.collectionRate.toFixed(1)}%`
    })));

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
   * Calcule la part mensuelle d'une chambre en répartissant le montant total
   */
  private calculateMonthlyShare(
    room: RoomFinancialDetail,
    month: number,
    selectedYear: number,
    currentYear: number,
    currentMonth: number
  ): number {

    if (!room.entryDate) return 0;

    const entryDate = new Date(room.entryDate);
    const entryMonth = entryDate.getMonth();
    const entryYear = entryDate.getFullYear();

    // Calculer les mois d'occupation dans l'année sélectionnée
    let occupationStartMonth = 0;
    let occupationEndMonth = 11;

    if (entryYear === selectedYear) {
      occupationStartMonth = entryMonth;
    }

    if (selectedYear === currentYear) {
      occupationEndMonth = currentMonth;
    }

    const totalOccupationMonths = occupationEndMonth - occupationStartMonth + 1;

    // Si ce mois est dans la période d'occupation, répartir le montant
    if (month >= occupationStartMonth && month <= occupationEndMonth && totalOccupationMonths > 0) {
      const monthlyShare = room.receivedForYear / totalOccupationMonths;
      return monthlyShare;
    }

    return 0;
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
