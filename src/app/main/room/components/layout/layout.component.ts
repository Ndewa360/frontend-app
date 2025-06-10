import { Component, EventEmitter, Inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions } from '@ngxs/store';
import { LocataireModel, LocationModel, RoomModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'layout-room',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class LayoutComponent {
  @Input() room:RoomModel;
  @Input() locataire:LocataireModel;
  @Input() location:LocationModel;
  @Input() historyLocationPayments: any[] = [];
  @Output() onOpenAssignedRoom:EventEmitter<boolean> = new EventEmitter<boolean>();

   constructor(
    // private dialogRef: MatDialogRef<LayoutComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    // @Inject(MAT_DIALOG_DATA) public data:{room:RoomModel},
    // private _changeDetectorRef: ChangeDetectorRef,
  ){}

  close(){
    // this.dialogRef.close();
  }

  openAssignedRoom(event) {
    this.onOpenAssignedRoom.emit(event);
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

}
