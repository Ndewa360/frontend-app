import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ContractTemplateService } from '../../../shared/services/contract-template.service';
import { ContractTemplateType, ContractTemplateStatus } from '../../../shared/models/contract-template.model';

@Component({
  selector: 'app-contract-template-editor',
  templateUrl: './contract-template-editor.component.html',
  styleUrls: ['./contract-template-editor.component.scss']
})
export class ContractTemplateEditorComponent implements OnInit {
  templateForm: FormGroup;
  isEditMode = false;
  templateId: string | null = null;
  apiKey = "jc0rxaqsy4dc37g2tn6d7jh1oob7gm87jfjyl268edebg4zp"

  // Template properties
  templateName = '';
  templateDescription = '';
  templateContent = '';

  // UI state
  viewMode: 'edit' | 'preview' = 'edit';
  isSaving = false;
  lastSaveTime: Date | null = null;

  // TinyMCE configuration
  editorConfig = {
    height: 'calc(100vh - 200px)', // Hauteur dynamique basée sur la viewport
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; direction: ltr; }',
    directionality: 'ltr' as 'ltr',
    language: 'fr_FR',
    branding: false,
    resize: false,
    statusbar: false,
    valid_elements: '*[*]',
    extended_valid_elements: '*[*]'
  };

  // Options for dropdowns
  templateTypeOptions = [
    { content: 'Contrat de location', value: 'RENTAL', selected: false },
    { content: 'Contrat de vente', value: 'SALE', selected: false },
    { content: 'Contrat de gestion', value: 'MANAGEMENT', selected: false }
  ];

  statusOptions = [
    { content: 'Actif', value: 'ACTIVE', selected: true },
    { content: 'Inactif', value: 'INACTIVE', selected: false },
    { content: 'Brouillon', value: 'DRAFT', selected: false }
  ];

  // Variable categories for template
  variableCategories = [
    {
      name: 'Informations du locataire',
      variables: [
        { name: 'Nom du locataire', label: 'Nom du locataire', code: '{{TENANT_NAME}}', description: 'Nom de famille du locataire' },
        { name: 'Prénom du locataire', label: 'Prénom du locataire', code: '{{TENANT_FIRSTNAME}}', description: 'Prénom du locataire' },
        { name: 'Adresse du locataire', label: 'Adresse du locataire', code: '{{TENANT_ADDRESS}}', description: 'Adresse complète du locataire' },
        { name: 'Téléphone du locataire', label: 'Téléphone du locataire', code: '{{TENANT_PHONE}}', description: 'Numéro de téléphone du locataire' },
        { name: 'Email du locataire', label: 'Email du locataire', code: '{{TENANT_EMAIL}}', description: 'Adresse email du locataire' }
      ]
    },
    {
      name: 'Informations du propriétaire',
      variables: [
        { name: 'Nom du propriétaire', label: 'Nom du propriétaire', code: '{{OWNER_NAME}}', description: 'Nom de famille du propriétaire' },
        { name: 'Prénom du propriétaire', label: 'Prénom du propriétaire', code: '{{OWNER_FIRSTNAME}}', description: 'Prénom du propriétaire' },
        { name: 'Adresse du propriétaire', label: 'Adresse du propriétaire', code: '{{OWNER_ADDRESS}}', description: 'Adresse complète du propriétaire' },
        { name: 'Téléphone du propriétaire', label: 'Téléphone du propriétaire', code: '{{OWNER_PHONE}}', description: 'Numéro de téléphone du propriétaire' },
        { name: 'Email du propriétaire', label: 'Email du propriétaire', code: '{{OWNER_EMAIL}}', description: 'Adresse email du propriétaire' }
      ]
    },
    {
      name: 'Informations du bien',
      variables: [
        { name: 'Adresse du bien', label: 'Adresse du bien', code: '{{PROPERTY_ADDRESS}}', description: 'Adresse complète du bien immobilier' },
        { name: 'Type de bien', label: 'Type de bien', code: '{{PROPERTY_TYPE}}', description: 'Type de bien (appartement, maison, etc.)' },
        { name: 'Surface', label: 'Surface', code: '{{PROPERTY_SURFACE}}', description: 'Surface du bien en m²' },
        { name: 'Nombre de pièces', label: 'Nombre de pièces', code: '{{PROPERTY_ROOMS}}', description: 'Nombre de pièces du bien' },
        { name: 'Loyer mensuel', label: 'Loyer mensuel', code: '{{MONTHLY_RENT}}', description: 'Montant du loyer mensuel' },
        { name: 'Charges', label: 'Charges', code: '{{CHARGES}}', description: 'Montant des charges mensuelles' },
        { name: 'Dépôt de garantie', label: 'Dépôt de garantie', code: '{{SECURITY_DEPOSIT}}', description: 'Montant du dépôt de garantie' }
      ]
    },
    {
      name: 'Dates',
      variables: [
        { name: 'Date du jour', label: 'Date du jour', code: '{{CURRENT_DATE}}', description: 'Date actuelle' },
        { name: 'Date de début', label: 'Date de début', code: '{{START_DATE}}', description: 'Date de début du contrat' },
        { name: 'Date de fin', label: 'Date de fin', code: '{{END_DATE}}', description: 'Date de fin du contrat' },
        { name: 'Date de signature', label: 'Date de signature', code: '{{SIGNATURE_DATE}}', description: 'Date de signature du contrat' }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private contractTemplateService: ContractTemplateService
  ) {
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      content: ['', Validators.required],
      type: ['RENTAL', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.templateId;

    if (this.isEditMode) {
      this.loadTemplate();
    } else {
      // Pour un nouveau template, initialiser avec des valeurs par défaut
      this.templateName = 'Nouveau modèle de contrat';
      this.templateDescription = '';
      this.templateContent = '<p>Commencez à rédiger votre modèle de contrat...</p>';
    }
  }

  loadTemplate(): void {
    if (!this.templateId) return;

    console.log('Loading template:', this.templateId);

    // Charger les informations du template
    this.contractTemplateService.getTemplateById(this.templateId).subscribe({
      next: (template: any) => {
        this.templateName = template.name;
        this.templateDescription = template.description || '';

        // Charger le contenu du template
        this.contractTemplateService.getTemplateContent(this.templateId!).subscribe({
          next: (response) => {
            this.templateContent = response.content;
          },
          error: (error) => {
            console.error('Erreur lors du chargement du contenu:', error);
            this.templateContent = '<p>Erreur lors du chargement du contenu...</p>';
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement du template:', error);
        this.templateName = 'Erreur de chargement';
        this.templateDescription = '';
        this.templateContent = '<p>Erreur lors du chargement...</p>';
      }
    });
  }

  // Navigation methods
  goBack(): void {
    this.location.back();
  }

  // Save status methods
  getSaveStatusClass(): string {
    if (this.isSaving) return 'saving';
    if (this.lastSaveTime) return 'saved';
    return 'unsaved';
  }

  getSaveStatusIcon(): string {
    if (this.isSaving) return 'fa-spinner fa-spin';
    if (this.lastSaveTime) return 'fa-check';
    return 'fa-exclamation-triangle';
  }

  getSaveStatusText(): string {
    if (this.isSaving) return 'Sauvegarde...';
    if (this.lastSaveTime) return 'Sauvegardé';
    return 'Non sauvegardé';
  }

  // View mode methods
  setViewMode(mode: 'edit' | 'preview'): void {
    this.viewMode = mode;
  }

  // Template actions
  saveTemplate(): void {
    if (!this.templateName.trim()) {
      alert('Veuillez saisir un nom pour le modèle');
      return;
    }

    this.isSaving = true;

    const templateData = {
      name: this.templateName,
      description: this.templateDescription,
      content: this.templateContent,
      type: ContractTemplateType.CUSTOM,
      status: ContractTemplateStatus.ACTIVE
    };

    if (this.isEditMode && this.templateId) {
      // Mise à jour d'un template existant
      this.contractTemplateService.updateTemplate(this.templateId, templateData).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.lastSaveTime = new Date();
          console.log('Template mis à jour avec succès');
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Erreur lors de la mise à jour:', error);
          alert('Erreur lors de la mise à jour du modèle');
        }
      });
    } else {
      // Création d'un nouveau template
      this.contractTemplateService.createTemplate(templateData).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.lastSaveTime = new Date();
          console.log('Template créé avec succès');
          // Rediriger vers la liste ou la vue du template créé
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Erreur lors de la création:', error);
          alert('Erreur lors de la création du modèle');
        }
      });
    }
  }

  exportTemplate(): void {
    // TODO: Implémenter l'export
    console.log('Exporting template');
  }

  hasChanges(): boolean {
    // TODO: Vérifier s'il y a des changements
    return true;
  }

  // Template change handlers
  onTemplateChange(): void {
    // TODO: Marquer comme modifié
    console.log('Template changed');
  }

  onTypeChange(event: any): void {
    console.log('Type changed:', event);
  }

  onStatusChange(event: any): void {
    console.log('Status changed:', event);
  }

  // Variable insertion
  insertVariable(variable: any): void {
    // Insérer la variable dans l'éditeur TinyMCE
    const variableCode = variable.code || `{{${variable.name.toUpperCase().replace(/\s+/g, '_')}}}`;

    // Obtenir l'instance TinyMCE
    const editor = (window as any).tinymce?.activeEditor;
    if (editor) {
      editor.insertContent(`<span class="template-variable" style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${variableCode}</span>&nbsp;`);
    } else {
      // Fallback si TinyMCE n'est pas disponible
      this.templateContent += ` ${variableCode} `;
    }
  }



  // Content change handlers
  onContentChange(content: any): void {
    // TinyMCE peut envoyer soit une string soit un event
    const actualContent = typeof content === 'string' ? content : content.target?.value || content;
    this.templateContent = actualContent;
    this.onTemplateChange();
  }

  onPaste(event: any): void {
    // TODO: Gérer le collage de contenu
    console.log('Paste event:', event);
  }

  // Preview methods
  getPreviewContent(): string {
    // TODO: Générer le contenu de prévisualisation avec les variables remplacées
    return this.templateContent || '<p>Aucun contenu à prévisualiser</p>';
  }

  printPreview(): void {
    // TODO: Imprimer la prévisualisation
    console.log('Print preview');
  }

  exportPDF(): void {
    // TODO: Exporter en PDF
    console.log('Export PDF');
  }

  // Statistics methods
  getWordCount(): number {
    if (!this.templateContent) return 0;
    const text = this.templateContent.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  getCharacterCount(): number {
    if (!this.templateContent) return 0;
    return this.templateContent.replace(/<[^>]*>/g, '').length;
  }

  getLastSaveTime(): string {
    if (!this.lastSaveTime) return 'Jamais';
    return this.lastSaveTime.toLocaleTimeString();
  }

  onSave(): void {
    if (this.templateForm.valid) {
      // TODO: Sauvegarder le template
      console.log('Saving template:', this.templateForm.value);
      this.router.navigate(['/contract-templates']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/contract-templates']);
  }
}
