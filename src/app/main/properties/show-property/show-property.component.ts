import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyAction, PropertyModel, PropertyState } from 'src/app/shared/store';
import { AddPropertyRoomComponent } from '../components/add-property-room/add-property-room.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { AddPropertyLocataireComponent } from '../components/add-property-locataire/add-property-locataire.component';
import { ToastrService } from 'ngx-toastr';
import { UpdatePropertyComponent } from '../components/update-property/update-property.component';

@Component({
  selector: 'app-show-property',
  templateUrl: './show-property.component.html',
  styleUrls: ['./show-property.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ShowPropertyComponent implements OnInit {


  loadingProperty = true;
  propertyFound:PropertyModel = null;
  propertyFound$:Observable<PropertyModel>;
  waittingResponseDeleteProperty = false;
  private addPropertyRoomDialogRef: MatDialogRef<AddPropertyRoomComponent | AddPropertyLocataireComponent>;
  
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
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }
    this.propertyFound$=this._store.select(PropertyState.selectStateProperty(propertyId));
    this.propertyFound$.subscribe((found)=>{
      if(!found){
        this._router.navigateByUrl('/app/properties/list');
        this._toastService.error("Biens introuvable", "Ndiye");
      }
      else
      {
        this.propertyFound = found;
        this.loadingProperty = false;
      }
    })
  }

  onClose(event) {
    this.isDetailsOpened = false
  }

  getTitle() {
    switch (this._activatedRoute.snapshot.firstChild.data['breadcrumb']) {
      case 'locataires':
        return "Locataires de biens"
      case 'finances':
        return "Vos finances"
      case 'chambres':
        return "Vos Chambres / Studios / Appartements"
    }
    return ""
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
      case 'finances':
        return "Vos finances"
      case 'chambres':
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
