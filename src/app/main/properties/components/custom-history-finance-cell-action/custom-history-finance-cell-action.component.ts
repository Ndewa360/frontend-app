import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeletePaymentComponent } from 'src/app/main/location-payment/components/delete-payment/delete-payment.component';
import { UpdatePaymentComponent } from 'src/app/main/location-payment/components/update-payment/update-payment.component';
import { HistoryLocationPaymentModel } from 'src/app/shared/store';

@Component({
  selector: 'custom-history-finance-cell-action',
  templateUrl: './custom-history-finance-cell-action.component.html',
  styleUrls: ['./custom-history-finance-cell-action.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CustomHistoryFinanceCellActionComponent implements ICellRendererAngularComp{

  constructor(private dialog: MatDialog){}
  params: any;
  payementHistory:HistoryLocationPaymentModel 

  agInit(params: any): void {
    this.params = params;
    this.payementHistory = params.data.history;
  }

  refresh(): boolean {
    return false;
  }

  onEdit() {
    this.dialog.open(UpdatePaymentComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        history:this.payementHistory
      }
    })
  }

  onDelete() {
    this.dialog.open(DeletePaymentComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        history:this.payementHistory
      }
    })
  }
}

