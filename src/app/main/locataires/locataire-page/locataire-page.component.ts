import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppTab } from 'src/@youpez';
import { LocataireAction, LocataireModel, LocataireState } from 'src/app/shared/store';

@Component({
  selector: 'locataire-page',
  templateUrl: './locataire-page.component.html',
  styleUrls: ['./locataire-page.component.css'],
})
export class LocatairePageComponent implements OnInit{
  
  public tabs: AppTab[] = []
  title = 'Locataire'
  locataire:LocataireModel=null;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store
  ){}

  ngOnInit(): void {
    let locataireID = this._activatedRoute.snapshot.paramMap.get('locataireID');
    this._store.select(LocataireState.selectStateLocataire(locataireID)).subscribe((locataire)=>{
      if(!locataire) return;
      // {
        // this._store.dispatch(new LocataireAction.FetchLocataire(locataireID));
      //   return;
      // }
      this.locataire = locataire;
      this.title = `Locataire ${locataire.fullName}`
    });
    this.tabs = [
      {
        name: 'Profil',
        url: `/app/locataires/${locataireID}/profil`,
      },
      {
        name: 'Historique',
        url: `/app/locataires/${locataireID}/history`,
      },      
    ]
    // if(!propertyId)  {
    //   this._router.navigateByUrl('/app/properties/list');;
    //   return;
    // }
  }
}
