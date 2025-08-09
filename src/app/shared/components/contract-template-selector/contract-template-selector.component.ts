import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ContractTemplateService } from '../../services/contract-template.service';
import {
  ContractTemplateModel,
  ContractTemplateFilterDTO,
  ContractTemplateStatus,
  ContractTemplateType
} from '../../models/contract-template.model';

@Component({
  selector: 'app-contract-template-selector',
  templateUrl: './contract-template-selector.component.html',
  styleUrls: ['./contract-template-selector.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContractTemplateSelectorComponent),
      multi: true
    }
  ]
})
export class ContractTemplateSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private destroy$ = new Subject<void>();

  @Input() label = 'Modèle de contrat';
  @Input() placeholder = 'Sélectionner un modèle de contrat';
  @Input() required = false;
  @Input() disabled = false;
  @Input() showCreateButton = true;
  @Input() showPreview = true;

  @Output() templateSelected = new EventEmitter<ContractTemplateModel | null>();
  @Output() createTemplate = new EventEmitter<void>();

  // État du composant
  templates: ContractTemplateModel[] = [];
  selectedTemplate: ContractTemplateModel | null = null;
  isLoading = false;
  isOpen = false;
  searchTerm = '';

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private contractTemplateService: ContractTemplateService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les modèles disponibles
   */
  loadTemplates(): void {
    this.isLoading = true;

    const filters: ContractTemplateFilterDTO = {
      status: ContractTemplateStatus.ACTIVE,
      limit: 50,
      sortBy: 'name',
      sortOrder: 'asc'
    };

    this.contractTemplateService.getTemplates(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.templates = response.templates;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des modèles:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Sélectionner un modèle
   */
  selectTemplate(template: ContractTemplateModel | null): void {
    this.selectedTemplate = template;
    this.isOpen = false;
    this.onChange(template?._id || null);
    this.onTouched();
    this.templateSelected.emit(template);
  }

  /**
   * Basculer l'ouverture du sélecteur
   */
  toggleOpen(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.searchTerm = '';
      }
    }
  }

  /**
   * Fermer le sélecteur
   */
  close(): void {
    this.isOpen = false;
  }

  /**
   * Filtrer les modèles selon la recherche
   */
  get filteredTemplates(): ContractTemplateModel[] {
    if (!this.searchTerm) {
      return this.templates;
    }

    const term = this.searchTerm.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(term) ||
      template.description?.toLowerCase().includes(term)
    );
  }

  /**
   * Créer un nouveau modèle
   */
  onCreateTemplate(): void {
    this.createTemplate.emit();
    this.close();
  }

  /**
   * Obtenir l'icône selon le type de modèle
   */
  getTemplateIcon(template: ContractTemplateModel): string {
    if (template.isSystemDefault) return 'shield-alt';
    if (template.isDefault) return 'star';

    // Icônes selon le type de contrat
    switch (template.type) {
      case ContractTemplateType.DEFAULT:
        return 'file-alt';
      case ContractTemplateType.CUSTOM:
        return 'file-edit';
      case ContractTemplateType.DUPLICATED:
        return 'copy';
      default:
        return 'file';
    }
  }

  /**
   * Obtenir la classe CSS selon le type
   */
  getTemplateClass(template: ContractTemplateModel): string {
    if (template.isSystemDefault) return 'system';
    if (template.isDefault) return 'default';
    return 'custom';
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value) {
      // Si on reçoit un ID, chercher le modèle correspondant
      if (typeof value === 'string') {
        this.findAndSetTemplate(value);
      } else if (value._id) {
        // Si on reçoit un objet modèle
        this.selectedTemplate = value;
      }
    } else {
      this.selectedTemplate = null;
    }
  }

  /**
   * Chercher et définir le template par ID
   */
  private findAndSetTemplate(templateId: string): void {
    const template = this.templates.find(t => t._id === templateId);
    if (template) {
      this.selectedTemplate = template;
    } else if (this.templates.length === 0) {
      // Si les templates ne sont pas encore chargés, attendre et réessayer
      console.log('Templates pas encore chargés, attente...', templateId);
      setTimeout(() => {
        this.findAndSetTemplate(templateId);
      }, 500);
    } else {
      // Template non trouvé dans la liste
      console.warn('Template non trouvé:', templateId);
      this.selectedTemplate = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
