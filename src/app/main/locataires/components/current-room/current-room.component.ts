import { Component, Input,EventEmitter, OnInit, Output, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShowContractComponent } from 'src/app/main/contract/components/show-contract/show-contract.component';
import { ModernContractTerminationModalComponent } from 'src/app/main/properties/components/modern-contract-termination-modal/modern-contract-termination-modal.component';
import { UpdateRoomComponent } from 'src/app/main/room/components/update-room/update-room.component';
import { Currency, LocataireModel, LocationModel, RoomModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'current-room',
  templateUrl: './current-room.component.html',
  styleUrls: ['./current-room.component.css']
})
export class CurrentRoomComponent implements OnChanges{
  @Input() room:RoomModel;
  @Input() locataire:LocataireModel
  @Input() location:LocationModel
  @Output() onOpenAssignedRoom:EventEmitter<boolean> = new EventEmitter<boolean>();
  isAssignedOpened = false;

  constructor(
          private dialog: MatDialog,
    ){}
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["room"] && changes["room"].currentValue) {
      console.log("Changes Room", changes["room"].currentValue)
      this.room = changes["room"].currentValue;
    }
  }
  
    getRoomType(roomType)
    {
      return UtilsString.getStringOfRoomType(roomType)
    }
  
    hasDescription(description)
    {
      return description && description.length>0
    }
  
    openEditRoom()
      {
        // this._router.navigate(['/app/properties/edit-room',room._id])
        this.dialog.open(UpdateRoomComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{
            room : this.room
          }
        })
      }

  onClose(event) {
    this.isAssignedOpened = false;
    this.onOpenAssignedRoom.emit(this.isAssignedOpened);
  }

  openEditAddLocataire()
  {
    this.isAssignedOpened = true;
    this.onOpenAssignedRoom.emit(this.isAssignedOpened);
  }

  rompreLocation()
    {
      this.dialog.open(ModernContractTerminationModalComponent, {
        width: '100%',
        maxWidth: '900px',
        disableClose: true,
        data:{
          location: this.location,
          tenant: this.locataire,
          room: this.room
        }
      })
    }

    seeContract()
  {
    this.dialog.open(ShowContractComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '100%',
      data:{
        location:this.location
      }
    })
  }
  
    getMoney()
    {
      return Currency.XAF
    }
  
}
