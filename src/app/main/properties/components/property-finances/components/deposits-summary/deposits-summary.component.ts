import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticRoomYearModel,
  LocationModel,
  LocationState,
  LocataireModel,
  LocataireState,
  LocationPaymentModel,
  LocationPaymentState,
  LocationPaymentType
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';

export interface DepositSummary {
  roomId: string;
  roomCode: string;
  roomType: string;
  roomPrice: number;
  expectedDeposit: number;
  receivedDeposit: number;
  depositRate: number;
  tenantName?: string;
  status: 'complete' | 'partial' | 'missing' | 'no_tenant';
}

@Component({
  selector: 'app-deposits-summary',
  templateUrl: './deposits-summary.component.html',
  styleUrls: ['./deposits-summary.component.scss']
})
export class DepositsSummaryComponent implements OnInit, OnChanges {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = ''; // Ajout pour récupérer les données
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  // Données du store
  locations: LocationModel[] = [];
  tenants: LocataireModel[] = [];
  payments: LocationPaymentModel[] = [];

  depositSummaries: DepositSummary[] = [];
  filteredSummaries: DepositSummary[] = [];

  // Filtres
  statusFilter: 'all' | 'complete' | 'partial' | 'missing' | 'no_tenant' = 'all';
  searchTerm: string = '';

