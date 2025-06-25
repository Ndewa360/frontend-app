import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyModel } from 'src/app/shared/store';
import { PropertyMetrics, FinancialSummary, PropertyMetricsService } from '../../services/property-metrics.service';
import { Unit, Tenant, HistoryItem } from '../../services/property-data.service';

@Component({
  selector: 'app-property-overview',
  templateUrl: './property-overview.component.html',
  styleUrls: ['./property-overview.component.scss']
})
export class PropertyOverviewComponent implements OnInit, OnChanges {
  @Input() property: PropertyModel | null = null;
  @Input() units: Unit[] = [];
  @Input() tenants: Tenant[] = [];
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

  constructor(private metricsService: PropertyMetricsService) { }

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

    // Calculer les métriques
    this.metrics = this.metricsService.calculatePropertyMetrics(
      this.property,
      this.units,
      this.tenants,
      this.history
    );

    // Calculer le résumé financier
    this.financialSummary = this.metricsService.calculateFinancialSummary(this.metrics);

    // Obtenir le statut de performance
    this.performanceStatus = this.metricsService.getPerformanceStatus(this.metrics.occupancyRate);

    // Charger les équipements
    this.loadPropertyAmenities();

    // Obtenir les dates importantes
    this.importantDates = this.metricsService.getImportantDates();
  }

  private loadPropertyAmenities(): void {
    // Équipements basés sur les unités
    const amenities = new Set<string>();
    
    // Équipements de base
    amenities.add('Parking');
    amenities.add('Sécurité 24h/24');
    amenities.add('Générateur');
    amenities.add('Eau courante');
    
    // Équipements basés sur les unités
    if (this.units.some(unit => unit.hasKitchen)) {
      amenities.add('Cuisines équipées');
    }
    
    if (this.units.some(unit => unit.isInternalShower)) {
      amenities.add('Douches privées');
    }
    
    if (this.units.length > 5) {
      amenities.add('Ascenseur');
    }
    
    amenities.add('Internet');
    
    this.propertyAmenities = Array.from(amenities);
  }

  // Méthodes utilitaires avec données réelles
  getPropertyType(): string {
    if (!this.property) return 'Non spécifié';

    const typeMap = {
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison',
      'COMMERCIAL': 'Commercial',
      'MIXED': 'Mixte',
      'LAND': 'Terrain'
    };

    return this.property.propertyType ? typeMap[this.property.propertyType] : 'Résidentiel';
  }

  getPropertyAge(): string {
    if (!this.property) return 'Non spécifié';

    if (this.property.buildingYear) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - this.property.buildingYear;
      return age === 0 ? 'Neuf' : `${age} an${age > 1 ? 's' : ''}`;
    }

    if (this.property.createdAt) {
      const createdDate = new Date(this.property.createdAt);
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

  getEstimatedSurface(): string {
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

  formatDate(date: Date | undefined): string {
    if (!date) return 'Non spécifiée';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
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
    if (!this.financialSummary) return null;
    
    return this.metricsService.generateRevenueHistory(this.financialSummary.monthlyRevenue);
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

  // Méthodes pour les comparaisons
  getMarketComparison(): {
    averageRent: number;
    marketPosition: 'above' | 'below' | 'average';
    difference: number;
  } {
    // Simulation de données de marché
    const marketAverageRent = 150000; // 150k XAF moyenne du marché
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
  }
}
