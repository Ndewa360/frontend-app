import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ContractTemplateModel, ContractTemplateType } from '../../../../shared/models/contract-template.model';
import { ContractTemplateAction, ContractTemplateState } from '../../../../shared/store/contract-templates';

export interface TemplateSelectionData {
  title: string;
  message: string;
  allowSystemTemplates?: boolean;
  excludeTemplateId?: string;
}

export interface TemplateSelectionResult {
  selectedTemplate: ContractTemplateModel;
  action: 'duplicate' | 'select';
}

@Component({
  selector: 'app-template-selection-modal',
  templateUrl: './template-selection-modal.component.html',
  styleUrls: ['./template-selection-modal.component.scss']
})
export class TemplateSelectionModalComponent implements OnInit {
  templates$: Observable<ContractTemplateModel[]>;
  loading$: Observable<boolean>;
  selectedTemplate: ContractTemplateModel | null = null;
  
  // Filtres
  searchTerm = '';
  selectedType: ContractTemplateType | 'ALL' = 'ALL';
  showSystemTemplates = true;
  
  readonly templateTypes = [
    { value: 'ALL', label: 'Tous les types' },
    { value: ContractTemplateType.DEFAULT, label: 'Par défaut' },
    { value: ContractTemplateType.CUSTOM, label: 'Personnalisé' },
    { value: ContractTemplateType.DUPLICATED, label: 'Dupliqué' }
  ];

  constructor(
    public dialogRef: MatDialogRef<TemplateSelectionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateSelectionData,
    private store: Store
  ) {
    this.showSystemTemplates = data.allowSystemTemplates !== false;
  }

  ngOnInit(): void {
    // Charger les templates
    this.store.dispatch(new ContractTemplateAction.FetchTemplates());
    
    this.templates$ = this.store.select(ContractTemplateState.selectStateTemplates);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoading);
  }

  /**
   * Filtrer les templates selon les critères
   */
  getFilteredTemplates(templates: ContractTemplateModel[]): ContractTemplateModel[] {
    if (!templates) return [];

    return templates.filter(template => {
      // Exclure le template spécifié
      if (this.data.excludeTemplateId && template._id === this.data.excludeTemplateId) {
        return false;
      }

      // Filtrer par type
      if (this.selectedType !== 'ALL' && template.type !== this.selectedType) {
        return false;
      }

      // Filtrer les templates système si nécessaire
      if (!this.showSystemTemplates && template.isSystemDefault) {
        return false;
      }

      // Filtrer par terme de recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return template.name.toLowerCase().includes(searchLower) ||
               template.description.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }

  /**
   * Sélectionner un template
   */
  selectTemplate(template: ContractTemplateModel): void {
    this.selectedTemplate = template;
  }

  /**
   * Confirmer la sélection
   */
  confirm(): void {
    if (this.selectedTemplate) {
      const result: TemplateSelectionResult = {
        selectedTemplate: this.selectedTemplate,
        action: 'duplicate'
      };
      this.dialogRef.close(result);
    }
  }

  /**
   * Annuler
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Obtenir l'icône du type de template
   */
  getTemplateTypeIcon(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'fa-star';
      case ContractTemplateType.CUSTOM:
        return 'fa-edit';
      case ContractTemplateType.DUPLICATED:
        return 'fa-copy';
      default:
        return 'fa-file';
    }
  }

  /**
   * Obtenir le label du type de template
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
}
