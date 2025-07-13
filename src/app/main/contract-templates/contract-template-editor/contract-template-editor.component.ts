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
  isLoading = false;
  isContentLoading = false;
  lastSaveTime: Date | null = null;
  loadingError: string | null = null;
  hasUnsavedChanges = false;

  // TinyMCE configuration avancée
  editorConfig = {
    height: 'calc(100vh - 200px)', // Hauteur dynamique basée sur la viewport
    menubar: 'file edit view insert format tools table help',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'template',
      'paste', 'textcolor', 'colorpicker', 'textpattern', 'codesample',
      'hr', 'pagebreak', 'nonbreaking', 'toc', 'imagetools', 'emoticons'
    ],
    toolbar1: 'undo redo | cut copy paste | bold italic underline strikethrough | ' +
      'fontselect fontsizeselect | forecolor backcolor | removeformat',
    toolbar2: 'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | blockquote hr pagebreak | ' +
      'link unlink anchor | image media table | code codesample',
    toolbar3: 'searchreplace | visualblocks visualchars | ' +
      'insertdatetime nonbreaking | template | preview fullscreen help',

    // Configuration des couleurs
    color_map: [
      "000000", "Noir",
      "993300", "Marron foncé",
      "333300", "Vert olive foncé",
      "003300", "Vert foncé",
      "003366", "Bleu marine foncé",
      "000080", "Bleu marine",
      "333399", "Indigo",
      "333333", "Gris très foncé",
      "800000", "Marron",
      "FF6600", "Orange",
      "808000", "Olive",
      "008000", "Vert",
      "008080", "Sarcelle",
      "0000FF", "Bleu",
      "666699", "Gris bleu",
      "808080", "Gris",
      "FF0000", "Rouge",
      "FF9900", "Ambre",
      "99CC00", "Vert jaune",
      "339966", "Vert de mer",
      "33CCCC", "Turquoise",
      "3366FF", "Bleu royal",
      "800080", "Violet",
      "999999", "Gris moyen",
      "FF00FF", "Magenta",
      "FFCC00", "Or",
      "FFFF00", "Jaune",
      "00FF00", "Lime",
      "00FFFF", "Aqua",
      "00CCFF", "Bleu ciel",
      "993366", "Rouge brun",
      "C0C0C0", "Argent",
      "FF99CC", "Rose",
      "FFCC99", "Pêche",
      "FFFF99", "Jaune clair",
      "CCFFCC", "Vert clair",
      "CCFFFF", "Cyan clair",
      "99CCFF", "Bleu clair",
      "CC99FF", "Lavande",
      "FFFFFF", "Blanc"
    ],

    // Configuration avancée
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .highlight { background-color: #ffff00; }
      .contract-header { text-align: center; margin-bottom: 30px; }
      .contract-section { margin: 20px 0; }
      .signature-block { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
    `,

    // Configuration des styles
    style_formats: [
      { title: 'En-têtes', items: [
        { title: 'Titre principal', format: 'h1' },
        { title: 'Titre secondaire', format: 'h2' },
        { title: 'Sous-titre', format: 'h3' }
      ]},
      { title: 'Styles de contrat', items: [
        { title: 'En-tête de contrat', block: 'div', classes: 'contract-header' },
        { title: 'Section de contrat', block: 'div', classes: 'contract-section' },
        { title: 'Bloc de signature', block: 'div', classes: 'signature-block' },
        { title: 'Texte surligné', inline: 'span', classes: 'highlight' }
      ]},
      { title: 'Formatage', items: [
        { title: 'Gras', inline: 'strong' },
        { title: 'Italique', inline: 'em' },
        { title: 'Code', inline: 'code' },
        { title: 'Citation', block: 'blockquote' }
      ]}
    ],

    directionality: 'ltr' as 'ltr',
    language: 'fr_FR',
    branding: false,
    resize: true,
    statusbar: true,
    elementpath: true,
    valid_elements: '*[*]',
    extended_valid_elements: '*[*]',

    // Configuration du code HTML
    code_dialog_height: 400,
    code_dialog_width: 800,

    // Configuration des images
    image_advtab: true,
    image_caption: true,
    image_title: true,

    // Configuration des tableaux
    table_default_attributes: {
      border: '1'
    },
    table_default_styles: {
      'border-collapse': 'collapse'
    },

    // Configuration de la paste
    paste_as_text: false,
    paste_auto_cleanup_on_paste: true,
    paste_remove_styles_if_webkit: true,

    // Templates prédéfinis
    templates: [
      {
        title: 'Contrat de location standard',
        description: 'Modèle de base pour un contrat de location',
        content: `
          <div class="contract-header">
            <h1>CONTRAT DE LOCATION</h1>
            <p><strong>Entre les soussignés :</strong></p>
          </div>

          <div class="contract-section">
            <h2>Article 1 - Désignation du bailleur</h2>
            <p>{{OWNER_FIRSTNAME}} {{OWNER_NAME}}, demeurant {{OWNER_ADDRESS}}</p>
          </div>

          <div class="contract-section">
            <h2>Article 2 - Désignation du locataire</h2>
            <p>{{TENANT_FIRSTNAME}} {{TENANT_NAME}}, demeurant {{TENANT_ADDRESS}}</p>
          </div>

          <div class="contract-section">
            <h2>Article 3 - Désignation du bien loué</h2>
            <p>Le bien situé {{PROPERTY_ADDRESS}}, d'une surface de {{PROPERTY_SURFACE}} m²</p>
          </div>

          <div class="signature-block">
            <p>Fait à _______, le {{CURRENT_DATE}}</p>
            <table style="width: 100%; margin-top: 30px;">
              <tr>
                <td style="text-align: center; width: 50%;">
                  <strong>Le Bailleur</strong><br><br><br>
                  _________________
                </td>
                <td style="text-align: center; width: 50%;">
                  <strong>Le Locataire</strong><br><br><br>
                  _________________
                </td>
              </tr>
            </table>
          </div>
        `
      }
    ]
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

    console.log('ContractTemplateEditor initialized:', {
      templateId: this.templateId,
      isEditMode: this.isEditMode,
      route: this.route.snapshot.url
    });

    if (this.isEditMode) {
      this.loadTemplate();
    } else {
      // Pour un nouveau template, initialiser avec des valeurs par défaut
      this.templateName = 'Nouveau modèle de contrat';
      this.templateDescription = '';
      this.templateContent = '<p>Commencez à rédiger votre modèle de contrat...</p>';

      // Initialiser l'éditeur après un délai
      setTimeout(() => {
        this.updateEditorContent();
      }, 1000);
    }
  }

  loadTemplate(): void {
    if (!this.templateId) return;

    console.log('Loading template:', this.templateId);

    // Activer les états de chargement
    this.isLoading = true;
    this.isContentLoading = true;
    this.loadingError = null;

    // Charger les informations du template
    this.contractTemplateService.getTemplateById(this.templateId).subscribe({
      next: (template: any) => {
        console.log('Template loaded:', template);
        this.templateName = template.name;
        this.templateDescription = template.description || '';
        this.isLoading = false;

        // Charger le contenu du template
        this.contractTemplateService.getTemplateContent(this.templateId!).subscribe({
          next: (response) => {
            console.log('Template content loaded:', response);
            this.templateContent = response.content || '<p>Commencez à rédiger votre contrat...</p>';
            this.isContentLoading = false;

            // Forcer la mise à jour de l'éditeur TinyMCE
            setTimeout(() => {
              this.updateEditorContent();
            }, 100);
          },
          error: (error) => {
            console.error('Erreur lors du chargement du contenu:', error);
            this.templateContent = '<p>Erreur lors du chargement du contenu. Veuillez réessayer.</p>';
            this.isContentLoading = false;
            this.loadingError = 'Impossible de charger le contenu du modèle';
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement du template:', error);
        this.templateName = 'Erreur de chargement';
        this.templateDescription = '';
        this.templateContent = '<p>Erreur lors du chargement du modèle. Veuillez réessayer.</p>';
        this.isLoading = false;
        this.isContentLoading = false;
        this.loadingError = 'Impossible de charger le modèle de contrat';
      }
    });
  }

  /**
   * Force la mise à jour du contenu de l'éditeur TinyMCE
   */
  private updateEditorContent(): void {
    console.log('Updating editor content:', this.templateContent);

    // Méthode plus robuste pour mettre à jour TinyMCE
    const updateEditor = () => {
      if ((window as any).tinymce) {
        const editor = (window as any).tinymce.activeEditor;
        if (editor && editor.initialized) {
          console.log('Setting content in TinyMCE editor');
          editor.setContent(this.templateContent || '<p>Commencez à rédiger...</p>');
          editor.focus();
        } else {
          console.log('Editor not ready, retrying...');
          setTimeout(updateEditor, 200);
        }
      } else {
        console.log('TinyMCE not loaded, retrying...');
        setTimeout(updateEditor, 200);
      }
    };

    updateEditor();
  }

  /**
   * Réessayer le chargement du template
   */
  retryLoading(): void {
    this.loadTemplate();
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
          // Rediriger vers la vue du template créé
          this.router.navigate(['/contract-templates/view', response._id]);
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
    if (this.templateContent) {
      const blob = new Blob([this.templateContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.templateName || 'template'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  hasChanges(): boolean {
    if (!this.isEditMode) {
      // Nouveau template - vérifier si du contenu a été ajouté
      return this.templateName !== 'Nouveau modèle de contrat' ||
             this.templateDescription !== '' ||
             this.templateContent !== '<p>Commencez à rédiger votre modèle de contrat...</p>';
    }

    // Mode édition - comparer avec les valeurs originales
    return this.hasUnsavedChanges;
  }

  // Template change handlers
  onTemplateChange(): void {
    this.hasUnsavedChanges = true;
    this.lastSaveTime = null;
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
    // Marquer comme modifié lors du collage
    this.onTemplateChange();

    // Nettoyer le contenu collé si nécessaire
    setTimeout(() => {
      if ((window as any).tinymce) {
        const editor = (window as any).tinymce.activeEditor;
        if (editor) {
          // Nettoyer les styles indésirables
          const content = editor.getContent();
          const cleanContent = content.replace(/style="[^"]*"/g, '');
          if (content !== cleanContent) {
            editor.setContent(cleanContent);
          }
        }
      }
    }, 100);
  }

  // Preview methods
  getPreviewContent(): string {
    if (!this.templateContent) {
      return '<p>Aucun contenu à prévisualiser</p>';
    }

    // Remplacer les variables par des exemples pour la prévisualisation
    let previewContent = this.templateContent;

    // Variables du propriétaire
    previewContent = previewContent.replace(/\{\{OWNER_FIRSTNAME\}\}/g, 'Jean');
    previewContent = previewContent.replace(/\{\{OWNER_NAME\}\}/g, 'DUPONT');
    previewContent = previewContent.replace(/\{\{OWNER_ADDRESS\}\}/g, '123 Rue de la Paix, 75001 Paris');

    // Variables du locataire
    previewContent = previewContent.replace(/\{\{TENANT_FIRSTNAME\}\}/g, 'Marie');
    previewContent = previewContent.replace(/\{\{TENANT_NAME\}\}/g, 'MARTIN');
    previewContent = previewContent.replace(/\{\{TENANT_ADDRESS\}\}/g, '456 Avenue des Champs, 75008 Paris');

    // Variables de la propriété
    previewContent = previewContent.replace(/\{\{PROPERTY_ADDRESS\}\}/g, '789 Boulevard Saint-Germain, 75007 Paris');
    previewContent = previewContent.replace(/\{\{PROPERTY_SURFACE\}\}/g, '65');
    previewContent = previewContent.replace(/\{\{PROPERTY_ROOMS\}\}/g, '3');
    previewContent = previewContent.replace(/\{\{MONTHLY_RENT\}\}/g, '1 200 €');
    previewContent = previewContent.replace(/\{\{CHARGES\}\}/g, '150 €');
    previewContent = previewContent.replace(/\{\{SECURITY_DEPOSIT\}\}/g, '2 400 €');

    // Variables de dates
    const today = new Date();
    previewContent = previewContent.replace(/\{\{CURRENT_DATE\}\}/g, today.toLocaleDateString('fr-FR'));
    previewContent = previewContent.replace(/\{\{START_DATE\}\}/g, '01/01/2024');
    previewContent = previewContent.replace(/\{\{END_DATE\}\}/g, '31/12/2024');
    previewContent = previewContent.replace(/\{\{SIGNATURE_DATE\}\}/g, today.toLocaleDateString('fr-FR'));

    return previewContent;
  }

  printPreview(): void {
    const previewContent = this.getPreviewContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Aperçu - ${this.templateName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .contract-header { text-align: center; margin-bottom: 30px; }
              .contract-section { margin: 20px 0; }
              .signature-block { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
              table { border-collapse: collapse; width: 100%; }
              td { padding: 10px; border: 1px solid #ccc; }
            </style>
          </head>
          <body>${previewContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  exportPDF(): void {
    // Pour l'export PDF, on utilise la fonction d'impression du navigateur
    // qui permet de sauvegarder en PDF
    this.printPreview();
  }

  /**
   * Insérer du code HTML directement dans l'éditeur
   */
  insertHtmlCode(): void {
    const htmlCode = prompt('Entrez votre code HTML:');
    if (htmlCode && (window as any).tinymce) {
      const editor = (window as any).tinymce.activeEditor;
      if (editor) {
        editor.insertContent(htmlCode);
      }
    }
  }

  /**
   * Ouvrir la boîte de dialogue de code source
   */
  openSourceCode(): void {
    if ((window as any).tinymce) {
      const editor = (window as any).tinymce.activeEditor;
      if (editor) {
        editor.execCommand('mceCodeEditor');
      }
    }
  }

  /**
   * Insérer une variable de template (nouvelle méthode)
   */
  insertVariableCode(variableCode: string): void {
    if ((window as any).tinymce) {
      const editor = (window as any).tinymce.activeEditor;
      if (editor) {
        editor.insertContent(`<span class="template-variable" style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${variableCode}</span>&nbsp;`);
      }
    }
  }

  /**
   * Appliquer un style prédéfini
   */
  applyStyle(styleClass: string): void {
    if ((window as any).tinymce) {
      const editor = (window as any).tinymce.activeEditor;
      if (editor) {
        const selectedContent = editor.selection.getContent();
        if (selectedContent) {
          editor.selection.setContent(`<span class="${styleClass}">${selectedContent}</span>`);
        }
      }
    }
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
    this.saveTemplate();
  }

  onCancel(): void {
    this.router.navigate(['/contract-templates']);
  }
}
