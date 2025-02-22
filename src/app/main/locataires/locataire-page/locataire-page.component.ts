import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterEvent, Event } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, combineLatest, filter } from 'rxjs';
import { AppTab } from 'src/@youpez';
import { LocataireAction, LocataireModel, LocataireState, LocationState } from 'src/app/shared/store';
import { HistoryLocationPaymentState } from 'src/app/shared/store/history-payment-location';
import { Location } from '@angular/common';

@Component({
  selector: 'locataire-page',
  templateUrl: './locataire-page.component.html',
  styleUrls: ['./locataire-page.component.css'],
})
export class LocatairePageComponent implements OnInit{
  
  @Select(HistoryLocationPaymentState.selectStateLoading) loadingHistoryPaymentState$:Observable<boolean>;
  @Select(LocationState.selectStateLoading) loadingLocationState$:Observable<boolean>;
  @Select(LocataireState.selectStateLoading) loadingLocataireState$:Observable<boolean>;
  loading = true;
  isProfilPage = true;
  


  public tabs: AppTab[] = []
  title = 'Locataire'
  locataire:LocataireModel=null;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private location: Location
  ){}

  ngOnInit(): void {
    // this._router.events.pipe(
    //   filter((e: Event | RouterEvent): e is RouterEvent => e instanceof RouterEvent)
    // ).subscribe((event)=>{
    //   console.log("event ", event.url)
    //   if(event.url.indexOf("history")>-1) this.isProfilPage=false
    //   else this.isProfilPage=true
    // })
    // console.log("router ",this._router.url)
    combineLatest([this.loadingHistoryPaymentState$,this.loadingLocationState$,this.loadingLocataireState$]).subscribe(([loadingHistoryPaymentState, loadingLocationState,loadingLocataireState])=>{
      this.loading = loadingHistoryPaymentState || loadingLocationState || loadingLocataireState;
    })

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

  goBack() {
    this.location.back();
  }
}
