import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyModel, PropertyState, RoomState } from 'src/app/shared/store';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { Store } from '@ngxs/store';
import { GaleryPropertyComponent } from '../components/galery-property/galery-property.component';
import { UpdatePropertyComponent } from '../components/update-property/update-property.component';

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

  openEditPhoto(property:PropertyModel,event)
    {
      // this._router.navigate(['/app/properties/edit-room',room._id])
      event.stopPropagation();
      this.dialog.open(GaleryPropertyComponent, { 
        viewContainerRef:null,
        disableClose: true,
        role: 'dialog',
        height: '100%',
        width: '100%',
        data:{
          property
        }
      })
    }

    updateProperty(property,event)
      {
        event.stopPropagation();
        this.dialog.open(UpdatePropertyComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{
            property
          }
        })
      }

}
