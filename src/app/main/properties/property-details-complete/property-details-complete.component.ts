import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  PropertyModel,
  RoomModel,
  RoomAction,
  RoomState,
  LocataireModel,
  LocataireState,
  HistoryLocationPaymentAction,
  HistoryLocationPaymentState
} from 'src/app/shared/store';
import { PropertyDataService, Unit, Tenant, HistoryItem } from '../services/property-data.service';
import { UnitAction } from '../components/property-units-list/property-units-list.component';
import { UpdatePropertyComponent, UpdatePropertyDialogData } from '../update-property/update-property.component';
import { GaleryComponent } from '../../room/components/galery/galery.component';

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface PropertyMetrics {
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  averageRent: number;
  revenueGrowth: number;
}

@Component({
  selector: 'app-property-details-complete',
  templateUrl: './property-details-complete.component.html',
  styleUrls: ['./property-details-complete.component.scss']
})
export class PropertyDetailsCompleteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données principales via le store
  property$: Observable<PropertyModel | null>;
  units$: Observable<RoomModel[]>;
  tenants$: Observable<LocataireModel[]>;
  history$: Observable<HistoryItem[]>;
  loadingStates$: Observable<{
    property: boolean;
    units: boolean;
    tenants: boolean;
  }>;

  // État local
  propertyId: string | null = null;
  activeTab: string = 'overview';

  // Métriques de la propriété
  metrics: PropertyMetrics = {
    totalUnits: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    averageRent: 0,
    revenueGrowth: 0
  };

  // Configuration des onglets
  tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'home'
    },
    {
      id: 'units',
      label: 'Unités locatives',
      icon: 'building'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      icon: 'user'
    },
    {
      id: 'history',
      label: 'Historique',
      icon: 'time'
    },
    {
      id: 'finances',
      label: 'Finances',
      icon: 'money'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private propertyDataService: PropertyDataService,
    private dialog: MatDialog
  ) {
    // Initialiser les observables vides
    this.property$ = new Observable();
    this.units$ = new Observable();
    this.tenants$ = new Observable();
    this.history$ = new Observable();
    this.loadingStates$ = new Observable();
  }

  ngOnInit(): void {
    // Récupérer l'ID de la propriété depuis la route
    this.propertyId = this.route.snapshot.paramMap.get('id');

    if (this.propertyId) {
      // Les données sont déjà chargées par PropertyDetailsResolver
      // On n'a plus besoin de les charger ici
      console.log(`🏢 PropertyDetailsComplete - Les données de la propriété ${this.propertyId} sont déjà chargées par le resolver`);
      this.initializeSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSubscriptions(): void {
    if (!this.propertyId) return;

    // S'abonner aux données déjà chargées par le resolver
    console.log('📊 Initialisation des abonnements aux données');

    // Les données sont déjà disponibles dans le store grâce au resolver
    // On peut directement s'abonner aux observables

    // Initialiser les observables avec le store
    this.property$ = this.propertyDataService.getProperty(this.propertyId);
    this.units$ = this.store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.tenants$ = this.store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId));
    this.history$ = this.propertyDataService.getPropertyHistory(this.propertyId);
    this.loadingStates$ = this.propertyDataService.getLoadingStates();

    // Mettre à jour les compteurs des onglets
    this.updateTabCounts();
  }

  private updateTabCounts(): void {
    // Mettre à jour les compteurs des onglets basés sur les données
    this.units$.pipe(takeUntil(this.destroy$)).subscribe(units => {
      const unitsTab = this.tabs.find(tab => tab.id === 'units');
      if (unitsTab) unitsTab.count = units.length;

      // Calculer les métriques
      this.calculateMetrics(units);
    });

    this.tenants$.pipe(takeUntil(this.destroy$)).subscribe(tenants => {
      const tenantsTab = this.tabs.find(tab => tab.id === 'tenants');
      if (tenantsTab) tenantsTab.count = tenants.length;
    });

    this.history$.pipe(takeUntil(this.destroy$)).subscribe(history => {
      const historyTab = this.tabs.find(tab => tab.id === 'history');
      if (historyTab) historyTab.count = history.length;
    });
  }

  private calculateMetrics(units: RoomModel[]): void {
    const totalUnits = units.length;
    const occupiedUnits = units.filter(unit => !unit.isFree).length;
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Calculer le revenu mensuel total
    const monthlyRevenue = units.reduce((total, unit) => {
      return total + (!unit.isFree ? (unit.price || 0) : 0);
    }, 0);

    // Calculer le loyer moyen
    const averageRent = occupiedUnits > 0 ? monthlyRevenue / occupiedUnits : 0;

    this.metrics = {
      totalUnits,
      occupiedUnits,
      availableUnits,
      occupancyRate,
      monthlyRevenue,
      averageRent,
      revenueGrowth: 5.2 // Valeur simulée pour l'instant
    };
  }

  // Gestion des onglets
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Gestionnaires d'événements pour les composants enfants
  onUnitAction(action: UnitAction): void {
    switch (action.type) {
      case 'view':
        this.onViewUnit(action.room);
        break;
      case 'edit':
        this.onEditUnit(action.room);
        break;
      case 'assign_tenant':
        this.onAssignTenant(action.room);
        break;
      case 'terminate_lease':
        this.onTerminateLease(action.room);
        break;
      case 'manage_media':
        this.onManageMedia(action.room);
        break;
      case 'toggle_status':
        this.onToggleStatus(action.room);
        break;
      case 'edit_galery':
        this.onEditGaleryUnit(action.room);
        break;
    }
  }

  onAddUnit(): void {
    console.log('Ajouter une nouvelle unité');
    // TODO: Implémenter l'ajout d'unité
    // Navigation vers le formulaire d'ajout ou ouverture d'un modal
  }

  // Actions sur les unités
  private onViewUnit(room: RoomModel): void {
    console.log('Voir les détails de l\'unité:', room);
    this.router.navigate(['/main/rooms', room._id]);
  }

  private onEditUnit(room: RoomModel): void {
    console.log('Modifier l\'unité:', room);
    // TODO: Navigation vers le formulaire d'édition
  }

  private onAssignTenant(room: RoomModel): void {
    console.log('Assigner un locataire à l\'unité:', room);
    // TODO: Ouvrir le modal d'assignation de locataire
  }

  private onTerminateLease(room: RoomModel): void {
    console.log('Résilier le contrat de l\'unité:', room);
    // TODO: Ouvrir le modal de résiliation
  }

  private onManageMedia(room: RoomModel): void {
    console.log('Gérer les médias de l\'unité:', room);
    // TODO: Ouvrir le gestionnaire de médias
  }

  private onToggleStatus(room: RoomModel): void {
    console.log('Changer le statut de l\'unité:', room);
    // TODO: Implémenter le changement de statut
  }

  private onEditGaleryUnit(room:RoomModel): void {
    console.log("On Edit Gaeleyr")
    const dialogRef = this.dialog.open(GaleryComponent, {
          width: '900px',
          maxWidth: '95vw',
          height: '90vh',
          maxHeight: '90vh',
          panelClass: 'property-form-dialog',
          disableClose: true,
          data: {room}
        });
  }

  // Actions générales
  onEditProperty(): void {
    this.property$.pipe(takeUntil(this.destroy$)).subscribe(property => {
      if (property) {
        const dialogData: UpdatePropertyDialogData = {
          property: property
        };

        const dialogRef = this.dialog.open(UpdatePropertyComponent, {
          width: '900px',
          maxWidth: '95vw',
          height: '90vh',
          maxHeight: '90vh',
          panelClass: 'property-form-dialog',
          disableClose: true,
          data: dialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('Propriété mise à jour avec succès');
            // Recharger les données pour refléter les changements
            this.refreshData();
          }
        });
      }
    });
  }

  onAddTenant(): void {
    console.log('Ajouter un locataire');
    // TODO: Navigation vers l'ajout de locataire
  }

  goBack(): void {
    this.router.navigate(['/app/properties/home']);
  }

  // Méthodes utilitaires pour les templates
  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }

  getTabIcon(iconName: string): string {
    // Mapper les noms d'icônes aux icônes IBM Carbon
    const iconMap: { [key: string]: string } = {
      'home': 'home',
      'building': 'building',
      'user': 'user',
      'time': 'time',
      'money': 'currency-dollar'
    };
    return iconMap[iconName] || iconName;
  }

  // Méthodes de formatage
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  // Méthodes pour les actions rapides depuis l'overview
  onQuickAction(actionType: string): void {
    switch (actionType) {
      case 'add_unit':
        this.onAddUnit();
        break;
      case 'add_tenant':
        this.onAddTenant();
        break;
      case 'financial_report':
        this.generateFinancialReport();
        break;
      case 'schedule_maintenance':
        this.scheduleMaintenance();
        break;
      default:
        console.log('Action non reconnue:', actionType);
    }
  }

  private generateFinancialReport(): void {
    console.log('Générer un rapport financier');
    // TODO: Implémenter la génération de rapport
  }

  private scheduleMaintenance(): void {
    console.log('Planifier une maintenance');
    // TODO: Implémenter la planification de maintenance
  }

  // Méthodes pour la gestion des erreurs
  onError(error: any): void {
    console.error('Erreur dans PropertyDetailsComplete:', error);
    // TODO: Afficher un message d'erreur à l'utilisateur
  }

  // Méthodes pour le rechargement des données
  refreshData(): void {
    if (this.propertyId) {
      this.initializeSubscriptions();
    }
  }

  // Méthodes pour l'export de données
  exportData(format: 'pdf' | 'excel' | 'csv'): void {
    console.log('Exporter les données au format:', format);
    // TODO: Implémenter l'export de données
  }
}
