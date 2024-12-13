import { Component } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { SouscriptionState, SouscriptionModel } from 'src/app/shared/store';

@Component({
  selector: 'admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  // @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>
  // @Select(SouscriptionState.isEndLoadingData) hasLoading$:Observable<boolean>
  
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
          // path: 'plan-list'
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

  public sectionUtils =  [
    {
      name: 'Compte',
      children: [
        {
          name: 'Utilisateurs',
          path: 'users',
        },
        {
          name: 'Roles'
        },
        {
          name: 'Permissions',
          // path: 'plan-list'
        },
      ]
    }
  ]

  public opened: boolean = false

  constructor() {
  }

  ngOnInit(): void {
    // this.hasLoading$.subscribe((value)=>console.log("HasLoading ",value))
    // this.souscription$.subscribe((value)=>console.log("Souscription ", value))
  }

  onToggle() {
    this.opened = !this.opened
  }
}
