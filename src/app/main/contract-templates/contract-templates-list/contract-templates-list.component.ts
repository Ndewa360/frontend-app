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

    // Charger tous les templates (le sélecteur selectAllTemplates inclut automatiquement le template par défaut)
    this.store.dispatch(new ContractTemplateAction.FetchTemplates(filters));
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
      this.router.navigate(['/app/contract-templates/view', viewId]);
    }
  }

  /**
   * Modifier un modèle
   */
  editTemplate(template: ContractTemplateModel): void {
    this.router.navigate(['/app/contract-templates/edit', template._id]);
  }



  /**
   * Créer un nouveau modèle
   */
  createNewTemplate(): void {
    this.router.navigate(['/app/contract-templates/create']);
  }

  /**
   * Exporter les modèles
   */
  exportTemplates(): void {
    const templates = this.store.selectSnapshot(ContractTemplateState.selectStateTemplates);

    if (!templates || templates.length === 0) {
      console.warn('Aucun modèle à exporter');
      return;
    }

    // Créer les données d'export
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTemplates: templates.length,
      templates: templates.map(template => ({
        id: template._id,
        name: template.name,
        description: template.description,
        type: template.type,
        status: template.status,
        isDefault: template.isDefault,
        isSystemDefault: template.isSystemDefault,
        usageCount: template.usageCount,
        version: template.version,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        customVariables: template.customVariables,
        preview: template.preview
      }))
    };

    // Créer et télécharger le fichier JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `contract-templates-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    console.log('Export des modèles terminé:', exportData.totalTemplates, 'modèles exportés');
  }

  /**
   * Retour
   */
  goBack(): void {
    this.router.navigate(['/app/contract-templates']);
  }

  /**
   * Basculer le menu de la carte
   */
  toggleCardMenu(templateId: string): void {
    // Fermer tous les autres menus
    this.templates$.subscribe(templates => {
      templates.forEach(template => {
        if (template._id !== templateId) {
          (template as any).showMenu = false;
        }
      });
    });

    // Basculer le menu du template sélectionné
    this.templates$.subscribe(templates => {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        (template as any).showMenu = !(template as any).showMenu;
      }
    });
  }

  /**
   * Fermer tous les menus
   */
  closeAllMenus(): void {
    this.templates$.subscribe(templates => {
      templates.forEach(template => {
        (template as any).showMenu = false;
      });
    });
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
        
        // Recharger la liste des templates
        this.loadTemplates();
        
        // Rediriger directement vers la page d'édition du nouveau template
        console.log('🔄 Redirection vers la page d\'édition du nouveau template:', result.newTemplate._id);
        this.router.navigate(['/app/contract-templates/edit', result.newTemplate._id]);
      } else if (result?.success) {
        // Fallback : recharger la liste et rediriger
        console.log('⚠️ Template dupliqué, rechargement de la liste...');
        this.loadTemplates();
        
        // Attendre un peu puis rediriger vers la liste
        setTimeout(() => {
          this.router.navigate(['/app/contract-templates']);
        }, 1000);
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
