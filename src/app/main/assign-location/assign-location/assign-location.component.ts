import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { AppSidenavContainerComponent } from 'src/@youpez/components/app-sidenav/app-sidenav-container/app-sidenav-container.component';
import { INITIAL_LOCATION_FINANCIAL_STATE, LocataireModel, LocataireState, LocationAction, PropertyModel, PropertyState, RoomModel, RoomState } from 'src/app/shared/store';
import { AssignLocationFormComponent } from '../assign-location-form/assign-location-form.component';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AssignationConfig } from 'src/app/shared/models/assignation-assistant.model';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';


@Component({
  selector: 'assign-location',
  templateUrl: './assign-location.component.html',
  styleUrls: ['./assign-location.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class AssignLocationComponent  implements OnChanges{

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
  

  constructor(
    private _store: Store,
    private _ngxsAction:Actions,
    private router:Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ){}
  

  ngOnInit()
  {
    console.log("On NgOnInit AssignLocation")

    // Enregistrer l'URL précédente depuis les query params
    this.previousUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || null;

    // Récupérer les données depuis les query params si pas d'inputs
    this.loadDataFromQueryParams();

    // Vérifier si l'assistant doit être ouvert automatiquement
    if (this.activatedRoute.snapshot.queryParams['assistant'] === 'true') {
      this.assistantVisible = true;
    }

    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.CreateLocation)).subscribe((value)=>{
      this.waittingResponse=false;
      // this.property={...this.property}
      this.closeSideNav()
      // Rediriger vers la liste des locations si on est sur une page autonome
      if (!this.sideNavBarElement && this.property) {
        this.router.navigate(['/app/properties', this.property._id, 'locations']);
      }
    });

    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.CreateAssignationWithAssistant)).subscribe((value)=>{
      this.waittingResponse=false;
      this.closeSideNav()
      // Rediriger vers la liste des locations si on est sur une page autonome
      if (!this.sideNavBarElement && this.property) {
        this.router.navigate(['/app/properties', this.property._id, 'locations']);
      }
    });

    this._ngxsAction.pipe(ofActionCompleted(LocationAction.CreateLocation)).subscribe(
      (value) => {
        this.waittingResponse=false;
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocationAction.CreateLocation)).subscribe(
      (value) => {
        this.waittingResponse=false;
      })

    this._ngxsAction.pipe(ofActionErrored(LocationAction.CreateAssignationWithAssistant)).subscribe(
      (value) => {
        this.waittingResponse=false;
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
  }

  fermerAssistant(): void {
    this.assistantVisible = false;
  }

  onAssignationSuccess(config: AssignationConfig): void {
    // Utiliser directement la nouvelle action pour l'assistant
    this.waittingResponse = true;
    this._store.dispatch(new LocationAction.CreateAssignationWithAssistant(config));
    this.fermerAssistant();
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
      if(this.sideNavBarElement) {
        this.sideNavBarElement.onCloseAll();
        this.assignLocationForm.reset();
        // this.assignLocationForm.onDestroy()
      } else {
        // Mode page autonome : naviguer vers la page précédente
        this.navigateBack();
      }
    }

  /**
   * Naviguer vers la page précédente
   */
  navigateBack(): void {
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
}
