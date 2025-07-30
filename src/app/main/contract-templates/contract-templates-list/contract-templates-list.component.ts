import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, Observable } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';

import {
  ContractTemplateModel,
  ContractTemplateType,
  ContractTemplateStatus,
  TemplateFilters,
  ContractTemplateAction,
  ContractTemplateState
} from '../../../shared/store/contract-templates';
import { DuplicateTemplateModalComponent } from '../components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-contract-templates-list',
  templateUrl: './contract-templates-list.component.html',
  styleUrls: ['./contract-templates-list.component.scss']
})
export class ContractTemplatesListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Observables du store
  templates$: Observable<ContractTemplateModel[]>;
  loading$: Observable<boolean>;
  pagination$: Observable<any>;
  filters$: Observable<TemplateFilters>;

  // État de l'interface
  viewMode: 'grid' | 'list' = 'grid';
  showAdvancedFilters = false;
  isDuplicateMode = false;

  // Filtres locaux
  searchQuery = '';
  selectedType: ContractTemplateType | '' = '';
  selectedStatus: ContractTemplateStatus | '' = '';
  sortBy = 'updatedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Exposer les enums pour le template
  ContractTemplateType = ContractTemplateType;
  ContractTemplateStatus = ContractTemplateStatus;

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    // Initialiser les observables
    this.templates$ = this.store.select(ContractTemplateState.selectAllTemplates);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoading);
    this.pagination$ = this.store.select(ContractTemplateState.selectStatePagination);
    this.filters$ = this.store.select(ContractTemplateState.selectStateFilters);
    
    // Configurer la recherche avec debounce
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.checkDuplicateMode();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Vérifier si on est en mode duplication
   */
  private checkDuplicateMode(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.isDuplicateMode = params['action'] === 'duplicate';
    });
  }

  /**
   * Charger les modèles
   */
  private loadTemplates(): void {
    const filters: TemplateFilters = {
      search: this.searchQuery || undefined,
      type: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: 1,
      limit: 12
    };

    // Charger les templates utilisateur
    this.store.dispatch(new ContractTemplateAction.FetchTemplates(filters));

    // Charger le template par défaut si aucun filtre de type n'est appliqué ou si on filtre par DEFAULT
    if (!this.selectedType || this.selectedType === ContractTemplateType.DEFAULT) {
      this.store.dispatch(new ContractTemplateAction.LoadDefaultTemplate());
    }
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    this.loadTemplates();
  }

  /**
   * Gérer le changement de recherche
   */
  onSearchChange(event: any): void {
    const searchTerm = event.target?.value || '';
    this.searchSubject.next(searchTerm);
  }

  /**
   * Effacer la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  /**
   * Définir le filtre de type
   */
  setTypeFilter(type: ContractTemplateType | ''): void {
    this.selectedType = type;
    this.applyFilters();
  }

  /**
   * Basculer les filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Définir le mode de vue
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  /**
   * Gérer le changement de tri
   */
  onSortChange(): void {
    this.applyFilters();
  }

  /**
   * Basculer l'ordre de tri
   */
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.sortBy = 'updatedAt';
    this.sortOrder = 'desc';
    this.applyFilters();
  }

  /**
   * Aller à une page
   */
  goToPage(page: number): void {
    const filters: TemplateFilters = {
      search: this.searchQuery || undefined,
      type: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: page,
      limit: 12
    };

    this.store.dispatch(new ContractTemplateAction.FetchTemplates(filters));
  }

  /**
   * Voir un modèle
   */
  viewTemplate(template: ContractTemplateModel): void {
    if (this.isDuplicateMode) {
      this.duplicateTemplate(template);
    } else {
      // Utiliser "default" pour les templates système, sinon l'ID normal
      const viewId = template.isSystemDefault ? 'default' : template._id;
      this.router.navigate(['../view', viewId], { relativeTo: this.route });
    }
  }

  /**
   * Modifier un modèle
   */
  editTemplate(template: ContractTemplateModel): void {
    this.router.navigate(['../edit', template._id], { relativeTo: this.route });
  }



  /**
   * Créer un nouveau modèle
   */
  createNewTemplate(): void {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  /**
   * Exporter les modèles
   */
  exportTemplates(): void {
    // TODO: Implémenter l'export
    console.log('Export des modèles');
  }

  /**
   * Retour
   */
  goBack(): void {
    if (this.isDuplicateMode) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  /**
   * Basculer le menu de la carte
   */
  toggleCardMenu(templateId: string): void {
    // TODO: Implémenter le menu contextuel
    console.log('Toggle menu for template:', templateId);
  }

  /**
   * Obtenir la classe CSS pour l'icône de type
   */
  getTypeIconClass(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'icon-default';
      case ContractTemplateType.CUSTOM:
        return 'icon-custom';
      case ContractTemplateType.DUPLICATED:
        return 'icon-duplicated';
      default:
        return 'icon-default';
    }
  }

  /**
   * Obtenir la classe CSS pour le badge de type
   */
  getTypeBadgeClass(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'type-default';
      case ContractTemplateType.CUSTOM:
        return 'type-custom';
      case ContractTemplateType.DUPLICATED:
        return 'type-duplicated';
      default:
        return 'type-default';
    }
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: ContractTemplateStatus): string {
    switch (status) {
      case ContractTemplateStatus.ACTIVE:
        return 'status-active';
      case ContractTemplateStatus.INACTIVE:
        return 'status-inactive';
      case ContractTemplateStatus.ARCHIVED:
        return 'status-archived';
      default:
        return 'status-active';
    }
  }

  /**
   * Obtenir le libellé du type de modèle
   */
  getTemplateTypeLabel(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'Par défaut';
      case ContractTemplateType.CUSTOM:
        return 'Personnalisé';
      case ContractTemplateType.DUPLICATED:
        return 'Dupliqué';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status: ContractTemplateStatus): string {
    switch (status) {
      case ContractTemplateStatus.ACTIVE:
        return 'Actif';
      case ContractTemplateStatus.INACTIVE:
        return 'Inactif';
      case ContractTemplateStatus.ARCHIVED:
        return 'Archivé';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Obtenir le texte de pagination
   */
  getPaginationText(pagination: any): string {
    const start = (pagination.page - 1) * 12 + 1;
    const end = Math.min(pagination.page * 12, pagination.total);
    return `${start}-${end} sur ${pagination.total}`;
  }

  /**
   * Obtenir les numéros de page
   */
  getPageNumbers(pagination: any): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Dupliquer un template
   */
  duplicateTemplate(template: ContractTemplateModel): void {
    const dialogRef = this.dialog.open(DuplicateTemplateModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { template },
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success && result?.newTemplate) {
        // La duplication a été effectuée avec succès
        console.log('✅ Template dupliqué avec succès:', result.newTemplate);

        // Rediriger directement vers la page d'édition du nouveau template
        console.log('🔄 Redirection vers la page d\'édition du nouveau template:', result.newTemplate._id);
        this.router.navigate(['../edit', result.newTemplate._id], { relativeTo: this.route });
      } else if (result?.success) {
        // Fallback : utiliser le store si le template n'est pas dans le résultat
        console.log('⚠️ Template dupliqué mais non retourné, utilisation du store...');

        this.store.select(ContractTemplateState.selectStateCurrentTemplate).pipe(
          takeUntil(this.destroy$),
          filter((newTemplate: ContractTemplateModel | null) =>
            newTemplate && newTemplate._id !== template._id)
        ).subscribe((newTemplate: ContractTemplateModel | null) => {
          if (newTemplate) {
            console.log('🔄 Redirection vers la page d\'édition du nouveau template:', newTemplate._id);
            this.router.navigate(['../edit', newTemplate._id], { relativeTo: this.route });
          } else {
            console.warn('⚠️ Nouveau template non trouvé dans le store après duplication');
            this.store.dispatch(new ContractTemplateAction.FetchTemplates());
          }
        });
      }
    });
  }

  /**
   * Supprimer un template
   */
  deleteTemplate(template: ContractTemplateModel): void {
    // Empêcher la suppression des templates système
    if (template.isSystemDefault) {
      return;
    }

    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        title: 'Supprimer le modèle',
        message: `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`,
        warning: 'Cette action est irréversible. Le fichier sera également supprimé du stockage.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      },
      disableClose: true,
      panelClass: ['custom-dialog-container', 'delete-confirmation-dialog'],
      hasBackdrop: true,
      backdropClass: 'delete-confirmation-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Dispatch l'action de suppression
        this.store.dispatch(new ContractTemplateAction.DeleteTemplate(template._id));
      }
    });
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByTemplate(_index: number, template: ContractTemplateModel): string {
    return template._id;
  }
}
