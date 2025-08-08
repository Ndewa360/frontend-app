import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation, Inject, OnInit, Optional } from '@angular/core';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { AppSidenavContainerComponent } from 'src/@youpez/components/app-sidenav/app-sidenav-container/app-sidenav-container.component';
import { INITIAL_LOCATION_FINANCIAL_STATE, LocataireModel, LocataireState, LocataireAction, LocationAction, PropertyModel, PropertyState, RoomModel, RoomState, RoomAction, LocationPaymentAction, HistoryLocationPaymentAction } from 'src/app/shared/store';
import { AssignLocationFormComponent } from '../assign-location-form/assign-location-form.component';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AssignationConfig } from 'src/app/shared/models/assignation-assistant.model';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AssignLocationModalData, AssignLocationModalResult } from '../services/assign-location-modal.service';


@Component({
  selector: 'assign-location',
  templateUrl: './assign-location.component.html',
  styleUrls: ['./assign-location.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class AssignLocationComponent implements OnInit, OnChanges {

  locataireForm:{
    locataire?: any,
    room?: any,
    entryDate?:Date,
    isKnowExactDateEntry?:boolean,
    initialFinancialState?: INITIAL_LOCATION_FINANCIAL_STATE,
    initialSolde?:number
  } = {};

  @Input() isAssignedOpened: boolean = false
  @Input() property: PropertyModel = null;
  @Input() sideNavBarElement: AppSidenavContainerComponent = null
  @Input() roomSelected:RoomModel = null;
  @Input() locataireSelected:LocataireModel = null;
  

  @ViewChild('locationForm') assignLocationForm:AssignLocationFormComponent;
  canSendingData: boolean = false;
  waittingResponse:boolean = false;
  public leftSidebarVisibility: boolean = true;

  // Assistant d'assignation
  assistantVisible: boolean = false;

  // Navigation
  previousUrl: string = null;
  

  // Mode modal
  isModalMode: boolean = false;

  constructor(
    private _store: Store,
    private _ngxsAction: Actions,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    @Optional() @Inject(MAT_DIALOG_DATA) public modalData: AssignLocationModalData | null,
    @Optional() public dialogRef: MatDialogRef<AssignLocationComponent, AssignLocationModalResult> | null
  ) {
    // Déterminer si on est en mode modal
    this.isModalMode = !!this.modalData && !!this.dialogRef;
  }
  

  ngOnInit() {
    console.log("On NgOnInit AssignLocation", { isModalMode: this.isModalMode, modalData: this.modalData });

    if (this.isModalMode && this.modalData) {
      // Mode modal : utiliser les données du modal
      this.loadDataFromModalData();

      // Vérifier si l'assistant doit être ouvert automatiquement en mode modal
      if (this.modalData.assistant === true) {
        console.log('🚀 Ouverture automatique de l\'assistant en mode modal');
        // Ouvrir l'assistant après un court délai pour laisser le temps au composant de s'initialiser
        setTimeout(() => {
          this.assistantVisible = true;
          this.updateBackdropClass();
        }, 100);
      }
    } else {
      // Mode page : utiliser les query params
      this.previousUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || null;
      this.loadDataFromQueryParams();

      // Vérifier si l'assistant doit être ouvert automatiquement
      if (this.activatedRoute.snapshot.queryParams['assistant'] === 'true') {
        this.assistantVisible = true;
      }
    }

    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.CreateLocation)).subscribe((value)=>{
      this.waittingResponse=false;
      this.handleAssignationSuccess(value);
    });

    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.CreateAssignationWithAssistant)).subscribe((value)=>{
      this.waittingResponse=false;
      this.handleAssignationSuccess(value);
    });

    this._ngxsAction.pipe(ofActionCompleted(LocationAction.CreateLocation)).subscribe(
      (value) => {
        this.waittingResponse=false;
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocationAction.CreateLocation)).subscribe(
      (error) => {
        console.error('❌ Erreur lors de l\'assignation classique:', error);
        this.waittingResponse = false;
        this.handleAssignationError(error);
      })

    this._ngxsAction.pipe(ofActionErrored(LocationAction.CreateAssignationWithAssistant)).subscribe(
      (error) => {
        console.error('❌ Erreur lors de l\'assignation avec assistant:', error);
        this.waittingResponse = false;
        this.handleAssignationError(error);
      })
  }

  /**
   * Charger les données depuis les query params quand utilisé comme page autonome
   */
  private loadDataFromQueryParams(): void {
    const queryParams = this.activatedRoute.snapshot.queryParams;

    // Récupérer la propriété
    if (queryParams['propertyId'] && !this.property) {
      this.property = this._store.selectSnapshot(PropertyState.selectStateProperty(queryParams['propertyId']));
    }

    // Récupérer la chambre pré-sélectionnée
    if (queryParams['roomId'] && !this.roomSelected) {
      this.roomSelected = this._store.selectSnapshot(RoomState.selectStateRoom(queryParams['roomId']));
    }

    // Récupérer le locataire pré-sélectionné
    if (queryParams['locataireId'] && !this.locataireSelected) {
      this.locataireSelected = this._store.selectSnapshot(LocataireState.selectStateLocataire(queryParams['locataireId']));
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["isAssignedOpened"] && changes["isAssignedOpened"].currentValue && this.sideNavBarElement)this.assignLocationForm.refreshComponent() 
  }

  onSubmit()
  {
    this.waittingResponse=true;
    
    if(this.locataireForm.isKnowExactDateEntry) this.locataireForm.entryDate.setHours(6)
    let bodyToSend = {
      locataireId:this.locataireForm.locataire,
      roomId:this.locataireForm.room,
      propertyId:this.property._id,
      isKnowExactDateEntry:this.locataireForm.isKnowExactDateEntry,
      initialFinancialState: this.locataireForm.initialFinancialState,
      initialSolde:this.locataireForm.initialSolde
    }
    if(this.locataireForm.isKnowExactDateEntry) bodyToSend["startedAt"]=this.locataireForm.entryDate.toISOString().split("T")[0]
    else bodyToSend["startedAt"]= new Date().toISOString().split("T")[0]
    this._store.dispatch(new LocationAction.CreateLocation(bodyToSend))
  }

  // Méthodes pour l'assistant d'assignation
  ouvrirAssistant(): void {
    this.assistantVisible = true;
    this.updateBackdropClass();
  }

  fermerAssistant(): void {
    this.assistantVisible = false;
    this.updateBackdropClass();

    // Si on est en mode modal et que l'assistant était ouvert automatiquement,
    // fermer complètement le modal
    if (this.isModalMode && this.modalData?.assistant === true) {
      console.log('🔒 Fermeture du modal après fermeture de l\'assistant');
      this.navigateBack();
    }
  }

  onAssignationSuccess(config: AssignationConfig): void {
    console.log('✅ Assignation réussie, configuration:', config);

    // Fermer l'assistant
    this.fermerAssistant();

    // Si on est en mode modal, retourner le résultat et fermer le modal
    if (this.isModalMode && this.dialogRef) {
      console.log('🎉 Retour du résultat de l\'assignation au modal');
      this.dialogRef.close({
        success: true,
        data: config
      });
      return;
    }

    // Mode page normale : utiliser l'action store (comportement existant)
    this.waittingResponse = true;
    this._store.dispatch(new LocationAction.CreateAssignationWithAssistant(config));
  }

  private mapTypeToFinancialState(typeAssignation: any): INITIAL_LOCATION_FINANCIAL_STATE {
    // Mapper le type d'assignation vers l'état financier initial
    switch (typeAssignation) {
      case 'NOUVEAU':
        return INITIAL_LOCATION_FINANCIAL_STATE.INITIAL;
      case 'EXISTANT':
        return INITIAL_LOCATION_FINANCIAL_STATE.EN_AVANCE;
      case 'MIGRATION':
        return INITIAL_LOCATION_FINANCIAL_STATE.AVEC_ARRIERE;
      default:
        return INITIAL_LOCATION_FINANCIAL_STATE.INITIAL;
    }
  }

  private calculateInitialSolde(config: AssignationConfig): number {
    // Calculer le solde initial basé sur la configuration
    if (config.typeAssignation === 'NOUVEAU') {
      // Pour un nouveau locataire, le solde initial est généralement 0
      return 0;
    } else {
      // Pour un locataire existant, utiliser le solde configuré
      const existantConfig = config.configurationFinanciere as any;
      return existantConfig.soldeActuel || 0;
    }
  }

  onSetLocataireFormData(locataireFormData)
  {
    if(
      locataireFormData.locataire && 
      locataireFormData.room && 
      ( (locataireFormData.isKnowExactDateEntry && locataireFormData.entryDate) || 
        (!locataireFormData.isKnowExactDateEntry)
    )) this.canSendingData=true;
    else this.canSendingData=false;
    this.locataireForm = locataireFormData;
  }
  
  onClose(event) {
    this.isAssignedOpened = false
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }

  closeSideNav() {
    if (this.isModalMode) {
      // Mode modal : fermer le modal avec succès
      this.closeModal(true);
    } else if (this.sideNavBarElement) {
      this.sideNavBarElement.onCloseAll();
      this.assignLocationForm.reset();
    } else {
      // Mode page autonome : naviguer vers la page précédente
      this.navigateBack();
    }
  }

  /**
   * Naviguer vers la page précédente
   */
  navigateBack(): void {
    if (this.isModalMode) {
      // Fermer le modal sans résultat (annulation)
      console.log('🚫 Modal fermé par annulation utilisateur');
      if (this.dialogRef) {
        this.dialogRef.close(null); // null = annulation, pas d'erreur
      }
      return;
    }

    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    } else if (this.property) {
      // Fallback vers la page des chambres de la propriété
      this.router.navigate(['/app/properties', this.property._id, 'rooms']);
    } else {
      // Fallback vers la liste des propriétés
      this.router.navigate(['/app/properties/list']);
    }
  }

  /**
   * Charger les données depuis les données du modal
   */
  private loadDataFromModalData(): void {
    if (!this.modalData) return;

    // Charger la propriété
    if (this.modalData.property) {
      this.property = this.modalData.property;
    } else if (this.modalData.propertyId) {
      // Charger la propriété depuis le store
      this.property = this._store.selectSnapshot(PropertyState.selectStateProperty(this.modalData.propertyId));
    }

    // Pré-sélectionner la chambre
    if (this.modalData.roomSelected) {
      this.roomSelected = this.modalData.roomSelected;
    } else if (this.modalData.roomId) {
      this.roomSelected = this._store.selectSnapshot(RoomState.selectStateRoom(this.modalData.roomId));
    }

    // Pré-sélectionner le locataire
    if (this.modalData.locataireSelected) {
      this.locataireSelected = this.modalData.locataireSelected;
    } else if (this.modalData.locataireId) {
      this.locataireSelected = this._store.selectSnapshot(LocataireState.selectStateLocataire(this.modalData.locataireId));
    }

    // Ouvrir l'assistant si demandé
    if (this.modalData.assistant) {
      this.assistantVisible = true;
    }
  }

  /**
   * Gérer le succès de l'assignation
   */
  private handleAssignationSuccess(value: any): void {
    console.log('🎉 Assignation réussie, rafraîchissement des données...', value);

    // Rafraîchir toutes les données liées dans le store
    if (this.property?._id) {
      console.log('🔄 Rafraîchissement des données du store...');

      // Rafraîchir les chambres
      this._store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.property._id));

      // Rafraîchir les locations
      this._store.dispatch(new LocationAction.FetchLocationsByPropertyId(this.property._id));

      // Rafraîchir les locataires
      this._store.dispatch(new LocataireAction.FetchLocatairesByPropertyId(this.property._id));

      // Rafraichir les paiements et l'historique
      console.log('💰 Rafraichissement des paiements et de l\'historique...');
      this._store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.property._id));
      this._store.dispatch(new HistoryLocationPaymentAction.RefreshHistoryLocationPaymentsByPropertyId(this.property._id));
    }

    // Attendre un peu pour que les données se rafraîchissent avant de fermer/naviguer
    setTimeout(() => {
      if (this.isModalMode) {
        this.closeModal(true, value);
      } else {
        this.closeSideNav();
        // Rediriger vers la liste des locations si on est sur une page autonome
        if (!this.sideNavBarElement && this.property) {
          this.router.navigate(['/app/properties', this.property._id, 'locations']);
        }
      }
    }, 500); // Délai pour permettre le rafraîchissement
  }

  /**
   * Gérer les erreurs d'assignation
   */
  private handleAssignationError(error: any): void {
    console.error('❌ Erreur lors de l\'assignation:', error);

    // Extraire le message d'erreur
    let errorMessage = 'Une erreur est survenue lors de l\'assignation';

    if (error?.error?.error?.message && Array.isArray(error.error.error.message)) {
      errorMessage = error.error.error.message[0];
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Afficher un message d'erreur spécifique selon le type d'erreur
    if (errorMessage.includes('Location not found')) {
      errorMessage = 'La location n\'a pas pu être trouvée. Veuillez réessayer dans quelques instants.';
    } else if (errorMessage.includes('Room is not free')) {
      errorMessage = 'Cette chambre n\'est plus disponible. Veuillez en choisir une autre.';
    } else if (errorMessage.includes('Locataire not found')) {
      errorMessage = 'Le locataire sélectionné n\'a pas été trouvé. Veuillez vérifier votre sélection.';
    } else if (errorMessage.includes('Property not found')) {
      errorMessage = 'La propriété n\'a pas été trouvée. Veuillez actualiser la page.';
    }

    console.log('💬 Message d\'erreur:', errorMessage);

    // En cas d'erreur critique, proposer de rafraîchir les données
    if (errorMessage.includes('not found')) {
      setTimeout(() => {
        if (this.property?._id) {
          console.log('🔄 Rafraîchissement des données après erreur...');
          this._store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.property._id));
          this._store.dispatch(new LocataireAction.FetchLocatairesByPropertyId(this.property._id));
        }
      }, 2000);
    }
  }

  /**
   * Fermer le modal
   */
  private closeModal(success: boolean, data?: any): void {
    if (this.dialogRef) {
      const result: AssignLocationModalResult = {
        success,
        data
      };
      this.dialogRef.close(result);
    }
  }

  /**
   * Met à jour la classe CSS du backdrop selon l'état de l'assistant
   */
  private updateBackdropClass(): void {
    if (!this.isModalMode) return;

    // Attendre un peu pour que le DOM soit mis à jour
    setTimeout(() => {
      const backdrop = document.querySelector('.assign-location-modal-backdrop');
      if (backdrop) {
        if (this.assistantVisible) {
          backdrop.classList.add('assistant-open');
          console.log('🎨 Backdrop rendu transparent (assistant ouvert)');
        } else {
          backdrop.classList.remove('assistant-open');
          console.log('🎨 Backdrop restauré (assistant fermé)');
        }
      }
    }, 50);
  }
}
