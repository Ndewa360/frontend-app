import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContractTemplateService } from '../../../shared/services/contract-template.service';
import { ContractTemplateType, ContractTemplateStatus } from '../../../shared/models/contract-template.model';
import { htmlContentValidator, templateNameValidator, templateVariablesValidator } from '../../../shared/validators/html-content.validator';
import { MultilingualNotificationService } from '../../../shared/services/notification/multilingual-notification.service';
import { LanguageUrlService } from '../../../shared/services/language-url.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contract-template-editor',
  templateUrl: './contract-template-editor.component.html',
  styleUrls: ['./contract-template-editor.component.scss']
})
export class ContractTemplateEditorComponent implements OnInit, OnDestroy {
  templateForm: FormGroup;
  isEditMode = false;
  templateId: string | null = null;
  readonly apiKey = environment.tinyMceApiKey;

  // Template properties
  templateName = '';
  templateDescription = '';
  templateContent = '';

  // Valeurs originales pour détecter les changements
  private originalTemplateName = '';
  private originalTemplateDescription = '';
  private originalTemplateContent = '';

  // Styles extraits du HTML pour TinyMCE
  private extractedStyles: string = '';

  // UI state
  viewMode: 'edit' | 'preview' = 'edit';
  isSaving = false;
  isLoading = false;
  isContentLoading = false;
  lastSaveTime: Date | null = null;
  loadingError: string | null = null;
  hasUnsavedChanges = false;
  previewZoom = 100; // Zoom de prévisualisation en pourcentage

  // Export modal
  showExportModal = false;
  selectedExportFormat: string | null = null;
  isExporting = false;

  // Modal de confirmation pour modifications non sauvegardées
  showUnsavedChangesModal = false;
  private pendingNavigation: (() => void) | null = null;

  exportFormats = [
    {
      value: 'html',
      label: 'HTML',
      description: 'Format web standard avec styles',
      icon: 'fab fa-html5'
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Document portable pour impression',
      icon: 'fas fa-file-pdf'
    },
    {
      value: 'docx',
      label: 'Word',
      description: 'Document Microsoft Word éditable',
      icon: 'fas fa-file-word'
    }
  ];

  // TinyMCE configuration complète et fonctionnelle
  get editorConfig() {
    return this.getTinyMCEConfig();
  }

  private getTinyMCEConfig() {
    return {
    height: '100%', // Utilise toute la hauteur disponible
    width:'100%',
    min_height: 500, // Hauteur minimum
    menubar: 'file edit view insert format tools table help',

    // Plugins essentiels qui fonctionnent (sans ceux qui causent des 404)
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar1: 'undo redo | cut copy paste | bold italic underline strikethrough | ' +
      'fontselect fontsizeselect | forecolor backcolor | removeformat',
    toolbar2: 'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | blockquote | ' +
      'link unlink | image media table | code',
    toolbar3: 'searchreplace | visualblocks | ' +
      'insertdatetime | preview fullscreen help',

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

    // Configuration avancée - permettre l'interprétation des styles
    content_style: this.getContentStyle(),

    // Permettre l'interprétation complète du CSS
    content_css: true, // Ne pas charger le CSS par défaut
    body_class: 'template-editor-content',

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
    extended_valid_elements: 'style[type],link[href|rel],*[*]',

    // Configuration du code HTML
    code_dialog_height: 400,
    code_dialog_width: 800,

    // Configuration setup pour le drag and drop et autres fonctionnalités
    setup: (editor: any) => {
      // Gérer le drop des variables
      editor.on('drop', (e: any) => {
        const data = e.dataTransfer?.getData('text/html');
        if (data && data.includes('class="variable"')) {
          e.preventDefault();

          // Insérer le HTML de la variable à la position du drop
          editor.insertContent(data);

          // Déclencher l'événement de changement
          editor.fire('change');
        }
      });

      // Permettre le drop
      editor.on('dragover', (e: any) => {
        e.preventDefault();
      });

      // Désactiver subtilement la télémétrie sans casser l'éditeur
      editor.on('init', () => {
        // Désactiver les requêtes de télémétrie si possible
        if (editor.settings) {
          editor.settings.telemetry = false;
          editor.settings.usage_tracking = false;
        }
      });
    },

    // Configuration des images
    image_advtab: true,
    image_caption: true,
    image_title: true,
    image_class_list: [
      { title: 'Logo', value: 'logo' },
      { title: 'Image responsive', value: 'img-responsive' },
      { title: 'Image centrée', value: 'img-center' }
    ],

    // Configuration des tableaux
    table_default_attributes: {
      border: '1'
    },
    table_default_styles: {
      'border-collapse': 'collapse'
    },

    // Configuration de la paste - préserver les styles
    paste_as_text: false,
    paste_auto_cleanup_on_paste: false,
    paste_remove_styles_if_webkit: false,
    paste_retain_style_properties: "all",

    // Préserver les styles existants
    verify_html: false,
    cleanup: false,
    cleanup_on_startup: false,
    trim_span_elements: false,
    remove_redundant_brs: false,

    // Permettre tous les éléments et attributs pour préserver les styles (déjà défini plus haut)
    valid_children: "+body[style],+div[style]",

    // Configuration des images - permettre les images externes
    image_domains: ["storage.googleapis.com", "localhost","https://ndewa-360.com","https://www.ndewa-360.com"],
    relative_urls: false,
    remove_script_host: false,
    convert_urls: false,

    // Pas de templates prédéfinis - utiliser le template par défaut du système

    // Configuration du drag and drop - sera configuré dans ngAfterViewInit

    // Désactiver les services cloud et requêtes externes
    images_upload_handler: () => Promise.reject('Upload disabled'),
    automatic_uploads: false
    };
  }

