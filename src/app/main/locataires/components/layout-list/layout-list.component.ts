import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RoomState, RoomModel, PropertyState, Currency, LocataireState, LocataireModel, LocationModel, LocationState, HistoryLocationPaymentState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'layout-list',
  templateUrl: './layout-list.component.html',
  styleUrls: ['./layout-list.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class LayoutListComponent {
  @Select(LocataireState.selectStateInitLoading) loadingLocataire$:Observable<string>;
  public property= null;
  propertyId = null;

  initialLocataireFounds = [];
  locataireFiltered= [];
  mapLocataireFiltered=null;


  selectedRoom = null;
  selectedRoomId = null;
  selectedLocataireId = null;
  selectedLocataire = null;
  selectedLocation = null;
  mapLocataire=null;
  historyLocationPayments = [];
  historyLocationPaymentsSelected =[]
  rooms = new Map<string, RoomModel>();
  locations = new Map<string, LocationModel>();

  public sidebarVisible: boolean = true
  isAssignedOpened = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.propertyId  = this._activatedRoute.parent.snapshot.paramMap.get('id');
    this.selectedLocataireId = this._activatedRoute.snapshot.paramMap.get("idLocataire");


    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/home');;
      return;
    }

    // this._store.select(LocataireState.selectStateLocataire(this.selectedLocataireId)).subscribe((locataire)=>this.selectedLocataire = locataire)

    this._store.select(RoomState.selectStateRoomByPropertyId(this.propertyId)).subscribe((rooms)=>{
       rooms.forEach((room)=>{
        this.rooms.set(room._id, room);
       })
       if(this.selectedRoom) this.selectedRoom = this.rooms.get(this.selectedLocataire._id);
    })

    this._store.select(PropertyState.selectStateProperty(this.propertyId)).subscribe((value)=>{
      this.property = value;
    })

    this._store.select(LocationState.selectStateLocationByPropertyId(this.propertyId)).subscribe((value)=>{
      value.forEach((location)=>{
        this.locations.set(location.locataire, location);
       })
      if(this.selectedLocataireId) this.selectedLocation = this.locations.get(this.selectedLocataireId);
    })
        
    this._store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId)).subscribe((found)=>{
      this.applyFilterToLocataire(found,true);
      this.initialLocataireFounds = [...found]
      
    })

    this._store.select(HistoryLocationPaymentState.selectStateHistoryLocationPaymentByPropertyId(this.propertyId)).subscribe((value)=>{
      this.historyLocationPayments = value;
      this.applyFilterToHistoryPayment();
    })
  }

  applyFilterToHistoryPayment()
  {
    if(!this.selectedRoom) {
      this.historyLocationPaymentsSelected = [...this.historyLocationPayments];
      return;
    }
    this.historyLocationPaymentsSelected = this.historyLocationPayments.filter((payment)=>payment.room._id == this.selectedRoom._id);
  }
  applyFilterToLocataire(locataireList:LocataireModel[],reset:boolean)
  {
    let newMapLocataire = new Map<string,LocataireModel[]>();
      newMapLocataire.set("Actifs",[]);
      newMapLocataire.set("Archivé", []);

      locataireList.forEach((locataire)=>{
        if(locataire.room) newMapLocataire.get("Actifs").push(locataire); 
        else if(locataire.isDisabled)  newMapLocataire.get("Archivé").push(locataire);
      })
        let newLocataireFounds:any = [
          {
            type:"step",
            sep: 'Actifs'
          }
        ]
        let orderedLocataire = [];
       if(reset){
         let locataireSelected = newMapLocataire.get("Actifs").find((r)=>r._id==this.selectedLocataireId)
          if(locataireSelected){
            orderedLocataire.push(locataireSelected);
            this.selectedLocataire = locataireSelected;
            this.selectedRoom = this.rooms.get(locataireSelected.room);
            this.selectedLocation = this.locations.get(locataireSelected._id);
          }
          // console.log("Locataire selected ",locataireSelected)
          newMapLocataire.get("Actifs").forEach((eachLocataire)=>{
            if(locataireSelected._id!=eachLocataire._id) orderedLocataire.push(eachLocataire)
          })
       }
       else {
        newMapLocataire.get("Actifs").forEach((eachLocataire)=> orderedLocataire.push(eachLocataire) )
       }

        newLocataireFounds.push(...orderedLocataire)
        newLocataireFounds.push({
            sep: 'Archivé'
          })
        newLocataireFounds.push(...newMapLocataire.get("Archivé"))
      
      if(reset)
      {
        this.initialLocataireFounds = newLocataireFounds;
        this.mapLocataire = newMapLocataire;
      }
      this.locataireFiltered = [...newLocataireFounds];
      this.mapLocataireFiltered = newMapLocataire;      
        // this.roomFound = found;
  }

  onClose(event) {
    this.isAssignedOpened = false;
  }

  getLocataireByAllLength(status)
  {
    return this.mapLocataireFiltered.get(status).length;
  }

  getAllLocataireLength()
  {
    return this.mapLocataireFiltered.length-2
  }
  onSelect(locataire: any) {
    this._router.navigate(['/app/properties',this.propertyId,'tenants',locataire._id]);
    this.selectedLocataire=locataire;
    this.selectedLocataireId = locataire._id;;
    this.selectedRoom = this.rooms.get(locataire.room);
    this.selectedLocation = this.locations.get(locataire._id);
    this.applyFilterToHistoryPayment();
  }

  searchLocataire(value)
  {
    this.applyFilterToLocataire(this.initialLocataireFounds.filter((locataire)=>{
      if( locataire.fullName.toLowerCase().includes(value.toLowerCase()) ||
        locataire.email?.toLowerCase().includes(value.toLowerCase()) ||
        locataire.phoneNumber.toLowerCase().includes(value.toLowerCase()) ||
        locataire.fullNameRef?.toLowerCase().includes(value.toLowerCase()) ||
        locataire.phoneNumberRef?.toLowerCase().includes(value.toLowerCase()) ||
        locataire.emailRef?.toLowerCase().includes(value.toLowerCase())) return true;
      if(locataire.room && this.rooms.has(locataire.room) && this.rooms.get(locataire.room).code.toLowerCase().includes(value.toLowerCase())) return true;
      return false;
    }),
    false);
  }

  onToggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

  geLocataireRoom(roomID)
  {
    return this._store.select(RoomState.selectStateRoom(roomID))
  }

  getMoney()
  {
    return Currency.XAF
  }

  changeAssignedOpend(event:boolean) {
    this.isAssignedOpened = event;
  }
}
