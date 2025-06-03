import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RoomState, RoomModel, PropertyState, Currency, LocataireState } from 'src/app/shared/store';
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
  selectedRoom = null;
  selectedRoomId = null;
  mapRoom=null;
  roomFound$:Observable<RoomModel[]>;

  public mails = [
    {
      sep: 'Actifs'
    },
    {
      attachments: 0,
      flagged: false,
      read: false,
      date: 'Oct 29',
      title: 'Question: using setState to access',
      sender: 'Jone Done',
      content: 'Sed ut perspiciatis unde omnis iste natus\n error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis\n\n et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,\n sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?'
    },
  ]

  public selectedMail: any = null
  public sidebarVisible: boolean = true

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

    this._store.select(PropertyState.selectStateProperty(this.propertyId)).subscribe((value)=>{
      this.property = value;
    })
        
    this.roomFound$=this._store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.roomFound$.subscribe((found)=>{
      this.mapRoom = new Map<string,RoomModel[]>();
      this.mapRoom.set("Actifs",[]);
      this.mapRoom.set("Archivé", []);

      found.forEach((room)=>{
        if(room.isActiveForSouscription) this.mapRoom.get("Actifs").push(room); 
        else if(room.isDeleted)  this.mapRoom.get("Archivé").push(room);
      })
        this.roomFounds = [
          {
            type:"step",
            sep: 'Actifs'
          }
        ]
        let orderedRoom = [];
        let roomSelected = this.mapRoom.get("Actifs").find((r)=>r._id==this.selectedRoomId)
        if(roomSelected) orderedRoom.push(roomSelected);
        this.selectedRoom = roomSelected

        this.mapRoom.get("Actifs").forEach((eachRoom)=>{
          if(roomSelected._id!=eachRoom._id) orderedRoom.push(eachRoom)
        })

        this.roomFounds.push(...orderedRoom)
        this.roomFounds.push({
            sep: 'Archivé'
          })
        this.roomFounds.push(...this.mapRoom.get("Archivé"))
        // this.roomFound = found;
    })

    this.selectedMail = this.mails[1]
  }

  getRoomByAllLength(status)
  {
    return this.mapRoom.get(status).length;
  }

  getAllRoomLength()
  {
    return this.roomFounds.length-2
  }
  onSelect(room: any) {
    this._router.navigate(['/app/properties',this.propertyId,'rooms',room._id]);
    this.selectedRoom=room;
    this.selectedRoomId = room._id;
    // mail.read = true
    // this.selectedMail = mail
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

}
