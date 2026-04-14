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
    payments: any[] = [],
    history:any=[]
  ): PropertyMetrics { //OK
    

    const totalUnits = units?.length || property?.roomLength || 0;
    const occupiedUnits = units?.filter(unit => !unit.isFree).length || 0;
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const monthlyRevenue = units?.reduce((total, unit) => {
      return total + (!unit.isFree ? (unit.price || 0) : 0);
    }, 0) || 0;

    const averageRent = occupiedUnits > 0 ? monthlyRevenue / occupiedUnits : 0;

    const yearlyRevenue = monthlyRevenue * 12;


    // Calculer les unités en maintenance basées sur les données réelles
    const maintenanceUnits = history ? history.filter(item =>
      item.type === 'maintenance' &&
      new Date(item.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Maintenance dans les 30 derniers jours
    ).length : 0;

    // Calcul de la croissance basée sur l'historique des paiements
    const revenueGrowth = this.getRevenueGrowth(payments);

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
      overduePayments:this.getOverduePayments(history)
    };
  }

  getOverduePayments(history:any[]=[]): number {
    // Calculer les paiements en retard basés sur l'historique réel
    if (!history || history.length === 0) {
      return 0; // Pas d'historique disponible
    }

    // Comme HistoryItem n'a pas de propriété status, on ne peut pas déterminer les retards
    // Cette fonctionnalité nécessiterait une extension du modèle HistoryItem
    return 0; // Pas de données de retard disponibles pour l'instant
  }

  getSecurityDeposits(tenants:any[]=[],units:any[]=[]): number {
    // Calculer les cautions réelles basées sur les locataires actuels
    if (!tenants || tenants.length === 0) {
      return 0; // Pas de locataires, donc pas de cautions
    }

    // Calculer les cautions basées sur les unités occupées
    // Comme LocataireModel n'a pas de propriété caution, on estime basé sur les loyers
    return tenants.reduce((total, tenant) => {
      // Estimer basé sur l'unité occupée (2 mois de loyer standard)
      const unit = units.find(u => u._id === tenant.room);
      if (unit && unit.price) {
        return total + (unit.price * 2); // Estimation : 2 mois de loyer
      }

      return total;
    }, 0);
  }

  getMonthlyExpenses(property:PropertyModel): number {
    // Calculer les dépenses réelles basées sur les données de la propriété
    if (!property) return 0;

    const monthlyExpenses =
      (property.propertyTax || 0) / 12 + // Taxe foncière mensuelle
      (property.insuranceCost || 0) / 12 + // Assurance mensuelle
      (property.managementFees || 0); // Frais de gestion mensuels
      // Note: maintenanceCost n'existe pas dans PropertyModel

    return monthlyExpenses;
  }

  getManagementFees(property:PropertyModel): number {
    // Utiliser les frais de gestion réels de la propriété
    return property?.managementFees || 0;
  }

  getMaintenanceCosts(property:PropertyModel): number {
    // PropertyModel n'a pas de propriété maintenanceCost
    // Retourner 0 car pas de données de maintenance disponibles
    return 0;
  }

  getInsuranceCosts(property:PropertyModel): number {
    return (property?.insuranceCost || 0) / 12;
  }

  getNetProfit(metrics, property: PropertyModel): number {
    const revenue = metrics?.monthlyRevenue || 0;
    // getMonthlyExpenses inclut déjà insuranceCost/12 — ne pas rajouter getInsuranceCosts()
    const expenses = this.getMonthlyExpenses(property)
                   + this.getManagementFees(property)
                   + this.getMaintenanceCosts(property);
    return revenue - expenses;
  }


  getNetProfitMargin(metrics,property:PropertyModel): number {
    const revenue = metrics?.monthlyRevenue || 0;
    if (revenue === 0) return 0;
    return Math.round((this.getNetProfit(metrics,property) / revenue) * 100);
  }

  getAnnualYield(metrics, property: PropertyModel): number {
    const propertyValue = this.getPropertyValue(metrics, property);
    // Rendement uniquement calculable si la valeur du bien est connue
    if (propertyValue === 0) return 0;
    const annualRevenue = (metrics?.monthlyRevenue || 0) * 12;
    return Math.round((annualRevenue / propertyValue) * 100 * 10) / 10;
  }

  getPropertyValue(metrics, property: PropertyModel): number {
    if (property?.currentValue) return property.currentValue;
    if (property?.acquisitionPrice) return property.acquisitionPrice;
    // Pas de valeur immobilière renseignée — retourne 0 pour éviter un rendement fictif
    return 0;
  }

  /**
   * Calcule le résumé financier détaillé
   */
  calculateFinancialSummary(metrics: PropertyMetrics,property:PropertyModel=null,tenants:LocataireModel[]=[],units:RoomModel[]=[]): FinancialSummary { //OK

    const netProfit = this.getNetProfit(metrics,property);
    const netProfitMargin = this.getNetProfitMargin(metrics,property);

    return {
      monthlyRevenue: metrics.monthlyRevenue,
      yearlyRevenue: metrics.monthlyRevenue * 12,
      monthlyExpenses: this.getMonthlyExpenses(property),
      managementFees: this.getManagementFees(property),
      maintenanceCosts: this.getMaintenanceCosts(property),
      insuranceCosts: this.getInsuranceCosts(property),
      netProfit,
      netProfitMargin,
      annualYield: this.getAnnualYield(metrics,property),
      propertyValue: this.getPropertyValue(metrics,property),
      securityDeposits: this.getSecurityDeposits(tenants,units)
    }
  }

  getActualMonthlyRevenue(units:RoomModel[]=[]): number {
    // Calcul basé sur les unités réellement occupées
    if (!units || units.length === 0) {
      return 0;
    }

    return units
      .filter(unit => !unit.isFree)
      .reduce((total, unit) => total + (unit.price || 0), 0);
  }

  getActualMonthlyExpenses(property:PropertyModel,units:RoomModel[]=[]): number {
    const baseExpenses = property?.monthlyCharges || 0;
    const insuranceExpenses = (property?.insuranceCost || 0) / 12;
    return baseExpenses + insuranceExpenses;
  }

  getActualNetProfit(property:PropertyModel,units:RoomModel[]): number {
    const revenue = this.getActualMonthlyRevenue(units);
    const expenses = this.getActualMonthlyExpenses(property,units);
    const managementFees = this.getActualManagementFees(units);

    return revenue - expenses - managementFees;
  }

  getActualManagementFees(units: RoomModel[]): number {
    // Pas de taux de gestion configurable disponible — retourne 0
    // Les frais réels sont dans property.managementFees
    return 0;
  }


  /**
   * Détermine le statut de performance d'une propriété
   */
  getPerformanceStatus(occupancyRate: number): { // OK
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
  getPropertyType(property:PropertyModel): string { // OK
    if (!property) return 'Non spécifié';

    const typeMap = {
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison',
      'COMMERCIAL': 'Commercial',
      'MIXED': 'Mixte',
      'LAND': 'Terrain'
    };

    return property.propertyType ? typeMap[property.propertyType] : 'Résidentiel';
  }

  /**
   * Calcule l'âge de la propriété
   */
  getPropertyAge(property:PropertyModel): string { // OK
   if (!property) return 'Non spécifié';

    if (property.buildingYear) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - property.buildingYear;
      return age === 0 ? 'Neuf' : `${age} an${age > 1 ? 's' : ''}`;
    }

    if (property.createdAt) {
      const createdDate = new Date(property.createdAt);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} mois`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} an${years > 1 ? 's' : ''}`;
      }
    }

    return 'Non spécifié';
  }

  /**
   * Génère l'historique des revenus pour les graphiques
   * @deprecated Utiliser les données revenueDistribution.monthlyAnalysis du backend
   */
  generateRevenueHistory(monthlyRevenue: number): { month: string; amount: number }[] {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    return months.map(month => ({
      month,
      amount: monthlyRevenue
    }));
  }

  /**
   * Calcule la croissance des revenus basée sur l'historique
   */
  getRevenueGrowth(history: any[]): number {
    // Calculer la croissance réelle basée sur l'historique des paiements
    if (!history || history.length === 0) {
      return 0; // Pas d'historique disponible
    }

    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(currentMonth.getMonth() - 1);

    // Filtrer les paiements du mois actuel et du mois précédent
    const currentMonthPayments = history.filter(item => {
      if (item.type !== 'payment' || !item.amount) return false;
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === currentMonth.getMonth() &&
             itemDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, item) => sum + (item.amount || 0), 0);

    const previousMonthPayments = history.filter(item => {
      if (item.type !== 'payment' || !item.amount) return false;
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === previousMonth.getMonth() &&
             itemDate.getFullYear() === previousMonth.getFullYear();
    }).reduce((sum, item) => sum + (item.amount || 0), 0);

    if (previousMonthPayments === 0) {
      return currentMonthPayments > 0 ? 100 : 0;
    }

    return Math.round(((currentMonthPayments - previousMonthPayments) / previousMonthPayments) * 100);
  }

  /**
   * Calcule les dates importantes
   */
  getImportantDates(history:any[]=[]): { // OK
    nextPaymentDate: Date;
    lastInspectionDate: Date;
    nextMaintenanceDate: Date;
  } {

    return {
      nextPaymentDate:this.getNextPaymentDate(history),
      nextMaintenanceDate: this.getNextMaintenanceDate(history),
      lastInspectionDate: this.getLastInspectionDate(history)
    };
  }

  getRentRange(units:RoomModel[]):{min:number,max:number}
  {
    let min=1000000000,max=0;
    for(let unit of units)
    {
      if(unit.price<min) min=unit.price;
      if(unit.price>max) max =unit.price;
    }
    return { min,max }
  }
  getNextMaintenanceDate(history:any[]=[]): Date | null { // OK
    // Rechercher les maintenances programmées dans l'historique
    if (!history || history.length === 0) {
      return null; // Pas d'historique de maintenance
    }

    // Filtrer les événements de maintenance futurs
    const now = new Date();
    const maintenanceEvents = history.filter(event =>
      (event.type === 'maintenance' ||
       event.description?.toLowerCase().includes('maintenance')) &&
      new Date(event.date) > now
    );

    if (maintenanceEvents.length === 0) {
      return null; // Aucune maintenance programmée
    }

    // Retourner la date de la prochaine maintenance
    const nextMaintenance = maintenanceEvents.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];

    return new Date(nextMaintenance.date);
  }

  getLastInspectionDate(history:any[]=[]): Date | null { // OK
    // Rechercher la dernière inspection dans l'historique
    if (!history || history.length === 0) {
      return null; // Pas d'historique d'inspection
    }

    // Filtrer les événements d'inspection dans l'historique
    // Note: HistoryItem n'a pas de type 'inspection', seulement 'maintenance'
    const inspectionEvents = history.filter(event =>
      event.type === 'maintenance' &&
      event.description?.toLowerCase().includes('inspection')
    );

    if (inspectionEvents.length === 0) {
      return null; // Aucune inspection trouvée
    }

    // Retourner la date de la dernière inspection
    const lastInspection = inspectionEvents.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return new Date(lastInspection.date);
  }

  getNextPaymentDate(history:any[]=[]): Date | null {
    return null;
  }

}
 