import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { SouscriptionAction, SouscriptionType } from 'src/app/shared/store';

@Component({
  selector: 'show-billing-contract',
  templateUrl: './show-billing-contract.component.html',
  styleUrls: ['./show-billing-contract.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class ShowBillingContractComponent implements OnInit{

  waittingResponse=false;
  isButtonEnabled = false;

  @ViewChild('refContractBilling', {static: true}) refContractBilling:ElementRef;
  constructor(
    private showBillingContract: MatDialogRef<ShowBillingContractComponent>,
    private _store:Store,
    private _ngxsAction:Actions,
    private _router:Router
  ){}
  
  ngOnInit(): void {
    this._ngxsAction.pipe(ofActionSuccessful(SouscriptionAction.CreateSouscription)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      this._router.navigate([`/app/facturation/plan/facture`])
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(SouscriptionAction.CreateSouscription)).subscribe(
      (value) => {
        this.waittingResponse=false;
      }
    )

    this._ngxsAction.pipe(ofActionErrored(SouscriptionAction.CreateSouscription)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      })  

  }

  onClose() {
    this.showBillingContract.close(false)
  }

  onContractScroll(e) {
    const element = event.target as HTMLElement;

    // Vérifiez si l'utilisateur a atteint le bas de l'élément
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.isButtonEnabled = true; // Activez le bouton
    }
  }

  validConsultation()
  {
    this.waittingResponse=true;
    this._store.dispatch(new SouscriptionAction.CreateSouscription(SouscriptionType.DEFAULT))
  }
}
