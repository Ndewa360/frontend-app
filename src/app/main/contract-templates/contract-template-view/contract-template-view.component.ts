import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import {
  ContractTemplateModel,
  ContractTemplateType,
  ContractTemplateStatus,
  ContractTemplateAction,
  ContractTemplateState
} from '../../../shared/store/contract-templates';
import { ContractTemplateService } from '../../../shared/services/contract-template.service';
import { DuplicateTemplateModalComponent } from '../components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-contract-template-view',
  templateUrl: './contract-template-view.component.html',
  styleUrls: ['./contract-template-view.component.scss']
})
export class ContractTemplateViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables du store
  template$: Observable<ContractTemplateModel | null>;
  loading$: Observable<boolean>;
  
  // État local
  templateId: string = '';
  content: string = '';
  isLoadingContent = false;
  isDefaultTemplate = false;

  // Énumérations pour le template
  ContractTemplateType = ContractTemplateType;
  ContractTemplateStatus = ContractTemplateStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private dialog: MatDialog,
    private contractTemplateService: ContractTemplateService
  ) {
    // Initialiser les observables
    this.template$ = this.store.select(ContractTemplateState.selectStateCurrentTemplate);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoadingTemplate);
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.templateId = params['id'];
        this.loadTemplate(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger le modèle et son contenu
   */
  loadTemplate(templateId: string): void {
    this.isDefaultTemplate = templateId === 'default';

    if (this.isDefaultTemplate) {
      // Charger le template par défaut
      this.store.dispatch(new ContractTemplateAction.LoadDefaultTemplate());
    } else {
      // Charger un template utilisateur
      this.store.dispatch(new ContractTemplateAction.FetchTemplate(templateId));
    }

    // Charger le contenu
    this.loadContent(templateId);
  }

  /**
   * Charger le contenu du modèle
   */
  loadContent(templateId: string): void {
    this.isLoadingContent = true;

    // Attendre que le template soit chargé pour obtenir son vrai ID
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template) {
        // Utiliser l'ID réel du template (le backend gère automatiquement les templates système)
        this.contractTemplateService.getTemplateContent(template._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.content = response.content;
              this.isLoadingContent = false;
            },
            error: (error) => {
              console.error('Erreur lors du chargement du contenu:', error);
              this.isLoadingContent = false;
            }
          });
      } else if (templateId === 'default') {
        // Cas où on accède directement via /view/default - utiliser l'ID spécial
        this.contractTemplateService.getTemplateContent('default-template')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.content = response.content;
              this.isLoadingContent = false;
            },
            error: (error) => {
              console.error('Erreur lors du chargement du contenu:', error);
              this.isLoadingContent = false;
            }
          });
      }
    });
  }

  /**
   * Modifier le modèle
   */
  editTemplate(): void {
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template && !template.isSystemDefault) {
        // Utiliser l'ID du template actuel plutôt que celui de l'URL
        this.router.navigate(['../edit', template._id], { relativeTo: this.route });
      }
    });
  }

  /**
   * Dupliquer le modèle
   */
  duplicateTemplate(): void {
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template) {
        const dialogRef = this.dialog.open(DuplicateTemplateModalComponent, {
          width: '600px',
          maxWidth: '90vw',
          data: { template },
          disableClose: true,
          panelClass: 'custom-dialog-container'
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // La duplication a été effectuée avec succès via le store
            console.log('Template dupliqué avec succès');

            // Récupérer le nouveau template depuis le store et rediriger
            this.store.select(ContractTemplateState.selectStateCurrentTemplate).pipe(
              takeUntil(this.destroy$),
              filter((newTemplate: ContractTemplateModel | null) =>
                newTemplate && newTemplate._id !== template._id) // S'assurer que c'est le nouveau template
            ).subscribe((newTemplate: ContractTemplateModel | null) => {
              if (newTemplate) {
                console.log('Redirection vers le nouveau template:', newTemplate._id);
                this.router.navigate(['../view', newTemplate._id], { relativeTo: this.route });
              }
            });
          }
        });
      }
    });
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    this.router.navigate(['/app/contract-templates']);
  }

  /**
   * Obtenir l'icône selon le type
   */
  getTypeIcon(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'fas fa-file-contract';
      case ContractTemplateType.CUSTOM:
        return 'fas fa-file-edit';
      case ContractTemplateType.DUPLICATED:
        return 'fas fa-copy';
      default:
        return 'fas fa-file';
    }
  }

  /**
   * Obtenir le libellé du type
   */
  getTypeLabel(type: ContractTemplateType): string {
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
   * Convertir les variables personnalisées en tableau
   */
  getVariablesArray(customVariables: { [key: string]: string }): Array<{key: string, value: string}> {
    if (!customVariables) return [];
    return Object.entries(customVariables).map(([key, value]) => ({ key, value }));
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Imprimer le template
   */
  printTemplate(): void {
    window.print();
  }

  /**
   * Obtenir le label du type de template
   */
  getTemplateTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'DEFAULT': 'Par défaut',
      'CUSTOM': 'Personnalisé',
      'SYSTEM': 'Système'
    };
    return labels[type] || type;
  }



  /**
   * Exporter en PDF
   */
  exportPDF(): void {
    // TODO: Implémenter l'export PDF
    console.log('Export PDF');
  }

  /**
   * Supprimer le template
   */
  deleteTemplate(): void {
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template && !template.isSystemDefault) {
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

            // Rediriger vers la liste après suppression
            this.router.navigate(['../'], { relativeTo: this.route });
          }
        });
      }
    });
  }
}
