import { Component } from '@angular/core';
import { ShowBillingContractComponent } from '../show-billing-contract/show-billing-contract.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'choise-plan',
  templateUrl: './choise-plan.component.html',
  styleUrls: ['./choise-plan.component.css']
})
export class ChoisePlanComponent {
  constructor(
  private dialog: MatDialog,
  ){}

  showBillingContract()
  {
    this.dialog.open(ShowBillingContractComponent, {
      viewContainerRef:null,
      disableClose: true,
      role:"alertdialog",
      width: '70%',
      height: '98%',
      // data:{
      //   property:this.propertyFound
      // }
    })
  }
}
