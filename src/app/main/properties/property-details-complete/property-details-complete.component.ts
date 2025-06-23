import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyModel, PropertyState, RoomState, LocataireState, LocationPaymentState } from 'src/app/shared/store';

// Interface Property supprimée car nous utilisons PropertyModel du store

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface Unit {
  id: string;
  name: string;
  type: string;
  surface: number;
  price: number;
  status: 'occupied' | 'available' | 'maintenance';
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'expired';
}

interface HistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'maintenance' | 'tenant_move_in' | 'tenant_move_out' | 'contract_renewal';
  description: string;
  amount?: number;
  unitId?: string;
  tenantId?: string;
}

interface FinanceData {
  monthlyRevenue: number;
  yearlyRevenue: number;
  expenses: number;
  netIncome: number;
  revenueHistory: { month: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

@Component({
  selector: 'app-property-details-complete',
  templateUrl: './property-details-complete.component.html',
  styleUrls: ['./property-details-complete.component.scss']
})
export class PropertyDetailsCompleteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  property: PropertyModel | null = null;
  propertyId: string | null = null;
  activeTab: string = 'overview';

  // Observables du store
  @Select(PropertyState.selectStateProperties)
  properties$!: Observable<PropertyModel[]>;

  @Select(PropertyState.selectStateLoading)
  loading$!: Observable<boolean>;
  
  // Données pour les onglets
  units: Unit[] = [];
  tenants: Tenant[] = [];
  history: HistoryItem[] = [];
  finances: FinanceData | null = null;
  
  // Métriques
  monthlyRevenue: number = 0;
  revenueGrowth: number = 0;
  occupancyRate: number = 0;
  occupiedUnits: number = 0;
  totalUnits: number = 0;
  availableUnits: number = 0;
  overduePayments: number = 0;
  
  // Équipements
  propertyAmenities: string[] = [];
  
  // Configuration des onglets
  tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
    },
    {
      id: 'units',
      label: 'Unités locatives',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 21h6'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    },
    {
      id: 'history',
      label: 'Historique',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      id: 'finances',
      label: 'Finances',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) { }

  ngOnInit(): void {
    // Récupérer l'ID de la propriété depuis la route
    this.propertyId = this.route.snapshot.paramMap.get('id');

    if (this.propertyId) {
      // Écouter les changements de propriétés
      this.properties$
        .pipe(takeUntil(this.destroy$))
        .subscribe(properties => {
          this.property = properties.find(p => p._id === this.propertyId) || null;

          if (this.property) {
            this.loadRealData();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRealData(): void {
    if (!this.property) return;

    this.loadUnitsFromStore();
    this.loadTenantsFromStore();
    this.loadHistoryFromStore();
    this.loadFinancesFromStore();
    this.loadPropertyAmenities();
    this.calculateRealMetrics();
    this.updateTabCounts();
  }

  private loadUnitsFromStore(): void {
    if (!this.property) return;

    const rooms = this.store.selectSnapshot(RoomState.selectStateRoomByPropertyId(this.property._id));

    if (rooms) {
      this.units = rooms.map(room => ({
        id: room._id,
        name: room.name || `Unité ${room.number || ''}`,
        type: this.getRoomTypeLabel(room.type),
        surface: room.surface || 0,
        price: room.price || 0,
        status: room.isFree ? 'available' : 'occupied',
        tenant: room.isFree ? undefined : {
          id: 'tenant-' + room._id,
          name: 'Locataire actuel',
          email: 'locataire@email.com',
          phone: '+237 6XX XX XX XX'
        }
      }));
    } else {
      this.units = [];
    }
  }

  private getRoomTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'ROOM': 'Chambre',
      'STUDIO': 'Studio',
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison'
    };
    return typeLabels[type] || type;
  }

  private loadTenantsFromStore(): void {
    if (!this.property) return;

    const locataires = this.store.selectSnapshot(LocataireState.selectStateLocataireByPropertyId(this.property._id));

    if (locataires) {
      this.tenants = locataires.map(locataire => ({
        id: locataire._id,
        name: `${locataire.firstName} ${locataire.lastName}`,
        email: locataire.email || 'email@example.com',
        phone: locataire.phoneNumber || '+237 6XX XX XX XX',
        unitId: locataire.roomId || '',
        unitName: this.getUnitNameById(locataire.roomId),
        rentAmount: locataire.monthlyRent || 0,
        leaseStart: new Date(locataire.createdAt || Date.now()),
        leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an plus tard
        status: 'active'
      }));
    } else {
      this.tenants = [];
    }
  }

  private getUnitNameById(roomId: string): string {
    const unit = this.units.find(u => u.id === roomId);
    return unit ? unit.name : 'Unité inconnue';
  }

  private loadHistoryFromStore(): void {
    if (!this.property) return;

    const payments = this.store.selectSnapshot(LocationPaymentState.selectStateLocationPaymentByPropertyId(this.property._id));

    if (payments) {
      this.history = payments.map(payment => ({
        id: payment._id,
        date: new Date(payment.createdAt || Date.now()),
        type: 'payment' as const,
        description: `Paiement de loyer - ${payment.amount} XAF`,
        amount: payment.amount,
        unitId: payment.roomId,
        tenantId: payment.locataireId
      }));
    } else {
      this.history = [];
    }
  }

  private loadFinancesFromStore(): void {
    if (!this.property) return;

    // Calculer les finances basées sur les vraies données
    const monthlyRevenue = this.units
      .filter(unit => unit.status === 'occupied')
      .reduce((sum, unit) => sum + unit.price, 0);

    const yearlyRevenue = monthlyRevenue * 12;
    const expenses = Math.round(monthlyRevenue * 0.2); // Estimation 20% de charges
    const netIncome = monthlyRevenue - expenses;

    this.finances = {
      monthlyRevenue,
      yearlyRevenue,
      expenses,
      netIncome,
      revenueHistory: this.generateRevenueHistory(monthlyRevenue),
      expenseCategories: [
        { category: 'Maintenance', amount: Math.round(expenses * 0.5) },
        { category: 'Assurance', amount: Math.round(expenses * 0.2) },
        { category: 'Taxes', amount: Math.round(expenses * 0.2) },
        { category: 'Gestion', amount: Math.round(expenses * 0.1) }
      ]
    };
  }

  private generateRevenueHistory(monthlyRevenue: number): { month: string; amount: number }[] {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    return months.map(month => ({
      month,
      amount: monthlyRevenue + (Math.random() - 0.5) * monthlyRevenue * 0.1 // Variation de ±5%
    }));
  }

  private calculateRealMetrics(): void {
    this.totalUnits = this.units.length;
    this.occupiedUnits = this.units.filter(unit => unit.status === 'occupied').length;
    this.availableUnits = this.units.filter(unit => unit.status === 'available').length;
    this.occupancyRate = this.totalUnits > 0 ? Math.round((this.occupiedUnits / this.totalUnits) * 100) : 0;

    this.monthlyRevenue = this.units
      .filter(unit => unit.status === 'occupied')
      .reduce((sum, unit) => sum + unit.price, 0);

    // Calculer la croissance basée sur l'historique des paiements
    this.revenueGrowth = this.calculateRevenueGrowth();

    // Calculer les paiements en retard (simulation)
    this.overduePayments = Math.floor(this.tenants.length * 0.1); // 10% en retard
  }

  private calculateRevenueGrowth(): number {
    // Simulation de croissance basée sur les données réelles
    if (this.history.length > 0) {
      const recentPayments = this.history.filter(h => h.type === 'payment').length;
      return recentPayments > 5 ? 12 : recentPayments > 2 ? 8 : 3;
    }
    return 0;
  }

  private loadPropertyAmenities(): void {
    this.propertyAmenities = [
      'Parking',
      'Sécurité 24h/24',
      'Générateur',
      'Eau courante',
      'Internet',
      'Ascenseur'
    ];
  }



  private updateTabCounts(): void {
    this.tabs.forEach(tab => {
      switch (tab.id) {
        case 'units':
          tab.count = this.totalUnits;
          break;
        case 'tenants':
          tab.count = this.tenants.length;
          break;
        case 'history':
          tab.count = this.history.length;
          break;
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Méthode supprimée car dupliquée plus bas

  onEditProperty(): void {
    // Navigation vers la page d'édition
    console.log('Éditer la propriété');
  }

  onAddTenant(): void {
    // Navigation vers l'ajout de locataire
    console.log('Ajouter un locataire');
  }

  // Méthode pour retourner à la liste des propriétés
  goBack(): void {
    this.router.navigate(['/app/properties/home']);
  }

  // Méthode pour obtenir le statut de la propriété
  getPropertyStatus(): string {
    if (!this.property) return 'Inconnu';

    if (this.occupancyRate >= 95) return 'Excellent';
    if (this.occupancyRate >= 80) return 'Très bon';
    if (this.occupancyRate >= 60) return 'Bon';
    if (this.occupancyRate >= 40) return 'Moyen';
    return 'À améliorer';
  }

  // Méthode pour obtenir la couleur du statut
  getStatusColor(): string {
    const status = this.getPropertyStatus();
    switch (status) {
      case 'Excellent': return 'green';
      case 'Très bon': return 'blue';
      case 'Bon': return 'indigo';
      case 'Moyen': return 'yellow';
      default: return 'red';
    }
  }

  // Méthode pour calculer le revenu par unité
  getRevenuePerUnit(): number {
    return this.totalUnits > 0 ? this.monthlyRevenue / this.totalUnits : 0;
  }

  // Méthode pour obtenir la prochaine date de paiement (simulation)
  getNextPaymentDate(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth;
  }

  // Méthode pour obtenir le statut de performance
  getPerformanceStatus(): string {
    if (this.occupancyRate >= 95) return 'Excellente';
    if (this.occupancyRate >= 85) return 'Très bonne';
    if (this.occupancyRate >= 70) return 'Bonne';
    if (this.occupancyRate >= 50) return 'Moyenne';
    return 'À améliorer';
  }

  // Méthode pour obtenir la couleur de performance
  getPerformanceColor(): string {
    if (this.occupancyRate >= 95) return 'text-green-600';
    if (this.occupancyRate >= 85) return 'text-blue-600';
    if (this.occupancyRate >= 70) return 'text-indigo-600';
    if (this.occupancyRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Méthodes pour le résumé financier détaillé
  getCurrentDate(): Date {
    return new Date();
  }

  getSecurityDeposits(): number {
    // Calcul basé sur 2 mois de loyer par unité occupée
    return this.occupiedUnits * (this.getRevenuePerUnit() * 2);
  }

  getMonthlyExpenses(): number {
    // Estimation des charges mensuelles (électricité, eau, entretien général)
    return this.totalUnits * 25000; // 25,000 XAF par unité
  }

  getManagementFees(): number {
    // 5% des revenus mensuels pour frais de gestion
    return this.monthlyRevenue * 0.05;
  }

  getMaintenanceCosts(): number {
    // Estimation maintenance/réparations (3% des revenus annuels / 12)
    return (this.monthlyRevenue * 12 * 0.03) / 12;
  }

  getInsuranceCosts(): number {
    // Estimation assurances (1% des revenus annuels / 12)
    return (this.monthlyRevenue * 12 * 0.01) / 12;
  }

  getNetProfit(): number {
    // Bénéfice net = Revenus - Charges - Frais de gestion - Maintenance - Assurances
    return this.monthlyRevenue - this.getMonthlyExpenses() - this.getManagementFees() - this.getMaintenanceCosts() - this.getInsuranceCosts();
  }

  getNetProfitMargin(): number {
    // Marge bénéficiaire en pourcentage
    if (this.monthlyRevenue === 0) return 0;
    return Math.round((this.getNetProfit() / this.monthlyRevenue) * 100);
  }

  getAnnualYield(): number {
    // Rendement annuel estimé (basé sur une valeur de propriété estimée)
    const estimatedPropertyValue = this.monthlyRevenue * 12 * 15; // 15 ans de revenus
    if (estimatedPropertyValue === 0) return 0;
    return Math.round(((this.getNetProfit() * 12) / estimatedPropertyValue) * 100 * 10) / 10;
  }

  getPropertyValue(): number {
    // Valeur estimée de la propriété (15 ans de revenus nets)
    return this.getNetProfit() * 12 * 15;
  }

  // Méthodes pour les informations détaillées de la propriété
  getPropertyType(): string {
    // Détermine le type de propriété basé sur le nombre d'unités
    if (!this.totalUnits) return 'Non spécifié';
    if (this.totalUnits === 1) return 'Maison individuelle';
    if (this.totalUnits <= 4) return 'Petit immeuble';
    if (this.totalUnits <= 10) return 'Immeuble résidentiel';
    return 'Grand complexe';
  }

  getEstimatedSurface(): string {
    // Surface estimée basée sur le nombre d'unités (moyenne 60m² par unité)
    const estimatedSurface = this.totalUnits * 60;
    return estimatedSurface.toLocaleString();
  }

  getPropertyAge(): string {
    // Calcule l'âge de la propriété
    if (!this.property?.createdAt) return 'Non spécifié';
    const createdDate = new Date(this.property.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} ans`;
  }

  getLastInspectionDate(): Date {
    // Simulation de la dernière inspection (3 mois avant aujourd'hui)
    const lastInspection = new Date();
    lastInspection.setMonth(lastInspection.getMonth() - 3);
    return lastInspection;
  }

  getNextMaintenanceDate(): Date {
    // Simulation de la prochaine maintenance (2 mois après aujourd'hui)
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 2);
    return nextMaintenance;
  }
}
