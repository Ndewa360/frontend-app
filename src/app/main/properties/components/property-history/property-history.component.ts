import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import {
  LocationPaymentModel,
  LocationPaymentState,
  LocationPaymentType,
  LocataireModel,
  LocataireState,
  RoomModel,
  RoomState,
  HistoryLocationPaymentState,
  HistoryLocationPaymentModel,
  PropertyModel,
  PropertyState
} from 'src/app/shared/store';
import { ModernPaymentModalComponent } from '../modern-payment-modal/modern-payment-modal.component';
import { ModernDeletePaymentModalComponent } from '../modern-delete-payment-modal/modern-delete-payment-modal.component';
import { PaymentReceiptModalComponent } from '../payment-receipt-modal/payment-receipt-modal.component';
import { ExportService, ExportColumn } from '../../services/export.service';

interface PaymentHistoryItem {
  id: string;
  date: Date;
  type: LocationPaymentType;
  amount: number;
  tenant: LocataireModel | null;
  room: RoomModel | null;
  reference: string;
  reason?: string;
  createdAt: Date;
  rawPayment: LocationPaymentModel;
}

interface FilterOptions {
  type: LocationPaymentType | 'ALL';
  tenantId: string;
  roomId: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  period: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  amountRange: {
    min: number | null;
    max: number | null;
  };
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  averageAmount: number;
  locationPayments: number;
  cautionPayments: number;
  locationAmount: number;
  cautionAmount: number;
  uniqueTenants: number;
  uniqueRooms: number;
}

