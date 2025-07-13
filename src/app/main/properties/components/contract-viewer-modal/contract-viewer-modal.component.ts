import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
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

  constructor(
    private dialogRef: MatDialogRef<ContractViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContractViewerData,
    private store: Store,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeContractData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      this.handleError('Aucune location active trouvée pour cette unité');
      return;
    }

    this.loadContractData();
  }

  /**
   * Charge les données du contrat
   */
  private loadContractData(): void {
    if (!this.location) {
      this.handleError('Données de location manquantes');
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
    this.toastr.error(message, 'Erreur');
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
      this.toastr.error('Contrat non disponible pour le téléchargement', 'Erreur');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = this.contractPdfSrc;
      link.download = `Contrat_${this.tenant.fullName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toastr.success('Contrat téléchargé avec succès', 'Succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      this.toastr.error('Erreur lors du téléchargement', 'Erreur');
    }
  }

  /**
   * Imprime le contrat
   */
  printContract(): void {
    if (!this.contractPdfSrc) {
      this.toastr.error('Contrat non disponible pour l\'impression', 'Erreur');
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
      this.toastr.error('Erreur lors de l\'impression', 'Erreur');
    }
  }

  /**
   * Envoie le contrat par email
   */
  sendContractByEmail(): void {
    if (!this.tenant?.email) {
      this.toastr.error('Adresse email du locataire non disponible', 'Erreur');
      return;
    }

    // TODO: Implémenter l'envoi par email
    this.toastr.info('Fonctionnalité d\'envoi par email à implémenter', 'Information');
  }

  /**
   * Obtient le titre du contrat
   */
  getContractTitle(): string {
    if (this.tenant) {
      return `Contrat de location - ${this.tenant.fullName}`;
    }
    return 'Contrat de location';
  }

  /**
   * Obtient les informations de l'unité
   */
  getRoomInfo(): string {
    const room = this.data.room;
    return `Unité ${room.code || room._id} - ${room.type || 'Type non spécifié'}`;
  }
}
