import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Currency, RoomModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UpdateRoomComponent } from '../update-room/update-room.component';

@Component({
  selector: 'details-room',
  templateUrl: './details-room.component.html',
  styleUrls: ['./details-room.component.css']
})
export class DetailsRoomComponent {
  constructor(
        private dialog: MatDialog,
  ){}
  @Input() room: RoomModel;

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

  hasDescription(description)
  {
    return description && description.length>0
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

  getMoney()
  {
    return Currency.XAF
  }

}