  /**
   * Générer le CSS pour TinyMCE en combinant les styles de base et les styles extraits
   */
  private getContentStyle(): string {
    const baseStyles = `
      /* Styles de base pour l'éditeur */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
      }

      /* Variables stylées comme des composants */
      .variable {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.875rem;
        font-weight: 500;
        margin: 0 2px;
        cursor: pointer;
        user-select: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      }

      .variable:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      /* Classes utilitaires */
      .highlight { background-color: #ffff00; }
      .logo { max-height: 100px; width: auto; }
      .img-responsive { max-width: 100%; height: auto; }
      .img-center { display: block; margin: 0 auto; }
    `;

    // Combiner les styles de base avec les styles extraits du template
    return baseStyles + (this.extractedStyles ? '\n\n/* Styles du template */\n' + this.extractedStyles : '');
  }

  // Options for dropdowns — valeurs alignées sur les enums backend
  templateTypeOptions = [
    { content: 'Personnalisé', value: ContractTemplateType.CUSTOM, selected: true },
    { content: 'Dupliqué', value: ContractTemplateType.DUPLICATED, selected: false }
  ];

  statusOptions = [
    { content: 'Actif', value: ContractTemplateStatus.ACTIVE, selected: true },
    { content: 'Inactif', value: ContractTemplateStatus.INACTIVE, selected: false },
    { content: 'Archivé', value: ContractTemplateStatus.ARCHIVED, selected: false }
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
    private contractTemplateService: ContractTemplateService,
    private notification: MultilingualNotificationService,
    private languageUrlService: LanguageUrlService,
    private sanitizer: DomSanitizer
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, templateNameValidator()]],
      description: ['', [Validators.maxLength(500)]],
      content: ['', [Validators.required, htmlContentValidator()]],
      type: ['RENTAL', Validators.required],
      status: ['ACTIVE', Validators.required],
      customVariables: [null, templateVariablesValidator()]
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

        // Sauvegarder les valeurs originales des métadonnées
        this.originalTemplateName = this.templateName;
        this.originalTemplateDescription = this.templateDescription;

        // Charger le contenu du template
        this.contractTemplateService.getTemplateContent(this.templateId!).subscribe({
          next: (response) => {
            console.log('Template content loaded:', response);
            const fullContent = response.content || '<p>Commencez à rédiger votre contrat...</p>';

            // Extraire les styles et le contenu du body
            const { styles, bodyContent } = this.extractStylesFromHtml(fullContent);
            this.extractedStyles = styles;
            this.templateContent = bodyContent;

            this.isContentLoading = false;

            // Sauvegarder les valeurs originales pour détecter les changements
            this.saveOriginalValues();

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
    console.log('Extracted styles:', this.extractedStyles);

    // Transformer les variables en composants visuels
    const contentWithComponents = this.transformVariablesToComponents(this.templateContent || '<p>Commencez à rédiger...</p>');

    // Méthode plus robuste pour mettre à jour TinyMCE avec les styles
    const updateEditor = () => {
      if ((window as any).tinymce) {
        const editor = (window as any).tinymce.activeEditor;
        if (editor && editor.initialized) {
          console.log('Setting content in TinyMCE editor');

          // Mettre à jour les styles CSS de l'éditeur
          const newContentStyle = this.getContentStyle();
          if (editor.dom && editor.dom.doc) {
            // Supprimer les anciens styles personnalisés
            const existingStyle = editor.dom.doc.getElementById('custom-template-styles');
            if (existingStyle) {
              existingStyle.remove();
            }

            // Ajouter les nouveaux styles
            const styleElement = editor.dom.doc.createElement('style');
            styleElement.id = 'custom-template-styles';
            styleElement.textContent = this.extractedStyles || '';
            editor.dom.doc.head.appendChild(styleElement);
          }

          editor.setContent(contentWithComponents);
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

  // Navigation methods - supprimé car dupliqué plus bas

  // Save status methods
  getSaveStatusClass(): string {
    if (this.isSaving) return 'saving';
    if (!this.hasChanges()) return 'saved';
    return 'unsaved';
  }

  getSaveStatusIcon(): string {
    if (this.isSaving) return 'fa-spinner fa-spin';
    if (!this.hasChanges()) return 'fa-check';
    return 'fa-exclamation-triangle';
  }

  getSaveStatusText(): string {
    if (this.isSaving) return 'Sauvegarde...';
    if (!this.hasChanges()) return 'Sauvegardé';
    return 'Non sauvegardé';
  }

  ngOnDestroy(): void {
    // Nettoyage du composant
  }

  // View mode methods
  setViewMode(mode: 'edit' | 'preview'): void {
    this.viewMode = mode;
  }

  // Template actions
  saveTemplate(triggeredByShortcut: boolean = false): void {
    if (!this.templateName.trim()) {
      this.notification.warning('TEMPLATE.VALIDATION.NAME_REQUIRED', 'TEMPLATE.VALIDATION.TITLE');
      return;
    }

    this.isSaving = true;

    // Transformer les composants visuels en variables textuelles pour la sauvegarde
    const bodyContent = this.transformComponentsToVariables(this.templateContent);
    const contentForSave = this.combineContentWithStyles(bodyContent, this.extractedStyles);



    const templateData = {
      name: this.templateName,
      description: this.templateDescription,
      content: contentForSave,
      type: ContractTemplateType.CUSTOM
      // status est défini automatiquement par le backend
    };

    if (this.isEditMode && this.templateId) {
      // Mise à jour d'un template existant - séparer les métadonnées du contenu
      const metadataUpdate = {
        name: this.templateName,
        description: this.templateDescription,
        status: ContractTemplateStatus.ACTIVE
      };

      // Préparer le contenu pour la sauvegarde - recombiner styles et contenu
      const bodyContent = this.transformComponentsToVariables(this.templateContent);
      const contentForSave = this.combineContentWithStyles(bodyContent, this.extractedStyles);



      // D'abord mettre à jour les métadonnées
      this.contractTemplateService.updateTemplate(this.templateId, metadataUpdate).subscribe({
        next: (response) => {
          // Ensuite mettre à jour le contenu
          this.contractTemplateService.uploadTemplateContent(this.templateId, {
            content: contentForSave
          }).subscribe({
            next: (contentResponse) => {
              this.isSaving = false;
              this.lastSaveTime = new Date();
              // Sauvegarder les nouvelles valeurs comme valeurs originales
              this.saveOriginalValues();
              console.log('Template mis à jour avec succès');
              this.notification.success('TEMPLATE.SAVE.SUCCESS', 'TEMPLATE.SAVE.TITLE');
            },
            error: (error) => {
              this.isSaving = false;
              console.error('Erreur lors de la mise à jour du contenu:', error);

              // Afficher le message d'erreur spécifique du serveur
              let errorMessage = 'TEMPLATE.SAVE.ERROR';
              if (error?.error?.message && Array.isArray(error.error.message)) {
                errorMessage = error.error.message[0];
              } else if (error?.error?.message) {
                errorMessage = error.error.message;
              }

              this.notification.error(errorMessage, 'TEMPLATE.SAVE.TITLE');
            }
          });
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Erreur lors de la mise à jour des métadonnées:', error);

          // Afficher le message d'erreur spécifique du serveur
          let errorMessage = 'TEMPLATE.SAVE.ERROR';
          if (error?.error?.message && Array.isArray(error.error.message)) {
            errorMessage = error.error.message[0];
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.notification.error(errorMessage, 'TEMPLATE.SAVE.TITLE');
        }
      });
    } else {
      // Création d'un nouveau template
      this.contractTemplateService.createTemplate(templateData).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.lastSaveTime = new Date();
          // Sauvegarder les nouvelles valeurs comme valeurs originales
          this.saveOriginalValues();
          console.log('Template créé avec succès');
          this.notification.success('TEMPLATE.CREATE.SUCCESS', 'TEMPLATE.CREATE.TITLE');
          // Rediriger vers la vue du template créé
          const currentLang = this.languageUrlService.getCurrentLanguage();
          this.router.navigate([`/${currentLang}/app/contract-templates/view`, response._id]);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Erreur lors de la création:', error);

          // Afficher le message d'erreur spécifique du serveur
          let errorMessage = 'TEMPLATE.CREATE.ERROR';
          if (error?.error?.message && Array.isArray(error.error.message)) {
            errorMessage = error.error.message[0];
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.notification.error(errorMessage, 'TEMPLATE.CREATE.TITLE');
        }
      });
    }
  }



  /**
   * Sauvegarder les valeurs originales pour détecter les changements
   */
  private saveOriginalValues(): void {
    this.originalTemplateName = this.templateName;
    this.originalTemplateDescription = this.templateDescription;
    this.originalTemplateContent = this.templateContent;
    this.hasUnsavedChanges = false;
  }

  hasChanges(): boolean {
    if (!this.isEditMode) {
      // Nouveau template - vérifier si du contenu a été ajouté
      return this.templateName !== 'Nouveau modèle de contrat' ||
             this.templateDescription !== '' ||
             this.templateContent !== '<p>Commencez à rédiger votre modèle de contrat...</p>';
    }

    // Mode édition - comparer avec les valeurs originales
    return this.templateName !== this.originalTemplateName ||
           this.templateDescription !== this.originalTemplateDescription ||
           this.templateContent !== this.originalTemplateContent;
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

    // Les styles sont maintenant préservés - pas de nettoyage automatique
  }

  // Preview methods
  getPreviewContent(): string {
    // Cette méthode retourne un HTML complet pour les exports et l'impression
    if (!this.templateContent) {
      return this.combineContentWithStyles('<p>Aucun contenu à prévisualiser</p>', this.extractedStyles);
    }

    const previewBodyContent = this.getPreviewBodyContent();
    return this.combineContentWithStyles(previewBodyContent, this.extractedStyles);
  }

  /**
   * Retourne le HTML complet pour l'iframe de prévisualisation
   * Combine les styles extraits + le contenu body avec variables remplacées
   */
  getPreviewHtml(): SafeHtml {
    const bodyContent = this.getPreviewBodyContent();
    const styles = this.extractedStyles || '';
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${styles}
  </style>
</head>
<body>${bodyContent}</body>
</html>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Obtenir le contenu body de la prévisualisation avec variables remplacées
   * Utilisé pour la prévisualisation intégrée (innerHTML)
   */
  getPreviewBodyContent(): string {
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

  /**
   * Obtenir les styles CSS pour la prévisualisation intégrée
   */
  getPreviewStyles(): string {
    return this.sanitizeCss(this.extractedStyles || '');
  }



  printPreview(): void {
    // Créer un HTML complet avec les styles extraits du template
    const previewContent = this.getPreviewContent();
    const bodyContent = this.transformComponentsToVariables(previewContent);
    const fullHtmlContent = this.combineContentWithStyles(bodyContent, this.extractedStyles);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtmlContent);
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

  // Statistics methods - supprimées car dupliquées plus bas

  onSave(): void {
    this.saveTemplate();
  }

  onCancel(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/contract-templates`]);
  }

  /**
   * Retour à la liste des templates
   */
  goBack(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/contract-templates`]);
  }

  /**
   * Gérer la navigation retour avec vérification des modifications
   */
  handleBackNavigation(): void {
    console.log('🔄 handleBackNavigation appelée');
    console.log('📝 hasChanges():', this.hasChanges());

    if (this.hasChanges()) {
      console.log('✅ Modifications détectées, affichage du modal');
      this.pendingNavigation = () => this.goBack();
      this.showUnsavedChangesModal = true;
      console.log('🔍 showUnsavedChangesModal:', this.showUnsavedChangesModal);
    } else {
      console.log('❌ Aucune modification, navigation directe');
      this.goBack();
    }
  }

  /**
   * Annuler la navigation et rester sur la page
   */
  cancelNavigation(): void {
    this.showUnsavedChangesModal = false;
    this.pendingNavigation = null;
  }

  /**
   * Sauvegarder d'abord puis naviguer
   */
  saveAndNavigate(): void {
    if (!this.templateName.trim()) {
      this.notification.warning('TEMPLATE.VALIDATION.NAME_REQUIRED', 'TEMPLATE.VALIDATION.TITLE');
      return;
    }

    // Sauvegarder le template
    this.saveTemplate();

    // Attendre la fin de la sauvegarde pour naviguer
    const checkSaveComplete = () => {
      if (!this.isSaving) {
        this.showUnsavedChangesModal = false;
        if (this.pendingNavigation) {
          this.pendingNavigation();
          this.pendingNavigation = null;
        }
      } else {
        // Vérifier à nouveau dans 100ms
        setTimeout(checkSaveComplete, 100);
      }
    };

    setTimeout(checkSaveComplete, 100);
  }

  /**
   * Ignorer les modifications et naviguer
   */
  ignoreChangesAndNavigate(): void {
    this.showUnsavedChangesModal = false;
    this.hasUnsavedChanges = false; // Réinitialiser le flag

    if (this.pendingNavigation) {
      this.pendingNavigation();
      this.pendingNavigation = null;
    }
  }

  /**
   * Obtenir le nombre de mots
   */
  getWordCount(): number {
    if (!this.templateContent) return 0;
    const text = this.templateContent.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  /**
   * Obtenir le nombre de caractères
   */
  getCharacterCount(): number {
    if (!this.templateContent) return 0;
    return this.templateContent.replace(/<[^>]*>/g, '').length;
  }

  /**
   * Extraire les styles CSS du HTML complet
   */
  private extractStylesFromHtml(html: string): { styles: string; bodyContent: string } {
    if (!html) return { styles: '', bodyContent: '' };



    // Créer un parser DOM temporaire
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extraire tous les styles du head
    const styleElements = doc.querySelectorAll('head style');
    const linkElements = doc.querySelectorAll('head link[rel="stylesheet"]');

    let extractedStyles = '';

    // Récupérer le contenu des balises <style>
    styleElements.forEach((style) => {
      const styleContent = style.textContent || style.innerHTML;
      if (styleContent) {

        extractedStyles += styleContent + '\n';
      }
    });

    // Traiter les liens CSS externes (les conserver comme commentaires pour référence)
    linkElements.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {

        extractedStyles += `/* Lien CSS externe: ${href} */\n`;
      }
    });

    // Extraire le contenu du body
    const bodyElement = doc.querySelector('body');
    const bodyContent = bodyElement ? bodyElement.innerHTML : html;



    return {
      styles: extractedStyles.trim(),
      bodyContent: bodyContent.trim()
    };
  }

  /**
   * Combiner le contenu du body avec les styles pour créer un HTML complet
   */
  private combineContentWithStyles(bodyContent: string, styles: string): string {

    // Nettoyer le contenu HTML avant de le combiner
    const cleanBodyContent = this.sanitizeHtml(bodyContent);
    const cleanStyles = this.sanitizeCss(styles);

    // Créer un HTML complet bien structuré
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template de Contrat</title>
  ${cleanStyles ? `<style type="text/css">\n${cleanStyles}\n</style>` : ''}
</head>
<body>
${cleanBodyContent}
</body>
</html>`;

    // Validation finale pour sécuriser le HTML
    const finalCleanHtml = this.finalHtmlValidation(fullHtml, bodyContent);
    return finalCleanHtml;
  }

  /**
   * Validation finale du HTML avant envoi au serveur
   */
  private finalHtmlValidation(html: string, originalBodyContent?: string): string {
    // ÉTAPE 1: Protéger les balises <style> en les remplaçant temporairement
    const styleBlocks: string[] = [];
    let htmlWithProtectedStyles = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
      const index = styleBlocks.length;
      styleBlocks.push(match);
      return `<!--PROTECTED_STYLE_${index}-->`;
    });

    // Liste des balises autorisées (whitelist) - ÉTENDUE
    const allowedTags = [
      'html', 'head', 'body', 'title', 'meta', 'style',
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 'br', 'hr',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
      'img', 'a', 'blockquote', 'pre', 'code',
      'header', 'footer', 'section', 'article', 'nav', 'aside', 'main',
      'figure', 'figcaption', 'address', 'time'
    ];



    // ÉTAPE 2: Supprimer les balises non autorisées du HTML avec styles protégés
    let cleanHtml = htmlWithProtectedStyles.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();
      if (allowedTags.includes(lowerTagName)) {
        return match;
      } else {

        return '';
      }
    });



    // Supprimer les attributs dangereux même sur les balises autorisées
    cleanHtml = cleanHtml
      .replace(/\s(on\w+)\s*=\s*["'][^"']*["']/gi, '') // Événements
      .replace(/\s(style)\s*=\s*["'][^"']*expression[^"']*["']/gi, '') // Styles avec expression
      .replace(/\s(href|src)\s*=\s*["'](javascript|vbscript|data:text\/html)[^"']*["']/gi, ''); // URLs dangereuses

    // ÉTAPE 3: Restaurer les blocs de styles protégés
    styleBlocks.forEach((styleBlock, index) => {
      cleanHtml = cleanHtml.replace(`<!--PROTECTED_STYLE_${index}-->`, styleBlock);
    });

    // Test final avec les patterns exacts du backend
    const validation = this.testHtmlWithBackendPatterns(cleanHtml);
    if (!validation.isValid) {
      console.error('🚨 HTML final échoue à la validation backend:', validation.errors);
      // Essayer une version simplifiée
      if (originalBodyContent) {
        console.log('🔄 Tentative avec HTML simplifié');
        const simpleHtml = this.createSimpleHtml(originalBodyContent);
        const simpleValidation = this.testHtmlWithBackendPatterns(simpleHtml);
        if (simpleValidation.isValid) {
          console.log('✅ HTML simplifié validé');
          return simpleHtml;
        }
      }
    }

    // Si le HTML est encore trop complexe, utiliser une version simplifiée
    if (cleanHtml.length > 50000 && originalBodyContent) {
      return this.createSimpleHtml(originalBodyContent);
    }

    return cleanHtml;
  }

  /**
   * Créer un HTML simplifié en cas de problème - AVEC STYLES
   */
  private createSimpleHtml(bodyContent: string): string {
    // Inclure les styles extraits même dans la version simplifiée
    const cleanStyles = this.sanitizeCss(this.extractedStyles);

    const simpleHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Template de Contrat</title>
  ${cleanStyles ? `<style type="text/css">\n${cleanStyles}\n</style>` : ''}
</head>
<body>
${this.sanitizeHtml(bodyContent)}
</body>
</html>`;


    return simpleHtml;
  }

  /**
   * Tester le HTML avec les patterns exacts du backend
   */
  private testHtmlWithBackendPatterns(html: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Patterns exacts du backend
    const dangerousPatterns = [
      { pattern: /<script[^>]*>/gi, message: 'Les balises <script> ne sont pas autorisées' },
      { pattern: /javascript:/gi, message: 'Le code JavaScript n\'est pas autorisé' },
      { pattern: /on\w+\s*=/gi, message: 'Les gestionnaires d\'événements ne sont pas autorisés' },
      { pattern: /<iframe[^>]*>/gi, message: 'Les balises <iframe> ne sont pas autorisées' },
      { pattern: /<object[^>]*>/gi, message: 'Les balises <object> ne sont pas autorisées' },
      { pattern: /<embed[^>]*>/gi, message: 'Les balises <embed> ne sont pas autorisées' }
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(html)) {
        errors.push(message);
        console.error('🚨 Pattern détecté:', message, pattern);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }



  /**
   * Nettoyer le HTML en supprimant les éléments dangereux
   * Utilise exactement les mêmes patterns que le backend
   */
  private sanitizeHtml(html: string): string {
    if (!html) return '';

    console.log('🧹 Nettoyage HTML - Avant:', html.substring(0, 500) + '...');

    // Utiliser exactement les mêmes patterns que le backend
    let cleanHtml = html
      // Pattern 1: /<script[^>]*>/gi - Supprimer les balises script (ouverture)
      .replace(/<script[^>]*>/gi, '')
      // Supprimer aussi les balises script complètes
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

      // Pattern 2: /javascript:/gi - Supprimer toutes les références javascript:
      .replace(/javascript:/gi, '')

      // Pattern 3: /on\w+\s*=/gi - Supprimer tous les gestionnaires d'événements
      .replace(/on\w+\s*=/gi, '')

      // Pattern 4: /<iframe[^>]*>/gi - Supprimer les balises iframe (ouverture)
      .replace(/<iframe[^>]*>/gi, '')
      // Supprimer aussi les balises iframe complètes
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')

      // Pattern 5: /<object[^>]*>/gi - Supprimer les balises object (ouverture)
      .replace(/<object[^>]*>/gi, '')
      // Supprimer aussi les balises object complètes
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')

      // Pattern 6: /<embed[^>]*>/gi - Supprimer les balises embed
      .replace(/<embed[^>]*>/gi, '')

      // Nettoyages supplémentaires pour la sécurité
      .replace(/vbscript:/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Vérification finale avec les patterns exacts du backend
    const backendPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    let hasIssues = false;
    backendPatterns.forEach((pattern, index) => {
      if (pattern.test(cleanHtml)) {
        console.error(`🚨 Pattern ${index + 1} encore présent:`, pattern);
        hasIssues = true;
      }
    });

    if (hasIssues) {
      console.error('🚨 HTML contient encore des éléments dangereux après nettoyage');
    } else {
      console.log('✅ HTML nettoyé et validé');
    }

    console.log('🧹 Nettoyage HTML - Après:', cleanHtml.substring(0, 500) + '...');
    return cleanHtml;
  }

  /**
   * Nettoyer le CSS en supprimant les propriétés dangereuses
   */
  private sanitizeCss(css: string): string {
    if (!css) return '';

    console.log('🎨 Nettoyage CSS - Avant:', css.substring(0, 200) + '...');

    // Supprimer les propriétés CSS potentiellement dangereuses
    let cleanCss = css
      // Supprimer les expressions et fonctions dangereuses
      .replace(/expression\s*\([^)]*\)/gi, '') // Expressions IE
      .replace(/javascript:/gi, '') // Références javascript
      .replace(/vbscript:/gi, '') // Références vbscript
      .replace(/data:text\/html/gi, '') // Data URLs HTML

      // Supprimer les imports et behaviors (mais garder les autres @rules)
      .replace(/@import[^;]*;/gi, '') // Imports externes
      .replace(/behavior\s*:[^;]*;/gi, '') // Behaviors IE

      // Supprimer les propriétés potentiellement dangereuses
      .replace(/binding\s*:[^;]*;/gi, '') // XML binding
      .replace(/-moz-binding\s*:[^;]*;/gi, ''); // Mozilla binding

      // NE PAS supprimer les commentaires CSS normaux car ils peuvent contenir des infos utiles
      // NE PAS supprimer @charset car c'est utile pour l'encodage

    // Vérifier que nous n'avons pas supprimé tout le CSS
    if (css.length > 100 && cleanCss.length < 10) {
      console.warn('⚠️ Nettoyage CSS trop agressif, restauration partielle');
      // Restaurer une version moins agressive
      cleanCss = css
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '');
    }

    console.log('🎨 Nettoyage CSS - Après:', cleanCss.substring(0, 200) + '...');
    console.log('📊 Taille CSS - Avant:', css.length, 'Après:', cleanCss.length);

    return cleanCss;
  }

  /**
   * Gérer le raccourci clavier Ctrl+S pour sauvegarder
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+S ou Cmd+S (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Empêcher le comportement par défaut du navigateur

      // Sauvegarder seulement si on peut (pas déjà en cours de sauvegarde et il y a des changements)
      if (!this.isSaving && this.hasChanges()) {
        console.log('💾 Sauvegarde déclenchée par Ctrl+S');
        this.saveTemplate(true);
      } else if (!this.hasChanges()) {
        // Afficher un message si aucun changement à sauvegarder
        this.notification.info('TEMPLATE.SAVE.NO_CHANGES', 'TEMPLATE.SAVE.TITLE');
      }
    }
  }

  /**
   * Protéger contre la fermeture de fenêtre avec modifications non sauvegardées
   */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    // Vérifier s'il y a des modifications non sauvegardées
    if (this.hasChanges()) {
      // Message standard du navigateur
      event.preventDefault();
      event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
      return event.returnValue;
    }
    return;
  }

  /**
   * Obtenir l'heure de la dernière sauvegarde
   */
  getLastSaveTime(): string {
    if (!this.lastSaveTime) return 'Jamais';
    return this.lastSaveTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Transformer les variables en composants visuels
   */
  private transformVariablesToComponents(content: string): string {
    // Transformer {{variable}} en composants stylés
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      return `<span class="variable" contenteditable="false" data-variable="${variableName.trim()}">${variableName.trim()}</span>`;
    });
  }

  /**
   * Transformer les composants visuels en variables textuelles pour la sauvegarde
   */
  private transformComponentsToVariables(content: string): string {
    // Transformer les spans de variables en {{variable}}
    return content.replace(/<span[^>]*class="variable"[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g, (match, variableName) => {
      return `{{${variableName}}}`;
    });
  }

  /**
   * Gérer le début du drag d'une variable
   */
  onVariableDragStart(event: DragEvent, variable: any): void {
    if (event.dataTransfer) {
      // Extraire le nom de la variable du code (enlever les accolades)
      const variableName = variable.code.replace(/[{}]/g, '');

      // Créer le HTML de la variable avec les styles appropriés
      const variableHtml = `<span class="variable" contenteditable="false" data-variable="${variableName}">${variableName}</span>`;

      event.dataTransfer.setData('text/html', variableHtml);
      event.dataTransfer.setData('text/plain', variable.code);
      event.dataTransfer.setData('application/json', JSON.stringify(variable));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  /**
   * Zoomer dans la prévisualisation
   */
  zoomIn(): void {
    if (this.previewZoom < 200) {
      this.previewZoom += 25;
    }
  }

  /**
   * Dézoomer dans la prévisualisation
   */
  zoomOut(): void {
    if (this.previewZoom > 50) {
      this.previewZoom -= 25;
    }
  }

  /**
   * Ouvrir le modal d'export
   */
  openExportModal(): void {
    this.showExportModal = true;
    this.selectedExportFormat = null;
  }

  /**
   * Fermer le modal d'export
   */
  closeExportModal(): void {
    this.showExportModal = false;
    this.selectedExportFormat = null;
    this.isExporting = false;
  }

  /**
   * Sélectionner un format d'export
   */
  selectExportFormat(format: any): void {
    this.selectedExportFormat = format.value;
  }

  /**
   * Exporter le template dans le format sélectionné
   */
  exportTemplate(): void {
    if (!this.selectedExportFormat) return;

    this.isExporting = true;
    const content = this.getPreviewContent();

    switch (this.selectedExportFormat) {
      case 'html':
        this.exportAsHTML(content);
        break;
      case 'pdf':
        this.exportAsPDF(content);
        break;
      case 'docx':
        this.exportAsWord(content);
        break;
    }
  }

  /**
   * Exporter en HTML
   */
  private exportAsHTML(content: string): void {
    // Créer un HTML complet avec les styles extraits du template
    const bodyContent = this.transformComponentsToVariables(content);
    const fullHtmlContent = this.combineContentWithStyles(bodyContent, this.extractedStyles);

    const blob = new Blob([fullHtmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.templateName}.html`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.isExporting = false;
    this.closeExportModal();
    this.notification.success('TEMPLATE.EXPORT.HTML_SUCCESS', 'TEMPLATE.EXPORT.TITLE');
  }

  /**
   * Exporter en PDF
   */
  private exportAsPDF(content: string): void {
    // Créer un HTML complet avec les styles extraits du template
    const bodyContent = this.transformComponentsToVariables(content);
    const fullHtmlContent = this.combineContentWithStyles(bodyContent, this.extractedStyles);

    // Utiliser html2pdf ou une bibliothèque similaire
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }

    this.isExporting = false;
    this.closeExportModal();
    this.notification.success('TEMPLATE.EXPORT.PDF_SUCCESS', 'TEMPLATE.EXPORT.TITLE');
  }

  /**
   * Exporter en Word
   */
  private exportAsWord(content: string): void {
    // Créer un HTML complet avec les styles extraits du template
    const bodyContent = this.transformComponentsToVariables(content);
    const fullHtmlContent = this.combineContentWithStyles(bodyContent, this.extractedStyles);

    // Adapter le HTML pour Word avec les namespaces nécessaires
    const wordContent = fullHtmlContent.replace(
      '<html lang="fr">',
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    ).replace(
      '<head>',
      `<head>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
    </xml>
    <![endif]-->`
    );

    const blob = new Blob([wordContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.templateName}.doc`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.isExporting = false;
    this.closeExportModal();
    this.notification.success('TEMPLATE.EXPORT.WORD_SUCCESS', 'TEMPLATE.EXPORT.TITLE');
  }


}
