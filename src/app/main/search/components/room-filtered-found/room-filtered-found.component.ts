import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UpdateRoomComponent } from 'src/app/main/room/components/update-room/update-room.component';
import { RoomState, RoomModel, LocataireState, Currency } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'room-filtered-found',
  templateUrl: './room-filtered-found.component.html',
  styleUrls: ['./room-filtered-found.component.css']
})
export class RoomFilteredFoundComponent {
    @Select(RoomState.selectStateInitLoading) loadingRoom$:Observable<string>;
    roomFound:RoomModel[] = [];
    roomFoundFiltered:RoomModel[] = [];
    @Select(RoomState.selectStateRoom) roomFound$:Observable<RoomModel[]>;
  
    constructor(
      private _activatedRoute: ActivatedRoute,
      private _router:Router,
      private _store:Store,
      private dialog: MatDialog,
  
    ) { }
  
    ngOnInit(): void {
      // this.roomFound$.subscribe((found)=>{
      //     this.roomFound = found;
      //     this.roomFoundFiltered = [...this.roomFound]
      // })
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
  
    openShowRoom(room:RoomModel)
    {
      // this._router.navigate(['/app/properties/edit-room',room._id])
      console.log("Room ",room)
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
