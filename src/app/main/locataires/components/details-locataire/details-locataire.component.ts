import { Component,Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LocataireModel } from 'src/app/shared/store';
import { UpdateLocataireComponent } from '../update-locataire/update-locataire.component';

@Component({
  selector: 'details-locataire',
  templateUrl: './details-locataire.component.html',
  styleUrls: ['./details-locataire.component.css']
})
export class DetailsLocataireComponent {
  @Input() locataire:LocataireModel;

  constructor(
        private dialog: MatDialog,
  ){}

  openEditLocataire()
  {
    this.dialog.open(UpdateLocataireComponent, {
        viewContainerRef:null,
        disableClose: true,
        role: 'alertdialog',
        width: '100%',
        data:{
          locataire:this.locataire
        }
      })
  }
}
