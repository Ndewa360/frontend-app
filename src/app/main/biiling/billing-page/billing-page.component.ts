import { Component } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { SouscriptionModel, SouscriptionState } from 'src/app/shared/store';

@Component({
  selector: 'billing-page',
  templateUrl: './billing-page.component.html',
  styleUrls: ['./billing-page.component.css'],
})
export class BillingPageComponent {
  @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>
  @Select(SouscriptionState.isEndLoadingData) hasLoading$:Observable<boolean>
  public sections =  [
    {
      name: 'Facturation & Paiement',
      children: [
        {
          name: 'Factures',
          path: 'facture',
          selected: true,
        },
        {
          name: 'Paiement'
        },
        {
          name: 'Abonements',
          path: 'plan-list'
        },
      ]
    },
    {
      name: 'Methode de paiement',
      children: [
        {
          name: 'Methode de paiement'
        },
        {
          name: 'Historique'
        }
      ]
    },
  ]

  public opened: boolean = false

  constructor() {
  }

  ngOnInit(): void {
    this.hasLoading$.subscribe((value)=>console.log("HasLoading ",value))
    this.souscription$.subscribe((value)=>console.log("Souscription ", value))
  }

  onToggle() {
    this.opened = !this.opened
  }
}
