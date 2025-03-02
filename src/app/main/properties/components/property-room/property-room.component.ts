import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Currency, LocataireState, RoomModel, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UpdateRoomComponent } from 'src/app/main/room/components/update-room/update-room.component';
import { GaleryComponent } from 'src/app/main/room/components/galery/galery.component';

@Component({
  selector: 'app-property-room',
  templateUrl: './property-room.component.html',
  styleUrls: ['./property-room.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class PropertyRoomComponent implements OnInit {
  @Select(RoomState.selectStateInitLoading) loadingRoom$:Observable<string>;
  roomFound:RoomModel[] = [];
  roomFound$:Observable<RoomModel[]>;
  

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private dialog: MatDialog,

  ) { }

  ngOnInit(): void {
    let propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!propertyId)  {
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }
    this.roomFound$=this._store.select(RoomState.selectStateRoomByPropertyId(propertyId));
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

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

  openEditPhoto(room:RoomModel)
  {
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

  openEditRoom(room:RoomModel)
  {
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

}
