import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyModel, RoomModel, LocataireModel } from 'src/app/shared/store';
import { PropertyMetrics, FinancialSummary } from '../../services/property-metrics.service';
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

  constructor() { }

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
    this.calculateMetrics();

    // Calculer le résumé financier
    this.calculateFinancialSummary();

    // Obtenir le statut de performance
    this.calculatePerformanceStatus();

    // Charger les équipements
    this.loadPropertyAmenities();

    // Obtenir les dates importantes
    this.initializeImportantDates();
  }

  private calculateMetrics(): void {
    const totalUnits = this.units?.length || this.property?.roomLength || 0;
    const occupiedUnits = this.units?.filter(unit => !unit.isFree).length || 0;
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const monthlyRevenue = this.units?.reduce((total, unit) => {
      return total + (!unit.isFree ? (unit.price || 0) : 0);
    }, 0) || 0;

    const averageRent = occupiedUnits > 0 ? monthlyRevenue / occupiedUnits : 0;

    // Calculer les unités en maintenance basées sur les données réelles
    const maintenanceUnits = this.history ? this.history.filter(item =>
      item.type === 'maintenance' &&
      new Date(item.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Maintenance dans les 30 derniers jours
    ).length : 0;

    this.metrics = {
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyRate,
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
      revenueGrowth: this.getRevenueGrowth(), // Utiliser la vraie fonction
      averageRent,
      overduePayments: this.getOverduePayments()
    };
  }

  private calculateFinancialSummary(): void {
    if (!this.metrics) return;

    const netProfit = this.getNetProfit();
    const netProfitMargin = this.getNetProfitMargin();

    this.financialSummary = {
      monthlyRevenue: this.metrics.monthlyRevenue,
      yearlyRevenue: this.metrics.monthlyRevenue * 12,
      monthlyExpenses: this.getMonthlyExpenses(),
      managementFees: this.getManagementFees(),
      maintenanceCosts: this.getMaintenanceCosts(),
      insuranceCosts: this.getInsuranceCosts(),
      netProfit,
      netProfitMargin,
      annualYield: this.getAnnualYield(),
      propertyValue: this.getPropertyValue(),
      securityDeposits: this.getSecurityDeposits()
    };
  }

  private calculatePerformanceStatus(): void {
    const occupancyRate = this.metrics?.occupancyRate || 0;
    let status = 'Faible';

    if (occupancyRate >= 90) status = 'Excellent';
    else if (occupancyRate >= 75) status = 'Bon';
    else if (occupancyRate >= 50) status = 'Moyen';

    this.performanceStatus = { status };
  }

  private initializeImportantDates(): void {
    this.importantDates = {
      nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Dans 15 jours
      nextMaintenanceDate: this.getNextMaintenanceDate(),
      lastInspectionDate: this.getLastInspectionDate()
    };
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

  // Nouvelles méthodes pour l'interface financière détaillée
  getCurrentDate(): Date {
    return new Date();
  }

  getOverduePayments(): number {
    // Calculer les paiements en retard basés sur l'historique réel
    if (!this.history || this.history.length === 0) {
      return 0; // Pas d'historique disponible
    }

    // Comme HistoryItem n'a pas de propriété status, on ne peut pas déterminer les retards
    // Cette fonctionnalité nécessiterait une extension du modèle HistoryItem
    return 0; // Pas de données de retard disponibles pour l'instant
  }

  getRevenuePerUnit(): number {
    const totalUnits = this.metrics?.totalUnits || 1;
    return (this.metrics?.monthlyRevenue || 0) / totalUnits;
  }

  getSecurityDeposits(): number {
    // Calculer les cautions réelles basées sur les locataires actuels
    if (!this.tenants || this.tenants.length === 0) {
      return 0; // Pas de locataires, donc pas de cautions
    }

    // Calculer les cautions basées sur les unités occupées
    // Comme LocataireModel n'a pas de propriété caution, on estime basé sur les loyers
    return this.tenants.reduce((total, tenant) => {
      // Estimer basé sur l'unité occupée (2 mois de loyer standard)
      const unit = this.units.find(u => u._id === tenant.room);
      if (unit && unit.price) {
        return total + (unit.price * 2); // Estimation : 2 mois de loyer
      }

      return total;
    }, 0);
  }

  getMonthlyExpenses(): number {
    // Calculer les dépenses réelles basées sur les données de la propriété
    if (!this.property) return 0;

    const monthlyExpenses =
      (this.property.propertyTax || 0) / 12 + // Taxe foncière mensuelle
      (this.property.insuranceCost || 0) / 12 + // Assurance mensuelle
      (this.property.managementFees || 0); // Frais de gestion mensuels
      // Note: maintenanceCost n'existe pas dans PropertyModel

    return monthlyExpenses;
  }

  getManagementFees(): number {
    // Utiliser les frais de gestion réels de la propriété
    return this.property?.managementFees || 0;
  }

  getMaintenanceCosts(): number {
    // PropertyModel n'a pas de propriété maintenanceCost
    // Retourner 0 car pas de données de maintenance disponibles
    return 0;
  }

  getInsuranceCosts(): number {
    // Simulation - coût fixe mensuel
    return (this.property?.insuranceCost || 50000) / 12;
  }

  getNetProfit(): number {
    const revenue = this.metrics?.monthlyRevenue || 0;
    const expenses = this.getMonthlyExpenses() + this.getManagementFees() + this.getMaintenanceCosts() + this.getInsuranceCosts();
    return revenue - expenses;
  }

  getNetProfitMargin(): number {
    const revenue = this.metrics?.monthlyRevenue || 0;
    if (revenue === 0) return 0;
    return Math.round((this.getNetProfit() / revenue) * 100);
  }

  getAnnualYield(): number {
    const annualProfit = this.getNetProfit() * 12;
    const propertyValue = this.getPropertyValue();
    if (propertyValue === 0) return 0;
    return Math.round((annualProfit / propertyValue) * 100 * 10) / 10;
  }

  getPropertyStatus(): string {
    const occupancyRate = this.metrics?.occupancyRate || 0;
    if (occupancyRate >= 90) return 'Excellent';
    if (occupancyRate >= 75) return 'Bon';
    if (occupancyRate >= 50) return 'Moyen';
    return 'À améliorer';
  }

  getPropertyValue(): number {
    // Utilise la valeur actuelle si disponible, sinon estime
    if (this.property?.currentValue) return this.property.currentValue;
    if (this.property?.acquisitionPrice) return this.property.acquisitionPrice;

    // Estimation basée sur les revenus (multiple de 10-15 ans)
    const annualRevenue = (this.metrics?.monthlyRevenue || 0) * 12;
    return annualRevenue * 12;
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

  getLastInspectionDate(): Date | null {
    // Rechercher la dernière inspection dans l'historique
    if (!this.history || this.history.length === 0) {
      return null; // Pas d'historique d'inspection
    }

    // Filtrer les événements d'inspection dans l'historique
    // Note: HistoryItem n'a pas de type 'inspection', seulement 'maintenance'
    const inspectionEvents = this.history.filter(event =>
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

  getNextMaintenanceDate(): Date | null {
    // Rechercher les maintenances programmées dans l'historique
    if (!this.history || this.history.length === 0) {
      return null; // Pas d'historique de maintenance
    }

    // Filtrer les événements de maintenance futurs
    const now = new Date();
    const maintenanceEvents = this.history.filter(event =>
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

  // Nouvelles méthodes pour des données réelles et non redondantes
  getActualMonthlyRevenue(): number {
    // Calcul basé sur les unités réellement occupées
    if (!this.units || this.units.length === 0) {
      return 0;
    }

    return this.units
      .filter(unit => !unit.isFree)
      .reduce((total, unit) => total + (unit.price || 0), 0);
  }

  getRevenueGrowth(): number {
    // Calculer la croissance réelle basée sur l'historique des paiements
    if (!this.history || this.history.length === 0) {
      return 0; // Pas d'historique disponible
    }

    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(currentMonth.getMonth() - 1);

    // Filtrer les paiements du mois actuel et du mois précédent
    const currentMonthPayments = this.history.filter(item => {
      if (item.type !== 'payment' || !item.amount) return false;
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === currentMonth.getMonth() &&
             itemDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, item) => sum + (item.amount || 0), 0);

    const previousMonthPayments = this.history.filter(item => {
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
    // Calcul basé sur les vraies charges de la propriété
    const baseExpenses = this.property?.monthlyCharges || 0;
    const maintenanceExpenses = this.getActualMonthlyRevenue() * 0.08; // 8% pour maintenance
    const insuranceExpenses = (this.property?.insuranceCost || 0) / 12;

    return baseExpenses + maintenanceExpenses + insuranceExpenses;
  }

  getActualManagementFees(): number {
    // 5% des revenus réels pour les frais de gestion
    return this.getActualMonthlyRevenue() * 0.05;
  }

  getActualNetProfit(): number {
    const revenue = this.getActualMonthlyRevenue();
    const expenses = this.getActualMonthlyExpenses();
    const managementFees = this.getActualManagementFees();

    return revenue - expenses - managementFees;
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
