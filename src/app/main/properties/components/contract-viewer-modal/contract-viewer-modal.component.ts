import { Component, Inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import {
  RoomModel,
  LocationModel,
  LocataireModel,
  ContractState,
  ContractAction,
  LocataireState,
  LocationState
} from 'src/app/shared/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ContractTemplateService } from 'src/app/shared/services/contract-template.service';
import { ContractTemplateModel, ContractTemplateType } from 'src/app/shared/models/contract-template.model';

export interface ContractViewerData {
  room: RoomModel;
  location?: LocationModel;
  tenant?: LocataireModel;
}

@Component({
  selector: 'app-contract-viewer-modal',
  templateUrl: './contract-viewer-modal.component.html',
  styleUrls: ['./contract-viewer-modal.component.scss']
})
export class ContractViewerModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Select(ContractState.selectStateLoading) loadingContract$: Observable<boolean>;
  
  // Données du contrat
  contractPdfSrc: string = '';
  location: LocationModel | null = null;
  tenant: LocataireModel | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // États de l'interface
  isFullscreen = false;
  currentPage = 1;
  totalPages = 1;
  zoomLevel = 1;

  // Gestion des templates
  availableTemplates: ContractTemplateModel[] = [];
  selectedTemplateId: string = '';
  isLoadingTemplates = false;
  showTemplateSelector = false;

  constructor(
    private dialogRef: MatDialogRef<ContractViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContractViewerData,
    private store: Store,
    private toastr: ToastrService,
    private contractTemplateService: ContractTemplateService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeContractData();
    this.loadAvailableTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Fermer le dropdown si on clique en dehors
    if (this.showTemplateSelector) {
      const target = event.target as HTMLElement;
      const templateContainer = target.closest('.template-selector-container');
      if (!templateContainer) {
        this.showTemplateSelector = false;
      }
    }
  }

  /**
   * Initialise les données du contrat
   */
  private initializeContractData(): void {
    console.log('🔍 Initialisation des données du contrat pour:', this.data.room);

    // Récupérer la location si pas fournie
    if (!this.data.location) {
      this.findLocationForRoom();
    } else {
      this.location = this.data.location;
      this.loadContractData();
    }
  }

  /**
   * Trouve la location active pour cette chambre
   */
  private findLocationForRoom(): void {
    const locations = this.store.selectSnapshot(LocationState.selectStateLocations) as LocationModel[];
    this.location = locations?.find((loc: LocationModel) => 
      loc.room === this.data.room._id && loc.isRunning
    ) || null;

    if (!this.location) {
      this.handleError('CONTRACT_VIEWER.NO_ACTIVE_LOCATION_FOUND');
      return;
    }

    this.loadContractData();
  }

  /**
   * Charge les données du contrat
   */
  private loadContractData(): void {
    if (!this.location) {
      this.handleError('CONTRACT_VIEWER.LOCATION_DATA_MISSING');
      return;
    }

    console.log('📄 Chargement du contrat pour la location:', this.location._id);

    // Récupérer le locataire
    this.loadTenantData();

    // Récupérer le contrat depuis le store ou le charger
    const contractObservable = this.store.select(
      ContractState.selectStateContractByLocationId(this.location._id)
    );

    contractObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe(contract => {
      if (contract) {
        console.log('✅ Contrat trouvé dans le store');
        this.contractPdfSrc = `data:application/pdf;base64,${contract.pdf}`;
        this.isLoading = false;
      } else {
        console.log('📥 Chargement du contrat depuis l\'API...');
        this.store.dispatch(new ContractAction.FetchContract(this.location!._id));
      }
    });

    // Observer le loading state
    this.loadingContract$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.isLoading = loading;
    });
  }

  /**
   * Charge les données du locataire
   */
  private loadTenantData(): void {
    if (!this.location) return;

    if (this.data.tenant) {
      this.tenant = this.data.tenant;
      return;
    }

    const tenantObservable = this.store.select(
      LocataireState.selectStateLocataire(this.location.locataire)
    );

    tenantObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe(tenant => {
      this.tenant = tenant;
    });
  }

  /**
   * Gère les erreurs
   */
  private handleError(message: string): void {
    console.error('❌ Erreur:', message);
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
    this.toastr.error(message, this.translate.instant('NOTIFICATIONS.ERROR'));
  }

  /**
   * Ferme le modal
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Bascule en mode plein écran
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    
    if (this.isFullscreen) {
      this.dialogRef.updateSize('100vw', '100vh');
      this.dialogRef.updatePosition({ top: '0', left: '0' });
    } else {
      this.dialogRef.updateSize('90vw', '90vh');
      this.dialogRef.updatePosition();
    }
  }

  /**
   * Télécharge le contrat
   */
  downloadContract(): void {
    if (!this.contractPdfSrc || !this.tenant) {
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.CONTRACT_NOT_AVAILABLE_DOWNLOAD'), this.translate.instant('NOTIFICATIONS.ERROR'));
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = this.contractPdfSrc;
      link.download = `Contrat_${this.tenant.fullName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toastr.success(this.translate.instant('CONTRACT_VIEWER.CONTRACT_DOWNLOADED_SUCCESS'), this.translate.instant('NOTIFICATIONS.SUCCESS'));
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.DOWNLOAD_ERROR'), this.translate.instant('NOTIFICATIONS.ERROR'));
    }
  }

  /**
   * Imprime le contrat
   */
  printContract(): void {
    if (!this.contractPdfSrc) {
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.CONTRACT_NOT_AVAILABLE_PRINT'), this.translate.instant('NOTIFICATIONS.ERROR'));
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Contrat de location</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${this.contractPdfSrc}"></iframe>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.PRINT_ERROR'), this.translate.instant('NOTIFICATIONS.ERROR'));
    }
  }

  /**
   * Envoie le contrat par email
   */
  sendContractByEmail(): void {
    if (!this.tenant?.email) {
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.TENANT_EMAIL_NOT_AVAILABLE'), this.translate.instant('NOTIFICATIONS.ERROR'));
      return;
    }

    // Préparer les données pour l'envoi par email
    const emailData = {
      to: this.tenant.email,
      subject: 'CONTRACT_VIEWER.EMAIL_SUBJECT',
      contractPdfUrl: this.contractPdfSrc,
      tenantName: this.tenant.fullName,
      propertyAddress: this.data.room ? `Unité ${this.data.room.code}` : 'Propriété'
    };

    // Appeler le service d'email (à implémenter)
    console.log('Envoi par email:', emailData);
    this.toastr.success(this.translate.instant('CONTRACT_VIEWER.EMAIL_SENT_SUCCESS'), this.translate.instant('NOTIFICATIONS.SUCCESS'));

    // TODO: Remplacer par un vrai service d'email
    // this.emailService.sendContract(emailData).subscribe({
    //   next: () => this.toastr.success('Email envoyé avec succès', 'Succès'),
    //   error: (error) => this.toastr.error('Erreur lors de l\'envoi de l\'email', 'Erreur')
    // });
  }

  /**
   * Obtient le titre du contrat
   */
  getContractTitle(): string {
    if (this.tenant) {
      return 'CONTRACT_VIEWER.CONTRACT_TITLE_WITH_TENANT';
    }
    return 'CONTRACT_VIEWER.CONTRACT_TITLE';
  }

  /**
   * Obtient les informations de l'unité
   */
  getRoomInfo(): string {
    const room = this.data.room;
    return `Unité ${room.code || room._id} - ${room.type || 'Type non spécifié'}`;
  }

  /**
   * Charger les templates disponibles
   */
  private loadAvailableTemplates(): void {
    this.isLoadingTemplates = true;

    this.contractTemplateService.getTemplates().subscribe({
      next: (response) => {
        this.availableTemplates = response.templates || [];

        // Définir le template par défaut basé sur la location
        if (this.location?.contractTemplateUrl) {
          if (this.location.contractTemplateUrl.startsWith('template_id:')) {
            this.selectedTemplateId = this.location.contractTemplateUrl.replace('template_id:', '');
          }
        }

        // Si aucun template sélectionné, utiliser le premier disponible
        if (!this.selectedTemplateId && this.availableTemplates.length > 0) {
          const defaultTemplate = this.availableTemplates.find(t => t.isDefault) || this.availableTemplates[0];
          this.selectedTemplateId = defaultTemplate._id;
        }

        this.isLoadingTemplates = false;
        console.log('📝 Templates chargés:', this.availableTemplates.length, 'Template sélectionné:', this.selectedTemplateId);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des templates:', error);
        this.isLoadingTemplates = false;
        this.toastr.error(this.translate.instant('CONTRACT_VIEWER.TEMPLATES_LOADING_ERROR'), this.translate.instant('NOTIFICATIONS.ERROR'));
      }
    });
  }

  /**
   * Basculer l'affichage du sélecteur de template
   */
  toggleTemplateSelector(): void {
    this.showTemplateSelector = !this.showTemplateSelector;
  }

  /**
   * Changer le template sélectionné et régénérer le contrat
   */
  onTemplateChange(templateId: string): void {
    if (templateId === this.selectedTemplateId) {
      return; // Pas de changement
    }

    this.selectedTemplateId = templateId;
    console.log('🎨 Changement de template:', templateId);

    // Régénérer le contrat avec le nouveau template
    this.regenerateContractWithTemplate(templateId);
  }

  /**
   * Régénérer le contrat avec un template spécifique
   */
  private regenerateContractWithTemplate(templateId: string): void {
    if (!this.location) {
      this.toastr.error(this.translate.instant('CONTRACT_VIEWER.LOCATION_DATA_MISSING'), this.translate.instant('NOTIFICATIONS.ERROR'));
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.contractPdfSrc = '';

    console.log('🔄 Régénération du contrat avec template:', templateId);
    console.log('🗑️ Suppression du contrat existant du cache');

    // Supprimer le contrat existant du store pour forcer le rechargement
    this.store.dispatch(new ContractAction.RemoveContract(this.location._id));

    // Appeler l'API de génération avec le template spécifique
    this.contractTemplateService.generateContractWithTemplate(this.location._id, templateId).subscribe({
      next: (response) => {
        console.log('✅ Contrat régénéré avec succès');
        console.log('📊 Taille du nouveau contrat:', response.data.length, 'caractères');

        this.contractPdfSrc = `data:application/pdf;base64,${response.data}`;
        this.isLoading = false;

        // Mettre à jour le store avec le nouveau contrat
        this.store.dispatch(new ContractAction.SetContract({
          locationId: this.location!._id,
          pdf: response.data
        }));

        this.toastr.success(this.translate.instant('CONTRACT_VIEWER.CONTRACT_REGENERATED_SUCCESS'), this.translate.instant('NOTIFICATIONS.SUCCESS'));
      },
      error: (error) => {
        console.error('❌ Erreur lors de la régénération:', error);
        this.handleError('Erreur lors de la régénération du contrat');
        this.toastr.error(this.translate.instant('CONTRACT_VIEWER.REGENERATION_ERROR'), this.translate.instant('NOTIFICATIONS.ERROR'));
      }
    });
  }

  /**
   * Obtenir le nom du template sélectionné
   */
  getSelectedTemplateName(): string {
    const template = this.availableTemplates.find(t => t._id === this.selectedTemplateId);
    return template?.name || 'CONTRACT_VIEWER.DEFAULT_TEMPLATE_NAME';
  }

  /**
   * Obtenir le label d'affichage pour le type de template
   */
  getTemplateTypeLabel(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'CONTRACT_VIEWER.TEMPLATE_TYPE_DEFAULT';
      case ContractTemplateType.CUSTOM:
        return 'CONTRACT_VIEWER.TEMPLATE_TYPE_CUSTOM';
      case ContractTemplateType.DUPLICATED:
        return 'CONTRACT_VIEWER.TEMPLATE_TYPE_DUPLICATED';
      default:
        return 'CONTRACT_VIEWER.TEMPLATE_TYPE_UNKNOWN';
    }
  }
}