@Component({
  selector: 'app-property-history',
  templateUrl: './property-history.component.html',
  styleUrls: ['./property-history.component.scss']
})
export class PropertyHistoryComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propertyId: string = '';
  @Input() history: any[] = []; // Garde pour compatibilité mais on n'utilise pas
  @Input() loading: boolean = false;

  // Données
  allPayments: LocationPaymentModel[] = [];
  paymentHistory: PaymentHistoryItem[] = [];
  filteredHistory: PaymentHistoryItem[] = [];
  tenants: LocataireModel[] = [];
  rooms: RoomModel[] = [];
  property: PropertyModel | null = null;

  // Filtres
  filters: FilterOptions = {
    type: 'ALL',
    tenantId: '',
    roomId: '',
    dateRange: {
      start: null,
      end: null
    },
    period: 'all',
    amountRange: {
      min: null,
      max: null
    }
  };

  // État
  isFiltersExpanded: boolean = false;
  viewMode: 'list' | 'grid' | 'timeline' = 'list';
  sortBy: 'date' | 'amount' | 'tenant' | 'room' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Statistiques
  stats: PaymentStats = {
    totalPayments: 0,
    totalAmount: 0,
    averageAmount: 0,
    locationPayments: 0,
    cautionPayments: 0,
    locationAmount: 0,
    cautionAmount: 0,
    uniqueTenants: 0,
    uniqueRooms: 0
  };

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;

  private destroy$ = new Subject<void>();

  // Propriété Math pour les templates
  Math = Math;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPropertyData();
    this.loadData();
  }

  /**
   * Charger les données de la propriété
   */
  private loadPropertyData(): void {
    if (this.propertyId) {
      this.property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] && this.propertyId) {
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTHODES DE CHARGEMENT DES DONNÉES ===

  private loadData(): void {
    if (!this.propertyId) return;

    // Charger les paiements
    this.store.select(LocationPaymentState.selectStateLocationPaymentByPropertyId(this.propertyId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((payments: LocationPaymentModel[]) => {
        this.allPayments = payments || [];
        this.buildPaymentHistory();
      });

    // Charger les locataires
    this.store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((tenants: LocataireModel[]) => {
        this.tenants = tenants || [];
        this.buildPaymentHistory();
      });

    // Charger les chambres
    this.store.select(RoomState.selectStateRoomByPropertyId(this.propertyId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((rooms: RoomModel[]) => {
        this.rooms = rooms || [];
        this.buildPaymentHistory();
      });
  }

  private buildPaymentHistory(): void {
    if (!this.allPayments.length) {
      this.paymentHistory = [];
      this.applyFilters();
      return;
    }

    this.paymentHistory = this.allPayments
      .map(payment => {
        const tenant = this.tenants.find(t => t._id === payment.locataire) || null;
        const room = this.rooms.find(r => r._id === payment.room) || null;
        return {
          id: payment._id || '',
          date: new Date(payment.datePayment),
          type: payment.paymentLocationType,
          amount: payment.locationPaymentPrice || 0,
          tenant,
          room,
          reference: payment.billingRef || '',
          reason: payment.reason,
          createdAt: new Date(payment.createdAt || payment.datePayment),
          rawPayment: payment
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    this.applyFilters();
    this.calculateStats();
  }

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    let filtered = [...this.paymentHistory];

    // Filtre par type
    if (this.filters.type !== 'ALL') {
      filtered = filtered.filter(item => item.type === this.filters.type);
    }

    // Filtre par locataire
    if (this.filters.tenantId) {
      filtered = filtered.filter(item => item.tenant?._id === this.filters.tenantId);
    }

    // Filtre par chambre
    if (this.filters.roomId) {
      filtered = filtered.filter(item => item.room?._id === this.filters.roomId);
    }

    // Filtre par période
    filtered = this.applyPeriodFilter(filtered);

    // Filtre par plage de dates personnalisée
    if (this.filters.dateRange.start) {
      filtered = filtered.filter(item => item.date >= this.filters.dateRange.start!);
    }
    if (this.filters.dateRange.end) {
      filtered = filtered.filter(item => item.date <= this.filters.dateRange.end!);
    }

    // Filtre par montant
    if (this.filters.amountRange.min !== null) {
      filtered = filtered.filter(item => item.amount >= this.filters.amountRange.min!);
    }
    if (this.filters.amountRange.max !== null) {
      filtered = filtered.filter(item => item.amount <= this.filters.amountRange.max!);
    }

    this.filteredHistory = filtered;
    this.applySorting();
    this.updatePagination();
    this.calculateStats();
  }

  private applyPeriodFilter(items: PaymentHistoryItem[]): PaymentHistoryItem[] {
    if (this.filters.period === 'all' || this.filters.period === 'custom') {
      return items;
    }

    const now = new Date();
    let startDate: Date;

    switch (this.filters.period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return items;
    }

    return items.filter(item => item.date >= startDate);
  }

  private applySorting(): void {
    this.filteredHistory.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'tenant':
          const tenantA = a.tenant?.fullName || '';
          const tenantB = b.tenant?.fullName || '';
          comparison = tenantA.localeCompare(tenantB);
          break;
        case 'room':
          const roomA = a.room?.code || '';
          const roomB = b.room?.code || '';
          comparison = roomA.localeCompare(roomB);
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  private calculateStats(): void {
    const locationPayments = this.filteredHistory.filter(item => item.type === 'LOCATION');
    const cautionPayments = this.filteredHistory.filter(item => item.type === 'CAUTION');

    this.stats = {
      totalPayments: this.filteredHistory.length,
      totalAmount: this.filteredHistory.reduce((sum, item) => sum + item.amount, 0),
      averageAmount: this.filteredHistory.length > 0
        ? this.filteredHistory.reduce((sum, item) => sum + item.amount, 0) / this.filteredHistory.length
        : 0,
      locationPayments: locationPayments.length,
      cautionPayments: cautionPayments.length,
      locationAmount: locationPayments.reduce((sum, item) => sum + item.amount, 0),
      cautionAmount: cautionPayments.reduce((sum, item) => sum + item.amount, 0),
      uniqueTenants: new Set(this.filteredHistory.map(item => item.tenant?._id).filter(Boolean)).size,
      uniqueRooms: new Set(this.filteredHistory.map(item => item.room?._id).filter(Boolean)).size
    };
  }

  // === MÉTHODES D'ACTIONS ===

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(sortBy: 'date' | 'amount' | 'tenant' | 'room'): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.applySorting();
  }

  onViewModeChange(mode: 'list' | 'grid' | 'timeline'): void {
    this.viewMode = mode;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.updatePagination();
  }

  clearAllFilters(): void {
    this.filters = {
      type: 'ALL',
      tenantId: '',
      roomId: '',
      dateRange: {
        start: null,
        end: null
      },
      period: 'all',
      amountRange: {
        min: null,
        max: null
      }
    };
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleFiltersExpanded(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;
  }



  // Méthodes utilitaires
  getEventTypeLabel(type: string): string {
    const labels = {
      'payment': 'Paiement',
      'maintenance': 'Maintenance',
      'tenant_move_in': 'Emménagement',
      'tenant_move_out': 'Déménagement',
      'contract_renewal': 'Renouvellement'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getEventIcon(type: string): string {
    const icons = {
      'payment': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      'maintenance': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'tenant_move_in': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'tenant_move_out': 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6',
      'contract_renewal': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[type as keyof typeof icons] || '';
  }

  getUnitName(unitId: string): string {
    // Cette méthode devrait récupérer le nom de l'unité depuis le store ou un service
    // Pour l'instant, on retourne un nom générique
    return `Unité ${unitId.slice(-4)}`;
  }

  getTenantName(tenantId: string): string {
    // Cette méthode devrait récupérer le nom du locataire depuis le store ou un service
    // Pour l'instant, on retourne un nom générique
    return `Locataire ${tenantId.slice(-4)}`;
  }

  // === MÉTHODES UTILITAIRES ===

  formatPrice(price: number | null | undefined): string {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }



  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeLabel(type: LocationPaymentType): string {
    switch (type) {
      case 'LOCATION': return 'Loyer';
      case 'CAUTION': return 'Caution';
      default: return type;
    }
  }

  getTypeColor(type: LocationPaymentType): string {
    switch (type) {
      case 'LOCATION': return 'bg-green-100 text-green-800';
      case 'CAUTION': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeIcon(type: LocationPaymentType): string {
    switch (type) {
      case 'LOCATION': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'CAUTION': return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
      default: return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
    }
  }

  getPaginatedItems(): PaymentHistoryItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredHistory.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  trackByPaymentId(_: number, item: PaymentHistoryItem): string {
    return item.id;
  }

  trackByTenantId(_: number, tenant: LocataireModel): string {
    return tenant._id || '';
  }

  trackByRoomId(_: number, room: RoomModel): string {
    return room._id || '';
  }

  hasActiveFilters(): boolean {
    return this.filters.type !== 'ALL' ||
           this.filters.tenantId !== '' ||
           this.filters.roomId !== '' ||
           this.filters.period !== 'all' ||
           this.filters.dateRange.start !== null ||
           this.filters.dateRange.end !== null ||
           this.filters.amountRange.min !== null ||
           this.filters.amountRange.max !== null;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.type !== 'ALL') count++;
    if (this.filters.tenantId) count++;
    if (this.filters.roomId) count++;
    if (this.filters.period !== 'all') count++;
    if (this.filters.dateRange.start || this.filters.dateRange.end) count++;
    if (this.filters.amountRange.min !== null || this.filters.amountRange.max !== null) count++;
    return count;
  }

  getRoomDisplayName(room: RoomModel): string {
    if (!room) return 'Unité inconnue';

    // Utiliser le code de l'unité du modèle RoomModel
    const code = room.code || room._id?.substring(0, 8) || 'N/A';

    // Ajouter le type d'unité pour plus de clarté
    let prefix = 'Unité';
    switch (room.type) {
      case 'room':
        prefix = 'Chambre';
        break;
      case 'studio':
        prefix = 'Studio';
        break;
      case 'simple_apartment':
        prefix = 'Appartement';
        break;
      case 'furnished_apartment':
        prefix = 'App. Meublé';
        break;
    }

    return `${prefix} ${code}`;
  }

  // Export
  exportHistory(): void {
    this.exportHistoryToExcel();
  }

  /**
   * Exporter l'historique en CSV
   */
  exportHistoryToCSV(): void {
    const columns: ExportColumn[] = [
      { key: 'date', label: 'Date', formatter: ExportService.formatters.date },
      { key: 'date', label: 'Heure', formatter: (value) => this.formatTime(value) },
      { key: 'type', label: 'Type', formatter: (value) => this.getTypeLabel(value) },
      { key: 'amount', label: 'Montant', formatter: ExportService.formatters.currency },
      { key: 'reference', label: 'Référence' },
      { key: 'tenant.name', label: 'Locataire' },
      { key: 'room.code', label: 'Unité' },
      { key: 'isPaid', label: 'Statut', formatter: (value) => value ? 'Payé' : 'En attente' }
    ];

    this.exportService.exportToCSV({
      filename: 'Historique_Paiements',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredHistory
    });
  }

  /**
   * Exporter l'historique en Excel
   */
  exportHistoryToExcel(): void {
    const columns: ExportColumn[] = [
      { key: 'date', label: 'Date', formatter: ExportService.formatters.date },
      { key: 'date', label: 'Heure', formatter: (value) => this.formatTime(value) },
      { key: 'type', label: 'Type', formatter: (value) => this.getTypeLabel(value) },
      { key: 'amount', label: 'Montant', formatter: ExportService.formatters.currency },
      { key: 'reference', label: 'Référence' },
      { key: 'tenant.name', label: 'Locataire' },
      { key: 'room.code', label: 'Unité' },
      { key: 'isPaid', label: 'Statut', formatter: (value) => value ? 'Payé' : 'En attente' }
    ];

    this.exportService.exportToExcel({
      filename: 'Historique_Paiements',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredHistory
    });
  }




  // === MÉTHODES POUR LES MODALS DE PAIEMENT ===

  /**
   * Construit les données de paiement nécessaires pour les modals
   */
  private buildPaymentModalData(payment: PaymentHistoryItem): {
    transaction: any,
    history: any,
    room: any,
    tenant: any,
    location: any
  } {
    // Construire l'objet history avec les données nécessaires
    const history = {
      _id: `history_${payment.tenant?._id || 'unknown'}`,
      locataire: payment.tenant,
      room: payment.room,
      property: { _id: this.propertyId },
      transactions: [payment.rawPayment]
    };

    // Construire l'objet location si nécessaire
    const location = {
      _id: payment.rawPayment?.location || `temp_location_${payment.tenant?._id}`,
      room: payment.room?._id,
      locataire: payment.tenant?._id,
      property: this.propertyId,
      startDate: payment.rawPayment?.datePayment || new Date(),
      monthlyRent: payment.room?.price || 0
    };

    return {
      transaction: payment.rawPayment,
      history: history,
      room: payment.room,
      tenant: payment.tenant,
      location: location
    };
  }

  /**
   * Affiche le reçu d'un paiement
   */
  onViewReceipt(payment: PaymentHistoryItem): void {
    if (!payment?.rawPayment || !this.dialog) return;
    const owner = this.store.selectSnapshot((state: any) => state.userprofile?.userProfile);
    // Récupérer la location et tous les paiements du locataire pour calculer la période
    const locations = this.store.selectSnapshot((state: any) => state.location?.locations || []) as any[];
    const location = locations.find((loc: any) =>
      loc.locataire === payment.rawPayment.locataire &&
      loc.room === payment.rawPayment.room
    ) || null;
    const allPayments = this.allPayments.filter(p =>
      p.locataire === payment.rawPayment.locataire &&
      p.room === payment.rawPayment.room
    );
    this.dialog.open(PaymentReceiptModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        payment: payment.rawPayment,
        tenant: payment.tenant ? { fullName: payment.tenant.fullName, email: payment.tenant.email || payment.tenant.emailRef, phoneNumber: payment.tenant.phoneNumber || payment.tenant.phoneNumberRef } : null,
        room: payment.room ? { code: payment.room.code, price: payment.room.price, type: payment.room.type } : null,
        owner: owner ? { name: owner.name || owner.fullName, email: owner.email, phoneNumber: owner.phoneNumber } : null,
        propertyName: this.property?.name,
        location,
        allPayments,
      }
    });
  }

  /**
   * Affiche les détails d'un paiement
   */
  onViewPayment(payment: PaymentHistoryItem): void {
    console.log('👁️ PropertyHistory: onViewPayment appelé', payment);

    if (!payment?.rawPayment) {
      console.error('❌ Données de paiement manquantes pour la visualisation');
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    // Ici vous pouvez ouvrir un modal de détails ou naviguer vers une page de détails
    // Pour l'instant, on affiche juste les informations dans la console
    this.toastr.info(`Paiement de ${this.formatPrice(payment.amount)} - ${this.getTypeLabel(payment.type)}`, 'Détails du paiement');
  }

  /**
   * Ouvre le modal de modification d'un paiement
   */
  onEditPayment(payment: PaymentHistoryItem): void {
    if (!payment?.rawPayment || !payment?.tenant) {
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) return;

    // Récupérer la location active pour ce locataire/chambre
    const locations = this.store.selectSnapshot(
      (state: any) => state.location?.locations || []
    ) as any[];
    const location = locations.find((loc: any) =>
      loc.locataire === payment.tenant?._id &&
      loc.room === payment.room?._id &&
      loc.isRunning === true
    ) || null;

    try {
      const dialogRef = this.dialog.open(ModernPaymentModalComponent, {
        width: '700px',
        maxWidth: '95vw',
        panelClass: 'payment-modal-dialog',
        disableClose: true,
        data: {
          mode: 'edit',
          transaction: payment.rawPayment,
          room: payment.room,
          tenant: payment.tenant,
          location
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Paiement modifié avec succès', 'Succès');
          this.loadData();
        }
      });
    } catch (error) {
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  /**
   * Ouvre le modal de suppression d'un paiement
   */
  onDeletePayment(payment: PaymentHistoryItem): void {
    console.log('🗑️ PropertyHistory: onDeletePayment appelé', payment);

    if (!payment?.rawPayment || !payment?.tenant) {
      console.error('❌ Données de paiement manquantes pour la suppression');
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Construire les données nécessaires pour le modal
    const paymentData = this.buildPaymentModalData(payment);

    console.log('🗑️ Ouverture du modal ModernDeletePaymentModalComponent...');

    try {
      const dialogRef = this.dialog.open(ModernDeletePaymentModalComponent, {
        width: '500px',
        maxWidth: '95vw',
        panelClass: 'delete-payment-modal-dialog',
        disableClose: true,
        data: {
          transaction: paymentData.transaction,
          history: paymentData.history
        }
      });

      console.log('✅ Modal DeletePayment ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal DeletePayment fermé avec résultat:', result);
        if (result) {
          console.log('✅ Paiement supprimé avec succès');
          this.toastr.success('Paiement supprimé avec succès', 'Succès');
          // Recharger les données
          this.loadData();
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal DeletePayment:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  // === MÉTHODES UTILITAIRES ===

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }





  getPaymentTypeLabel(type: LocationPaymentType): string {
    switch (type) {
      case LocationPaymentType.LOCATION:
        return 'Loyer';
      case LocationPaymentType.CAUTION:
        return 'Caution';
      default:
        return 'Autre';
    }
  }

  getPaymentTypeColor(type: LocationPaymentType): string {
    switch (type) {
      case LocationPaymentType.LOCATION:
        return 'text-green-600 bg-green-100';
      case LocationPaymentType.CAUTION:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
}
