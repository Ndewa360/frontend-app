import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyModel, RoomModel, LocataireModel } from 'src/app/shared/store';
import { PropertyMetrics, FinancialSummary, PropertyMetricsService } from '../../services/property-metrics.service';
import { HistoryItem } from '../../services/property-data.service';

@Component({
  selector: 'app-property-overview',
  templateUrl: './property-overview.component.html',
  styleUrls: ['./property-overview.component.scss']
})
export class PropertyOverviewComponent implements OnInit, OnChanges {
  @Input() property: PropertyModel | null = null;
  @Input() units: RoomModel[] = [];
  @Input() tenants: LocataireModel[] = [];
  @Input() history: HistoryItem[] = [];
  @Input() loading: boolean = false;

  @Output() quickAction = new EventEmitter<string>();

  metrics: PropertyMetrics | null = null;
  financialSummary: FinancialSummary | null = null;
  performanceStatus: any = null;
  propertyAmenities: string[] = [];
  importantDates: any = null;

  // Propriété Math pour les templates
  Math = Math;

  constructor(
    private propertyMetricsService:PropertyMetricsService
  ) { }

  ngOnInit(): void {
    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['property'] || changes['units'] || changes['tenants'] || changes['history']) {
      this.initializeData();
    }
  }

  private initializeData(): void {
    if (!this.property) return;

    // Calculer les métriques directement
    this.metrics=this.propertyMetricsService.calculatePropertyMetrics(this.property,this.units,this.tenants,[],this.history);

    // Calculer le résumé financier
    this.financialSummary=this.propertyMetricsService.calculateFinancialSummary(this.metrics);

    // Obtenir le statut de performance
    this.performanceStatus=this.propertyMetricsService.getPerformanceStatus(this.metrics.occupancyRate);

    // Charger les équipements
    this.loadPropertyAmenities();

    // Obtenir les dates importantes
    this.importantDates = this.propertyMetricsService.getImportantDates(this.history);
  }

  private loadPropertyAmenities(): void {
    // Équipements basés sur les propriétés réelles
    const amenities = new Set<string>();

    if (!this.property) return;

    // Équipements de base basés sur les nouvelles propriétés
    if (this.property.hasParking) {
      amenities.add('Parking');
    }

    if (this.property.hasClosure) {
      amenities.add('Clôture/Barrière');
    }

    if (this.property.hasElevator) {
      amenities.add('Ascenseur');
    }

    if (this.property.hasWater !== false) { // true par défaut
      amenities.add('Eau courante');
    }

    if (this.property.hasInternet) {
      amenities.add('Internet');
    }

    if (this.property.hasGenerator) {
      amenities.add('Générateur');
    }

    if (this.property.hasSecurity) {
      amenities.add('Sécurité 24h/24');
    }

    // Équipements de confort
    if (this.property.hasGarden) {
      amenities.add('Jardin');
    }

    if (this.property.hasPool) {
      amenities.add('Piscine');
    }

    if (this.property.hasGym) {
      amenities.add('Salle de sport');
    }

    // Équipements basés sur les unités (complément)
    if (this.units.some(unit => unit.specifity?.hasKitchen)) {
      amenities.add('Cuisines équipées');
    }

    if (this.units.some(unit => unit.specifity?.isInternalShower)) {
      amenities.add('Douches privées');
    }

    // Si aucun équipement spécifique, ajouter des équipements de base
    if (amenities.size === 0) {
      amenities.add('Électricité');
    }
    
    this.propertyAmenities = Array.from(amenities);
  }

  // Méthodes utilitaires avec données réelles
  getPropertyType(): string {
    return this.propertyMetricsService.getPropertyType(this.property);
  }

  getPropertyAge(): string {
    return this.propertyMetricsService.getPropertyAge(this.property);
  }

  getEstimatedSurface(): string { // A revoir
    if (!this.property) return '0';

    // Utilise la surface totale si disponible, sinon estime basé sur les unités
    if (this.property.totalSurface) {
      return this.property.totalSurface.toLocaleString();
    }

    const unitsCount = this.property.roomLength || this.metrics?.totalUnits || 0;
    const estimatedSurface = unitsCount * 60; // 60m² par unité
    return estimatedSurface.toLocaleString();
  }

  getPropertyCondition(): string {
    if (!this.property?.condition) return 'Non spécifié';

    const conditionMap = {
      'NEW': 'Neuf',
      'EXCELLENT': 'Excellent',
      'GOOD': 'Bon',
      'FAIR': 'Correct',
      'POOR': 'À rénover'
    };

    return conditionMap[this.property.condition];
  }

  getFurnishingStatus(): string {
    if (!this.property?.furnishingStatus) return 'Non spécifié';

    const furnishingMap = {
      'FURNISHED': 'Meublé',
      'SEMI_FURNISHED': 'Semi-meublé',
      'UNFURNISHED': 'Non meublé'
    };

    return furnishingMap[this.property.furnishingStatus];
  }

  getAvailabilityStatus(): string {
    if (!this.property?.availabilityStatus) return 'Non spécifié';

    const statusMap = {
      'AVAILABLE': 'Disponible',
      'PARTIALLY_OCCUPIED': 'Partiellement occupé',
      'FULLY_OCCUPIED': 'Entièrement occupé',
      'MAINTENANCE': 'En maintenance'
    };

    return statusMap[this.property.availabilityStatus];
  }

  // Nouvelles méthodes pour l'interface financière détaillée
  getCurrentDate(): Date {
    return new Date();
  }

  getOverduePayments(): number {
    return this.propertyMetricsService.getOverduePayments(this.history)
  }

  getRevenuePerUnit(): number {
    const totalUnits = this.metrics?.totalUnits || 1;
    return (this.metrics?.monthlyRevenue || 0) / totalUnits;
  }

  getSecurityDeposits(): number {
    return this.propertyMetricsService.getSecurityDeposits(this.tenants,this.units)
  }

  getMonthlyExpenses(): number {
    return this.propertyMetricsService.getMonthlyExpenses(this.property)
  }

  getManagementFees(): number {
    return this.propertyMetricsService.getManagementFees(this.property)
  }

  getMaintenanceCosts(): number {
    return this.propertyMetricsService.getMaintenanceCosts(this.property)
  }

  getInsuranceCosts(): number {
    return this.propertyMetricsService.getInsuranceCosts(this.property)
  }

  getNetProfit(): number {
    return this.propertyMetricsService.getNetProfit(this.metrics,this.property)
  }

  getNetProfitMargin(): number {
    return this.propertyMetricsService.getNetProfitMargin(this.metrics,this.property)
  }

  getAnnualYield(): number {
    return this.propertyMetricsService.getAnnualYield(this.metrics,this.property)
  }

  getPropertyStatus(): string {
    const occupancyRate = this.metrics?.occupancyRate || 0;
    if (occupancyRate >= 90) return 'Excellent';
    if (occupancyRate >= 75) return 'Bon';
    if (occupancyRate >= 50) return 'Moyen';
    return 'À améliorer';
  }

  getPropertyValue(): number {
    return this.propertyMetricsService.getPropertyValue(this.metrics,this.property)
  }

  getPerformanceStatus(): string {
    const occupancyRate = this.metrics?.occupancyRate || 0;
    if (occupancyRate >= 90) return 'Excellent';
    if (occupancyRate >= 75) return 'Bon';
    if (occupancyRate >= 50) return 'Moyen';
    return 'Faible';
  }

  getPerformanceColor(): string {
    const occupancyRate = this.metrics?.occupancyRate || 0;
    if (occupancyRate >= 75) return 'text-green-600';
    if (occupancyRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getNextPaymentDate()
  {
    return this.propertyMetricsService.getNextPaymentDate(this.history)
  }

  getLastInspectionDate()
  {
    return this.propertyMetricsService.getLastInspectionDate(this.history)
  }

  getNextMaintenanceDate()
  {
    return this.propertyMetricsService.getNextMaintenanceDate(this.history)
  }
  

  // Nouvelles méthodes pour des données réelles et non redondantes
  getActualMonthlyRevenue(): number {
    return this.propertyMetricsService.getActualMonthlyRevenue(this.units)
  }

  getRevenueGrowth(): number {
    return this.propertyMetricsService.getRevenueGrowth(this.history)
  }

  getActualOccupancyRate(): number {
    if (!this.units || this.units.length === 0) {
      return 0;
    }

    const occupiedUnits = this.units.filter(unit => !unit.isFree).length;
    return Math.round((occupiedUnits / this.units.length) * 100);
  }

  getOccupiedUnitsCount(): number {
    if (!this.units) return 0;
    return this.units.filter(unit => !unit.isFree).length;
  }

  getTotalUnitsCount(): number {
    return this.units?.length || this.property?.roomLength || 0;
  }

  getValueAppreciation(): number {
    if (!this.property?.acquisitionPrice || !this.property?.currentValue) {
      return 0;
    }

    const appreciation = ((this.property.currentValue - this.property.acquisitionPrice) / this.property.acquisitionPrice) * 100;
    return Math.round(appreciation * 10) / 10;
  }

  getYieldStatus(): string {
    const yield_ = this.getAnnualYield();
    if (yield_ >= 8) return 'Excellent rendement';
    if (yield_ >= 6) return 'Bon rendement';
    if (yield_ >= 4) return 'Rendement correct';
    return 'Rendement faible';
  }

  // Méthodes pour les données financières réelles (non redondantes)
  getActualMonthlyExpenses(): number {
    return this.propertyMetricsService.getActualMonthlyExpenses(this.property,this.units)
  }

  getActualManagementFees(): number {
    return this.propertyMetricsService.getActualManagementFees(this.units)
  }

  getActualNetProfit(): number {
    return this.propertyMetricsService.getActualNetProfit(this.property,this.units)
  }

  getRentRange(){
    return this.propertyMetricsService.getRentRange(this.units)
  }


  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  formatDate(date: Date | string | undefined): string {

    if (!date) return 'Non spécifiée';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      return 'Date invalide';
    }
  }

  // Méthodes pour les graphiques et visualisations
  getOccupancyChartData(): any {
    if (!this.metrics) return null;
    
    return {
      labels: ['Occupées', 'Libres', 'Maintenance'],
      datasets: [{
        data: [
          this.metrics.occupiedUnits,
          this.metrics.availableUnits,
          this.metrics.maintenanceUnits
        ],
        backgroundColor: [
          '#10b981', // Vert pour occupées
          '#3b82f6', // Bleu pour libres
          '#f59e0b'  // Orange pour maintenance
        ]
      }]
    };
  }

  getRevenueChartData(): any {
    if (!this.financialSummary || !this.history) return null;

    // Calculer les revenus réels des 6 derniers mois basés sur l'historique
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const currentDate = new Date();

    return months.map((monthName, index) => {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() - (5 - index)); // 6 mois en arrière

      // Calculer les revenus réels pour ce mois
      const monthlyRevenue = this.history!.filter(item => {
        if (item.type !== 'payment' || !item.amount) return false;
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === targetDate.getMonth() &&
               itemDate.getFullYear() === targetDate.getFullYear();
      }).reduce((sum, item) => sum + (item.amount || 0), 0);

      return {
        month: monthName,
        amount: monthlyRevenue
      };
    });
  }

  getExpenseBreakdown(): any {
    if (!this.financialSummary) return null;

    return [
      { category: 'Charges mensuelles', amount: this.financialSummary.monthlyExpenses },
      { category: 'Frais de gestion', amount: this.financialSummary.managementFees },
      { category: 'Maintenance', amount: this.financialSummary.maintenanceCosts },
      { category: 'Assurances', amount: this.financialSummary.insuranceCosts }
    ];
  }

  // Méthodes pour les alertes et notifications
  getAlerts(): Array<{
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    icon: string;
  }> {
    const alerts = [];
    
    if (!this.metrics) return alerts;

    // Alerte taux d'occupation faible
    if (this.metrics.occupancyRate < 70) {
      alerts.push({
        type: 'warning',
        title: 'Taux d\'occupation faible',
        message: `Le taux d'occupation est de ${this.metrics.occupancyRate}%. Considérez des actions marketing.`,
        icon: 'warning'
      });
    }

    // Alerte revenus élevés
    if (this.metrics.occupancyRate >= 95) {
      alerts.push({
        type: 'success',
        title: 'Excellente performance',
        message: 'Votre propriété affiche un taux d\'occupation exceptionnel !',
        icon: 'checkmark'
      });
    }

    // Alerte maintenance
    if (this.metrics.maintenanceUnits > 0) {
      alerts.push({
        type: 'info',
        title: 'Unités en maintenance',
        message: `${this.metrics.maintenanceUnits} unité(s) nécessitent une attention.`,
        icon: 'tools'
      });
    }

    // Alerte paiements en retard
    if (this.metrics.overduePayments > 0) {
      alerts.push({
        type: 'error',
        title: 'Paiements en retard',
        message: `${this.metrics.overduePayments} locataire(s) ont des paiements en retard.`,
        icon: 'time'
      });
    }

    return alerts;
  }

  // Méthodes pour les actions rapides
  onQuickAction(actionType: string): void {
    this.quickAction.emit(actionType);
  }

  // Méthode pour gérer les erreurs d'images
  onImageError(event: any): void {
    event.target.src = 'assets/images/default-property.jpg';
  }

  getQuickActions(): Array<{
    label: string;
    icon: string;
    action: string;
    color: string;
    description: string;
  }> {
    return [
      {
        label: 'Ajouter unité',
        icon: 'add',
        action: 'add_unit',
        color: 'primary',
        description: 'Créer une nouvelle unité locative'
      },
      {
        label: 'Nouveau locataire',
        icon: 'userAdd',
        action: 'add_tenant',
        color: 'secondary',
        description: 'Enregistrer un nouveau locataire'
      },
      {
        label: 'Rapport financier',
        icon: 'document',
        action: 'financial_report',
        color: 'tertiary',
        description: 'Générer un rapport détaillé'
      },
      {
        label: 'Planifier maintenance',
        icon: 'calendar',
        action: 'schedule_maintenance',
        color: 'ghost',
        description: 'Programmer des travaux'
      }
    ];
  }

  onEditProperty()
  {
    this.quickAction.emit("edit_property")
  }

  // Méthodes pour les tendances
  getRevenueTrend(): 'up' | 'down' | 'stable' {
    if (!this.metrics) return 'stable';
    
    if (this.metrics.revenueGrowth > 5) return 'up';
    if (this.metrics.revenueGrowth < -5) return 'down';
    return 'stable';
  }

  getTrendIcon(): string {
    const trend = this.getRevenueTrend();
    switch (trend) {
      case 'up': return 'trendUp';
      case 'down': return 'trendDown';
      default: return 'trendFlat';
    }
  }

  getTrendColor(): string {
    const trend = this.getRevenueTrend();
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  // Méthodes pour les comparaisons basées sur les données réelles
  getMarketComparison(): {
    averageRent: number;
    marketPosition: 'above' | 'below' | 'average';
    difference: number;
  } | null {
    // Pas de données de marché disponibles - retourner null
    // En production, ceci devrait être connecté à une API de données de marché
    if (!this.metrics?.averageRent || this.metrics.averageRent === 0) {
      return null; // Pas de données suffisantes pour la comparaison
    }

    // Pour l'instant, retourner null car nous n'avons pas de vraies données de marché
    // Cette fonctionnalité nécessiterait une intégration avec des services de données immobilières
    return null;

    /*
    // Code à activer quand les données de marché seront disponibles :
    const marketAverageRent = await this.marketDataService.getAverageRentByCity(this.property?.geolocationCity?.name);
    const ourAverageRent = this.metrics?.averageRent || 0;
    const difference = ((ourAverageRent - marketAverageRent) / marketAverageRent) * 100;

    let marketPosition: 'above' | 'below' | 'average' = 'average';
    if (difference > 5) marketPosition = 'above';
    else if (difference < -5) marketPosition = 'below';

    return {
      averageRent: marketAverageRent,
      marketPosition,
      difference: Math.abs(difference)
    };
    */
  }

  // Méthodes utilitaires pour les nouvelles propriétés
  getPropertyTypeLabel(type: string): string {
    const labels = {
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison',
      'COMMERCIAL': 'Commercial',
      'MIXED': 'Mixte',
      'LAND': 'Terrain'
    };
    return labels[type] || type;
  }

  getConditionLabel(condition: string): string {
    const labels = {
      'NEW': 'Neuf',
      'EXCELLENT': 'Excellent',
      'GOOD': 'Bon',
      'FAIR': 'Correct',
      'POOR': 'À rénover'
    };
    return labels[condition] || condition;
  }

  getFurnishingLabel(status: string): string {
    const labels = {
      'FURNISHED': 'Meublé',
      'SEMI_FURNISHED': 'Semi-meublé',
      'UNFURNISHED': 'Non meublé'
    };
    return labels[status] || status;
  }

}
