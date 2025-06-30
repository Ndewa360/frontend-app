import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Currency, LocataireState, PropertyState, RoomModel, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UpdateRoomComponent } from 'src/app/main/room/components/update-room/update-room.component';
import { GaleryComponent } from 'src/app/main/room/components/galery/galery.component';
import { DeleteRoomComponent } from 'src/app/main/room/components/delete-room/delete-room.component';
import { LayoutComponent } from 'src/app/main/room/components/layout/layout.component';

@Component({
  selector: 'app-property-room',
  templateUrl: './property-room.component.html',
  styleUrls: ['./property-room.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PropertyRoomComponent implements OnInit {
  @Select(RoomState.selectStateInitLoading) loadingRoom$:Observable<string>;
  roomFound:RoomModel[] = [];
  roomFound$:Observable<RoomModel[]>;
  isAssignedOpened = false;
  public property= null;
  propertyId = null;
  roomSelected:RoomModel=null;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private dialog: MatDialog,

  ) { }

  ngOnInit(): void {
    this.propertyId  = this._activatedRoute.parent.snapshot.paramMap.get('id');

    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/home');;
      return;
    }
    this._store.select(PropertyState.selectStateProperty(this.propertyId)).subscribe((value)=>{
          this.property = value;
        })
        
    this.roomFound$=this._store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.roomFound$.subscribe((found)=>{
        this.roomFound = found;
    })
  }

  getRoomLocataire(locataireId)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireId))
  }

  getMoney()
  {
    return Currency.XAF
  }
  onClose(event) {
    this.isAssignedOpened = false;
    this.roomSelected = null;
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

  openEditPhoto(room:RoomModel,event)
  {
    event.stopPropagation();

    // this._router.navigate(['/app/properties/edit-room',room._id])
    //console.log("Room ",room)
    this.dialog.open(GaleryComponent, { 
      viewContainerRef:null,
      disableClose: true,
      role: 'dialog',
      height: '100%',
      width: '100%',
      data:{
        room
      }
    })
  }

  openRoomInfos(room,event)
  {
    event.stopPropagation();

    this.dialog.open(LayoutComponent, { 
      viewContainerRef:null,
      disableClose: true,
      role: 'dialog',
      height: '100%',
      width: '100%',
      data:{
        room
      }
    })
  }

  openEditRoom(room:RoomModel,event)
  {
    event.stopPropagation();

    // this._router.navigate(['/app/properties/edit-room',room._id])
    //console.log("Room ",room)
    this.dialog.open(UpdateRoomComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        room
      }
    })
  }

  deleteRoom(room:RoomModel,event)
  {
    event.stopPropagation();
    // this._store.dispatch(new RoomAction.DeleteRoom(room._id))
    this.dialog.open(DeleteRoomComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        room
      }
    })
  }

  openEditAddLocataire(room:RoomModel,$event)
  {
    event.stopPropagation();
    this.isAssignedOpened = true;
    this.roomSelected = room;
  }



}
