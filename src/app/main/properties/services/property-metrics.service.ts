import { Injectable } from '@angular/core';
import { PropertyModel, RoomModel, LocataireModel } from 'src/app/shared/store';

export interface PropertyMetrics {
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  maintenanceUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  averageRent: number;
  overduePayments: number;
}

export interface FinancialSummary {
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlyExpenses: number;
  managementFees: number;
  maintenanceCosts: number;
  insuranceCosts: number;
  netProfit: number;
  netProfitMargin: number;
  annualYield: number;
  propertyValue: number;
  securityDeposits: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyMetricsService {

  constructor() { }

  /**
   * Calcule les métriques principales d'une propriété
   */
  calculatePropertyMetrics(
    property: PropertyModel,
    units: any[],
    tenants: any[],
    payments: any[] = []
  ): PropertyMetrics {
    const totalUnits = units.length;
    const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
    const availableUnits = units.filter(unit => unit.status === 'available').length;
    const maintenanceUnits = units.filter(unit => unit.status === 'maintenance').length;
    
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    const monthlyRevenue = units
      .filter(unit => unit.status === 'occupied')
      .reduce((sum, unit) => sum + (unit.price || 0), 0);
    
    const yearlyRevenue = monthlyRevenue * 12;
    const averageRent = totalUnits > 0 ? monthlyRevenue / totalUnits : 0;
    
    // Calcul de la croissance basée sur l'historique des paiements
    const revenueGrowth = this.calculateRevenueGrowth(payments);
    
    // Simulation des paiements en retard (10% des locataires)
    const overduePayments = Math.floor(tenants.length * 0.1);

    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyRate,
      monthlyRevenue,
      yearlyRevenue,
      revenueGrowth,
      averageRent,
      overduePayments
    };
  }

  /**
   * Calcule le résumé financier détaillé
   */
  calculateFinancialSummary(metrics: PropertyMetrics): FinancialSummary {
    const { monthlyRevenue, totalUnits, occupiedUnits } = metrics;
    
    // Calculs des coûts
    const monthlyExpenses = totalUnits * 25000; // 25,000 XAF par unité
    const managementFees = monthlyRevenue * 0.05; // 5% des revenus
    const maintenanceCosts = (monthlyRevenue * 12 * 0.03) / 12; // 3% des revenus annuels
    const insuranceCosts = (monthlyRevenue * 12 * 0.01) / 12; // 1% des revenus annuels
    
    // Bénéfice net
    const netProfit = monthlyRevenue - monthlyExpenses - managementFees - maintenanceCosts - insuranceCosts;
    const netProfitMargin = monthlyRevenue > 0 ? Math.round((netProfit / monthlyRevenue) * 100) : 0;
    
    // Valeur de la propriété et rendement
    const propertyValue = netProfit * 12 * 15; // 15 ans de revenus nets
    const annualYield = propertyValue > 0 ? 
      Math.round(((netProfit * 12) / propertyValue) * 100 * 10) / 10 : 0;
    
    // Cautions (2 mois de loyer par unité occupée)
    const averageRent = totalUnits > 0 ? monthlyRevenue / totalUnits : 0;
    const securityDeposits = occupiedUnits * (averageRent * 2);

    return {
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
      monthlyExpenses,
      managementFees,
      maintenanceCosts,
      insuranceCosts,
      netProfit,
      netProfitMargin,
      annualYield,
      propertyValue,
      securityDeposits
    };
  }

  /**
   * Détermine le statut de performance d'une propriété
   */
  getPerformanceStatus(occupancyRate: number): {
    status: string;
    color: string;
    textColor: string;
  } {
    if (occupancyRate >= 95) {
      return { status: 'Excellente', color: 'green', textColor: 'text-green-600' };
    }
    if (occupancyRate >= 85) {
      return { status: 'Très bonne', color: 'blue', textColor: 'text-blue-600' };
    }
    if (occupancyRate >= 70) {
      return { status: 'Bonne', color: 'indigo', textColor: 'text-indigo-600' };
    }
    if (occupancyRate >= 50) {
      return { status: 'Moyenne', color: 'yellow', textColor: 'text-yellow-600' };
    }
    return { status: 'À améliorer', color: 'red', textColor: 'text-red-600' };
  }

  /**
   * Détermine le type de propriété basé sur le nombre d'unités
   */
  getPropertyType(totalUnits: number): string {
    if (!totalUnits) return 'Non spécifié';
    if (totalUnits === 1) return 'Maison individuelle';
    if (totalUnits <= 4) return 'Petit immeuble';
    if (totalUnits <= 10) return 'Immeuble résidentiel';
    return 'Grand complexe';
  }

  /**
   * Calcule l'âge de la propriété
   */
  getPropertyAge(createdAt: Date | string): string {
    if (!createdAt) return 'Non spécifié';
    
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} ans`;
  }

  /**
   * Génère l'historique des revenus pour les graphiques
   */
  generateRevenueHistory(monthlyRevenue: number): { month: string; amount: number }[] {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    return months.map(month => ({
      month,
      amount: monthlyRevenue + (Math.random() - 0.5) * monthlyRevenue * 0.1 // Variation de ±5%
    }));
  }

  /**
   * Calcule la croissance des revenus basée sur l'historique
   */
  private calculateRevenueGrowth(payments: any[]): number {
    if (payments.length === 0) return 0;
    
    const recentPayments = payments.filter(p => p.type === 'payment').length;
    if (recentPayments > 5) return 12;
    if (recentPayments > 2) return 8;
    return 3;
  }

  /**
   * Calcule les dates importantes
   */
  getImportantDates(): {
    nextPaymentDate: Date;
    lastInspectionDate: Date;
    nextMaintenanceDate: Date;
  } {
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(1);

    const lastInspectionDate = new Date();
    lastInspectionDate.setMonth(lastInspectionDate.getMonth() - 3);

    const nextMaintenanceDate = new Date();
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 2);

    return {
      nextPaymentDate,
      lastInspectionDate,
      nextMaintenanceDate
    };
  }
}
