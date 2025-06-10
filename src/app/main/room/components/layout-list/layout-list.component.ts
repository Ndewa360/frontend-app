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
  @Select(RoomState.selectStateInitLoading) loadingRoom$:Observable<string>;
  public property= null;
  propertyId = null;
  roomFounds= [];
  initialRoomFounds = [];
  roomFoundsFiltered= [];
  mapRoomFiltered=null;

  selectedRoom = null;
  selectedRoomId = null;
  selectedLocataire = null;
  selectedLocation = null;
  mapRoom=null;
  historyLocationPayments = [];
  historyLocationPaymentsSelected =[]
  roomFound$:Observable<RoomModel[]>;
  locataires = new Map<string, LocataireModel>();
  locations = new Map<string, LocationModel>();

  public selectedMail: any = null
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
    this.selectedRoomId = this._activatedRoute.snapshot.paramMap.get("idRoom");

    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/home');;
      return;
    }
    this._store.select(LocataireState.selectStateLocatairesByPropertyId(this.propertyId)).subscribe((locataires)=>{
       locataires.forEach((locataire)=>{
        this.locataires.set(locataire._id, locataire);
       })
       if(this.selectedLocataire) this.selectedLocataire = this.locataires.get(this.selectedLocataire._id);
    })

    this._store.select(PropertyState.selectStateProperty(this.propertyId)).subscribe((value)=>{
      this.property = value;
    })

    this._store.select(LocationState.selectStateLocationByPropertyId(this.propertyId)).subscribe((value)=>{
      value.forEach((location)=>{
        this.locations.set(location.room, location);
       })
      if(this.selectedRoom) this.selectedLocation = this.locations.get(this.selectedRoom._id);
    })
        
    this.roomFound$=this._store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.roomFound$.subscribe((found)=>{
      this.applyFilterToRoom(found,true);
      this.initialRoomFounds = [...found]
    })

    console.log("Selected room id ",this.selectedRoom);
    this._store.select(HistoryLocationPaymentState.selectStateHistoryLocationPaymentByPropertyId(this.propertyId)).subscribe((value)=>{
      this.historyLocationPayments = value;
      console.log("History payments ",this.historyLocationPayments);
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
  applyFilterToRoom(roomList:RoomModel[],reset:boolean)
  {
    let newMapRoom = new Map<string,RoomModel[]>();
      newMapRoom.set("Actifs",[]);
      newMapRoom.set("Archivé", []);

      roomList.forEach((room)=>{
        if(room.isActiveForSouscription) newMapRoom.get("Actifs").push(room); 
        else if(room.isDeleted)  newMapRoom.get("Archivé").push(room);
      })
        let newRoomFounds:any = [
          {
            type:"step",
            sep: 'Actifs'
          }
        ]
        let orderedRoom = [];
       if(reset){
         let roomSelected = newMapRoom.get("Actifs").find((r)=>r._id==this.selectedRoomId)
          if(roomSelected){
            orderedRoom.push(roomSelected);
            this.selectedRoom = roomSelected;
            this.selectedLocataire = this.locataires.get(roomSelected.locataire);
            this.selectedLocation = this.locations.get(roomSelected._id);
          }
          // console.log("Room selected ",roomSelected)
          newMapRoom.get("Actifs").forEach((eachRoom)=>{
            if(roomSelected._id!=eachRoom._id) orderedRoom.push(eachRoom)
          })
       }
       else {
        newMapRoom.get("Actifs").forEach((eachRoom)=> orderedRoom.push(eachRoom) )
       }

        newRoomFounds.push(...orderedRoom)
        newRoomFounds.push({
            sep: 'Archivé'
          })
        newRoomFounds.push(...newMapRoom.get("Archivé"))
      
      if(reset)
      {
        this.roomFounds = newRoomFounds;
        this.mapRoom = newMapRoom;
      }
      this.roomFoundsFiltered = [...newRoomFounds];
      this.mapRoomFiltered = newMapRoom;      
        // this.roomFound = found;
  }

  onClose(event) {
    this.isAssignedOpened = false;
  }

  getRoomByAllLength(status)
  {
    return this.mapRoomFiltered.get(status).length;
  }

  getAllRoomLength()
  {
    return this.mapRoomFiltered.length-2
  }
  onSelect(room: any) {
    this._router.navigate(['/app/properties',this.propertyId,'rooms',room._id]);
    this.selectedRoom=room;
    this.selectedRoomId = room._id;
    this.selectedLocataire = this.locataires.get(room.locataire);
    this.selectedLocation = this.locations.get(room._id);
    this.applyFilterToHistoryPayment();
  }

  searchRoom(value)
  {
    this.applyFilterToRoom(this.initialRoomFounds.filter((room)=>{
      if(room.code.toLowerCase().includes(value.toLowerCase())) return true;
      if(room.description && room.description.toLowerCase().includes(value.toLowerCase())) return true;
      if(room.locataire && this.locataires.has(room.locataire) && this.locataires.get(room.locataire).fullName.toLowerCase().includes(value.toLowerCase())) return true;
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

  getRoomLocataire(locataireId)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireId))
  }

  getMoney()
  {
    return Currency.XAF
  }

  changeAssignedOpend(event:boolean) {
    this.isAssignedOpened = event;
  }
}
