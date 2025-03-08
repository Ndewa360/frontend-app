import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { AddPropertyComponent } from '../add-property/add-property.component';

@Component({
  selector: 'home-property',
  templateUrl: './home-property.component.html',
  styleUrls: ['./home-property.component.css'],
  encapsulation: ViewEncapsulation.None
  
})
export class HomePropertyComponent {

  private addPropertyDialogRef: MatDialogRef<AddPropertyComponent>;

  constructor(private dialog: MatDialog,private _store:Store) { }

  onCreate() {
      this.addPropertyDialogRef = this.dialog.open(AddPropertyComponent, {
        viewContainerRef:null,
        disableClose: true,
        role: 'alertdialog',
        width: '500px'
      })
    }
}
