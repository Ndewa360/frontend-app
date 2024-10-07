import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyModel, PropertyState, RoomState } from 'src/app/shared/store';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-list-property',
  templateUrl: './list-property.component.html',
  styleUrls: ['./list-property.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ListPropertyComponent implements OnInit {


  @Select(PropertyState.setlectStateProperties) properties$:Observable<PropertyModel[]>;
  @Select(PropertyState.selectStateInitLoading) initLoading$:Observable<string>;

  private addPropertyDialogRef: MatDialogRef<AddPropertyComponent>;

  constructor(private dialog: MatDialog,private _store:Store) { }

  ngOnInit(): void {

  }

  onCreate() {
    this.addPropertyDialogRef = this.dialog.open(AddPropertyComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px'
    })
  }

  getNumberOfRoom(propertyID)
  {
    return this._store.select(RoomState.selectStateNumberOfRoomByPropertyId(propertyID))
  }
}
