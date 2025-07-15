import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, ActionSheetController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Store
import { ContractState, ContractAction } from '../../../../../shared/store';
import { MobileNotificationService } from '../../../../shared/services/mobile-notification.service';
import { MobileCacheService } from '../../../../shared/services/mobile-cache.service';

@Component({
  selector: 'app-mobile-contracts-list-page',
  templateUrl: './mobile-contracts-list-page.component.html',
  styleUrls: ['./mobile-contracts-list-page.component.scss']
})
export class MobileContractsListPageComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  private destroy$ = new Subject<void>();

  // Observables du store
  contracts$ = this.store.select(ContractState.selectStateContracts);
  isLoading$ = this.store.select(ContractState.selectStateLoading);

  // État local
  contracts: any[] = [];
  filteredContracts: any[] = [];
  searchTerm = '';
  selectedFilter = 'all';

  filterOptions = [
    { value: 'all', label: 'Tous', icon: 'document-text', count: 0 },
    { value: 'active', label: 'Actifs', icon: 'checkmark-circle', count: 0 },
    { value: 'pending', label: 'En attente', icon: 'time', count: 0 },
    { value: 'expired', label: 'Expirés', icon: 'alert-circle', count: 0 },
    { value: 'terminated', label: 'Résiliés', icon: 'close-circle', count: 0 }
  ];

  constructor(
    private store: Store,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private notificationService: MobileNotificationService,
    private cacheService: MobileCacheService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
    this.setupSubscriptions();
    this.loadCachedData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les contrats
   */
  private loadContracts(): void {
    // TODO: Implémenter l'action FetchContracts ou utiliser FetchContract avec un ID
    // this.store.dispatch(new ContractAction.FetchContract(''));
    console.log('Chargement des contrats - à implémenter');
  }

  /**
   * Configurer les abonnements
   */
  private setupSubscriptions(): void {
    this.contracts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(contracts => {
        if (contracts) {
          this.contracts = contracts;
          this.updateFilterCounts();
          this.applyFilters();
          this.cacheContracts(contracts);
        }
      });
  }

  /**
   * Charger les données mises en cache
   */
  private async loadCachedData(): Promise<void> {
    try {
      const cachedContracts = await this.cacheService.get<any[]>('user_contracts');
      if (cachedContracts && cachedContracts.length > 0) {
        this.contracts = cachedContracts;
        this.updateFilterCounts();
        this.applyFilters();
        console.log('📦 Contrats chargés depuis le cache');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du cache:', error);
    }
  }

  /**
   * Mettre en cache les contrats
   */
  private async cacheContracts(contracts: any[]): Promise<void> {
    try {
      await this.cacheService.set('user_contracts', contracts, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      console.error('❌ Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Mettre à jour les compteurs de filtres
   */
  private updateFilterCounts(): void {
    this.filterOptions.forEach(filter => {
      switch (filter.value) {
        case 'all':
          filter.count = this.contracts.length;
          break;
        case 'active':
          filter.count = this.contracts.filter(c => this.getContractStatus(c) === 'active').length;
          break;
        case 'pending':
          filter.count = this.contracts.filter(c => this.getContractStatus(c) === 'pending').length;
          break;
        case 'expired':
          filter.count = this.contracts.filter(c => this.getContractStatus(c) === 'expired').length;
          break;
        case 'terminated':
          filter.count = this.contracts.filter(c => this.getContractStatus(c) === 'terminated').length;
          break;
      }
    });
  }

  /**
   * Appliquer les filtres
   */
  private applyFilters(): void {
    let filtered = [...this.contracts];

    // Filtrer par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.tenant?.firstName?.toLowerCase().includes(term) ||
        contract.tenant?.lastName?.toLowerCase().includes(term) ||
        contract.property?.name?.toLowerCase().includes(term) ||
        contract.room?.code?.toLowerCase().includes(term)
      );
    }

    // Filtrer par statut
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(contract => 
        this.getContractStatus(contract) === this.selectedFilter
      );
    }

    this.filteredContracts = filtered;
  }

  /**
   * Obtenir le statut d'un contrat
   */
  getContractStatus(contract: any): string {
    if (!contract.startDate || !contract.endDate) return 'pending';

    const now = new Date();
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);

    if (contract.status === 'TERMINATED') return 'terminated';
    if (now < startDate) return 'pending';
    if (now > endDate) return 'expired';
    return 'active';
  }

  /**
   * Rechercher
   */
  onSearch(event: any): void {
    this.searchTerm = event.target.value || '';
    this.applyFilters();
  }

  /**
   * Changer le filtre
   */
  onFilterChange(event: any): void {
    this.selectedFilter = event.detail.value;
    this.applyFilters();
  }

  /**
   * Rafraîchir les données
   */
  async onRefresh(event: any): Promise<void> {
    try {
      this.loadContracts();
      
      setTimeout(() => {
        event.target.complete();
        this.notificationService.showSuccess('Contrats actualisés');
      }, 1000);
    } catch (error) {
      event.target.complete();
      this.notificationService.showError('Erreur lors de l\'actualisation');
    }
  }

  /**
   * Aller aux détails d'un contrat
   */
  goToContractDetails(contract: any): void {
    this.router.navigate(['/mobile/contracts', contract._id]);
  }

  /**
   * Créer un nouveau contrat
   */
  createContract(): void {
    this.router.navigate(['/mobile/contracts/create']);
  }

  /**
   * Afficher le menu d'actions pour un contrat
   */
  async showContractActions(contract: any): Promise<void> {
    const status = this.getContractStatus(contract);
    const tenantName = `${contract.tenant?.firstName || ''} ${contract.tenant?.lastName || ''}`.trim();

    const buttons = [
      {
        text: 'Voir les détails',
        icon: 'eye',
        handler: () => this.goToContractDetails(contract)
      },
      {
        text: 'Modifier',
        icon: 'create',
        handler: () => this.editContract(contract)
      }
    ];

    // Actions spécifiques selon le statut
    if (status === 'active') {
      buttons.push({
        text: 'Renouveler',
        icon: 'refresh',
        handler: () => this.renewContract(contract)
      });
      buttons.push({
        text: 'Résilier',
        icon: 'close-circle',
        handler: () => this.terminateContract(contract)
      });
    }

    if (status === 'pending') {
      buttons.push({
        text: 'Activer',
        icon: 'checkmark-circle',
        handler: () => this.activateContract(contract)
      });
    }

    buttons.push(
      {
        text: 'Supprimer',
        icon: 'trash',
        // role: 'destructive', // Propriété non supportée
        handler: () => this.deleteContract(contract)
      },
      {
        text: 'Annuler',
        icon: 'close',
        handler: () => {} // Handler vide pour annuler
      }
    );

    const actionSheet = await this.actionSheetController.create({
      header: `Contrat - ${tenantName}`,
      buttons
    });

    await actionSheet.present();
  }

  /**
   * Modifier un contrat
   */
  editContract(contract: any): void {
    this.router.navigate(['/mobile/contracts/create'], {
      queryParams: { edit: contract._id }
    });
  }

  /**
   * Renouveler un contrat
   */
  async renewContract(contract: any): Promise<void> {
    const confirmed = await this.notificationService.showConfirm(
      'Renouveler le contrat',
      'Voulez-vous créer un nouveau contrat basé sur celui-ci ?',
      'Renouveler',
      'Annuler'
    );

    if (confirmed) {
      this.router.navigate(['/mobile/contracts/create'], {
        queryParams: { renew: contract._id }
      });
    }
  }

  /**
   * Activer un contrat
   */
  async activateContract(contract: any): Promise<void> {
    const confirmed = await this.notificationService.showConfirm(
      'Activer le contrat',
      'Le contrat sera activé et le locataire pourra occuper le logement.',
      'Activer',
      'Annuler'
    );

    if (confirmed) {
      try {
        await this.notificationService.showLoading('Activation en cours...');
        
        // TODO: Implémenter l'action ActivateContract
        // this.store.dispatch(new ContractAction.ActivateContract(contract._id));
        console.log('Activation du contrat:', contract._id);
        
        await this.notificationService.hideLoading();
        await this.notificationService.showSuccess('Contrat activé');
        
      } catch (error) {
        await this.notificationService.hideLoading();
        await this.notificationService.showError('Erreur lors de l\'activation');
      }
    }
  }

  /**
   * Résilier un contrat
   */
  async terminateContract(contract: any): Promise<void> {
    const confirmed = await this.notificationService.showConfirm(
      'Résilier le contrat',
      'Cette action mettra fin au contrat. Le logement sera libéré.',
      'Résilier',
      'Annuler'
    );

    if (confirmed) {
      try {
        await this.notificationService.showLoading('Résiliation en cours...');
        
        // TODO: Implémenter l'action TerminateContract
        // this.store.dispatch(new ContractAction.TerminateContract(contract._id));
        console.log('Résiliation du contrat:', contract._id);
        
        await this.notificationService.hideLoading();
        await this.notificationService.showSuccess('Contrat résilié');
        
      } catch (error) {
        await this.notificationService.hideLoading();
        await this.notificationService.showError('Erreur lors de la résiliation');
      }
    }
  }

  /**
   * Supprimer un contrat
   */
  async deleteContract(contract: any): Promise<void> {
    const tenantName = `${contract.tenant?.firstName || ''} ${contract.tenant?.lastName || ''}`.trim();
    
    const confirmed = await this.notificationService.showConfirm(
      'Supprimer le contrat',
      `Êtes-vous sûr de vouloir supprimer le contrat de ${tenantName} ? Cette action est irréversible.`,
      'Supprimer',
      'Annuler'
    );

    if (confirmed) {
      try {
        await this.notificationService.showLoading('Suppression en cours...');
        
        // TODO: Implémenter l'action DeleteContract
        // this.store.dispatch(new ContractAction.DeleteContract(contract._id));
        console.log('Suppression du contrat:', contract._id);
        
        await this.notificationService.hideLoading();
        await this.notificationService.showSuccess('Contrat supprimé');
        
      } catch (error) {
        await this.notificationService.hideLoading();
        await this.notificationService.showError('Erreur lors de la suppression');
      }
    }
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByContractId(_index: number, contract: any): string {
    return contract._id;
  }

  // Méthodes pour le template
  addContract(): void {
    this.router.navigate(['/mobile/contracts/create']);
  }



  getTotalContracts(): number {
    return this.contracts.length;
  }

  getActiveContracts(): number {
    return this.contracts.filter(c => c.status === 'ACTIVE').length;
  }

  getPendingContracts(): number {
    return this.contracts.filter(c => c.status === 'PENDING').length;
  }

  getExpiredContracts(): number {
    return this.contracts.filter(c => c.status === 'EXPIRED').length;
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'danger';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'expired': return 'Expiré';
      default: return 'Inconnu';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Non défini';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatPrice(amount: number): string {
    if (!amount) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  viewContract(contract: any): void {
    this.router.navigate(['/mobile/contracts', contract._id]);
  }

  canEdit(contract: any): boolean {
    return contract.status !== 'EXPIRED';
  }

  canRenew(contract: any): boolean {
    return contract.status === 'ACTIVE' || contract.status === 'EXPIRED';
  }
}
