import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, combineLatestAll, Observable } from 'rxjs';
import { LocataireState, LocationState, PropertyAction, PropertyModel, PropertyState, RoomState } from 'src/app/shared/store';
import { AddPropertyRoomComponent } from '../components/add-property-room/add-property-room.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { AddPropertyLocataireComponent } from '../components/add-property-locataire/add-property-locataire.component';
import { ToastrService } from 'ngx-toastr';
import { UpdatePropertyComponent } from '../components/update-property/update-property.component';
import { SeeLocationsComponent } from '../components/see-locations/see-locations.component';

@Component({
  selector: 'app-show-property',
  templateUrl: './show-property.component.html',
  styleUrls: ['./show-property.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShowPropertyComponent implements OnInit {

  componentOnRouterOutlet:any=null;

  @Select(PropertyState.selectStateLoading) loadingProperty$:Observable<boolean>
  loadingProperty = true;
  propertyFound:PropertyModel = null;
  propertyFound$:Observable<PropertyModel>;
  waittingResponseDeleteProperty = false; 
  private addPropertyRoomDialogRef: MatDialogRef<AddPropertyRoomComponent | AddPropertyLocataireComponent>;

  roomNumber = 0;
  locataireNumber =0;
  locationNumber = 0;
  
  public isDetailsOpened: boolean = false
  public leftSidebarVisibility: boolean = true

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private dialog: MatDialog,
    private _toastService: ToastrService

  ) {
  }

  ngOnInit(): void {
    let propertyId = this._activatedRoute.snapshot.paramMap.get('id');
    if(!propertyId)  {
      this._router.navigateByUrl('/app/properties/home');;
      return;
    }
    
    this.propertyFound$=this._store.select(PropertyState.selectStateProperty(propertyId));
    this._store.select(RoomState.selectStateCountRoomWithStateByPropertyId(propertyId)).subscribe((value)=>this.roomNumber=value.roomCountTotal)
    this._store.select(LocataireState.selectStateLocataireCountByPropertyId(propertyId)).subscribe((value)=>this.locataireNumber=value)
    this._store.select(LocationState.selectStateCountLocationByPropertyId(propertyId)).subscribe((value)=>this.locationNumber=value)

    combineLatest([this.propertyFound$,this.loadingProperty$]).subscribe(([property, loading])=>{
      if(!loading) {
        if(!property){
          this._router.navigateByUrl('/app/properties/home');
          this._toastService.error("Biens introuvable", "Ndewa360°");
        } else
        {
          this.propertyFound = property;
          this.loadingProperty = false;
        }
      }
      // if(property && !loading) this.propertyFound = property;
    })
  }

  onClose(event) {
    this.isDetailsOpened = false
  }

  onSetRouterOutLetComponent(component: any) {
    this.componentOnRouterOutlet = component
  }
  getTitle() {
    switch (this._activatedRoute.snapshot.firstChild.data['breadcrumb']) {
      case 'locations':
        return "Details de locations"
      case 'locataires':
        return "Locataires de biens"
      case 'finances':
        return "Vos finances"
      case 'unités':
        return "Vos Unités locatives"
      case 'history-finance':
        return "Historique des paiements"
    }
    return ""
  }

  showTitleOfBtn()
  {
    switch (this._activatedRoute.snapshot.firstChild.data['breadcrumb']) {
      case 'locataires':
        return "Ajouter un locataire"
      // case 'finances':
      //   return "Vos finances"
      case 'locations':
          return "Nouveau contrat de location"
      case 'unités':
        return "Ajouter une unité "
    }
    return ""
  }
  shoulShowAddProperty()
  {
    switch (this._activatedRoute.snapshot.firstChild.data['breadcrumb']) {
      case 'finances':
        return false;
      case 'locataires':
      case 'locations':
      case 'unités':
        return true
    }
    return false
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }

  updateProperty()
  {
    this.dialog.open(UpdatePropertyComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        property:this.propertyFound
      }
    })
  }

  onCreate() {
    switch (this._activatedRoute.snapshot.firstChild.data['breadcrumb']) {
      case 'locataires':
        this.addPropertyRoomDialogRef = this.dialog.open(AddPropertyLocataireComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{
            property:this.propertyFound
          }
        })
        return null
      case 'locations':
        //console.log("location", this.componentOnRouterOutlet.isAssignedOpened);
        this.componentOnRouterOutlet.isAssignedOpened = true;
        return null;
      case 'finances':
        return "Vos finances"
      case 'unités':
        this.addPropertyRoomDialogRef = this.dialog.open(AddPropertyRoomComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{
            property:this.propertyFound
          }
        })
        return null;
    }
    return "";
    
  }
}
