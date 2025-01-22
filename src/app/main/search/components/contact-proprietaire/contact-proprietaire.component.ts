import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions } from '@ngxs/store';
import { SearchPropertyModel } from 'src/app/shared/store';

@Component({
  selector: 'contact-proprietaire',
  templateUrl: './contact-proprietaire.component.html',
  styleUrls: ['./contact-proprietaire.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class ContactProprietaireComponent {
  public formGroup: FormGroup;
    layout: string = 'horizontal'
    theme: string = 'light'
  
    roomList =[];
    waittingResponse = false;
  
    constructor(
      private dialogRef: MatDialogRef<ContactProprietaireComponent>,
      private router: Router,
      private _store:Store,
      private _ngxsAction:Actions,
      @Inject(MAT_DIALOG_DATA) public data: {room: SearchPropertyModel}
      
    ) { }
  
    ngOnInit(): void {
      console.log("Data found ",this.data) 
    }
  
    onClose() {
      this.dialogRef.close(false)
    }
  
   
  

  
    getRowLayout(num) {
      if (this.layout === 'vertical') {
        return '100%'
      }
      return num + '%'
    }
}
