import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { AppSidenavContainerComponent } from 'src/@youpez/components/app-sidenav/app-sidenav-container/app-sidenav-container.component';
import { INITIAL_LOCATION_FINANCIAL_STATE, LocataireModel, LocataireState, LocationAction, PropertyModel, RoomModel, RoomState } from 'src/app/shared/store';
import { AssignLocationFormComponent } from '../assign-location-form/assign-location-form.component';
import { ActivatedRoute, Router } from '@angular/router';
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
  public leftSidebarVisibility: boolean = true
  

  constructor(
    private _store: Store,
    private _ngxsAction:Actions,
    private router:Router
  ){}
  

  ngOnInit()
  {    
    console.log("On NgOnInit AssignLocation")
    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.CreateLocation)).subscribe((value)=>{
      this.waittingResponse=false;
      // this.property={...this.property}
      this.closeSideNav()
      // this.router.navigateByUrl(this.router.url,{ skipLocationChange: true });


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
      }
    }
}
