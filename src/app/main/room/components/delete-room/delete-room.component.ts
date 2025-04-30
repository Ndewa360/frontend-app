import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { RoomAction, RoomModel } from 'src/app/shared/store';

@Component({
  selector: 'delete-room',
  templateUrl: './delete-room.component.html',
  styleUrls: ['./delete-room.component.css'],
  encapsulation:ViewEncapsulation.None
  
})
export class DeleteRoomComponent {
  waittingResponse = false;

  constructor(
      private dialogRef: MatDialogRef<DeleteRoomComponent>,
      private router: Router,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data: {room: RoomModel}
    
  ) { }

  ngOnInit(): void 
    {
      this._ngxsAction.pipe(ofActionSuccessful(RoomAction.DeleteRoom)).subscribe((value)=>{
              // Navigate to the parent
        this.waittingResponse=false;
        this.onClose()
        }
      );
      this._ngxsAction.pipe(ofActionCompleted(RoomAction.DeleteRoom)).subscribe(
        (value) => {
          this.waittingResponse=false;        
        }
      )
  
      this._ngxsAction.pipe(ofActionErrored(RoomAction.DeleteRoom)).subscribe(
        (value) => {
          this.waittingResponse=false;
        })
    }
  
    onClose() {
      this.dialogRef.close(false)
    }
  
    onSubmit() {
      this.waittingResponse=true;
      this._store.dispatch(new RoomAction.DeleteRoom(this.data.room._id));
    }
  
}