  // Statistiques globales
  globalStats = {
    totalRooms: 0,
    totalExpectedDeposits: 0,
    totalReceivedDeposits: 0,
    completeDeposits: 0,
    partialDeposits: 0,
    missingDeposits: 0,
    noTenantRooms: 0,
    averageDepositRate: 0
  };

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.loadStoreData();
  }

  ngOnChanges(): void {
    this.loadStoreData();
  }

  private loadStoreData(): void {
    // Récupérer les données depuis le store
    this.locations = this.store.selectSnapshot(LocationState.selectStateLocations) || [];
    this.tenants = this.store.selectSnapshot(LocataireState.selectStateLocataires) || [];
    this.payments = this.store.selectSnapshot(LocationPaymentState.selectStateLocationPayments) || [];
    this.processDepositData();
  }

  private processDepositData(): void {
    console.log('🛡️ CAUTIONS - Traitement des données de caution pour', this.yearlyStats.length, 'chambres');
    
    this.depositSummaries = [];
    let processedCount = 0;
    let errorCount = 0;

    this.yearlyStats.forEach((roomStat, index) => {
      try {
        const roomPrice = roomStat.room?.price || 0;
        const roomId = roomStat.room?._id || '';
        const roomCode = roomStat.room?.code || `Room_${index + 1}`;

        if (roomPrice <= 0) {
          console.warn(`⚠️ Prix invalide pour la chambre ${roomCode}:`, roomPrice);
          errorCount++;
          return;
        }

        // Trouver la location active avec validation
        const activeLocation = this.locations.find(loc =>
          loc.room === roomId &&
          loc.isRunning === true &&
          loc.startedAt // Vérifier que la date de début existe
        );

        // Trouver le locataire actuel
        const currentTenant = activeLocation ?
          this.tenants.find(tenant => tenant._id === activeLocation.locataire) :
          null;

        // Calculer les cautions avec validation
        const expectedDeposit = this.calculateExpectedDeposit(roomPrice, roomStat.room);
        const receivedDeposit = this.calculateReceivedDeposit(activeLocation, currentTenant, roomPrice);
        
        // Validation des montants
        if (expectedDeposit < 0 || receivedDeposit < 0) {
          console.warn(`⚠️ Montants de caution invalides pour ${roomCode}`);
          errorCount++;
          return;
        }
        
        const depositRate = expectedDeposit > 0 ? 
          Math.round((receivedDeposit / expectedDeposit) * 100 * 100) / 100 : 0;

        const depositSummary: DepositSummary = {
          roomId,
          roomCode,
          roomType: this.getRoomTypeLabel(roomStat.room?.type),
          roomPrice,
          expectedDeposit: Math.round(expectedDeposit * 100) / 100,
          receivedDeposit: Math.round(receivedDeposit * 100) / 100,
          depositRate,
          tenantName: currentTenant?.fullName,
          status: this.determineDepositStatus(depositRate, currentTenant?.fullName, activeLocation)
        };

        // Validation finale
        if (this.validateDepositSummary(depositSummary)) {
          this.depositSummaries.push(depositSummary);
          processedCount++;
        } else {
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de la chambre ${index + 1}:`, error);
        errorCount++;
      }
    });

    console.log(`✅ Traitement des cautions terminé: ${processedCount} chambres traitées, ${errorCount} erreurs`);

    this.calculateGlobalStats();
    this.applyFilters();
  }

  private validateDepositSummary(summary: DepositSummary): boolean {
    // Validation des données de caution
    if (summary.depositRate > 200) {
      console.warn(`⚠️ Taux de caution anormal: ${summary.depositRate}% pour ${summary.roomCode}`);
      summary.depositRate = Math.min(summary.depositRate, 200);
    }
    
    if (summary.receivedDeposit > summary.expectedDeposit * 2) {
      console.warn(`⚠️ Caution reçue anormalement élevée pour ${summary.roomCode}`);
    }
    
    return true;
  }

  private calculateExpectedDeposit(roomPrice: number, room: any): number {
    // Logique améliorée pour le calcul de la caution attendue
    if (room?.cautionPrice && room.cautionPrice > 0) {
      return room.cautionPrice;
    }
    
    // Par défaut: 2 mois de loyer (standard du marché)
    const defaultDeposit = roomPrice * 2;
    
    // Validation: la caution ne peut pas être inférieure au loyer mensuel
    return Math.max(defaultDeposit, roomPrice);
  }

  private calculateReceivedDeposit(location: LocationModel | undefined, tenant: LocataireModel | null, roomPrice: number): number {
    if (!location || !tenant) return 0;

    try {
      // Chercher les paiements de caution pour cette location avec validation
      const cautionPayments = this.payments.filter(payment =>
        payment.location === location._id &&
        payment.paymentLocationType === LocationPaymentType.CAUTION &&
        payment.locationPaymentPrice > 0 // Exclure les montants négatifs ou nuls
      );

      // Calculer le total avec validation
      const totalCautionReceived = cautionPayments.reduce((sum, payment) => {
        const amount = payment.locationPaymentPrice || 0;
        
        // Validation: un paiement de caution ne devrait pas dépasser 5 mois de loyer
        if (amount > roomPrice * 5) {
          console.warn(`⚠️ Paiement de caution anormalement élevé: ${amount} pour un loyer de ${roomPrice}`);
          return sum + Math.min(amount, roomPrice * 5);
        }
        
        return sum + amount;
      }, 0);

      console.log(`💰 Caution calculée pour ${location._id}: ${totalCautionReceived} FCFA (${cautionPayments.length} paiements)`);
      
      return Math.round(totalCautionReceived * 100) / 100;
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul de la caution reçue:', error);
      return 0;
    }
  }

  private determineDepositStatus(
    depositRate: number,
    tenantName?: string,
    location?: LocationModel
  ): DepositSummary['status'] {
    // Vérifier d'abord s'il y a un locataire
    if (!tenantName || !location) return 'no_tenant';
    
    // Vérifier si le contrat est actif
    if (!location.isRunning) return 'no_tenant';

    // Logique améliorée pour déterminer le statut
    if (depositRate >= 100) {
      return 'complete'; // Caution complète
    } else if (depositRate >= 50) {
      return 'partial'; // Caution partielle (au moins 50%)
    } else if (depositRate > 0) {
      return 'partial'; // Caution partielle (moins de 50%)
    } else {
      return 'missing'; // Aucune caution
    }
  }

  private calculateGlobalStats(): void {
    console.log('📊 Calcul des statistiques globales des cautions');
    
    const totalRooms = this.depositSummaries.length;
    const totalExpectedDeposits = this.depositSummaries.reduce((sum, d) => sum + d.expectedDeposit, 0);
    const totalReceivedDeposits = this.depositSummaries.reduce((sum, d) => sum + d.receivedDeposit, 0);
    
    // Compter par statut
    const completeDeposits = this.depositSummaries.filter(d => d.status === 'complete').length;
    const partialDeposits = this.depositSummaries.filter(d => d.status === 'partial').length;
    const missingDeposits = this.depositSummaries.filter(d => d.status === 'missing').length;
    const noTenantRooms = this.depositSummaries.filter(d => d.status === 'no_tenant').length;
    
    // Calculer la moyenne seulement pour les chambres avec locataires
    const roomsWithTenants = this.depositSummaries.filter(d => d.status !== 'no_tenant');
    const averageDepositRate = roomsWithTenants.length > 0 
      ? Math.round((roomsWithTenants.reduce((sum, d) => sum + d.depositRate, 0) / roomsWithTenants.length) * 100) / 100
      : 0;
    
    this.globalStats = {
      totalRooms,
      totalExpectedDeposits: Math.round(totalExpectedDeposits * 100) / 100,
      totalReceivedDeposits: Math.round(totalReceivedDeposits * 100) / 100,
      completeDeposits,
      partialDeposits,
      missingDeposits,
      noTenantRooms,
      averageDepositRate
    };
    
    // Validation des statistiques
    const totalCategorized = completeDeposits + partialDeposits + missingDeposits + noTenantRooms;
    if (totalCategorized !== totalRooms) {
      console.warn('⚠️ Incohérence dans la catégorisation des cautions:', {
        totalRooms,
        totalCategorized
      });
    }
    
    console.log('✅ Statistiques globales calculées:', {
      totalRooms,
      completeRate: `${((completeDeposits / Math.max(roomsWithTenants.length, 1)) * 100).toFixed(1)}%`,
      averageRate: `${averageDepositRate.toFixed(1)}%`,
      totalExpected: totalExpectedDeposits.toLocaleString(),
      totalReceived: totalReceivedDeposits.toLocaleString()
    });
  }

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    this.filteredSummaries = this.depositSummaries.filter(deposit => {
      // Filtre par statut
      if (this.statusFilter !== 'all' && deposit.status !== this.statusFilter) {
        return false;
      }

      // Filtre par recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!deposit.roomCode.toLowerCase().includes(searchLower) && 
            !deposit.tenantName?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // === MÉTHODES D'EXPORT AMÉLIORÉES ===

  onExportDepositSummary(): void {
    const exportData = this.filteredSummaries.map(deposit => ({
      'Code chambre': deposit.roomCode,
      'Type': deposit.roomType,
      'Loyer mensuel': deposit.roomPrice,
      'Caution attendue': deposit.expectedDeposit,
      'Caution reçue': deposit.receivedDeposit,
      'Taux de caution': `${deposit.depositRate.toFixed(1)}%`,
      'Montant manquant': Math.max(0, deposit.expectedDeposit - deposit.receivedDeposit),
      'Locataire': deposit.tenantName || 'Aucun',
      'Statut': this.getStatusLabel(deposit.status),
      'Année': this.selectedYear,
      'Date export': new Date().toLocaleDateString('fr-FR')
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `recapitulatif-cautions-${this.selectedYear}`
    });
  }
  
  onExportGlobalStats(): void {
    const statsData = [{
      'Total chambres': this.globalStats.totalRooms,
      'Cautions complètes': this.globalStats.completeDeposits,
      'Cautions partielles': this.globalStats.partialDeposits,
      'Cautions manquantes': this.globalStats.missingDeposits,
      'Chambres libres': this.globalStats.noTenantRooms,
      'Total attendu': this.globalStats.totalExpectedDeposits,
      'Total reçu': this.globalStats.totalReceivedDeposits,
      'Taux moyen': `${this.globalStats.averageDepositRate.toFixed(1)}%`,
      'Taux de complétion': `${((this.globalStats.completeDeposits / Math.max(this.globalStats.totalRooms - this.globalStats.noTenantRooms, 1)) * 100).toFixed(1)}%`,
      'Année': this.selectedYear
    }];
    
    this.exportData.emit({
      type: 'excel',
      data: statsData,
      filename: `statistiques-cautions-${this.selectedYear}`
    });
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

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getRoomTypeLabel(type: string): string {
    switch (type) {
      case 'room': return 'Chambre';
      case 'studio': return 'Studio';
      case 'simple_apartment': return 'Appartement';
      case 'furnished_apartment': return 'App. Meublé';
      default: return 'Inconnu';
    }
  }

  getStatusLabel(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'Complète';
      case 'partial': return 'Partielle';
      case 'missing': return 'Manquante';
      case 'no_tenant': return 'Pas de locataire';
      default: return 'Inconnu';
    }
  }

  getStatusColor(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'no_tenant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'partial': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'missing': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'no_tenant': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  trackByRoomId(_: number, deposit: DepositSummary): string {
    return deposit.roomId;
  }
  
  // Méthodes d'analyse avancée
  getDepositCompletionRate(): number {
    const roomsWithTenants = this.depositSummaries.filter(d => d.status !== 'no_tenant').length;
    if (roomsWithTenants === 0) return 0;
    return Math.round((this.globalStats.completeDeposits / roomsWithTenants) * 100 * 100) / 100;
  }
  
  getAverageDepositAmount(): number {
    const roomsWithDeposits = this.depositSummaries.filter(d => d.receivedDeposit > 0);
    if (roomsWithDeposits.length === 0) return 0;
    const total = roomsWithDeposits.reduce((sum, d) => sum + d.receivedDeposit, 0);
    return Math.round((total / roomsWithDeposits.length) * 100) / 100;
  }
  
  getTotalMissingDeposits(): number {
    return this.depositSummaries.reduce((total, deposit) => {
      if (deposit.status !== 'no_tenant' && deposit.status !== 'complete') {
        return total + Math.max(0, deposit.expectedDeposit - deposit.receivedDeposit);
      }
      return total;
    }, 0);
  }
  
  getDepositHealthScore(): number {
    // Score de santé des cautions (0-100)
    const completionRate = this.getDepositCompletionRate();
    const averageRate = this.globalStats.averageDepositRate;
    
    // Pondération: 60% taux de complétion, 40% taux moyen
    return Math.round((completionRate * 0.6 + averageRate * 0.4) * 100) / 100;
  }

  // Propriété Math pour les templates
  Math = Math;
}
